const Parser = require('rss-parser');
const readlineSync = require('readline-sync');
const fs = require('fs');
let parser = new Parser({ maxRedirects: 100 });
const puppeteer = require('puppeteer');
async function scrapeNews(categoryName = null) {
  const CATEGORY_FEEDS = {
    '1': { name: 'WORLD' },
    '2': { name: 'NATION' },
    '3': { name: 'BUSINESS' },
    '4': { name: 'TECHNOLOGY' },
    '5': { name: 'ENTERTAINMENT' },
    '6': { name: 'SCIENCE' },
    '7': { name: 'SPORTS' },
    '8': { name: 'HEALTH' },
    '9': { name: 'ALL' }
  };

  let selectedCategory;

  if (categoryName) {
    selectedCategory = Object.values(CATEGORY_FEEDS).find(cat => cat.name === categoryName.toUpperCase());
    if (!selectedCategory) {
      console.log('❌ Nama kategori tidak valid!');
      return;
    }
  } else {
    console.log('Pilih kategori berita:\n');
    Object.keys(CATEGORY_FEEDS).forEach(key => {
      console.log(`${key}. ${CATEGORY_FEEDS[key].name}`);
    });

    const categoryChoice = readlineSync.question('Masukkan nomor kategori: ');
    selectedCategory = CATEGORY_FEEDS[categoryChoice];

    if (!selectedCategory) {
      console.log('❌ Nomor kategori tidak valid!');
      return;
    }
  }

  const saveOption = readlineSync.question('Simpan berita ke file? (y/n): ').toLowerCase();
  const fileFormat = saveOption === 'y'
    ? readlineSync.question('Pilih format file (txt/json): ').toLowerCase()
    : null;

  if (selectedCategory.name === 'ALL') {
    let allItems = [];

    for (const key in CATEGORY_FEEDS) {
      const cat = CATEGORY_FEEDS[key];
      if (cat.name === 'ALL') continue;

      const url = `https://news.google.com/rss/headlines/section/topic/${cat.name}?hl=en-US&gl=US&ceid=US:en`;
      console.log(`\n📥 Mengambil ${cat.name}...`);

      try {
        const feed = await parser.parseURL(url);
        const items = feed.items;

        items.forEach((item, i) => {
          console.log(`${i + 1}. ${item.title}`);
        });

        if (saveOption === 'y') {
          const fileName = `news_${cat.name.toLowerCase()}.${fileFormat}`;
          if (fileFormat === 'json') {
            fs.writeFileSync(fileName, JSON.stringify(items, null, 2));
          } else if (fileFormat === 'txt') {
            const content = items.map(item => item.title).join('\n');
            fs.writeFileSync(fileName, content);
          }
          console.log(`✅ Disimpan sebagai ${fileName}`);
        }

        allItems.push(...items);

      } catch (err) {
        console.error(`❌ Gagal mengambil ${cat.name}:`, err.message);
      }
    }

    if (saveOption === 'y') {
      const combinedFile = `news_all.${fileFormat}`;
      if (fileFormat === 'json') {
        fs.writeFileSync(combinedFile, JSON.stringify(allItems, null, 2));
      } else if (fileFormat === 'txt') {
        const content = allItems.map(item => item.title).join('\n');
        fs.writeFileSync(combinedFile, content);
      }
      console.log(`📦 Semua kategori juga disimpan sebagai ${combinedFile}`);
    }

  } else {
    const url = `https://news.google.com/rss/headlines/section/topic/${selectedCategory.name}?hl=en-US&gl=US&ceid=US:en`;

    try {
      const feed = await parser.parseURL(url);
      const items = feed.items;

      items.forEach((item, i) => {
        console.log(`${i + 1}. ${item.title}`);
      });

      if (saveOption === 'y') {
        const fileName = `news_${selectedCategory.name.toLowerCase()}.${fileFormat}`;
        if (fileFormat === 'json') {
          fs.writeFileSync(fileName, JSON.stringify(items, null, 2));
        } else if (fileFormat === 'txt') {
          const content = items.map(item => item.title).join('\n');
          fs.writeFileSync(fileName, content);
        }
        console.log(`✅ Disimpan sebagai ${fileName}`);
      } else {
        console.log('Berita tidak disimpan.');
      }

    } catch (err) {
      console.error('❌ Gagal mengambil RSS feed:', err.message);
    }
  }
}
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function scrapeTrends(maxPagination = 3) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://trends.google.com/trending?geo=US&hl=en-US&sort=search-volume&status=active', {
    waitUntil: 'networkidle2',
  });

  const results = [];
  let keepGoing = true;
  let currentPage = 1;

  while (keepGoing && currentPage <= maxPagination) {
    await page.waitForSelector('tr[jsname="oKdM2c"]');
    const rows = await page.$$('tr[jsname="oKdM2c"]');
    await delay(3000);

    for (let i = 0; i < rows.length; i++) {
      const titleEl = await rows[i].$('.mZ3RIc');
      if (!titleEl) continue;

      const title = await page.evaluate(el => el.innerText, titleEl);
      await titleEl.evaluate(el => el.scrollIntoView({ behavior: 'smooth' }));
      await titleEl.click();
      await delay(2000);

      try {
        await page.waitForSelector('.QbLC8c', { timeout: 5000 });

        const newsTitles = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('.QbLC8c')).map(el => el.innerText.trim());
        });

        results.push({
          title,
          inTheNews: newsTitles
        });

        const content = newsTitles.join('\n');
        fs.appendFileSync(`news_trends.txt`, content + '\n');
        console.log(`✅ Disimpan sebagai news_${title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`);
      } catch (err) {
        console.log(`No 'In the news' for: ${title}`);
      }

      await delay(1000);
    }

    const nextBtn = await page.$('button[jsname="ViaHrd"]:not([disabled])');
    if (nextBtn && currentPage < maxPagination) {
      await nextBtn.evaluate(el => el.scrollIntoView({ behavior: 'smooth' }));
      await nextBtn.click();
      await delay(2000);
      currentPage++;
    } else {
      keepGoing = false;
      console.log('No more pages to scrape or reached max pagination.');
    }
  }

  await browser.close();
  return results;
}
// Eksekusi fungsi utama
//main();
async function main() {
  console.log('=== MENU SCRAPER ===');
  const option = readlineSync.question('(1) scrapeTrends\n(2) scrapeNews\nPilih fungsi:');
  console.log('====================');
  if (option === '1') {
    // const max = readlineSync.questionInt('Masukkan jumlah maksimal pagination (misal: 3): ');
    await scrapeTrends(3);
    await browser.close();
  } else if (option === '2') {
    await main();
  } else {
    console.log('❌ Opsi tidak dikenali.');
  }
 
}

(async () => {
  
  // For testing purposes
})();

module.exports = {
  scrapeTrends,
  scrapeNews,
  main
};