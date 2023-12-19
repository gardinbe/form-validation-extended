import { StandardField, StandardFieldElement } from "./abstract/standard-field";

/** A select box/dropdown form control element. */
export type SelectFieldElement = StandardFieldElement<
	HTMLSelectElement,
	"select-one" | "select-multiple"
>;

/**
 * A select box/dropdown form field.
 */
export class SelectField extends StandardField {
	override readonly elmt: SelectFieldElement;

	/**
	 * @param elmt - The select box/dropdown form control element associated with this field.
	 */
	constructor(elmt: SelectFieldElement) {
		super(elmt);
		this.elmt = elmt;
	}
}