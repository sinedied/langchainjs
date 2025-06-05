import { test, expect } from "@jest/globals";
import { secureHash, insecureHash } from "../hash.js";

test("secureHash produces consistent SHA3-256 output", () => {
  const input = "test string";
  const result1 = secureHash(input);
  const result2 = secureHash(input);
  
  // Should be consistent
  expect(result1).toBe(result2);
  
  // Should be a hex string of correct length (64 chars for SHA3-256)
  expect(result1).toMatch(/^[0-9a-f]{64}$/);
  
  // Should produce different output for different inputs
  const differentInput = "different string";
  const differentResult = secureHash(differentInput);
  expect(result1).not.toBe(differentResult);
});

test("insecureHash maintains backward compatibility (SHA1)", () => {
  const input = "test string";
  const result1 = insecureHash(input);
  const result2 = insecureHash(input);
  
  // Should be consistent
  expect(result1).toBe(result2);
  
  // Should be a hex string of correct length (40 chars for SHA1)
  expect(result1).toMatch(/^[0-9a-f]{40}$/);
  
  // Should produce different output for different inputs
  const differentInput = "different string";
  const differentResult = insecureHash(differentInput);
  expect(result1).not.toBe(differentResult);
});

test("secureHash and insecureHash produce different outputs", () => {
  const input = "test string";
  const secureResult = secureHash(input);
  const insecureResult = insecureHash(input);
  
  // They should produce different hashes since they use different algorithms
  expect(secureResult).not.toBe(insecureResult);
  
  // Different lengths too
  expect(secureResult.length).toBe(64); // SHA3-256
  expect(insecureResult.length).toBe(40); // SHA1
});

test("empty string hashing", () => {
  const secureEmpty = secureHash("");
  const insecureEmpty = insecureHash("");
  
  expect(secureEmpty).toMatch(/^[0-9a-f]{64}$/);
  expect(insecureEmpty).toMatch(/^[0-9a-f]{40}$/);
  
  // Known SHA3-256 hash of empty string
  expect(secureEmpty).toBe("a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a");
  
  // Known SHA1 hash of empty string
  expect(insecureEmpty).toBe("da39a3ee5e6b4b0d3255bfef95601890afd80709");
});

test("unicode string hashing", () => {
  const unicodeInput = "Hello 世界 🌍";
  const secureResult = secureHash(unicodeInput);
  const insecureResult = insecureHash(unicodeInput);
  
  expect(secureResult).toMatch(/^[0-9a-f]{64}$/);
  expect(insecureResult).toMatch(/^[0-9a-f]{40}$/);
});