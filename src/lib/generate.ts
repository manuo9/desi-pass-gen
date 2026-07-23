/**
 * Core passphrase generation logic for Desi Pass Gen.
 *
 * Pure functions, no DOM dependencies — safe to unit test and safe to
 * reason about in isolation. Everything here runs 100% client-side; no
 * function in this file makes a network request.
 *
 * Security note: we deliberately use `crypto.getRandomValues` (the Web
 * Crypto API's CSPRNG) and never `Math.random()`. `Math.random()` is not
 * cryptographically secure and must never be used for anything
 * password/passphrase-adjacent.
 */

export type Separator = "-" | "_" | " " | "";

export type Capitalization =
  | "sentence"
  | "lower"
  | "title"
  | "upper"
  | "random";

export interface GenerateOptions {
  /** Number of words in the passphrase. Recommended range: 3-8. */
  wordCount: number;
  separator: Separator;
  capitalization: Capitalization;
  /** Append a random number 0-99 to the end of the passphrase. */
  includeNumber: boolean;
  /** Append a random symbol from SYMBOL_SET to the end of the passphrase. */
  includeSymbol: boolean;
}

export type StrengthLabel = "Weak" | "Good" | "Strong" | "Very Strong";

export interface GenerateResult {
  passphrase: string;
  entropyBits: number;
  strengthLabel: StrengthLabel;
  wordsUsed: string[];
}

/** Fixed symbol set used for the optional trailing symbol. Kept small and
 * unambiguous (no quote/backslash characters that cause escaping issues
 * when pasted into shells, JSON, or forms). */
export const SYMBOL_SET = ["!", "@", "#", "$", "%", "&", "*", "?"] as const;

export const DEFAULT_OPTIONS: GenerateOptions = {
  wordCount: 6,
  separator: "-",
  capitalization: "sentence",
  includeNumber: true,
  includeSymbol: false,
};

export const MIN_WORD_COUNT = 3;
export const MAX_WORD_COUNT = 8;

/** Thrown when the environment lacks a cryptographically secure RNG. We
 * intentionally do NOT fall back to Math.random() — callers must surface
 * this to the user instead of silently generating weaker output. */
export class InsecureRandomnessUnavailableError extends Error {
  constructor() {
    super(
      "A cryptographically secure random number generator is not " +
        "available in this browser. Refusing to generate a passphrase " +
        "using an insecure fallback."
    );
    this.name = "InsecureRandomnessUnavailableError";
  }
}

/** Feature-detect the Web Crypto API. Call this before generating so the
 * UI can show a clear error state instead of throwing mid-interaction. */
export function isSecureRandomAvailable(): boolean {
  return (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.getRandomValues === "function"
  );
}

/**
 * Returns a cryptographically secure, unbiased random integer in
 * [0, max). Uses rejection sampling over crypto.getRandomValues so every
 * integer in range has exactly equal probability — a naive
 * `randomByte % max` would be biased whenever max does not evenly divide
 * 256 (or the chosen byte range).
 */
export function secureRandomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0) {
    throw new RangeError("max must be a positive integer");
  }
  if (!isSecureRandomAvailable()) {
    throw new InsecureRandomnessUnavailableError();
  }
  if (max === 1) {
    return 0;
  }

  // Determine the smallest number of bytes that can represent `max - 1`,
  // then compute the largest multiple of `max` that fits in that byte
  // range so we can reject draws that would introduce bias.
  const bitsNeeded = Math.ceil(Math.log2(max));
  const bytesNeeded = Math.max(1, Math.ceil(bitsNeeded / 8));
  const range = 256 ** bytesNeeded;
  const rejectionThreshold = range - (range % max);

  const buffer = new Uint8Array(bytesNeeded);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    globalThis.crypto.getRandomValues(buffer);
    let value = 0;
    for (let i = 0; i < bytesNeeded; i++) {
      value = value * 256 + buffer[i];
    }
    if (value < rejectionThreshold) {
      return value % max;
    }
    // else: reject and redraw (keeps distribution perfectly uniform)
  }
}

/**
 * Picks `count` words from the list using secureRandomInt, with
 * replacement (repeats are allowed). This matches the standard
 * Diceware/EFF entropy model of log2(N) bits of independent entropy per
 * word, and keeps the math simple and verifiably correct. Collision
 * likelihood at 300+ words across a handful of draws is negligible.
 */
export function pickWords(words: string[], count: number): string[] {
  if (words.length === 0) {
    throw new Error("Word list is empty");
  }
  const picked: string[] = [];
  for (let i = 0; i < count; i++) {
    const index = secureRandomInt(words.length);
    picked.push(words[index]);
  }
  return picked;
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function applyCapitalization(
  word: string,
  style: Capitalization,
  wordIndex: number
): string {
  switch (style) {
    case "sentence":
      // Only the very first word is capitalized; every other word is
      // lowercase. Easiest to type (minimal shift usage) while still
      // satisfying "must contain at least one uppercase letter" rules
      // that some sites enforce.
      return wordIndex === 0 ? capitalize(word) : word.toLowerCase();
    case "title":
      return capitalize(word);
    case "lower":
      return word.toLowerCase();
    case "upper":
      return word.toUpperCase();
    case "random": {
      // Deterministic-looking per call but still uses secure randomness;
      // alternates via a coin flip per word so output isn't predictable.
      const flip = secureRandomInt(2);
      return flip === 0 ? capitalize(word) : word.toLowerCase();
    }
    default:
      return word;
  }
}

/**
 * Computes total entropy in bits for a given configuration.
 *
 * baseEntropy = wordCount * log2(wordListLength)
 * numberEntropy = log2(100) if a 0-99 number suffix is included
 * symbolEntropy = log2(SYMBOL_SET.length) if a symbol suffix is included
 *
 * Reads wordListLength as a parameter (not a hardcoded constant) so this
 * calculation automatically stays correct as the word list grows from
 * ~300 words toward 2048+ without any code changes.
 */
export function calculateEntropy(
  wordListLength: number,
  wordCount: number,
  includeNumber: boolean,
  includeSymbol: boolean
): number {
  if (wordListLength <= 1 || wordCount <= 0) {
    return 0;
  }
  const baseEntropy = wordCount * Math.log2(wordListLength);
  const numberEntropy = includeNumber ? Math.log2(100) : 0;
  const symbolEntropy = includeSymbol ? Math.log2(SYMBOL_SET.length) : 0;
  return baseEntropy + numberEntropy + symbolEntropy;
}

/**
 * Maps an entropy value (bits) to a human-readable strength label.
 * Thresholds: <40 Weak, 40-59 Good, 60-79 Strong, 80+ Very Strong.
 */
export function strengthLabel(bits: number): StrengthLabel {
  if (bits < 40) return "Weak";
  if (bits < 60) return "Good";
  if (bits < 80) return "Strong";
  return "Very Strong";
}

/**
 * Generates a full passphrase result: the formatted string, its entropy,
 * strength label, and the raw words used (useful for tests/debugging).
 */
export function generatePassphrase(
  words: string[],
  options: GenerateOptions = DEFAULT_OPTIONS
): GenerateResult {
  const wordCount = Math.min(
    MAX_WORD_COUNT,
    Math.max(MIN_WORD_COUNT, options.wordCount)
  );

  const rawWords = pickWords(words, wordCount);
  const formattedWords = rawWords.map((word, index) =>
    applyCapitalization(word, options.capitalization, index)
  );

  const parts: string[] = [...formattedWords];

  if (options.includeNumber) {
    parts.push(String(secureRandomInt(100)));
  }
  if (options.includeSymbol) {
    parts.push(SYMBOL_SET[secureRandomInt(SYMBOL_SET.length)]);
  }

  const passphrase = parts.join(options.separator);

  const entropyBits = calculateEntropy(
    words.length,
    wordCount,
    options.includeNumber,
    options.includeSymbol
  );

  return {
    passphrase,
    entropyBits,
    strengthLabel: strengthLabel(entropyBits),
    wordsUsed: rawWords,
  };
}
