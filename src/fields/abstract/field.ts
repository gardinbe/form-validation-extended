import { FormControlElement, FormControlElementType } from "../../types/form-control-element";
import { CancellablePromise, datasetIsTrue, delay, watchAttributes } from "../../utils";

/** Base form control element that all other form control elements inherit. */
export type FieldElement<
	TElement extends FormControlElement = FormControlElement,
	TElementType extends FormControlElementType = FormControlElementType,
	TDataset extends object = object
> = TElement & {
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
		 *
		 * If omitted, error messages will appear far more generic.
		 */
		fvDisplayName?: string;
		/** The name of the field whose value this one must match. */
		fvMatch?: string;
	} & TDataset;
};

type FieldInvalidatorWhen = "with-other-checks" | "before-other-checks" | "after-other-checks-passed";
type FieldInvalidatorCheck = (value: string, invalidate: (reason: string) => void) => CancellablePromise<void>;
/** Field invalidator object to check and determine the field's validity. */
type FieldInvalidator = {
	when: FieldInvalidatorWhen;
	check: FieldInvalidatorCheck;
	instance: ReturnType<FieldInvalidatorCheck> | null;
};

/** A non-cancellable field invalidator check. */
type RawFieldInvalidator = (...args: Parameters<FieldInvalidatorCheck>) => void | Promise<void>;

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
	 * `"with-other-checks"` - Execute this check alongside all of the other default checks.
	 *
	 * `"before-other-checks"` - Execute this check before the other checks have executed.
	 *
	 * `"after-other-checks-passed"` - Execute this check after all of the other checks have executed **and passed**.
	 * Bear in mind that *'other checks'* in this case means all other checks that are not `"after-other-checks-passed"` ones.
	 *
	 * @defaultValue "with-other-checks"
	 */
	when: FieldInvalidatorWhen;
};

/**
 * Represents a form field.
 */
export abstract class Field {
	/** The control associated with this field. */
	readonly elmt: FieldElement;

	/** The list element where errors will be displayed to.  */
	readonly errorsListElmt: HTMLUListElement | null;

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

	/** The other field whose value this field must match. Set by the parent `FormValidator`. */
	matchTo: Field | null = null;
	/** The other fields whose values must match this field. Set by the parent `FormValidator`. */
	readonly matchOf: Field[] = [];

	protected eventHandler: ((this: void, ev: Event) => void) | null = null;

	/**
	 * @param elmt - The form control element associated with this field.
	 */
	constructor(elmt: FieldElement) {
		this.elmt = elmt;

		this.errorsListElmt = document
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
				&& (value !== this.matchTo.elmt.value
					|| (value === "" && datasetIsTrue(this.matchTo.elmt.dataset.fvRequired)))
			) {
				invalidate(
					this.matchTo.elmt.dataset.fvDisplayName !== undefined
						? `${this.elmt.dataset.fvDisplayName ?? "This"} does not match ${this.matchTo.elmt.dataset.fvDisplayName}`
						: `${this.elmt.dataset.fvDisplayName ?? "This"} does not match`
				);
			}
		});
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
			//if cancelled, invalidate
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

		await Promise.all(setAndGetInstances("before-other-checks"));

		//only continue if these checks all passed
		if (!this.valid)
			return;

		await Promise.all(setAndGetInstances("with-other-checks"));

		//only continue if these checks all passed
		if (!this.valid)
			return;

		await Promise.all(setAndGetInstances("after-other-checks-passed"));
	}

	/**
	 * Add an additional invalidation check to the field.
	 * @param invalidator - Invalidation check function. Call `invalidate` with a reason to invalidate the field.
	 * @param options - Options
	 */
	addInvalidator(invalidator: RawFieldInvalidator, options?: Partial<AddFieldInvalidationCheckOptions>) {
		const transformedInvalidator: FieldInvalidator = {
			when: options?.when ?? "with-other-checks",
			//TODO -> this implementation seems very wrong...
			check(value, invalidate) {
				return new CancellablePromise((resolve, _reject, signal) =>
					void (async () => {
						if (options?.debounce !== undefined) {
							await delay(options.debounce);
							if (signal.aborted) //if the CancellablePromise has already been canelled & rejected
								return;
						}

						await invalidator(value, reason => {
							if (signal.aborted) //if the CancellablePromise has already been canelled & rejected
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

		if (this.errorsListElmt !== null)
			while (this.errorsListElmt.lastChild !== null)
				this.errorsListElmt.removeChild(this.errorsListElmt.lastChild);

		this.elmt.dataset.fvValid = "true";

		this.valid = true;
	}

	/**
	 * Invalidate the field. If invalidated multiple times, reasons will be accumulated.
	 * @param reason - Reason for invalidation
	 */
	protected invalidate(reason?: string) {
		if (reason !== undefined) {
			this.errors.push(reason);

			if (this.errorsListElmt !== null) {
				const li = document.createElement("li");
				li.textContent = reason;
				this.errorsListElmt.appendChild(li);
			}
		}

		this.elmt.dataset.fvValid = "false";

		this.valid = false;
	}

	/**
	 * Watch the field's specified attributes and check it's validity if they change.
	 * @param attributes - Target attributes
	 */
	protected checkOnAttributesChange(attributes: string | string[]) {
		watchAttributes(
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
	 * Create the initial dataset properties.
	 */
	protected initDataset() {
		this.elmt.dataset.fvValid = `${this.valid}`;
		this.elmt.dataset.fvCheckingValidity = "false";
	}
}