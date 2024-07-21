import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import puppeteer from 'puppeteer';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

let articles =[];

app.post('/scrape', async(req, res) => {
    const {topic} = req.body;
    if(!topic) {
        return res.status(400).json({error: 'Topic is required'});
    }

    try {
        const browser = await puppeteer.launch({ 
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.goto(`https://medium.com/search?q=${encodeURIComponent(topic)}`, {
            waitUntil: 'networkidle2'
        });
        console.log(`Navigated to Medium search page for topic: ${topic}`);

        articles = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('article')).slice(0, 5)
            .map(article => ({
                title: article.querySelector('h2')?.innerText || 'No Title',
                author: article.querySelector('div.ab.q')?.innerText || 'No Author',
                publicationDate: article.querySelector('div.ab.q span')?.innerText || 'No Date',
               // publicationDate: "july 4",

                url: article.querySelector('a.af.ag.ah.ai.aj.ak.al.am.an.ao.ap.aq.ar.as.at')?.href || '#'
            }));
        });

        
        console.log('Scraped articles:', articles);

        await browser.close();
        res.json(articles);
    } catch (error) {
        console.error('Error during scraping:', error);
        res.status(500).json({ error: 'Failed to scrape articles' });
    }
})

app.get('/articles', (req, res) => {
    res.json(articles);
});

app.listen(PORT, ()=>{
    console.log(`server is running on port ${PORT}`);
})