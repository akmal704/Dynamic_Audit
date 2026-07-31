/* ─────────────────────────────────────────────────────────────
   build.mjs — generates Russian (/ru/) and Uzbek (/uz/) static
   versions of the site from the English source files.

   Run:  node build.mjs

   Why: search engines index one language per URL. Serving all three
   languages from a single URL made Google treat the site as English
   only (English snippets for Uzbek queries, nothing for Russian).
   Each generated page has its own <html lang>, title, description,
   keywords, canonical and hreflang — the correct multilingual setup.
   ───────────────────────────────────────────────────────────── */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const write = (p, s) => { mkdirSync(dirname(join(ROOT, p)), { recursive: true }); writeFileSync(join(ROOT, p), s); };

const BASE = 'https://dynamicaudit.uz';
const LANG_LABEL = { en: 'en_US', ru: 'ru_RU', uz: 'uz_UZ' };

/* Pull the translation dictionary straight out of script.js so the baked
   text never drifts from what the live language switcher renders. */
const T = (() => {
  const src = read('script.js');
  const m = src.match(/const T = (\{[\s\S]*?\n\});/);
  if (!m) throw new Error('Could not locate the T translations object in script.js');
  return new Function('return (' + m[1] + ')')();
})();

/* Bake data-i18n text into the homepage HTML for a given language, mirroring
   applyLang() in script.js — so the static file already contains native text. */
function bakeBody(html, lang) {
  const dict = T[lang];
  // Inner text/HTML for [data-i18n] elements (no element here nests its own tag).
  html = html.replace(
    /(<(\w+)\b[^>]*\sdata-i18n="(\w+)"[^>]*>)([\s\S]*?)(<\/\2>)/g,
    (full, open, _tag, key, _inner, close) =>
      dict[key] !== undefined ? open + dict[key] + close : full
  );
  // Placeholders for [data-i18n-placeholder] inputs/textareas.
  html = html.replace(
    /<(\w+)\b([^>]*\sdata-i18n-placeholder="(\w+)"[^>]*)>/g,
    (full, tag, attrs, key) => {
      if (dict[key] === undefined) return full;
      // Boundary avoids matching the "placeholder=" inside data-i18n-placeholder=.
      const realPh = /(?<![-\w])placeholder="[^"]*"/;
      const fixed = realPh.test(attrs)
        ? attrs.replace(realPh, `placeholder="${dict[key]}"`)
        : `${attrs} placeholder="${dict[key]}"`;
      return `<${tag}${fixed}>`;
    }
  );
  return html;
}

/* ── Per-page SEO metadata, keyword-heavy, weighted to large &
      international clients (audit for foreign subsidiaries, group /
      consolidated reporting, due diligence, investors, banks). ── */
const META = {
  home: {
    canon: '/',
    en: {
      title: 'Dynamic Audit — IFRS Audit, Accounting & Outsourcing in Uzbekistan | Ex-Big 4',
      desc: 'IFRS statutory audit, accounting outsourcing, accounting recovery and CFO outsourcing in Uzbekistan for large and international companies. Former EY & Deloitte professionals in Tashkent.',
      kw: 'audit Uzbekistan, IFRS audit Tashkent, statutory audit Uzbekistan, group audit, consolidated financial statements audit, audit for foreign subsidiaries, due diligence Uzbekistan, transfer pricing Uzbekistan, accounting outsourcing Uzbekistan, bookkeeping Tashkent, CFO outsourcing, financial consulting Uzbekistan, IFRS transformation, Big 4 alternative Uzbekistan, ACCA auditor Tashkent, audit firm Uzbekistan, external audit, financial statement audit, EY Deloitte alumni',
    },
    ru: {
      title: 'Dynamic Audit — Аудит по МСФО, Бухгалтерия и Аутсорсинг в Узбекистане',
      desc: 'Аудит по МСФО, аутсорсинг бухгалтерии, восстановление учёта и аутсорсинг финансового директора в Узбекистане для крупных и международных компаний. Бывшие специалисты EY и Deloitte в Ташкенте.',
      kw: 'аудит Узбекистан, аудит по МСФО, аудиторская компания Ташкент, обязательный аудит, статутарный аудит, аудит крупных предприятий, аудит группы компаний, консолидированная отчётность, аудит для инвесторов, аудит для банков, due diligence Узбекистан, дью дилидженс, трансфертное ценообразование, аудит дочерних компаний иностранных корпораций, международный аудит, бухгалтерия, бухгалтерия аутсорс, аутсорсинг бухгалтерии, восстановление учёта, аутсорсинг финансового директора, CFO аутсорсинг, налоговый консалтинг Узбекистан, трансформация отчётности МСФО, НСБУ, альтернатива Большой четвёрки, ACCA аудитор, EY Deloitte',
    },
    uz: {
      title: 'Dynamic Audit — MSFOʻ Auditi, Buxgalteriya va Autsorsing Oʻzbekistonda',
      desc: 'MSFOʻ boʻyicha audit, buxgalteriya autsorsingi, hisobni tiklash va moliyaviy direktor autsorsingi Oʻzbekistonda — yirik va xalqaro kompaniyalar uchun. EY va Deloitte sobiq mutaxassislari, Toshkent.',
      kw: 'audit Oʻzbekiston, MSFO auditi, MSFO boʻyicha audit, auditorlik kompaniyasi Toshkent, majburiy audit, yirik korxonalar auditi, guruh kompaniyalari auditi, konsolidatsiyalangan hisobot, investorlar uchun audit, banklar uchun audit, due diligence Oʻzbekiston, transfert narxlar, xorijiy kompaniyalar shoʻba korxonalari auditi, xalqaro audit, buxgalteriya, buxgalteriya autsorsing, hisobni tiklash, moliyaviy direktor autsorsingi, soliq konsalting, MSFO transformatsiya, BHMS, ACCA auditor, EY Deloitte',
    },
  },
  'services/ifrs-audit-uzbekistan.html': {
    canon: '/services/ifrs-audit-uzbekistan.html',
    en: {
      title: 'IFRS Statutory Audit in Uzbekistan — Group & Consolidated Audit | Dynamic Audit',
      desc: 'Independent IFRS statutory audit in Uzbekistan for large enterprises, holdings and foreign-owned subsidiaries. Consolidated group audits recognised by international investors, banks and regulators.',
      kw: 'IFRS audit Uzbekistan, statutory audit Tashkent, group audit, consolidated audit, audit for foreign subsidiaries, audit for investors, audit for banks, external audit Uzbekistan, ISA audit, financial statement audit, holding company audit, Big 4 alternative, due diligence',
    },
    ru: {
      title: 'Аудит по МСФО в Узбекистане — Аудит Группы и Консолидированной Отчётности',
      desc: 'Независимый обязательный аудит по МСФО в Узбекистане для крупных предприятий, холдингов и дочерних компаний иностранных корпораций. Консолидированный аудит группы, признаваемый инвесторами, банками и регуляторами.',
      kw: 'аудит по МСФО, аудит Узбекистан, обязательный аудит, статутарный аудит, аудит группы компаний, консолидированная отчётность аудит, аудит холдинга, аудит для инвесторов, аудит для банков, аудит дочерних компаний иностранных корпораций, аудит крупных предприятий, международный аудит, аудиторская компания Ташкент, МСА, due diligence',
    },
    uz: {
      title: 'MSFOʻ boʻyicha Audit Oʻzbekistonda — Guruh va Konsolidatsiyalangan Audit',
      desc: 'Oʻzbekistonda yirik korxonalar, xoldinglar va xorijiy kompaniyalar shoʻba korxonalari uchun mustaqil MSFO boʻyicha majburiy audit. Investorlar, banklar va regulyatorlar tan oladigan konsolidatsiyalangan guruh auditi.',
      kw: 'MSFO auditi, audit Oʻzbekiston, majburiy audit, guruh kompaniyalari auditi, konsolidatsiyalangan hisobot auditi, xolding auditi, investorlar uchun audit, banklar uchun audit, xorijiy kompaniyalar shoʻba korxonalari auditi, yirik korxonalar auditi, xalqaro audit, auditorlik kompaniyasi Toshkent, due diligence',
    },
  },
  'services/accounting-outsourcing-uzbekistan.html': {
    canon: '/services/accounting-outsourcing-uzbekistan.html',
    en: {
      title: 'Accounting Outsourcing in Uzbekistan — Bookkeeping & Tax for Large Companies | Dynamic Audit',
      desc: 'Full-service accounting outsourcing and bookkeeping in Uzbekistan for large and foreign-owned companies. IFRS-ready records, tax optimisation and compliance by former EY & Deloitte professionals.',
      kw: 'accounting outsourcing Uzbekistan, bookkeeping Tashkent, outsourced accounting for foreign companies, accounting for subsidiaries, payroll outsourcing Uzbekistan, tax compliance, tax optimisation Uzbekistan, IFRS bookkeeping, VAT filing Uzbekistan, 1C accounting',
    },
    ru: {
      title: 'Аутсорсинг Бухгалтерии в Узбекистане — Бухгалтерия для Крупных Компаний',
      desc: 'Полный аутсорсинг бухгалтерии в Узбекистане для крупных и иностранных компаний. Ведение учёта по МСФО и НСБУ, налоговая оптимизация и отчётность от бывших специалистов EY и Deloitte.',
      kw: 'аутсорсинг бухгалтерии Узбекистан, бухгалтерия аутсорс, бухгалтерия Узбекистан, бухгалтерский учёт Ташкент, бухгалтерия для иностранных компаний, бухгалтерия дочерних компаний, расчёт заработной платы аутсорсинг, налоговая оптимизация, налоговый консалтинг, ведение учёта МСФО, НДС декларация, 1С бухгалтерия',
    },
    uz: {
      title: 'Buxgalteriya Autsorsingi Oʻzbekistonda — Yirik Kompaniyalar uchun Buxgalteriya',
      desc: 'Oʻzbekistonda yirik va xorijiy kompaniyalar uchun toʻliq buxgalteriya autsorsingi. MSFO va BHMS boʻyicha hisob yuritish, soliq optimallashtirish va hisobot EY va Deloitte sobiq mutaxassislaridan.',
      kw: 'buxgalteriya autsorsing Oʻzbekiston, buxgalteriya autsorsingi, buxgalteriya Oʻzbekiston, buxgalteriya Toshkent, xorijiy kompaniyalar uchun buxgalteriya, shoʻba korxonalar buxgalteriyasi, ish haqi autsorsing, soliq optimallashtirish, soliq konsalting, MSFO hisob yuritish, QQS deklaratsiya, 1C buxgalteriya',
    },
  },
  'services/accounting-recovery-uzbekistan.html': {
    canon: '/services/accounting-recovery-uzbekistan.html',
    en: {
      title: 'Accounting Recovery & Reconstruction in Uzbekistan | Dynamic Audit',
      desc: 'Professional accounting recovery in Uzbekistan for companies with incomplete or unreliable records. We rebuild your books to an auditable, IFRS-ready standard and resolve tax exposure.',
      kw: 'accounting recovery Uzbekistan, accounting reconstruction Tashkent, restore accounting records, 1C setup Uzbekistan, tax risk clean-up, pre-audit clean-up, bookkeeping restoration',
    },
    ru: {
      title: 'Восстановление Бухгалтерского Учёта в Узбекистане | Dynamic Audit',
      desc: 'Профессиональное восстановление бухгалтерского учёта в Узбекистане для компаний с неполными или недостоверными данными. Приводим учёт к аудируемому стандарту МСФО и устраняем налоговые риски.',
      kw: 'восстановление бухгалтерского учёта, восстановление учёта Узбекистан, восстановление учёта Ташкент, исправление ошибок учёта, настройка 1С, устранение налоговых рисков, подготовка к аудиту, восстановление бухгалтерии',
    },
    uz: {
      title: 'Buxgalteriya Hisobini Tiklash Oʻzbekistonda | Dynamic Audit',
      desc: 'Oʻzbekistonda toʻliq boʻlmagan yoki ishonchsiz hisobga ega kompaniyalar uchun buxgalteriya hisobini professional tiklash. Hisobni auditga tayyor MSFO standartiga keltiramiz va soliq risklarini bartaraf etamiz.',
      kw: 'buxgalteriya hisobini tiklash, hisobni tiklash Oʻzbekiston, hisobni tiklash Toshkent, hisob xatolarini tuzatish, 1C sozlash, soliq risklarini bartaraf etish, auditga tayyorgarlik',
    },
  },
  'services/cfo-outsourcing-tashkent.html': {
    canon: '/services/cfo-outsourcing-tashkent.html',
    en: {
      title: 'CFO Outsourcing in Tashkent, Uzbekistan — Outsourced Finance Director | Dynamic Audit',
      desc: 'Big 4-trained CFO outsourcing in Uzbekistan for growing and international companies. Management reporting, budgeting, investor and bank packs, and financial controls without a full-time CFO.',
      kw: 'CFO outsourcing Uzbekistan, outsourced CFO Tashkent, finance director outsourcing, part-time CFO, management reporting, budgeting forecasting, investor reporting, financial controls, virtual CFO Uzbekistan',
    },
    ru: {
      title: 'Аутсорсинг Финансового Директора (CFO) в Ташкенте, Узбекистан | Dynamic Audit',
      desc: 'Аутсорсинг финансового директора уровня Big 4 в Узбекистане для растущих и международных компаний. Управленческая отчётность, бюджетирование, отчёты для инвесторов и банков без штатного CFO.',
      kw: 'аутсорсинг финансового директора, CFO аутсорсинг Узбекистан, аутсорсинг CFO Ташкент, финансовый директор на аутсорсе, управленческая отчётность, бюджетирование, отчётность для инвесторов, финансовый контроль, виртуальный финансовый директор',
    },
    uz: {
      title: 'Moliyaviy Direktor (CFO) Autsorsingi Toshkentda, Oʻzbekiston | Dynamic Audit',
      desc: 'Oʻzbekistonda oʻsib borayotgan va xalqaro kompaniyalar uchun Big 4 darajasidagi moliyaviy direktor autsorsingi. Boshqaruv hisoboti, byudjetlashtirish, investor va bank paketlari shtatdagi CFOsiz.',
      kw: 'moliyaviy direktor autsorsingi, CFO autsorsing Oʻzbekiston, CFO autsorsing Toshkent, moliyaviy direktor autsorsda, boshqaruv hisoboti, byudjetlashtirish, investorlar uchun hisobot, moliyaviy nazorat, virtual moliyaviy direktor',
    },
  },
  'services/financial-consulting-uzbekistan.html': {
    canon: '/services/financial-consulting-uzbekistan.html',
    en: {
      title: 'Financial Consulting & Big 4 Advisory in Uzbekistan — IFRS Transformation, Due Diligence | Dynamic Audit',
      desc: 'Financial consulting in Uzbekistan for large and international companies: IFRS transformation, Big 4 audit readiness, due diligence and financial modelling by former EY & Deloitte professionals.',
      kw: 'financial consulting Uzbekistan, IFRS transformation, NSBU to IFRS conversion, due diligence Uzbekistan, Big 4 audit readiness, financial modelling, pre-audit support, transfer pricing, advisory Tashkent',
    },
    ru: {
      title: 'Финансовый Консалтинг и Поддержка Аудита Big 4 в Узбекистане | Dynamic Audit',
      desc: 'Финансовый консалтинг в Узбекистане для крупных и международных компаний: трансформация отчётности в МСФО, подготовка к аудиту Big 4, due diligence и финансовое моделирование от бывших специалистов EY и Deloitte.',
      kw: 'финансовый консалтинг Узбекистан, трансформация отчётности МСФО, трансформация НСБУ в МСФО, due diligence Узбекистан, дью дилидженс, подготовка к аудиту Big 4, финансовое моделирование, трансфертное ценообразование, консалтинг Ташкент',
    },
    uz: {
      title: 'Moliyaviy Konsalting va Big 4 Audit Yordami Oʻzbekistonda | Dynamic Audit',
      desc: 'Oʻzbekistonda yirik va xalqaro kompaniyalar uchun moliyaviy konsalting: MSFO transformatsiyasi, Big 4 auditga tayyorgarlik, due diligence va moliyaviy modellashtirish EY va Deloitte sobiq mutaxassislaridan.',
      kw: 'moliyaviy konsalting Oʻzbekiston, MSFO transformatsiya, BHMS dan MSFO ga oʻtkazish, due diligence Oʻzbekiston, Big 4 auditga tayyorgarlik, moliyaviy modellashtirish, transfert narxlar, konsalting Toshkent',
    },
  },
};

/* ── hreflang + canonical block builder ───────────────────────── */
function altBlock(canonPath) {
  const en = BASE + canonPath;
  const ru = BASE + '/ru' + (canonPath === '/' ? '/' : canonPath);
  const uz = BASE + '/uz' + (canonPath === '/' ? '/' : canonPath);
  return { en, ru, uz };
}

function headFor(lang, pageKey) {
  const m = META[pageKey];
  const meta = m[lang];
  const urls = altBlock(m.canon);
  const canonical = urls[lang];
  const hreflang =
    `  <link rel="canonical" href="${canonical}" />\n` +
    `  <link rel="alternate" hreflang="en" href="${urls.en}" />\n` +
    `  <link rel="alternate" hreflang="ru" href="${urls.ru}" />\n` +
    `  <link rel="alternate" hreflang="uz" href="${urls.uz}" />\n` +
    `  <link rel="alternate" hreflang="x-default" href="${urls.en}" />`;
  return { meta, canonical, hreflang, urls };
}

/* Replace the <title>, description, keywords, canonical, hreflang set,
   og:url and og:locale in a head string. Tolerant of missing tags. */
function rewriteHead(html, lang, pageKey) {
  const { meta, canonical, hreflang, urls } = headFor(lang, pageKey);

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${meta.title}</title>`);
  html = html.replace(/<meta name="description" content="[\s\S]*?"\s*\/>/,
    `<meta name="description" content="${meta.desc}" />`);
  if (/<meta name="keywords"/.test(html)) {
    html = html.replace(/<meta name="keywords" content="[\s\S]*?"\s*\/>/,
      `<meta name="keywords" content="${meta.kw}" />`);
  } else {
    html = html.replace(/(<meta name="robots"[^>]*\/>)/,
      `<meta name="keywords" content="${meta.kw}" />\n  $1`);
  }

  // Remove every existing canonical + hreflang line, then inject the fresh set.
  html = html.replace(/[ \t]*<link rel="canonical"[^>]*>\n?/g, '');
  html = html.replace(/[ \t]*<link rel="alternate" hreflang="[^"]*"[^>]*>\n?/g, '');
  // Put the block right after the viewport meta (always present near top of head).
  html = html.replace(/(<meta name="viewport"[^>]*>\n)/, `$1${hreflang}\n`);

  html = html.replace(/(<meta property="og:url" content=")[^"]*("\s*\/>)/, `$1${canonical}$2`);
  html = html.replace(/(<meta property="og:title" content=")[^"]*("\s*\/>)/, `$1${meta.title}$2`);
  html = html.replace(/(<meta property="og:description" content=")[^"]*("\s*\/>)/, `$1${meta.desc}$2`);
  // Primary og:locale for this language (drop alternates, keep it simple).
  html = html.replace(/(<meta property="og:locale" content=")[^"]*("\s*\/>)/, `$1${LANG_LABEL[lang]}$2`);

  return html;
}

/* ── Homepage generation ──────────────────────────────────────── */
function buildHome(lang) {
  let html = read('index.html');

  html = html.replace(/<html lang="[^"]*">/, `<html lang="${lang}">`);
  html = rewriteHead(html, lang, 'home');

  // Absolutise all relative href/src (assets + links) to site root.
  html = html.replace(/\b(href|src)="(?!https?:|\/\/|\/|#|mailto:|tel:|data:)([^"]+)"/g, '$1="/$2"');
  // Point internal page links at the same-language versions.
  html = html.replace(/\b(href)="\/services\//g, `$1="/${lang}/services/`);
  // Home anchors and logo link -> language home.
  html = html.replace(/\bhref="\/#/g, `href="/${lang}/#`);
  html = html.replace(/<a href="#" class="nav-logo">/, `<a href="/${lang}/" class="nav-logo">`);
  html = html.replace(/<a href="#" class="footer-logo">/, `<a href="/${lang}/" class="footer-logo">`);
  // Blog stays English (no translated blog yet): /blog/ already correct.

  // Force this page's language before script.js runs.
  html = html.replace(/<script src="\/script\.js"><\/script>/,
    `<script>window.__PAGE_LANG='${lang}';</script>\n<script src="/script.js"></script>`);

  // Replace the English SEO noscript block with a translated one.
  html = html.replace(/<noscript>[\s\S]*?<\/noscript>/, noscriptFor(lang));

  // Bake native-language body text into the static HTML (belt-and-suspenders
  // with the runtime language switcher).
  html = bakeBody(html, lang);

  return html;
}

/* ── Service page generation ──────────────────────────────────── */
function buildService(pageKey, lang) {
  let html = read(pageKey);

  html = html.replace(/<html lang="[^"]*">/, `<html lang="${lang}">`);
  html = html.replace(/<body data-lang="[^"]*">/, `<body data-lang="${lang}">`);
  html = rewriteHead(html, lang, pageKey);

  // Path fixes: pages move from /services/ to /<lang>/services/.
  html = html.replace(/\b(href|src)="\.\.\//g, '$1="/');   // ../x -> /x (root assets, blog, home)
  html = html.replace(/\bhref="\/#/g, `href="/${lang}/#`); // home anchors -> language home
  html = html.replace(/\bhref="\/"/g, `href="/${lang}/"`); // bare home link -> language home
  // Sibling service links (no ../) stay relative and resolve within /<lang>/services/.

  // Rewrite the language switcher to navigate between URLs, and stop the
  // localStorage auto-switch so the page always renders its own language.
  html = html.replace(/onclick="setSvcLang\('(en|ru|uz)',this\)"/g, `onclick="daSwitchLang('$1')"`);
  // Move the "active" highlight onto this page's language button.
  html = html.replace(/(class="(?:svc-)?lang-btn) active"/g, '$1"');
  html = html.replace(new RegExp(`(class="(svc-)?lang-btn)"( onclick="daSwitchLang\\('${lang}'\\)")`, 'g'), '$1 active"$3');
  html = html.replace(
    /<script>[\s\S]*?<\/script>\s*<\/body>/,
    `<script>
  function daSwitchLang(lang){var p=location.pathname.replace(/^\\/(ru|uz)(?=\\/|$)/,'');if(p==='')p='/';var t=(lang==='en')?p:('/'+lang+p);t=t.replace(/\\/{2,}/g,'/');location.href=t+location.hash;}
  function toggleFaq(btn){btn.closest('.faq-item').classList.toggle('open');}
  window.addEventListener('scroll',()=>{document.getElementById('site-nav').classList.toggle('scrolled',window.scrollY>40);});
</script>
</body>`);

  return html;
}

/* ── Translated crawlable noscript for the homepage ───────────── */
function noscriptFor(lang) {
  const blocks = {
    ru: `<noscript>
<div style="position:absolute;left:-9999px;" aria-hidden="true">
<h1>Dynamic Audit — Аудит по МСФО в Узбекистане</h1>
<p>Dynamic Audit предоставляет аудит по МСФО, аутсорсинг бухгалтерии, восстановление учёта и аутсорсинг финансового директора в Узбекистане для крупных и международных компаний. Наши специалисты — бывшие сотрудники EY и Deloitte с квалификацией ACCA.</p>
<h2>Наши услуги</h2>
<ul>
  <li>Аудит по МСФО — обязательный аудит, аудит группы компаний, консолидированная отчётность в Ташкенте</li>
  <li>Восстановление бухгалтерского учёта — настройка 1С, устранение налоговых рисков</li>
  <li>Аутсорсинг финансового директора (CFO) — управленческая отчётность, бюджетирование, отчёты для инвесторов и банков</li>
  <li>Финансовый консалтинг — трансформация отчётности МСФО, due diligence, поддержка аудита Big 4</li>
  <li>Аутсорсинг бухгалтерии — бухгалтерия для иностранных компаний, налоговая оптимизация</li>
</ul>
<p>Аудиторская компания в Ташкенте, основанная выпускниками Большой четвёрки. Аудит для инвесторов и банков, аудит дочерних компаний иностранных корпораций, трансфертное ценообразование, международный аудит.</p>
</div>
</noscript>`,
    uz: `<noscript>
<div style="position:absolute;left:-9999px;" aria-hidden="true">
<h1>Dynamic Audit — MSFO boʻyicha Audit Oʻzbekistonda</h1>
<p>Dynamic Audit Oʻzbekistonda yirik va xalqaro kompaniyalar uchun MSFO boʻyicha audit, buxgalteriya autsorsingi, hisobni tiklash va moliyaviy direktor autsorsingini taqdim etadi. Mutaxassislarimiz — ACCA malakasiga ega EY va Deloitte sobiq xodimlari.</p>
<h2>Bizning xizmatlar</h2>
<ul>
  <li>MSFO boʻyicha audit — majburiy audit, guruh kompaniyalari auditi, konsolidatsiyalangan hisobot, Toshkent</li>
  <li>Buxgalteriya hisobini tiklash — 1C sozlash, soliq risklarini bartaraf etish</li>
  <li>Moliyaviy direktor (CFO) autsorsingi — boshqaruv hisoboti, byudjetlashtirish, investorlar uchun hisobot</li>
  <li>Moliyaviy konsalting — MSFO transformatsiyasi, due diligence, Big 4 auditga tayyorgarlik</li>
  <li>Buxgalteriya autsorsingi — xorijiy kompaniyalar uchun buxgalteriya, soliq optimallashtirish</li>
</ul>
<p>Toshkentdagi auditorlik kompaniyasi, Katta toʻrtlik bitiruvchilari tomonidan tashkil etilgan. Investorlar va banklar uchun audit, xorijiy kompaniyalar shoʻba korxonalari auditi, transfert narxlar, xalqaro audit.</p>
</div>
</noscript>`,
  };
  return blocks[lang];
}

/* Update the English source pages in place: expanded keywords/meta and
   hreflang pointing at the distinct language URLs (they used to self-point). */
function updateEnglish(pageKey) {
  const path = pageKey === 'home' ? 'index.html' : pageKey;
  let html = read(path);
  html = rewriteHead(html, 'en', pageKey);
  write(path, html);
}

/* ── Run ──────────────────────────────────────────────────────── */
const services = Object.keys(META).filter((k) => k !== 'home');
let count = 0;
for (const lang of ['ru', 'uz']) {
  write(`${lang}/index.html`, buildHome(lang));
  count++;
  for (const svc of services) {
    write(`${lang}/${svc}`, buildService(svc, lang));
    count++;
  }
}
for (const key of ['home', ...services]) updateEnglish(key);

/* ── sitemap.xml with per-language hreflang alternates ────────── */
function buildSitemap() {
  const LASTMOD = '2026-08-01';
  const entries = [];
  const pushEntry = (canonPath, priority) => {
    const u = altBlock(canonPath);
    for (const lang of ['en', 'ru', 'uz']) {
      entries.push(
        `  <url>\n` +
        `    <loc>${u[lang]}</loc>\n` +
        `    <lastmod>${LASTMOD}</lastmod>\n` +
        `    <changefreq>monthly</changefreq>\n` +
        `    <priority>${priority}</priority>\n` +
        `    <xhtml:link rel="alternate" hreflang="en" href="${u.en}"/>\n` +
        `    <xhtml:link rel="alternate" hreflang="ru" href="${u.ru}"/>\n` +
        `    <xhtml:link rel="alternate" hreflang="uz" href="${u.uz}"/>\n` +
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${u.en}"/>\n` +
        `  </url>`
      );
    }
  };
  pushEntry('/', '1.0');
  for (const svc of services) pushEntry(META[svc].canon, '0.9');
  // Blog (English only)
  entries.push(
    `  <url>\n    <loc>${BASE}/blog/finance-qualifications-uzbekistan.html</loc>\n` +
    `    <lastmod>${LASTMOD}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`
  );
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
    `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    entries.join('\n') + `\n</urlset>\n`;
  write('sitemap.xml', xml);
}
buildSitemap();

console.log(`Generated ${count} localized pages (ru + uz); updated ${services.length + 1} English pages; wrote sitemap.xml.`);
