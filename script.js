// Analytics failures must never change the result of a successful signup.
function track(...args) { try { window.va?.(...args); } catch {} }
const forms = [...document.querySelectorAll(".waitlist-form")];
document.querySelectorAll("[data-analytics]").forEach((link) =>
  link.addEventListener("click", () => {
    const label = link.dataset.analytics;
    const whatsapp = label.startsWith("whatsapp_");
    const social = label.startsWith("social_");
    track("event", {
      name: whatsapp
        ? "whatsapp_clicked"
        : social
          ? "social_link_clicked"
          : "category_cta_clicked",
      data: { source: label.replace(/^(social|whatsapp|category)_/, "") },
    });
  }),
);
document.querySelectorAll('a[href="#waitlist"]').forEach((link) =>
  link.addEventListener("click", () =>
    track("event", {
      name: "launch_cta_clicked",
      data: { location: link.closest("header") ? "header" : "page" },
    }),
  ),
);
document
  .querySelectorAll('[data-analytics="category_student_interest"]')
  .forEach((link) =>
    link.addEventListener("click", () => {
      forms.forEach((form) => {
        const interest = form.elements.namedItem("studentInterest");
        if (interest) interest.checked = true;
      });
      window.setTimeout(() => document.querySelector("#email")?.focus(), 350);
    }),
  );
const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector("#primary-nav");
const closeMenu = () => {
  menuToggle?.setAttribute("aria-expanded", "false");
  const label = menuToggle?.querySelector("b");
  if (label) label.textContent = "Open menu";
  primaryNav?.classList.remove("open");
};
menuToggle?.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!open));
  menuToggle.querySelector("b").textContent = open ? "Open menu" : "Close menu";
  primaryNav?.classList.toggle("open", !open);
});
primaryNav?.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", closeMenu),
);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuToggle?.getAttribute("aria-expanded") === "true") {
    closeMenu();
    menuToggle.focus();
  }
});

// Carry the visitor's choices between the two forms without checking consent for them.
forms.forEach((form) => {
  form.addEventListener("input", (event) => {
    const field = event.target;
    if (!["email", "launchConsent", "studentInterest"].includes(field.name)) return;
    forms.forEach((other) => {
      const message = other.querySelector(".form-success");
      if (message) message.hidden = true;
      other.querySelector(".form-error").classList.remove("show");
    });
    forms.filter((other) => other !== form).forEach((other) => {
      const matching = other.elements.namedItem(field.name);
      if (!matching) return;
      if (field.type === "checkbox") matching.checked = field.checked;
      else matching.value = field.value;
    });
  });
});

let submitting = false;
forms.forEach((form) => form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (submitting) return;
  submitting = true;
  const errorMessage = form.querySelector(".form-error");
  const successMessage = form.querySelector(".form-success");
  errorMessage.classList.remove("show");
  errorMessage.textContent = "";
  if (successMessage) successMessage.hidden = true;
  const data = new FormData(form);
  const button = form.querySelector("button");
  forms.forEach((other) => {
    other.querySelector("button").disabled = true;
    other.setAttribute("aria-busy", "true");
  });
  button.firstChild.textContent = "Joining… ";
  try {
    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.get("email"),
        launchConsent: data.get("launchConsent") === "on",
        updatesConsent: data.get("updatesConsent") === "on",
        studentInterest: data.get("studentInterest") === "on",
        company: data.get("company"),
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (response.status === 409 && result.status === "already_joined") {
      forms.forEach((other) => {
        const message = other.querySelector(".form-success");
        if (message) {
          message.hidden = false;
          message.textContent = "You have already joined the launch list. Stay tuned for more information.";
        }
      });
      return;
    }
    if (!response.ok || result.ok !== true) {
      const messages = {400: "Check your email and launch-email consent, then try again.", 429: "Too many attempts. Please wait a minute and try again."};
      throw new Error(messages[response.status] || "We couldn’t save your signup. Please try again shortly.");
    }
    track("event", {
      name: "waitlist_joined",
      data: { productUpdates: data.get("updatesConsent") === "on" },
    });
    // Store only non-identifying display and one-use conversion state, never an email address.
    try {
      sessionStorage.setItem("mediqit-signup", JSON.stringify({ studentInterest: data.get("studentInterest") === "on" }));
      sessionStorage.setItem("mediqit-signup-conversion-pending", "1");
    } catch {}
    window.location.assign("/thank-you");
    forms.forEach((other) => {
      other.reset();
      other.querySelector(".form-error").classList.remove("show");
      const message = other.querySelector(".form-success");
      if (message) {
        message.hidden = false;
        message.textContent = "You’re on the list. We’ll email you when the launch date and opening catalogue are ready.";
      }
    });
  } catch (error) {
    track("event", { name: "waitlist_error" });
    errorMessage.textContent = error instanceof TypeError ? "You appear to be offline. Check your connection and try again." : error.message;
    errorMessage.classList.add("show");
  } finally {
    submitting = false;
    forms.forEach((other) => {
      other.querySelector("button").disabled = false;
      other.removeAttribute("aria-busy");
    });
    button.firstChild.textContent = "Get launch updates ";
  }
}));

// Keep floating actions clear of the forms and the expanded mobile menu.
if ("IntersectionObserver" in window && forms.length) {
  const visibleForms = new Set();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) visibleForms.add(entry.target);
      else visibleForms.delete(entry.target);
    });
    document.body.classList.toggle("signup-in-view", visibleForms.size > 0);
  }, { rootMargin: "80px 0px" });
  forms.forEach((form) => observer.observe(form));
}
