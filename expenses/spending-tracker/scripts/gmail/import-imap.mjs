import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

const ROOT = process.cwd();
const SCRIPT_DIR = path.join(ROOT, "scripts", "gmail");
const LOCAL_CONFIG_PATH = path.join(SCRIPT_DIR, "imap.local.json");

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadConfig() {
  if (!await pathExists(LOCAL_CONFIG_PATH)) {
    throw new Error(`Missing IMAP config: ${LOCAL_CONFIG_PATH}. Copy imap.example.json to imap.local.json and fill in your Gmail app password.`);
  }
  return JSON.parse(await fs.readFile(LOCAL_CONFIG_PATH, "utf8"));
}

function normalizeWhitespace(text = "") {
  return text.replace(/\s+/g, " ").trim();
}

function normalizeMerchant(text) {
  return normalizeWhitespace(text)
    .replace(/\b(approved|declined|purchase|transaction|alert|notification)\b/gi, "")
    .replace(/[^a-z0-9$&'. -]/gi, "")
    .trim()
    .toUpperCase();
}

function parseAmount(text) {
  const matches = [...text.matchAll(/(?:CA\$|CAD|\$)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+(?:\.[0-9]{2}))/gi)];
  if (matches.length === 0) return null;
  return Number(matches[0][1].replace(/,/g, ""));
}

function parseAccountHint(text) {
  return text.match(/(?:ending in|ending|card|account|acct)[^\d]*(\d{4})/i)?.[1] || null;
}

function parseMerchant(subject, body) {
  const text = normalizeWhitespace(body);
  const labeled = text.match(/(?:merchant|store|vendor|retailer)\s*[:\-]\s*([^.$|]{3,80})/i)?.[1];
  if (labeled) return normalizeWhitespace(labeled);

  const atMerchant = text.match(/\bat\s+([A-Z0-9][A-Za-z0-9 &'#./-]{2,60})(?:\s+for|\s+in the amount|\s+on|\.)/);
  if (atMerchant) return normalizeWhitespace(atMerchant[1]);

  const subjectMerchant = subject
    .replace(/transaction|purchase|alert|notification|approved|cibc/gi, "")
    .replace(/\$[0-9,.]+/g, "")
    .trim();
  return normalizeWhitespace(subjectMerchant || "Unknown merchant");
}

function classifyPending(parsed) {
  const merchant = parsed.merchant.toLowerCase();
  if (merchant.includes("ai camera merchant")) return { cat: "School/Project Expenses", projCat: "Parts" };
  if (merchant.includes("amazon")) return { cat: "Needs Review", reason: "Amazon needs order cross-reference" };
  if (merchant.includes("macewen") || merchant.includes("petro") || merchant.includes("esso")) return { cat: "Gas" };
  if (merchant.includes("apple.com/bill")) return { cat: "Subscriptions" };
  return { cat: "Needs Review" };
}

function toCandidate(message, parsed) {
  const subject = parsed.subject || "";
  const body = normalizeWhitespace(parsed.text || parsed.html?.replace(/<[^>]*>/g, " ") || "");
  const combined = `${subject} ${body}`;
  const amount = parseAmount(combined);
  const merchant = parseMerchant(subject, body);
  const date = (parsed.date || message.envelope?.date || new Date()).toISOString().slice(0, 10);
  const accountHint = parseAccountHint(combined);
  const classification = classifyPending({ merchant, amount });
  const dedupeKey = [
    date,
    amount ?? "unknown",
    normalizeMerchant(merchant),
    accountHint || "no-account",
  ].join("|");

  return {
    source: "gmail-imap",
    gmailUid: message.uid,
    date,
    desc: merchant,
    amount,
    accountHint,
    from: parsed.from?.text || "",
    subject,
    dedupeKey,
    confidence: amount && merchant !== "Unknown merchant" ? "medium" : "low",
    needsReview: classification.cat === "Needs Review" || !amount,
    ...classification,
  };
}

function buildSearchQuery(config) {
  const sinceDays = config.search?.sinceDays || 90;
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
  return { since };
}

function matchesTerms(parsed, terms) {
  if (!terms?.length) return true;
  const haystack = `${parsed.subject || ""} ${parsed.from?.text || ""} ${parsed.text || ""}`.toLowerCase();
  return terms.some(term => haystack.includes(term.toLowerCase()));
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const config = await loadConfig();
  const client = new ImapFlow({
    host: config.host || "imap.gmail.com",
    port: config.port || 993,
    secure: config.secure !== false,
    auth: {
      user: config.user,
      pass: config.appPassword,
    },
    logger: false,
  });

  await client.connect();
  try {
    await client.mailboxOpen(config.mailbox || "INBOX");
    if (args.has("--test")) {
      console.log(`Connected to ${config.user}. Mailbox ${config.mailbox || "INBOX"} has ${client.mailbox.exists} messages.`);
      return;
    }

    const query = buildSearchQuery(config);
    const uids = await client.search(query, { uid: true });
    const newestFirst = [...uids].sort((a, b) => b - a).slice(0, config.maxMessages || 250);
    const rawCandidates = [];

    for await (const message of client.fetch(newestFirst, { uid: true, envelope: true, source: true }, { uid: true })) {
      const parsed = await simpleParser(message.source);
      if (!matchesTerms(parsed, config.search?.terms)) continue;
      rawCandidates.push(toCandidate(message, parsed));
    }

    const byKey = new Map();
    for (const candidate of rawCandidates) {
      const existing = byKey.get(candidate.dedupeKey);
      if (!existing) {
        byKey.set(candidate.dedupeKey, { ...candidate, duplicateUids: [] });
      } else {
        existing.duplicateUids.push(candidate.gmailUid);
      }
    }

    const output = {
      generatedAt: new Date().toISOString(),
      mailbox: config.mailbox || "INBOX",
      totalEmailsMatched: rawCandidates.length,
      uniqueTransactions: byKey.size,
      transactions: [...byKey.values()].sort((a, b) => a.date.localeCompare(b.date)),
    };

    const outputPath = path.resolve(ROOT, config.outputPath || "data/imports/gmail-pending.local.json");
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
    console.log(`Wrote ${output.uniqueTransactions} pending transaction(s) to ${outputPath}`);
  } finally {
    await client.logout();
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
