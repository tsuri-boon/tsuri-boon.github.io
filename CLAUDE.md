# tsuri-boon ルアー記事 生成ルール

このリポジトリで Claude Code にルアー記事を作らせるための指示書です。
**記事を書く前に、必ずこのファイルの全ルールに従うこと。**

---

## プロジェクト概要

- 釣り系アフィリエイトサイト（GitHub Pages / tsuri-boon.github.io）
- ルアー図鑑・釣りガイド・ツールを掲載
- 今回のタスク：ルアー名＋メーカー名から個別ルアー記事を量産する

---

## 最重要ルール：テンプレートの正解は `article/overdrive107s.html`

- 記事を書く前に、**必ず `article/overdrive107s.html` を開いて読むこと**。
- HTMLの構造・クラス名・見出しの階層・装飾（絵文字の使い方含む）を、
  この見本ファイルに**厳密に合わせる**こと。
- 自分で新しいレイアウトやクラスを勝手に発明しない。
  迷ったら article/overdrive107s.html の書き方を優先する。
- 既存の完成記事（例：シュリペン70、サイレントアサシン99F、カゲロウ124F など）が
  リポジトリにあれば、それも参考にして語調・構成を揃える。

---

## H1・タイトルの書き方（個別ルアー記事）

- **H1は「カタカナ名＋公式の英語表記」**にする。ジャンルはH1に入れない（`<title>`・description・リード文に入れる）。
  ```html
  <h1>オーバードライブ107S<br>（OVER DRIVE 107S）</h1>
  ```
  - 1行目：カタカナ名（サイズ・型番込み）。
  - 2行目：全角かっこで公式の英語表記。大文字小文字・記号（`!` `.` など）はメーカー公式の表記に合わせる。
  - 公式の英語表記が無いもの（和名のエギなど）はカタカナ名の1行だけにする。
- **`<title>` の【 】内にも英語表記を入れる**：`【カタカナ名（英語表記）】メーカー名の〜｜tsuri-boon`
  - og:title・twitter:title・構造化データの headline も同じ文言に揃える。
- 英語表記は `official_url` の公式ページで確認する。確認できない場合は推測で書かず、カタカナ名だけにして報告する。

---

## アフィリエイトID（もしもアフィリエイト・固定値）

以下は固定。変更しないこと。

- Amazon：`5211706`
- 楽天：`5211705`
- Yahoo：`5345165`

---

## 比較・ランキング系の縦型フォーマット

比較やおすすめを並べるセクションでは、次の縦型の並びを守る
（SEOとスマホの読みやすさのため）：

1. 定番
2. 🔄 こんな場面は持ち替えどき
3. 名作
4. ✨ （エリア名）でハマる理由

- 「持ち替えどき」は定番の欠点探しにしない。まず定番の強みを書き、
  その上で「こういう場面では名作に持ち替えると良い」という流れにする（定番も名作も両方売れる書き方）。

---

## 武庫川ルール

- **武庫川一文字など特定エリア固有の情報は、個別ルアー記事には入れない。**
- エリア情報はエリアまとめ記事の担当。個別記事では一般論にとどめる。

---

## 画像（Claude Code が公式サイトから用意する）

記事を作るときは、`data/lures.csv` の `official_url`（メーカー公式の製品ページ）から画像を取得して、
記事とセットで用意すること。

- **取得する画像**
  - メイン画像：1枚 → `image/{file_name}.jpg`
  - オススメカラー画像：記事で紹介する色の数だけ（通常4色）→ `image/{file_name}_{カラー名ローマ字}.jpg`
    （例：`egiohkdeep_bluepotion.jpg`。カラー名は英小文字・記号なしのローマ字/英語）
  - 公式の画像がPNGなどの場合は、拡張子を元のまま保存し、記事側のパスも合わせる。
- **取得方法**：`official_url` のページを読み、製品画像・カラー画像のURLを特定して `curl` で `image/` にダウンロードする。
  ダウンロード後、ファイルが壊れていないこと（0バイトやHTMLではないこと）を確認する。
- **出典**：画像を載せたセクションの下に、article/overdrive107s.html と同じ書式で出典を入れる。
  `<p>画像出典:<a href="{official_url}" target="_blank" rel="noopener">{メーカー名}公式HP</a></p>`
- **似ているルアーのサムネイル**：`image/` に既にある画像を使う。無い場合はプレースホルダーコメントを残す。
- **取得できなかった画像**：プレースホルダーコメントを残し、報告で「取得できなかった画像」として列挙する。
  ```html
  <!-- 画像：{ルアー名} メイン画像をここに挿入 -->
  ```
- **釣果画像は用意しない**：「使い方」セクションの後には、釣果画像用のプレースホルダーコメントだけを必ず入れておくこと
  （Kosukeが後で載せたい時にすぐ差し込めるように、枠だけ用意する）。書式は article/overdrive107s.html の該当箇所を参照。

---

## 手動で入れる部分（Claude Codeは触らない）

アフィリエイトリンクは Kosuke が後から手動で入れる。
Claude Code は**該当箇所にプレースホルダーのコメントだけ残す**こと。
本文中でリンクを勝手に作り込まない。

プレースホルダーの書式：

```html
<!-- アフィリンク：Amazon / 楽天 / Yahoo をここに挿入 -->
```

- リンク文言（「Amazonで見る」等のボタン枠）だけは article/overdrive107s.html に合わせて用意してよいが、
  実URLは差し込まず、上記コメントを残す。
- **例外：発売前・通販に商品ページが無いもの**は、Kosukeの指示があれば `affiliate-box` 内に
  もしもの**ショップバナー（Amazon・楽天・Yahoo）**を `<div class="shop-banners">` で入れてよい。
  書式は `article/rayzaa.html` の「今すぐチェック」枠に合わせ、バナーの上に `<p class="shop-banners__note">オンラインショップで最新情報を確認！</p>` を添える（「各ショップで〇〇と検索してください」の文言は使わない）。
  商品ページができたら、Kosukeが通常のアフィリンクに差し替える。

---

## 出力ファイル

- 1記事＝1 HTMLファイル。
- ファイル名は `data/lures.csv` の `file_name` 列を使う（例：`file_name` が `camashunter` → `camashunter.html`）。
- 保存先は `article/` フォルダ（overdrive107s.html や既存記事と同じ場所）。
- CSVに無いルアーの記事を作った場合は、`data/lures.csv` にも1行追加する。

---

## 記事作成後：ルアー図鑑（lure-zukan.html）への反映

個別ルアー記事を作ったら、**必ず `lure-zukan.html` にもカードを追加する**（記事を作っただけで終わらせない）。

- **既に「準備中」カードがある場合**（`data-status="coming"`、`lure-card--coming`）：新しく足さずに、そのカードを「記事あり」に切り替える。
  - `data-status` の `coming` → `ready`（`new` は残す）
  - `<div class="lure-card lure-card--coming">` → `<a href="/article/{file_name}.html" class="lure-card">`（閉じタグも `</a>` に）
  - バッジ `badge--coming 準備中` → `badge--ready 記事あり`
  - 画像パスが実在するファイルと合っているか確認する。
- **カードが無い場合**：既存カードと同じ構造で `<li class="lure-item">` を追加する。
  - 置き場所は「魚種（`<h2 class="lure-section__title">`）」→「ジャンル（`<h3 class="lure-group__title">`）」。該当グループの末尾に足し、無ければ同じ書式でグループを新設する。
  - `data-name`（表示名＋カナ＋検索用の別名）、`data-maker`（既存の表記に合わせる）、`data-category`（魚種）、`data-type`（グループ名）、`data-status`（記事ありは `ready`、準備中は `coming`）を入れる。
  - **新作は `data-year`（発売年）で管理する。** 発売年が分かるものは `data-year="2026"` のように入れ、今年の発売なら `data-status` に `new` と「新作」バッジも付けておく。
    ページ内のスクリプトが `data-year` が今年以降のものだけを「新作」にするので、年が変わると自動で新作から外れる（翌年は2027年発売のものが新作になる）。
  - 新しい魚種のセクションを作ったら、上部の「魚種ジャンル」ボタン（`filter-chip`）にも同じ名前で追加する。
  - 画像は `/image/{メイン画像}`。画像が無い場合はプレースホルダーコメントを残す。
  - 説明文は1行程度、`meta-tag` はジャンル・サイズ・魚種などを3〜5個。
- まとめ記事・比較記事（エリアまとめ、〇選、比較など）は図鑑に載せない。
- 反映後、既存カードを壊していないか（`<li>`・`<ul>`・`<section>` の開閉数が合っているか）を確認する。

---

## 記事作成後：オススメ記事（関連リンク）の更新

記事（個別記事・メーカー記事・まとめ記事・ロッド記事とも）を追加・更新したら、コミット前に **`node tools/make-osusume.js`** を実行して、全記事の「オススメ記事はこちら」を作り直す。

- 各記事の「人気記事はこちら」の下（無い記事は `</main>` の直前）に、関連記事を **12本** 自動で並べる。カードは正方形の画像＋名前＋記事タイトル（先頭の【名前】と「｜tsuri-boon」を外したもの）。
- 選び方：ルアー記事は「メーカー記事 → 同じメーカー → 同じジャンル（サイズの近い順）→ 同じ魚種 → 関連まとめ記事」。メーカー記事はそのメーカーのルアーとほかのメーカー記事。まとめ・ロッド記事はタイトルや本文で紹介しているメーカー・魚種から選ぶ。
- 記事自身・「似ているルアー」・本文ですでにリンクしている記事・画像ファイルが無い記事は除く。
- 記事内の `<!-- オススメ記事 start -->` 〜 `<!-- オススメ記事 end -->` の範囲だけをスクリプトが書き換える。**この範囲は手で編集しない。**
- 見た目は `css/style.css` の `.osusume` 系のクラス。
- メーカー記事を追加したら、`tools/make-osusume.js` の `MAKER_PAGES`（記事ファイル名 → 図鑑の `data-maker`）にも追加する。

---

## 記事作成後：サイトマップ（sitemap.xml）の更新

記事（個別記事・まとめ記事とも）を追加・更新したら、コミット前に **`node tools/make-sitemap.js`** を実行して `sitemap.xml` と **HTMLのサイトマップ `sitemap.html`** を作り直し、記事と一緒にコミットする。

- トップ階層の主要ページと `article/` 内の全記事が自動で載る。`lastmod` は各ファイルの最終コミット日（未コミットの変更は今日の日付）。
- `sitemap.html` は人が見る用の全ページ一覧。ルアー記事は `lure-zukan.html` の魚種ごと、メーカー記事は `maker-zukan.html` のリンクから分類され、残りは「まとめ・ガイド記事」になる。**直接編集せず、必ずスクリプトで作り直す**（図鑑にカードを足してから実行すると正しい魚種に入る）。
- **全ページのフッター（`footer-nav`）に「サイトマップ」リンクを置く。** 記事テンプレート（`article/lure_template.html`）には入っているので、新しいページを作るときも消さないこと（`article/` 内は `../sitemap.html`、トップ階層は `sitemap.html`）。
- テスト用・テンプレートなど載せたくないページは、`tools/make-sitemap.js` の `EXCLUDE` に追加する。
- Search Console にはサイトマップ（`https://tsuri-boon.github.io/sitemap.xml`）を登録済みの前提。記事ごとの「インデックス登録をリクエスト」は手動作業なので、Claude Code は行わない。
- `robots.txt` はリポジトリ直下に置いてある（全ページ許可＋`Sitemap:` 行のみ）。検索結果から外したいページは `robots.txt` で `Disallow` せず、そのページの `<head>` に `<meta name="robots" content="noindex">` を入れる（`sitemap.xml` の `EXCLUDE` にも追加）。記事テンプレート（`article/lure_template.html`）には `noindex` を入れない（コピーした記事に写るため）。

---

## Google アナリティクス（GA4）のタグ

- **全ページの `<head>` に GA4 のタグを入れる**（測定IDは `G-J1YGK5NJLT` で固定、変更しない）。置き場所は AdSense のコードの直前。
  ```html
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-J1YGK5NJLT"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-J1YGK5NJLT');
  </script>
  ```
- 見本（`article/overdrive107s.html`）・記事テンプレート（`article/lure_template.html`）・`tools/make-sitemap.js`・`tools/make-maker-zukan.js` には入っている。新しいページを作るときも消さないこと。
- テスト用ページ（`testindnx.html`・`top-test.html`）には入れない（計測にテストのアクセスが混ざるため）。

---

## Google AdSense のコード

- **全ページの `<head>` に AdSense のコードを入れる**（サイト所有の確認用。クライアントIDは `ca-pub-9034047517729390` で固定、変更しない）。
  ```html
  <!-- Google AdSense -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9034047517729390"
       crossorigin="anonymous"></script>
  ```
- 記事テンプレート（`article/lure_template.html`）と `tools/make-sitemap.js` には入っている。新しいページを作るときも消さないこと。

---

## IndexNow（Bing などへの更新通知）

- 公開HTMLを変えて main に Push すると、`.github/workflows/indexnow.yml` が起動して GitHub Pages の公開（`pages build and deployment`）の成功を待ち、`tools/indexnow.js` が前回公開との差分から**追加・更新・削除された公開HTML**の URL を IndexNow に通知する。**Claude Code が手で送る必要はない。**
- 対象はルートの `*.html` と `article/*.html` だけ。CSS・JS・画像だけの変更では通知しない。`tools/make-sitemap.js` の `EXCLUDE` と `noindex` のページは通知しない。
- キーはリポジトリの Variables の `INDEXNOW_KEY`。ルートの `<キー>.txt`（中身もキー）を消さないこと。キーの値を勝手に作り直さない。
- 1回の通知が 500 件を超えると送らずに止まる（誤って大量送信しないため）。必要なら手動で `node tools/indexnow.js --from <コミット> --to <コミット> --max 1000` を実行する。
- 送らずに対象だけ確認するときは `--dry-run`。特定の URL だけ送るときは Actions の「IndexNow」→「Run workflow」か `node tools/indexnow.js --url <URL>`。

---

## 入力データ

- `data/lures.csv` から読む。列は左から `ルアー名, maker_name, official_url, file_name`
  （1列目のヘッダーは `0` になっているが、中身はルアー名）。
- `official_url` は画像の取得元・スペックの確認元・画像出典のリンク先に使う。
- `file_name` は記事のファイル名（`article/{file_name}.html`）と画像のファイル名に使う。
- 1行 = 1記事。

---

## まず1本だけ試作するときの手順

量産の前に、必ず1本だけ作って見本と突き合わせる。

1. `article/overdrive107s.html` を読む。
2. `data/lures.csv` の**1行目だけ**を対象にする
   （CSVがまだ無ければ、指定された1つのルアーで作る）。
3. その1本の記事HTMLを、上記ルールに従って生成する。
4. 生成後、article/overdrive107s.html と構造がズレていないか自分でチェックしてから報告する。
5. **勝手に全件回さない。** 1本できたら止めて、確認を待つ。
