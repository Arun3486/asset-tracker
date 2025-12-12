# Asset Tracker

Internal web application to manage employees, laptop/desktop assets, and the full lifecycle of issuing and returning assets.

## Project Structure

```text
asset-tracker/
  backend/
    server.js          # Node + Express backend
    dataStore.js       # Data load/save + helpers
    routes/            # API routes
      employees.js
      assets.js
      transactions.js
    data.json          # Local JSON "database"
    package.json
    .env               # Environment variables (PORT, later DB config, etc.)
  public/
    index.html         # Home page
    onboard-employee.html
    employee-lookup.html
    employees-list.html
    add-asset.html
    asset-lookup.html
    assets-list.html
    asset-operations.html
    styles.css
    sidebar.js
