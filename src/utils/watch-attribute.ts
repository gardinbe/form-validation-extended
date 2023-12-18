/**
 * Watch an element's attribute for changes. Executes callback on change.
 * @param target Target element
 * @param attribute Target attribute(s)
 * @param callback Callback function
 */
export const watchAttribute = (
	target: Element,
	attribute: string | string[],
	callback: (mutation: MutationRecord) => void
) => {
	//theoretically possible for mutliple records to appear with same attribute if change occured in same event loop,
	//so just take the last record added.
	new MutationObserver(muts => callback(muts[muts.length - 1]!))
		.observe(target, { attributes: true, attributeFilter: [...attribute] });
};