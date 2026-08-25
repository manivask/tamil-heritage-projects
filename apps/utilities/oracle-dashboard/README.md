# OracleOps utility dashboard

A static, interactive Oracle database operations dashboard built with sample data. It is deliberately dependency-free, so it can be opened directly or hosted on GitHub Pages.

## Run locally

From this folder, run:

```powershell
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Included views

- Operations overview with health score, CPU, memory, sessions, alerts, and trend charts
- Performance monitoring for CPU, waits, sessions, and top SQL
- Tablespace and filesystem storage monitoring
- Tables, indexes, packages, and procedures inventory
- User security and inactive-account review

All values are illustrative sample data. Replace the sample objects in `js/app.js` with API results or data exported from Oracle views when connecting to a live system.

## Publish later

This directory is ready to deploy as a GitHub Pages site. No build step is required; configure Pages to serve from this folder (or copy it to the selected Pages publishing directory).
