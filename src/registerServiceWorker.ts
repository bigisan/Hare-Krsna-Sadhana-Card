export function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) return;

  let refreshing = false;
  // The active app reloads once after the new worker takes control, so an installed
  // iPhone PWA receives the latest UI without asking the user to reinstall it.
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js?v=2", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch(() => {
        // The app still works online if registration fails.
      });
  });
}
