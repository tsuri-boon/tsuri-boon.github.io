// 各記事に「パンくずリスト」「PR表記と更新日の行」（どちらもページの上）と「著者プロフィールの枠」（ページのいちばん下）を入れる
//   使い方：リポジトリのルートで `node tools/make-byline.js`
//   - パンくずは6つに分ける。構造化データの BreadcrumbList も同じ内容で作り直す
//       ルアー        「トップ › ルアー図鑑 › 魚種 › 記事名」（lure-zukan.html の data-category。リンク先は ?cat=魚種）
//       ロッド        「トップ › ロッド図鑑 › 釣り方 › 記事名」（rod-zukan.html。tools/make-gear-zukan.js が作る）
//       アクセサリー  「トップ › アクセサリー図鑑 › 種類 › 記事名」（accessory-zukan.html。同上）
//       メーカー      「トップ › メーカー図鑑 › 記事名」（maker-zukan.html からリンク、または make-osusume.js の MAKER_PAGES）
//       便利ツール    「トップ › 便利ツール（トップページの #tools） › ツール名」（下の TOOL_PAGES）
//       記事（それ以外のまとめ・ガイド）「トップ › 記事一覧（sitemap.html） › 記事名」
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
// 図鑑ページのカード（記事 → data-category）。ロッド図鑑・アクセサリー図鑑は tools/make-gear-zukan.js が作る
function categoriesOf(page) {
  const out = {};
  if (!fs.existsSync(path.join(ROOT, page))) return out;
  for (const m of read(page).matchAll(/<li class="lure-item"([^>]*)>([\s\S]*?)<\/li>/g)) {
    const f = (m[2].match(/href="\/article\/([^"]+\.html)"/) || [])[1];
    const cat = (m[1].match(/data-category="([^"]*)"/) || [])[1];
    if (f && cat && !out[f]) out[f] = cat;
  }
  return out;
}
const fishOf = categoriesOf('lure-zukan.html');
const rodOf = categoriesOf('rod-zukan.html');
const accOf = categoriesOf('accessory-zukan.html');
// 便利ツール（article/ 内にあるもの）。パンくずは「トップ › 便利ツール（トップページの便利ツール欄） › ツール名」
const TOOL_PAGES = new Set(['egi-sink-checker.html']);
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
  const zukan = (page, label, cat) => {
    list.push([label, `../${page}`, BASE + page]);
    list.push([cat, `../${page}?cat=${encodeURIComponent(cat)}`, `${BASE}${page}?cat=${encodeURIComponent(cat)}`]);
  };
  if (fishOf[f]) {
    zukan('lure-zukan.html', 'ルアー図鑑', fishOf[f]);
  } else if (rodOf[f]) {
    zukan('rod-zukan.html', 'ロッド図鑑', rodOf[f]);
  } else if (accOf[f]) {
    zukan('accessory-zukan.html', 'アクセサリー図鑑', accOf[f]);
  } else if (makerPages.has(f)) {
    list.push(['メーカー図鑑', '../maker-zukan.html', BASE + 'maker-zukan.html']);
  } else if (TOOL_PAGES.has(f)) {
    list.push(['便利ツール', '../index.html#tools', BASE + '#tools']);
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

// 「人気記事はこちら」のカード：今あるカードは残し、POPULAR の順に足りない記事を足して4枚にそろえる（そのページ自身は入れない）
//   エギングのページ（図鑑の魚種がエギング、またはファイル名に egi/eging を含むまとめ）は POPULAR_EGI、それ以外は POPULAR を使う。
//   エギング以外のページからは「2026年新作エギまとめ」、エギングのページからは「サワラのブレードジギング」のカードを外す
const POPULAR_MAX = 4;
const CARD = {
  tungsten: ['tungsten-price.html', '../image/tungsten-price.jpg', 'タングステン高騰はいつまで？', 'TGベイトもシンカーも値上げ…タングステン高騰はいつまで？'],
  sawara: ['sawara-bladejigging.html', '../image/sawara-bladejigging.jpg', 'サワラのブレードジギング完全ガイド', 'サワラのブレードジギング完全ガイド｜釣り方、ジグの選び方、おすすめルアー紹介'],
  egi: ['2026-new-egi.html', '../image/2026-new-egi.jpg', '2026年新作エギまとめ', '2026年新作エギまとめ｜注目の9種をメーカー別に紹介'],
  lure: ['2026-new-lure.html', '../image/2026-new-lure.jpg', '2026年発売新作ルアー', '2026年新作ルアーまとめ＜メーカー別一覧＞'],
  muko: ['mukogawa-kakushi-lure.html', '../image/mukogawa-kakushi-lure.jpg', '武庫川隠れた名作ルアー', '武庫川一文字で釣れてる人が使っている隠れた名作ルアー4選'],
  rank: ['dress2025_bestbuyrank.html', '../image/dress2025_bestbuyrank.jpg', '2025年買ってよかったルアーランキング', '2025年買ってよかったルアーランキング'],
};
const POPULAR = [CARD.tungsten, CARD.sawara, CARD.lure, CARD.muko, CARD.rank];
const POPULAR_EGI = [CARD.tungsten, CARD.egi, CARD.lure, CARD.muko, CARD.rank];
// 期間限定で「人気記事はこちら」の先頭に入れるカード（until の日まで。日本時間）。
// 期間中は先頭に入れて4枚目を外し、期間が過ぎたら次の実行で外して POPULAR から足りない分を足す。
const PROMO = [
  { card: ['furusato-tsurigu.html', '../image/furusato-tsurigu.jpg', 'ふるさと納税のおすすめ釣り具返礼品', '【2026年】ふるさと納税のおすすめ釣り具返礼品｜ジャンル別に紹介'], until: '2026-12-31' },
];
const todayJST = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
const cardHtml = ([href, img, alt, title], nl) => [
  `      <a href="${href}" class="article-card">`,
  `        <img src="${img}" alt="${alt}">`,
  `        <h3>${title}</h3>`,
  '      </a>',
].join(nl);
function applyPromo(html, f, nl, open) {
  const close = html.indexOf('</div>', open);
  let block = html.slice(open, close);
  // いったん期間限定カードを外す
  for (const { card } of PROMO) {
    block = block.replace(new RegExp(`[ \\t]*<a href="${card[0].replace(/\./g, '\\.')}" class="article-card">[\\s\\S]*?<\\/a>\\r?\\n`), '');
  }
  const active = PROMO.filter(p => todayJST <= p.until && p.card[0] !== f).map(p => p.card);
  if (active.length) {
    // 先頭に入れて、POPULAR_MAX を超えた分を後ろから外す
    const head = block.indexOf('\n') + 1;
    block = block.slice(0, head) + active.map(c => cardHtml(c, nl)).join(nl) + nl + block.slice(head);
    const cards = [...block.matchAll(/[ \t]*<a href="[^"]+" class="article-card">[\s\S]*?<\/a>\r?\n/g)];
    for (const m of cards.slice(POPULAR_MAX).reverse()) block = block.slice(0, m.index) + block.slice(m.index + m[0].length);
  }
  return html.slice(0, open) + block + html.slice(close);
}
const isEgiPage = f => fishOf[f] === 'エギング' || /egi|eging/.test(f);
function fillPopular(html, f, nl) {
  const p = html.indexOf('<p>人気記事はこちら</p>');
  if (p < 0) return html;
  const open = html.indexOf('<div class="article-cards">', p);
  if (open < 0) return html;
  html = applyPromo(html, f, nl, open);
  const egiPage = isEgiPage(f);
  {
    // エギング以外のページからは新作エギ、エギングのページからはサワラのカードを外す（見本の記事から写したカードも直す）
    const drop = egiPage ? 'sawara-bladejigging\\.html' : '2026-new-egi\\.html';
    const end = html.indexOf('</div>', open);
    const block = html.slice(open, end).replace(new RegExp(`[ \\t]*<a href="${drop}" class="article-card">[\\s\\S]*?<\\/a>\\r?\\n`), '');
    html = html.slice(0, open) + block + html.slice(end);
  }
  const close = html.indexOf('</div>', open);
  const block = html.slice(open, close);
  const have = [...block.matchAll(/<a href="([^"]+)" class="article-card">/g)].map(m => m[1]);
  const add = (egiPage ? POPULAR_EGI : POPULAR).filter(([href]) => href !== f && !have.includes(href)).slice(0, Math.max(0, POPULAR_MAX - have.length));
  if (!add.length) return html;
  const cards = add.map(([href, img, alt, title]) => [
    `      <a href="${href}" class="article-card">`,
    `        <img src="${img}" alt="${alt}">`,
    `        <h3>${title}</h3>`,
    '      </a>',
  ].join(nl)).join(nl);
  const ls = html.lastIndexOf('\n', close) + 1;  // 閉じタグの行の頭に入れる
  return html.slice(0, ls) + cards + nl + html.slice(ls);
}

// 「便利ツールはこちら」：オススメ記事の下（無ければ著者の枠の上）に、人気記事と同じカードで4枚並べる（そのページ自身は入れない）
const TOOLS_START = '<!-- 便利ツール start -->';
const TOOLS_END = '<!-- 便利ツール end -->';
const TOOLS = [
  ['../mukoindex.html', '../image/mukoindex-card.jpg', '武庫川一文字 青物指数', '武庫川一文字 青物指数｜ブリ・サワラが釣れる日を先読み'],
  ['../chouka-price.html', '../image/chouka-price-card.jpg', '釣果値段換算ツール', '釣果値段換算ツール｜釣った魚はいくら？'],
  ['egi-sink-checker.html', '../image/egi-sink-checker.jpg', 'エギ沈下速度計算', 'エギ沈下速度計算｜水深ごとのフォール時間を計算'],
  // 記事に出るのは先頭の4枚（その記事自身は除く）。ロッド図鑑は入口として4枚目に置く
  ['../rod-zukan.html', '../image/rod-zukan-card.jpg', 'ロッド図鑑', 'ロッド図鑑｜長さ・ルアー重量・継数からロッドを探す'],
  ['../lure-gatya.html', '../image/home_gacha.jpg', 'ルアーガチャ', 'ルアーガチャ｜今日投げるルアーをガチャで決めよう'],
  ['../lure-zukan.html', '../image/home_zukan.jpg', 'ルアー図鑑', 'ルアー図鑑｜魚種・ジャンルからルアーを探す'],
];
const toolsBlock = (f, nl) => [
  TOOLS_START,
  '  <div>',
  '    <p>便利ツールはこちら</p>',
  '    <div class="article-cards">',
  ...TOOLS.filter(([href]) => href !== f).slice(0, 4).map(([href, img, alt, title]) => [
    `      <a href="${href}" class="article-card">`,
    `        <img src="${img}" alt="${alt}" loading="lazy">`,
    `        <h3>${title}</h3>`,
    '      </a>',
  ].join(nl)),
  '    </div>',
  '  </div>',
  `  ${TOOLS_END}`,
].join(nl);

// 「定番記事はこちら」：便利ツールの下に、人気記事と同じカードで並べる（そのページ自身は入れない）
//   ここに入れる記事は tools/make-osusume.js の HIDE にも入れて、オススメ記事には出さない
const BASICS_START = '<!-- 定番記事 start -->';
const BASICS_END = '<!-- 定番記事 end -->';
const BASICS = [
  ['kansai-fishing-calendar.html', '../image/kansai-fishing-calendar.jpg', '関西の釣れる魚カレンダー', '関西の釣れる魚カレンダー｜大阪湾・播磨灘の釣れる時期'],
  ['fishing-calendar-zenkoku.html', '../image/fishing-calendar-zenkoku.jpg', '釣れる魚カレンダー【全国版】', '釣れる魚カレンダー【全国版】｜魚ごとの釣れる時期と適水温'],
  ['kansai-release-size.html', '../image/kansai-release-size.jpg', '関西のリリースサイズと抱卵時期', '関西のリリースサイズと抱卵時期まとめ'],
  ['lunker-size.html', '../image/lunker-size.jpg', 'ランカーサイズの目安一覧', 'ランカーサイズの目安一覧｜尺メバル・座布団ヒラメは何cmから？'],
];
const basicsBlock = (f, nl) => [
  BASICS_START,
  '  <div>',
  '    <p>定番記事はこちら</p>',
  '    <div class="article-cards">',
  ...BASICS.filter(([href]) => href !== f).map(([href, img, alt, title]) => [
    `      <a href="${href}" class="article-card">`,
    `        <img src="${img}" alt="${alt}" loading="lazy">`,
    `        <h3>${title}</h3>`,
    '      </a>',
  ].join(nl)),
  '    </div>',
  '  </div>',
  `  ${BASICS_END}`,
].join(nl);

// サワラ向けのブレードジグの記事：「ワンポイント」の段落のあとに、ワイヤーリーダーをすすめる欄（アフィリンク付き）を入れる
//   対象は WIRE_TARGETS。リンクは tools/parts/wire-leader-link.html（差し替えるときはこのファイルを直して実行する）
const WIRE_START = '<!-- ワイヤーリーダー start -->';
const WIRE_END = '<!-- ワイヤーリーダー end -->';
const WIRE_TARGETS = new Set([
  'bladeshotel', 'bladelance', 'bomberspin', 'corojigblade', 'corojigbladeslim', 'dragmetalbletch', 'dragmetalssblade',
  'edgeblade', 'jackeyemakimaki', 'jigparahighspin', 'metalmagicshore', 'metalmagicslim', 'metalmagictg', 'pboyblade', 'rayzaa',
  'samuraijigrspin', 'slowmark', 'tgstrike', 'zblade', 'bigbacker-eblade', 'bigbacker-eblade-w', 'tgbaitblj', 'bcustomheadbladejig',
].map(x => x + '.html'));
const wireLink = fs.readFileSync(path.join(__dirname, 'parts', 'wire-leader-link.html'), 'utf8').trim().split(/\r?\n/);
const wireBlock = nl => [
  `    ${WIRE_START}`,
  '    <h3>サワラ狙いならワイヤーリーダーも</h3>',
  '    <p>',
  '      サワラ・サゴシの鋭い歯でリーダーごとジグを切られないように、<span class="marker-green">ジグの前に30cm以内の短いワイヤーリーダーを付けておく</span>と安心です。カッターが少ない日は外して、状況に合わせて使い分けましょう。くわしくは<a href="sawara-bladejigging.html#wire">サワラのブレードジギング完全ガイド</a>で紹介しています。',
  '    </p>',
  '    <div class="affiliate-box">',
  ...wireLink.map(l => (l.trim() ? '      ' + l : l)),
  '    </div>',
  `    ${WIRE_END}`,
].join(nl);

let count = 0;
for (const f of fs.readdirSync(DIR).filter(x => x.endsWith('.html') && !EXCLUDE.has(x))) {
  const p = path.join(DIR, f);
  const before = fs.readFileSync(p, 'utf8');
  const nl = before.includes('\r\n') ? '\r\n' : '\n';
  let html = before;

  // 著者の枠（いったん消して、</main> の直前＝ページのいちばん下に置く）
  if (!html.includes('</main>')) continue;
  html = fillPopular(html, f, nl);
  const oldBox = new RegExp(`[ \\t]*${START}[\\s\\S]*?${END}(\\r?\\n)*`, 'g');
  html = html.replace(oldBox, '');
  const i = html.lastIndexOf('</main>');
  const head = html.slice(0, i).replace(/\s*$/, '');
  html = `${head}${nl}${nl}  ${authorBox(nl)}${nl}${html.slice(i)}`;

  // ワイヤーリーダーの欄（対象の記事だけ。いったん消して、ワンポイントの段落のあとに入れる）
  html = html.replace(new RegExp(`(\\r?\\n)*[ \\t]*${WIRE_START}[\\s\\S]*?${WIRE_END}`, 'g'), '');
  if (WIRE_TARGETS.has(f)) {
    const w = html.indexOf('<h3>ワンポイント</h3>');
    if (w >= 0) {
      const e = html.indexOf('</p>', w) + 4;
      html = html.slice(0, e) + nl + nl + wireBlock(nl) + html.slice(e);
    }
  }

  // 便利ツール（いったん消して、オススメ記事の下＝無ければ著者の枠の上に入れる）
  html = html.replace(new RegExp(`[ \\t]*${TOOLS_START}[\\s\\S]*?${TOOLS_END}(\\r?\\n)*`, 'g'), '');
  if (f !== 'lure_template.html') {
    const osuEnd = html.indexOf('<!-- オススメ記事 end -->');
    if (osuEnd >= 0) {
      const at = html.indexOf('\n', osuEnd) + 1;
      html = html.slice(0, at) + nl + '  ' + toolsBlock(f, nl) + nl + html.slice(at);
    } else {
      const at = html.lastIndexOf('\n', html.indexOf(START)) + 1;
      html = html.slice(0, at) + '  ' + toolsBlock(f, nl) + nl + nl + html.slice(at);
    }
  }

  // 定番記事（いったん消して、便利ツールのすぐ下に入れる）
  html = html.replace(new RegExp(`[ \\t]*${BASICS_START}[\\s\\S]*?${BASICS_END}(\\r?\\n)*`, 'g'), '');
  if (f !== 'lure_template.html' && html.includes(TOOLS_END)) {
    const at = html.indexOf('\n', html.indexOf(TOOLS_END)) + 1;
    html = html.slice(0, at) + nl + '  ' + basicsBlock(f, nl) + nl + html.slice(at);
  }

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

  // 改行は CRLF にそろえる（LF が混ざると、中身が同じでも git で「変更あり」に見えてしまうため）
  html = html.replace(/\r?\n/g, '\r\n');
  if (html !== before) { fs.writeFileSync(p, html); count++; }
}
console.log(`更新日と著者の枠を ${count} 記事に反映しました`);
