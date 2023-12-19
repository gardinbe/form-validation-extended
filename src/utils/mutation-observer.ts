/**
 * Watch an element's attribute for changes. Executes callback on change.
 * @param target - Target element
 * @param attributes - Target attribute(s)
 * @param callback - Callback function
 */
export const watchAttributes = (
	target: Element,
	attributes: string | string[],
	callback: MutationCallback
) => {
	const attrs = Array.isArray(attributes)
		? attributes
		: [attributes];

	//theoretically possible for mutliple records to appear with same attribute if change occured in same event loop,
	//so just take the last record added.
	new MutationObserver(callback)
		.observe(target, { attributes: true, attributeFilter: attrs });
};

/**
 * Watch an element's children for changes. Executes callback on change.
 * @param target - Target element
 * @param callback - Callback function
 */
export const watchChildren = (
	target: Element,
	callback: MutationCallback
) => {
	new MutationObserver(callback)
		.observe(target, { childList: true, subtree: true });
};