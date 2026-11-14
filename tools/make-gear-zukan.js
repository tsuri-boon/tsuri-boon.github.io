// ロッド図鑑（rod-zukan.html）とアクセサリー図鑑（accessory-zukan.html）を作る
//   node tools/make-gear-zukan.js
// - カードの名前（h1）・メーカー（<title> の「】◯◯の」）・画像（og:image）は各記事から自動で取る。説明は desc に書く。
// - 新しくロッド・アクセサリーの記事を作ったら、下の ROD / ACCESSORY に1行足して実行する。
//   パンくず（tools/make-byline.js）は、このページのカードの分類（data-category）を読んで
//   「トップ › ロッド図鑑 › 釣り方 › 記事名」「トップ › アクセサリー図鑑 › 分類 › 記事名」にする。
// - ロッド図鑑の絞り込み：ターゲット魚種・長さ（スライダー）・ルアー重量（スライダー）・継数・仕舞寸法・新作。
//   値は記事のスペックから書き写す。記事に無い値は null（その条件で絞り込むと表示されない）。シリーズの記事は最小〜最大。
// - ページの head・フッターは lure-zukan.html から写す。アクセサリー図鑑の絞り込みは lure-zukan.html と同じ script。
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');

// ロッド：{ f: 記事, sec: 釣り方（見出し・パンくず）, pack: パックロッドか, desc, tags,
//          fish: ターゲット魚種, len: [最短, 最長]（フィート。7ft6in = 7.5）, lure: [最小, 最大]（g）,
//          pcs: 継数の一覧, packed: [最短, 最長]（仕舞寸法 cm）, year: 発売年 }
// ルアー重量の「MAX◯g」だけのものは最小を 0 にする。エギの号数・バスの oz は g に直した目安。
const ROD_FISH = ['シーバス', '青物', 'チヌ', 'メバル・アジ', 'イカ', 'ロックフィッシュ', 'バス', 'トラウト'];
const ROD = {
  page: 'rod-zukan.html',
  title: 'ロッド図鑑',
  lead: 'ターゲット魚種・長さ・ルアー重量・継数・仕舞寸法から、気になるロッドを探せるロッド図鑑です。電車や旅行にも持って行けるパックロッドも紹介。随時更新中。',
  sections: ['シーバス', 'ライトゲーム', 'ショアジギング・ロックショア', 'エギング', 'オフショア', 'バス', 'トラウト', 'マルチ'],
  items: [
    { f: 'empinado91s', sec: 'シーバス', pack: true, desc: '9.1ftと10.8ftに組み替えられる磯のヒラスズキ用パックロッド。仕舞寸法600mm。', fish: ['シーバス', '青物'], len: [9 + 1 / 12, 10 + 8 / 12], lure: [12, 56], pcs: [5, 6], packed: [60, 60], tags: ['ヒラスズキ', '可変レングス'] },
    { f: 'currentes82s', sec: 'シーバス', pack: true, desc: '8.2ftと9.8ftに組み替えられる2in1のシーバス用パックロッド。仕舞寸法550mm。', fish: ['シーバス', 'トラウト'], len: [8 + 2 / 12, 9 + 8 / 12], lure: [8, 35], pcs: [5, 6], packed: [55, 55], tags: ['可変レングス'] },
    { f: 'foojinzexiv', sec: 'シーバス', pack: true, desc: 'フラッグシップのフージンZを4本継にした、村岡昌憲さん監修の2025年限定パックロッド。', fish: ['シーバス'], len: [8.5, 10.25], lure: [3, 42], pcs: [4], packed: [78, 94.5], year: 2025 },
    { f: 'dialunamb', sec: 'シーバス', pack: true, desc: '定番シーバスロッド「ディアルーナ」の4ピースのモバイルモデル。仕舞寸法61.6〜72.8cm。', fish: ['シーバス'], len: [7.5, 9], lure: [5, 28], pcs: [4], packed: [61.6, 72.8] },
    { f: 'cds80mlcst', sec: 'シーバス', pack: true, desc: '電車や自転車での釣行に合わせた、5ピースの振出シーバスロッド。仕舞寸法62cm。', fish: ['シーバス'], len: [8, 8], lure: [0, 30], pcs: [5], packed: [62, 62], tags: ['振出'] },
    { f: 'dianact85ml5', sec: 'シーバス', pack: true, desc: '「普段使い」の快適さを追求した5ピースのシーバスロッド。仕舞寸法59cm。', fish: ['シーバス'], len: [8 + 5 / 12, 8 + 5 / 12], lure: [5, 25], pcs: [5], packed: [59, 59], year: 2026 },
    { f: 'foojinz', sec: 'シーバス', desc: 'アピアのフラッグシップシーバスロッド。東レの第3世代カーボンを使った6代目。', fish: ['シーバス'], len: [7 + 7 / 12, 10 + 8 / 12], lure: [3, 63], pcs: [2, 4], packed: null },
    { f: 'foojin-rs-spec', sec: 'シーバス', maker: 'アピア', desc: 'アピアのシーバスロッド「フージンRS」全モデルのスペックをまとめて比較。', fish: ['シーバス'], len: [8 + 8 / 12, 10.5], lure: [3, 80], pcs: [2, 5], packed: null },
    { f: 'grandage', sec: 'シーバス', desc: 'ヒラスズキからライトゲーム・オフショアまで、8つのサブシリーズがそろうアピアのソルトロッド。', fish: ['シーバス', '青物', 'チヌ', 'メバル・アジ', 'ロックフィッシュ', 'トラウト'], len: null, lure: null, pcs: null, packed: null },
    { f: 'balbal99poweredition', sec: 'シーバス', desc: '高橋優介さん監修。最大70gまで扱える、ブルーブルーのパワー系シーバスロッド。', fish: ['シーバス'], len: [9.75, 9.75], lure: [12, 70], pcs: [2], packed: [152, 152], year: 2026 },
    { f: 'cds94lcs', sec: 'シーバス', desc: 'VJ-16の性能を引き出すために作られた、コアマンの9ft4inシーバスロッド。', fish: ['シーバス'], len: [9 + 4 / 12, 9 + 4 / 12], lure: [0, 28], pcs: [2], packed: null },
    { f: 'cds96mlcs', sec: 'シーバス', desc: 'アイアンプレートを効果的に使うために作られた、コアマンの9ft6inシーバスロッド。', fish: ['シーバス'], len: [9.5, 9.5], lure: [0, 30], pcs: [2], packed: null },
    { f: 'cowabunga', sec: 'シーバス', desc: 'imaから約10年ぶりに登場した、メイドインジャパンのシーバスロッド。', fish: ['シーバス'], len: [7 + 8 / 12, 9.25], lure: [4, 45], pcs: null, packed: null },
    { f: 'cowabunga90mhplus', sec: 'シーバス', desc: '軽いルアーでは柔らかく、重いルアーでは強く感じるカワバンガの9ftモデル。', fish: ['シーバス'], len: [9, 9], lure: [8, 45], pcs: null, packed: null, year: 2026 },
    { f: 'firstcastseabass', sec: 'シーバス', desc: 'ベイエリアから河口・サーフまで全3モデル。8,030円からの入門シーバスロッド。', fish: ['シーバス'], len: [9, 9.5], lure: [7, 45], pcs: [2], packed: null, year: 2026 },
    { f: 'gyokaku65xh', sec: 'シーバス', desc: 'ブルーブルーのビッグベイトブランドZEN BAITの第一弾。60〜280gを投げやすい。', fish: ['シーバス', '青物'], len: [6 + 5 / 12, 6 + 5 / 12], lure: [60, 280], pcs: [2], packed: [141, 141], year: 2026, tags: ['ビッグベイト'] },
    { f: 'dianact78l5', sec: 'ライトゲーム', pack: true, desc: '「シーバスアングラーがもう1本もつなら」がコンセプトの5ピースのショアロッド。', fish: ['シーバス', 'チヌ', 'ロックフィッシュ'], len: [7 + 8 / 12, 7 + 8 / 12], lure: [3, 15], pcs: [5], packed: [55, 55], year: 2026 },
    { f: 'bluecurrent85ar', sec: 'ライトゲーム', desc: '水面からボトムまで、ライトラインで何でも狙える「ショアのなんでもロッド」。', fish: ['メバル・アジ', 'チヌ', 'シーバス', 'ロックフィッシュ', 'イカ'], len: [8 + 5 / 12, 8 + 5 / 12], lure: [3, 21], pcs: [2], packed: [131.5, 131.5] },
    { f: 'bluecurrent86are', sec: 'ライトゲーム', desc: '85オールレンジを、シャープなブランクで「戦闘仕様」にしたスペシャルモデル。', fish: ['メバル・アジ', 'シーバス', '青物'], len: [8.46, 8.46], lure: [3, 21], pcs: [2], packed: [132, 132] },
    { f: 'grftr711pe', sec: 'ライトゲーム', desc: 'GRFシリーズのPEスペシャルを受け継ぐ、ブリーデンの7ft11inライトゲームロッド。', fish: ['メバル・アジ'], len: [7 + 11 / 12, 7 + 11 / 12], lure: [1.5, 20], pcs: [2], packed: [125, 125] },
    { f: 'firstcastlightgame', sec: 'ライトゲーム', desc: 'ソリッドとチューブラーの全2モデル。7,150円からの入門ライトゲームロッド。', fish: ['メバル・アジ'], len: [7.25, 7.5], lure: [0.5, 10], pcs: [2], packed: null, year: 2026 },
    { f: 'firstcastajing', sec: 'ライトゲーム', desc: 'ソリッドティップの全2モデル。6,600円からの入門アジングロッド。', fish: ['メバル・アジ'], len: [6 + 1 / 12, 6 + 5 / 12], lure: [0.2, 3], pcs: [2], packed: null, year: 2026, tags: ['アジング'] },
    { f: 'galupa86b', sec: 'ショアジギング・ロックショア', pack: true, desc: '8.6ftと9.6ftに組み替えられる、ハタを根から引き剥がすロックショア用のベイトパックロッド。', fish: ['ロックフィッシュ', 'シーバス'], len: [8.5, 9.5], lure: [18, 100], pcs: [5, 6], packed: [58, 58], tags: ['ベイト', 'ハタ', '可変レングス'] },
    { f: 'arcflexrs', sec: 'ショアジギング・ロックショア', desc: '「軽く、強く、しなる」を追求した、がまかつのロックショアロッド。', fish: ['青物'], len: [9.5, 10.5], lure: [30, 250], pcs: [2], packed: null },
    { f: 'firstcastshorejigging', sec: 'ショアジギング・ロックショア', desc: 'ライトショアジギングから大型青物まで全6モデル。8,250円からの入門ロッド。', fish: ['青物', 'ロックフィッシュ'], len: [9.5, 10], lure: [15, 100], pcs: [2], packed: null, year: 2026 },
    { f: 'firstcasteging', sec: 'エギング', desc: '全5モデル、7,150円からの入門エギングロッド。対応エギは1.5〜4.0号。', fish: ['イカ'], len: [7.75, 8.5], lure: [5, 25], pcs: [2], packed: null, year: 2026 },
    { f: 'umitaroaoi70ls', sec: 'オフショア', desc: 'SLJ・バチコン・イカメタルまでこなす「オフショアのなんでもロッド」。', fish: ['青物', 'ロックフィッシュ', 'メバル・アジ', 'イカ'], len: [7, 7], lure: [10, 60], pcs: [2], packed: [110, 110] },
    { f: 'pulchra62b', sec: 'バス', pack: true, desc: 'ティップML・バットH〜XHの、6.2ftと7.3ftに組み替えられるベイトのバーサタイルパックロッド。', fish: ['バス', 'シーバス', 'ロックフィッシュ', '青物'], len: [6 + 2 / 12, 7 + 3 / 12], lure: [5, 56], pcs: [4, 5], packed: [52.5, 52.5], tags: ['ベイト', '可変レングス'] },
    { f: 'bluetrek', sec: 'バス', desc: '青木大介さんの経験を詰め込んだ、DSTYLEのバスロッドシリーズ。', fish: ['バス'], len: null, lure: null, pcs: null, packed: null },
    { f: 'firstcastbass', sec: 'バス', desc: 'ベイト3・スピニング2の全5モデル。7,150円からの入門バスロッド。', fish: ['バス'], len: [6.5, 7], lure: [1.8, 42.5], pcs: [2], packed: null, year: 2027 },
    { f: 'shibumi', sec: 'トラウト', desc: '辺見哲也さんがフリップキャストに特化させた、セミダブルハンドの渓流ロッド。', fish: ['トラウト'], len: [5 + 8 / 12, 6 + 1 / 12], lure: [0, 8], pcs: null, packed: null, tags: ['渓流'] },
    { f: 'firstcastarea', sec: 'トラウト', desc: '全2モデル・6,600円の入門エリアトラウトロッド。スプーンからプラグまで。', fish: ['トラウト'], len: [6, 6], lure: [0.9, 5], pcs: [2], packed: null, year: 2026, tags: ['エリア'] },
    { f: 'packstylea3', sec: 'マルチ', pack: true, desc: 'A3サイズに収まる仕舞寸法で、ライトゲームから青物・ビッグベイトまで6機種。', fish: ['メバル・アジ', 'イカ', 'シーバス', 'チヌ', '青物', 'ロックフィッシュ', 'バス'], len: [6 + 10 / 12, 9.5], lure: [3, 150], pcs: [7, 8], packed: [39, 42], year: 2026, tags: ['A3サイズ'] },
    { f: 'packstylea4', sec: 'マルチ', pack: true, desc: 'A4サイズに収まるスーパーコンパクトロッド。どこにいても釣りができる4機種。', fish: ['メバル・アジ', 'トラウト', 'シーバス', 'チヌ', 'イカ', 'バス', 'ロックフィッシュ'], len: [5 + 10 / 12, 7 + 5 / 12], lure: [0.5, 56], pcs: [8, 9], packed: [28, 29.5], year: 2026, tags: ['A4サイズ'] },
    { f: 'lb510', sec: 'マルチ', pack: true, desc: '5ft10in〜7.7ftの4つの長さに変えられる、トランスセンデンスのフラッグシップのベイトパックロッド。', fish: ['シーバス', 'バス', 'ロックフィッシュ', '青物'], len: [5 + 10 / 12, 7 + 7 / 12], lure: [10, 120], pcs: [4, 5], packed: [50, 50], tags: ['ベイト', '可変レングス'] },
    { f: 'zoomsafari', sec: 'マルチ', pack: true, desc: '海釣り公園・管理釣り場・キャンプまで、エサでもルアーでも楽しめるアブガルシアのマルチピースロッド。', fish: ['メバル・アジ', 'トラウト', 'バス', 'ロックフィッシュ', 'シーバス', 'イカ', 'チヌ', '青物'], len: [4, 8], lure: [2, 28], pcs: [4, 5], packed: [35.6, 56.5], tags: ['キャンプ'] },
  ],
};

const ACCESSORY = {
  page: 'accessory-zukan.html',
  title: 'アクセサリー図鑑',
  lead: 'ウェアやライフジャケット、タモ、収納ボックス、フックまで、釣りを快適にするアクセサリー・道具を探せる図鑑です。随時更新中。',
  sections: ['ウェア・ライフジャケット', 'ランディング・ウェーディング', '収納', 'フック・スナップ', 'エサ', 'リール'],
  groups: ['防寒ウェア', 'グローブ', 'ライフジャケット', 'ランディングネット', 'タモの柄', 'ウェーディング', 'タックルボックス', 'ルアーケース', 'フック', 'スナップ', 'エサ', 'スピニングリール'],
  items: [
    { f: 'thermoforcextremejacket', sec: 'ウェア・ライフジャケット', grp: '防寒ウェア', desc: '最大クラスの中綿量でシリーズ最高峰の保温性能。極寒対応のフラッグシップ防寒ジャケット。' },
    { f: 'thermoforceactivejacket', sec: 'ウェア・ライフジャケット', grp: '防寒ウェア', desc: '冬の釣りに必要な暖かさと動きやすさを両立した、万能の防寒ジャケット。' },
    { f: 'chomolungma', sec: 'ウェア・ライフジャケット', grp: '防寒ウェア', desc: '肌側にダンロン®を使った3重構造で、待つ釣りでも冷えにくい日本製の防寒インナー。' },
    { f: 'geolineexp', sec: 'ウェア・ライフジャケット', grp: '防寒ウェア', desc: '厚手でも伸びて動きやすい、モンベルの防寒インナー。動きの多い冬の釣りに。' },
    { f: 'titaniumfitgloves', sec: 'ウェア・ライフジャケット', grp: 'グローブ', desc: '保温力の高い「タイタニュームα」素材を使った、imaの防寒フィッシンググローブ。' },
    { f: 'bluestorm-calif-west', sec: 'ウェア・ライフジャケット', grp: 'ライフジャケット', desc: '業界最小・最軽量クラスの腰巻きライフジャケット。桜マークTypeA取得。' },
    { f: 'floatingvestx0iii', sec: 'ウェア・ライフジャケット', grp: 'ライフジャケット', desc: '重さを体の中心に集めて疲れにくい、X型のフローティングベスト。' },
    { f: 'gannet', sec: 'ウェア・ライフジャケット', grp: 'ライフジャケット', desc: '浮力7.5kg/24h。アピアのシーバス向けフローティングベスト。' },
    { f: 'hexanetxl', sec: 'ランディング・ウェーディング', grp: 'ランディングネット', desc: 'メータークラスのサワラ・ブリにも対応する、四つ折りの大型ランディングネット。' },
    { f: 'ls450xd', sec: 'ランディング・ウェーディング', grp: 'タモの柄', desc: '全長4.5m・仕舞寸法162.5cmの小継振出式のタモの柄。' },
    { f: 'thegrandshaft450', sec: 'ランディング・ウェーディング', grp: 'タモの柄', desc: '全長4.5m・カーボン含有率95%の、大物用ランディングシャフト。' },
    { f: 'wadingstaff', sec: 'ランディング・ウェーディング', grp: 'ウェーディング', desc: '軽くて丈夫なワンピースのウェーディングスタッフ。川や干潟で足元を探りながら歩ける。' },
    { f: 'vaac85', sec: '収納', grp: 'タックルボックス', desc: 'ショックリーダーやルアーなどの小物をまとめて収納できる、バリバスのツールボックス。' },
    { f: 'hdtacklecontainer', sec: '収納', grp: 'タックルボックス', desc: '本体・蓋・ベルトの接続部まで強度を見直した、ジャッカルのハードユース対応コンテナ。' },
    { f: 'lurecasereversible140', sec: '収納', grp: 'ルアーケース', desc: '140mmクラスのルアーを両面に収納できる、imaのルアーケース。' },
    { f: 'boostersystem', sec: 'フック・スナップ', grp: 'フック', desc: 'トレブルフックとブレードが一体になった、コアマンのフックシステム。' },
    { f: 'silverclaw', sec: 'フック・スナップ', grp: 'フック', desc: '魚の口に吸い込まれやすい鋭いカーブを持つ、シーバス専用シングルフック。' },
    { f: 'tisnapwide', sec: 'フック・スナップ', grp: 'スナップ', desc: 'チタン形状記憶合金で、開け閉めしてもヘタりにくく錆びにくいスナップ。' },
    { f: 'hybridcross', sec: 'エサ', grp: 'エサ', desc: '生のオキアミやイワシを使い、食いのよさとエサ持ちを両立した人工くわせエサ。' },
    { f: 'ventura', sec: 'リール', grp: 'スピニングリール', desc: 'アピアのシーバス用スピニングリール。自重240g・最大ドラグ12kgの4000番。' },
  ],
};

const strip = s => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const ftin = v => { const ft = Math.floor(v + 1e-6); const inch = Math.round((v - ft) * 12); return inch === 12 ? `${ft + 1}ft` : `${ft}ft${inch ? inch + 'in' : ''}`; };
const range = (a, b, f) => (a === b ? f(a) : `${f(a)}〜${f(b)}`);

function info(it) {
  const html = read(`article/${it.f}.html`);
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || it.f;
  const [l1, l2] = h1.split(/<br\s*\/?>/);
  const name = strip(l1);
  const sub = l2 ? strip(l2).replace(/^（|）$/g, '') : '';
  const title = strip((html.match(/<title>([^<]*)/) || [])[1] || '');
  const maker = it.maker || (title.match(/】(.+?)の/) || [])[1] || '';
  const og = (html.match(/property="og:image" content="[^"]*\/image\/([^"]+)"/) || [])[1];
  const img = og && fs.existsSync(path.join(ROOT, 'image', og)) ? og : null;
  return { name, sub, maker, img };
}

function card(it, kind) {
  const c = info(it);
  const grp = kind === 'rod' ? (it.pack ? 'パックロッド' : 'ロッド') : it.grp;
  let tags = [it.sec, ...(it.tags || [])];
  const data = [];
  if (kind === 'rod') {
    if (it.len) tags.push(range(it.len[0], it.len[1], ftin));
    if (it.lure) tags.push(it.lure[0] === 0 ? `MAX${it.lure[1]}g` : range(it.lure[0], it.lure[1], v => v + 'g'));
    if (it.pcs) tags.push(it.pcs.length > 1 ? `${Math.min(...it.pcs)}〜${Math.max(...it.pcs)}ピース` : `${it.pcs[0]}ピース`);
    data.push(`data-fish="${esc(it.fish.join(' '))}"`);
    if (it.len) data.push(`data-len="${it.len[0].toFixed(2)} ${it.len[1].toFixed(2)}"`);
    if (it.lure) data.push(`data-lure="${it.lure[0]} ${it.lure[1]}"`);
    if (it.pcs) data.push(`data-pcs="${it.pcs.join(' ')}"`);
    if (it.packed) data.push(`data-packed="${it.packed[0]} ${it.packed[1]}"`);
    if (it.year) data.push(`data-year="${it.year}"`);
  }
  const badges = ['<span class="badge badge--ready">記事あり</span>'];
  if (grp === 'パックロッド') badges.unshift('<span class="badge badge--pack">パックロッド</span>');
  const image = c.img
    ? `<img src="/image/${c.img}" alt="${esc(c.name)}の画像" class="lure-card__image">`
    : `<!-- 画像：${c.name} の画像をここに挿入 -->`;
  return `        <li class="lure-item"
            data-name="${esc([c.name, c.sub, c.maker, it.sec, grp, ...(it.fish || []), ...(it.tags || [])].filter(Boolean).join(' '))}"
            data-maker="${esc(c.maker)}"
            data-category="${esc(it.sec)}"
            data-type="${esc(grp)}"${data.length ? '\n            ' + data.join('\n            ') : ''}
            data-status="ready">
          <a href="/article/${it.f}.html" class="lure-card">
            <div class="lure-card__header">
              <div class="lure-card__title-wrap">
                <h4 class="lure-card__name">${c.name}</h4>
                ${c.sub ? `<p class="lure-card__kana">${c.sub}</p>\n                ` : ''}<p class="lure-card__maker">${c.maker}</p>
              </div>

              <div class="lure-card__image-wrap">
                ${image}
              </div>
            </div>

            <div class="lure-card__badges">
              ${badges.join('\n              ')}
            </div>

            <p class="lure-card__desc">
              ${it.desc}
            </p>

            <div class="lure-card__meta">
${tags.map(t => `              <span class="meta-tag">${t}</span>`).join('\n')}
            </div>

          </a>
        </li>`;
}

// ロッド図鑑の絞り込み（チップ＋スライダー）
const ROD_FILTERS = () => `
    <div class="filter-group">
      <p class="filter-group__label">ターゲット魚種</p>
      <div class="filter-box__tags" data-key="fish">
        <button type="button" class="filter-chip is-active" data-filter="all">すべて</button>
${ROD_FISH.map(f => `        <button type="button" class="filter-chip" data-filter="${f}">${f}</button>`).join('\n')}
      </div>
    </div>

    <div class="filter-group">
      <p class="filter-group__label">長さ <span class="range-value" id="lenValue"></span></p>
      <div class="range-slider" data-key="len">
        <input type="range" min="0" max="12" step="1" value="0" aria-label="長さの下限">
        <input type="range" min="0" max="12" step="1" value="12" aria-label="長さの上限">
      </div>
    </div>

    <div class="filter-group">
      <p class="filter-group__label">ルアー重量（ウェイト負荷） <span class="range-value" id="lureValue"></span></p>
      <div class="range-slider" data-key="lure">
        <input type="range" min="0" max="17" step="1" value="0" aria-label="ルアー重量の下限">
        <input type="range" min="0" max="17" step="1" value="17" aria-label="ルアー重量の上限">
      </div>
    </div>

    <div class="filter-group">
      <p class="filter-group__label">継数</p>
      <div class="filter-box__tags" data-key="pcs">
        <button type="button" class="filter-chip is-active" data-filter="all">すべて</button>
        <button type="button" class="filter-chip" data-filter="1-2">2ピース以下</button>
        <button type="button" class="filter-chip" data-filter="3-4">3〜4ピース</button>
        <button type="button" class="filter-chip" data-filter="5-99">5ピース以上（パックロッド）</button>
      </div>
    </div>

    <div class="filter-group">
      <p class="filter-group__label">仕舞寸法</p>
      <div class="filter-box__tags" data-key="packed">
        <button type="button" class="filter-chip is-active" data-filter="all">すべて</button>
        <button type="button" class="filter-chip" data-filter="0-60">60cm以下</button>
        <button type="button" class="filter-chip" data-filter="60.1-100">61〜100cm</button>
        <button type="button" class="filter-chip" data-filter="100.1-130">101〜130cm</button>
        <button type="button" class="filter-chip" data-filter="130.1-999">131cm以上</button>
      </div>
    </div>

    <div class="filter-group">
      <p class="filter-group__label">その他</p>
      <div class="filter-box__tags" data-key="other">
        <button type="button" class="filter-chip" data-filter="新作">新作</button>
      </div>
    </div>
`;

const ROD_SCRIPT = `<script>
// ロッド図鑑の絞り込み（tools/make-gear-zukan.js が作る）
document.addEventListener("DOMContentLoaded", function () {
  const items = Array.from(document.querySelectorAll(".lure-item"));
  const groups = document.querySelectorAll(".lure-group");
  const sections = document.querySelectorAll(".lure-section");
  const resultCount = document.getElementById("resultCount");
  const searchInput = document.getElementById("lureSearch");
  const applyButton = document.getElementById("filterApply");
  const clearButton = document.getElementById("filterClear");
  const thisYear = new Date().getFullYear();
  // スライダーの目盛り（長さはフィート、ルアー重量は g。軽いほうを細かく）
  const STEPS = {
    len: [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11],
    lure: [0, 1, 2, 3, 5, 7, 10, 15, 20, 30, 40, 50, 60, 80, 100, 150, 200, 300]
  };
  const ftin = v => { const ft = Math.floor(v + 1e-6), inch = Math.round((v - ft) * 12); return ft + "ft" + (inch ? inch + "in" : ""); };
  const fmt = { len: ftin, lure: v => v + "g" };

  // 新作バッジ（data-year が今年以降）
  items.forEach(item => {
    const year = parseInt(item.dataset.year, 10);
    const badges = item.querySelector(".lure-card__badges");
    if (year && year >= thisYear && badges && !badges.querySelector(".badge--new")) {
      const b = document.createElement("span");
      b.className = "badge badge--new";
      b.textContent = "新作";
      badges.prepend(b);
    }
  });

  const sliders = {};
  document.querySelectorAll(".range-slider").forEach(box => {
    const key = box.dataset.key, [lo, hi] = box.querySelectorAll("input");
    sliders[key] = { lo, hi, box };
    const label = document.getElementById(key + "Value");
    const update = (moved) => {
      if (+lo.value > +hi.value) { if (moved === lo) hi.value = lo.value; else lo.value = hi.value; }
      const s = STEPS[key], a = +lo.value, b = +hi.value, max = s.length - 1;
      label.textContent = a === 0 && b === max ? "（指定なし）"
        : b === max ? "：" + fmt[key](s[a]) + "以上"
        : a === 0 ? "：" + fmt[key](s[b]) + "以下"
        : "：" + fmt[key](s[a]) + "〜" + fmt[key](s[b]);
      const pa = a / max * 100, pb = b / max * 100;
      box.style.setProperty("--a", pa + "%");
      box.style.setProperty("--b", pb + "%");
      refreshApplyButton();
    };
    lo.addEventListener("input", () => update(lo));
    hi.addEventListener("input", () => update(hi));
    sliders[key].update = update;
  });

  function current() {
    const chips = {};
    document.querySelectorAll(".filter-box__tags").forEach(g => {
      chips[g.dataset.key] = Array.from(g.querySelectorAll(".filter-chip.is-active")).map(b => b.dataset.filter).filter(f => f !== "all");
    });
    const ranges = {};
    Object.entries(sliders).forEach(([key, s]) => {
      const st = STEPS[key], a = +s.lo.value, b = +s.hi.value, max = st.length - 1;
      if (a > 0 || b < max) ranges[key] = [st[a], b === max ? Infinity : st[b]];
    });
    return { chips, ranges };
  }
  let active = current();
  let section = null;  // パンくずの ?cat=（釣り方）から開いたとき
  const pair = v => (v || "").split(" ").filter(Boolean).map(Number);
  const overlap = (v, lo, hi) => { const r = pair(v); return r.length === 2 && r[1] >= lo && r[0] <= hi; };

  function matches(item, st) {
    const d = item.dataset, c = st.chips;
    if (section && d.category !== section) return false;
    if (c.fish && c.fish.length && !c.fish.every(f => (d.fish || "").split(" ").includes(f))) return false;
    if (c.pcs && c.pcs.length) {
      const p = pair(d.pcs);
      if (!c.pcs.every(r => { const [lo, hi] = r.split("-").map(Number); return p.some(x => x >= lo && x <= hi); })) return false;
    }
    if (c.packed && c.packed.length && !c.packed.every(r => { const [lo, hi] = r.split("-").map(Number); return overlap(d.packed, lo, hi); })) return false;
    if (c.other && c.other.includes("新作") && !(parseInt(d.year, 10) >= thisYear)) return false;
    for (const [key, [lo, hi]] of Object.entries(st.ranges)) if (!overlap(d[key], lo, hi)) return false;
    const kw = searchInput.value.trim().toLowerCase();
    if (kw && !((d.name || "") + " " + item.textContent).toLowerCase().includes(kw)) return false;
    return true;
  }

  function updateList() {
    let n = 0;
    items.forEach(item => { const v = matches(item, active); item.classList.toggle("is-hidden", !v); if (v) n++; });
    groups.forEach(g => { g.style.display = g.querySelector(".lure-item:not(.is-hidden)") ? "" : "none"; });
    sections.forEach(s => { s.style.display = Array.from(s.querySelectorAll(".lure-group")).some(g => g.style.display !== "none") ? "" : "none"; });
    resultCount.textContent = n ? "該当件数: " + n + "件" : "該当するロッドはありません";
  }

  function label() {
    const parts = Array.from(document.querySelectorAll(".filter-chip.is-active")).filter(b => b.dataset.filter !== "all").map(b => b.textContent.trim());
    ["len", "lure"].forEach(k => { const t = document.getElementById(k + "Value").textContent; if (!t.includes("指定なし")) parts.push(t.replace("：", "")); });
    if (section) parts.unshift(section);
    return parts.join(" × ");
  }

  function refreshApplyButton() {
    applyButton.classList.toggle("is-pending", JSON.stringify(current()) !== JSON.stringify(active));
  }

  document.querySelectorAll(".filter-chip").forEach(button => {
    button.addEventListener("click", function () {
      const group = this.closest(".filter-box__tags");
      const was = this.classList.contains("is-active");
      group.querySelectorAll(".filter-chip").forEach(b => b.classList.remove("is-active"));
      if (!was || this.dataset.filter === "all") this.classList.add("is-active");
      if (!group.querySelector(".filter-chip.is-active")) { const all = group.querySelector('[data-filter="all"]'); if (all) all.classList.add("is-active"); }
      refreshApplyButton();
    });
  });

  function showResult() {
    resultCount.classList.remove("is-flash");
    document.body.classList.remove("is-filtered");
    void resultCount.offsetWidth;
    resultCount.classList.add("is-flash");
    document.body.classList.add("is-filtered");
    const l = label();
    if (l && !resultCount.textContent.includes("ありません")) resultCount.textContent = l + "：" + resultCount.textContent.replace("該当件数: ", "");
    const y = resultCount.getBoundingClientRect().top + window.scrollY - 12;
    if (Math.abs(window.scrollY - y) > 40) window.scrollTo({ top: y, behavior: "smooth" });
  }

  applyButton.addEventListener("click", () => { section = null; active = current(); updateList(); refreshApplyButton(); showResult(); });
  clearButton.addEventListener("click", () => {
    document.querySelectorAll(".filter-chip").forEach(b => b.classList.toggle("is-active", b.dataset.filter === "all"));
    Object.values(sliders).forEach(s => { s.lo.value = s.lo.min; s.hi.value = s.hi.max; s.update(); });
    searchInput.value = ""; section = null; active = current(); updateList(); refreshApplyButton(); showResult();
  });
  searchInput.addEventListener("input", updateList);

  Object.values(sliders).forEach(s => s.update());
  const params = new URLSearchParams(location.search);
  if (params.get("q")) searchInput.value = params.get("q");
  if (params.get("cat")) section = params.get("cat");
  active = current();
  updateList();
  if (section) resultCount.textContent = section + "：" + resultCount.textContent.replace("該当件数: ", "");
});
</script>
</body>
</html>
`;

function build(cfg, kind) {
  const tpl = read('lure-zukan.html');
  const url = `https://tsuri-boon.github.io/${cfg.page}`;
  const pageTitle = kind === 'rod'
    ? `${cfg.title}｜ターゲット・長さ・ルアー重量・継数からロッドを探せる!!パックロッドも｜tsuri-boon`
    : `${cfg.title}｜ウェア・タモ・収納・フックなど釣り道具を探せる!!随時更新中。｜tsuri-boon`;
  let head = tpl.slice(0, tpl.indexOf('<main'));
  head = head
    .replace(/<title>[^<]*<\/title>/, `<title>${pageTitle}</title>`)
    .replace(/(<meta name="description" content=")[^"]*/, `$1${cfg.lead}`)
    .replace(/(<link rel="canonical" href=")[^"]*/, `$1${url}`)
    .replace(/(<meta property="og:title" content=")[^"]*/, `$1${pageTitle}`)
    .replace(/(<meta property="og:description" content=")[^"]*/, `$1${cfg.lead}`)
    .replace(/(<meta property="og:url" content=")[^"]*/, `$1${url}`)
    .replace(/(<meta name="twitter:title" content=")[^"]*/, `$1${cfg.title}｜tsuri-boon`)
    .replace(/(<meta name="twitter:description" content=")[^"]*/, `$1${cfg.lead}`)
    .replace(/("name": ")ルアー図鑑(")/, `$1${cfg.title}$2`)
    .replace(/("description": ")[^"]*(")/, `$1${cfg.lead}$2`)
    .replace(/("url": ")[^"]*(")/, `$1${url}$2`);
  const scriptStart = tpl.indexOf('<script>\ndocument.addEventListener');
  const footer = tpl.slice(tpl.indexOf('</main>'), scriptStart);
  const word = kind === 'rod' ? 'ロッド' : 'アクセサリー';
  const filters = kind === 'rod' ? ROD_FILTERS() : `
    <div class="filter-group">
      <p class="filter-group__label">種類</p>
      <div class="filter-box__tags">
        <button type="button" class="filter-chip is-active" data-filter="all">すべて</button>
${cfg.sections.filter(s => cfg.items.some(i => i.sec === s)).map(s => `        <button type="button" class="filter-chip" data-filter="${s}">${s}</button>`).join('\n')}
      </div>
    </div>
`;
  let body = `<main class="encyclopedia-page">
  <section class="encyclopedia-hero">
    <h1>${cfg.title}</h1>
    <p class="page-description">
      ${cfg.lead}
    </p>
  </section>

  <section class="filter-box">
    <p class="filter-guide">名前・メーカー名で検索、条件を選んで「この条件で絞り込む」を押すと絞り込めます。</p>

    <div class="filter-box__search">
      <input
        type="text"
        id="lureSearch"
        placeholder="${word}名・メーカー名で探す"
        aria-label="${word}検索"
      >
    </div>
${filters}
    <div class="filter-actions">
      <button type="button" class="filter-apply" id="filterApply">この条件で絞り込む</button>
      <button type="button" class="filter-clear" id="filterClear">クリア</button>
    </div>

    <p id="resultCount" class="result-count" aria-live="polite">該当件数: 0件</p>
  </section>

`;
  const groupsOf = kind === 'rod' ? ['パックロッド', 'ロッド'] : cfg.groups;
  const grpOf = it => (kind === 'rod' ? (it.pack ? 'パックロッド' : 'ロッド') : it.grp);
  for (const s of cfg.sections) {
    const inSec = cfg.items.filter(i => i.sec === s);
    if (!inSec.length) continue;
    body += `  <section class="lure-section">
    <h2 class="lure-section__title">${s}</h2>
`;
    for (const g of groupsOf) {
      const inGroup = inSec.filter(i => grpOf(i) === g);
      if (!inGroup.length) continue;
      body += `
    <section class="lure-group">
      <h3 class="lure-group__title">${g}</h3>
      <ul class="lure-list">
${inGroup.map(i => card(i, kind)).join('\n\n')}
      </ul>
    </section>
`;
    }
    body += `
  </section>

`;
  }
  const script = kind === 'rod' ? ROD_SCRIPT : tpl.slice(scriptStart);
  fs.writeFileSync(path.join(ROOT, cfg.page), (head + body + footer + script).replace(/\n/g, '\r\n'));
  console.log(`${cfg.page} を作成しました（${cfg.items.length} 件）`);
}

for (const cfg of [ROD, ACCESSORY]) for (const i of cfg.items) {
  if (!fs.existsSync(path.join(ROOT, 'article', i.f + '.html'))) throw new Error('記事がありません: ' + i.f);
}
build(ROD, 'rod');
build(ACCESSORY, 'accessory');

// 一覧に入っていないロッド・リールらしい記事（タイトルに「ロッド｜」「リール｜」を含む）を知らせる
const listed = new Set([...ROD.items, ...ACCESSORY.items].map(i => i.f));
const makerPages = new Set(['breaden', 'dstyle', 'goto9', 'transcendence']);
const unlisted = fs.readdirSync(path.join(ROOT, 'article')).filter(f => f.endsWith('.html')).map(f => f.slice(0, -5))
  .filter(f => !listed.has(f) && !makerPages.has(f) && /ロッド｜|ロッド（|リール｜/.test((read(`article/${f}.html`).match(/<title>([^<]*)/) || [])[1] || ''));
if (unlisted.length) console.log('一覧に入っていないロッド・リールらしい記事：', unlisted.join(', '));
