import { datasetIsTrue } from "../utils";
import { Field, FieldElement } from "./abstract/field";

/** A radio or checkbox form control element. */
export type RadioCheckboxFieldElement = FieldElement<
	HTMLInputElement,
	"radio" | "checkbox"
>;

/**
 * A radio button or checkbox form field.
 */
export class RadioCheckboxField extends Field {
	override readonly elmt: RadioCheckboxFieldElement;
	/** All the other form controls assoicated with this radio/checkbox. */
	private readonly associatedElmts: RadioCheckboxFieldElement[];

	/**
	 * @param mainElmt - The radio/checkbox form control element associated with this field.
	 */
	constructor(mainElmt: RadioCheckboxFieldElement) {
		super(mainElmt);
		this.elmt = mainElmt;
		this.associatedElmts = Array.from(mainElmt.form!.elements as HTMLCollectionOf<RadioCheckboxFieldElement>)
			.filter(el =>
				el.type === mainElmt.type //double check the type matches
				&& el.name === mainElmt.name);

		//if required -> is atleast one item checked?
		this.addInvalidator((_value, invalidate) => {
			if (
				this.elmt.dataset.fvRequired !== undefined
				&& datasetIsTrue(this.elmt.dataset.fvRequired)
				&& !this.associatedElmts.some(el => el.checked)
			)
				invalidate(`${this.elmt.dataset.fvDisplayName ?? "This"} is required`);
		});
	}

	override validate() {
		super.validate();

		for (const elmt of this.associatedElmts)
			elmt.dataset.fvValid = "true";
	}

	override invalidate(reason: string) {
		super.invalidate(reason);

		for (const elmt of this.associatedElmts)
			elmt.dataset.fvValid = "false";
	}

	override checkOnChange() {
		super.checkOnChange();

		if (this.eventHandler === null)
			return;

		for (const elmt of this.associatedElmts) {
			elmt.addEventListener("input", this.eventHandler);
			elmt.addEventListener("change", this.eventHandler);
		}
	}

	override ignoreOnChange() {
		super.ignoreOnChange();

		if (this.eventHandler === null)
			return;

		for (const elmt of this.associatedElmts) {
			elmt.removeEventListener("input", this.eventHandler);
			elmt.removeEventListener("change", this.eventHandler);
		}
	}
}