import { describe, it, expect } from "vitest";
import {
  secureRandomInt,
  pickWords,
  applyCapitalization,
  calculateEntropy,
  strengthLabel,
  generatePassphrase,
  isSecureRandomAvailable,
  SYMBOL_SET,
} from "./generate";

const sampleWords: string[] = [
  "chai",
  "yaar",
  "mast",
  "chalo",
  "baarish",
  "jugaad",
];

describe("isSecureRandomAvailable", () => {
  it("returns true in this test environment (Node webcrypto)", () => {
    expect(isSecureRandomAvailable()).toBe(true);
  });
});

describe("secureRandomInt", () => {
  it("throws on non-positive or non-integer max", () => {
    expect(() => secureRandomInt(0)).toThrow(RangeError);
    expect(() => secureRandomInt(-5)).toThrow(RangeError);
    expect(() => secureRandomInt(1.5)).toThrow(RangeError);
  });

  it("returns 0 when max is 1", () => {
    expect(secureRandomInt(1)).toBe(0);
  });

  it("always returns a value within [0, max)", () => {
    const max = 7;
    for (let i = 0; i < 500; i++) {
      const value = secureRandomInt(max);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(max);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it("covers the full range for a large max without obvious bias", () => {
    const max = 300; // matches starter word list size
    const counts = new Array(max).fill(0);
    const samples = 30000;
    for (let i = 0; i < samples; i++) {
      counts[secureRandomInt(max)]++;
    }
    const expected = samples / max;
    // Loose sanity bound: no bucket should be wildly off from expected
    // (this is a smoke test, not a rigorous statistical test).
    for (const count of counts) {
      expect(count).toBeGreaterThan(expected * 0.5);
      expect(count).toBeLessThan(expected * 1.5);
    }
  });

  it("works correctly at a non-power-of-two boundary (max=list.length)", () => {
    const max = sampleWords.length; // 6
    for (let i = 0; i < 200; i++) {
      const value = secureRandomInt(max);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(max);
    }
  });
});

describe("pickWords", () => {
  it("throws on an empty word list", () => {
    expect(() => pickWords([], 3)).toThrow();
  });

  it("returns the requested number of words, each present in the list", () => {
    const picked = pickWords(sampleWords, 5);
    expect(picked).toHaveLength(5);
    for (const word of picked) {
      expect(sampleWords).toContain(word);
    }
  });
});

describe("applyCapitalization", () => {
  it("title-cases a word", () => {
    expect(applyCapitalization("chai", "title", 0)).toBe("Chai");
  });

  it("lowercases a word", () => {
    expect(applyCapitalization("CHAI", "lower", 0)).toBe("chai");
  });

  it("uppercases a word", () => {
    expect(applyCapitalization("chai", "upper", 0)).toBe("CHAI");
  });

  it("random style produces either title or lower case", () => {
    for (let i = 0; i < 50; i++) {
      const result = applyCapitalization("chai", "random", 0);
      expect(["Chai", "chai"]).toContain(result);
    }
  });

  describe("sentence case", () => {
    it("capitalizes only the first word", () => {
      expect(applyCapitalization("chai", "sentence", 0)).toBe("Chai");
    });

    it("lowercases every word after the first", () => {
      expect(applyCapitalization("CHAI", "sentence", 1)).toBe("chai");
      expect(applyCapitalization("Yaar", "sentence", 2)).toBe("yaar");
      expect(applyCapitalization("MAST", "sentence", 5)).toBe("mast");
    });
  });
});

describe("calculateEntropy", () => {
  it("computes base entropy correctly with no extras", () => {
    // log2(300) * 6 words
    const bits = calculateEntropy(300, 6, false, false);
    const expected = 6 * Math.log2(300);
    expect(bits).toBeCloseTo(expected, 5);
  });

  it("adds number entropy (log2(100)) when includeNumber is true", () => {
    const withNumber = calculateEntropy(300, 6, true, false);
    const without = calculateEntropy(300, 6, false, false);
    expect(withNumber - without).toBeCloseTo(Math.log2(100), 5);
  });

  it("adds symbol entropy (log2(SYMBOL_SET.length)) when includeSymbol is true", () => {
    const withSymbol = calculateEntropy(300, 6, false, true);
    const without = calculateEntropy(300, 6, false, false);
    expect(withSymbol - without).toBeCloseTo(Math.log2(SYMBOL_SET.length), 5);
  });

  it("returns 0 for degenerate inputs", () => {
    expect(calculateEntropy(1, 6, false, false)).toBe(0);
    expect(calculateEntropy(300, 0, false, false)).toBe(0);
  });

  it("scales automatically as word list length grows (no hardcoding)", () => {
    const small = calculateEntropy(300, 6, false, false);
    const large = calculateEntropy(2048, 6, false, false);
    expect(large).toBeGreaterThan(small);
  });
});

describe("strengthLabel", () => {
  it("labels boundary values correctly", () => {
    expect(strengthLabel(39)).toBe("Weak");
    expect(strengthLabel(40)).toBe("Good");
    expect(strengthLabel(59)).toBe("Good");
    expect(strengthLabel(60)).toBe("Strong");
    expect(strengthLabel(79)).toBe("Strong");
    expect(strengthLabel(80)).toBe("Very Strong");
  });
});

describe("generatePassphrase", () => {
  it("uses sentence case by default (first word capitalized, rest lowercase)", () => {
    const result = generatePassphrase(sampleWords, {
      wordCount: 4,
      separator: "-",
      capitalization: "sentence",
      includeNumber: false,
      includeSymbol: false,
    });
    const generatedWords = result.passphrase.split("-");
    expect(generatedWords[0][0]).toBe(generatedWords[0][0].toUpperCase());
    for (const word of generatedWords.slice(1)) {
      expect(word).toBe(word.toLowerCase());
    }
  });

  it("respects the separator option", () => {
    const result = generatePassphrase(sampleWords, {
      wordCount: 4,
      separator: "_",
      capitalization: "lower",
      includeNumber: false,
      includeSymbol: false,
    });
    expect(result.passphrase).toContain("_");
    expect(result.passphrase.split("_")).toHaveLength(4);
  });

  it("clamps word count into [3, 8]", () => {
    const tooFew = generatePassphrase(sampleWords, {
      wordCount: 1,
      separator: "-",
      capitalization: "title",
      includeNumber: false,
      includeSymbol: false,
    });
    expect(tooFew.wordsUsed).toHaveLength(3);

    const tooMany = generatePassphrase(sampleWords, {
      wordCount: 20,
      separator: "-",
      capitalization: "title",
      includeNumber: false,
      includeSymbol: false,
    });
    expect(tooMany.wordsUsed).toHaveLength(8);
  });

  it("appends a number and symbol when requested", () => {
    const result = generatePassphrase(sampleWords, {
      wordCount: 3,
      separator: "-",
      capitalization: "title",
      includeNumber: true,
      includeSymbol: true,
    });
    const segments = result.passphrase.split("-");
    // 3 words + number + symbol = 5 segments
    expect(segments).toHaveLength(5);
    expect(segments[3]).toMatch(/^\d{1,2}$/);
    expect(SYMBOL_SET).toContain(segments[4]);
  });

  it("produces a strength label consistent with calculateEntropy", () => {
    const options = {
      wordCount: 6,
      separator: "-" as const,
      capitalization: "title" as const,
      includeNumber: true,
      includeSymbol: false,
    };
    const result = generatePassphrase(sampleWords, options);
    const expectedBits = calculateEntropy(
      sampleWords.length,
      6,
      true,
      false
    );
    expect(result.entropyBits).toBeCloseTo(expectedBits, 5);
    expect(result.strengthLabel).toBe(strengthLabel(expectedBits));
  });
});
