import { UserEntryField, UserEntryFieldElement } from "./abstract/user-entry-field";

/** A numeric form control element. */
export type NumericFieldElement = UserEntryFieldElement<
	HTMLInputElement,
	"date" | "month" | "week" | "time" | "datetime-local" | "number" | "range",
	{
		/** Minimum numeric value. */
		fvMin?: string;
		/** Maximum numeric value. */
		fvMax?: string;
	}
>;

/**
 * A numeric form field.
 */
export class NumericField extends UserEntryField {
	override readonly elmt: NumericFieldElement;

	/**
	 * @param elmt The numeric form control element associated with this field.
	 */
	constructor(elmt: NumericFieldElement) {
		super(elmt);
		this.elmt = elmt;

		//check minimum value
		this.addInvalidator((_value, invalidate) => {
			if (this.elmt.dataset.fvMin !== undefined) {
				const min = parseInt(this.elmt.dataset.fvMin);
				if (isNaN(min))
					throw new Error(`Form control '${this.elmt.name}' has an invalid minimum 'data-fv-min' value`);

				if (parseInt(this.elmt.value) < min)
					invalidate(`${this.elmt.dataset.fvDisplayName ?? "This"} must be greater than or equal to ${min}`);
			}
		});

		//check maximum value
		this.addInvalidator((_value, invalidate) => {
			if (this.elmt.dataset.fvMax !== undefined) {
				const min = parseInt(this.elmt.dataset.fvMax);
				if (isNaN(min))
					throw new Error(`Form control '${this.elmt.name}' has an invalid maximum 'data-fv-max' value`);

				if (parseInt(this.elmt.value) > min)
					invalidate(`${this.elmt.dataset.fvDisplayName ?? "This"} must be less than or equal to ${min}`);
			}
		});
	}
}