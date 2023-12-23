import { StandardFormControlElement, StandardFormControlElementType } from "../../types/form-control-element";
import { datasetIsTrue } from "../../utils";
import { Field, FieldElement } from "./field";

/** A standard form control element. */
export type StandardFieldElement<
	TElement extends StandardFormControlElement = StandardFormControlElement,
	TElementType extends StandardFormControlElementType = StandardFormControlElementType,
	TDataset extends object = object
> = FieldElement<
	TElement,
	TElementType,
	TDataset
>;

/**
 * Represents a standard form field.
 */
export abstract class StandardField extends Field {
	override readonly elmt: StandardFieldElement;

	/**
	 * @param elmt - The form control element associated with this field.
	 */
	constructor(elmt: StandardFieldElement) {
		super(elmt);
		this.elmt = elmt;

		//is the field required
		this.addInvalidator((value, invalidate) => {
			if (
				datasetIsTrue(this.elmt.dataset.fvRequired)
				&& value === "" //TODO -> edge case where matchTo is not required
			)
				invalidate(`${this.elmt.dataset.fvDisplayName ?? "This"} is required`);
		}, { when: "with-initial" });
	}
}