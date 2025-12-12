// auth.js
// Runs on every page (except login.html). If not logged in → redirect to login.

(async function () {
  const API_BASE_URL = window.location.origin;

  // Find current page name
  const currentPage = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();

  // Allow login page without checks
  if (currentPage === "login.html") return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: "GET",
      credentials: "include"
    });

    // Not logged in
    if (res.status === 401) {
      window.location.href = "/login.html";
      return;
    }

    // Logged in (do nothing)
  } catch (err) {
    console.error("Auth check failed:", err);
    alert("Backend server not reachable. Please run: npm start (in backend folder)");
  }
})();
