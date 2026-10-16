const form = document.querySelector("#student-survey");
const steps = [...form.querySelectorAll("fieldset")];
let step = 0, busy = false;
const next = document.querySelector("#survey-next"), back = document.querySelector("#survey-back"), error = document.querySelector("#survey-error");
function syncOther() {
  const courseOther = form.elements.course.value === "Other";
  form.querySelector("[data-other-course]").hidden = !courseOther;
  form.elements.otherCourse.required = courseOther;
  for (const fieldset of form.querySelectorAll("[data-multiple]")) {
    const name = fieldset.dataset.multiple;
    const selected = [...fieldset.querySelectorAll('input[type="checkbox"]:checked')].map(el => el.value);
    const wrapper = fieldset.querySelector("[data-other-for]");
    wrapper.hidden = !selected.includes("Other");
    wrapper.querySelector("textarea").required = selected.includes("Other");
  }
}
function show() {
  steps.forEach((s, i) => { s.hidden = i !== step; s.disabled = i !== step; });
  syncOther();
  back.hidden = step === 0;
  next.textContent = step === 4 ? "Submit responses →" : "Next →";
  document.querySelector("#survey-progress").textContent = `Question ${step + 1} of 5`;
  steps[step].querySelector("input,textarea")?.focus();
}
form.addEventListener("change", event => {
  const field = event.target;
  const group = field.closest("[data-multiple]");
  if (group && field.type === "checkbox" && field.name === group.dataset.multiple && field.checked) {
    const exclusive = ["None", "Not sure yet"];
    group.querySelectorAll('input[type="checkbox"]').forEach(other => {
      if (other !== field && (exclusive.includes(field.value) || exclusive.includes(other.value))) other.checked = false;
    });
  }
  error.textContent = "";
  syncOther();
});
function validate() {
  syncOther();
  const group = steps[step];
  if (group.dataset.multiple && !group.querySelector('input[name="' + group.dataset.multiple + '"]:checked')) {
    error.textContent = "Please select at least one option to continue.";
    group.querySelector("input").focus();
    return false;
  }
  for (const el of group.querySelectorAll("input,textarea")) {
    el.setCustomValidity(el.required && !["radio","checkbox"].includes(el.type) && !el.value.trim() ? "Please enter your answer." : "");
    if (!el.reportValidity()) return false;
  }
  return true;
}
back.addEventListener("click", () => { if (!busy) { step--; error.textContent = ""; show(); } });
form.addEventListener("submit", async event => {
  event.preventDefault();
  if (busy || !validate()) return;
  if (step < 4) { step++; error.textContent = ""; show(); return; }
  busy = true; next.disabled = true; back.disabled = true;
  next.textContent = "Submitting…";
  error.textContent = "";
  steps.forEach(s => s.disabled = false);
  const data = new FormData(form);
  const body = { institution: data.get("institution"), course: data.get("course"), surveyConsent: data.get("surveyConsent") === "on" };
  if (body.course === "Other") body.otherCourse = data.get("otherCourse");
  for (const name of ["equipment", "findingChallenge", "buyingChallenge"]) {
    body[name] = data.getAll(name);
    if (body[name].includes("Other")) body[name + "Other"] = data.get(name + "Other");
  }
  try {
    const response = await fetch("/api/student-survey", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok || result.ok !== true) throw Error(response.status === 429 ? "Too many attempts. Please wait a minute and try again." : "We couldn’t save your response. Please try again.");
    try { window.va?.("event", { name: "student_survey_completed" }); } catch {}
    window.location.assign("/students-thank-you");
  } catch (err) {
    error.textContent = err instanceof TypeError ? "Check your internet connection and try again." : err.message;
    show();
  } finally { busy = false; next.disabled = false; back.disabled = false; }
});
show();
