// Szablony i kolory CV. Lista musi zgadzać się z public/app.js (TPLS, COLORS).
export const TPLS = ['nowoczesny', 'os', 'szwajcarski', 'geometria', 'elegancki', 'klasyczny'];
const LEGACY = { wyrazisty: 'geometria' }; // stare zamówienia
export const COLORS = { niebieski: '#2548E8', granat: '#1E3A5F', morski: '#0F766E', bordo: '#9F1239', fiolet: '#6D28D9', grafit: '#374151' };
export const DEFAULT_DESIGN = { tpl: 'nowoczesny', color: 'niebieski' };
export const cleanDesign = (d) => ({
  tpl: TPLS.includes(d?.tpl) ? d.tpl : LEGACY[d?.tpl] || DEFAULT_DESIGN.tpl,
  color: d?.color in COLORS ? d.color : DEFAULT_DESIGN.color,
});
