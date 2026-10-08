// Składa index.html + style.css + app.js + treści + atrapę API w jeden plik podglądu (np. do opublikowania jako artefakt).
import fs from 'node:fs';
const out = process.argv[2];
const r = (p) => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const strip = (src) => src.replace(/^import .*$/gm, '').replace(/^export /gm, '');
const html = r('public/index.html');
const title = /<title>(.*?)<\/title>/.exec(html)[1];
const fonts = [...html.matchAll(/<link rel="stylesheet" href="(https:\/\/fonts[^"]+)">/g)].map((m) => `<link rel="stylesheet" href="${m[1]}">`).join('\n');
const body = /<body>([\s\S]*)<\/body>/.exec(html)[1].replace(/<script src="\/app.js"><\/script>/, '');
const dicts = Object.fromEntries(['en', 'uk'].filter((l) => fs.existsSync(new URL(`../public/i18n/${l}.json`, import.meta.url))).map((l) => [l, JSON.parse(r(`public/i18n/${l}.json`))]));
const head = `${process.env.PREVIEW_HEAD || ''}<script>window.__I18N_DICT = ${JSON.stringify(dicts)};\n${r('public/i18n.js')}</script>`;
fs.writeFileSync(out, `<title>${title}</title>\n${fonts}\n${head}\n<style>\n${r('public/style.css')}\n</style>\n${body}\n<script>\n${strip(r('lib/content-a.js'))}
${strip(r('lib/content-b.js'))}
${strip(r('lib/cities.js'))}
${strip(r('lib/tools.js'))}
${strip(r('lib/content-articles.js'))}
${strip(r('lib/content.js'))}\n${strip(r('lib/tailor.js'))}\n${r('scripts/preview-stub.js')}\n${r('public/app.js')}\n</script>\n`);
