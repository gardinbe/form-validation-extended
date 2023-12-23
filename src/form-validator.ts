import { merge } from "lodash";
import {
	Field, FieldElement,
	FieldOptions,
	NumericField, NumericFieldElement,
	RadioCheckboxField, RadioCheckboxFieldElement,
	SelectField, SelectFieldElement,
	TextField, TextFieldElement, TextFieldOptions
} from "./fields";
import { watchAttributes, watchChildren } from "./utils";
import { OptionalProps } from "./types/utils";

/** Options for a form validator. */
type FormValidatorOptions =
	Pick<FieldOptions, "errorHtmlTemplate">
	& Pick<TextFieldOptions, "patternPresets">;

/**
 * Handles the validation of form controls/elements.
 */
export class FormValidator {
	private static readonly defaultOptions: Required<OptionalProps<
		FormValidatorOptions
	>> = merge({}, Field.defaultOptions, TextField.defaultOptions); //merge everything into one big options object for now

	/** List of all of the fields that are being validated. */
	readonly fields: Field[] = [];

	/** The form element being validated. */
	readonly form: HTMLFormElement;

	private readonly options: Required<FormValidatorOptions>;

	/**
	 * @param form - Target form element
	 * @param options - Options
	 */
	constructor(form: HTMLFormElement, options?: Partial<FormValidatorOptions>) {
		this.form = form;
		this.form.noValidate = true; //disable standard form validation
		this.options = merge({}, FormValidator.defaultOptions, options);

		this.updateFields();

		watchChildren(this.form, () => this.updateFields());
	}

	/**
	 * Get an instance of a field by it's name.
	 * @param name - Target form control name
	 * @returns Field instance
	 */
	getField<T extends Field>(name: string) {
		return this.fields.find(field => field.elmt.name === name) as T ?? null;
	}

	/**
	 * Check the validity of all of the fields in the form.
	 * @returns determined validity of the form
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
			field.checkOnChange();
	}

	/**
	 * Ignore any changes to the fields.
	 */
	ignoreAllFields() {
		for (const field of this.fields)
			field.ignoreOnChange();
	}

	/**
	 * Creates and adds new fields and removes old fields no longer being used. This occurs without
	 * affecting the other existing fields.
	 */
	private updateFields() {
		const fieldElmts = Array.from(this.form.elements as HTMLCollectionOf<FieldElement>)
			//filter out the others: https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/elements#value
			.filter(el => el instanceof HTMLInputElement
				|| el instanceof HTMLTextAreaElement
				|| el instanceof HTMLSelectElement);

		//go through the active form controls and create fields for any which
		//dont have a field associated with it
		for (const fieldElmt of fieldElmts) {
			if (
				//do not add the same field again
				this.fields.some(f => f.elmt === fieldElmt)
				//and do not add fields with the same name (radio & checkboxes)
				//TODO -> rescan and set associated radio/checkbox fields
				|| (fieldElmt.name !== ""
					&& this.fields.some(f => f.elmt.name === fieldElmt.name))
			)
				continue;

			const field = this.createField(fieldElmt);
			this.addField(field);
		}

		//remove old fields that dont have an active form control associated with it
		for (const oldField of this.fields
			.filter(storedF =>
				!fieldElmts.some(f => storedF.elmt === f))
		)
			this.removeField(oldField);

		this.setFieldsRelations();
	}

	/**
	 * Create a form validator field for a form control.
	 * @param elmt - Target form control
	 * @returns Form validator field
	 * @throws Error if form control type is invalid or unknown
	 */
	createField(elmt: FieldElement) {
		switch (elmt.type) {
			case "text":
			case "tel":
			case "email":
			case "url":
			case "password":
			case "search":
			case "textarea":
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
				throw new Error(`Failed to create field using a form control of an invalid type '${elmt.type as string}'`);
		}
	}

	/**
	 * Add a field to the form validator.
	 * @param field - Target field
	 */
	addField(field: Field) {
		//if the type changes, delete the old field an re-instatiate a new one
		watchAttributes(
			field.elmt,
			"type",
			() => {
				this.removeField(field);
				this.addField(this.createField(field.elmt));
			}
		);

		this.fields.push(field);
	}

	/**
	 * Remove a field from the form validator.
	 * @param field - Target field
	 */
	removeField(field: Field) {
		this.fields.splice(this.fields.indexOf(field), 1);
	}

	/**
	 * Set the relations between all fields: the `data-fv-match` attributes.
	 */
	private setFieldsRelations() {
		for (const field of this.fields)
			this.setFieldRelations(field);
	}

	/**
	 * Set the relations for a single field: the `data-fv-match` attributes.
	 * @param field -Target field
	 */
	private setFieldRelations(field: Field) {
		const matchTo = field.elmt.dataset.fvMatch !== undefined
			? this.fields.find(existingField =>
				field.elmt.dataset.fvMatch === existingField.elmt.name) ?? null
			: null;

		//set the relationship on the field's side
		field.matchToObserver?.disconnect(); //disconnect the old 'match's observer
		field.matchTo = matchTo;

		if (matchTo === null) {
			if (field.elmt.dataset.fvMatch !== undefined)
				console.error(`Failed to find form control '${field.elmt.dataset.fvMatch}' to match with '${field.elmt.name}'.`);

			field.matchToObserver = watchAttributes( //reconnect an observer to call this method again
				field.elmt,
				"data-fv-match",
				() => this.setFieldRelations(field)
			);

			return;
		}

		//when the field's 'match' attribute changes, update the relations
		field.matchToObserver = watchAttributes( //reconnect a new observer for the new 'match'
			field.elmt,
			"data-fv-match",
			() => {
				//value unchanged or undefined?
				if (field.elmt.dataset.fvMatch === matchTo.elmt.name)
					return;

				//remove from match-field's list
				matchTo.matchOfObservers.get(field)?.disconnect();
				matchTo.matchOf.splice(matchTo.matchOf.indexOf(field));

				//update relations for this field
				this.setFieldRelations(field);
			}
		);

		//now set the relationship on the 'match's side (how romantic)
		matchTo.matchOf.push(field);
		matchTo.matchOfObservers.set(
			field,
			//when the match-field's name changes, change the fields 'match-field' attribute to target new name
			watchAttributes(
				matchTo.elmt,
				"name",
				() => field.elmt.dataset.fvMatch = matchTo.elmt.name
			)
		);
	}
}