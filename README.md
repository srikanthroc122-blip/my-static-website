# Sifto — Production Web App Package

This folder contains the clean multi-file source code for **Sifto**:

- `index.html` — The 5-screen mobile app structure (`Book`, `Live Track`, `Bookings`, `Wallet`, `Pro Mode`).
- `styles.css` — All layout rules, responsive grids, and Dark Mode CSS variables.
- `app.js` — All interactive logic (3-step wizard, live tracker, Pro chat, receipts, custom chores, address book).
- `db_config.js` — Ready-to-enable cloud database adapter for Supabase PostgreSQL.
- `schema.sql` — Ready-to-run SQL script to create your production database tables.
- `sifto_single_file_bundle.html` — Self-contained single-file version that runs anywhere.

## Quick Local Run

1. Unzip `sifto_production_app.zip` into a folder on your computer.
2. Double-click `index.html` to open it in Chrome, Edge, or Safari, or open the folder in **VS Code** and run the **Live Server** extension.
