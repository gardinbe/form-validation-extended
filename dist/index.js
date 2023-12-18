var w = Object.defineProperty;
var b = (n, e, t) => e in n ? w(n, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : n[e] = t;
var l = (n, e, t) => (b(n, typeof e != "symbol" ? e + "" : e, t), t);
import { merge as m } from "lodash";
class y extends Promise {
  constructor(t) {
    const a = new AbortController();
    a.signal.throwIfAborted();
    super((s, i) => {
      t(s, i, a.signal);
    });
    l(this, "abortController");
    this.abortController = a;
  }
  /**
   * Cancel the promise.
   * 
   * This rejects the promise and then updates the abort signal.
   */
  cancel() {
    this.abortController.abort();
  }
}
const c = (n) => n !== void 0 ? ["", "true", "1"].includes(n) : !1, F = (n) => new Promise((e) => setTimeout(e, n)), f = (n, e, t) => {
  new MutationObserver((a) => t(a[a.length - 1])).observe(n, { attributes: !0, attributeFilter: [...e] });
};
class p {
  /**
   * @param elmt The form control element associated with this field.
   */
  constructor(e) {
    /** The control associated with this field. */
    l(this, "elmt");
    /** The list element where errors will be displayed to.  */
    l(this, "errorsListElmt");
    /**
     * The validity of the field.
     * 
     * Not publically exposed - call `checkValidity()` to get this.
     */
    l(this, "valid");
    /** List of all errors on the field. */
    l(this, "errors", []);
    /** Array of invalidator function to check and determine the field's validity. */
    l(this, "invalidators", []);
    /** The other field whose value this field must match. */
    l(this, "matchTo");
    /** The other fields whose values must match this field. */
    l(this, "matchOf");
    l(this, "valueEventHandler", null);
    this.elmt = e, this.valid = !1, this.matchTo = null, this.matchOf = [], this.errorsListElmt = document.querySelector(`[data-fv-errors="${e.name}"]`), this.addInvalidator((t, a) => {
      this.matchTo !== null && (t !== this.matchTo.elmt.value || t === "" && c(this.matchTo.elmt.dataset.fvRequired)) && a(
        this.matchTo.elmt.dataset.fvDisplayName !== void 0 ? `${this.elmt.dataset.fvDisplayName ?? "This"} does not match ${this.matchTo.elmt.dataset.fvDisplayName}` : `${this.elmt.dataset.fvDisplayName ?? "This"} does not match`
      );
    });
  }
  /**
   * Check the validity of the field's value.
   */
  async checkValidity() {
    this.elmt.dataset.fvCheckingValidity = "true";
    try {
      await this.runInvalidationChecks().catch(() => {
      });
    } catch {
      return;
    }
    return this.elmt.dataset.fvCheckingValidity = "false", Promise.all(this.matchOf.map((e) => e.checkValidity())), this.valid;
  }
  /**
   * Run all of the validation checks to determine the field's validity.
   */
  async runInvalidationChecks() {
    var t;
    this.validate();
    const e = (a) => this.invalidators.filter((s) => s.when === a).map((s) => (s.instance = s.check(
      this.elmt.value,
      this.invalidate.bind(this)
    ), s.instance));
    for (const a of this.invalidators)
      (t = a.instance) == null || t.cancel();
    await Promise.all(e("before-other-checks")), this.valid && (await Promise.all(e("with-other-checks")), this.valid && await Promise.all(e("after-other-checks-passed")));
  }
  /**
   * Add an additional invalidation check to the field.
   * @param invalidator Invalidation check function. Call `invalidate` with a reason to invalidate the field.
   * @param options Options
   */
  addInvalidator(e, t) {
    const a = {
      when: (t == null ? void 0 : t.when) ?? "with-other-checks",
      //TODO -> this implementation seems very wrong...
      check(s, i) {
        return new y((r, P, v) => {
          (async () => (t == null ? void 0 : t.debounce) !== void 0 && (await F(t.debounce), v.aborted) || (await e(s, (g) => {
            v.aborted || i(g);
          }), r()))();
        });
      },
      instance: null
    };
    this.invalidators.push(a);
  }
  /**
   * Validate the field.
   */
  validate() {
    if (this.errors.splice(0, this.errors.length), this.errorsListElmt !== null)
      for (; this.errorsListElmt.lastChild !== null; )
        this.errorsListElmt.removeChild(this.errorsListElmt.lastChild);
    this.elmt.dataset.fvValid = "true", this.valid = !0;
  }
  /**
   * Invalidate the field. If invalidated multiple times, reasons will be accumulated.
   * @param reason Reason for invalidation
   */
  invalidate(e) {
    if (this.errors.push(e), this.errorsListElmt !== null) {
      const t = document.createElement("li");
      t.textContent = e, this.errorsListElmt.appendChild(t);
    }
    this.elmt.dataset.fvValid = "false", this.valid = !1;
  }
  /**
   * Create the initial dataset properties.
   */
  initDataset() {
    this.elmt.dataset.fvValid = `${this.valid}`, this.elmt.dataset.fvCheckingValidity = "false";
  }
  /**
   * Watch the field's value and validate it on any changes.
   * @param callback Callback function executed after validity checks
   */
  validateOnChange() {
    this.valueEventHandler === null && (this.valueEventHandler = () => {
      this.checkValidity();
    }, this.elmt.addEventListener("input", this.valueEventHandler), this.elmt.addEventListener("change", this.valueEventHandler));
  }
  /**
   * Ignore any changes to the field's value. This removes all attached event
   * listeners!
   */
  stopValidatingOnChange() {
    this.valueEventHandler !== null && (this.elmt.removeEventListener("input", this.valueEventHandler), this.elmt.removeEventListener("change", this.valueEventHandler));
  }
}
class x extends p {
  /**
   * @param elmt The form control element associated with this field.
   */
  constructor(t) {
    super(t);
    l(this, "elmt");
    this.elmt = t, this.addInvalidator((a, s) => {
      this.elmt.dataset.fvRequired !== void 0 && this.matchTo === null && c(this.elmt.dataset.fvRequired) && a === "" && s(`${this.elmt.dataset.fvDisplayName ?? "This"} is required`);
    });
  }
}
class E extends x {
  /**
   * @param elmt The form control element associated with this field.
   */
  constructor(t) {
    super(t);
    l(this, "elmt");
    this.elmt = t, this.addInvalidator((a, s) => {
      if (this.elmt.dataset.fvMinLength !== void 0) {
        const i = parseInt(this.elmt.dataset.fvMinLength);
        if (isNaN(i))
          throw new Error(`Form control '${this.elmt.name}' has an invalid minimum length 'data-fv-min-length' value`);
        this.elmt.value.length < i && s(`${this.elmt.dataset.fvDisplayName ?? "This"} must have more than ${i} characters`);
      }
    }), this.addInvalidator((a, s) => {
      if (this.elmt.dataset.fvMaxLength !== void 0) {
        const i = parseInt(this.elmt.dataset.fvMaxLength);
        if (isNaN(i))
          throw new Error(`Form control '${this.elmt.name}' has an invalid maximum length 'data-fv-max-length' value`);
        this.elmt.value.length >= i && s(`${this.elmt.dataset.fvDisplayName ?? "This"} must have less than or equal to ${i} characters`);
      }
    });
  }
}
class $ extends E {
  /**
   * @param elmt The numeric form control element associated with this field.
   */
  constructor(t) {
    super(t);
    l(this, "elmt");
    this.elmt = t, this.addInvalidator((a, s) => {
      if (this.elmt.dataset.fvMin !== void 0) {
        const i = parseInt(this.elmt.dataset.fvMin);
        if (isNaN(i))
          throw new Error(`Form control '${this.elmt.name}' has an invalid minimum 'data-fv-min' value`);
        parseInt(this.elmt.value) < i && s(`${this.elmt.dataset.fvDisplayName ?? "This"} must be greater than or equal to ${i}`);
      }
    }), this.addInvalidator((a, s) => {
      if (this.elmt.dataset.fvMax !== void 0) {
        const i = parseInt(this.elmt.dataset.fvMax);
        if (isNaN(i))
          throw new Error(`Form control '${this.elmt.name}' has an invalid maximum 'data-fv-max' value`);
        parseInt(this.elmt.value) > i && s(`${this.elmt.dataset.fvDisplayName ?? "This"} must be less than or equal to ${i}`);
      }
    });
  }
}
class C extends p {
  /**
   * @param elmt The radio/checkbox form control element associated with this field.
   */
  constructor(t) {
    super(t);
    l(this, "elmt");
    /** All the other form controls assoicated with this radio/checkbox. */
    l(this, "associatedElmts");
    this.elmt = t, this.associatedElmts = Array.from(t.form.elements).filter((a) => a.type === t.type && //double check the type matches
    a.name === t.name), this.addInvalidator((a, s) => {
      this.elmt.dataset.fvRequired !== void 0 && c(this.elmt.dataset.fvRequired) && !this.associatedElmts.some((i) => i.checked) && s(`${this.elmt.dataset.fvDisplayName ?? "This"} is required`);
    });
  }
  validate() {
    super.validate();
    for (const t of this.associatedElmts)
      t.dataset.fvValid = "true";
  }
  invalidate(t) {
    super.invalidate(t);
    for (const a of this.associatedElmts)
      a.dataset.fvValid = "false";
  }
  validateOnChange() {
    if (super.validateOnChange(), this.valueEventHandler !== null)
      for (const t of this.associatedElmts)
        t.addEventListener("input", this.valueEventHandler), t.addEventListener("change", this.valueEventHandler);
  }
  stopValidatingOnChange() {
    if (super.stopValidatingOnChange(), this.valueEventHandler !== null)
      for (const t of this.associatedElmts)
        t.removeEventListener("input", this.valueEventHandler), t.removeEventListener("change", this.valueEventHandler);
  }
}
class L extends x {
  /**
   * @param elmt The select box/dropdown form control element associated with this field.
   */
  constructor(t) {
    super(t);
    l(this, "elmt");
    this.elmt = t;
  }
}
const o = class o extends E {
  /**
   * @param elmt The text-based form control element associated with this field.
   * @param options Target options
   */
  constructor(t, a) {
    super(t);
    l(this, "elmt");
    l(this, "options");
    this.elmt = t, this.options = m({}, o.defaultOptions, a), this.addInvalidator((s, i) => {
      const r = this.getPatternRegExp();
      r !== null && this.elmt.dataset.fvPatternPreset !== void 0 && console.warn(`Form control '${this.elmt.name}' has both a custom pattern 'data-fv-pattern' and preset pattern 'data-fv-pattern-preset' set. The custom pattern is being ignored.`), this.elmt.dataset.fvPatternPreset !== void 0 ? (this.elmt.dataset.fvPatternPreset === "email" && !this.options.patternPresets.email.test(s) && i("This is not a valid email"), this.elmt.dataset.fvPatternPreset === "phone-number" && !this.options.patternPresets.phoneNumber.test(s) && i("This is not a valid phone number")) : r !== null && !r.test(s) && i(`This is not a valid ${this.elmt.dataset.fvPatternLabel ?? "value"}`);
    });
  }
  /**
   * Get the pattern's regex expression object.
   * @returns regular expression
   */
  getPatternRegExp() {
    const t = this.elmt.dataset.fvPattern;
    return t !== void 0 ? new RegExp(t) : null;
  }
};
l(o, "defaultOptions", {
  patternPresets: {
    // see this page: https://stackoverflow.com/a/201378
    // eslint-disable-next-line no-control-regex
    email: /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
    phoneNumber: /^[\s+()\d]*$/
  }
});
let h = o;
const d = class d {
  /**
   * @param form Target form element
   * @param options Options
   */
  constructor(e, t) {
    /** List of all of the fields that are being validated. */
    l(this, "fields", []);
    /** The form element being validated. */
    l(this, "form");
    l(this, "options");
    this.form = e, this.form.noValidate = !0, this.options = m({}, d.defaultOptions, t), this.loadAllFields();
  }
  /**
   * Get an instance of a field by it's name.
   * @param name Target form control name
   * @returns Field instance
   */
  getField(e) {
    return this.fields.find((t) => t.elmt.name === e) ?? null;
  }
  /**
   * Check the validity of all of the fields in the form.
   */
  async checkValidity() {
    return !(await Promise.all(this.fields.map((t) => t.checkValidity()))).some((t) => !t);
  }
  /**
   * Watch the all of the fields and validate them on any changes.
   */
  watchAllFields() {
    for (const e of this.fields)
      e.validateOnChange();
  }
  /**
   * Ignore any changes to the fields.
   */
  ignoreAllFields() {
    for (const e of this.fields)
      e.stopValidatingOnChange();
  }
  /**
   * Get and set all fields to be validated into the form validator.
   * @returns Fields to be validated
   */
  loadAllFields() {
    const e = Array.from(this.form.elements).filter((t) => t.dataset.fvValidate !== void 0);
    for (const t of e) {
      if (
        //do not add the same field again
        this.fields.some((s) => s.elmt === t) || //and do not add fields with the same name (radio & checkboxes)
        t.name !== "" && this.fields.some((s) => s.elmt.name === t.name)
      )
        continue;
      const a = this.createField(t);
      this.addField(a);
    }
    for (const t of this.fields.filter((a) => !e.some((s) => a.elmt === s)))
      this.removeField(t);
    this.setFieldsRelations();
  }
  /**
   * Create a form validator field for a form control.
   * @param elmt Target form control
   * @returns Form validator field
   */
  createField(e) {
    switch (e.type) {
      case "text":
      case "tel":
      case "email":
      case "url":
      case "password":
      case "search":
      case "textarea":
        return new h(e, this.options);
      case "select-one":
      case "select-multiple":
        return new L(e);
      case "radio":
      case "checkbox":
        return new C(e);
      case "date":
      case "month":
      case "week":
      case "time":
      case "datetime-local":
      case "number":
      case "range":
        return new $(e);
      default:
        throw new Error(`Failed to create field using a form control of an unknown type '${e.type}'`);
    }
  }
  /**
   * Add a field to the form validator.
   * @param elmt Target field
   */
  addField(e) {
    this.fields.push(e);
  }
  /**
   * Remove a field from the form validator.
   * @param elmt Target field
   */
  removeField(e) {
    this.fields.splice(this.fields.indexOf(e), 1);
  }
  /**
   * Set the relations between all fields: the `match` properties.
   */
  setFieldsRelations() {
    for (const e of this.fields)
      this.setFieldRelations(e);
  }
  /**
   * Set the relations for a single field: the `match` property.
   * @param field Target field
   */
  setFieldRelations(e) {
    if (e.elmt.dataset.fvMatch === void 0) {
      e.matchTo = null;
      return;
    }
    const t = this.fields.find((a) => e.elmt.dataset.fvMatch === a.elmt.name);
    if (t === void 0)
      throw new Error(`Failed to find form control '${e.elmt.dataset.fvMatch}' to match with '${e.elmt.name}'`);
    e.matchTo = t, t.matchOf.push(e), f(
      t.elmt,
      "name",
      () => e.elmt.dataset.fvMatch = t.elmt.name
    ), f(
      e.elmt,
      "data-fv-match",
      () => {
        e.elmt.dataset.fvMatch !== t.elmt.name && (t.matchOf.splice(t.matchOf.indexOf(e)), this.setFieldRelations(e));
      }
    );
  }
};
l(d, "defaultOptions", m(
  {},
  h.defaultOptions
));
let u = d;
export {
  u as FormValidator
};
