import { FormControlElement, FormControlElementType } from "../../types/form-control-element";
import { CancellablePromise, datasetIsTrue, delay } from "../../utils";

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
		 * @note If omitted, error messages will appear far more generic.
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
	private valid: boolean;

	/** List of all errors on the field. */
	readonly errors: string[] = [];

	/** Array of invalidator function to check and determine the field's validity. */
	private readonly invalidators: FieldInvalidator[] = [];

	/** The other field whose value this field must match. */
	matchTo: Field | null;
	/** The other fields whose values must match this field. */
	readonly matchOf: Field[];

	protected valueEventHandler: ((this: void, ev: Event) => void) | null = null;

	/**
	 * @param elmt The form control element associated with this field.
	 */
	constructor(elmt: FieldElement) {
		this.elmt = elmt;

		this.valid = false;

		//these are set by the parent `FormValidator`
		this.matchTo = null;
		this.matchOf = [];

		this.errorsListElmt = document
			.querySelector<HTMLUListElement>(`[data-fv-errors="${elmt.name}"]`);

		this.addInvalidator((value, invalidate) => {
			if (
				this.matchTo !== null &&
				(value !== this.matchTo.elmt.value ||
					(value === "" && datasetIsTrue(this.matchTo.elmt.dataset.fvRequired)))
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
		this.elmt.dataset.fvCheckingValidity = "true";

		try {
			await this.runInvalidationChecks().catch(() => { });
		} catch (e) {
			return;
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
		//assume valid until invalidated
		this.validate();

		/**
		 * Filter the invalidators by `when` they should execute, create their instances, and
		 * return those instances.
		 * @param when Filter invalidators by `when` they should execute
		 */
		const setAndGetInstances = (when: FieldInvalidatorWhen) =>
			this.invalidators
				.filter(inv => inv.when === when)
				.map(inv => {
					inv.instance = inv.check(
						this.elmt.value,
						this.invalidate.bind(this)
					);
					return inv.instance;
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
	 * @param invalidator Invalidation check function. Call `invalidate` with a reason to invalidate the field.
	 * @param options Options
	 */
	addInvalidator(invalidator: RawFieldInvalidator, options?: Partial<AddFieldInvalidationCheckOptions>) {
		const transformedInvalidator: FieldInvalidator = {
			when: options?.when ?? "with-other-checks",
			//TODO -> this implementation seems very wrong...
			check(value, invalidate) {
				return new CancellablePromise((resolve, _reject, signal) => {
					void (async () => {
						if (options?.debounce !== undefined) {
							await delay(options.debounce);
							//check if this inner promise should be disregarded
							if (signal.aborted)
								return;
						}

						await invalidator(value, reason => {
							//check if this inner promise should be disregarded
							if (signal.aborted)
								return;
							invalidate(reason);
						});

						resolve();
					})();
				});
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
	 * @param reason Reason for invalidation
	 */
	protected invalidate(reason: string) {
		this.errors.push(reason);

		if (this.errorsListElmt !== null) {
			const li = document.createElement("li");
			li.textContent = reason;
			this.errorsListElmt.appendChild(li);
		}

		this.elmt.dataset.fvValid = "false";

		this.valid = false;
	}

	/**
	 * Create the initial dataset properties.
	 */
	protected initDataset() {
		this.elmt.dataset.fvValid = `${this.valid}`;
		this.elmt.dataset.fvCheckingValidity = "false";
	}

	/**
	 * Watch the field's value and validate it on any changes.
	 * @param callback Callback function executed after validity checks
	 */
	validateOnChange() {
		if (this.valueEventHandler !== null)
			return;

		this.valueEventHandler = () => {
			void this.checkValidity();
		};

		this.elmt.addEventListener("input", this.valueEventHandler);
		this.elmt.addEventListener("change", this.valueEventHandler);
	}

	/**
	 * Ignore any changes to the field's value. This removes all attached event
	 * listeners!
	 */
	stopValidatingOnChange() {
		if (this.valueEventHandler === null)
			return;

		this.elmt.removeEventListener("input", this.valueEventHandler);
		this.elmt.removeEventListener("change", this.valueEventHandler);
	}
}