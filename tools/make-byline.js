// 各記事に「パンくずリスト」「PR表記と更新日の行」（どちらもページの上）と「著者プロフィールの枠」（ページのいちばん下）を入れる
//   使い方：リポジトリのルートで `node tools/make-byline.js`
//   - パンくず：ルアー記事は「トップ › ルアー図鑑 › 魚種 › 記事名」（魚種は lure-zukan.html の data-category。
//     リンク先は lure-zukan.html?cat=魚種）、メーカー記事（maker-zukan.html からリンク）は「トップ › メーカー図鑑 › 記事名」、
//     それ以外（まとめ・ロッド・道具など）は「トップ › 記事一覧（sitemap.html） › 記事名」。構造化データの BreadcrumbList も同じ内容で作り直す
//   - 記事名は、すでにある BreadcrumbList の最後の名前（無ければ H1）。名前を変えたいときは BreadcrumbList の最後の name を直して実行する
//   - 更新日は構造化データの dateModified（無ければ datePublished）。PR表記と同じ行の右に出す。どちらも無ければ更新日は出さない
//   - 著者の枠の置き場所：</main> の直前（「本日のオススメルアーはこちら」のボタンの下）。make-osusume.js のあとに実行する
//   - 記事内の <!-- パンくず start --> 〜 end、<!-- パンくず構造化データ start --> 〜 end、<!-- 更新日 start --> 〜 end、
//     <!-- 著者 start --> 〜 end の範囲だけを書き換える。手で編集しない
//   - 枠の文章やアイコンを変えるときは、下の AUTHOR を直して実行する
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'article');
const DATE_START = '<!-- 更新日 start -->';
const DATE_END = '<!-- 更新日 end -->';
const START = '<!-- 著者 start -->';
const END = '<!-- 著者 end -->';
const EXCLUDE = new Set(['privacy.html', 'shop-links.html']);
const NO_CRUMB = new Set(['lure_template.html']);  // パンくずを入れないページ（テンプレート）
const CRUMB_START = '<!-- パンくず start -->';
const CRUMB_END = '<!-- パンくず end -->';
const LD_START = '<!-- パンくず構造化データ start -->';
const LD_END = '<!-- パンくず構造化データ end -->';
const BASE = 'https://tsuri-boon.github.io/';

// ルアー記事の魚種（図鑑の data-category）と、メーカー記事
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const fishOf = {};
for (const m of read('lure-zukan.html').matchAll(/<li class="lure-item"([^>]*)>([\s\S]*?)<\/li>/g)) {
  const f = (m[2].match(/href="\/article\/([^"]+\.html)"/) || [])[1];
  const cat = (m[1].match(/data-category="([^"]*)"/) || [])[1];
  if (f && cat && !fishOf[f]) fishOf[f] = cat;
}
// メーカー記事：maker-zukan.html からリンクしているものと、make-osusume.js の MAKER_PAGES
const makerPages = new Set([...read('maker-zukan.html').matchAll(/href="\/?article\/([^"#?]+\.html)"/g)].map(m => m[1]));
const makerTable = (read('tools/make-osusume.js').match(/const MAKER_PAGES = \{([\s\S]*?)\};/) || [])[1] || '';
for (const m of makerTable.matchAll(/([\w-]+):\s*'/g)) makerPages.add(m[1] + '.html');

const esc = t => t.replace(/&(?!(?:[a-z]+|#\d+|#x[0-9a-f]+);)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const strip = t => t.replace(/<br\s*\/?>[\s\S]*$/, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

// 構造化データの BreadcrumbList（<script> ごと）を探す
const LD_RE = /[ \t]*(?:<!--[^\n]*-->[ \t]*\r?\n[ \t]*)?<script type="application\/ld\+json">([\s\S]*?)<\/script>[ \t]*\r?\n?/g;
function breadcrumbScripts(html) {
  const out = [];
  for (const m of html.matchAll(LD_RE)) {
    if (!m[1].includes('BreadcrumbList')) continue;
    let j = null;
    try { j = JSON.parse(m[1]); } catch (e) { /* 読めないものは触らない */ }
    if (j && j['@type'] === 'BreadcrumbList') out.push({ index: m.index, text: m[0], data: j });
  }
  return out;
}

function crumbsOf(f, html, oldName) {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const name = oldName || (h1 ? strip(h1[1]) : f);
  const list = [['トップ', '../index.html', BASE]];
  if (fishOf[f]) {
    const cat = fishOf[f];
    list.push(['ルアー図鑑', '../lure-zukan.html', BASE + 'lure-zukan.html']);
    list.push([cat, `../lure-zukan.html?cat=${encodeURIComponent(cat)}`, `${BASE}lure-zukan.html?cat=${encodeURIComponent(cat)}`]);
  } else if (makerPages.has(f)) {
    list.push(['メーカー図鑑', '../maker-zukan.html', BASE + 'maker-zukan.html']);
  } else {
    list.push(['記事一覧', '../sitemap.html', BASE + 'sitemap.html']);
  }
  list.push([name, null, `${BASE}article/${f}`]);
  return list;
}

const crumbNav = list => `${CRUMB_START}<nav class="breadcrumb" aria-label="パンくずリスト"><ol>${list.map(([n, href]) =>
  href ? `<li><a href="${href}">${esc(n)}</a></li>` : `<li aria-current="page">${esc(n)}</li>`).join('')}</ol></nav>${CRUMB_END}`;

const crumbLd = (list, nl) => [
  `  ${LD_START}`,
  '  <script type="application/ld+json">',
  '  {',
  '    "@context": "https://schema.org",',
  '    "@type": "BreadcrumbList",',
  '    "itemListElement": [',
  list.map(([n, , url], i) => `      {"@type": "ListItem", "position": ${i + 1}, "name": ${JSON.stringify(n)}, "item": "${url}"}`).join(',' + nl),
  '    ]',
  '  }',
  '  </script>',
  `  ${LD_END}`,
].join(nl) + nl;

const AUTHOR = {
  name: 'こすけ',
  role: 'ルアーマニア・関西の釣り人',
  icon: '../image/tsuriboon_favicon.png',
  bio: '「なぜこのルアーは釣れるのか」を、納得がいくまで調べずにはいられない釣り人。手元のルアーは400種類以上。仕事は研究とデータ分析の分野で、情報をしっかり精査して正確にお届けすることを大切にしています。ホームは関西。',
};

const dateOf = html => {
  const m = html.match(/"dateModified"\s*:\s*"(\d{4})-(\d{2})-(\d{2})/) || html.match(/"datePublished"\s*:\s*"(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}年${Number(m[2])}月${Number(m[3])}日` : '';
};

const authorBox = nl => [
  START,
  '  <aside class="author-box">',
  '    <span class="author-box__label">ABOUT ME</span>',
  `    <img class="author-box__icon" src="${AUTHOR.icon}" alt="${AUTHOR.name}" loading="lazy">`,
  '    <div class="author-box__body">',
  `      <p class="author-box__name">${AUTHOR.name}</p>`,
  `      <p class="author-box__role">${AUTHOR.role}</p>`,
  `      <p class="author-box__bio">${AUTHOR.bio}</p>`,
  '      <a class="author-box__more" href="../tsuri-boon.html#author">プロフィールを見る</a>',
  '    </div>',
  '  </aside>',
  `  ${END}`,
].join(nl);

let count = 0;
for (const f of fs.readdirSync(DIR).filter(x => x.endsWith('.html') && !EXCLUDE.has(x))) {
  const p = path.join(DIR, f);
  const before = fs.readFileSync(p, 'utf8');
  const nl = before.includes('\r\n') ? '\r\n' : '\n';
  let html = before;

  // 著者の枠（いったん消して、</main> の直前＝ページのいちばん下に置く）
  if (!html.includes('</main>')) continue;
  const oldBox = new RegExp(`[ \\t]*${START}[\\s\\S]*?${END}(\\r?\\n)*`, 'g');
  html = html.replace(oldBox, '');
  const i = html.lastIndexOf('</main>');
  const head = html.slice(0, i).replace(/\s*$/, '');
  html = `${head}${nl}${nl}  ${authorBox(nl)}${nl}${html.slice(i)}`;

  // 更新日（PR表記と同じ行の右）。前に入れた行はいったん消し、PR表記は元に戻す
  const date = dateOf(html);
  const oldDate = new RegExp(`([ \\t]*)${DATE_START}([\\s\\S]*?)${DATE_END}(\\r?\\n)?`, 'g');
  html = html.replace(oldDate, (m, ind, inner) => {
    const pr = inner.match(/<div class="pr-note">[\s\S]*?<\/div>/);
    return pr ? `${ind}${pr[0]}${nl}` : '';
  });
  if (date) {
    const dateP = `<p class="article-date">更新日：${date}</p>`;
    const pr = html.match(/([ \t]*)(<div class="pr-note">[\s\S]*?<\/div>)[ \t]*\r?\n?/);
    if (pr) {
      html = html.replace(pr[0], `${pr[1]}${DATE_START}<div class="article-meta">${pr[2]}${dateP}</div>${DATE_END}${nl}`);
    } else if (/<main[^>]*>/.test(html)) {
      html = html.replace(/(<main[^>]*>)\r?\n?/, (m, tag) => `${tag}${nl}  ${DATE_START}<div class="article-meta">${dateP}</div>${DATE_END}${nl}`);
    }
  }

  // パンくずリスト（画面の表示と構造化データ）
  html = html.replace(new RegExp(`[ \\t]*${CRUMB_START}[\\s\\S]*?${CRUMB_END}\\r?\\n?`, 'g'), '');
  html = html.replace(new RegExp(`[ \\t]*${LD_START}\\r?\\n?`, 'g'), '').replace(new RegExp(`[ \\t]*${LD_END}\\r?\\n?`, 'g'), '');
  if (!NO_CRUMB.has(f) && /<main[^>]*>/.test(html)) {
    const olds = breadcrumbScripts(html);
    const oldList = olds.length ? olds[0].data.itemListElement : null;
    const oldName = oldList && oldList.length ? oldList[oldList.length - 1].name : '';
    const list = crumbsOf(f, html, oldName);
    // 構造化データ：古い BreadcrumbList を消して、最初にあった場所（無ければ </head> の直前）に入れる
    let at = olds.length ? olds[0].index : -1;
    for (const o of olds.reverse()) html = html.slice(0, o.index) + html.slice(o.index + o.text.length);
    if (at < 0) at = html.lastIndexOf('</head>');
    html = html.slice(0, at) + crumbLd(list, nl) + html.slice(at);
    // 画面：<main> のすぐ下（PR表記と更新日の行の上）
    html = html.replace(/(<main[^>]*>)\r?\n?/, (m, tag) => `${tag}${nl}  ${crumbNav(list)}${nl}`);
  }

  if (html !== before) { fs.writeFileSync(p, html); count++; }
}
console.log(`更新日と著者の枠を ${count} 記事に反映しました`);
