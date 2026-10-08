// Składa index.html + style.css + app.js + atrapę API w jeden plik podglądu (np. do opublikowania jako artefakt).
import fs from 'node:fs';
const out = process.argv[2];
const r = (p) => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const html = r('public/index.html');
const title = /<title>(.*?)<\/title>/.exec(html)[1];
const fonts = [...html.matchAll(/<link rel="stylesheet" href="(https:\/\/fonts[^"]+)">/g)].map((m) => `<link rel="stylesheet" href="${m[1]}">`).join('\n');
const body = /<body>([\s\S]*)<\/body>/.exec(html)[1].replace(/<script src="app.js"><\/script>/, '');
const tailor = r('lib/tailor.js').replace(/^export /m, '');
fs.writeFileSync(out, `<title>${title}</title>\n${fonts}\n<style>\n${r('public/style.css')}\n</style>\n${body}\n<script>\n${tailor}\n${r('scripts/preview-stub.js')}\n${r('public/app.js')}\n</script>\n`);
