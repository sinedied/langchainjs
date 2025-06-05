import { secureHash, insecureHash } from "../utils/hash.js";
import type { Generation, ChatGeneration } from "../outputs.js";
import { mapStoredMessageToChatMessage } from "../messages/utils.js";
import { type StoredGeneration } from "../messages/base.js";

/**
 * This cache key should be consistent across all versions of LangChain.
 * It is currently NOT consistent across versions of LangChain.
 *
 * A huge benefit of having a remote cache (like redis) is that you can
 * access the cache from different processes/machines. The allows you to
 * separate concerns and scale horizontally.
 *
 * TODO: Make cache key consistent across versions of LangChain.
 */
export const getCacheKey = (...strings: string[]): string =>
  secureHash(strings.join("_"));

/**
 * Legacy cache key function for backward compatibility.
 * This uses the old hash function (now also SHA3 for security).
 * 
 * @deprecated Use getCacheKey instead which uses secure hashing.
 */
export const getLegacyCacheKey = (...strings: string[]): string =>
  insecureHash(strings.join("_"));

export function deserializeStoredGeneration(
  storedGeneration: StoredGeneration
) {
  if (storedGeneration.message !== undefined) {
    return {
      text: storedGeneration.text,
      message: mapStoredMessageToChatMessage(storedGeneration.message),
    };
  } else {
    return { text: storedGeneration.text };
  }
}

export function serializeGeneration(generation: Generation) {
  const serializedValue: StoredGeneration = {
    text: generation.text,
  };
  if ((generation as ChatGeneration).message !== undefined) {
    serializedValue.message = (generation as ChatGeneration).message.toDict();
  }
  return serializedValue;
}

/**
 * Base class for all caches. All caches should extend this class.
 */
export abstract class BaseCache<T = Generation[]> {
  abstract lookup(prompt: string, llmKey: string): Promise<T | null>;

  abstract update(prompt: string, llmKey: string, value: T): Promise<void>;
}

const GLOBAL_MAP = new Map();

/**
 * A cache for storing LLM generations that stores data in memory.
 */
export class InMemoryCache<T = Generation[]> extends BaseCache<T> {
  private cache: Map<string, T>;

  constructor(map?: Map<string, T>) {
    super();
    this.cache = map ?? new Map();
  }

  /**
   * Retrieves data from the cache using a prompt and an LLM key. If the
   * data is not found, it returns null.
   * @param prompt The prompt used to find the data.
   * @param llmKey The LLM key used to find the data.
   * @returns The data corresponding to the prompt and LLM key, or null if not found.
   */
  lookup(prompt: string, llmKey: string): Promise<T | null> {
    // Try new SHA3-based cache key first
    const newCacheKey = getCacheKey(prompt, llmKey);
    let result = this.cache.get(newCacheKey);
    
    if (result !== undefined) {
      return Promise.resolve(result);
    }
    
    // Fallback to legacy SHA1-based cache key for backward compatibility
    const legacyCacheKey = getLegacyCacheKey(prompt, llmKey);
    result = this.cache.get(legacyCacheKey);
    
    // If found in legacy cache, migrate to new cache key
    if (result !== undefined) {
      this.cache.set(newCacheKey, result);
      // Optionally remove the old key to clean up
      this.cache.delete(legacyCacheKey);
    }
    
    return Promise.resolve(result ?? null);
  }

  /**
   * Updates the cache with new data using a prompt and an LLM key.
   * @param prompt The prompt used to store the data.
   * @param llmKey The LLM key used to store the data.
   * @param value The data to be stored.
   */
  async update(prompt: string, llmKey: string, value: T): Promise<void> {
    // Always use the new secure cache key for storing
    this.cache.set(getCacheKey(prompt, llmKey), value);
  }

  /**
   * Returns a global instance of InMemoryCache using a predefined global
   * map as the initial cache.
   * @returns A global instance of InMemoryCache.
   */
  static global(): InMemoryCache {
    return new InMemoryCache(GLOBAL_MAP);
  }
}
