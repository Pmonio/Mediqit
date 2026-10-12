const form = document.querySelector(".waitlist-form");
const success = document.querySelector(".success");
const errorMessage = document.querySelector(".form-error");
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
const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector("#primary-nav");
menuToggle?.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!open));
  menuToggle.querySelector("b").textContent = open ? "Open menu" : "Close menu";
  primaryNav?.classList.toggle("open", !open);
});
primaryNav?.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    menuToggle?.setAttribute("aria-expanded", "false");
    primaryNav.classList.remove("open");
  }),
);
form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorMessage.classList.remove("show");
  const data = new FormData(form);
  const button = form.querySelector("button");
  button.disabled = true;
  button.firstChild.textContent = "Joining… ";
  try {
    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.get("email"),
        launchConsent: data.get("launchConsent") === "on",
        updatesConsent: data.get("updatesConsent") === "on",
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
    form.reset();
    success.hidden = false;
    success.classList.add("show");
    window.setTimeout(() => {
      success.classList.remove("show");
      success.hidden = true;
    }, 4500);
  } catch (error) {
    window.va?.("event", { name: "waitlist_error" });
    errorMessage.textContent = error.message;
    errorMessage.classList.add("show");
  } finally {
    button.disabled = false;
    button.firstChild.textContent = "Get launch updates ";
  }
});
