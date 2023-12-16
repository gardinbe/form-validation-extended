import { Field, FieldControl, FieldOptions } from "./field";

/** A standard form control. */
export type StandardFieldControl = FieldControl<HTMLInputElement | HTMLTextAreaElement, {
	/** Minimum length of the value. */
	fvMinLength?: string;
	/** Maximum length of the value. */
	fvMaxLength?: string;
}>;

/**
 * Represents a standard form field.
 */
export abstract class StandardField extends Field {
	override readonly elmt: StandardFieldControl;

	/**
	 * @param elmt The form control associated with this field.
	 * @param options Target options
	 */
	constructor(elmt: StandardFieldControl, options?: Partial<FieldOptions>) {
		super(elmt, options);
		this.elmt = elmt;
	}

	protected override validationChecks() {
		super.validationChecks();

		//check minimum length
		if (this.elmt.dataset.fvMinLength !== undefined) {
			const minLen = parseInt(this.elmt.dataset.fvMinLength);
			if (isNaN(minLen))
				throw new Error(`Minimum length for field '${this.elmt.name}' is not a number`);

			if (this.elmt.value.length < minLen)
				this.errors.push(`This must be more than ${minLen} characters in length`);
		}

		//check maximum length
		if (this.elmt.dataset.fvMaxLength !== undefined) {
			const maxLen = parseInt(this.elmt.dataset.fvMaxLength);
			if (isNaN(maxLen))
				throw new Error(`Maxiumum length for field '${this.elmt.name}' is not a number`);

			if (this.elmt.value.length >= maxLen)
				this.errors.push(`This must be less than or equal to ${maxLen} characters in length`);
		}
	}
}