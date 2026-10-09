// Zrzuty sekcji strony do filmu. Serwer musi działać na http://localhost:3000 (npm start).
// Uruchom w katalogu marketing/: node capture.mjs, potem python3 make_video.py
import { chromium } from 'playwright';
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const p = await b.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2, colorScheme: 'light' });
await p.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await p.addStyleTag({ content: `#demoBar,.demobar,#refBanner,[class*=assist],[id*=assist],[class*=fab]{display:none!important} .nav{position:static!important} *{animation:none!important;transition:none!important}` });
await p.waitForTimeout(500);
for (const id of ['top', 'skaner', 'cennik']) await p.locator('#' + id).screenshot({ path: `cap_${id}.png` });
await p.locator('#nav').screenshot({ path: 'cap_nav.png' });
const tabs = p.locator('#exTabs button');
for (let i = 0; i < await tabs.count(); i++) {
  await tabs.nth(i).click(); await p.waitForTimeout(300);
  await p.locator('#przyklad .ex-grid').screenshot({ path: `ex_${i}.png` });
}
await p.locator('#galGrid').screenshot({ path: 'gal.png' });
await b.close();
