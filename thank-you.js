// Display preferences only. Page visits and refreshes never emit signup conversions.
try {
  const signup = JSON.parse(sessionStorage.getItem("mediqit-signup") || "null");
  if (signup?.studentInterest === true) document.getElementById("student-confirmation").hidden = false;
} catch {}

// Count only the first arrival produced by a confirmed, first-time API signup.
try {
  if (sessionStorage.getItem("mediqit-signup-conversion-pending") === "1") {
    sessionStorage.removeItem("mediqit-signup-conversion-pending");
    window.mediqitAds?.trackSignup();
  }
} catch {}
