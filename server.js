const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const fs = require('fs');
const { CronJob } = require('cron');
const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const i18nextMiddleware = require('i18next-http-middleware');
const cookieParser = require('cookie-parser');
const { scrapeJobs } = require('./scrape');

//
// === i18n setup ===
i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)     // ← детектор из middleware
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'ru'],
    nonExplicitSupportedLngs: true,
    backend: {
      loadPath: path.join(__dirname, 'locales/{{lng}}/translation.json')
    },
    detection: {
      order: ['querystring','cookie','header'],
      caches: ['cookie']
    }
  });

const app = express();

// view engine & layouts
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// static assets
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/data', express.static(path.join(__dirname, 'data')));

// cookies and i18next middleware
app.use(cookieParser());
app.use(i18nextMiddleware.handle(i18next));    // ← вот здесь используем handle
app.use((req, res, next) => {
  res.locals.t = req.t;
  res.locals.lng = req.language;
  next();
});

// schedule scraping every hour (Europe/Amsterdam)
new CronJob('0 * * * *', () => {
  console.log(`[${new Date().toISOString()}] Running scrapeJobs()`);
  scrapeJobs();
}, null, true, 'Europe/Amsterdam');

// --- Routes ---

// Home with stats
app.get('/', (req, res) => {
  const jobs = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/jobs.json'), 'utf-8'));
  const totalJobs = jobs.length;
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const newJobsLastDay = jobs.filter(j => new Date(j.date) >= yesterday).length;
  const uniqueCompanies = new Set(jobs.map(j => j.company)).size;
  const uniqueLocations = new Set(jobs.map(j => j.location)).size;

  res.render('index', {
    title: res.locals.t('home'),
    stats: { totalJobs, newJobsLastDay, uniqueCompanies, uniqueLocations }
  });
});

// Jobs list
app.get('/jobs', (req, res) => {
  const jobs = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/jobs.json'), 'utf-8'));
  res.render('jobs', { title: res.locals.t('jobs_list'), jobs });
});

// Job detail
app.get('/jobs/:id', (req, res) => {
  const jobs = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/jobs.json'), 'utf-8'));
  const job = jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).send(res.locals.t('not_found'));
  res.render('job_detail', { title: job.title, job });
});

// Dashboard
app.get('/dashboard', (req, res) => {
  res.render('dashboard', { title: res.locals.t('dashboard') });
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
