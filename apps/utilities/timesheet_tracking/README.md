# Timewise — employee time sheet tracking

A dependency-free, manager-level dashboard for August 2026 time sheet completion. It uses a generated sample dataset for 50 employees, with two project assignments each, approved leave, and intentionally missing entries.

## Run locally

```powershell
cd apps/utilities/timesheet_tracking
python -m http.server 8081 --bind 127.0.0.1
```

Open `http://127.0.0.1:8081/`.

`5003` is reserved by another local route in this workspace and can return an unrelated 404 response. Use `8081` for this app.

## Excel data source

The companion workbooks are `data/timesheet_june_2026.xlsx`, `data/timesheet_july_2026.xlsx`, and `data/timesheet_august_2026.xlsx`. Run `python scripts/generate_excel.py` to regenerate all three. Each workbook has Employees, Daily Bookings, Leave & Holidays, Projects, and Weekly Summary sheets.

## GitHub Pages

This is a static site with no build step. Configure GitHub Pages to publish from this folder (or copy these files to the chosen Pages directory).
