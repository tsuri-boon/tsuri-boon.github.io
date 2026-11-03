// 各記事に「更新日」の行（H1の下）と「著者プロフィールの枠」（本文の後ろ）を入れる
//   使い方：リポジトリのルートで `node tools/make-byline.js`
//   - 更新日は構造化データの dateModified（無ければ datePublished）。どちらも無ければ更新日の行は出さない
//   - 著者の枠の置き場所：個別記事・まとめ記事は </article> の直後、メーカー記事などはオススメ記事の直前
//   - 記事内の <!-- 更新日 start --> 〜 end と <!-- 著者 start --> 〜 end の範囲だけを書き換える。手で編集しない
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

  // 著者の枠
  const box = authorBox(nl);
  const oldBox = new RegExp(`${START}[\\s\\S]*?${END}`);
  if (oldBox.test(html)) {
    html = html.replace(oldBox, () => box);
  } else if (html.includes('class="lure-article"') && html.includes('</article>')) {
    const i = html.lastIndexOf('</article>') + '</article>'.length;
    html = `${html.slice(0, i)}${nl}${nl}  ${box}${html.slice(i)}`;
  } else if (html.includes('<!-- オススメ記事 start -->')) {
    html = html.replace('<!-- オススメ記事 start -->', () => `${box}${nl}${nl}  <!-- オススメ記事 start -->`);
  } else {
    continue;
  }

  // 更新日
  const date = dateOf(html);
  const oldDate = new RegExp(`[ \\t]*${DATE_START}[\\s\\S]*?${DATE_END}\\r?\\n?`);
  html = html.replace(oldDate, '');
  if (date && html.includes('</h1>')) {
    const line = `    ${DATE_START}<p class="article-date">更新日：${date}</p>${DATE_END}${nl}`;
    html = html.replace(/<\/h1>\r?\n?/, m => `</h1>${nl}${line}`);
  }

  if (html !== before) { fs.writeFileSync(p, html); count++; }
}
console.log(`更新日と著者の枠を ${count} 記事に反映しました`);
