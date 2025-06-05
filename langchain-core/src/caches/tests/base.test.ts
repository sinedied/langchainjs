import { test, expect } from "@jest/globals";
import { InMemoryCache, getCacheKey, getLegacyCacheKey } from "../base.js";

test("InMemoryCache supports backward compatibility and migration", async () => {
  const cache = new InMemoryCache<string[]>();
  const prompt = "test prompt";
  const llmKey = "test-llm";
  
  // Test that new and legacy cache keys are different
  const newKey = getCacheKey(prompt, llmKey);
  const legacyKey = getLegacyCacheKey(prompt, llmKey);
  expect(newKey).not.toBe(legacyKey);
  
  // Store data using legacy key (simulating old cache data)
  const testData = ["legacy response"];
  (cache as any).cache.set(legacyKey, testData);
  
  // Should be able to lookup and migrate legacy data
  const result = await cache.lookup(prompt, llmKey);
  expect(result).toEqual(testData);
  
  // After migration, data should be accessible via new key
  const newResult = (cache as any).cache.get(newKey);
  expect(newResult).toEqual(testData);
  
  // Legacy key should be cleaned up
  const legacyResult = (cache as any).cache.get(legacyKey);
  expect(legacyResult).toBeUndefined();
});

test("InMemoryCache prefers new cache keys over legacy", async () => {
  const cache = new InMemoryCache<string[]>();
  const prompt = "test prompt";
  const llmKey = "test-llm";
  
  const newKey = getCacheKey(prompt, llmKey);
  const legacyKey = getLegacyCacheKey(prompt, llmKey);
  
  // Store different data in both keys
  const newData = ["new response"];
  const legacyData = ["legacy response"];
  
  (cache as any).cache.set(newKey, newData);
  (cache as any).cache.set(legacyKey, legacyData);
  
  // Should return new data, not legacy
  const result = await cache.lookup(prompt, llmKey);
  expect(result).toEqual(newData);
});

test("InMemoryCache uses new cache key for updates", async () => {
  const cache = new InMemoryCache<string[]>();
  const prompt = "test prompt";
  const llmKey = "test-llm";
  
  const newKey = getCacheKey(prompt, llmKey);
  const testData = ["new response"];
  
  await cache.update(prompt, llmKey, testData);
  
  // Should be stored with new key
  const storedData = (cache as any).cache.get(newKey);
  expect(storedData).toEqual(testData);
  
  // Should also be retrievable via lookup
  const retrievedData = await cache.lookup(prompt, llmKey);
  expect(retrievedData).toEqual(testData);
});