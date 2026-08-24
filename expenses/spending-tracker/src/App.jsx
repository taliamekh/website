import { useState } from "react";

// ========== ALL SPENDING TRANSACTIONS ==========
/*
 * ============================================================
 *  HOW TO EDIT THIS FILE (for non-technical users)
 * ============================================================
 *
 *  ADDING A NEW TRANSACTION:
 *    Copy one of the lines below and change the values:
 *    { date: "YYYY-MM-DD", desc: "Store name", amount: 12.34, cat: "Category Name", src: "visa" },
 *
 *    - date: Use format "2026-04-15" (year-month-day)
 *    - desc: Whatever you want to call it
 *    - amount: The dollar amount (use negative for refunds, e.g. -25.00)
 *    - cat: Must match one of the categories listed below in CAT_CONFIG
 *    - src: Either "visa" or "debit"
 *    - gift: true  ← add this if it's a gift (won't count in totals)
 *
 *  AVAILABLE CATEGORIES:
 *    "Gas", "Food & Dining", "Groceries", "School/Project Expenses",
 *    "Beauty", "Home & Furnishing", "Health & Pharmacy",
 *    "Retail & Shopping", "Transportation", "Car Maintenance",
 *    "Entertainment", "Subscriptions", "Fees & Interest",
 *    "Toronto Trip", "Savings & Investing"
 *
 *  REMOVING A TRANSACTION:
 *    Delete the entire line (from { to },)
 *
 *  CHANGING A CATEGORY NAME:
 *    Search and replace the old name with the new name everywhere
 *    Also update it in the CAT_CONFIG section below
 *
 * ============================================================
 */

const ALL_TRANSACTIONS = [
  // === DECEMBER 2025 ===
  { date: "2025-12-03", desc: "Porkbun.com (domain)", amount: 12.86, cat: "Subscriptions", src: "visa" },
  { date: "2025-12-03", desc: "Amazon: BIC Wite-Out Correction Tape", amount: 7.85, cat: "School/Project Expenses", src: "visa", projCat: "Supplies" },
  { date: "2025-12-04", desc: "Amazon: HARDELL Mini Cordless Rotary Tool Kit", amount: 43.72, cat: "School/Project Expenses", src: "visa", projCat: "Tools" },
  { date: "2025-12-04", desc: "Amazon: Botanic Hearth Rosemary Oil", amount: 14.68, cat: "Beauty", src: "visa" },
  { date: "2025-12-05", desc: "Amazon.ca Prime Membership", amount: 5.64, cat: "Subscriptions", src: "visa" },
  { date: "2025-12-06", desc: "Petro-Canada, Ottawa", amount: 20.00, cat: "Gas", src: "visa" },
  { date: "2025-12-08", desc: "Amazon: Crayola 12 Erasable Coloured Pencils", amount: 5.53, cat: "School/Project Expenses", src: "visa", projCat: "Supplies" },
  { date: "2025-12-09", desc: "OC Transpo (Ottawa–Carleton)", amount: 12.00, cat: "Transportation", src: "visa" },
  { date: "2025-12-10", desc: "Richmond IDA Pharmacy", amount: 7.90, cat: "Health & Pharmacy", src: "visa" },
  { date: "2025-12-10", desc: "Richmond IDA Pharmacy", amount: 8.10, cat: "Health & Pharmacy", src: "visa" },
  { date: "2025-12-11", desc: "Amazon: KAIWEETS Digital Multimeter TRMS 6000", amount: 40.78, cat: "School/Project Expenses", src: "visa", projCat: "Electronics" },
  { date: "2025-12-11", desc: "Amazon: Full Face Respirator Gas Mask 6800", amount: 40.67, cat: "School/Project Expenses", src: "visa", projCat: "Safety" },
  { date: "2025-12-12", desc: "Amazon: Gritin Rechargeable Book Light", amount: 15.81, cat: "School/Project Expenses", src: "visa", projCat: "Other" },
  { date: "2025-12-12", desc: "Amazon: Lazy Glasses Prism Spectacles", amount: 22.59, cat: "School/Project Expenses", src: "visa", projCat: "Other" },
  { date: "2025-12-14", desc: "Presotea Barrhaven", amount: 21.50, cat: "Food & Dining", src: "visa" },
  { date: "2025-12-14", desc: "Loblaws 1035 (return)", amount: -45.65, cat: "Groceries", src: "visa" },
  { date: "2025-12-14", desc: "Esso Circle K, Ottawa", amount: 45.54, cat: "Gas", src: "visa" },
  { date: "2025-12-17", desc: "Amazon: Ear Plugs for Sleeping 45dB (returned)", amount: 55.36, cat: "School/Project Expenses", src: "visa", projCat: "Other" },
  { date: "2025-12-17", desc: "Amazon: NYX Epic Ink Liner (gift for Suhani)", amount: 14.68, cat: "Beauty", src: "visa" },
  { date: "2025-12-17", desc: "Amazon: e.l.f. Lip Liner (gift for Suhani)", amount: 4.17, cat: "Beauty", src: "visa" },
  { date: "2025-12-18", desc: "Tim Hortons, Carleton", amount: 9.02, cat: "Food & Dining", src: "visa" },
  { date: "2025-12-19", desc: "Thai Express, Saint-Laurent", amount: 18.07, cat: "Food & Dining", src: "visa" },
  { date: "2025-12-20", desc: "Presotea Barrhaven", amount: 10.16, cat: "Food & Dining", src: "visa" },
  { date: "2025-12-20", desc: "OC Transpo (Ottawa–Carleton)", amount: 6.00, cat: "Transportation", src: "visa" },
  { date: "2025-12-20", desc: "Winners 437, Ottawa", amount: 6.77, cat: "Retail & Shopping", src: "visa" },
  { date: "2025-12-20", desc: "Chung Chun, Ottawa", amount: 8.46, cat: "Food & Dining", src: "visa" },
  { date: "2025-12-20", desc: "Farm Boy #78, Ottawa", amount: 6.72, cat: "Groceries", src: "visa" },
  { date: "2025-12-26", desc: "Amazon: Dual Monitor Mount + Shampoo", amount: 69.77, cat: "Home & Furnishing", src: "visa" },
  { date: "2025-12-26", desc: "Amazon: Rimmel Eye Definer", amount: 6.99, cat: "Beauty", src: "visa" },
  { date: "2025-12-26", desc: "Amazon: L'Oréal Hair Serum", amount: 14.10, cat: "Beauty", src: "visa" },
  { date: "2025-12-26", desc: "Amazon: Hair Cutting Scissors", amount: 9.86, cat: "Beauty", src: "visa" },
  { date: "2025-12-26", desc: "IKEA Ottawa", amount: 10.14, cat: "Home & Furnishing", src: "visa" },
  { date: "2025-12-26", desc: "IKEA Ottawa", amount: 9.03, cat: "Home & Furnishing", src: "visa" },
  { date: "2025-12-26", desc: "Staples #225 (return)", amount: -22.59, cat: "Retail & Shopping", src: "visa" },
  { date: "2025-12-26", desc: "Shoppers Drug Mart 643", amount: 20.09, cat: "Health & Pharmacy", src: "visa" },
  { date: "2025-12-27", desc: "Amazon: Ear Plugs refund", amount: -55.36, cat: "School/Project Expenses", src: "visa", projCat: "Other" },
  { date: "2025-12-27", desc: "Amazon: Silica Desiccant Beads + Mini Hygrometer", amount: 10.71, cat: "School/Project Expenses", src: "visa", projCat: "Supplies" },
  { date: "2025-12-27", desc: "MacEwen, Richmond", amount: 39.72, cat: "Gas", src: "visa" },
  { date: "2025-12-28", desc: "Sephora Bayshore (Christmas gift)", amount: 253.40, cat: "Beauty", src: "visa", gift: true },
  { date: "2025-12-30", desc: "Amazon: NYX Lip Gloss Mocha Me Wet", amount: 19.18, cat: "Beauty", src: "visa" },
  { date: "2025-12-30", desc: "OC Transpo Confederation–Rideau", amount: 4.00, cat: "Transportation", src: "visa" },
  { date: "2025-12-30", desc: "Lovisa, Ottawa", amount: 11.30, cat: "Retail & Shopping", src: "visa" },
  { date: "2025-12-30", desc: "Booster Juice #59, Ottawa", amount: 9.48, cat: "Food & Dining", src: "visa" },
  // === JANUARY 2026 ===
  { date: "2026-01-02", desc: "IKEA Ottawa", amount: 192.98, cat: "Home & Furnishing", src: "visa" },
  { date: "2026-01-02", desc: "Klimat, Ottawa", amount: 22.60, cat: "Entertainment", src: "visa" },
  { date: "2026-01-05", desc: "Amazon.ca Prime Membership", amount: 5.64, cat: "Subscriptions", src: "visa" },
  { date: "2026-01-06", desc: "Amazon: ELEGOO ESP32 Boards + Hookup Wire + Potentiometers", amount: 67.57, cat: "School/Project Expenses", src: "visa", projCat: "Electronics" },
  { date: "2026-01-06", desc: "Amazon: MG90S Servo Motors + Retractable Badge Reels", amount: 26.54, cat: "School/Project Expenses", src: "visa", projCat: "Electronics" },
  { date: "2026-01-06", desc: "MacEwen, Richmond", amount: 33.75, cat: "Gas", src: "visa" },
  { date: "2026-01-06", desc: "SHEIN (PayPal)", amount: 64.36, cat: "Retail & Shopping", src: "visa" },
  { date: "2026-01-07", desc: "Amazon: TUOFENG 22 AWG Hookup Wires 6 Colors", amount: 15.02, cat: "School/Project Expenses", src: "visa", projCat: "Electronics" },
  { date: "2026-01-08", desc: "BeaverTails, Ottawa", amount: 8.99, cat: "Food & Dining", src: "visa" },
  { date: "2026-01-09", desc: "King's YIG, Richmond #8", amount: 23.58, cat: "Groceries", src: "visa" },
  { date: "2026-01-09", desc: "Richmond IDA Pharmacy", amount: 24.73, cat: "Health & Pharmacy", src: "visa" },
  { date: "2026-01-12", desc: "Amazon: Aquaphor Healing Balm Stick", amount: 13.53, cat: "Beauty", src: "visa" },
  { date: "2026-01-12", desc: "Amazon: OidoZac Laminator Machine 11-in-1", amount: 50.84, cat: "School/Project Expenses", src: "visa", projCat: "Tools" },
  { date: "2026-01-13", desc: "Amazon: Laminator (duplicate – returned)", amount: 50.84, cat: "School/Project Expenses", src: "visa", projCat: "Tools" },
  { date: "2026-01-13", desc: "Amazon: Miuzei MG90S Servo Motors 10-pack", amount: 42.93, cat: "School/Project Expenses", src: "visa", projCat: "Electronics" },
  { date: "2026-01-15", desc: "Amazon: d'alba White Truffle Spray Serum", amount: 24.86, cat: "Beauty", src: "visa" },
  { date: "2026-01-16", desc: "Amazon: Preciva Crimping Tool + 1050Pcs JST Connectors", amount: 48.58, cat: "School/Project Expenses", src: "visa", projCat: "Electronics" },
  { date: "2026-01-17", desc: "Dollarama #1179, Nepean", amount: 15.54, cat: "Retail & Shopping", src: "visa" },
  { date: "2026-01-17", desc: "Mobil Gas Station, Richmond", amount: 30.73, cat: "Gas", src: "visa" },
  { date: "2026-01-20", desc: "MacEwen, Richmond", amount: 43.12, cat: "Gas", src: "visa" },
  { date: "2026-01-23", desc: "Amazon: EUDAX 5Pcs Mini Generator Motors 3V-12V DC", amount: 24.85, cat: "School/Project Expenses", src: "visa", projCat: "Electronics" },
  { date: "2026-01-28", desc: "Sephora Bayshore (return)", amount: -73.45, cat: "Beauty", src: "visa" },
  // === FEBRUARY 2026 ===
  { date: "2026-02-04", desc: "Amazon: Rimmel London Lip Liner", amount: 7.90, cat: "Beauty", src: "visa" },
  { date: "2026-02-05", desc: "Amazon: WAFLOO Cordless Water Flosser", amount: 33.89, cat: "Health & Pharmacy", src: "visa" },
  { date: "2026-02-05", desc: "Amazon.ca Prime Membership", amount: 5.64, cat: "Subscriptions", src: "visa" },
  { date: "2026-02-06", desc: "MacEwen, Richmond", amount: 20.37, cat: "Gas", src: "visa" },
  { date: "2026-02-09", desc: "Amazon: Bracelets + NYX Lip Gloss + Cardstock", amount: 60.45, cat: "Beauty", src: "visa" },
  { date: "2026-02-09", desc: "Amazon: Women Shawls/Wraps (return pending)", amount: 19.99, cat: "Beauty", src: "visa" },
  { date: "2026-02-09", desc: "MacEwen Fallowfield, Ottawa", amount: 21.19, cat: "Gas", src: "visa" },
  { date: "2026-02-10", desc: "Dollarama #1513, Richmond", amount: 30.45, cat: "Retail & Shopping", src: "visa" },
  { date: "2026-02-11", desc: "Returned Payment Fee (Visa)", amount: 42.50, cat: "Fees & Interest", src: "visa" },
  { date: "2026-02-11", desc: "Carleton Food Court", amount: 31.64, cat: "Food & Dining", src: "visa" },
  { date: "2026-02-12", desc: "Amazon: 72 PCS Sewing Thread Assortment (return pending)", amount: 29.14, cat: "School/Project Expenses", src: "visa", projCat: "Sewing" },
  { date: "2026-02-12", desc: "Amazon: Laminator refund", amount: -50.84, cat: "School/Project Expenses", src: "visa", projCat: "Tools" },
  { date: "2026-02-12", desc: "Amazon: Gütermann 26pc Sew-All Thread Set", amount: 45.20, cat: "School/Project Expenses", src: "visa", projCat: "Sewing" },
  { date: "2026-02-12", desc: "Walmart Supercenter #3638, Nepean", amount: 28.68, cat: "Groceries", src: "visa" },
  { date: "2026-02-13", desc: "Walmart Supercenter #1200, Ottawa", amount: 26.62, cat: "Groceries", src: "visa" },
  { date: "2026-02-14", desc: "Petro-Canada, Nepean", amount: 26.73, cat: "Gas", src: "visa" },
  { date: "2026-02-14", desc: "Klimat Cafe 2.0, Ottawa", amount: 5.65, cat: "Food & Dining", src: "visa" },
  { date: "2026-02-18", desc: "Interest – Regular Purchases", amount: 7.90, cat: "Fees & Interest", src: "visa" },
  { date: "2026-02-18", desc: "Richmond IDA Pharmacy", amount: 184.26, cat: "Health & Pharmacy", src: "visa" },
  { date: "2026-02-19", desc: "Amazon: La Roche-Posay Sunscreen SPF 50", amount: 38.65, cat: "Beauty", src: "visa" },
  { date: "2026-02-19", desc: "Sephora (PayPal)", amount: 67.24, cat: "Beauty", src: "visa" },
  { date: "2026-02-19", desc: "Sephora (PayPal)", amount: 59.89, cat: "Beauty", src: "visa" },
  { date: "2026-02-20", desc: "Petro-Canada, Nepean", amount: 25.00, cat: "Gas", src: "visa" },
  { date: "2026-02-20", desc: "Dollarama #1234, Nepean", amount: 15.91, cat: "Retail & Shopping", src: "visa" },
  { date: "2026-02-22", desc: "Tim Hortons, Carleton", amount: 12.40, cat: "Food & Dining", src: "visa" },
  { date: "2026-02-25", desc: "Tim Hortons, Carleton", amount: 14.67, cat: "Food & Dining", src: "visa" },
  // === MARCH 2026 ===
  { date: "2026-03-02", desc: "MacEwen Fallowfield, Ottawa", amount: 21.49, cat: "Gas", src: "visa" },
  { date: "2026-03-05", desc: "Amazon.ca Prime Membership", amount: 5.64, cat: "Subscriptions", src: "visa" },
  { date: "2026-03-05", desc: "Tim Hortons, Carleton", amount: 9.02, cat: "Food & Dining", src: "visa" },
  { date: "2026-03-06", desc: "Carleton Oasis/Heych", amount: 14.13, cat: "Food & Dining", src: "visa" },
  { date: "2026-03-07", desc: "Orbit Culture Tickets", amount: 52.65, cat: "Entertainment", src: "visa" },
  { date: "2026-03-07", desc: "Drummond's Gas, Bronson", amount: 25.58, cat: "Gas", src: "visa" },
  { date: "2026-03-09", desc: "Busbud (bus to Toronto)", amount: 84.53, cat: "Toronto Trip", src: "visa", tripCat: "Transit" },
  { date: "2026-03-09", desc: "Tim Hortons #2528", amount: 8.22, cat: "Toronto Trip", src: "visa", tripCat: "Food & Drinks" },
  { date: "2026-03-11", desc: "Amazon: Metric Screw Set → Kai (project)", amount: 27.11, cat: "Toronto Trip", src: "visa", tripCat: "Parts & Supplies" },
  { date: "2026-03-11", desc: "Amazon: Screwdriver Set + DC Connectors + Power Supply → Kai", amount: 68.62, cat: "Toronto Trip", src: "visa", tripCat: "Parts & Supplies" },
  { date: "2026-03-12", desc: "Amazon: JST Connectors + MG996R Servos → Kai", amount: 67.78, cat: "Toronto Trip", src: "visa", tripCat: "Parts & Supplies" },
  { date: "2026-03-12", desc: "PayPal – Cults (3D print files)", amount: 11.00, cat: "Toronto Trip", src: "visa", tripCat: "Parts & Supplies" },
  { date: "2026-03-12", desc: "Co-On Union Station, Toronto", amount: 25.17, cat: "Toronto Trip", src: "visa", tripCat: "Shopping" },
  { date: "2026-03-12", desc: "Ministry of Coffee, Ottawa", amount: 14.69, cat: "Toronto Trip", src: "visa", tripCat: "Food & Drinks" },
  { date: "2026-03-12", desc: "Farm Boy #44, Toronto", amount: 13.07, cat: "Toronto Trip", src: "visa", tripCat: "Food & Drinks" },
  { date: "2026-03-12", desc: "Mama Lee's Korean Kitchen, Toronto", amount: 19.15, cat: "Toronto Trip", src: "visa", tripCat: "Food & Drinks" },
  { date: "2026-03-12", desc: "Presto Union Station, Toronto", amount: 3.35, cat: "Toronto Trip", src: "visa", tripCat: "Transit" },
  { date: "2026-03-14", desc: "Pizza Fresca, Toronto", amount: 13.56, cat: "Toronto Trip", src: "visa", tripCat: "Food & Drinks" },
  { date: "2026-03-14", desc: "Matcha Matcha, Toronto", amount: 8.81, cat: "Toronto Trip", src: "visa", tripCat: "Food & Drinks" },
  { date: "2026-03-14", desc: "Fruiteao, Toronto", amount: 10.72, cat: "Toronto Trip", src: "visa", tripCat: "Food & Drinks" },
  { date: "2026-03-16", desc: "Hi Bowl, Richmond BC", amount: 15.52, cat: "Toronto Trip", src: "visa", tripCat: "Shopping" },
  { date: "2026-03-16", desc: "Umbrella Burger, Ottawa", amount: 19.78, cat: "Toronto Trip", src: "visa", tripCat: "Food & Drinks" },
  { date: "2026-03-18", desc: "Amazon: Bambaw Safety Razor Blades 60ct", amount: 15.81, cat: "Beauty", src: "visa" },
  { date: "2026-03-18", desc: "Drip House Cafe, Ottawa", amount: 7.85, cat: "Toronto Trip", src: "visa", tripCat: "Food & Drinks" },
  { date: "2026-04-10", desc: "Kai Song reimbursement (project parts)", amount: -60.00, cat: "Toronto Trip", src: "debit", tripCat: "Parts & Supplies" },
  { date: "2026-04-10", desc: "Kai Song (hackathon winnings)", amount: -37.00, cat: "Toronto Trip", src: "debit", tripCat: "Winnings" },
  { date: "2026-03-18", desc: "Interest – Regular Purchases", amount: 4.07, cat: "Fees & Interest", src: "visa" },
  { date: "2026-03-19", desc: "UberEats, Toronto", amount: 19.04, cat: "Food & Dining", src: "visa" },
  { date: "2026-03-20", desc: "Chick-fil-A Rideau Centre, Ottawa", amount: 15.47, cat: "Food & Dining", src: "visa" },
  { date: "2026-03-21", desc: "Uniqlo Rideau Centre, Ottawa", amount: 56.39, cat: "Retail & Shopping", src: "visa" },
  { date: "2026-03-21", desc: "Drummond's Gas, Bronson", amount: 31.14, cat: "Gas", src: "visa" },
  { date: "2026-03-27", desc: "Coca-Cola, Ottawa", amount: 3.25, cat: "Food & Dining", src: "visa" },
  { date: "2026-03-27", desc: "Walmart Supercenter #3066, Ottawa", amount: 14.68, cat: "Groceries", src: "visa" },
  { date: "2026-03-27", desc: "Mike's Place, Ottawa", amount: 14.67, cat: "Food & Dining", src: "visa" },
  { date: "2026-03-27", desc: "Amazon: NYX Lip Gloss Hydra-Honey", amount: 15.58, cat: "Beauty", src: "visa" },
  { date: "2026-03-31", desc: "MacEwen Fallowfield, Ottawa", amount: 21.70, cat: "Gas", src: "visa" },
  { date: "2026-03-31", desc: "Undergrounds, Ottawa", amount: 17.06, cat: "Food & Dining", src: "visa" },
  // === APRIL 2026 ===
  { date: "2026-04-02", desc: "Amazon: Headlight Bulbs + Air Filters + Cabin Filter + Microfiber Cloths + Gloves (Honda Civic)", amount: 142.28, cat: "Car Maintenance", src: "visa" },
  { date: "2026-04-02", desc: "Amazon: CERAKOTE Headlight Kit + Rain-X (car)", amount: 43.98, cat: "Car Maintenance", src: "visa" },
  { date: "2026-04-02", desc: "Amazon: Rimmel Lip Liner x2", amount: 11.24, cat: "Beauty", src: "visa" },
  { date: "2026-04-02", desc: "Uber, Toronto", amount: 12.59, cat: "Transportation", src: "visa" },
  { date: "2026-04-02", desc: "Uber, Toronto", amount: 2.60, cat: "Transportation", src: "visa" },
  { date: "2026-04-03", desc: "Uber, Toronto", amount: 9.72, cat: "Transportation", src: "visa" },
  { date: "2026-04-05", desc: "Umbrella Burger, Ottawa", amount: 16.84, cat: "Food & Dining", src: "visa" },
  { date: "2026-04-05", desc: "Amazon.ca Prime Membership", amount: 5.64, cat: "Subscriptions", src: "visa" },
  { date: "2026-04-07", desc: "Carleton Food Court", amount: 15.82, cat: "Food & Dining", src: "visa" },
  { date: "2026-04-08", desc: "Busbud, Montreal", amount: 73.15, cat: "Transportation", src: "visa" },
  { date: "2026-04-08", desc: "Claude.AI Subscription (Anthropic)", amount: 31.64, cat: "Subscriptions", src: "visa" },
  { date: "2026-04-08", desc: "Richmond IDA Pharmacy", amount: 14.48, cat: "Health & Pharmacy", src: "visa" },
  { date: "2026-04-09", desc: "Amazon: Basics Multipurpose Printer Paper 500 Sheets", amount: 15.81, cat: "School/Project Expenses", src: "visa", projCat: "Supplies" },
  { date: "2026-04-10", desc: "PayPal – Cloudflare", amount: 17.07, cat: "Subscriptions", src: "visa" },
  { date: "2026-04-10", desc: "Returned Payment Fee (Visa)", amount: 42.50, cat: "Fees & Interest", src: "visa" },
  { date: "2026-04-13", desc: "Pizza Pizza #225, Ottawa", amount: 12.29, cat: "Food & Dining", src: "visa" },
  { date: "2026-04-14", desc: "MacEwen, Richmond", amount: 28.53, cat: "Gas", src: "visa" },
  { date: "2026-04-14", desc: "Stendhal, Nepean", amount: 123.45, cat: "Retail & Shopping", src: "visa" },
  // === DEBIT ACCOUNT ===
  { date: "2025-11-05", desc: "Apple.com/Bill", amount: 4.51, cat: "Subscriptions", src: "debit" },
  { date: "2025-12-01", desc: "CIBC Securities (investment)", amount: 25.00, cat: "Savings & Investing", src: "debit" },
  { date: "2025-12-05", desc: "Apple.com/Bill", amount: 4.51, cat: "Subscriptions", src: "debit" },
  { date: "2025-12-31", desc: "CIBC Securities (investment)", amount: 25.00, cat: "Savings & Investing", src: "debit" },
  { date: "2026-01-02", desc: "Costco Wholesale", amount: 1.58, cat: "Groceries", src: "debit" },
  { date: "2026-01-05", desc: "Apple.com/Bill", amount: 4.51, cat: "Subscriptions", src: "debit" },
  { date: "2026-01-19", desc: "Pizza Pizza #23", amount: 22.59, cat: "Food & Dining", src: "debit" },
  { date: "2026-02-02", desc: "CIBC Securities (investment)", amount: 25.00, cat: "Savings & Investing", src: "debit" },
  { date: "2026-02-05", desc: "Apple.com/Bill", amount: 4.51, cat: "Subscriptions", src: "debit" },
  { date: "2026-02-09", desc: "NSF Charge (debit acct)", amount: 45.00, cat: "Fees & Interest", src: "debit" },
  { date: "2026-03-02", desc: "CIBC Securities (investment)", amount: 25.00, cat: "Savings & Investing", src: "debit" },
  { date: "2026-03-05", desc: "Apple.com/Bill", amount: 4.51, cat: "Subscriptions", src: "debit" },
  { date: "2026-03-23", desc: "Richmond IDA Pharmacy", amount: 28.24, cat: "Health & Pharmacy", src: "debit" },
  { date: "2026-03-23", desc: "Pakalolo", amount: 10.72, cat: "Retail & Shopping", src: "debit" },
  { date: "2026-03-27", desc: "Dollarama #1513, Richmond", amount: 2.54, cat: "Retail & Shopping", src: "debit" },
  { date: "2026-03-31", desc: "CIBC Securities (investment)", amount: 25.00, cat: "Savings & Investing", src: "debit" },
  { date: "2026-03-31", desc: "Overdraft Fee", amount: 5.00, cat: "Fees & Interest", src: "debit" },
  { date: "2026-03-31", desc: "Overdraft Interest", amount: 0.38, cat: "Fees & Interest", src: "debit" },
  { date: "2026-04-06", desc: "Apple.com/Bill", amount: 4.51, cat: "Subscriptions", src: "debit" },
  { date: "2026-04-08", desc: "NSF Charge (debit acct)", amount: 10.00, cat: "Fees & Interest", src: "debit" },
];

// ========== PAYMENT TRACKER (statement-based running balance) ==========
const STATEMENT_LEDGER = [
  {
    period: "Dec 2025", stmtDate: "Dec 18, 2025", openBal: 42.82,
    newCharges: 985.86, otherCredits: 45.65, interest: 0, fees: 0,
    payments: [
      { date: "2025-12-07", desc: "Manual payment", amount: 600.00, status: "ok" },
      { date: "2025-12-08", desc: "Pre-authorized payment", amount: 42.82, status: "ok" },
    ],
    closeBal: 340.21,
  },
  {
    period: "Jan 2026", stmtDate: "Jan 18, 2026", openBal: 340.21,
    newCharges: 1221.73, otherCredits: 77.95, interest: 0, fees: 0,
    payments: [
      { date: "2026-01-01", desc: "Manual payment", amount: 254.00, status: "ok" },
      { date: "2026-01-07", desc: "Pre-authorized payment", amount: 8.26, status: "ok" },
      { date: "2026-01-07", desc: "Manual payment", amount: 340.21, status: "ok" },
    ],
    closeBal: 881.52,
  },
  {
    period: "Feb 2026", stmtDate: "Feb 18, 2026", openBal: 881.52,
    newCharges: 616.15, otherCredits: 124.29, interest: 7.90, fees: 42.50,
    payments: [
      { date: "2026-01-15", desc: "Manual payment", amount: 450.00, status: "ok" },
      { date: "2026-02-06", desc: "Pre-authorized payment", amount: 358.07, status: "bounced",
        bounceFees: [
          { desc: "Returned Payment Fee (Visa)", amount: 42.50 },
          { desc: "NSF Charge (debit account)", amount: 45.00 },
        ]},
      { date: "2026-02-08", desc: "Manual payment", amount: 210.25, status: "ok" },
    ],
    closeBal: 763.53,
  },
  {
    period: "Mar 2026", stmtDate: "Mar 18, 2026", openBal: 763.53,
    newCharges: 957.61, otherCredits: 0, interest: 4.07, fees: 0,
    payments: [
      { date: "2026-03-13", desc: "Pre-authorized payment", amount: 763.53, status: "warning",
        note: "Caused overdraft on debit account",
        bounceFees: [
          { desc: "Overdraft Fee (debit)", amount: 5.00 },
          { desc: "Overdraft Interest (debit)", amount: 0.38 },
        ]},
      { date: "2026-03-15", desc: "Manual payment", amount: 763.53, status: "ok" },
    ],
    closeBal: 198.15,
  },
  {
    period: "Apr 2026", stmtDate: "Ongoing", openBal: 198.15,
    newCharges: 639.63, otherCredits: 0, interest: 0, fees: 42.50,
    payments: [
      { date: "2026-04-07", desc: "Pre-authorized payment", amount: 198.15, status: "bounced",
        bounceFees: [
          { desc: "Returned Payment Fee (Visa)", amount: 42.50 },
          { desc: "NSF Charge (debit account)", amount: 10.00 },
        ]},
    ],
    closeBal: null,
  },
];

const MONEY_RECEIVED = [
  { date: "2025-11-10", from: "Deposit Canada", amount: 30.91, type: "government" },
  { date: "2025-11-13", from: "Naji Mekhayche (Dad)", amount: 300.00, type: "dad" },
  { date: "2025-11-13", from: "Mom (Internet Transfer)", amount: 561.00, type: "mom" },
  { date: "2025-12-01", from: "Naji Mekhayche (Dad)", amount: 120.00, type: "dad" },
  { date: "2025-12-03", from: "S M Afik Kamal", amount: 30.00, type: "friend" },
  { date: "2025-12-09", from: "S M Afik Kamal", amount: 8.00, type: "friend" },
  { date: "2025-12-10", from: "Deposit Canada", amount: 30.91, type: "government" },
  { date: "2025-12-15", from: "S M Afik Kamal", amount: 18.00, type: "friend" },
  { date: "2025-12-17", from: "Suhani Singh", amount: 19.00, type: "friend" },
  { date: "2025-12-22", from: "S M Afik Kamal", amount: 10.00, type: "friend" },
  { date: "2025-12-30", from: "Mom (Internet Transfer)", amount: 250.00, type: "mom" },
  { date: "2026-01-02", from: "Naji Mekhayche (Dad)", amount: 120.00, type: "dad" },
  { date: "2026-01-05", from: "TPS/GST Deposit", amount: 107.77, type: "government" },
  { date: "2026-01-06", from: "Naji Mekhayche (Dad)", amount: 173.50, type: "dad" },
  { date: "2026-01-07", from: "Mom (Internet Transfer)", amount: 430.00, type: "mom" },
  { date: "2026-01-09", from: "Deposit Canada", amount: 30.91, type: "government" },
  { date: "2026-01-26", from: "S M Afik Kamal", amount: 30.00, type: "friend" },
  { date: "2026-02-10", from: "Deposit Canada", amount: 30.91, type: "government" },
  { date: "2026-02-23", from: "Naji Mahmoud Mekhayche (Dad)", amount: 184.26, type: "dad" },
  { date: "2026-03-10", from: "Deposit Canada", amount: 30.91, type: "government" },
  { date: "2026-03-18", from: "Mom (Internet Transfer)", amount: 500.00, type: "mom" },
  { date: "2026-03-19", from: "Naji Mahmoud Mekhayche (Dad)", amount: 70.00, type: "dad" },
  { date: "2026-04-02", from: "TPS/GST Deposit", amount: 107.77, type: "government" },
  { date: "2026-04-08", from: "Naji Mekhayche (Dad)", amount: 150.00, type: "dad" },
  { date: "2026-04-10", from: "Deposit Canada", amount: 30.91, type: "government" },
  { date: "2026-04-10", from: "Kai kyunghyeon Song (Toronto trip)", amount: 97.00, type: "friend" },
];

const MONEY_SENT_OUT = [
  { date: "2025-11-17", to: "Jack (group project)", amount: 15.00 },
  { date: "2025-12-01", to: "ACAC Asian Canadian Club", amount: 10.00 },
  { date: "2026-02-17", to: "Kai", amount: 45.00 },
  { date: "2026-02-17", to: "Kai", amount: 54.00 },
  { date: "2026-02-20", to: "Kai", amount: 19.00 },
  { date: "2026-03-20", to: "Kai", amount: 15.00 },
  { date: "2026-03-23", to: "Kai", amount: 10.00 },
  { date: "2026-03-23", to: "One-time contact", amount: 30.00 },
];

/*
 * AMAZON PURCHASE HISTORY — with sub-categories
 * subCat options: "Project Supplies", "Car Maintenance", "Necessities", "Home", "Other"
 */
const AMAZON_ORDERS = [
  // --- November 2025 ---
  { date: "2025-11-25", total: 27.55, status: "delivered", items: [
    { name: "Sukh Orange Silica Desiccant Beads 430G", subCat: "Project Supplies" },
    { name: "Mini Hygrometer Thermometer Digital 2 Pack", subCat: "Project Supplies" },
  ]},
  // --- December 2025 ---
  { date: "2025-12-02", total: 7.85, status: "delivered", items: [
    { name: "BIC Wite-Out Correction Tape 2-Count", subCat: "Project Supplies" },
  ]},
  { date: "2025-12-03", total: 43.72, status: "delivered", items: [
    { name: "HARDELL Mini Cordless Rotary Tool Kit 111 Accessories", subCat: "Project Supplies" },
  ]},
  { date: "2025-12-03", total: 14.68, status: "delivered", items: [
    { name: "Botanic Hearth Rosemary Oil for Hair Growth", subCat: "Necessities" },
  ]},
  { date: "2025-12-07", total: 5.53, status: "delivered", items: [
    { name: "Crayola 12 Erasable Coloured Pencils Arts & Crafts", subCat: "Project Supplies" },
  ]},
  { date: "2025-12-10", total: 40.78, status: "delivered", items: [
    { name: "KAIWEETS Digital Multimeter TRMS 6000 Counts", subCat: "Project Supplies" },
  ]},
  { date: "2025-12-10", total: 40.67, status: "delivered", items: [
    { name: "Full Face Respirator Gas Mask 6800 with Filters", subCat: "Project Supplies" },
  ]},
  { date: "2025-12-11", total: 15.81, status: "delivered", items: [
    { name: "Gritin Rechargeable Book Light 4 Color Temperatures", subCat: "Other" },
  ]},
  { date: "2025-12-11", total: 22.59, status: "delivered", items: [
    { name: "Lazy Glasses Prism Spectacles 90° Reading Glasses", subCat: "Other" },
  ]},
  { date: "2025-12-16", total: 55.36, status: "returned", items: [
    { name: "Ear Plugs for Sleeping 45dB Noise Cancelling", subCat: "Other" },
  ]},
  { date: "2025-12-16", total: 4.17, status: "delivered", shipTo: "Suhani Singh", items: [
    { name: "e.l.f. Cream Glide Lip Liner Dark Cocoa", subCat: "Necessities" },
  ]},
  { date: "2025-12-16", total: 14.68, status: "delivered", shipTo: "Suhani Singh", items: [
    { name: "NYX PROFESSIONAL MAKEUP Epic Ink Liner BLACK", subCat: "Necessities" },
  ]},
  { date: "2025-12-25", total: 69.77, status: "delivered", items: [
    { name: "Dual Monitor Mount 13-32 inch Gas Spring Stand", subCat: "Home" },
  ]},
  { date: "2025-12-25", total: 24.81, status: "delivered", items: [
    { name: "L'Oréal Paris Glycolic Gloss Shine Leave-In Serum", subCat: "Necessities" },
    { name: "EverPure Sulfate-Free Bonding Shampoo 200ml", subCat: "Necessities" },
  ]},
  { date: "2025-12-25", total: 6.99, status: "delivered", items: [
    { name: "Rimmel London Exaggerate Eye Definer Rich Brown", subCat: "Necessities" },
  ]},
  { date: "2025-12-25", total: 9.86, status: "delivered", items: [
    { name: "ESVIENS Hair Cutting Scissors 6.5\" Stainless Steel", subCat: "Necessities" },
  ]},
  { date: "2025-12-29", total: 19.18, status: "delivered", items: [
    { name: "NYX Lip Gloss Hydrating Gloss Stain – Mocha Me Wet", subCat: "Necessities" },
  ]},
  // --- January 2026 ---
  { date: "2026-01-05", total: 109.13, status: "delivered", items: [
    { name: "TUOFENG 22 AWG Solid Core Hookup Wires 6 Colors 30ft each", subCat: "Project Supplies" },
    { name: "uxcell Potentiometer B5K Ohm Variable Resistors 10pcs", subCat: "Project Supplies" },
    { name: "30 Pack Retractable Badge Reel Clips", subCat: "Project Supplies" },
    { name: "RGBZONE 6Pcs MG90S Micro Servo Motors 9G", subCat: "Project Supplies" },
    { name: "ELEGOO 3pcs ESP-WROOM-32 Development Board WiFi+Bluetooth", subCat: "Project Supplies" },
  ]},
  { date: "2026-01-10", total: 13.53, status: "delivered", items: [
    { name: "Aquaphor Healing Balm Stick for Chapped Skin 18.4g", subCat: "Necessities" },
  ]},
  { date: "2026-01-11", total: 50.84, status: "returned", items: [
    { name: "OidoZac Laminator Machine 11-in-1 (duplicate order)", subCat: "Project Supplies" },
  ]},
  { date: "2026-01-12", total: 50.84, status: "delivered", items: [
    { name: "OidoZac Laminator Machine 11-in-1 with 36 Laminating Sheets", subCat: "Project Supplies" },
  ]},
  { date: "2026-01-12", total: 42.93, status: "delivered", items: [
    { name: "Miuzei MG90S Micro Servo Motor Kit for Arduino (10 pack)", subCat: "Project Supplies" },
  ]},
  { date: "2026-01-14", total: 24.86, status: "delivered", items: [
    { name: "d'alba Piedmont Italian White Truffle First Spray Serum 100ml", subCat: "Necessities" },
  ]},
  { date: "2026-01-15", total: 48.58, status: "delivered", items: [
    { name: "Preciva Crimping Tool + 1050Pcs JST-SM Connectors Kit", subCat: "Project Supplies" },
  ]},
  { date: "2026-01-22", total: 24.85, status: "delivered", items: [
    { name: "EUDAX 5 Pcs Mini Generator Motors 3V-12V DC for DIY Wind Turbine", subCat: "Project Supplies" },
  ]},
  // --- February 2026 ---
  { date: "2026-02-02", total: 7.90, status: "delivered", items: [
    { name: "Rimmel London Lasting Finish Lip Liner", subCat: "Necessities" },
  ]},
  { date: "2026-02-05", total: 33.89, status: "delivered", items: [
    { name: "WAFLOO Cordless Water Flosser 4 Modes Portable", subCat: "Necessities" },
  ]},
  { date: "2026-02-08", total: 60.45, status: "return-pending", items: [
    { name: "EXW Wireless Charger Stand 3-in-1 for Apple Devices", subCat: "Other" },
  ]},
  { date: "2026-02-08", total: 19.99, status: "return-pending", items: [
    { name: "Women Shawls and Wraps Chiffon Wedding Stole Wine Red", subCat: "Necessities" },
  ]},
  { date: "2026-02-08", total: 60.45, status: "delivered", items: [
    { name: "ZHESHY Silver Gold Bracelets Stackable Layered", subCat: "Necessities" },
    { name: "NYX Professional Lip Gloss Drippin' In Rose", subCat: "Necessities" },
    { name: "NYX PROFESSIONAL Waterproof Lip Pencil Burgundy", subCat: "Necessities" },
    { name: "ZKKZOMA 45 Sheets Cardstock Paper 65lb", subCat: "Project Supplies" },
  ]},
  { date: "2026-02-08", total: 23.73, status: "delivered", items: [
    { name: "Hydration Powder Electrolyte Drink Mix Strawberry Margarita", subCat: "Necessities" },
  ]},
  { date: "2026-02-11", total: 45.20, status: "delivered", items: [
    { name: "Gütermann 26 pc MCT Sew-All 100m Thread Set Assorted Colours", subCat: "Project Supplies" },
  ]},
  { date: "2026-02-11", total: 29.14, status: "return-pending", items: [
    { name: "72 PCS Sewing Thread Assortment 36 Colors", subCat: "Project Supplies" },
  ]},
  { date: "2026-02-19", total: 38.65, status: "delivered", items: [
    { name: "La Roche-Posay Anthelios Sunscreen SPF 50 Ultra-Fluid 50ml", subCat: "Necessities" },
  ]},
  // --- March 2026 ---
  { date: "2026-03-10", total: 27.11, status: "delivered", shipTo: "Kai Song", items: [
    { name: "WilThghe 1900PCS M2-M5 Metric Screw + Nut + Washer Kit", subCat: "Project Supplies" },
  ]},
  { date: "2026-03-11", total: 68.62, status: "delivered", shipTo: "Kai Song", items: [
    { name: "JOREST 50-in-1 Precision Screwdriver Set", subCat: "Project Supplies" },
    { name: "6pcs DC Barrel Connector Kit 5.5x2.1mm", subCat: "Project Supplies" },
    { name: "3V~24V 5A 120W Adjustable Power Supply Adapter", subCat: "Project Supplies" },
  ]},
  { date: "2026-03-11", total: 67.78, status: "delivered", shipTo: "Kai Song", items: [
    { name: "JTAREA 600PCS JST XH 2.54mm Connector Kit", subCat: "Project Supplies" },
    { name: "Aideepen 6-Pack MG996R High Torque Servo Motors", subCat: "Project Supplies" },
  ]},
  { date: "2026-03-18", total: 15.81, status: "delivered", shipTo: "Talia Chudobiak", items: [
    { name: "Bambaw Double Edge Safety Razor Blades 60 Count", subCat: "Necessities" },
  ]},
  { date: "2026-03-26", total: 15.58, status: "delivered", items: [
    { name: "NYX Lip Gloss Hydrating Gloss Stain – Hydra-Honey", subCat: "Necessities" },
  ]},
  // --- April 2026 ---
  { date: "2026-04-01", total: 142.28, status: "delivered", items: [
    { name: "TXBILMOO Halogen Headlight Bulbs Honda Civic 2004-2015 4-Pack", subCat: "Car Maintenance" },
    { name: "A-Premium Engine Air Filter Honda Civic 2006-2011 L4 1.8L", subCat: "Car Maintenance" },
    { name: "e.l.f. Dual-Pencil Sharpener", subCat: "Necessities" },
    { name: "HOMEXCEL Microfiber Cleaning Cloth 12 Pack 12.5x12.5 inch", subCat: "Car Maintenance" },
    { name: "LANON 3 Pairs Work Gloves Nitrile Coated Mechanic", subCat: "Car Maintenance" },
    { name: "2 Pack FD134 Cabin Air Filter Civic/CR-V/Odyssey", subCat: "Car Maintenance" },
  ]},
  { date: "2026-04-01", total: 55.22, status: "delivered", items: [
    { name: "CERAKOTE Ceramic Headlight Restoration Kit", subCat: "Car Maintenance" },
    { name: "Rain-X 36232 Glass Treatment Water Repellent 473mL", subCat: "Car Maintenance" },
    { name: "Rimmel London Lasting Finish Lip Liner (x2)", subCat: "Necessities" },
  ]},
  { date: "2026-04-01", total: 0, status: "cancelled", items: [
    { name: "QIIYCCF 120PCS Car Clips & Plastic Rivets (NOT CHARGED)", subCat: "Car Maintenance" },
  ]},
  { date: "2026-04-08", total: 15.81, status: "delivered", items: [
    { name: "Amazon Basics Multipurpose Copy Printer Paper 500 Sheets", subCat: "Project Supplies" },
  ]},
];

const AMAZON_SUBCAT_CONFIG = {
  "Project Supplies": { icon: "🔧", color: "#ff9900", label: "Project Supplies" },
  "Necessities":      { icon: "🧴", color: "#c9508a", label: "Necessities" },
  "Car Maintenance":  { icon: "🚗", color: "#f97316", label: "Car Maintenance" },
  "Home":             { icon: "🏠", color: "#2d7dba", label: "Home" },
  "Other":            { icon: "📦", color: "#6b7280", label: "Other" },
};

const PROJ_SUBCAT_CONFIG = {
  "Electronics": { icon: "⚡", color: "#3b82f6", label: "Electronics" },
  "Tools":       { icon: "🔧", color: "#f97316", label: "Tools" },
  "Supplies":    { icon: "📎", color: "#10b981", label: "Supplies" },
  "Sewing":      { icon: "🧵", color: "#ec4899", label: "Sewing" },
  "Safety":      { icon: "🛡️", color: "#ef4444", label: "Safety" },
  "Other":       { icon: "📦", color: "#6b7280", label: "Other" },
};

// ========== CONFIG ==========
const MONTH_LABELS = {
  "2025-11": "November 2025", "2025-12": "December 2025",
  "2026-01": "January 2026", "2026-02": "February 2026",
  "2026-03": "March 2026", "2026-04": "April 2026",
};

const CAT_CONFIG = {
  "Gas": { icon: "⛽", color: "#e85d26" },
  "Food & Dining": { icon: "🍽️", color: "#d4a017" },
  "Groceries": { icon: "🛒", color: "#5a9e3f" },
  "School/Project Expenses": { icon: "📚", color: "#ff9900" },
  "Beauty": { icon: "💄", color: "#c9508a" },
  "Home & Furnishing": { icon: "🏠", color: "#2d7dba" },
  "Health & Pharmacy": { icon: "💊", color: "#4db8a4" },
  "Retail & Shopping": { icon: "🛍️", color: "#8b5cf6" },
  "Transportation": { icon: "🚌", color: "#6b7280" },
  "Car Maintenance": { icon: "🔧", color: "#f97316" },
  "Entertainment": { icon: "🎶", color: "#ec4899" },
  "Subscriptions": { icon: "🔄", color: "#06b6d4" },
  "Fees & Interest": { icon: "⚠️", color: "#ef4444" },
  "Toronto Trip": { icon: "🏙️", color: "#f59e0b" },
  "Savings & Investing": { icon: "📈", color: "#10b981" },
};

const fmt = (n) => { const s = Math.abs(n).toLocaleString("en-CA",{minimumFractionDigits:2,maximumFractionDigits:2}); return n<0?`-$${s}`:`$${s}`; };
const fmtDate = (d) => new Date(d+"T12:00:00").toLocaleDateString("en-CA",{month:"short",day:"numeric"});
const getMonthKey = (d) => d.substring(0,7);

export default function SpendingBreakdown() {
  const months = Object.keys(MONTH_LABELS);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedCat, setExpandedCat] = useState(null);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [overrides, setOverrides] = useState({});
  const [resetCount, setResetCount] = useState(0);
  const [showPayments, setShowPayments] = useState(false);
  const [showIncome, setShowIncome] = useState(false);
  const [showAmazon, setShowAmazon] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showMonthlyGrid, setShowMonthlyGrid] = useState(false);
  const [catNotes, setCatNotes] = useState({});
  const [openNotes, setOpenNotes] = useState({});
  const [summaryWidth, setSummaryWidth] = useState(420);
  const [activeHackathon, setActiveHackathon] = useState("genai"); // "genai" or "bearhacks"
  const [expandedTripCat, setExpandedTripCat] = useState(null);

  const filtered = activeTab === "all" ? ALL_TRANSACTIONS
    : activeTab === "hackathons" ? (activeHackathon === "genai" ? ALL_TRANSACTIONS.filter(t => t.cat === "Toronto Trip") : [])
    : ALL_TRANSACTIONS.filter(t => getMonthKey(t.date) === activeTab);

  const byCat = {};
  filtered.forEach(t => { if (!byCat[t.cat]) byCat[t.cat]=[]; byCat[t.cat].push(t); });

  const catTotals = Object.entries(byCat).map(([cat, txns]) => {
    const calcTotal = txns.reduce((s,t)=>s+t.amount,0);
    const key = `${activeTab}::${cat}`;
    const hasOverride = overrides[key] !== undefined;
    return { cat, total: hasOverride ? overrides[key] : calcTotal, originalTotal: calcTotal, hasOverride, count: txns.length, txns };
  }).sort((a,b)=>b.total-a.total);

  const grandTotal = catTotals.reduce((s,c)=>s+c.total,0);
  const hasAnyOverride = Object.keys(overrides).length > 0;
  const giftAmt = filtered.filter(t=>t.gift).reduce((s,t)=>s+t.amount,0);

  const torontoTxns = ALL_TRANSACTIONS.filter(t=>t.cat==="Toronto Trip");
  const torontoTotal = torontoTxns.reduce((s,t)=>s+t.amount,0);

  const monthlyTotals = months.map(m => {
    const txns = ALL_TRANSACTIONS.filter(t=>getMonthKey(t.date)===m);
    const gt = txns.filter(t=>t.gift).reduce((s,t)=>s+t.amount,0);
    return { month:m, total:txns.reduce((s,t)=>s+t.amount,0), totalExGifts:txns.filter(t=>!t.gift).reduce((s,t)=>s+t.amount,0), giftTotal:gt, count:txns.length };
  }).filter(m=>m.count>0);

  // Tabs — removed Projects and Car
  const tabs = [
    { key:"all", label:"All Months" },
    ...monthlyTotals.map(m=>({key:m.month, label:MONTH_LABELS[m.month].split(" ")[0].substring(0,3)})),
    { key:"hackathons", label:"🏆 Hackathons" },
  ];

  const totalBounceFees = STATEMENT_LEDGER.flatMap(s=>s.payments).filter(p=>p.bounceFees).flatMap(p=>p.bounceFees).reduce((s,f)=>s+f.amount,0);
  const totalInterest = STATEMENT_LEDGER.reduce((s,p)=>s+p.interest,0);
  const totalCCFees = STATEMENT_LEDGER.reduce((s,p)=>s+p.fees,0);
  const totalMoneyLost = totalBounceFees + totalInterest + totalCCFees;
  const totalPaidSuccessfully = STATEMENT_LEDGER.flatMap(s=>s.payments).filter(p=>p.status==="ok"||p.status==="warning").reduce((s,p)=>s+p.amount,0);

  // ========== MONTHLY CATEGORY GRID DATA ==========
  const gridMonths = months.filter(m => ALL_TRANSACTIONS.some(t => getMonthKey(t.date) === m));
  const allCats = [...new Set(ALL_TRANSACTIONS.map(t => t.cat))].sort((a,b) => {
    const totA = ALL_TRANSACTIONS.filter(t=>t.cat===a).reduce((s,t)=>s+t.amount,0);
    const totB = ALL_TRANSACTIONS.filter(t=>t.cat===b).reduce((s,t)=>s+t.amount,0);
    return totB - totA;
  });
  const gridData = {};
  allCats.forEach(cat => {
    gridData[cat] = {};
    gridMonths.forEach(m => {
      gridData[cat][m] = ALL_TRANSACTIONS.filter(t => t.cat === cat && getMonthKey(t.date) === m).reduce((s,t) => s + t.amount, 0);
    });
  });

  // ========== AMAZON MONTHLY SUBCAT GRID DATA ==========
  const amazonGridMonths = [...new Set(AMAZON_ORDERS.map(o => o.date.substring(0,7)))].sort();
  const allSubCats = Object.keys(AMAZON_SUBCAT_CONFIG);
  const amazonGridData = {};
  allSubCats.forEach(sc => {
    amazonGridData[sc] = {};
    amazonGridMonths.forEach(m => {
      const orders = AMAZON_ORDERS.filter(o => o.date.substring(0,7) === m && o.status !== "cancelled" && o.status !== "returned");
      let total = 0;
      orders.forEach(o => {
        const matchItems = o.items.filter(i => i.subCat === sc);
        if (matchItems.length === o.items.length) total += o.total;
        else if (matchItems.length > 0) total += (o.total / o.items.length) * matchItems.length;
      });
      amazonGridData[sc][m] = total;
    });
  });

  const srcBadge = (s) => (<span style={{fontSize:9,fontWeight:600,letterSpacing:0.5,padding:"2px 5px",borderRadius:4,marginLeft:6,background:s==="visa"?"rgba(37,99,235,0.15)":"rgba(16,185,129,0.15)",color:s==="visa"?"#60a5fa":"#6ee7b7",flexShrink:0}}>{s==="visa"?"VISA":"DEBIT"}</span>);

  const S = { fontFamily:"'DM Sans','Segoe UI',sans-serif", background:"linear-gradient(135deg,#0f1419 0%,#1a1f2e 50%,#0f1419 100%)", color:"#e8eaed", minHeight:"100vh", padding:"24px 16px" };

  return (
    <div style={S}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>

      {/* HEADER */}
      <div style={{maxWidth:720,margin:"0 auto 28px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{fontSize:11,fontFamily:"'DM Mono',monospace",color:"#6b7280",letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Nov 2025 – Apr 2026</div>
          <h1 style={{fontSize:28,fontWeight:700,margin:0,letterSpacing:-0.5}}>Spending Breakdown</h1>
          <div style={{fontSize:13,color:"#9ca3af",marginTop:4}}>CIBC Visa + Debit · {ALL_TRANSACTIONS.length} transactions</div>
        </div>
        <button onClick={()=>setShowSummary(true)} style={{
          background:"linear-gradient(135deg,#2563eb,#3b82f6)",border:"none",borderRadius:10,
          padding:"10px 16px",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",
          fontFamily:"inherit",display:"flex",alignItems:"center",gap:6,
          boxShadow:"0 2px 12px rgba(37,99,235,0.3)",marginTop:4,whiteSpace:"nowrap",
        }}>
          📋 Summary
        </button>
      </div>

      {/* PAYMENT TRACKER TOGGLE */}
      <div style={{maxWidth:720,margin:"0 auto 16px"}}>
        <button onClick={()=>setShowPayments(!showPayments)} style={{
          width:"100%", background: showPayments ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.04)",
          border: showPayments ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.08)",
          borderRadius:12, padding:"14px 18px", cursor:"pointer", fontFamily:"inherit", color:"#e8eaed",
          display:"flex", justifyContent:"space-between", alignItems:"center",
        }}>
          <div style={{textAlign:"left"}}>
            <div style={{fontSize:14,fontWeight:600}}>💳 Credit Card Payment Tracker</div>
            <div style={{fontSize:12,color:"#9ca3af",marginTop:2}}>
              {fmt(totalPaidSuccessfully)} paid · {fmt(totalMoneyLost)} lost to fees & interest
            </div>
          </div>
          <span style={{fontSize:12,color:"#6b7280",transform:showPayments?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}>▼</span>
        </button>
      </div>

      {/* PAYMENT TRACKER PANEL — kept same, abbreviated for space */}
      {showPayments && (
        <div style={{maxWidth:720,margin:"0 auto 20px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,overflow:"hidden"}}>
          <div style={{padding:"16px 18px",borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(239,68,68,0.06)"}}>
            <div style={{fontSize:13,fontWeight:600,color:"#fca5a5",marginBottom:10}}>⚠️ Money Lost to Fees & Interest</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              {[["BOUNCE FEES",totalBounceFees],["INTEREST",totalInterest],["TOTAL LOST",totalMoneyLost]].map(([l,v],i)=>(
                <div key={i} style={{background:"rgba(0,0,0,0.2)",borderRadius:8,padding:"10px 12px"}}>
                  <div style={{fontSize:10,color:"#6b7280",fontWeight:500}}>{l}</div>
                  <div style={{fontSize:18,fontWeight:700,fontFamily:"'DM Mono',monospace",color:i===2?"#ef4444":"#fca5a5"}}>{fmt(v)}</div>
                </div>
              ))}
            </div>
          </div>
          {STATEMENT_LEDGER.map((stmt,si)=>{
            const effectivePayments = stmt.payments.filter(p=>p.status==="ok"||p.status==="warning").reduce((s,p)=>s+p.amount,0);
            const addedToBalance = stmt.newCharges - stmt.otherCredits + stmt.interest + stmt.fees;
            return (
              <div key={si} style={{borderBottom:si<STATEMENT_LEDGER.length-1?"1px solid rgba(255,255,255,0.06)":"none"}}>
                <div style={{padding:"14px 18px 8px",background:"rgba(255,255,255,0.02)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:14,fontWeight:700}}>{stmt.period}</div>
                    <div style={{fontSize:11,color:"#6b7280"}}>Statement: {stmt.stmtDate}</div>
                  </div>
                </div>
                <div style={{padding:"0 18px 6px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[["OWED AT START",stmt.openBal],[stmt.closeBal!==null?"STILL OWED":"EST. STILL OWED",stmt.closeBal!==null?stmt.closeBal:stmt.openBal+addedToBalance-effectivePayments]].map(([l,v],i)=>(
                    <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"10px 12px"}}>
                      <div style={{fontSize:10,color:"#6b7280",fontWeight:500}}>{l}</div>
                      <div style={{fontSize:16,fontWeight:700,fontFamily:"'DM Mono',monospace",color:"#fca5a5"}}>{fmt(v)}</div>
                    </div>
                  ))}
                </div>
                <div style={{padding:"4px 18px 12px"}}>
                  {stmt.payments.map((p,pi)=>{
                    const col = p.status==="ok"?"#d1d5db":p.status==="bounced"?"#ef4444":"#f59e0b";
                    const icon = p.status==="ok"?"✓":p.status==="bounced"?"✗":"⚠";
                    return (
                      <div key={pi}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderTop:pi===0?"1px solid rgba(255,255,255,0.04)":"none"}}>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <span style={{color:p.status==="ok"?"#6b7280":col,fontSize:13}}>{icon}</span>
                            <div>
                              <div style={{fontSize:12,color:"#d1d5db"}}>{p.desc}</div>
                              <div style={{fontSize:10,color:"#6b7280",fontFamily:"'DM Mono',monospace"}}>{fmtDate(p.date)}</div>
                            </div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:13,fontWeight:700,fontFamily:"'DM Mono',monospace",color:col}}>
                              {p.status==="bounced"?`${fmt(p.amount)} ✗`:`-${fmt(p.amount)}`}
                            </div>
                          </div>
                        </div>
                        {p.note&&<div style={{fontSize:11,color:"#f59e0b",paddingLeft:24,paddingBottom:4,fontStyle:"italic"}}>{p.note}</div>}
                        {p.bounceFees&&p.bounceFees.map((f,fi)=>(
                          <div key={fi} style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#fca5a5",padding:"2px 0 2px 24px"}}>
                            <span>→ {f.desc}</span>
                            <span style={{fontFamily:"'DM Mono',monospace",fontWeight:600}}>-{fmt(f.amount)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0 2px",borderTop:"1px solid rgba(255,255,255,0.04)"}}>
                    <span style={{fontSize:12,fontWeight:600,color:"#d1d5db"}}>Total paid this period</span>
                    <span style={{fontSize:14,fontWeight:700,fontFamily:"'DM Mono',monospace",color:"#d1d5db"}}>-{fmt(effectivePayments)}</span>
                  </div>
                </div>
              </div>
            );
          })}
          <div style={{padding:"14px 18px",background:"rgba(255,255,255,0.04)",borderTop:"1px solid rgba(255,255,255,0.08)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <span style={{fontSize:13,fontWeight:600}}>Total paid toward credit card</span>
              <span style={{fontSize:18,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{fmt(totalPaidSuccessfully)}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,fontWeight:600}}>Current balance owed</span>
              <span style={{fontSize:18,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>
                {fmt(STATEMENT_LEDGER[STATEMENT_LEDGER.length-1].closeBal !== null
                  ? STATEMENT_LEDGER[STATEMENT_LEDGER.length-1].closeBal
                  : STATEMENT_LEDGER[STATEMENT_LEDGER.length-1].openBal +
                    STATEMENT_LEDGER[STATEMENT_LEDGER.length-1].newCharges -
                    STATEMENT_LEDGER[STATEMENT_LEDGER.length-1].otherCredits +
                    STATEMENT_LEDGER[STATEMENT_LEDGER.length-1].interest +
                    STATEMENT_LEDGER[STATEMENT_LEDGER.length-1].fees -
                    STATEMENT_LEDGER[STATEMENT_LEDGER.length-1].payments.filter(p=>p.status==="ok"||p.status==="warning").reduce((s,p)=>s+p.amount,0)
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* INCOME / MONEY RECEIVED TRACKER — same as before */}
      {(()=>{
        const totalFromDad = MONEY_RECEIVED.filter(r=>r.type==="dad").reduce((s,r)=>s+r.amount,0);
        const totalFromMom = MONEY_RECEIVED.filter(r=>r.type==="mom").reduce((s,r)=>s+r.amount,0);
        const totalFromFriends = MONEY_RECEIVED.filter(r=>r.type==="friend").reduce((s,r)=>s+r.amount,0);
        const totalGov = MONEY_RECEIVED.filter(r=>r.type==="government").reduce((s,r)=>s+r.amount,0);
        const totalSentOut = MONEY_SENT_OUT.reduce((s,r)=>s+r.amount,0);
        const totalRealIncome = totalFromDad + totalFromMom + totalFromFriends + totalGov;
        const typeConfig = {
          "dad": { label: "Dad", icon: "👨", color: "#3b82f6" },
          "mom": { label: "Mom", icon: "👩", color: "#ec4899" },
          "friend": { label: "Friends", icon: "👥", color: "#8b5cf6" },
          "government": { label: "Government", icon: "🏛️", color: "#06b6d4" },
        };
        const receivedByMonth = {};
        MONEY_RECEIVED.forEach(r => { const mk = r.date.substring(0,7); if (!receivedByMonth[mk]) receivedByMonth[mk] = []; receivedByMonth[mk].push(r); });
        const sentByMonth = {};
        MONEY_SENT_OUT.forEach(r => { const mk = r.date.substring(0,7); if (!sentByMonth[mk]) sentByMonth[mk] = []; sentByMonth[mk].push(r); });
        const allMonthKeys = [...new Set([...Object.keys(receivedByMonth),...Object.keys(sentByMonth)])].sort();
        return (
          <>
            <div style={{maxWidth:720,margin:"0 auto 16px"}}>
              <button onClick={()=>setShowIncome(!showIncome)} style={{
                width:"100%",background:showIncome?"rgba(16,185,129,0.1)":"rgba(255,255,255,0.04)",
                border:showIncome?"1px solid rgba(16,185,129,0.3)":"1px solid rgba(255,255,255,0.08)",
                borderRadius:12,padding:"14px 18px",cursor:"pointer",fontFamily:"inherit",color:"#e8eaed",
                display:"flex",justifyContent:"space-between",alignItems:"center",
              }}>
                <div style={{textAlign:"left"}}>
                  <div style={{fontSize:14,fontWeight:600}}>💰 Money Received & Sent</div>
                  <div style={{fontSize:12,color:"#9ca3af",marginTop:2}}>{fmt(totalRealIncome)} received · {fmt(totalSentOut)} sent out</div>
                </div>
                <span style={{fontSize:12,color:"#6b7280",transform:showIncome?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}>▼</span>
              </button>
            </div>
            {showIncome && (
              <div style={{maxWidth:720,margin:"0 auto 20px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,overflow:"hidden"}}>
                <div style={{padding:"16px 18px",borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(16,185,129,0.04)"}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#6ee7b7",marginBottom:10}}>💰 Income Summary</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
                    {Object.entries(typeConfig).map(([type,cfg])=>(
                      <div key={type} style={{background:"rgba(0,0,0,0.2)",borderRadius:8,padding:"10px 10px"}}>
                        <div style={{fontSize:9,color:"#6b7280",fontWeight:500}}>{cfg.icon} {cfg.label.toUpperCase()}</div>
                        <div style={{fontSize:16,fontWeight:700,fontFamily:"'DM Mono',monospace",color:cfg.color,marginTop:4}}>{fmt(MONEY_RECEIVED.filter(r=>r.type===type).reduce((s,r)=>s+r.amount,0))}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{marginTop:8,background:"rgba(239,68,68,0.08)",borderRadius:8,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:11,color:"#fca5a5"}}>📤 Total sent to others</span>
                    <span style={{fontSize:14,fontWeight:700,fontFamily:"'DM Mono',monospace",color:"#fca5a5"}}>{fmt(totalSentOut)}</span>
                  </div>
                </div>
                {allMonthKeys.map((mk,mi) => {
                  const received = receivedByMonth[mk] || [];
                  const sent = sentByMonth[mk] || [];
                  const monthLabel = MONTH_LABELS[mk] || mk;
                  return (
                    <div key={mk} style={{borderBottom:mi<allMonthKeys.length-1?"1px solid rgba(255,255,255,0.06)":"none"}}>
                      <div style={{padding:"12px 18px 6px",background:"rgba(255,255,255,0.02)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:13,fontWeight:700}}>{monthLabel}</span>
                        <span style={{fontSize:12,color:"#6ee7b7",fontFamily:"'DM Mono',monospace",fontWeight:600}}>+{fmt(received.reduce((s,r)=>s+r.amount,0))}</span>
                      </div>
                      {received.map((r,ri)=>{ const cfg=typeConfig[r.type]; return (
                        <div key={ri} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 18px 6px 36px"}}>
                          <div>
                            <div style={{fontSize:12,color:"#d1d5db",display:"flex",alignItems:"center",gap:5}}>
                              <span style={{fontSize:12}}>{cfg.icon}</span>{r.from}
                              <span style={{fontSize:9,padding:"1px 5px",borderRadius:3,background:`${cfg.color}20`,color:cfg.color,fontWeight:600}}>{cfg.label}</span>
                            </div>
                            <div style={{fontSize:10,color:"#6b7280",fontFamily:"'DM Mono',monospace",marginTop:1}}>{fmtDate(r.date)}</div>
                          </div>
                          <span style={{fontSize:13,fontWeight:600,fontFamily:"'DM Mono',monospace",color:"#4ade80"}}>+{fmt(r.amount)}</span>
                        </div>
                      );})}
                      {sent.length > 0 && (<>
                        <div style={{padding:"6px 18px 2px",fontSize:10,color:"#6b7280",fontWeight:500}}>SENT OUT</div>
                        {sent.map((s,si)=>(
                          <div key={si} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 18px 4px 36px"}}>
                            <div>
                              <div style={{fontSize:12,color:"#d1d5db"}}>📤 To: {s.to}</div>
                              <div style={{fontSize:10,color:"#6b7280",fontFamily:"'DM Mono',monospace",marginTop:1}}>{fmtDate(s.date)}</div>
                            </div>
                            <span style={{fontSize:13,fontWeight:600,fontFamily:"'DM Mono',monospace",color:"#fca5a5"}}>-{fmt(s.amount)}</span>
                          </div>
                        ))}
                      </>)}
                      <div style={{height:6}}/>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        );
      })()}

      {/* ========== AMAZON PURCHASES ========== */}
      {(()=>{
        const amazonTotal = AMAZON_ORDERS.filter(o=>o.status!=="cancelled").reduce((s,o)=>s+o.total,0);
        const returnedTotal = AMAZON_ORDERS.filter(o=>o.status==="returned").reduce((s,o)=>s+o.total,0);
        const pendingReturnTotal = AMAZON_ORDERS.filter(o=>o.status==="return-pending").reduce((s,o)=>s+o.total,0);
        const ordersByMonth = {};
        AMAZON_ORDERS.forEach(o => { const mk = o.date.substring(0,7); if(!ordersByMonth[mk]) ordersByMonth[mk]=[]; ordersByMonth[mk].push(o); });
        const monthKeys = Object.keys(ordersByMonth).sort();

        return (<>
          <div style={{maxWidth:720,margin:"0 auto 16px"}}>
            <button onClick={()=>setShowAmazon(!showAmazon)} style={{
              width:"100%",background:showAmazon?"rgba(255,153,0,0.1)":"rgba(255,255,255,0.04)",
              border:showAmazon?"1px solid rgba(255,153,0,0.3)":"1px solid rgba(255,255,255,0.08)",
              borderRadius:12,padding:"14px 18px",cursor:"pointer",fontFamily:"inherit",color:"#e8eaed",
              display:"flex",justifyContent:"space-between",alignItems:"center",
            }}>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:14,fontWeight:600}}>📦 Amazon Purchases — Itemized</div>
                <div style={{fontSize:12,color:"#9ca3af",marginTop:2}}>
                  {AMAZON_ORDERS.length} orders · {fmt(amazonTotal)} total · {fmt(returnedTotal)} returned · {fmt(pendingReturnTotal)} return pending
                </div>
              </div>
              <span style={{fontSize:12,color:"#6b7280",transform:showAmazon?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}>▼</span>
            </button>
          </div>

          {showAmazon && (
            <div style={{maxWidth:720,margin:"0 auto 20px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,overflow:"hidden"}}>
              {/* Sub-category summary cards */}
              <div style={{padding:"16px 18px",borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,153,0,0.04)"}}>
                <div style={{fontSize:15,fontWeight:700,color:"#ff9900",marginBottom:12}}>📦 Amazon Category Breakdown</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
                  {Object.entries(AMAZON_SUBCAT_CONFIG).map(([sc,cfg])=>{
                    const items = AMAZON_ORDERS.filter(o=>o.status!=="cancelled"&&o.status!=="returned").flatMap(o=>o.items.filter(i=>i.subCat===sc));
                    return (
                      <div key={sc} style={{background:"rgba(0,0,0,0.2)",borderRadius:8,padding:"10px 10px"}}>
                        <div style={{fontSize:10,color:"#9ca3af",fontWeight:600}}>{cfg.icon} {cfg.label.toUpperCase()}</div>
                        <div style={{fontSize:16,fontWeight:700,fontFamily:"'DM Mono',monospace",color:cfg.color,marginTop:4}}>{items.length} items</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Amazon monthly sub-cat grid */}
              <div style={{padding:"16px 18px",borderBottom:"1px solid rgba(255,255,255,0.06)",overflowX:"auto"}}>
                <div style={{fontSize:14,fontWeight:700,color:"#d1d5db",marginBottom:10}}>📊 Monthly Breakdown by Category</div>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead>
                    <tr>
                      <th style={{textAlign:"left",padding:"8px 10px",fontSize:12,color:"#6b7280",fontWeight:600,borderBottom:"1px solid rgba(255,255,255,0.08)"}}>Category</th>
                      {amazonGridMonths.map(m=>(
                        <th key={m} style={{textAlign:"right",padding:"8px 8px",fontSize:11,color:"#6b7280",fontWeight:600,borderBottom:"1px solid rgba(255,255,255,0.08)",whiteSpace:"nowrap"}}>
                          {(MONTH_LABELS[m]||m).split(" ")[0].substring(0,3)}
                        </th>
                      ))}
                      <th style={{textAlign:"right",padding:"8px 10px",fontSize:12,color:"#ff9900",fontWeight:700,borderBottom:"1px solid rgba(255,255,255,0.08)"}}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allSubCats.map(sc=>{
                      const cfg=AMAZON_SUBCAT_CONFIG[sc];
                      const rowTotal = amazonGridMonths.reduce((s,m)=>s+amazonGridData[sc][m],0);
                      if(rowTotal===0) return null;
                      return (
                        <tr key={sc}>
                          <td style={{padding:"8px 10px",borderBottom:"1px solid rgba(255,255,255,0.04)",fontSize:13,fontWeight:600,color:"#d1d5db",whiteSpace:"nowrap"}}>
                            {cfg.icon} {cfg.label}
                          </td>
                          {amazonGridMonths.map(m=>{
                            const v = amazonGridData[sc][m];
                            return (
                              <td key={m} style={{textAlign:"right",padding:"8px 8px",borderBottom:"1px solid rgba(255,255,255,0.04)",fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:600,color:v>0?cfg.color:"#3a3f4b"}}>
                                {v>0?fmt(v):"—"}
                              </td>
                            );
                          })}
                          <td style={{textAlign:"right",padding:"8px 10px",borderBottom:"1px solid rgba(255,255,255,0.04)",fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:700,color:cfg.color}}>
                            {fmt(rowTotal)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr>
                      <td style={{padding:"10px 10px",fontWeight:700,fontSize:13,color:"#ff9900",borderTop:"2px solid rgba(255,153,0,0.3)"}}>Total</td>
                      {amazonGridMonths.map(m=>{
                        const colTotal = allSubCats.reduce((s,sc)=>s+amazonGridData[sc][m],0);
                        return (
                          <td key={m} style={{textAlign:"right",padding:"10px 8px",fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:700,color:"#ff9900",borderTop:"2px solid rgba(255,153,0,0.3)"}}>
                            {colTotal>0?fmt(colTotal):"—"}
                          </td>
                        );
                      })}
                      <td style={{textAlign:"right",padding:"10px 10px",fontFamily:"'DM Mono',monospace",fontSize:15,fontWeight:700,color:"#ff9900",borderTop:"2px solid rgba(255,153,0,0.3)"}}>
                        {fmt(allSubCats.reduce((s,sc)=>s+amazonGridMonths.reduce((ss,m)=>ss+amazonGridData[sc][m],0),0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Orders by month — BIGGER TEXT */}
              {monthKeys.map((mk,mi) => {
                const orders = ordersByMonth[mk];
                const monthLabel = MONTH_LABELS[mk] || mk;
                const monthTotal = orders.filter(o=>o.status!=="cancelled").reduce((s,o)=>s+o.total,0);
                return (
                  <div key={mk} style={{borderBottom:mi<monthKeys.length-1?"1px solid rgba(255,255,255,0.06)":"none"}}>
                    <div style={{padding:"14px 18px 8px",background:"rgba(255,255,255,0.02)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:15,fontWeight:700}}>{monthLabel}</span>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:13,color:"#9ca3af"}}>{orders.length} orders</span>
                        <span style={{fontSize:15,fontWeight:700,fontFamily:"'DM Mono',monospace",color:"#ff9900"}}>{fmt(monthTotal)}</span>
                      </div>
                    </div>
                    {orders.map((order,oi) => {
                      const statusColor = order.status==="delivered"?"#6b7280":order.status==="returned"?"#4ade80":order.status==="return-pending"?"#f59e0b":"#ef4444";
                      const statusLabel = order.status==="delivered"?"Delivered":order.status==="returned"?"Returned":order.status==="return-pending"?"Return Pending":"Cancelled";
                      const statusIcon = order.status==="delivered"?"✓":order.status==="returned"?"↩":order.status==="return-pending"?"⏳":"✗";
                      const dateStr = new Date(order.date+"T12:00:00").toLocaleDateString("en-CA",{month:"short",day:"numeric",year:"numeric"});
                      return (
                        <div key={oi} style={{padding:"10px 18px",borderTop:oi>0?"1px solid rgba(255,255,255,0.03)":"none"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <span style={{fontSize:13,color:statusColor}}>{statusIcon}</span>
                              <span style={{fontSize:14,fontWeight:600,color:"#d1d5db"}}>Order on {dateStr}</span>
                              {order.shipTo && <span style={{fontSize:10,padding:"2px 6px",borderRadius:4,background:"rgba(139,92,246,0.15)",color:"#a78bfa",fontWeight:600}}>→ {order.shipTo}</span>}
                              <span style={{fontSize:10,padding:"2px 6px",borderRadius:4,background:`${statusColor}20`,color:statusColor,fontWeight:600}}>{statusLabel}</span>
                            </div>
                            <span style={{fontSize:15,fontWeight:700,fontFamily:"'DM Mono',monospace",
                              color:order.status==="cancelled"?"#6b7280":order.status==="returned"?"#4ade80":"#e8eaed",
                              textDecoration:order.status==="returned"||order.status==="cancelled"?"line-through":"none"
                            }}>{order.total>0?fmt(order.total):"FREE"}</span>
                          </div>
                          {order.items.map((item,ii) => {
                            const icfg = AMAZON_SUBCAT_CONFIG[item.subCat] || {icon:"•",color:"#6b7280",label:item.subCat};
                            return (
                              <div key={ii} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"4px 0 4px 28px"}}>
                                <span style={{fontSize:14,marginTop:1}}>{icfg.icon}</span>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:14,color:"#d1d5db",lineHeight:1.4}}>{item.name}</div>
                                  <div style={{fontSize:11,color:icfg.color,marginTop:2,fontWeight:600}}>{icfg.label}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </>);
      })()}

      {/* ========== MONTHLY CATEGORY GRID ========== */}
      <div style={{maxWidth:720,margin:"0 auto 16px"}}>
        <button onClick={()=>setShowMonthlyGrid(!showMonthlyGrid)} style={{
          width:"100%",background:showMonthlyGrid?"rgba(99,102,241,0.1)":"rgba(255,255,255,0.04)",
          border:showMonthlyGrid?"1px solid rgba(99,102,241,0.3)":"1px solid rgba(255,255,255,0.08)",
          borderRadius:12,padding:"14px 18px",cursor:"pointer",fontFamily:"inherit",color:"#e8eaed",
          display:"flex",justifyContent:"space-between",alignItems:"center",
        }}>
          <div style={{textAlign:"left"}}>
            <div style={{fontSize:14,fontWeight:600}}>📊 Monthly Category Breakdown</div>
            <div style={{fontSize:12,color:"#9ca3af",marginTop:2}}>See how much you spent per category each month</div>
          </div>
          <span style={{fontSize:12,color:"#6b7280",transform:showMonthlyGrid?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}>▼</span>
        </button>
      </div>

      {showMonthlyGrid && (
        <div style={{maxWidth:720,margin:"0 auto 20px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,overflow:"hidden"}}>
          <div style={{padding:"16px 18px",overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead>
                <tr>
                  <th style={{textAlign:"left",padding:"10px 10px",fontSize:12,color:"#6b7280",fontWeight:600,borderBottom:"2px solid rgba(255,255,255,0.1)",position:"sticky",left:0,background:"#1a1f2e",zIndex:1}}>Category</th>
                  {gridMonths.map(m=>(
                    <th key={m} style={{textAlign:"right",padding:"10px 8px",fontSize:11,color:"#6b7280",fontWeight:600,borderBottom:"2px solid rgba(255,255,255,0.1)",whiteSpace:"nowrap"}}>
                      {(MONTH_LABELS[m]||m).split(" ")[0].substring(0,3)}
                    </th>
                  ))}
                  <th style={{textAlign:"right",padding:"10px 10px",fontSize:12,color:"#60a5fa",fontWeight:700,borderBottom:"2px solid rgba(255,255,255,0.1)"}}>Total</th>
                </tr>
              </thead>
              <tbody>
                {allCats.map(cat=>{
                  const cfg=CAT_CONFIG[cat]||{icon:"•",color:"#6b7280"};
                  const rowTotal = gridMonths.reduce((s,m)=>s+gridData[cat][m],0);
                  if(Math.abs(rowTotal)<0.01) return null;
                  return (
                    <tr key={cat} style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                      <td style={{padding:"9px 10px",fontSize:13,fontWeight:600,color:"#d1d5db",whiteSpace:"nowrap",position:"sticky",left:0,background:"#1a1f2e",zIndex:1}}>
                        {cfg.icon} {cat}
                      </td>
                      {gridMonths.map(m=>{
                        const v = gridData[cat][m];
                        return (
                          <td key={m} style={{textAlign:"right",padding:"9px 8px",fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:v!==0?600:400,color:v>0?cfg.color:v<0?"#4ade80":"#3a3f4b"}}>
                            {v!==0?fmt(v):"—"}
                          </td>
                        );
                      })}
                      <td style={{textAlign:"right",padding:"9px 10px",fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:700,color:rowTotal<0?"#4ade80":cfg.color}}>
                        {fmt(rowTotal)}
                      </td>
                    </tr>
                  );
                })}
                <tr style={{borderTop:"2px solid rgba(99,102,241,0.3)"}}>
                  <td style={{padding:"12px 10px",fontWeight:700,fontSize:14,color:"#60a5fa",position:"sticky",left:0,background:"#1a1f2e",zIndex:1}}>Total</td>
                  {gridMonths.map(m=>{
                    const colTotal = allCats.reduce((s,cat)=>s+gridData[cat][m],0);
                    return <td key={m} style={{textAlign:"right",padding:"12px 8px",fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:700,color:"#60a5fa"}}>{fmt(colTotal)}</td>;
                  })}
                  <td style={{textAlign:"right",padding:"12px 10px",fontFamily:"'DM Mono',monospace",fontSize:16,fontWeight:700,color:"#60a5fa"}}>
                    {fmt(allCats.reduce((s,cat)=>s+gridMonths.reduce((ss,m)=>ss+gridData[cat][m],0),0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MONTHLY OVERVIEW */}
      <div className="monthly-summary-grid" style={{maxWidth:720,margin:"0 auto 24px",display:"grid",gridTemplateColumns:`repeat(${Math.min(monthlyTotals.length,6)},1fr)`,gap:8}}>
        {monthlyTotals.map(m=>(
          <div key={m.month} onClick={()=>{setActiveTab(m.month);setExpandedCat(null);}} style={{
            background:activeTab===m.month?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.03)",borderRadius:10,padding:"12px 10px",
            border:activeTab===m.month?"1px solid rgba(255,255,255,0.15)":"1px solid rgba(255,255,255,0.05)",cursor:"pointer",transition:"all 0.15s"}}>
            <div style={{fontSize:10,color:"#6b7280",fontWeight:600,marginBottom:4,letterSpacing:0.5}}>{MONTH_LABELS[m.month].split(" ")[0].substring(0,3).toUpperCase()}</div>
            <div style={{fontSize:15,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{fmt(m.giftTotal>0?m.totalExGifts:m.total)}</div>
            {m.giftTotal>0&&<div style={{fontSize:9,color:"#c9508a",marginTop:3}}>+{fmt(m.giftTotal)} gift</div>}
            <div style={{fontSize:10,color:"#6b7280",marginTop:2}}>{m.count} txns</div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="expense-tabs" style={{maxWidth:720,margin:"0 auto 20px",display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>
        {tabs.map(tab=>(
          <button key={tab.key} onClick={()=>{setActiveTab(tab.key);setExpandedCat(null);}} style={{
            background:activeTab===tab.key?(tab.key==="hackathons"?"rgba(245,158,11,0.2)":"rgba(255,255,255,0.12)"):"rgba(255,255,255,0.04)",
            border:activeTab===tab.key?(tab.key==="hackathons"?"1px solid rgba(245,158,11,0.4)":"1px solid rgba(255,255,255,0.15)"):"1px solid rgba(255,255,255,0.06)",
            borderRadius:8,padding:"8px 14px",color:activeTab===tab.key?"#fff":"#9ca3af",fontSize:13,fontWeight:activeTab===tab.key?600:400,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",transition:"all 0.15s"
          }}>{tab.label}</button>
        ))}
      </div>

      {/* HACKATHONS SECTION */}
      {activeTab==="hackathons"&&(()=>{
        return (
          <div style={{maxWidth:720,margin:"0 auto"}}>
            {/* Hackathon selector buttons */}
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              <button onClick={()=>setActiveHackathon("genai")} style={{
                flex:1,padding:"14px 16px",borderRadius:10,cursor:"pointer",fontFamily:"inherit",
                background:activeHackathon==="genai"?"linear-gradient(135deg,rgba(245,158,11,0.15),rgba(239,68,68,0.1))":"rgba(255,255,255,0.03)",
                border:activeHackathon==="genai"?"1px solid rgba(245,158,11,0.4)":"1px solid rgba(255,255,255,0.08)",
                color:activeHackathon==="genai"?"#fff":"#9ca3af",textAlign:"left",transition:"all 0.15s",
              }}>
                <div style={{fontSize:14,fontWeight:700}}>🏙️ GenAI Genesis Hackathon</div>
                <div style={{fontSize:12,color:activeHackathon==="genai"?"#d1d5db":"#6b7280",marginTop:3}}>Toronto · March 2026</div>
              </button>
              <button onClick={()=>setActiveHackathon("bearhacks")} style={{
                flex:1,padding:"14px 16px",borderRadius:10,cursor:"pointer",fontFamily:"inherit",
                background:activeHackathon==="bearhacks"?"linear-gradient(135deg,rgba(139,92,246,0.15),rgba(99,102,241,0.1))":"rgba(255,255,255,0.03)",
                border:activeHackathon==="bearhacks"?"1px solid rgba(139,92,246,0.4)":"1px solid rgba(255,255,255,0.08)",
                color:activeHackathon==="bearhacks"?"#fff":"#9ca3af",textAlign:"left",transition:"all 0.15s",
              }}>
                <div style={{fontSize:14,fontWeight:700}}>🐻 BearHacks</div>
                <div style={{fontSize:12,color:activeHackathon==="bearhacks"?"#d1d5db":"#6b7280",marginTop:3}}>Mississauga · TBD</div>
              </button>
            </div>

            {/* GenAI Genesis content */}
            {activeHackathon==="genai"&&(()=>{
              const tripSubCats = {
                "Parts & Supplies": { icon: "🔧", color: "#ff9900" },
                "Food & Drinks":    { icon: "🍽️", color: "#d4a017" },
                "Transit":          { icon: "🚌", color: "#6b7280" },
                "Shopping":         { icon: "🛍️", color: "#8b5cf6" },
                "Winnings":         { icon: "🏆", color: "#4ade80" },
              };
              const subTotals = Object.entries(tripSubCats).map(([sub, cfg]) => {
                const items = torontoTxns.filter(t => t.tripCat === sub);
                return { sub, cfg, total: items.reduce((s,t) => s+t.amount, 0), count: items.length, items };
              }).filter(s => s.count > 0);
              const grossTotal = torontoTxns.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
              const kaiReimbursement = torontoTxns.filter(t=>t.amount<0).reduce((s,t)=>s+t.amount,0);
              return (
                <div style={{background:"linear-gradient(135deg,rgba(245,158,11,0.12),rgba(239,68,68,0.08))",border:"1px solid rgba(245,158,11,0.25)",borderRadius:12,padding:"18px 20px",marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div>
                      <div style={{fontSize:18,fontWeight:700,marginBottom:4}}>🏙️ GenAI Genesis Hackathon</div>
                      <div style={{fontSize:13,color:"#d1d5db"}}>Toronto · March 11–18, 2026</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:24,fontWeight:700,fontFamily:"'DM Mono',monospace",color:"#f59e0b"}}>{fmt(torontoTotal)}</div>
                      <div style={{fontSize:11,color:"#9ca3af"}}>{torontoTxns.length} transactions · net cost</div>
                    </div>
                  </div>
                  {kaiReimbursement<0&&(
                    <div style={{marginTop:10,background:"rgba(74,222,128,0.08)",border:"1px solid rgba(74,222,128,0.2)",borderRadius:8,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontSize:12,color:"#6ee7b7"}}>💸 Kai Song — parts reimbursement + hackathon winnings</div>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:12,color:"#6b7280",fontFamily:"'DM Mono',monospace"}}>Gross: {fmt(grossTotal)}</span>
                        <span style={{fontSize:13,fontWeight:700,fontFamily:"'DM Mono',monospace",color:"#4ade80"}}>{fmt(kaiReimbursement)}</span>
                      </div>
                    </div>
                  )}

                  {/* Clickable sub-category cards */}
                  <div style={{marginTop:14}}>
                    {subTotals.map(({sub, cfg, total, count, items}) => {
                      const isOpen = expandedTripCat === sub;
                      return (
                        <div key={sub} style={{marginBottom:6}}>
                          <div onClick={()=>setExpandedTripCat(isOpen?null:sub)} style={{
                            background:isOpen?"rgba(0,0,0,0.25)":"rgba(0,0,0,0.15)",borderRadius:isOpen?"8px 8px 0 0":8,
                            padding:"12px 14px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",
                            border:isOpen?`1px solid ${cfg.color}44`:"1px solid transparent",borderBottom:isOpen?"none":undefined,
                            transition:"all 0.15s",
                          }}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <span style={{fontSize:16}}>{cfg.icon}</span>
                              <div>
                                <div style={{fontSize:13,fontWeight:600,color:"#d1d5db"}}>{sub}</div>
                                <div style={{fontSize:10,color:"#6b7280",marginTop:1}}>{count} item{count!==1?"s":""}</div>
                              </div>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <span style={{fontSize:16,fontWeight:700,fontFamily:"'DM Mono',monospace",color:total<0?"#4ade80":cfg.color}}>{fmt(total)}</span>
                              <span style={{fontSize:11,color:"#6b7280",transform:isOpen?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}>▼</span>
                            </div>
                          </div>
                          {isOpen&&(
                            <div style={{background:"rgba(0,0,0,0.2)",border:`1px solid ${cfg.color}44`,borderTop:"none",borderRadius:"0 0 8px 8px",padding:"4px 0"}}>
                              {items.sort((a,b)=>a.date.localeCompare(b.date)).map((t,i)=>(
                                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px 10px 44px",borderBottom:i<items.length-1?"1px solid rgba(255,255,255,0.03)":"none"}}>
                                  <div style={{flex:1,minWidth:0}}>
                                    <div style={{fontSize:13,color:"#d1d5db",display:"flex",alignItems:"center"}}>
                                      <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.desc}</span>
                                      {srcBadge(t.src)}
                                      {t.amount<0&&<span style={{fontSize:9,fontWeight:600,letterSpacing:0.5,padding:"2px 5px",borderRadius:4,marginLeft:4,background:"rgba(74,222,128,0.15)",color:"#4ade80",flexShrink:0}}>CREDIT</span>}
                                    </div>
                                    <div style={{fontSize:11,color:"#6b7280",fontFamily:"'DM Mono',monospace",marginTop:2}}>{fmtDate(t.date)}</div>
                                  </div>
                                  <div style={{fontSize:13,fontWeight:600,fontFamily:"'DM Mono',monospace",color:t.amount<0?"#4ade80":"#e8eaed",whiteSpace:"nowrap",marginLeft:12}}>{fmt(t.amount)}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* BearHacks content — empty for now */}
            {activeHackathon==="bearhacks"&&(
              <div style={{background:"linear-gradient(135deg,rgba(139,92,246,0.08),rgba(99,102,241,0.04))",border:"1px solid rgba(139,92,246,0.2)",borderRadius:12,padding:"32px 20px",textAlign:"center",marginBottom:16}}>
                <div style={{fontSize:32,marginBottom:8}}>🐻</div>
                <div style={{fontSize:18,fontWeight:700,marginBottom:4}}>BearHacks — Mississauga</div>
                <div style={{fontSize:13,color:"#9ca3af"}}>No expenses added yet</div>
                <div style={{fontSize:11,color:"#6b7280",marginTop:8}}>Add transactions with cat: "BearHacks" to see them here</div>
              </div>
            )}
          </div>
        );
      })()}

      {/* GRAND TOTAL + EDIT BUTTON */}
      {activeTab!=="hackathons"&&(
        <div style={{maxWidth:720,margin:"0 auto 12px"}}>
          <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:12,color:"#6b7280",fontWeight:500}}>
                {activeTab==="all"?"TOTAL SPENDING":MONTH_LABELS[activeTab]?.toUpperCase()+" TOTAL"}{giftAmt>0?" (excl. gifts)":""}
              </div>
              <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>{filtered.length} transactions · net of refunds</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:26,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{fmt(grandTotal - giftAmt)}</div>
              <button onClick={()=>setShowEditPanel(true)} style={{
                background:"rgba(99,102,241,0.12)",border:"1px solid rgba(99,102,241,0.3)",borderRadius:8,padding:"6px 10px",
                color:"#a5b4fc",fontSize:16,cursor:"pointer",fontFamily:"inherit",lineHeight:1}} title="Edit category amounts">✎</button>
            </div>
          </div>
          {giftAmt>0&&(
            <div style={{marginTop:8,background:"rgba(201,80,138,0.08)",border:"1px solid rgba(201,80,138,0.2)",borderRadius:10,padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:12,color:"#f9a8d4"}}>🎁 Christmas gift (Sephora) — not included in total above</div>
              <div style={{fontSize:14,fontWeight:600,fontFamily:"'DM Mono',monospace",color:"#f9a8d4"}}>{fmt(giftAmt)}</div>
            </div>
          )}
        </div>
      )}

      {/* CATEGORY BREAKDOWN */}
      <div style={{maxWidth:720,margin:"0 auto"}}>
        {catTotals.map(({cat,total,count,txns})=>{
          const cfg=CAT_CONFIG[cat]||{icon:"•",color:"#6b7280"};
          const isOpen=expandedCat===cat;
          const pct=grandTotal>0?Math.max(0,(total/grandTotal)*100):0;
          return (
            <div key={cat} style={{marginBottom:8}}>
              <div onClick={()=>setExpandedCat(isOpen?null:cat)} style={{
                width:"100%",background:"rgba(255,255,255,0.03)",
                border:isOpen?`1px solid ${cfg.color}44`:"1px solid rgba(255,255,255,0.05)",
                borderRadius:isOpen?"12px 12px 0 0":12,padding:"14px 16px",cursor:"pointer",textAlign:"left",
                display:"flex",alignItems:"center",gap:12,fontFamily:"inherit",color:"#e8eaed",transition:"all 0.15s",boxSizing:"border-box"
              }}>
                <span style={{fontSize:20,width:32,textAlign:"center",flexShrink:0}}>{cfg.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:14,fontWeight:600}}>{cat}</span>
                    <span style={{fontSize:15,fontWeight:700,fontFamily:"'DM Mono',monospace",color:total<0?"#4ade80":"#e8eaed",flexShrink:0,marginLeft:8}}>{fmt(total)}</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}>
                    <div style={{flex:1,height:4,background:"rgba(255,255,255,0.06)",borderRadius:2,marginRight:12,overflow:"hidden"}}>
                      <div style={{width:`${Math.min(pct,100)}%`,height:"100%",background:cfg.color,borderRadius:2,transition:"width 0.4s"}}/>
                    </div>
                    <span style={{fontSize:11,color:"#6b7280",whiteSpace:"nowrap"}}>{count} txn{count!==1?"s":""} · {pct.toFixed(1)}%</span>
                  </div>
                </div>
                <span style={{fontSize:12,color:"#6b7280",transform:isOpen?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s",flexShrink:0}}>▼</span>
              </div>
              {isOpen&&(
                <div style={{background:"rgba(255,255,255,0.02)",border:`1px solid ${cfg.color}44`,borderTop:"none",borderRadius:"0 0 12px 12px",padding:"4px 0",maxHeight:400,overflowY:"auto"}}>
                  {txns.sort((a,b)=>a.date.localeCompare(b.date)).map((t,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px 10px 60px",borderBottom:i<txns.length-1?"1px solid rgba(255,255,255,0.03)":"none"}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,color:"#d1d5db",display:"flex",alignItems:"center"}}>
                          <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.desc}</span>
                          {srcBadge(t.src)}
                          {t.gift&&<span style={{fontSize:9,fontWeight:600,letterSpacing:0.5,padding:"2px 5px",borderRadius:4,marginLeft:4,background:"rgba(201,80,138,0.2)",color:"#f9a8d4",flexShrink:0}}>🎁 GIFT</span>}
                          {t.amount<0&&<span style={{fontSize:9,fontWeight:600,letterSpacing:0.5,padding:"2px 5px",borderRadius:4,marginLeft:4,background:"rgba(74,222,128,0.15)",color:"#4ade80",flexShrink:0}}>REFUND</span>}
                          {t.tripCat&&<span style={{fontSize:9,fontWeight:600,letterSpacing:0.5,padding:"2px 5px",borderRadius:4,marginLeft:4,flexShrink:0,
                            background:t.tripCat==="Parts & Supplies"?"rgba(255,153,0,0.15)":t.tripCat==="Food & Drinks"?"rgba(212,160,23,0.15)":t.tripCat==="Transit"?"rgba(107,114,128,0.15)":"rgba(139,92,246,0.15)",
                            color:t.tripCat==="Parts & Supplies"?"#ff9900":t.tripCat==="Food & Drinks"?"#d4a017":t.tripCat==="Transit"?"#9ca3af":"#a78bfa",
                          }}>{t.tripCat}</span>}
                          {t.projCat&&(()=>{const pc=PROJ_SUBCAT_CONFIG[t.projCat]||{icon:"•",color:"#6b7280",label:t.projCat};return(
                            <span style={{fontSize:9,fontWeight:600,letterSpacing:0.5,padding:"2px 5px",borderRadius:4,marginLeft:4,flexShrink:0,
                              background:`${pc.color}20`,color:pc.color,
                            }}>{pc.icon} {pc.label}</span>
                          );})()}
                        </div>
                        <div style={{fontSize:11,color:"#6b7280",fontFamily:"'DM Mono',monospace",marginTop:2}}>
                          {fmtDate(t.date)}{t.gift?" · Christmas gift":""}
                        </div>
                      </div>
                      <div style={{fontSize:13,fontWeight:600,fontFamily:"'DM Mono',monospace",color:t.amount<0?"#4ade80":"#e8eaed",whiteSpace:"nowrap",marginLeft:12}}>{fmt(t.amount)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* GAS & FOOD CARDS */}
      {activeTab==="all"&&(
        <div style={{maxWidth:720,margin:"24px auto 0",display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {["Gas","Food & Dining"].map(key=>{
            const txns=ALL_TRANSACTIONS.filter(t=>t.cat===key);
            const total=txns.reduce((s,t)=>s+t.amount,0);
            const pos=txns.filter(t=>t.amount>0);
            const cfg=CAT_CONFIG[key];
            return (
              <div key={key} style={{background:`linear-gradient(135deg,${cfg.color}18,rgba(0,0,0,0))`,border:`1px solid ${cfg.color}30`,borderRadius:12,padding:"16px 18px"}}>
                <div style={{fontSize:12,color:"#9ca3af",fontWeight:500,marginBottom:4}}>{cfg.icon} {key.toUpperCase()} TOTAL</div>
                <div style={{fontSize:22,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{fmt(total)}</div>
                <div style={{fontSize:11,color:"#6b7280",marginTop:4}}>{pos.length} visits · avg {fmt(pos.reduce((s,t)=>s+t.amount,0)/pos.length)}/ea</div>
              </div>
            );
          })}
        </div>
      )}

      {/* FEES CALLOUT */}
      {activeTab==="all"&&(()=>{
        const ft=ALL_TRANSACTIONS.filter(t=>t.cat==="Fees & Interest");
        const feeTotal=ft.reduce((s,t)=>s+t.amount,0);
        return feeTotal>0?(
          <div style={{maxWidth:720,margin:"12px auto 0",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:12,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:12,color:"#fca5a5",fontWeight:600}}>⚠️ TOTAL FEES & INTEREST</div>
              <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>NSF, overdraft, returned payment, interest</div>
            </div>
            <div style={{fontSize:20,fontWeight:700,fontFamily:"'DM Mono',monospace",color:"#fca5a5"}}>{fmt(feeTotal)}</div>
          </div>
        ):null;
      })()}

      <div style={{maxWidth:720,margin:"20px auto 0",textAlign:"center",fontSize:11,color:"#4b5563"}}>
        Tap any category to expand · <span style={{background:"rgba(37,99,235,0.15)",color:"#60a5fa",padding:"1px 5px",borderRadius:3,fontSize:9,fontWeight:600}}>VISA</span> / <span style={{background:"rgba(16,185,129,0.15)",color:"#6ee7b7",padding:"1px 5px",borderRadius:3,fontSize:9,fontWeight:600}}>DEBIT</span> show source
      </div>

      {/* ========== SUMMARY POPUP ========== */}
      {showSummary && (()=>{
        const summaryLabel = activeTab === "all" ? "All Months (Nov 2025 – Apr 2026)"
          : activeTab === "hackathons" ? (activeHackathon === "genai" ? "GenAI Genesis Hackathon · Toronto" : "BearHacks · Mississauga")
          : MONTH_LABELS[activeTab] || activeTab;
        const summaryTotal = catTotals.reduce((s,c) => s + c.total, 0);
        const summaryGift = filtered.filter(t => t.gift).reduce((s,t) => s + t.amount, 0);
        return (
          <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",justifyContent:"center",alignItems:"center",padding:16}} onClick={()=>setShowSummary(false)}>
            <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(6px)"}}/>
            <div onClick={e=>e.stopPropagation()} style={{
              position:"relative",width:summaryWidth,minWidth:320,maxWidth:"95vw",background:"#1a1f2e",
              borderRadius:16,border:"1px solid rgba(255,255,255,0.1)",overflow:"visible",
              boxShadow:"0 8px 48px rgba(0,0,0,0.5)",animation:"fadeUp 0.2s ease-out",
            }}>
              <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
              <div
                style={{position:"absolute",left:-4,top:0,bottom:0,width:8,cursor:"ew-resize",zIndex:10}}
                onMouseDown={e=>{e.preventDefault();const sX=e.clientX,sW=summaryWidth;const mv=ev=>setSummaryWidth(Math.max(320,Math.min(window.innerWidth*0.95,sW-(ev.clientX-sX)*2)));const up=()=>{document.removeEventListener("mousemove",mv);document.removeEventListener("mouseup",up);};document.addEventListener("mousemove",mv);document.addEventListener("mouseup",up);}}
              ><div style={{position:"absolute",left:3,top:"50%",transform:"translateY(-50%)",width:2,height:40,borderRadius:1,background:"rgba(255,255,255,0.15)"}}/></div>
              <div
                style={{position:"absolute",right:-4,top:0,bottom:0,width:8,cursor:"ew-resize",zIndex:10}}
                onMouseDown={e=>{e.preventDefault();const sX=e.clientX,sW=summaryWidth;const mv=ev=>setSummaryWidth(Math.max(320,Math.min(window.innerWidth*0.95,sW+(ev.clientX-sX)*2)));const up=()=>{document.removeEventListener("mousemove",mv);document.removeEventListener("mouseup",up);};document.addEventListener("mousemove",mv);document.addEventListener("mouseup",up);}}
              ><div style={{position:"absolute",right:3,top:"50%",transform:"translateY(-50%)",width:2,height:40,borderRadius:1,background:"rgba(255,255,255,0.15)"}}/></div>
              <div style={{borderRadius:16,overflow:"hidden"}}>
                <div style={{padding:"18px 20px 14px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontSize:16,fontWeight:700}}>Spending Summary</div>
                      <div style={{fontSize:12,color:"#9ca3af",marginTop:2}}>{summaryLabel}</div>
                    </div>
                    <button onClick={()=>setShowSummary(false)} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"5px 10px",color:"#9ca3af",fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
                  </div>
                  <div style={{marginTop:12,background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:12,color:"#6b7280",fontWeight:500}}>TOTAL{summaryGift > 0 ? " (excl. gift)" : ""}</span>
                    <span style={{fontSize:20,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{fmt(summaryTotal - summaryGift)}</span>
                  </div>
                </div>
                <div style={{padding:"8px 20px 18px",maxHeight:"55vh",overflowY:"auto"}}>
                  {catTotals.map(({cat, total}) => {
                    const cfg = CAT_CONFIG[cat] || {icon:"•",color:"#6b7280"};
                    const noteKey = `${activeTab}::${cat}`;
                    const isNoteOpen = openNotes[noteKey];
                    const noteText = catNotes[noteKey] || "";
                    const wideMode = summaryWidth > 550;
                    return (
                      <div key={cat} style={{borderBottom:"1px solid rgba(255,255,255,0.04)",padding:"10px 0"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:15,flexShrink:0}}>{cfg.icon}</span>
                          <span style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0,flex:wideMode?"0 0 auto":"1"}}>{cat}</span>
                          <span style={{fontSize:14,fontWeight:700,fontFamily:"'DM Mono',monospace",color:total<0?"#4ade80":"#e8eaed",flexShrink:0,marginRight:wideMode?8:0}}>{fmt(total)}</span>
                          {wideMode && (<>
                            {isNoteOpen ? (
                              <input type="text" value={noteText} onChange={e => setCatNotes(prev => ({...prev, [noteKey]: e.target.value}))} placeholder="Add a note..." autoFocus
                                style={{flex:1,minWidth:80,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(37,99,235,0.3)",borderRadius:6,padding:"5px 8px",color:"#d1d5db",fontSize:12,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
                            ) : noteText ? (
                              <span style={{flex:1,fontSize:11,color:"#9ca3af",fontStyle:"italic",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:40}}>{noteText}</span>
                            ) : <span style={{flex:1}}/>}
                          </>)}
                          <button onClick={()=>setOpenNotes(prev=>({...prev,[noteKey]:!prev[noteKey]}))} style={{
                            width:24,height:24,borderRadius:6,border:"none",cursor:"pointer",
                            background: isNoteOpen ? "rgba(37,99,235,0.2)" : noteText ? "rgba(37,99,235,0.15)" : "rgba(255,255,255,0.06)",
                            color: isNoteOpen ? "#60a5fa" : noteText ? "#60a5fa" : "#6b7280",
                            fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",lineHeight:1,flexShrink:0,
                          }} title={noteText ? "Edit note" : "Add note"}>
                            {noteText && !isNoteOpen ? "✎" : isNoteOpen ? "−" : "+"}
                          </button>
                        </div>
                        {!wideMode && !isNoteOpen && noteText && <div style={{fontSize:11,color:"#9ca3af",marginTop:4,marginLeft:23,fontStyle:"italic"}}>{noteText}</div>}
                        {!wideMode && isNoteOpen && (
                          <div style={{marginTop:8,marginLeft:23}}>
                            <textarea value={noteText} onChange={e => setCatNotes(prev => ({...prev, [noteKey]: e.target.value}))} placeholder="Add a note..." rows={2} autoFocus
                              style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(37,99,235,0.3)",borderRadius:8,padding:"8px 10px",color:"#d1d5db",fontSize:12,fontFamily:"inherit",resize:"vertical",outline:"none",lineHeight:1.4,boxSizing:"border-box"}}/>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {summaryGift > 0 && (
                    <div style={{padding:"10px 0",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12,color:"#f9a8d4"}}>
                      <span>🎁 Christmas gift (excluded above)</span>
                      <span style={{fontFamily:"'DM Mono',monospace",fontWeight:600}}>{fmt(summaryGift)}</span>
                    </div>
                  )}
                </div>
                <div style={{padding:"6px 0",textAlign:"center",fontSize:10,color:"#4b5563",borderTop:"1px solid rgba(255,255,255,0.04)"}}>↔ Drag edges to resize</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========== EDIT POPUP PANEL ========== */}
      {showEditPanel && (
        <div style={{position:"fixed",inset:0,zIndex:100,display:"flex",justifyContent:"flex-end"}} onClick={()=>setShowEditPanel(false)}>
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)"}}/>
          <div onClick={e=>e.stopPropagation()} style={{
            position:"relative",width:"100%",maxWidth:380,background:"#1a1f2e",borderLeft:"1px solid rgba(255,255,255,0.1)",
            overflowY:"auto",padding:"24px 20px",boxShadow:"-8px 0 32px rgba(0,0,0,0.4)",animation:"slideIn 0.2s ease-out",
          }}>
            <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h2 style={{fontSize:18,fontWeight:700,margin:0}}>✎ Edit Amounts</h2>
              <div style={{display:"flex",gap:8}}>
                {hasAnyOverride&&<button onClick={()=>{setOverrides({});setResetCount(c=>c+1);}} style={{background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,padding:"6px 12px",color:"#fca5a5",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>↺ Reset All</button>}
                <button onClick={()=>setShowEditPanel(false)} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"6px 12px",color:"#9ca3af",fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
              </div>
            </div>
            <div style={{fontSize:12,color:"#6b7280",marginBottom:16}}>Editing: <strong style={{color:"#d1d5db"}}>{activeTab==="all"?"All Months":MONTH_LABELS[activeTab]||activeTab}</strong></div>
            {catTotals.map(({cat,total,originalTotal,hasOverride})=>{
              const cfg=CAT_CONFIG[cat]||{icon:"•",color:"#6b7280"};
              const overrideKey=`${activeTab}::${cat}`;
              return (
                <div key={cat} style={{marginBottom:10,background:hasOverride?"rgba(99,102,241,0.08)":"rgba(255,255,255,0.03)",border:hasOverride?"1px solid rgba(99,102,241,0.2)":"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"12px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <span style={{fontSize:16}}>{cfg.icon}</span>
                    <span style={{fontSize:13,fontWeight:600,flex:1}}>{cat}</span>
                    {hasOverride&&<button onClick={()=>{setOverrides(prev=>{const n={...prev};delete n[overrideKey];return n;});setResetCount(c=>c+1);}} style={{background:"none",border:"none",color:"#6b7280",cursor:"pointer",fontSize:12,padding:"2px 4px",fontFamily:"inherit"}}>↺</button>}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:14,color:"#6b7280",fontFamily:"'DM Mono',monospace"}}>$</span>
                    <input type="number" step="0.01" key={`${overrideKey}-${resetCount}`} defaultValue={total.toFixed(2)}
                      onChange={e=>{const val=parseFloat(e.target.value);if(!isNaN(val)){if(Math.abs(val-originalTotal)>0.005){setOverrides(prev=>({...prev,[overrideKey]:val}));}else{setOverrides(prev=>{const n={...prev};delete n[overrideKey];return n;});}}}}
                      onKeyDown={e=>{if(e.key==="Enter")e.target.blur();}}
                      style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:6,padding:"8px 10px",color:"#e8eaed",fontSize:15,fontWeight:700,fontFamily:"'DM Mono',monospace",outline:"none",width:"100%",boxSizing:"border-box"}}/>
                  </div>
                  {hasOverride&&<div style={{fontSize:10,color:"#6b7280",marginTop:6}}>Original: {fmt(originalTotal)} · Diff: <span style={{color:total>originalTotal?"#fca5a5":"#4ade80"}}>{total>originalTotal?"+":""}{fmt(total-originalTotal)}</span></div>}
                </div>
              );
            })}
            <div style={{marginTop:16,padding:"14px",background:"rgba(255,255,255,0.04)",borderRadius:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,fontWeight:600}}>Adjusted Total</span>
              <span style={{fontSize:20,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{fmt(grandTotal - giftAmt)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
