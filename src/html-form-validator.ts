import { merge } from "lodash";
import {
	Field, FieldElement,
	NumericField, NumericFieldElement,
	RadioCheckboxField, RadioCheckboxFieldElement,
	SelectField, SelectFieldElement,
	TextField, TextFieldElement, TextFieldOptions
} from "./fields";
import { watchAttribute } from "./utils";

/** Options for a form validator. */
type FormValidatorOptions = TextFieldOptions;

/**
 * Handles the validation of form controls/elements.
 */
export class FormValidator {
	private static readonly defaultOptions: FormValidatorOptions = merge(
		{},
		TextField.defaultOptions
	);

	/** List of all of the fields that are being validated. */
	readonly fields: Field[] = [];

	/** The form element being validated. */
	readonly form: HTMLFormElement;

	private readonly options: FormValidatorOptions;

	/**
	 * @param form Target form element
	 * @param options Options
	 */
	constructor(form: HTMLFormElement, options?: Partial<FormValidatorOptions>) {
		this.form = form;
		this.options = merge({}, FormValidator.defaultOptions, options);

		this.loadAllFields();
	}

	/**
	 * Get an instance of a field by it's name.
	 * @param name Target form control name
	 * @returns Field instance
	 */
	getField<T extends Field>(name: string) {
		return this.fields.find(field => field.elmt.name === name) as T ?? null;
	}

	/**
	 * Check the validity of all of the fields in the form.
	 */
	async checkValidity() {
		const results = await Promise.all(this.fields.map(f => f.checkValidity()));
		return !results.some(result => !result);
	}

	/**
	 * Watch the all of the fields and validate them on any changes.
	 */
	watchAllFields() {
		for (const field of this.fields)
			field.validateOnChange();
	}

	/**
	 * Ignore any changes to the fields.
	 */
	ignoreAllFields() {
		for (const field of this.fields)
			field.stopValidatingOnChange();
	}

	/**
	 * Get and set all fields to be validated into the form validator.
	 * @returns Fields to be validated
	 */
	private loadAllFields() {
		const fieldElmts = Array.from(this.form.elements as HTMLCollectionOf<FieldElement>)
			.filter(el => el.dataset.fvValidate !== undefined);

		//go through the field controls and upcast them
		for (const fieldElmt of fieldElmts) {
			if (
				//do not add the same field again
				this.fields.some(f => f.elmt === fieldElmt) ||
				//and do not add fields with the same name (radio & checkboxes)
				(fieldElmt.name !== "" &&
					this.fields.some(f => f.elmt.name === fieldElmt.name))
			)
				continue;

			const field = this.createField(fieldElmt);
			this.addField(field);
		}

		for (const removedField of this.fields
			.filter(storedF =>
				!fieldElmts.some(f => storedF.elmt === f))
		)
			this.removeField(removedField);

		this.setFieldsRelations();
	}

	/**
	 * Create a form validator field for a form control.
	 * @param elmt Target form control
	 * @returns Form validator field
	 */
	createField(elmt: FieldElement) {
		switch (elmt.type) {
			case "text":
			case "tel":
			case "email":
			case "url":
			case "password":
			case "search":
				return new TextField(elmt as TextFieldElement, this.options);

			case "select-one":
			case "select-multiple":
				return new SelectField(elmt as SelectFieldElement);

			case "radio":
			case "checkbox":
				return new RadioCheckboxField(elmt as RadioCheckboxFieldElement);

			case "date":
			case "month":
			case "week":
			case "time":
			case "datetime-local":
			case "number":
			case "range":
				return new NumericField(elmt as NumericFieldElement);

			default:
				throw new Error(`Failed to create field using a form control of an unknown type '${elmt.type as string}'`);
		}
	}

	/**
	 * Add a field to the form validator.
	 * @param elmt Target field
	 */
	addField(field: Field) {
		this.fields.push(field);
	}

	/**
	 * Remove a field from the form validator.
	 * @param elmt Target field
	 */
	removeField(field: Field) {
		this.fields.splice(this.fields.indexOf(field), 1);
	}

	/**
	 * Set the relations between all fields: the `match` properties.
	 */
	private setFieldsRelations() {
		for (const field of this.fields)
			this.setFieldRelations(field);
	}

	/**
	 * Set the relations for a single field: the `match` property.
	 * @param field Target field
	 */
	private setFieldRelations(field: Field) {
		if (field.elmt.dataset.fvMatch === undefined) {
			field.matchTo = null;
			return;
		}

		const matchTo = this.fields
			.find(existingField =>
				field.elmt.dataset.fvMatch === existingField.elmt.name);

		if (matchTo === undefined)
			throw new Error(`Failed to find form control '${field.elmt.dataset.fvMatch}' to match with '${field.elmt.name}'`);

		//set the relationship on both sides (how romantic)
		field.matchTo = matchTo;
		matchTo.matchOf.push(field);

		//when the match-field's name changes, change the fields 'match-field' property to target new name
		watchAttribute(
			matchTo.elmt,
			"name",
			() => field.elmt.dataset.fvMatch = matchTo.elmt.name
		);

		//when the fields 'match' property changes, update the relations again
		watchAttribute(
			field.elmt,
			"data-fv-match",
			() => {
				//value unchanged?
				if (field.elmt.dataset.fvMatch === matchTo.elmt.name)
					return;

				//remove from match-field's list
				matchTo.matchOf.splice(matchTo.matchOf.indexOf(field));

				//update relations for this field
				this.setFieldRelations(field);
			}
		);
	}
}