const forms = [...document.querySelectorAll(".waitlist-form")];
document.querySelectorAll(".brand").forEach((brand) => {
  const image = document.createElement("img");
  image.src = "assets/mediqit-wordmark-v1.png";
  image.alt = "Mediqit";
  Object.assign(image.style, {
    display: "block",
    width: "145px",
    height: "auto",
  });
  brand.replaceChildren(image);
  if (brand.classList.contains("inverse"))
    Object.assign(brand.style, {
      background: "#fff",
      padding: "7px 10px",
      borderRadius: "9px",
      width: "fit-content",
    });
});
document
  .querySelector('link[rel="icon"]')
  ?.setAttribute("href", "assets/mediqit-q.svg");
const categoryImages = [
  [".product-visual.monitor", "assets/bp-monitor-v1.webp"],
  [".product-visual.first-aid", "assets/first-aid-kit-v1.webp"],
  [".product-visual.caregiver", "assets/family-care-v1.webp"],
];
categoryImages.forEach(([selector, source]) => {
  const visual = document.querySelector(selector);
  if (!visual) return;
  Object.assign(visual.style, {
    backgroundImage: `url('${source}')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  });
  visual
    .querySelectorAll(":scope > *")
    .forEach((child) => (child.style.display = "none"));
});
document.querySelectorAll("[data-analytics]").forEach((link) =>
  link.addEventListener("click", () => {
    const label = link.dataset.analytics;
    const whatsapp = label.startsWith("whatsapp_");
    const social = label.startsWith("social_");
    window.va?.("event", {
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
    window.va?.("event", {
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
    const result = await response.json();
    if (!response.ok)
      throw new Error(
        result.error || "We could not add you right now. Please try again.",
      );
    window.va?.("event", {
      name: "waitlist_joined",
      data: { productUpdates: data.get("updatesConsent") === "on" },
    });
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
    window.va?.("event", { name: "waitlist_error" });
    errorMessage.textContent = error.message;
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
