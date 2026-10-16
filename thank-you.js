// Display preferences only. Page visits and refreshes never emit signup conversions.
try {
  const signup = JSON.parse(sessionStorage.getItem("mediqit-signup") || "null");
  if (signup?.studentInterest === true) document.getElementById("student-confirmation").hidden = false;
} catch {}
