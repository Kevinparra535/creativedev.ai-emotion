/**
 * Creates a debounced function that delays invoking the provided function until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @template T - The type of the function to be debounced
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A new debounced function with the same signature as the original function
 *
 * @example
 * ```typescript
 * const debouncedLog = debounce((message: string) => console.log(message), 300);
 * debouncedLog("Hello"); // Will only execute after 300ms of no further calls
 * ```
 */
const debounce = <T extends (...args: unknown[]) => void>(func: T, wait: number): T => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return ((...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  }) as T;
};
export default debounce;
