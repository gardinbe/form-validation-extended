import { merge } from "lodash";
import { UserEntryField, UserEntryFieldElement } from "./abstract/user-entry-field";
import { OptionalProps } from "../types/utils";
import { FieldOptions } from "./abstract/field";

/** A text-based form control element. */
export type TextFieldElement = UserEntryFieldElement<
	HTMLInputElement | HTMLTextAreaElement,
	"text" | "tel" | "email" | "url" | "password" | "search" | "textarea",
	{
		/**
		 * The regex pattern the value must match.
		 */
		fvPattern?: string;
		/**
		 * The label for the pattern, e.g. postcode, phone number, etc.
		 */
		fvPatternLabel?: string;
		/**
		 * The regex pattern presets for the field.
		 *
		 * This takes priority over the standard pattern and pattern label if set.
		 */
		fvPatternPresets?: string;
	}
>;

/** Options for a text-based form field.  */
export type TextFieldOptions<
	TPatternPresets extends PatternPresets = PatternPresets
> = FieldOptions & {
	/** Object of pattern presets used to test common field types. */
	patternPresets?: TPatternPresets;
};

type PatternPresets = { [key: string]: PatternPreset; };

/** A pattern preset for a text-based field. */
type PatternPreset = {
	pattern: RegExp;
	error: string | ((displayName: string) => string);
};

/** Default pattern presets for a text-based field. */
type DefaultPatternPresets = PatternPresets & {
	"one-uppercase": PatternPreset;
	"one-lowercase": PatternPreset;
	"one-special": PatternPreset;
	"email": PatternPreset;
	"phone-number": PatternPreset;
};

/**
 * A text-based form field.
 */
export class TextField extends UserEntryField {
	static override readonly defaultOptions: Required<OptionalProps<
		TextFieldOptions<DefaultPatternPresets>
	>> = merge({}, super.defaultOptions, {
		patternPresets: {
			"one-uppercase": {
				pattern: /[A-Z]/, //TODO -> non-ascii uppercase?
				error(name: string) {
					return `${name} must have atleast one uppercase letter`;
				}
			},
			"one-lowercase": {
				pattern: /[a-z]/,
				error(name: string) {
					return `${name} must have atleast one lowercase letter`;
				}
			},
			"one-special": {
				pattern: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
				error(name: string) {
					return `${name} must have atleast one special character`;
				}
			},
			"email": {
				// see this page: https://stackoverflow.com/a/201378
				// eslint-disable-next-line no-control-regex
				pattern: /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
				error: "This is not a valid email"
			},
			"phone-number": {
				pattern: /^[\s+()\d]*$/,
				error: "This is not a valid phone number"
			}
		}
	});

	override readonly elmt: TextFieldElement;
	protected override readonly options: Required<TextFieldOptions<DefaultPatternPresets>>;

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
			"data-fv-pattern-presets"
		]);

		//check regex pattern
		this.addInvalidator((value, invalidate) => {
			const pattern = this.getPatternRegExp();

			if (value === "")
				return;

			if (pattern === null) {
				//if label and no pattern set, warn
				if (this.elmt.dataset.fvPatternLabel !== undefined)
					console.warn(`Form control '${this.elmt.name}' has a pattern label 'data-fv-pattern-label' set but no pattern 'data-fv-pattern' set. The pattern label label is unused.`);
				return;
			}

			if (!pattern.test(value))
				invalidate(`This is not a valid ${this.elmt.dataset.fvPatternLabel ?? "value"}`);
		});

		//check regex pattern preset(s)
		this.addInvalidator((value, invalidate) => {
			if (value === "" || this.elmt.dataset.fvPatternPresets === undefined)
				return;

			const presetNames: Set<string> = new Set();

			for (const group1 of this.elmt.dataset.fvPatternPresets.split(";"))
				for (const group2 of group1.split(","))
					presetNames.add(group2.trim());

			//TODO -> tidy up
			const presets = Array.from(presetNames)
				.map(name => ({ name, value: this.options.patternPresets[name] }));

			for (const preset of presets) {
				if (preset.value === undefined) {
					console.error(`Form control '${this.elmt.name}' is using an undefined pattern preset '${preset.name}'.`);
					continue;
				}

				if (!preset.value.pattern.test(value))
					invalidate(typeof preset.value.error === "string"
						? preset.value.error
						: preset.value.error(this.elmt.dataset.fvDisplayName ?? "This"));
			}
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