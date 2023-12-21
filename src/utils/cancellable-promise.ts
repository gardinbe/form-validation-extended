//TODO -> this implementation seems very wrong... Come back to later!
/**
 * A promise that can be cancelled using an `AbortController`.
 */
export class CancellablePromise<T> extends Promise<T> {
	private abortController: AbortController;

	constructor(
		executor: (
			resolve: (value: T | PromiseLike<T>) => void,
			reject: (reason?: unknown) => void,
			cancel: AbortSignal
		) => void
	) {
		const abortController = new AbortController();
		abortController.signal.throwIfAborted();

		super((resolve, reject) => {
			// abortController.signal.addEventListener("abort", () => reject());
			executor(resolve, reject, abortController.signal);
		});

		this.abortController = abortController;
	}

	/**
	 * Cancel the promise.
	 *
	 * This rejects the promise and then updates the abort signal.
	 */
	cancel() {
		this.abortController.abort();
	}
}