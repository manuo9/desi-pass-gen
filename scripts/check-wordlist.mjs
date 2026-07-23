// Build-time guard: fail loudly if the Hinglish word list is missing,
// malformed, too small, or contains duplicate/invalid entries, rather
// than silently shipping a broken or weak generator.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wordlistPath = path.join(__dirname, "..", "src", "data", "wordlist.json");

const MIN_WORDS = 300;

function fail(message) {
  console.error(`\n❌ wordlist check failed: ${message}\n`);
  process.exit(1);
}

let raw;
try {
  raw = readFileSync(wordlistPath, "utf-8");
} catch (err) {
  fail(`could not read ${wordlistPath}: ${err.message}`);
}

let data;
try {
  data = JSON.parse(raw);
} catch (err) {
  fail(`invalid JSON in wordlist.json: ${err.message}`);
}

if (!Array.isArray(data)) {
  fail("wordlist.json must be a JSON array");
}

if (data.length < MIN_WORDS) {
  fail(`wordlist has only ${data.length} entries, minimum is ${MIN_WORDS}`);
}

const seen = new Set();
const problems = [];

for (const entry of data) {
  if (typeof entry !== "string") {
    problems.push(`malformed entry: ${JSON.stringify(entry)}`);
    continue;
  }
  if (entry.length < 3 || entry.length > 10) {
    problems.push(`word "${entry}" is outside the 3-10 char range`);
  }
  if (seen.has(entry)) {
    problems.push(`duplicate word: "${entry}"`);
  }
  seen.add(entry);
}

if (problems.length > 0) {
  fail(`${problems.length} issue(s) found:\n  - ${problems.join("\n  - ")}`);
}

console.log(
  `✅ wordlist check passed: ${data.length} unique, valid words.`
);
