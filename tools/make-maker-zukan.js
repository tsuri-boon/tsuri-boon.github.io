// maker-zukan.html（メーカー図鑑）を生成する
//   使い方：リポジトリのルートで `node tools/make-maker-zukan.js`
//   - lure-zukan.html のカード（data-maker / data-category / 画像）から、メーカーごとの掲載ルアー数・魚種・代表画像を集計する
//   - メーカー紹介記事があるメーカーは MAKERS の article に記事ファイル名を書く（記事あり）
//   - 新しいメーカーがルアー図鑑に増えたら MAKERS に1行足す（足さなくても data-maker の値でカードは作られる）
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const zukan = fs.readFileSync(path.join(ROOT, 'lure-zukan.html'), 'utf8');

// key = lure-zukan.html の data-maker の値
const MAKERS = {
  'apia':             { name: 'APIA', kana: 'アピア', article: 'apia', img: 'punchline80.png' },
  'ima':              { name: 'ima', kana: 'アイマ', article: 'ima', img: 'komomo125.jpg' },
  'coreman':          { name: 'COREMAN', kana: 'コアマン', article: 'coreman', img: 'vj16.jpg' },
  'yamashita':        { name: 'YAMASHITA', kana: 'ヤマシタ', article: 'yamashita', img: 'egiohkdeep.jpg' },
  'pozidrive garage': { name: 'POZIDRIVE GARAGE', kana: 'ポジドライブガレージ', article: 'pozidrivegarage', img: 'zigzagbait80s.jpg' },
  'duo':              { name: 'DUO', kana: 'デュオ', article: 'duo', img: 'tideminnowslim178f.jpg' },
  'goto9':            { name: 'GOTO9', kana: 'ゴートゥーナイン', article: 'goto9', img: 'swarm80.jpg' },
  'blueblue':         { name: 'BlueBlue', kana: 'ブルーブルー', article: 'blueblue', img: 'blooowin140s.jpg' },
  'daiwa':            { name: 'DAIWA', kana: 'ダイワ' },
  'shimano':          { name: 'SHIMANO', kana: 'シマノ' },
  'megabass':         { name: 'Megabass', kana: 'メガバス' },
  'jackall':          { name: 'JACKALL', kana: 'ジャッカル' },
  'jackson':          { name: 'Jackson', kana: 'ジャクソン' },
  'タックルハウス':   { name: 'TACKLE HOUSE', kana: 'タックルハウス' },
  'maria':            { name: 'Maria', kana: 'マリア' },
  'bassday':          { name: 'Bassday', kana: 'バスデイ' },
  'レガーレ':         { name: 'LEGARE', kana: 'レガーレ' },
  'trefle creation':  { name: 'TREFLE CREATION', kana: 'トレフルクリエーション' },
  'major craft':      { name: 'Major Craft', kana: 'メジャークラフト' },
  'duel':             { name: 'DUEL', kana: 'デュエル' },
  'pop sea crew':     { name: 'POP SEA CREW', kana: 'ポップシークルー' },
  '邪道':             { name: '邪道', kana: 'ジャドウ' },
  'マングローブスタジオ': { name: 'Mangrove Studio', kana: 'マングローブスタジオ' },
  'ニコデザインオフィス': { name: 'ニコデザインオフィス', kana: 'ニコデザインオフィス' },
  'zeake':            { name: 'ZEAKE', kana: 'ジーク' },
  'smith':            { name: 'SMITH', kana: 'スミス' },
  'rapala':           { name: 'Rapala', kana: 'ラパラ' },
  'pickup':           { name: 'PICKUP', kana: 'ピックアップ' },
  'osp':              { name: 'O.S.P', kana: 'オーエスピー' },
  'north craft':      { name: 'NORTH CRAFT', kana: 'ノースクラフト' },
  'madotachi':        { name: 'Madotachi', kana: 'マドタチ' },
  'little-jack':      { name: 'LITTLE JACK', kana: 'リトルジャック' },
  'hayabusa':         { name: 'Hayabusa', kana: 'ハヤブサ' },
  'evergreen':        { name: 'EVERGREEN', kana: 'エバーグリーン' },
  'crazy ocean':      { name: 'CRAZY OCEAN', kana: 'クレイジーオーシャン' },
  'aquawave':         { name: 'Aqua Wave', kana: 'アクアウェーブ' },
  'adusta':           { name: 'ADUSTA', kana: 'アダスタ' },
  'mi3':              { name: 'Mi3', kana: '' },
  'gaea':             { name: 'Gaea', kana: 'ガイア' },
  'elements':         { name: 'ELEMENTS', kana: 'エレメンツ' },
  'palms':            { name: 'PALMS', kana: 'パームス' },
  'zipbaits':         { name: 'ZIPBAITS', kana: 'ジップベイツ' },
  'shout':            { name: 'SHOUT!', kana: 'シャウト' },
  // ルアー図鑑にまだルアーが無いメーカー（メーカー一覧に載っていたもの）
  'waterland':        { name: 'WATERLAND', kana: 'ウォーターランド' },
  'lucky craft':      { name: 'LUCKY CRAFT', kana: 'ラッキークラフト' },
};

const GENRES = ['シーバス', '青物', 'サワラ', 'エギング', 'フラットフィッシュ', 'バス', 'ライトゲーム', 'チニング', 'トラウト'];

// ---- ルアー図鑑から集計 ----
const stats = {};
const itemRe = /<li class="lure-item"([\s\S]*?)<\/li>/g;
let m;
while ((m = itemRe.exec(zukan))) {
  const block = m[1];
  const attr = name => ((block.match(new RegExp(`data-${name}="([^"]*)"`)) || [])[1] || '');
  const maker = attr('maker');
  if (!maker) continue;
  const s = stats[maker] || (stats[maker] = { count: 0, cats: new Set(), lures: [], img: '', display: '' });
  s.count += 1;
  s.cats.add(attr('category'));
  const kana = (block.match(/lure-card__kana">([^<]*)/) || [])[1];
  if (kana && s.lures.length < 3) s.lures.push(kana.trim());
  const img = (block.match(/<img src="\/image\/([^"]+)"/) || [])[1];
  if (img && !s.img && fs.existsSync(path.join(ROOT, 'image', img))) s.img = img;
  if (!s.display) s.display = ((block.match(/lure-card__maker">([^<]*)/) || [])[1] || '').trim();
}

// ---- メーカー記事から見出し・本拠地 ----
function articleInfo(file) {
  const h = fs.readFileSync(path.join(ROOT, 'article', file + '.html'), 'utf8');
  const sub = ((h.match(/<h1>[^<]*<small>([^<]*)<\/small>/) || [])[1] || '').trim();
  const loc = ((h.match(/<tr><th>本拠地<\/th><td>([^<]*)/) || [])[1] || '').replace(/（.*$/, '').trim();
  const genre = ((h.match(/<tr><th>得意ジャンル<\/th><td>([^<]*)/) || [])[1] || '').trim();
  return { sub, loc, genre };
}

const keys = Array.from(new Set([...Object.keys(MAKERS), ...Object.keys(stats)]));
const cards = keys.map(key => {
  const def = MAKERS[key] || {};
  const st = stats[key] || { count: 0, cats: new Set(), lures: [], img: '', display: '' };
  const name = def.name || st.display || key;
  const kana = def.kana || '';
  const cats = GENRES.filter(g => st.cats.has(g));
  const hasArticle = !!def.article && fs.existsSync(path.join(ROOT, 'article', def.article + '.html'));
  const info = hasArticle ? articleInfo(def.article) : null;
  let img = def.img && fs.existsSync(path.join(ROOT, 'image', def.img)) ? def.img : st.img;
  const desc = hasArticle
    ? info.sub
    : (st.lures.length ? `ルアー図鑑に掲載中：${st.lures.join('、')}${st.count > st.lures.length ? ' ほか' : ''}` : 'メーカー紹介記事・ルアー記事を準備中です。');
  const tags = [...cats];
  if (info && info.loc) tags.unshift(info.loc);
  if (st.count) tags.push(`掲載ルアー${st.count}件`);
  const href = hasArticle ? `/article/${def.article}.html` : (st.count ? `/lure-zukan.html?q=${encodeURIComponent(key)}` : '');
  return { key, name, kana, cats, hasArticle, img, desc, tags, href, count: st.count };
});

// 記事あり → ルアー件数の多い順 → 名前順
cards.sort((a, b) => (b.hasArticle - a.hasArticle) || (b.count - a.count) || a.kana.localeCompare(b.kana, 'ja'));

const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
function card(c) {
  const tag = c.href ? 'a' : 'div';
  const open = c.href ? `<a href="${c.href}" class="lure-card">` : `<div class="lure-card lure-card--coming">`;
  const imgHtml = c.img
    ? `<img src="/image/${c.img}" alt="${esc(c.name)}のルアー画像" class="lure-card__image">`
    : `<!-- 画像：${esc(c.name)} の画像をここに挿入 -->`;
  const badge = c.hasArticle
    ? '<span class="badge badge--ready">記事あり</span>'
    : '<span class="badge badge--coming">準備中</span>';
  return `
        <li class="lure-item"
            data-name="${esc(`${c.name} ${c.kana} ${c.key}`)}"
            data-maker="${esc(c.key)}"
            data-category="${esc(c.cats.join(' '))}"
            data-type="メーカー"
            data-status="${c.hasArticle ? 'ready' : 'coming'}">
          ${open}
            <div class="lure-card__header">
              <div class="lure-card__title-wrap">
                <h4 class="lure-card__name">${esc(c.name)}</h4>
                <p class="lure-card__kana">${esc(c.kana)}</p>
                <p class="lure-card__maker">${c.hasArticle ? 'メーカー紹介記事あり' : (c.count ? 'ルアー図鑑で見る' : '')}</p>
              </div>

              <div class="lure-card__image-wrap">
                ${imgHtml}
              </div>
            </div>

            <div class="lure-card__badges">
              ${badge}
            </div>

            <p class="lure-card__desc">
              ${esc(c.desc)}
            </p>

            <div class="lure-card__meta">
${c.tags.map(t => `              <span class="meta-tag">${esc(t)}</span>`).join('\n')}
            </div>
          </${tag}>
        </li>`;
}

const withArticle = cards.filter(c => c.hasArticle);
const others = cards.filter(c => !c.hasArticle);
const section = (title, group, list) => `
  <section class="lure-section">
    <h2 class="lure-section__title">${title}</h2>

    <section class="lure-group">
      <h3 class="lure-group__title">${group}</h3>
      <ul class="lure-list">
${list.map(card).join('\n')}
      </ul>
    </section>
  </section>
`;

const TITLE = 'メーカー図鑑｜ルアーメーカーの特徴・本拠地・人気ルアーを探せる!!随時更新中。｜tsuri-boon';
const DESC = 'ルアーメーカーを名前・得意な魚種から探せるメーカー図鑑です。メーカーの特徴・本拠地・プロスタッフ・人気ルアーをまとめた紹介記事を随時更新中。';

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

  <title>${TITLE}</title>
  <meta name="description" content="${DESC}">
  <meta name="robots" content="index, follow">
  <meta name="author" content="tsuri-boon開発チーム">
  <meta name="application-name" content="tsuri-boon">
  <link rel="canonical" href="https://tsuri-boon.github.io/maker-zukan.html">

  <link rel="icon" href="./image/tsuriboon_favicon.png" type="image/png">

  <meta property="og:title" content="${TITLE}">
  <meta property="og:description" content="${DESC}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="tsuri-boon">
  <meta property="og:url" content="https://tsuri-boon.github.io/maker-zukan.html">
  <meta property="og:image" content="https://tsuri-boon.github.io/image/tsuriboon_logo7.png">
  <meta property="og:locale" content="ja_JP">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="メーカー図鑑｜tsuri-boon">
  <meta name="twitter:description" content="${DESC}">
  <meta name="twitter:image" content="https://tsuri-boon.github.io/image/tsuriboon_logo7.png">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "メーカー図鑑",
    "description": "${DESC}",
    "url": "https://tsuri-boon.github.io/maker-zukan.html",
    "publisher": {
      "@type": "Organization",
      "name": "tsuri-boon"
    }
  }
  </script>

  <link rel="stylesheet" href="./css/style.css">
  <!-- Google AdSense -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9034047517729390"
       crossorigin="anonymous"></script>
</head>

<body>
<header>
  <a href="index.html" class="logo">
    <img src="./image/tsuriboon_logo7.png" alt="tsuri-boon ロゴ">
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

<main class="encyclopedia-page">
  <section class="encyclopedia-hero">
    <h1>メーカー図鑑</h1>
    <p class="page-description">
      ルアーメーカーを名前・得意な魚種から探せるメーカー図鑑です。メーカーの特徴・本拠地・人気ルアーをまとめた紹介記事を随時更新中。
    </p>
  </section>

  <section class="filter-box">
    <p class="filter-guide">メーカー名で検索、タグで絞り込みできます。魚種は、ルアー図鑑に掲載しているルアーから集計しています。</p>

    <div class="filter-box__search">
      <input
        type="text"
        id="makerSearch"
        placeholder="メーカー名で探す（カタカナ・英語どちらでも）"
        aria-label="メーカー検索"
      >
    </div>

    <div class="filter-group">
      <p class="filter-group__label">得意な魚種</p>
      <div class="filter-box__tags">
        <button type="button" class="filter-chip is-active" data-filter="all">すべて</button>
${GENRES.filter(g => cards.some(c => c.cats.includes(g))).map(g => `        <button type="button" class="filter-chip" data-filter="${g}">${g}</button>`).join('\n')}
      </div>
    </div>

    <div class="filter-group">
      <p class="filter-group__label">その他</p>
      <div class="filter-box__tags">
        <button type="button" class="filter-chip" data-filter="ready">紹介記事あり</button>
      </div>
    </div>

    <p id="resultCount" class="result-count">該当件数: 0件</p>
  </section>
${section('メーカー紹介記事あり', '釣具メーカー図鑑', withArticle)}${section('そのほかのメーカー', 'ルアー図鑑に掲載中のメーカー', others)}
  <p style="text-align:center;margin:24px 0;"><a href="lure-zukan.html" class="btn-recommend">ルアー図鑑はこちら</a></p>
</main>

<footer>
  <nav class="footer-nav">
    <a href="index.html">トップ</a>
    <a href="article/privacy.html">プライバシーポリシー</a>
    <a href="form.html">お問い合わせ</a>
    <a href="sitemap.html">サイトマップ</a>
  </nav>
</footer>

<script>
document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("makerSearch");
  const filterButtons = document.querySelectorAll(".filter-chip");
  const items = document.querySelectorAll(".lure-item");
  const groups = document.querySelectorAll(".lure-group");
  const sections = document.querySelectorAll(".lure-section");
  const resultCount = document.getElementById("resultCount");

  let activeFilter = "all";

  function matchesFilter(item, filter) {
    if (filter === "all") return true;
    if (filter === "ready") return (item.dataset.status || "").includes("ready");
    return (item.dataset.category || "").split(/\\s+/).includes(filter);
  }

  function matchesSearch(item, keyword) {
    if (!keyword) return true;
    const text = [item.dataset.name || "", item.dataset.maker || "", item.textContent || ""].join(" ").toLowerCase();
    return text.includes(keyword.toLowerCase());
  }

  function updateList() {
    const keyword = searchInput.value.trim();
    let visibleCount = 0;

    items.forEach(item => {
      const visible = matchesFilter(item, activeFilter) && matchesSearch(item, keyword);
      item.classList.toggle("is-hidden", !visible);
      if (visible) visibleCount += 1;
    });

    groups.forEach(group => {
      group.style.display = group.querySelectorAll(".lure-item:not(.is-hidden)").length ? "" : "none";
    });

    sections.forEach(section => {
      const hasVisibleGroup = Array.from(section.querySelectorAll(".lure-group")).some(g => g.style.display !== "none");
      section.style.display = hasVisibleGroup ? "" : "none";
    });

    resultCount.textContent = visibleCount === 0 ? "該当するメーカーはありません" : \`該当件数: \${visibleCount}件\`;
  }

  filterButtons.forEach(button => {
    button.addEventListener("click", function () {
      filterButtons.forEach(btn => btn.classList.remove("is-active"));
      this.classList.add("is-active");
      activeFilter = this.dataset.filter;
      updateList();
    });
  });

  searchInput.addEventListener("input", updateList);
  updateList();
});
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, 'maker-zukan.html'), html);
console.log(`maker-zukan.html を作成しました（記事あり ${withArticle.length} 社・そのほか ${others.length} 社）`);
const unknown = Object.keys(stats).filter(k => !MAKERS[k]);
if (unknown.length) console.log('MAKERS に未登録の data-maker：', unknown.join(', '));
