import { merge } from "lodash";
import { FormControlElement, FormControlElementType } from "../../types/form-control-element";
import { OptionalProps } from "../../types/utils";
import { CancellablePromise, datasetIsTrue, delay, watchAttributes } from "../../utils";

/** Base form control element that all other form control elements inherit. */
export type FieldElement<
	TElement extends FormControlElement = FormControlElement,
	TElementType extends FormControlElementType = FormControlElementType,
	TDataset extends object = object
> = TElement & {
	type: TElementType;
	dataset: {
		/**
		 * The current validity of the field.
		 */
		fvValid?: string;
		/**
		 * Whether the validity of the field is currently being checked.
		 */
		fvCheckingValidity?: string;


		/**
		 * Whether the field should be validated or not.
		 */
		fvValidate?: string;
		/**
		 * Whether the field can have a default/empty value.
		 */
		fvRequired?: string;
		/**
		 * The display name used for the field.
		 *
		 * If omitted, error messages will appear far more generic.
		 */
		fvDisplayName?: string;
		/**
		 * The name of the field whose value this one must match.
		 */
		fvMatch?: string;
	} & TDataset;
};

type FieldInvalidatorWhen =
	"with-initial"
	| "after-initial"
	| "with-others"
	| "after-others";

type FieldInvalidatorCheck = (value: string, invalidate: (reason: string) => void) => CancellablePromise<void>;

/** Field invalidator object to check and determine the field's validity. */
type FieldInvalidator = {
	when: FieldInvalidatorWhen;
	check: FieldInvalidatorCheck;
	instance: ReturnType<FieldInvalidatorCheck> | null;
};

/** A base field invalidator check. */
type BaseFieldInvalidator = (...args: Parameters<FieldInvalidatorCheck>) => void | Promise<void>;

type AddFieldInvalidationCheckOptions = {
	/**
	 * Time (in milliseconds) to wait before executing the check after a field value change occurs.
	 *
	 * If the field value changes again before the time is up, the invalidation check will be cancelled.
	 *
	 * @defaultValue undefined
	 */
	debounce?: number;
	/**
	 * When to perform this check.
	 *
	 * `"with-initial"` - Execute this check alongside the initial ones *(such as the 'data-fv-required' check)*. It's ***not recommended*** to use this one.
	 *
	 * `"after-initial"` - Execute this check after the initial ones *(such as
	 * the 'data-fv-required' check)* have passed.
	 *
	 * `"with-others"` - Execute this check alongside all the other default ones.
	 *
	 *
	 * `"after-others"` - Execute this check after all the other ones have passed.
	 * Bear in mind that *'other ones'* in this case means all other checks that are not `"after-others"` ones.
	 *
	 * @defaultValue "with-others"
	 */
	when: FieldInvalidatorWhen;
};

export type FieldOptions = {
	/**
	 * Provide the HTML template for how the error elements will be rendered.
	 * @param message - Error message to be rendered
	 */
	errorHtmlTemplate?(message: string): string;
};

/**
 * Represents a form field.
 */
export abstract class Field {
	static readonly defaultOptions: Required<OptionalProps<FieldOptions>> = {
		errorHtmlTemplate(messsage) {
			return `<div>${messsage}</div>`;
		}
	};

	/** The control associated with this field. */
	readonly elmt: FieldElement;

	/** The element where errors will be displayed to.  */
	readonly errorsElmt: HTMLElement | null;

	protected readonly options: Required<FieldOptions>;

	/**
	 * The validity of the field.
	 *
	 * Not publically exposed - call `checkValidity()` to get this.
	 */
	private valid = false;

	/** List of all errors on the field. */
	readonly errors: string[] = [];

	/** Array of invalidator function to check and determine the field's validity. */
	private readonly invalidators: FieldInvalidator[] = [];

	/** The other field whose value this one must match. Set by the parent `FormValidator`. */
	matchTo: Field | null = null;
	matchToObserver: MutationObserver | null = null;

	/** The other fields whose values must match this field. Set by the parent `FormValidator`. */
	readonly matchOf: Field[] = [];
	matchOfObservers: Map<Field, MutationObserver> = new Map();

	protected eventHandler: ((this: void, ev: Event) => void) | null = null;

	/**
	 * @param elmt - The form control element associated with this field.
	 */
	constructor(elmt: FieldElement, options?: Partial<FieldOptions>) {
		this.elmt = elmt;
		this.options = merge({}, Field.defaultOptions, options);

		this.errorsElmt = document
			.querySelector<HTMLUListElement>(`[data-fv-errors="${elmt.name}"]`);

		this.checkOnAttributesChange([
			"disabled",
			"data-fv-validate",
			"data-fv-required",
			"data-fv-display-name",
			"data-fv-match"
		]);

		this.addInvalidator((value, invalidate) => {
			if (
				this.matchTo !== null
				&& value !== this.matchTo.elmt.value
			)
				invalidate(
					this.matchTo.elmt.dataset.fvDisplayName !== undefined
						? `${this.elmt.dataset.fvDisplayName ?? "This"} does not match ${this.matchTo.elmt.dataset.fvDisplayName}`
						: `${this.elmt.dataset.fvDisplayName ?? "This"} does not match`
				);
		}, { when: "after-initial" });
	}

	/**
	 * Check the validity of the field's value.
	 */
	async checkValidity() {
		//assume valid until invalidated
		this.validate();

		if (this.elmt.disabled || !datasetIsTrue(this.elmt.dataset.fvValidate))
			return true;

		this.elmt.dataset.fvCheckingValidity = "true";

		try {
			await this.runInvalidationChecks();
		} catch (e) {
			//if cancelled, invalidate if it hasn't been already
			this.invalidate();
			return false;
		}

		this.elmt.dataset.fvCheckingValidity = "false";

		//run the validation checks on all 'match-of' fields
		void Promise.all(this.matchOf.map(f => f.checkValidity()));

		return this.valid;
	}

	/**
	 * Run all of the validation checks to determine the field's validity.
	 */
	private async runInvalidationChecks() {
		/**
		 * Filter the invalidators by `when` they should execute, create their instances, and
		 * return those instances.
		 * @param when - Filter invalidators by `when` they should execute
		 */
		const setAndGetInstances = (when: FieldInvalidatorWhen) =>
			this.invalidators
				.filter(invalidator => invalidator.when === when)
				.map(invalidator => {
					invalidator.instance = invalidator.check(
						this.elmt.value,
						this.invalidate.bind(this)
					);
					return invalidator.instance;
				});

		//cancel the currently running invalidation checks
		for (const invalidator of this.invalidators)
			invalidator.instance?.cancel();

		await Promise.all(setAndGetInstances("with-initial"));

		//only continue if these checks all passed
		if (!this.valid)
			return;

		await Promise.all(setAndGetInstances("after-initial"));

		//only continue if these checks all passed
		if (!this.valid)
			return;

		await Promise.all(setAndGetInstances("with-others"));

		//only continue if these checks all passed
		if (!this.valid)
			return;

		await Promise.all(setAndGetInstances("after-others"));
	}

	/**
	 * Add an invalidation check to the field.
	 * @param invalidator - Invalidation check function. Call `invalidate` with a reason to invalidate the field.
	 * @param options - Options
	 */
	addInvalidator(invalidator: BaseFieldInvalidator, options?: Partial<AddFieldInvalidationCheckOptions>) {
		const transformedInvalidator: FieldInvalidator = {
			when: options?.when ?? "with-others",
			//TODO -> this implementation seems very wrong...
			check(value, invalidate) {
				return new CancellablePromise((resolve, _reject, signal) =>
					void (async () => {
						if (options?.debounce !== undefined) {
							await delay(options.debounce);
							if (signal.aborted) //if the outer CancellablePromise has already been canelled & rejected
								return;
						}

						await invalidator(value, reason => {
							if (signal.aborted) //if the outer CancellablePromise has already been canelled & rejected
								return;
							invalidate(reason);
						});

						resolve();
					})());
			},
			instance: null
		};

		this.invalidators.push(transformedInvalidator);
	}

	/**
	 * Validate the field.
	 */
	protected validate() {
		this.errors.splice(0, this.errors.length);

		if (this.errorsElmt !== null)
			while (this.errorsElmt.lastChild !== null)
				this.errorsElmt.removeChild(this.errorsElmt.lastChild);

		this.valid = true;
		this.elmt.dataset.fvValid = "true";
	}

	/**
	 * Invalidate the field. If invalidated multiple times, reasons will be accumulated.
	 * @param reason - Reason for invalidation
	 */
	protected invalidate(reason?: string) {
		if (reason !== undefined) {
			this.errors.push(reason);

			if (this.errorsElmt !== null)
				this.errorsElmt.insertAdjacentHTML("beforeend", this.options.errorHtmlTemplate(reason));
		}

		this.valid = false;
		this.elmt.dataset.fvValid = "false";
	}

	/**
	 * Watch the field's specified attributes and check it's validity if they change.
	 * @param attributes - Target attributes
	 */
	protected checkOnAttributesChange(attributes: string | string[]) {
		watchAttributes( //TODO -> not ideal spawning an observer on each subclass...
			this.elmt,
			attributes,
			() => void this.checkValidity()
		);
	}

	/**
	 * Watch the field's value and check it's validity on any changes.
	 */
	checkOnChange() {
		if (this.eventHandler !== null)
			return;

		this.eventHandler = () =>
			void this.checkValidity();

		this.elmt.addEventListener("input", this.eventHandler);
		this.elmt.addEventListener("change", this.eventHandler);
	}

	/**
	 * Stop checking the field's validity on any changes.
	 */
	ignoreOnChange() {
		if (this.eventHandler === null)
			return;

		this.elmt.removeEventListener("input", this.eventHandler);
		this.elmt.removeEventListener("change", this.eventHandler);
	}

	/**
	 * Create the initial dataset attributes.
	 */
	protected initDataset() {
		this.elmt.dataset.fvValid = `${this.valid}`;
		this.elmt.dataset.fvCheckingValidity = "false";
	}
}