import { UserEntryFormControlElement, UserEntryFormControlElementType } from "../../types/form-control-element";
import { StandardField, StandardFieldElement } from "./standard-field";

/** A form control element that takes a user entry as an input. */
export type UserEntryFieldElement<
	TElement extends UserEntryFormControlElement = UserEntryFormControlElement,
	TElementType extends UserEntryFormControlElementType = UserEntryFormControlElementType,
	TDataset extends object = object
> = StandardFieldElement<TElement, TElementType, TDataset & {
	/**
	 * Minimum length of the value.
	 */
	fvMinLength?: string;
	/**
	 * Maximum length of the value.
	 */
	fvMaxLength?: string;
}>;

/**
 * Represents a form field with a control that takes a user entry as an input.
 */
export abstract class UserEntryField extends StandardField {
	override readonly elmt: UserEntryFieldElement;

	/**
	 * @param elmt - The form control element associated with this field.
	 */
	constructor(elmt: UserEntryFieldElement) {
		super(elmt);
		this.elmt = elmt;

		this.checkOnAttributesChange([
			"data-fv-min-length",
			"data-fv-max-length"
		]);

		//check minimum length
		this.addInvalidator((_value, invalidate) => {
			if (this.elmt.dataset.fvMinLength === undefined)
				return;

			const minLen = parseInt(this.elmt.dataset.fvMinLength);
			if (isNaN(minLen)) {
				console.error(`Form control '${this.elmt.name}' has an invalid minimum length 'data-fv-min-length' value.`);
				return;
			}

			if (this.elmt.value.length < minLen)
				invalidate(`${this.elmt.dataset.fvDisplayName ?? "This"} must have more than ${minLen} characters`);
		});

		//check maximum length
		this.addInvalidator((_value, invalidate) => {
			if (this.elmt.dataset.fvMaxLength === undefined)
				return;

			const maxLen = parseInt(this.elmt.dataset.fvMaxLength);
			if (isNaN(maxLen)) {
				console.error(`Form control '${this.elmt.name}' has an invalid maximum length 'data-fv-max-length' value.`);
				return;
			}

			if (this.elmt.value.length >= maxLen)
				invalidate(`${this.elmt.dataset.fvDisplayName ?? "This"} must have less than or equal to ${maxLen} characters`);
		});
	}
}