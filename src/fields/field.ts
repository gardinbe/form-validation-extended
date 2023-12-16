import { merge } from "lodash";
import { FormControlElement } from "../form-control-element";

/** Options for a form field. */
export type FieldOptions = {
	/** Whether to continue printing error messages if the field is required, and the
	 * value has been determined as default/empty. */
	stopValidatingIfRequiredAndEmpty: boolean;
};

/** Base form control that all other form controls inherit. */
export type FieldControl<
	TElement extends FormControlElement = FormControlElement,
	TDataset extends object = object
> = TElement & {
	dataset: {
		/** Whether the field should be validated or not. */
		fvValidate?: string;
		/** Whether the field can have a default/empty value. */
		fvRequired?: string;
		/**
		 * Display name for the field.
		 * @note This should be set if this field is the 'match' of another field.
		 */
		fvDisplayName?: string;
		/** The name of the field whose value this one must match. */
		fvMatch?: string;
	} & TDataset;
};

/**
 * Represents a form field.
 */
export abstract class Field {
	static readonly defaultOptions: FieldOptions = {
		stopValidatingIfRequiredAndEmpty: true
	};

	/** The control associated with this field. */
	readonly elmt: FieldControl;
	protected readonly options: FieldOptions;
	/** The validity of the field. */
	valid: boolean;
	/** List of all errors on the field. */
	readonly errors: string[];
	/** The other field whose value this field must match. */
	matchTo: Field | null;
	/** The other fields whose values must match this field. */
	readonly matchOf: Field[];

	private valueEventHandler: ((this: void) => void) | null;

	/**
	 * @param elmt The form control associated with this field.
	 * @param options Target options
	 */
	constructor(elmt: FieldControl, options?: Partial<FieldOptions>) {
		this.elmt = elmt;
		this.options = merge({}, Field.defaultOptions, options);

		this.valid = false;
		this.errors = [];

		this.matchTo = null;
		this.matchOf = [];

		this.valueEventHandler = null;
	}

	/**
	 * Display name for the field.
	 * 
	 * If not provided, will fallback to capitalized the control's `name` instead.
	 */
	get displayName() {
		return this.elmt.dataset.fvDisplayName
			?? this.elmt.name.charAt(0).toUpperCase() +
			this.elmt.name.slice(1);
	}

	/**
	 * Check the validity of the field's value.
	 */
	checkValidity() {
		this.errors.splice(0, this.errors.length);

		//run validation checks specified in subclasses
		this.validationChecks();

		if (!(this.errors.length > 0)) //no '===', just in case
			this.validate();
		else
			this.invalidate();
	}

	/**
	 * Specify validation checks to be performed when checking the field's validity.
	 */
	protected validationChecks() {
		if (this.elmt.dataset.fvRequired && this.elmt.value === "") {
			this.errors.push("This field is required");
			if (this.options.stopValidatingIfRequiredAndEmpty)
				return;
		}

		if (this.matchTo !== null && this.elmt.value !== this.matchTo.elmt.value)
			this.errors.push(`This value does not match the '${this.matchTo.displayName}' field's value'`);
	}

	/**
	 * Validate the field.
	 */
	protected validate() {
		this.elmt.classList.remove("invalid");
		this.valid = true;
	}

	/**
	 * Invalidate the field.
	 */
	protected invalidate() {
		this.elmt.classList.add("invalid");
		this.valid = false;
	}

	/**
	 * Watch the field's value and validate it on any changes.
	 * @param callback Callback function executed on any changes
	 */
	watchValueChanges(callback?: () => void) {
		if (this.valueEventHandler !== null)
			return;

		this.valueEventHandler = () => {
			this.checkValidity();
			callback?.();
		};

		addEventListener("input", this.valueEventHandler);
		addEventListener("change", this.valueEventHandler);
	}

	/**
	 * Ignore any changes to the field's value.
	 */
	ignoreValueChanges() {
		if (this.valueEventHandler === null)
			return;

		removeEventListener("input", this.valueEventHandler);
		removeEventListener("change", this.valueEventHandler);
	}
}