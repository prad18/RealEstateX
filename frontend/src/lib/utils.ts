import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"



export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * A simple delay function.
 * @param ms - Milliseconds to wait
 */
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Wraps an async function with retry logic.
 * @param fn - The async function to execute.
 * @param retries - The number of times to retry.
 * @param delayMs - The delay between retries.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${i + 1} failed. Retrying in ${delayMs}ms...`);
      await delay(delayMs);
    }
  }
  throw lastError;
}