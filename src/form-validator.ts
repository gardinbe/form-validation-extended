import { merge } from "lodash";
import {
	Field, FieldControl,
	FieldOptions,
	NumericField, NumericFieldControl,
	RadioCheckboxField, RadioCheckboxFieldControl,
	SelectField, SelectFieldControl,
	TextField, TextFieldControl, TextFieldOptions
} from "./fields";
import { FormControlElement } from "./form-control-element";
import { watchAttribute } from "./watch-attribute";

type FormValidatorOptions = FieldOptions & TextFieldOptions;

/**
 * Handles the validation of form controls/elements.
 */
export class FormValidator {
	private static readonly defaultOptions: FormValidatorOptions = {
		stopValidatingIfRequiredAndEmpty: Field.defaultOptions.stopValidatingIfRequiredAndEmpty,
		patternPresets: TextField.defaultOptions.patternPresets
	};

	/** List of all of the fields that are being validated. */
	readonly fields: Field[];
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
		this.fields = [];

		this.loadAllFields();
	}

	/**
	 * Whether all of the fields within the form are valid.
	 */
	get valid() {
		return !this.fields.some(field => !field.valid);
	}

	/**
	 * Check the validity of all of the fields in the form.
	 */
	checkValidity() {
		for (const field of this.fields)
			field.checkValidity();
	}

	/**
	 * Watch the all of the fields and validate them on any changes.
	 * @param callback Callback function executed on any changes
	 */
	watchValueChanges(callback?: (field?: Field) => void) {
		for (const field of this.fields)
			field.watchValueChanges(() => callback?.(field));
	}

	/**
	 * Ignore any changes to the fields.
	 */
	ignoreValueChanges() {
		for (const field of this.fields)
			field.ignoreValueChanges();
	}

	/**
	 * Get and set all fields to be validated into the form validator.
	 * @returns Fields to be validated
	 */
	private loadAllFields() {
		const fieldElmts = Array.from(this.form.elements as HTMLCollectionOf<FormControlElement>)
			.filter(elmt => elmt.dataset.fvValidate !== undefined);

		//go through the field controls and upcast them
		for (const fieldElmt of fieldElmts) {
			if (
				//do not add the same field again
				this.fields.some(field => field.elmt === fieldElmt) ||
				//and do not add fields with the same name (radio & checkboxes)
				(fieldElmt.name !== "" &&
					this.fields.some(field => fieldElmt.name === field.elmt.name))
			)
				continue;

			const field = this.createField(fieldElmt);
			this.addField(field);
		}

		for (const removedField of this.fields
			.filter(storedField =>
				!fieldElmts.some(field => storedField.elmt === field))
		)
			this.removeField(removedField);

		this.setFieldsRelations();
	}

	/**
	 * Create a form validator field for a form control.
	 * @param elmt Target form control
	 * @returns Form validator field
	 */
	createField(elmt: FieldControl) {
		switch (elmt.type) {
			case "radio":
			case "checkbox":
				return new RadioCheckboxField(elmt as RadioCheckboxFieldControl, this.options);

			case "date":
			case "month":
			case "week":
			case "time":
			case "datetime-local":
			case "number":
			case "range":
				return new NumericField(elmt as NumericFieldControl, this.options);

			case "text":
			case "tel":
			case "email":
			case "url":
			case "password":
			case "search":
				return new TextField(elmt as TextFieldControl, this.options);

			case "select":
				return new SelectField(elmt as SelectFieldControl, this.options);

			default:
				throw new Error(`Unable to create field with an unknown type '${elmt.type}'`);
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
		if (field.elmt.dataset.fvPattern === undefined) {
			field.matchTo = null;
			return;
		}

		const matchTo = this.fields
			.find(field =>
				field.elmt.name === field.elmt.dataset.fvMatch);

		if (matchTo === undefined)
			throw new Error(`Unable to find field '${field.elmt.dataset.fvMatch}' to match with '${field.elmt.name}'`);

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