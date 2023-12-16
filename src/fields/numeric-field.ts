import { FieldControl, FieldOptions } from "./field";
import { StandardField } from "./standard-field";

/** A numeric form control. */
export type NumericFieldControl = FieldControl<HTMLInputElement & {
	type: "date" | "month" | "week" | "time" | "datetime-local" | "number" | "range";
}, {
	/** Minimum numeric value. */
	fvMin?: string;
	/** Maximum numeric value. */
	fvMax?: string;
}>;

/**
 * A numeric form field.
 */
export class NumericField extends StandardField {
	override readonly elmt: NumericFieldControl;

	/**
	 * @param elmt The numeric form control associated with this field.
	 * @param options Target options
	 */
	constructor(elmt: NumericFieldControl, options?: Partial<FieldOptions>) {
		super(elmt, options);
		this.elmt = elmt;
	}

	protected override validationChecks() {
		super.validationChecks();

		//check minimum value
		if (this.elmt.dataset.fvMin !== undefined) {
			const min = parseInt(this.elmt.dataset.fvMin);
			if (isNaN(min))
				throw new Error(`Form control '${this.elmt.name}' has an invalid minimum 'data-fv-min' value`);

			if (parseInt(this.elmt.value) < min)
				this.errors.push(`This must be greater than ${min}`);
		}

		//check maximum value
		if (this.elmt.dataset.fvMax !== undefined) {
			const min = parseInt(this.elmt.dataset.fvMax);
			if (isNaN(min))
				throw new Error(`Form control '${this.elmt.name}' has an invalid maximum 'data-fv-max' value`);

			if (parseInt(this.elmt.value) >= min)
				this.errors.push(`This must be less than or equal to ${min}`);
		}
	}
}