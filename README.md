# Unemployment in 50 U.S. Cities (2021–2025)

A static research report and interactive dashboard for comparing annual unemployment rates across the 50 cities in the supplied panel dataset. The intended audience is an economic research analyst evaluating possible U.S. expansion locations. The analysis is descriptive: unemployment alone does not determine whether a city is a good business location.

## Run the site

Keep `index.html`, `dashboard.html`, `app.js`, `styles.css`, and `city-unemployment-panel-data.csv` together. Since browser security blocks `fetch()` from many `file://` pages, serve the folder with any static HTTP server. For example, from this directory run `python3 -m http.server 8000`, then open `http://localhost:8000/`. No backend or build step is needed. Chart.js is loaded from jsDelivr, so charts need an internet connection; relative project paths and the data remain suitable for GitHub Pages.

## Data source and row definition

The source of truth is `city-unemployment-panel-data.csv` in this project. Its columns are `City`, `State`, `Year`, and `Unemployment Rate (%)`. Each row represents one city in one year. Inspection confirms 250 rows, 50 distinct city/state combinations, five years (2021–2025), and exactly one row for every city-year pair. All fields are populated and all rates are numeric. The source values are displayed as supplied, including city labels, with the state appended in charts and summary labels to disambiguate locations.

**2025 limitation:** The 2025 unemployment figures are 11-month averages, not full calendar-year averages, because October data were not collected during the federal government shutdown. This affects the interpretation of the 2025 mean, comparisons to other years, and any city average that includes 2025.

## Calculations

- Overall mean: arithmetic mean of all valid city-year unemployment rate observations.
- 2025 mean: arithmetic mean of valid rows where year is 2025.
- City average: arithmetic mean of a city's available yearly rates; for the headline low/high, all five supplied years are included.
- Annual mean: arithmetic mean across the 50 city rows in that year. Equal city weighting follows from one row per city per year.
- Dashboard filters recalculate the overall mean and city low/high within the selected rows. The 2025 mean uses selected 2025 rows and displays as unavailable if the year filter excludes 2025.

Missing or nonnumeric rate fields are treated as invalid and rejected by the browser parser rather than silently imputed. The supplied file has no missing or invalid values, so all 250 observations are used. The rates are rounded inputs; results are descriptive comparisons, not causal estimates or business recommendations.

## Files

- `index.html` — report, headline statistics, three calculated findings, and charts.
- `dashboard.html` — interactive year and city filters with recalculated metrics and charts.
- `app.js` — shared CSV parsing, validation, calculations, and chart rendering.
- `styles.css` — shared visual design.
- `city-unemployment-panel-data.csv` — supplied source data.
