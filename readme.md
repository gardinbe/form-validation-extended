# form-validation-extended

A replacement to and an extension of standard HTML form validation.

**Validation rules are specified as attributes on the form control elements themselves**: forms can be built very rapidly without having to write any JS at all.

**You can define your own custom validity checks** to be executed alongside the other validity checks. This includes asynchronous checks: perhaps you need to communicate with an API to determine the validity of the value, etc. An example of this is below.

**Dynamic forms are supported**: *every* change, addition or removal of a form control is immediately recognised and reflected.




# Example HTML

```html
<form>
	<label>
		Username
		<input
			type="text"
			name="username"
			placeholder="Username..."
			data-fv-validate                    <== Enable validation for this field
			data-fv-display-name="Username"     <== Set the display name used on error messages
			data-fv-min-length="4"              <== The minimum length the username can be
			data-fv-pattern="^[a-zA-Z0-9]*$"    <== Can only contains letters and numbers
			data-fv-pattern-label="username"    <== Label the pattern (for pattern-related error messages)
		>
	</label>
	<label>
		Email address
		<input
			type="email"
			name="email"
			placeholder="Email..."
			data-fv-validate
			data-fv-display-name="Email"
			data-fv-required
			data-fv-pattern-preset="email"      <== Use the email regex pattern preset
		>
	</label>
	<label>
		Confirm email
		<input
			type="email"
			name="confirm-email"
			placeholder="Confirm email..."
			data-fv-validate
			data-fv-display-name="Email confirmation"
			data-fv-required
			data-fv-match="email"               <== Value must match to the `email` field
		>
	</label>
</form>
```




# Example JS

```typescript
//------------------------------------------------
// Get the form and instantiate the FormValidator
//------------------------------------------------

const form = document.querySelector("form")!;
const fv = new FormValidator(form);



//-------------------------------------------------------------------------------------
// Watch and validate all field changes (after their initial values have been changed)
//-------------------------------------------------------------------------------------

fv.watchAllFields();



//--------------------------------------------------------------
// Perform any additional custom validity checks if you need to
//--------------------------------------------------------------

const usernameField = fv.getField("username")!;
usernameField.addInvalidator(
	async (value, invalidate) => {
		const exists = await checkIfUsernameExists(value); //make an api call, for example
		if (exists)
			invalidate("This username is in use");
	},
	{
		debounce: 1000, //delay between invalidator executions (don't spam the api)
		when: "after-other-checks-passed" //you'll probably want this option for api calls
	}
);



//--------------------
// On form submission
//--------------------

form.addEventListener("submit", ev => {
	ev.preventDefault();

	void (async () => {

		//---------------------------------------
		// Check the validity of the entire form
		//---------------------------------------
		// if the form is invalid, or if the validity check is cancelled
		// by the user changing the inputs or resubmitting the form, do not submit.

		if (!(await fv.checkValidity()))
			return;

		//submit form...
	})();
});
```




# User-accessible attributes (for CSS)

#### `data-fv-valid="[true/false]"`
The current validity of the field.

#### `data-fv-checking-validity="[true/false]"`
Whether the validity of the field is currently being checked.

This can be particularly useful when performing asynchronous validity checks, as you can display a loading indicator to indicate such to the user. See an example of this with the 'username' field on the registration-form provided within the [examples](https://github.com/gardinbe/form-validation-extended/tree/master/examples).




# User-defined attributes

## Field error lists

#### `data-fv-errors="[field-name]"`
You can specifiy the list element for where the errors of particular field should be printed to.

If omitted, there won't be any clear indication to the user as to why a field would be invalid.

For example:

```html
<ul data-fv-errors="age"></ul>
```




## Reused form control attributes
These are form control attributes that have been repurposed/reused and have an effect on the field's validity.

#### `disabled`
Whether the field should be disabled or not.

A field that's `disabled` or has no `data-fv-validate` attribute will always be valid, regardless of it's value.

**Note**: Adding the `disabled` attribute to a field retains the default behaviour (user inputs disabled, and not included within form submissions). *To disable only the validation of the field, look at* `data-fv-validate`.




## All form controls

#### `data-fv-validate="[empty or truthy value]"`
Whether the field should be validated or not.

A field that's `disabled` or has no `data-fv-validate` attribute will always be valid, regardless of it's value.

#### `data-fv-required="[empty or truthy value]"`
Whether the field can have a default/empty value.

For Radio buttons/Checkboxes, at least one must be checked.

#### `data-fv-display-name="[name]"`
The display name used for the field. If omitted, error messages will appear far more generic.

#### `data-fv-match="[other-field-name]"`
This specifies the name of another field whose value this one must match.

For example confirm email, password, etc.




## User-entry form controls
Any form control of the following type is considered a user-entry field:

- `text`
- `tel`
- `email`
- `url`
- `password`
- `search`
- `textarea`
- `date`
- `month`
- `week`
- `time`
- `datetime-local`
- `number`
- `range`

#### `data-fv-min-length="[integer]"`
The minimum length allowed for the value.

#### `data-fv-max-length="[integer]"`
The maximum length allowed for the value.




## Text-based form controls
Any form control of the following type is considered a text field:

- `text`
- `tel`
- `email`
- `url`
- `password`
- `search`
- `textarea`

#### `data-fv-pattern="[regex-pattern]"`
The regex pattern the value must match.

**Note:** Don't include the forward slashes.

**Note:** This is overridden by `data-fv-pattern-preset`.

#### `data-fv-pattern-label="[label]"`
The label for the pattern.

For example 'postcode', 'phone number', etc.

**Note:** This is overridden by `data-fv-pattern-preset`.

#### `data-fv-pattern-preset="[a-pattern-preset]"`
The regex pattern preset for the field.

The default presets are `"email"` and `"phone-number"`. You can define additional (or replace existing) pattern presets within the options of the `FormValidator` constructor.

```typescript
const fv = new FormValidator(form, {
	patternPresets: {
		postcode: /some-regex-pattern/
		...
	}
});
```

**Note:** This takes priority over the standard `data-fv-pattern` and `data-fv-pattern-label` if they are set.




## Numeric form controls
Any form control of the following type is considered a numeric field:

- `date`
- `month`
- `week`
- `time`
- `datetime-local`
- `number`
- `range`

#### `data-fv-min=[number]`
The minimum numeric value the field can have.

#### `data-fv-max=[number]`
The maximum numeric value the field can have.