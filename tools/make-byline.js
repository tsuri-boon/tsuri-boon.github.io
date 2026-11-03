// 各記事の本文の後ろに「著者：こすけ（更新日：〇年〇月〇日）」の1行を入れる
//   使い方：リポジトリのルートで `node tools/make-byline.js`
//   - 更新日は構造化データの dateModified（無ければ datePublished）。どちらも無ければ著者名だけ
//   - 置き場所：個別記事・まとめ記事は </article> の直後、メーカー記事などはオススメ記事の直前
//   - 記事内の <!-- 著者 start --> 〜 <!-- 著者 end --> の範囲だけを書き換える。手で編集しない
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'article');
const START = '<!-- 著者 start -->';
const END = '<!-- 著者 end -->';
const EXCLUDE = new Set(['privacy.html', 'shop-links.html']);

const dateOf = html => {
  const m = html.match(/"dateModified"\s*:\s*"(\d{4})-(\d{2})-(\d{2})/) || html.match(/"datePublished"\s*:\s*"(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}年${Number(m[2])}月${Number(m[3])}日` : '';
};

let count = 0;
for (const f of fs.readdirSync(DIR).filter(x => x.endsWith('.html') && !EXCLUDE.has(x))) {
  const p = path.join(DIR, f);
  const before = fs.readFileSync(p, 'utf8');
  const nl = before.includes('\r\n') ? '\r\n' : '\n';
  const date = dateOf(before);
  const block = `${START}${nl}  <p class="article-byline">著者：<a href="../tsuri-boon.html#author">こすけ</a>${date ? `（更新日：${date}）` : ''}</p>${nl}  ${END}`;
  let html = before;
  const old = new RegExp(`${START}[\\s\\S]*?${END}`);
  if (old.test(html)) {
    html = html.replace(old, () => block);
  } else if (html.includes('class="lure-article"') && html.includes('</article>')) {
    const i = html.lastIndexOf('</article>') + '</article>'.length;
    html = `${html.slice(0, i)}${nl}${nl}  ${block}${html.slice(i)}`;
  } else if (html.includes('<!-- オススメ記事 start -->')) {
    html = html.replace('<!-- オススメ記事 start -->', () => `${block}${nl}${nl}  <!-- オススメ記事 start -->`);
  } else {
    continue;
  }
  if (html !== before) { fs.writeFileSync(p, html); count++; }
}
console.log(`著者の行を ${count} 記事に反映しました`);
