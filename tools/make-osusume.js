// 各記事の「人気記事」の下に「オススメ記事はこちら」（関連記事リンク 10 本）を自動生成する
//   使い方：リポジトリのルートで `node tools/make-osusume.js`（全記事）
//           `node tools/make-osusume.js overdrive107s apia` のようにファイル名を渡すと、その記事だけ書き換える
//   - ルアー記事：同じメーカーの記事 → 同じメーカーのルアー → 同じジャンルのルアー → 同じ魚種のルアー → 関連まとめ記事（計 12 本）
//   - カードは正方形の画像の下に「名前」と記事タイトル（先頭の【名前】と「｜tsuri-boon」を外したもの）
//   - メーカー記事：そのメーカーのルアー → ほかのメーカー記事
//   - まとめ・ロッド記事：記事内で紹介しているルアーのメーカー・魚種から選ぶ
//   - 「似ているルアー」や本文ですでにリンクしている記事、自分自身は除く
//   - 記事内の <!-- オススメ記事 start --> 〜 <!-- オススメ記事 end --> の範囲だけを書き換える（無ければ追加する）
//   - 記事を追加したら、コミット前にこのスクリプトを実行し直す
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ART = path.join(ROOT, 'article');
const COUNT = 12;
const EXCLUDE = new Set(['privacy', 'lure_template']);
const SHORT = { 'フラットフィッシュ': 'フラット', 'ライトゲーム': 'ライト' }; // ラベルが長いものは短くする
const START = '<!-- オススメ記事 start -->';
const END = '<!-- オススメ記事 end -->';

// メーカー記事 → lure-zukan.html の data-maker
const MAKER_PAGES = {
  apia: 'apia', blueblue: 'blueblue', coreman: 'coreman', duo: 'duo',
  goto9: 'goto9', ima: 'ima', pozidrivegarage: 'pozidrive garage', yamashita: 'yamashita',
  jackson: 'jackson', highrad: 'highrad',
  legare: 'レガーレ', breaden: 'breaden', popseacrew: 'pop sea crew', jackall: 'jackall', dstyle: 'dstyle',
};
// 本文からメーカーを見つけるための表記（data-maker → 表記の候補）
const MAKER_WORDS = {
  apia: ['アピア', 'APIA'], blueblue: ['ブルーブルー', 'BlueBlue', 'Blue Blue'], coreman: ['コアマン', 'COREMAN'],
  duo: ['デュオ', 'DUO'], goto9: ['GOTO9', 'ゴートゥーナイン'], ima: ['アイマ', 'ima'], 'pozidrive garage': ['ポジドライブガレージ', 'POZIDRIVE'],
  yamashita: ['ヤマシタ', 'YAMASHITA'], jackson: ['ジャクソン', 'Jackson'], highrad: ['ハイラッド', 'HIGH RAD'], daiwa: ['ダイワ', 'DAIWA'], shimano: ['シマノ', 'SHIMANO'], megabass: ['メガバス', 'Megabass'],
  'レガーレ': ['レガーレ', 'LEGARE'], breaden: ['ブリーデン', 'BREADEN'], 'pop sea crew': ['ポップシークルー', 'POP SEA CREW'], jackall: ['ジャッカル', 'JACKALL'], dstyle: ['DSTYLE', 'ディスタイル'],
};
// タイトルから魚種を見つけるための語（図鑑の魚種 → 語）
const CAT_WORDS = {
  'シーバス': ['シーバス'], '青物': ['青物', 'ショアジギ', 'ブリ', 'ヒラマサ'], 'サワラ': ['サワラ', 'サゴシ'],
  'エギング': ['エギ', 'アオリイカ', 'イカ', 'タコ'], 'フラットフィッシュ': ['ヒラメ', 'マゴチ', 'フラット'],
  'チニング': ['チヌ', 'チニング', 'クロダイ'], 'ライトゲーム': ['アジ', 'メバル', 'ライトゲーム'], 'バス': ['バス釣り', 'ブラックバス'],
};

const read = f => fs.readFileSync(path.join(ART, f + '.html'), 'utf8');
const strip = s => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
// 決まった順番でばらけさせるための簡単なハッシュ
const hash = s => { let h = 2166136261; for (const c of s) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

// カードの説明文：記事の <title> から「｜tsuri-boon」と先頭の【名前（英語表記）】を外したもの
const pageTitle = f => {
  const t = strip(((read(f).match(/<title>([^<]*)<\/title>/) || [])[1] || '').replace(/\s*｜\s*tsuri-boon\s*$/, ''));
  const rest = t.replace(/^【[^】]*】\s*/, '');
  return rest || t;
};

// ---- ルアー図鑑から個別ルアー記事の情報を集める ----
const zukan = fs.readFileSync(path.join(ROOT, 'lure-zukan.html'), 'utf8');
const lures = {};
for (const m of zukan.matchAll(/<li class="lure-item"([\s\S]*?)<\/li>/g)) {
  const b = m[1];
  const file = (b.match(/href="\/article\/([^"]+)\.html"/) || [])[1];
  if (!file || !fs.existsSync(path.join(ART, file + '.html'))) continue;
  const at = k => (b.match(new RegExp(`data-${k}="([^"]*)"`)) || [])[1] || '';
  const mm = (b.match(/meta-tag">\s*(\d+)\s*mm/) || [])[1];
  lures[file] = {
    file, kind: 'lure', maker: at('maker'), cat: at('category'), type: at('type'), mm: mm ? +mm : null,
    title: strip((b.match(/lure-card__kana">([^<]*)/) || [])[1] || file),
    makerDisp: strip((b.match(/lure-card__maker">([^<]*)/) || [])[1] || ''),
    img: ((b.match(/<img src="\/image\/([^"]+)"/) || [])[1]) || '',
  };
  lures[file].copy = pageTitle(file);
}

// ---- それ以外の記事（メーカー・まとめ・ロッドなど） ----
const others = {};
for (const f of fs.readdirSync(ART).filter(f => f.endsWith('.html')).map(f => f.replace(/\.html$/, ''))) {
  if (lures[f] || EXCLUDE.has(f)) continue;
  const h = read(f);
  const h1 = (h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '';
  let title = strip(h1.split(/<br\s*\/?>/)[0]) || strip((h.match(/<title>([^<|｜]*)/) || [])[1] || f);
  let copy = '';
  if (MAKER_PAGES[f] && title.includes('）')) { // メーカー記事は社名まで。後ろのキャッチコピーを一文に使う
    const tag = title.slice(title.indexOf('）') + 1).trim();
    title = title.slice(0, title.indexOf('）') + 1);
    if (tag) copy = `${title}は、${tag}。`;
  }
  if (!copy) copy = strip((h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '').split('。')[0] + '。';
  const og = (h.match(/property="og:image" content="[^"]*\/image\/([^"]+)"/) || [])[1];
  const img = og && fs.existsSync(path.join(ROOT, 'image', og)) ? og : 'tsuriboon_logo7.png';
  const ttl0 = (h.match(/<title>([^<]*)/) || [])[1] || '';
  const kind = MAKER_PAGES[f] ? 'maker'
    : /ロッド|リール|ライフジャケット|ベスト|ウェーディング|グローブ|ランディング|シャフト|ルアーケース/.test(ttl0) ? 'gear' : 'other';
  const linked = [...new Set([...h.matchAll(/href="(?:\.\.\/article\/|\/article\/)?([a-zA-Z0-9_-]+)\.html"/g)].map(x => x[1]))];
  const ttl = (h.match(/<title>([^<]*)/) || [])[1] || '';
  const cats = Object.keys(CAT_WORDS).filter(c => CAT_WORDS[c].some(w => ttl.includes(w)));
  const makers = kind === 'maker' ? [MAKER_PAGES[f]] : Object.keys(MAKER_WORDS).filter(k => MAKER_WORDS[k].some(w => ttl.includes(w)));
  copy = pageTitle(f);
  others[f] = { file: f, kind, title, img, cats, makers, linked, copy };
}
const makerPageOf = {}; for (const [p, k] of Object.entries(MAKER_PAGES)) if (others[p]) makerPageOf[k] = p;

// ---- 記事ごとに 12 本選ぶ ----
function pick(self, h) {
  const used = new Set([self]);
  for (const x of h.matchAll(/href="(?:\.\.\/article\/|\/article\/)?([a-zA-Z0-9_-]+)\.html"/g)) used.add(x[1]);
  // 既存のオススメ欄のリンクは「使用済み」に数えない
  const s = h.indexOf(START), e = h.indexOf(END);
  if (s >= 0 && e > s) { const again = new Set([self]); const body = h.slice(0, s) + h.slice(e); for (const x of body.matchAll(/href="(?:\.\.\/article\/|\/article\/)?([a-zA-Z0-9_-]+)\.html"/g)) again.add(x[1]); used.clear(); again.forEach(v => used.add(v)); }
  const out = [];
  const add = (list, n, label) => {
    const sorted = list.filter(x => x && !used.has(x.file) && x.img && fs.existsSync(path.join(ROOT, 'image', x.img))); // 画像が無い記事は出さない
    for (const x of sorted.slice(0, n)) { used.add(x.file); const lb = typeof label === 'function' ? label(x) : label; out.push({ ...x, label: SHORT[lb] || lb }); }
  };
  const spread = (arr, key) => arr.slice().sort((a, b) => hash(key + a.file) - hash(key + b.file));
  const L = Object.values(lures);
  const me = lures[self] || others[self];

  if (me.kind === 'lure') {
    // 同じ魚種を優先し、その中で全長が近い順（全長が無いものは後ろ）
    const dist = x => (me.mm && x.mm ? Math.abs(x.mm - me.mm) : 999);
    const near = arr => arr.slice().sort((a, b) => (a.cat !== me.cat) - (b.cat !== me.cat) || dist(a) - dist(b) || hash(self + a.file) - hash(self + b.file));
    add([others[makerPageOf[me.maker]]], 1, 'メーカー');
    add(spread(L.filter(x => x.maker === me.maker), self), 3, '同じメーカー');
    add(near(L.filter(x => x.type === me.type)), 4, '同じジャンル');
    add(spread(L.filter(x => x.cat === me.cat && x.type !== me.type), self), 3, me.cat);
    add(spread(Object.values(others).filter(o => o.kind === 'other' && o.cats.includes(me.cat)), self), 1, 'まとめ');
    add(spread(L.filter(x => x.cat === me.cat), self), COUNT - out.length, me.cat);
    // 記事の少ない魚種は、魚種をまたいだ同じジャンル → シーバスの記事で 12 本まで埋める
    add(near(L.filter(x => x.type === me.type)), COUNT - out.length, '同じジャンル');
    add(spread(L.filter(x => x.cat === 'シーバス'), self + 'base'), COUNT - out.length, 'シーバス');
  } else {
    // タイトルからメーカー・魚種を取る。分からなければ、本文で一番多く紹介しているものを 1 つだけ使う
    const inPage = me.linked.map(f => lures[f]).filter(Boolean);
    const top = key => { const c = {}; for (const x of inPage) c[x[key]] = (c[x[key]] || 0) + 1; const k = Object.keys(c).sort((a, b) => c[b] - c[a])[0]; return k ? [k] : []; };
    const makers = new Set(me.makers.length ? me.makers : top('maker'));
    const cats = new Set(me.cats.length ? me.cats : top('cat'));
    const makerName = k => (L.find(x => x.maker === k) || {}).makerDisp || k;
    if (me.kind === 'maker') {
      add(spread(L.filter(x => x.maker === me.makers[0]), self), 10, '同じメーカー');
      add(spread(Object.values(others).filter(o => o.kind === 'maker'), self), 2, 'メーカー');
    } else {
      add(spread(Object.values(makerPageOf).map(p => others[p]).filter(o => [...makers].some(k => makerPageOf[k] === o.file)), self), 2, 'メーカー');
      add(spread(L.filter(x => makers.has(x.maker)), self), 5, x => makerName(x.maker));
      add(spread(Object.values(others).filter(o => o.kind === 'gear' && o.makers.some(k => makers.has(k))), self), me.kind === 'gear' ? 2 : 1, 'ロッド・グッズ');
      add(spread(L.filter(x => cats.has(x.cat)), self), 3, [...cats][0] || 'ルアー');
      add(spread(Object.values(others).filter(o => o.kind === 'other' && o.cats.some(c => cats.has(c))), self), 1, 'まとめ');
    }
    // 足りない分は同じ魚種のルアーで埋め、魚種が分からない記事はシーバスの記事から
    add(spread(L.filter(x => cats.has(x.cat)), self + 'fill'), COUNT - out.length, x => x.cat);
    add(spread(L.filter(x => x.cat === 'シーバス'), self + 'base'), COUNT - out.length, 'シーバス');
  }
  return out.slice(0, COUNT);
}

function block(items) {
  const esc = t => t.replace(/"/g, '&quot;');
  const cards = items.map(x => `      <a href="${x.file}.html" class="osusume-card">
        <span class="osusume-thumb"><img src="../image/${x.img}" alt="${esc(x.title)}" loading="lazy"></span>
        <span class="osusume-name">${x.title}</span>
        <span class="osusume-copy">${x.copy}</span>
      </a>`).join('\n');
  return `${START}
  <div class="osusume">
    <p class="osusume-title">オススメ記事はこちら</p>
    <div class="osusume-cards">
${cards}
    </div>
  </div>
  ${END}`;
}

const only = process.argv.slice(2);
const targets = (only.length ? only : [...Object.keys(lures), ...Object.keys(others)]).filter(f => (lures[f] || others[f]) && !EXCLUDE.has(f));
// Windows でエディタやウイルス対策ソフトがファイルを一瞬つかんでいると書き込みが失敗するので、少し待ってやり直す
const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const writeWithRetry = (file, text) => {
  for (let i = 1; ; i++) {
    try { fs.writeFileSync(file, text); return; } catch (err) {
      if (i >= 5) throw err;
      sleep(200 * i);
    }
  }
};
let n = 0, changed = 0;
for (const f of targets) {
  let h = read(f);
  const before = h;
  const items = pick(f, h);
  const b = block(items);
  const s = h.indexOf(START), e = h.indexOf(END);
  if (s >= 0 && e > s) h = h.slice(0, s) + b + h.slice(e + END.length);
  else {
    // 「人気記事はこちら」の段落を囲む div の後ろ。無ければ </main> の直前
    const p = h.indexOf('<p>人気記事はこちら</p>');
    let at = -1;
    if (p >= 0) {
      const cards = h.indexOf('<div class="article-cards">', p);
      let depth = 0, i = cards;
      const re = /<div[\s>]|<\/div>/g; re.lastIndex = cards;
      for (let m; (m = re.exec(h));) { depth += m[0] === '</div>' ? -1 : 1; if (depth === 0) { i = re.lastIndex; break; } }
      const close = h.indexOf('</div>', i); // 人気記事を囲む外側の div
      at = close + '</div>'.length;
    } else at = h.lastIndexOf('</main>');
    h = h.slice(0, at) + '\n\n  ' + b + '\n' + h.slice(at);
  }
  // 中身が変わらない記事は書き込まない（書き込み回数を減らしてロックのエラーを避ける）
  if (h !== before) { writeWithRetry(path.join(ART, f + '.html'), h); changed++; }
  n++;
}
console.log(`オススメ記事を ${n} 記事に反映しました（書き換え ${changed} 記事）`);
