/**
 * Create a promise that resolves after a given duration.
 * @param delay - Delay duration (in milliseconds)
 * @returns Promise that resolves after a given duration
 */
export const delay = (delay: number) =>
	new Promise<void>(res => setTimeout(res, delay));