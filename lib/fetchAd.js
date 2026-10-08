import https from 'node:https';
import http from 'node:http';
import dns from 'node:dns';
import net from 'node:net';

const MAX_BYTES = 1_500_000, TIMEOUT_MS = 10_000, MAX_REDIRECTS = 3;

export class AdError extends Error {}

function isPrivateIp(ip) {
  if (net.isIPv6(ip)) {
    const l = ip.toLowerCase();
    const m = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(l);
    if (m) return isPrivateIp(m[1]);
    return l === '::' || l === '::1' || /^f[cd]/.test(l) || /^fe[89ab]/.test(l);
  }
  const [a, b] = ip.split('.').map(Number);
  return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
    (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19));
}

// Sprawdza adres w chwili połączenia (chroni też przed DNS rebinding).
function safeLookup(hostname, options, cb) {
  dns.lookup(hostname, { ...options, all: true }, (err, addrs) => {
    if (err) return cb(err);
    const ok = addrs.filter((a) => !isPrivateIp(a.address));
    if (!ok.length) return cb(new AdError('Ten adres jest niedozwolony.'));
    if (options.all) return cb(null, ok);
    cb(null, ok[0].address, ok[0].family);
  });
}

function getOnce(url) {
  return new Promise((resolve, reject) => {
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request(url, {
      method: 'GET', lookup: safeLookup, timeout: TIMEOUT_MS,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CVPodOgloszenie/1.0)', Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'pl,en;q=0.8', 'Accept-Encoding': 'identity' },
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) { res.resume(); return resolve({ redirect: new URL(res.headers.location, url) }); }
      if (res.statusCode >= 400) { res.resume(); return reject(new AdError(`Serwis odrzucił zapytanie (kod ${res.statusCode}).`)); }
      const type = res.headers['content-type'] || '';
      if (!/text\/html|application\/xhtml|text\/plain/i.test(type)) { res.resume(); return reject(new AdError('Ten link nie prowadzi do strony z ogłoszeniem.')); }
      const chunks = []; let n = 0;
      res.on('data', (c) => { n += c.length; if (n > MAX_BYTES) { req.destroy(new AdError('Strona jest zbyt duża.')); } else chunks.push(c); });
      res.on('end', () => resolve({ body: Buffer.concat(chunks), type }));
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new AdError('Serwis nie odpowiedział na czas.')));
    req.on('error', (e) => reject(e instanceof AdError ? e : new AdError('Nie udało się połączyć z tą stroną.')));
    req.end();
  });
}

export async function fetchAd(rawUrl) {
  let url;
  try { url = new URL(String(rawUrl).trim()); } catch { throw new AdError('To nie wygląda na poprawny link.'); }
  if (!/^https?:$/.test(url.protocol) || url.username || url.password) throw new AdError('Podaj zwykły link http lub https.');
  if (net.isIP(url.hostname.replace(/^\[|\]$/g, '')) && isPrivateIp(url.hostname.replace(/^\[|\]$/g, ''))) throw new AdError('Ten adres jest niedozwolony.');
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const r = await getOnce(url);
    if (r.redirect) { if (!/^https?:$/.test(r.redirect.protocol)) throw new AdError('Niepoprawne przekierowanie.'); url = r.redirect; continue; }
    const cs = /charset=([\w-]+)/i.exec(r.type)?.[1] || 'utf-8';
    let html; try { html = new TextDecoder(cs).decode(r.body); } catch { html = r.body.toString('utf8'); }
    return extractAd(html);
  }
  throw new AdError('Zbyt wiele przekierowań.');
}

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = (s) => s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') { const c = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return c > 0 && c < 0x110000 ? String.fromCodePoint(c) : ' '; }
  return ENT[e.toLowerCase()] ?? m;
});
function htmlToText(h) {
  return decode(h
    .replace(/<(script|style|noscript|svg|nav|header|footer|form|iframe)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article|ul|ol)>|<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/[ \t ]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function findJobPosting(node) {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) { for (const n of node) { const f = findJobPosting(n); if (f) return f; } return null; }
  const t = node['@type'];
  if (t === 'JobPosting' || (Array.isArray(t) && t.includes('JobPosting'))) return node;
  return findJobPosting(node['@graph']);
}

export function extractAd(html) {
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    let job; try { job = findJobPosting(JSON.parse(m[1].trim())); } catch { continue; }
    if (job?.description) {
      const desc = htmlToText(decode(String(job.description)).includes('<') ? decode(String(job.description)) : String(job.description));
      const org = job.hiringOrganization;
      const text = desc.slice(0, 10000);
      if (text.length >= 120) return { title: decode(String(job.title || '')).slice(0, 100), company: decode(String(typeof org === 'string' ? org : org?.name || '')).slice(0, 100), text };
    }
  }
  const title = decode(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i.exec(html)?.[1] || /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] || '').replace(/\s+/g, ' ').trim();
  const main = /<(main|article)[\s\S]*?<\/\1>/i.exec(html)?.[0] || /<body[\s\S]*<\/body>/i.exec(html)?.[0] || html;
  const text = htmlToText(main).slice(0, 10000);
  if (text.length < 200) throw new AdError('Nie znaleziono treści ogłoszenia. Strona może wymagać logowania lub JavaScriptu.');
  return { title: title.slice(0, 100), company: '', text };
}
