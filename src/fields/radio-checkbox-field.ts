import { Field, FieldControl, FieldOptions } from "./field";

/** A radio or checkbox form control. */
export type RadioCheckboxFieldControl = FieldControl<HTMLInputElement & {
	type: "radio" | "checkbox";
}>;

/**
 * A radio button or checkbox form field.
 */
export class RadioCheckboxField extends Field {
	override readonly elmt: RadioCheckboxFieldControl;
	/** All the other form controls assoicated with this radio/checkbox. */
	private readonly associatedElmts: RadioCheckboxFieldControl[];

	/**
	 * @param elmt The radio/checkbox form control associated with this field.
	 * @param options Target options
	 */
	constructor(mainElmt: RadioCheckboxFieldControl, options?: Partial<FieldOptions>) {
		super(mainElmt, options);
		this.elmt = mainElmt;
		this.associatedElmts = Array.from(mainElmt.form!.elements as HTMLCollectionOf<RadioCheckboxFieldControl>)
			.filter(elmt =>
				elmt.type === mainElmt.type && //double check the type matches
				elmt.name === mainElmt.name);
	}

	protected override validationChecks() {
		super.validationChecks();

		if (this.elmt.dataset.fvRequired && !this.associatedElmts.some(elmt => elmt.checked))
			this.errors.push("This is required");
	}

	protected override validate() {
		for (const elmt of this.associatedElmts)
			elmt.classList.remove("invalid");

		this.valid = true;
	}

	protected override invalidate() {
		for (const elmt of this.associatedElmts)
			elmt.classList.add("invalid");

		this.valid = false;
	}
}