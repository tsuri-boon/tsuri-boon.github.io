// 新着記事の欄を作る
//   使い方：リポジトリのルートで node tools/make-new-articles.js（make-osusume.js のあと、make-byline.js の前）
//   - 新着の一覧は data/new-articles.json に書き出す。各記事の新着欄は、ページ内の js/new-articles.js が
//     この JSON を読んで表示するので、記事を足しても書き換わるのは JSON とトップページだけ。
//   - 各記事には「オススメ記事はこちら」のすぐ上に、空の枠（<!-- 新着記事 start --> 〜 end）を一度だけ入れる。
//     枠の中身は固定なので、2回目以降は記事のHTMLを書き換えない。
//   - トップページ（index.html）には、おすすめ記事の上に新着8本を直接書き込む（<!-- 新着記事 start --> 〜 end）。
//   - 新しさは構造化データの datePublished（同じ日は初めてコミットした時刻）で決める。
//     対象は article/ の記事で、make-sitemap.js の EXCLUDE・noindex を除き、メイン画像（og:image）があるもの。
//   - ジャンルがかぶらないように、ルアー（lure-zukan）・ロッド（rod-zukan）・アクセサリー（accessory-zukan）・
//     その他（まとめ・メーカー記事など）から2本ずつ、新しい順に選ぶ。並びは「各ジャンルの1本目 → 2本目」の順で、
//     足りないジャンルがあれば残りの新しい記事で埋める。記事側（js/new-articles.js）も同じ選び方をする。
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ART = path.join(ROOT, 'article');
const SHOW = 8;           // 表示する本数
const PER = 2;            // 1ジャンルから表示する本数
const KEEP_PER = PER + 1;  // 記事自身を外しても2本になるように、ジャンルごとに1本多く持つ
const GENRES = ['ルアー', 'ロッド', 'アクセサリー', 'その他'];
const START = '<!-- 新着記事 start -->';
const END = '<!-- 新着記事 end -->';
const OSUSUME = '<!-- オススメ記事 start -->';

const strip = s => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

// article/ の記事のうち、サイトマップに載せるものだけ（make-sitemap.js の EXCLUDE と noindex のページは入らない）。
// sitemap.xml を読むと、作り直す前に実行したとき新しい記事が漏れるので、記事のフォルダから直接集める
const exSrc = fs.readFileSync(path.join(__dirname, 'make-sitemap.js'), 'utf8');
const EXCLUDE = new Set([...(exSrc.match(/const EXCLUDE = new Set\(\[([\s\S]*?)\]\)/) || ['', ''])[1].matchAll(/'article\/([^']+)\.html'/g)].map(m => m[1]));
const files = fs.readdirSync(ART).filter(x => x.endsWith('.html')).map(x => x.replace(/\.html$/, ''))
  .filter(f => !EXCLUDE.has(f) && !/<meta name="robots" content="[^"]*noindex/.test(fs.readFileSync(path.join(ART, f + '.html'), 'utf8')));

// 初めてコミットした時刻（同じ日の並び替え用。未コミットの記事はいちばん新しい扱い）
const born = {};
let t = 0;
for (const line of execSync('git log --diff-filter=A --name-only --format=@%ct -- article', { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 }).split('\n')) {
  if (line.startsWith('@')) t = +line.slice(1);
  else if (line.startsWith('article/')) { const f = line.slice(8).replace(/\.html$/, ''); if (!(f in born)) born[f] = t; }
}

// ジャンル：どの図鑑にリンクがあるか
const linksIn = z => new Set([...fs.readFileSync(path.join(ROOT, z), 'utf8').matchAll(/href="\/?article\/([^"#?]+)\.html"/g)].map(m => m[1]));
const LURE = linksIn('lure-zukan.html'), ROD = linksIn('rod-zukan.html'), ACC = linksIn('accessory-zukan.html');
const genreOf = f => LURE.has(f) ? 'ルアー' : ROD.has(f) ? 'ロッド' : ACC.has(f) ? 'アクセサリー' : 'その他';

// ジャンルごとに2本ずつ選ぶ（js/new-articles.js と同じ選び方）
function pick(items, self) {
  const pool = items.filter(x => x.file !== self);
  const rows = [];
  for (let i = 0; i < PER; i++) for (const g of GENRES) {
    const x = pool.filter(y => y.genre === g)[i];
    if (x) rows.push(x);
  }
  for (const x of pool) { if (rows.length >= SHOW) break; if (!rows.includes(x)) rows.push(x); }
  return rows.slice(0, SHOW);
}

const list = [];
for (const f of files) {
  const p = path.join(ART, f + '.html');
  if (!fs.existsSync(p)) continue;
  const h = fs.readFileSync(p, 'utf8');
  // 公開日：datePublished。無いページ（メーカー記事など）は初めてコミットした日（日本時間）、未コミットなら今日
  const jst = ms => new Date(ms + 9 * 3600 * 1000).toISOString().slice(0, 10);
  const date = (h.match(/"datePublished":\s*"([0-9-]+)"/) || [])[1] || (born[f] ? jst(born[f] * 1000) : jst(Date.now()));
  const img = (h.match(/property="og:image" content="[^"]*\/image\/([^"]+)"/) || [])[1];
  if (!date || !img || !fs.existsSync(path.join(ROOT, 'image', img))) continue;
  const h1 = (h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '';
  const name = strip(h1.split(/<br\s*\/?>/)[0]) || f;
  // 説明：タイトルから「｜tsuri-boon」と先頭の【名前】を外したもの
  const title = strip((h.match(/<title>([^<]*)<\/title>/) || [])[1] || '').replace(/\s*｜\s*tsuri-boon\s*$/, '');
  const copy = title.replace(/^【[^】]*】\s*/, '') || title;
  list.push({ file: f, name, copy, img, date, genre: genreOf(f), t: born[f] ?? Infinity });
}
list.sort((a, b) => b.date.localeCompare(a.date) || b.t - a.t || a.file.localeCompare(b.file));
// JSON には、各ジャンルの新しい3本と、全体の新しい9本（足りないジャンルを埋める用）を入れる
const keep = new Set([...GENRES.flatMap(g => list.filter(x => x.genre === g).slice(0, KEEP_PER)), ...list.slice(0, SHOW + 1)].map(x => x.file));
const latest = list.filter(x => keep.has(x.file)).map(({ file, name, copy, img, date, genre }) => ({ file, name, copy, img, date, genre }));
const shown = pick(latest, null);

// ---- data/new-articles.json ----
const jsonPath = path.join(ROOT, 'data', 'new-articles.json');
const json = JSON.stringify(latest, null, 1) + '\n';
const oldJson = fs.existsSync(jsonPath) ? fs.readFileSync(jsonPath, 'utf8') : '';
if (json !== oldJson) fs.writeFileSync(jsonPath, json);

// ---- 各記事に空の枠を入れる（一度だけ） ----
const SLOT = [
  START,
  '  <div class="osusume shinchaku" id="shinchaku" hidden>',
  '    <p class="osusume-title">新着記事はこちら</p>',
  '    <div class="osusume-cards"></div>',
  '  </div>',
  '  <script src="../js/new-articles.js" defer></script>',
  '  ' + END,
];
let slotted = 0;
for (const f of fs.readdirSync(ART).filter(x => x.endsWith('.html'))) {
  const p = path.join(ART, f);
  const h = fs.readFileSync(p, 'utf8');
  if (h.includes(START) || !h.includes(OSUSUME)) continue;
  const nl = h.includes('\r\n') ? '\r\n' : '\n';
  const i = h.indexOf(OSUSUME);
  fs.writeFileSync(p, h.slice(0, i) + SLOT.join(nl) + nl + nl + '  ' + h.slice(i));
  slotted++;
}

// ---- トップページに直接書き込む ----
const top = path.join(ROOT, 'index.html');
let ih = fs.readFileSync(top, 'utf8');
const cards = shown.map(x =>
  `<a class="osusume-card" href="article/${x.file}.html"><span class="osusume-thumb"><img src="image/${esc(x.img)}" alt="${esc(x.name)}" loading="lazy"></span><span class="osusume-name">${esc(x.name)}</span><span class="osusume-copy">${esc(x.copy)}</span></a>`).join('');
// トップページは css/style.css を読まないので、カードの見た目をこの欄の中だけに書く
const CSS = '#new-articles{background:transparent}#new-articles>.wrap{border-top:2px dashed #7ca4b5;padding-top:36px}'
  + '#new-articles .osusume-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}'
  + '#new-articles .osusume-card{display:flex;flex-direction:column;background:#fff;border:2px solid #143246;border-radius:14px;overflow:hidden;color:#143246;transition:.2s}'
  + '#new-articles .osusume-card:hover{transform:translateY(-3px)}'
  + '#new-articles .osusume-thumb{display:flex;align-items:center;justify-content:center;aspect-ratio:1/1;background:#f7f9fb;padding:8px}'
  + '#new-articles .osusume-thumb img{max-width:100%;max-height:100%;object-fit:contain;display:block}'
  + '#new-articles .osusume-name{font-size:14px;font-weight:800;line-height:1.4;padding:8px 10px 2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}'
  + '#new-articles .osusume-copy{font-size:11px;color:#557582;line-height:1.6;margin:0 10px 10px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}'
  + '@media(max-width:760px){#new-articles .osusume-cards{grid-template-columns:repeat(2,1fr);gap:10px}#new-articles .osusume-name{font-size:13px}}';
const block = `${START}<style>${CSS}</style><section class="new-articles-section" id="new-articles"><div class="wrap"><div class="section-head"><div><div class="kicker">NEW</div><h2>新着記事</h2></div><p>新しく追加した記事をチェック。</p></div><div class="osusume-cards">${cards}</div></div></section>${END}`;
const a = ih.indexOf(START), b = ih.indexOf(END);
if (a >= 0 && b > a) ih = ih.slice(0, a) + block + ih.slice(b + END.length);
else {
  const anchor = '<section class="articles-section" id="recommended-articles">';
  if (!ih.includes(anchor)) throw new Error('index.html におすすめ記事の欄が見つかりません');
  ih = ih.replace(anchor, block + '\n' + anchor);
}
const topChanged = ih !== fs.readFileSync(top, 'utf8');
if (topChanged) fs.writeFileSync(top, ih);

console.log(`新着記事：${shown.map(x => `${x.file}（${x.genre}）`).join(', ')}`);
console.log(`data/new-articles.json ${json === oldJson ? 'は変更なし' : 'を更新'}／枠を入れた記事 ${slotted}／トップページ${topChanged ? "を更新" : "は変更なし"}`);
