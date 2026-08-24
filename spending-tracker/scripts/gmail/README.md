# Gmail Connector: Permanent Free Method

This connector reads Gmail purchase-alert emails over IMAP and writes a local pending-import file. It does not modify tracker data by itself.

This does not use Google Cloud, does not require a Cloud free trial, and does not require billing.

## Gmail Setup

1. Turn on 2-Step Verification for your Google account.
2. Create a Gmail App Password.
3. In Gmail settings, make sure IMAP is enabled.
4. Copy `scripts/gmail/imap.example.json` to `scripts/gmail/imap.local.json`.
5. Put your Gmail address and 16-character app password in `imap.local.json`.

Google's own Gmail Help explains that app passwords are 16-digit passcodes and require 2-Step Verification:
https://support.google.com/mail/answer/185833

## Test The Connection

```bash
npm run gmail:test
```

## Import Pending Transactions

```bash
npm run gmail:import
```

Output goes to:

```txt
data/imports/gmail-pending.local.json
```

That file is ignored by git because it can contain private email-derived transaction data.

## How It Works

- Connects to Gmail IMAP at `imap.gmail.com:993`.
- Searches recent messages using the terms in `imap.local.json`.
- Parses likely purchase alerts into pending transaction candidates.
- Deduplicates duplicate alert emails using date, amount, merchant, and account/card hint.
- Marks low-confidence rows for review instead of auto-adding them to the tracker.
