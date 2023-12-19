/**
 * Check whether a dataset item is truthy or not.
 * @param datasetItem Target dataset item
 * @returns true/false
 */
export const datasetIsTrue = (datasetItem: string | undefined) =>
	datasetItem !== undefined
		? ["", "true", "1"].includes(datasetItem)
		: false;