# Recruitment KPI dashboard

[Open the live dashboard](https://yesseniaguzman.github.io/Recruitment-KPI-s/)

The dashboard reuses the existing `Recruitment_KPI_Report_Updated.html` report, including its 2026 recruitment data, filters, charts, and print option.

## Files

- `index.html` — dashboard homepage served at the root GitHub Pages URL.
- `Recruitment_KPI_Report_Updated.html` — original report, retained at its existing URL.
- `.nojekyll` — serves these files directly as a static site.

The report is self-contained: its styles, scripts, and data are embedded in the HTML. It requires no build step, package installation, server, or external chart library.

## GitHub Pages

In **Settings → Pages**, use **Deploy from a branch**, **main**, and **/(root)**. Updates to the publishing branch are deployed by GitHub Pages.

For future report updates, replace `index.html` with the updated report. Keep the original filename in sync if you also want its direct link to show the latest report. The data is a historical snapshot; it does not synchronize automatically with a recruitment system.
