import { UserEntryField, UserEntryFieldElement } from "./abstract/user-entry-field";

/** A numeric form control element. */
export type NumericFieldElement = UserEntryFieldElement<
	HTMLInputElement,
	"date" | "month" | "week" | "time" | "datetime-local" | "number" | "range",
	{
		/** The minimum numeric value the field can have. */
		fvMin?: string;
		/** The maximum numeric value the field can have. */
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

		this.checkOnAttributesChange([
			"data-fv-min",
			"data-fv-max"
		]);

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