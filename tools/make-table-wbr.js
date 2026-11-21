// 記事の表（<table>）の文字に、文節の区切りで「ここで折り返してよい」目印（<wbr>）を入れる
//   node tools/make-table-wbr.js        （tools/make-byline.js からも呼ばれる）
// - スマホで「ミド｜ルレンジ」「自｜重」のように単語の途中で改行されないようにするため。
//   css/style.css で表のセルを word-break: keep-all にしているので、<wbr> の位置（と空白）でだけ折り返す。
// - 文節の区切りは BudouX（tools/lib/budoux-ja.js）で決める。「・」「／」「、」のあとと「（」の前でも折り返せるようにする。
// - 対象は article/ の記事の <table> の中の文字だけ（タグ・属性・&amp; などの文字参照には入れない）。
//   カレンダー（class="cal"）は数字だけなので対象外。
// - 何度実行しても同じ結果になる（入れる前に表の中の <wbr> をいったん外す）。
const fs = require('fs');
const path = require('path');
const { parseBoundaries } = require('./lib/budoux-ja');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'article');
const EXTRA_AFTER = new Set(['・', '／', '、', '/']);
const NO_BEFORE = new Set(['・', '／', '、', '。', '）', ')', '」', 'ー', '〜', '～']); // 行の頭に来ないようにする文字

// 1つのテキストに <wbr> を入れる（文字参照は1文字として扱う）
function addWbr(text) {
  if (!/[\u3040-\u30ff\u3400-\u9fff\uff00-\uffef]/.test(text)) return text; // 日本語が無ければそのまま
  const units = text.match(/&[#\w]+;|[\s\S]/gu) || [];
  const plain = units.map(u => (u.length > 1 && u.startsWith('&') ? '\uE000' : u)).join(''); // 文字参照は仮の1文字に
  // plain は units と1対1（サロゲートペアは1単位として扱う）ので、文字列の位置→単位の位置に直す
  const chars = [...plain];
  const str = chars.join('');
  const idx = []; // 文字列の位置 → 単位の番号
  let p = 0;
  chars.forEach((c, i) => { idx[p] = i; p += c.length; });
  idx[p] = chars.length;
  const cut = new Set(parseBoundaries(str).map(b => idx[b]).filter(b => b !== undefined));
  chars.forEach((c, i) => {
    if (i > 0 && EXTRA_AFTER.has(chars[i - 1])) cut.add(i);
    if (i > 0 && (c === '（' || c === '(')) cut.add(i);
  });
  let out = '';
  units.forEach((u, i) => {
    if (i > 0 && cut.has(i) && !/\s/.test(units[i - 1]) && !/\s/.test(u) && !NO_BEFORE.has(u)) out += '<wbr>';
    out += u;
  });
  return out;
}

function processTable(table) {
  const clean = table.replace(/<wbr>/g, '');
  // タグ（<...>）と文字に分けて、文字だけに <wbr> を入れる
  return clean.replace(/(<[^>]*>)|([^<]+)/g, (all, tag, text) => (tag ? tag : addWbr(text)));
}

function run() {
  let changed = 0;
  for (const f of fs.readdirSync(DIR).filter(f => f.endsWith('.html'))) {
    const file = path.join(DIR, f);
    const s = fs.readFileSync(file, 'utf8');
    const t = s.replace(/<table\b[^>]*>[\s\S]*?<\/table>/g, tbl => (/^<table[^>]*class="cal"/.test(tbl) ? tbl : processTable(tbl)));
    if (t !== s) { fs.writeFileSync(file, t); changed++; }
  }
  console.log(`表の折り返し位置（<wbr>）を ${changed} 記事に反映しました`);
}

if (require.main === module) run();
module.exports = { run, addWbr };
