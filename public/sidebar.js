// sidebar.js
// Renders a shared sidebar into #sidebar-root, highlights active menu,
// and shows logged-in user info (email + role) using /api/auth/me

(function () {
  const sidebarRoot = document.getElementById("sidebar-root");
  if (!sidebarRoot) return;

  const currentPage = (document.body.getAttribute("data-page") || "").toLowerCase();
  const API_BASE_URL = window.location.origin;

  const menu = [
    { key: "home", label: "Home", href: "index.html" },

    { section: "Employees" },
    { key: "onboard", label: "Onboard Employee", href: "onboard-employee.html" },
    { key: "employee-lookup", label: "Employee Lookup", href: "employee-lookup.html" },
    { key: "employees-list", label: "Employees List", href: "employees-list.html" },

    { section: "Assets" },
    { key: "add-asset", label: "Add Asset", href: "add-asset.html" },
    { key: "asset-lookup", label: "Asset Lookup", href: "asset-lookup.html" },
    { key: "assets-list", label: "Assets List", href: "assets-list.html" },

    { section: "Operations" },
    { key: "asset-operations", label: "Issue / Return", href: "asset-operations.html" },
  ];

  function isActive(itemKey) {
    return itemKey && itemKey === currentPage;
  }

  function buildSidebarHtml() {
    let html = `
      <div class="sidebar-header">
        <div class="sidebar-title">Asset Tracker</div>
        <div class="sidebar-subtitle">IT Operations</div>

        <div class="sidebar-user" id="sidebarUser">
          <div class="sidebar-user-email">Loading user...</div>
          <div class="sidebar-user-role"></div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <ul class="sidebar-list">
    `;

    for (const item of menu) {
      if (item.section) {
        html += `<li class="sidebar-section">${item.section}</li>`;
        continue;
      }

      const activeClass = isActive(item.key) ? "active" : "";
      html += `
        <li class="sidebar-item ${activeClass}">
          <a class="sidebar-link" href="${item.href}">${item.label}</a>
        </li>
      `;
    }

    html += `
        <li class="sidebar-section">Account</li>
        <li class="sidebar-item">
          <a class="sidebar-link" href="#" id="logoutLink">Logout</a>
        </li>
      </ul>
      </nav>
    `;

    return html;
  }

  sidebarRoot.innerHTML = buildSidebarHtml();

  // --- Fetch logged-in user info and show it ---
  async function loadUserInfo() {
    const userBox = document.getElementById("sidebarUser");
    if (!userBox) return;

    const emailEl = userBox.querySelector(".sidebar-user-email");
    const roleEl = userBox.querySelector(".sidebar-user-role");

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        emailEl.textContent = "Not logged in";
        roleEl.textContent = "";
        return;
      }

      const user = await res.json();
      emailEl.textContent = user.email || "User";
      roleEl.textContent = user.role ? `Role: ${user.role}` : "";
    } catch (err) {
      console.error("Failed to load user info:", err);
      emailEl.textContent = "User info unavailable";
      roleEl.textContent = "";
    }
  }

  loadUserInfo();

  // --- Logout click handler ---
  const logoutLink = document.getElementById("logoutLink");
  if (logoutLink) {
    logoutLink.addEventListener("click", async (e) => {
      e.preventDefault();

      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
      } catch (err) {
        console.error("Logout failed:", err);
      } finally {
        window.location.href = "/login.html";
      }
    });
  }
})();
