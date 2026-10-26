// sitemap.xml（検索エンジン用）と sitemap.html（人が見る用のサイトマップページ）を生成する
//   使い方：リポジトリのルートで `node tools/make-sitemap.js`
//   - トップ階層の主要ページと article/ 内の全記事（.html）を載せる
//   - sitemap.html は、ルアー記事を lure-zukan.html の魚種ごとに、メーカー記事を maker-zukan.html のリンクから分け、
//     残りの記事を「まとめ・ガイド記事」にする
//   - lastmod は各ファイルの最終コミット日。未コミットの変更があるファイルは今日の日付
//   - 載せたくないページは EXCLUDE に追加する
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://tsuri-boon.github.io/';
const EXCLUDE = new Set([
  'testindnx.html',              // テスト用ページ
  'top-test.html',               // トップページのデザイン案（テスト用）
  'article/lure_template.html',  // 記事テンプレート
  'makers.html',                 // maker-zukan.html への転送ページ
]);

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

const git = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
const changed = new Set(execSync('git status --porcelain', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean).map(l => l.slice(3).replace(/"/g, '')));

function lastmod(rel) {
  if (changed.has(rel)) return todayStr;
  const d = git(`git log -1 --format=%cs -- "${rel}"`);
  return d || todayStr;
}

const top = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
const articles = fs.readdirSync(path.join(ROOT, 'article')).filter(f => f.endsWith('.html')).map(f => 'article/' + f);
const pages = [...top, ...articles].filter(p => !EXCLUDE.has(p));

const priority = (p) => (p === 'index.html' ? '1.0' : p === 'lure-zukan.html' || p === 'maker-zukan.html' || p === 'lure-gatya.html' ? '0.9' : p.startsWith('article/') ? '0.7' : '0.5');

const urls = pages
  .sort((a, b) => (a === 'index.html' ? -1 : b === 'index.html' ? 1 : a.localeCompare(b)))
  .map(p => [
    '  <url>',
    `    <loc>${BASE}${p === 'index.html' ? '' : p}</loc>`,  // トップは / を正規URLにする
    `    <lastmod>${lastmod(p)}</lastmod>`,
    `    <priority>${priority(p)}</priority>`,
    '  </url>',
  ].join('\n'));

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls,
  '</urlset>',
  '',
].join('\n');

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
console.log(`sitemap.xml を作成しました（${pages.length} ページ）`);

// ---- sitemap.html ----
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const strip = (t) => t.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const titleCache = {};
function pageTitle(rel) {
  if (titleCache[rel]) return titleCache[rel];
  const h = read(rel);
  const h1 = h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const t = h.match(/<title>([\s\S]*?)<\/title>/);
  const title = t ? strip(t[1]).replace(/\s*[｜|]\s*tsuri-boon\s*$/i, '').replace(/\s*-\s*ツリブーン\s*$/, '') : '';
  return (titleCache[rel] = { title, h1: h1 ? strip(h1[1]) : '' });
}
const esc = (t) => t.replace(/&(?!(?:[a-z]+|#\d+|#x[0-9a-f]+);)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ルアー記事：lure-zukan.html の魚種（data-category）ごと、図鑑の並び順
const zukan = read('lure-zukan.html');
const fishOrder = [];
const lureByFish = {};
const used = new Set();
for (const m of zukan.matchAll(/<li class="lure-item"([^>]*)>([\s\S]*?)<\/li>/g)) {
  const href = (m[2].match(/href="\/article\/([^"]+\.html)"/) || [])[1];
  const cat = (m[1].match(/data-category="([^"]*)"/) || [])[1];
  const rel = href && 'article/' + href;
  if (!rel || !cat || used.has(rel) || !pages.includes(rel)) continue;
  used.add(rel);
  if (!lureByFish[cat]) { lureByFish[cat] = []; fishOrder.push(cat); }
  lureByFish[cat].push(rel);
}

// 主要ページ
const TOP_ORDER = ['index.html', 'lure-zukan.html', 'maker-zukan.html', 'lure-gatya.html', 'howto.html', 'faq.html', 'tsuri-boon.html', 'form.html', 'article/privacy.html'];
const mainPages = [...TOP_ORDER, ...top.sort()].filter((r, i, a) => pages.includes(r) && a.indexOf(r) === i && r !== 'sitemap.html');
mainPages.forEach(r => used.add(r));

// メーカー記事：maker-zukan.html からリンクしている article/
const makers = [...new Set([...read('maker-zukan.html').matchAll(/href="\/?(article\/[^"#?]+\.html)"/g)].map(m => m[1]))]
  .filter(r => pages.includes(r) && !used.has(r));
makers.forEach(r => used.add(r));

// 残りの記事
const others = pages.filter(r => r.startsWith('article/') && !used.has(r))
  .sort((a, b) => pageTitle(a).title.localeCompare(pageTitle(b).title, 'ja'));

// 主要ページは <title> が汎用的なものがあるので表示名を固定する（無いものは <title>）
const LABEL = {
  'index.html': 'トップページ',
  'lure-zukan.html': 'ルアー図鑑',
  'maker-zukan.html': 'メーカー図鑑',
  'lure-gatya.html': 'ルアーガチャ',
  'howto.html': 'ルアーガチャについて',
  'faq.html': 'よくある質問',
  'tsuri-boon.html': 'tsuri-boonとは',
  'form.html': 'お問い合わせ',
  'article/privacy.html': 'プライバシーポリシー',
};
const item = (rel, useH1) => {
  const { title, h1 } = pageTitle(rel);
  return `      <li><a href="${rel}">${esc(LABEL[rel] || (useH1 && h1) || title || rel)}</a></li>`;
};
const sections = [
  ['main', '主要ページ', mainPages, false],
  ...fishOrder.map((f, i) => [`lure-${i + 1}`, `ルアー記事：${f}`, lureByFish[f], true]),
  ['maker', 'メーカー記事', makers, false],
  ['guide', 'まとめ・ガイド記事', others, false],
].filter(s => s[2].length);

const desc = 'tsuri-boonの全ページ一覧（サイトマップ）です。ルアー記事を魚種ごとに、メーカー記事・まとめ記事もまとめて探せます。';
const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-J1YGK5NJLT"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-J1YGK5NJLT');
  </script>

  <!-- このページは tools/make-sitemap.js で自動生成しています。直接編集せず、スクリプトを実行して作り直してください。 -->
  <title>サイトマップ｜tsuri-boon</title>
  <meta name="description" content="${desc}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${BASE}sitemap.html">
  <link rel="icon" href="./image/tsuriboon_favicon.png" type="image/png">
  <meta property="og:title" content="サイトマップ｜tsuri-boon">
  <meta property="og:description" content="${desc}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="tsuri-boon">
  <meta property="og:url" content="${BASE}sitemap.html">
  <meta property="og:image" content="${BASE}image/tsuriboon_logo7.png">
  <link rel="stylesheet" href="css/style.css">
  <style>
    .sitemap-main { max-width: 900px; margin: 0 auto; padding: 16px; }
    .sitemap-toc { display: flex; flex-wrap: wrap; gap: 8px; padding: 0; list-style: none; }
    .sitemap-toc a { display: inline-block; padding: 4px 12px; border: 1px solid #ccd; border-radius: 999px; font-size: 0.9em; text-decoration: none; }
    .sitemap-section h2 { border-left: 4px solid #1a4a7a; padding-left: 8px; font-size: 1.1em; margin-top: 1.6em; }
    .sitemap-list { columns: 2 260px; column-gap: 24px; padding-left: 1.2em; }
    .sitemap-list li { break-inside: avoid; margin: 0.3em 0; line-height: 1.5; }
  </style>
</head>
<body>

<header>
  <a href="index.html" class="logo">
    <img src="image/tsuriboon_logo7.png" alt="tsuri-boon ロゴ">
  </a>
</header>

<div class="sub-nav">
  <nav class="sub-nav-inner">
    <a href="lure-gatya.html">ガチャページ</a>
    <a href="tsuri-boon.html">tsuri-boonとは</a>
    <a href="maker-zukan.html">メーカー図鑑</a>
    <a href="lure-zukan.html">ルアー図鑑</a>
  </nav>
</div>

<main class="sitemap-main">
  <h1>サイトマップ</h1>
  <p>tsuri-boonの全ページの一覧です（全${pages.length}ページ）。</p>
  <ul class="sitemap-toc">
${sections.map(([id, h]) => `    <li><a href="#${id}">${h.replace('ルアー記事：', '')}</a></li>`).join('\n')}
  </ul>

${sections.map(([id, h, rels, useH1]) => [
  `  <section class="sitemap-section" id="${id}">`,
  `    <h2>${h}（${rels.length}）</h2>`,
  '    <ul class="sitemap-list">',
  ...rels.map(r => item(r, useH1)),
  '    </ul>',
  '  </section>',
].join('\n')).join('\n\n')}
</main>

<footer>
  <nav class="footer-nav">
    <a href="index.html">トップ</a>
    <a href="article/privacy.html">プライバシーポリシー</a>
    <a href="form.html">お問い合わせ</a>
    <a href="sitemap.html">サイトマップ</a>
  </nav>
</footer>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'sitemap.html'), html);
console.log(`sitemap.html を作成しました（${pages.length} ページ）`);
