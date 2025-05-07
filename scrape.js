// scrape.js
const axios = require('axios');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

async function scrapeJobs() {
  const allJobs = [];
  const PER_PAGE    = 100;  // макс. вакансий за запрос
  const TOTAL_PAGES = 10;   // 10×100 = 1000+

  for (let page = 0; page < TOTAL_PAGES; page++) {
    console.log(`→ Загружаем страницу ${page+1}/${TOTAL_PAGES}…`);
    const resp = await axios.get('https://api.hh.ru/vacancies', {
      params: {
        text:     'software engineer', // можете поменять на любой запрос
        per_page: PER_PAGE,
        page:     page
      },
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const items = resp.data.items;
    console.log(`  → Получено вакансий: ${items.length}`);

    items.forEach(item => {
      // собираем требования и обязанности в массив строк
      const summary = [];
      if (item.snippet && item.snippet.requirement) {
        summary.push(
          item.snippet.requirement
            .replace(/<[^>]+>/g, '')  // убираем HTML-тэги
            .trim()
        );
      }
      if (item.snippet && item.snippet.responsibility) {
        summary.push(
          item.snippet.responsibility
            .replace(/<[^>]+>/g, '')
            .trim()
        );
      }

      allJobs.push({
        id:       item.id,
        title:    item.name,
        company:  item.employer   ? item.employer.name  : 'Unknown',
        location: item.area       ? item.area.name      : 'Unknown',
        date:     item.published_at.split('T')[0],
        summary
      });
    });

    // пауза, чтобы не спамить API
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`✔ Всего собрали: ${allJobs.length} вакансий`);
  fs.writeFileSync(
    './data/jobs.json',
    JSON.stringify(allJobs, null, 2),
    'utf-8'
  );
  console.log('→ Сохранили в data/jobs.json');
}

if (require.main === module) {
  scrapeJobs().catch(err => {
    console.error('Ошибка при сборе вакансий:', err.message);
    process.exit(1);
  });
}

module.exports = { scrapeJobs };
