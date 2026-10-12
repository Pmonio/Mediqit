let deferredInstallPrompt;

const installButton = document.createElement("button");
installButton.type = "button";
installButton.className = "install-app-button";
installButton.hidden = true;
installButton.setAttribute("aria-label", "Install the Mediqit app");
installButton.innerHTML = '<span aria-hidden="true">↓</span> Install Mediqit';
document.body.append(installButton);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // The website remains fully usable if service-worker registration fails.
    });
  });
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButton.hidden = false;
});

installButton.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  installButton.disabled = true;
  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  window.va?.("event", {
    name: "pwa_install_prompt",
    data: { outcome: choice.outcome },
  });
  deferredInstallPrompt = undefined;
  installButton.hidden = true;
  installButton.disabled = false;
});

window.addEventListener("appinstalled", () => {
  installButton.hidden = true;
  window.va?.("event", { name: "pwa_installed" });
});
