declare type AddFieldInvalidationCheckOptions = {
    /**
     * Time (in milliseconds) to wait before executing the check after a field value change occurs.
     *
     * If the field value changes again before the time is up, the invalidation check will be cancelled.
     *
     * @default undefined
     */
    debounce?: number;
    /**
     * When to perform this check.
     *
     * `"with-other-checks"` - Execute this check alongside all of the other default checks.
     *
     * `"before-other-checks"` - Execute this check before the other checks have executed.
     *
     * `"after-other-checks-passed"` - Execute this check after all of the other checks have executed **and passed**.
     * Bear in mind that *'other checks'* in this case means all other checks that are not `"after-other-checks-passed"` ones.
     *
     * @default "with-other-checks"
     */
    when: FieldInvalidatorWhen;
};

/**
 * A promise that can be cancelled using an `AbortController`.
 * @todo This implementation seems very wrong... Come back to later!
 */
declare class CancellablePromise<T> extends Promise<T> {
    private abortController;
    constructor(executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: unknown) => void, cancel: AbortSignal) => void);
    /**
     * Cancel the promise.
     *
     * This rejects the promise and then updates the abort signal.
     */
    cancel(): void;
}

/**
 * Represents a form field.
 */
declare abstract class Field {
    /** The control associated with this field. */
    readonly elmt: FieldElement;
    /** The list element where errors will be displayed to.  */
    readonly errorsListElmt: HTMLUListElement | null;
    /**
     * The validity of the field.
     *
     * Not publically exposed - call `checkValidity()` to get this.
     */
    private valid;
    /** List of all errors on the field. */
    readonly errors: string[];
    /** Array of invalidator function to check and determine the field's validity. */
    private readonly invalidators;
    /** The other field whose value this field must match. */
    matchTo: Field | null;
    /** The other fields whose values must match this field. */
    readonly matchOf: Field[];
    protected valueEventHandler: ((this: void, ev: Event) => void) | null;
    /**
     * @param elmt The form control element associated with this field.
     */
    constructor(elmt: FieldElement);
    /**
     * Check the validity of the field's value.
     */
    checkValidity(): Promise<boolean | undefined>;
    /**
     * Run all of the validation checks to determine the field's validity.
     */
    private runInvalidationChecks;
    /**
     * Add an additional invalidation check to the field.
     * @param invalidator Invalidation check function. Call `invalidate` with a reason to invalidate the field.
     * @param options Options
     */
    addInvalidator(invalidator: RawFieldInvalidator, options?: Partial<AddFieldInvalidationCheckOptions>): void;
    /**
     * Validate the field.
     */
    protected validate(): void;
    /**
     * Invalidate the field. If invalidated multiple times, reasons will be accumulated.
     * @param reason Reason for invalidation
     */
    protected invalidate(reason: string): void;
    /**
     * Create the initial dataset properties.
     */
    protected initDataset(): void;
    /**
     * Watch the field's value and validate it on any changes.
     * @param callback Callback function executed after validity checks
     */
    validateOnChange(): void;
    /**
     * Ignore any changes to the field's value. This removes all attached event
     * listeners!
     */
    stopValidatingOnChange(): void;
}

/** Base form control element that all other form control elements inherit. */
declare type FieldElement<TElement extends FormControlElement = FormControlElement, TElementType extends FormControlElementType = FormControlElementType, TDataset extends object = object> = TElement & {
    type: TElementType;
    dataset: {
        /** The current validity of the field. */
        fvValid?: string;
        /** Whether the validity of the field is currently being checked. */
        fvCheckingValidity?: string;
        /** Whether the field should be validated or not. */
        fvValidate?: string;
        /** Whether the field can have a default/empty value. */
        fvRequired?: string;
        /**
         * The display name used for the field.
         * @note If omitted, error messages will appear far more generic.
         */
        fvDisplayName?: string;
        /** The name of the field whose value this one must match. */
        fvMatch?: string;
    } & TDataset;
};

declare type FieldInvalidatorCheck = (value: string, invalidate: (reason: string) => void) => CancellablePromise<void>;

declare type FieldInvalidatorWhen = "with-other-checks" | "before-other-checks" | "after-other-checks-passed";

/** Any element that can be considered a form control. */
declare type FormControlElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

declare type FormControlElementType = StandardFormControlElementType | "radio" | "checkbox";

/**
 * Handles the validation of form controls/elements.
 */
export declare class FormValidator {
    private static readonly defaultOptions;
    /** List of all of the fields that are being validated. */
    readonly fields: Field[];
    /** The form element being validated. */
    readonly form: HTMLFormElement;
    private readonly options;
    /**
     * @param form Target form element
     * @param options Options
     */
    constructor(form: HTMLFormElement, options?: Partial<FormValidatorOptions>);
    /**
     * Get an instance of a field by it's name.
     * @param name Target form control name
     * @returns Field instance
     */
    getField<T extends Field>(name: string): T;
    /**
     * Check the validity of all of the fields in the form.
     */
    checkValidity(): Promise<boolean>;
    /**
     * Watch the all of the fields and validate them on any changes.
     */
    watchAllFields(): void;
    /**
     * Ignore any changes to the fields.
     */
    ignoreAllFields(): void;
    /**
     * Get and set all fields to be validated into the form validator.
     * @returns Fields to be validated
     */
    private loadAllFields;
    /**
     * Create a form validator field for a form control.
     * @param elmt Target form control
     * @returns Form validator field
     */
    createField(elmt: FieldElement): NumericField | RadioCheckboxField | SelectField | TextField;
    /**
     * Add a field to the form validator.
     * @param elmt Target field
     */
    addField(field: Field): void;
    /**
     * Remove a field from the form validator.
     * @param elmt Target field
     */
    removeField(field: Field): void;
    /**
     * Set the relations between all fields: the `match` properties.
     */
    private setFieldsRelations;
    /**
     * Set the relations for a single field: the `match` property.
     * @param field Target field
     */
    private setFieldRelations;
}

/** Options for a form validator. */
declare type FormValidatorOptions = TextFieldOptions;

/**
 * A numeric form field.
 */
declare class NumericField extends UserEntryField {
    readonly elmt: NumericFieldElement;
    /**
     * @param elmt The numeric form control element associated with this field.
     */
    constructor(elmt: NumericFieldElement);
}

/** A numeric form control element. */
declare type NumericFieldElement = UserEntryFieldElement<HTMLInputElement, "date" | "month" | "week" | "time" | "datetime-local" | "number" | "range", {
    /** The minimum numeric value the field can have. */
    fvMin?: string;
    /** The maximum numeric value the field can have. */
    fvMax?: string;
}>;

/**
 * A radio button or checkbox form field.
 */
declare class RadioCheckboxField extends Field {
    readonly elmt: RadioCheckboxFieldElement;
    /** All the other form controls assoicated with this radio/checkbox. */
    private readonly associatedElmts;
    /**
     * @param elmt The radio/checkbox form control element associated with this field.
     */
    constructor(mainElmt: RadioCheckboxFieldElement);
    validate(): void;
    invalidate(reason: string): void;
    validateOnChange(): void;
    stopValidatingOnChange(): void;
}

/** A radio or checkbox form control element. */
declare type RadioCheckboxFieldElement = FieldElement<HTMLInputElement, "radio" | "checkbox">;

/** A non-cancellable field invalidator check. */
declare type RawFieldInvalidator = (...args: Parameters<FieldInvalidatorCheck>) => void | Promise<void>;

/**
 * A select box/dropdown form field.
 */
declare class SelectField extends StandardField {
    readonly elmt: SelectFieldElement;
    /**
     * @param elmt The select box/dropdown form control element associated with this field.
     */
    constructor(elmt: SelectFieldElement);
}

/** A select box/dropdown form control element. */
declare type SelectFieldElement = StandardFieldElement<HTMLSelectElement, "select-one" | "select-multiple">;

/**
 * Represents a standard form field.
 */
declare abstract class StandardField extends Field {
    readonly elmt: StandardFieldElement;
    /**
     * @param elmt The form control element associated with this field.
     */
    constructor(elmt: StandardFieldElement);
}

/** A standard form control element. */
declare type StandardFieldElement<TElement extends StandardFormControlElement = StandardFormControlElement, TElementType extends StandardFormControlElementType = StandardFormControlElementType, TDataset extends object = object> = FieldElement<TElement, TElementType, TDataset>;

/** Any form control that can have an empty value. */
declare type StandardFormControlElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

declare type StandardFormControlElementType = UserEntryFormControlElementType | "select-one" | "select-multiple";

/**
 * A text-based form field.
 */
declare class TextField extends UserEntryField {
    static readonly defaultOptions: TextFieldOptions;
    readonly elmt: TextFieldElement;
    protected readonly options: TextFieldOptions;
    /**
     * @param elmt The text-based form control element associated with this field.
     * @param options Target options
     */
    constructor(elmt: TextFieldElement, options?: Partial<TextFieldOptions>);
    /**
     * Get the pattern's regex expression object.
     * @returns regular expression
     */
    private getPatternRegExp;
}

/** A text-based form control element. */
declare type TextFieldElement = UserEntryFieldElement<HTMLInputElement | HTMLTextAreaElement, "text" | "tel" | "email" | "url" | "password" | "search" | "textarea", {
    /** The regex pattern the value must match. */
    fvPattern?: string;
    /** The label for the pattern, e.g. postcode, phone number, etc. */
    fvPatternLabel?: string;
    /**
     * The regex pattern preset for the field.
     * @note This takes priority over the standard pattern and pattern label if set.
     */
    fvPatternPreset?: string;
}>;

/** Options for a text-based form field.  */
declare type TextFieldOptions = {
    /** Object of pattern presets used to test common field types. */
    patternPresets: TextFieldPatternPresets;
};

/** Pattern presets used to test common field types. */
declare type TextFieldPatternPresets = {
    /** Email testing regex pattern. */
    email: RegExp;
    /** Phone number testing regex pattern. */
    phoneNumber: RegExp;
};

/**
 * Represents a form field with a control that takes a user entry as an input.
 */
declare abstract class UserEntryField extends StandardField {
    readonly elmt: UserEntryFieldElement;
    /**
     * @param elmt The form control element associated with this field.
     */
    constructor(elmt: UserEntryFieldElement);
}

/** A form control element that takes a user entry as an input. */
declare type UserEntryFieldElement<TElement extends UserEntryFormControlElement = UserEntryFormControlElement, TElementType extends UserEntryFormControlElementType = UserEntryFormControlElementType, TDataset extends object = object> = StandardFieldElement<TElement, TElementType, TDataset & {
    /** Minimum length of the value. */
    fvMinLength?: string;
    /** Maximum length of the value. */
    fvMaxLength?: string;
}>;

/** Any form control that takes a user entry as an input. */
declare type UserEntryFormControlElement = HTMLInputElement | HTMLTextAreaElement;

declare type UserEntryFormControlElementType = "text" | "tel" | "email" | "url" | "password" | "search" | "textarea" | "date" | "month" | "week" | "time" | "datetime-local" | "number" | "range";

export { }
