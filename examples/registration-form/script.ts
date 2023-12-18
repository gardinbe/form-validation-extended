import { FormValidator } from "../../dist";

/**
 * Get the form and instantiate the FormValidator.
 */
const form = document.querySelector("form")!;
const fv = new FormValidator(form);



/**
 * Have a look in devtools...
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
window.fv = fv;



/**
 * Watch and validate all field changes (after their initial values have been changed)...
 */
fv.watchAllFields();



/**
 * Perform any additional custom validation checks...
 */
const usernameField = fv.getField("username")!;

usernameField.addInvalidator(
	async (value, invalidate) => { //make an api call...
		const response = await checkUsernameExists(value);
		if (response.exists)
			invalidate("This username is in use");
	},
	{
		debounce: 1000,
		when: "after-other-checks-passed" // <-- you'll probably want this if you really are doing an api call
	}
);



/**
 * This could be an api call to check if a username exists, for example
 * @param username Username to check
 * @returns Response
 */
const checkUsernameExists = async (username: string) => {
	await new Promise(res => setTimeout(res, 250));
	return {
		exists: username.length % 2 === 0
	};
};



/**
 * On form submission...
 */
form.addEventListener("submit", ev => {
	ev.preventDefault();

	void (async () => {
		//check the validity of the entire form
		if (!(await fv.checkValidity()))
			return;

		//submit form...

		const name = fv.getField("name")!.elmt.value;
		alert(`Thanks ${name}, your (theoretical) registration was successful!`);
	})();
});