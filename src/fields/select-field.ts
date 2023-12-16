import { Field, FieldControl, FieldOptions } from "./field";

/** A select box/dropdown form control. */
export type SelectFieldControl = FieldControl<HTMLSelectElement>;

/**
 * A select box/dropdown form field.
 */
export class SelectField extends Field {
	override readonly elmt: SelectFieldControl;

	/**
	 * @param elmt The select box/dropdown form control associated with this field.
	 * @param options Target options
	 */
	constructor(elmt: SelectFieldControl, options?: Partial<FieldOptions>) {
		super(elmt, options);
		this.elmt = elmt;
	}
}