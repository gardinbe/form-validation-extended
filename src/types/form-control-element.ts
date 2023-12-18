/** Any element that can be considered a form control. */
export type FormControlElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
export type FormControlElementType = StandardFormControlElementType
	| "radio"
	| "checkbox";


/** Any form control that can have an empty value. */
export type StandardFormControlElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
export type StandardFormControlElementType = UserEntryFormControlElementType
	| "select-one"
	| "select-multiple";


/** Any form control that takes a user entry as an input. */
export type UserEntryFormControlElement = HTMLInputElement | HTMLTextAreaElement;
export type UserEntryFormControlElementType =
	"text"
	| "tel"
	| "email"
	| "url"
	| "password"
	| "search"
	| "date"
	| "month"
	| "week"
	| "time"
	| "datetime-local"
	| "number"
	| "range";