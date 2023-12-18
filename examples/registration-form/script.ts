import { FormValidator } from "../../dist";

/*
 * Get the form and instantiate the FormValidator.
 */
const form = document.querySelector("form")!;
const fv = new FormValidator(form);


/*
 * Have a look in devtools...
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
window.fv = fv;


/*
 * Watch and validate all field changes (after their initial values have been changed)
 */
fv.watchAllFields();


/*
 * Perform any additional custom validation checks if you need to
 */
const usernameField = fv.getField("username")!;
usernameField.addInvalidator(
	async (value, invalidate) => {
		const exists = await checkIfUsernameExists(value); //make an api call, for example
		if (exists)
			invalidate("This username is in use");
	},
	{
		debounce: 1000,
		when: "after-other-checks-passed" //you'll probably want this option for api calls
	}
);


/*
 * On form submission
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


/**
 * This could be an api call to check if a username exists, for example.
 * @param username Username to check
 * @returns Response
 */
const checkIfUsernameExists = async (username: string) => {
	await new Promise(res => setTimeout(res, 250));
	return username.length % 2 === 0;
};