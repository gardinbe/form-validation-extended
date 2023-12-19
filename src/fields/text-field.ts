import { merge } from "lodash";
import { UserEntryField, UserEntryFieldElement } from "./abstract/user-entry-field";

/** A text-based form control element. */
export type TextFieldElement = UserEntryFieldElement<
	HTMLInputElement | HTMLTextAreaElement,
	"text" | "tel" | "email" | "url" | "password" | "search" | "textarea",
	{
		/** The regex pattern the value must match. */
		fvPattern?: string;
		/** The label for the pattern, e.g. postcode, phone number, etc. */
		fvPatternLabel?: string;
		/** 
		 * The regex pattern preset for the field.
		 * 
		 * This takes priority over the standard pattern and pattern label if set.
		 */
		fvPatternPreset?: string;
	}
>;

/** Options for a text-based form field.  */
export type TextFieldOptions<T extends Record<string, RegExp> = Record<string, RegExp>> = {
	/** Object of pattern presets used to test common field types. */
	patternPresets: T;
};

/** Default presets used to test common field types. */
type TextFieldDefaultPatternPresets = {
	/** Email testing regex pattern. */
	email: RegExp;
	/** Phone number testing regex pattern. */
	phoneNumber: RegExp;
};

/**
 * A text-based form field.
 */
export class TextField extends UserEntryField {
	static readonly defaultOptions: TextFieldOptions<TextFieldDefaultPatternPresets> = {
		patternPresets: {
			// see this page: https://stackoverflow.com/a/201378
			// eslint-disable-next-line no-control-regex
			email: /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
			phoneNumber: /^[\s+()\d]*$/
		}
	};

	override readonly elmt: TextFieldElement;
	protected readonly options: TextFieldOptions<TextFieldDefaultPatternPresets>;

	/**
	 * @param elmt - The text-based form control element associated with this field.
	 * @param options - Target options
	 */
	constructor(elmt: TextFieldElement, options?: Partial<TextFieldOptions>) {
		super(elmt);
		this.elmt = elmt;
		this.options = merge({}, TextField.defaultOptions, options);

		this.checkOnAttributesChange([
			"data-fv-pattern",
			"data-fv-pattern-label",
			"data-fv-pattern-preset"
		]);

		//check regex pattern
		this.addInvalidator((value, invalidate) => {
			const pattern = this.getPatternRegExp();

			if (pattern !== null && this.elmt.dataset.fvPatternPreset !== undefined)
				console.warn(`Form control '${this.elmt.name}' has both a custom pattern 'data-fv-pattern' and preset pattern 'data-fv-pattern-preset' set. The custom pattern is being ignored.`);

			//check custom pattern only if no preset is set
			if (this.elmt.dataset.fvPatternPreset !== undefined) {
				if (
					this.elmt.dataset.fvPatternPreset === "email"
					&& !this.options.patternPresets.email.test(value)
				)
					invalidate("This is not a valid email");

				if (
					this.elmt.dataset.fvPatternPreset === "phone-number"
					&& !this.options.patternPresets.phoneNumber.test(value)
				)
					invalidate("This is not a valid phone number");

			} else if (pattern !== null && !pattern.test(value))
				invalidate(`This is not a valid ${this.elmt.dataset.fvPatternLabel ?? "value"}`);
		});
	}

	/**
	 * Get the pattern's regex expression object.
	 * @returns regular expression
	 */
	private getPatternRegExp() {
		const patternStr = this.elmt.dataset.fvPattern;

		const pattern = patternStr !== undefined
			? new RegExp(patternStr)
			: null;

		return pattern;
	}
}