import { merge } from "lodash";
import { FieldControl, FieldOptions } from "./field";
import { StandardField } from "./standard-field";

/** Options for a text-based form field.  */
export type TextFieldOptions = FieldOptions & {
	/** Object of pattern presets used to test common field types. */
	patternPresets: TextFieldPatternPresets;
};

/** Pattern presets used to test common field types. */
type TextFieldPatternPresets = {
	/** Email testing regex pattern. */
	email: RegExp;
	/** Phone number testing regex pattern. */
	phoneNumber: RegExp;
};

/** A text-based form control. */
export type TextFieldControl = FieldControl<HTMLInputElement & {
	type: "text" | "tel" | "email" | "url" | "password" | "search";
}, {
	/** The regex pattern the value must match. */
	fvPattern?: string;
	/** The pattern preset for the string.
	 * 
	 * @note This takes priority over the standard pattern if both set.
	 */
	fvPatternPreset?: string;
	/** The label for the pattern, e.g. postcode, phone number, etc. */
	fvPatternLabel?: string;
}>;

/**
 * A text-based form field.
 */
export class TextField extends StandardField {
	static override readonly defaultOptions: TextFieldOptions = {
		...super.defaultOptions,
		patternPresets: {
			// see this page: https://stackoverflow.com/a/201378
			// eslint-disable-next-line no-control-regex
			email: /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
			phoneNumber: /^[\s+()\d]*$/
		}
	};

	override readonly elmt: TextFieldControl;
	protected override readonly options: TextFieldOptions;

	/**
	 * @param elmt The text-based form control associated with this field.
	 * @param options Target options
	 */
	constructor(elmt: TextFieldControl, options?: Partial<TextFieldOptions>) {
		super(elmt, options);
		this.elmt = elmt;
		this.options = merge({}, TextField.defaultOptions, options);
	}

	protected override validationChecks() {
		super.validationChecks();

		const pattern = this.getPatternRegExp();

		if (pattern !== null && this.elmt.dataset.fvPatternPreset !== undefined)
			console.warn(`Form control '${this.elmt.name}' has both a custom pattern 'data-fv-pattern' and preset pattern 'data-fv-pattern-preset' set. The custom pattern is being ignored.`);

		//check custom pattern only if no preset is set
		if (this.elmt.dataset.fvPatternPreset !== undefined) {
			if (
				this.elmt.dataset.fvPatternPreset === "email" &&
				!this.options.patternPresets.email.test(this.elmt.value)
			)
				this.errors.push("This is not a valid email address");

			if (
				this.elmt.dataset.fvPatternPreset === "phone-number" &&
				!this.options.patternPresets.phoneNumber.test(this.elmt.value)
			)
				this.errors.push("This is not a valid phone number");

		} else if (pattern !== null && !pattern.test(this.elmt.value))
			this.errors.push(`This is not a valid ${this.elmt.dataset.fvPatternLabel ?? "value"}`);
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