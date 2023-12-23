import { FormValidator } from "../../src/form-validator";

//------------------------------------------------
// Get the form and instantiate the FormValidator
//------------------------------------------------

const form = document.querySelector("form")!;
const fv = new FormValidator(form, {
	patternPresets: {
		"very-cool": {
			pattern: /very-cool/,
			error: "This is not a cool value" //can be a string
		},
		"amazing": {
			pattern: /amazing/,
			error(name) { //or a function using the `data-fv-display-name`
				return `${name} must have 'amazing' within it`;
			}
		}
	},
	errorHtmlTemplate(message) {
		return `<li>${message}</li>`;
	}
});

//have a look in devtools...
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
window.fv = fv;



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
		when: "after-others" //you'll probably want this option for api calls
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

		alert("Thanks, your (theoretical) registration was successful!");
	})();
});



//----------------------------------------------------------------------
// This could be an api call to check if a username exists, for example
//----------------------------------------------------------------------

const checkIfUsernameExists = async (username: string) => {
	await new Promise(res => setTimeout(res, 250));
	return username.length % 2 === 0;
};