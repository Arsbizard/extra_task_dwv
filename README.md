# JobDashboard

A real-time job listing dashboard that scrapes vacancies from hh.ru, provides interactive job search and filtering, and visualizes key job statistics using D3.js. Supports English and Russian languages.

## Features

* **Automated Scraping**: Pulls \~1000 job postings from hh.ru via API.
* **Interactive Job List**: Search by job title or company with autocomplete, filter by location.
* **Dashboard Visualizations**: Four charts (Skills, Companies, Locations, Timeline) organized in tabs with filters.
* **Internationalization**: Supports English and Russian (switch via `?lng=en` or `?lng=ru`).
* **Responsive UI**: Built with Bootstrap Cosmo theme.
* **Cron Scheduler**: Updates vacancy data every hour automatically.

## Prerequisites

* **Node.js** v14 or higher
* **npm** (comes with Node.js)

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/job_dashboard.git
   cd job_dashboard
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

## Configuration

No external API keys are required. Ensure network access to hh.ru.

## Usage

1. **Scrape job listings**

   ```bash
   node scrape.js
   ```

   * Fetches up to 1000 vacancies from hh.ru and saves to `data/jobs.json`.

2. **Start the server**

   ```bash
   npm start
   ```

   * Runs the Express server on `http://localhost:3000`.

3. **Open in browser**

   * **Home**: [http://localhost:3000/](http://localhost:3000/) — view summary statistics.
   * **Jobs**: [http://localhost:3000/jobs](http://localhost:3000/jobs) — interactive job search & filter.
   * **Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard) — interactive charts and filters.

## Project Structure

```
job_dashboard/
├── data/                 # Scraped job JSON data
│   └── jobs.json
├── locales/              # i18n translation files
│   ├── en/translation.json
│   └── ru/translation.json
├── public/
│   ├── css/style.css
│   └── js/dashboard.js
├── scrape.js             # Script to fetch jobs from hh.ru API
├── server.js             # Express app entrypoint
├── views/                # EJS templates
│   ├── layout.ejs
│   ├── index.ejs
│   ├── jobs.ejs
│   ├── job_detail.ejs
│   └── dashboard.ejs
├── package.json
└── README.md             # This file
```

## Internationalization

* Switch languages using query parameter, e.g.:

  * English: [http://localhost:3000/?lng=en](http://localhost:3000/?lng=en)
  * Russian: [http://localhost:3000/?lng=ru](http://localhost:3000/?lng=ru)

## Cron Scheduler

* The server automatically runs `scrapeJobs()` every hour in the `Europe/Amsterdam` timezone.
* To modify schedule, edit the cron expression in `server.js`.

## Troubleshooting

* **Empty jobs list**: Run `node scrape.js` to populate `data/jobs.json`.
* **Filtering errors**: Ensure you have cleared browser cache and disabled conflicting extensions.
* **Port conflicts**: Set `PORT` env var before starting: `PORT=4000 npm start`.
