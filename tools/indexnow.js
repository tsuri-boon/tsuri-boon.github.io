// 公開したページの URL を IndexNow（Bing など）へ通知する
//   使い方：
//     node tools/indexnow.js --from <前回のコミット> --to <今回のコミット> [--dry-run] [--max 500]
//       → 2つのコミットの差分から、追加・更新・削除された公開 HTML を通知する
//     node tools/indexnow.js --url https://tsuri-boon.github.io/ [--dry-run]
//       → 指定した URL だけ通知する（初回テスト・手動の再通知用。--url は複数指定可）
//     node tools/indexnow.js --from auto --to <コミット>
//       → GitHub Actions 用。前回成功した「pages build and deployment」のコミットを API から探して比較する
//   環境変数：
//     INDEXNOW_KEY       IndexNow のキー（必須。ルートに「<キー>.txt」を置き、中身もキーにしておく）
//     INDEXNOW_ENDPOINT  送信先（省略時は https://api.indexnow.org/indexnow）
//     GITHUB_TOKEN / GITHUB_REPOSITORY / PAGES_RUN_ID   --from auto のときに使う（Actions が渡す）
//   - 対象は公開 HTML（ルートの *.html と article/*.html）だけ。CSS・JS・画像などの変更では通知しない
//   - tools/make-sitemap.js の EXCLUDE と、<meta name="robots" content="noindex"> のページは通知しない
//   - 同じ URL は1回にまとめ、1回のリクエストは公式上限の 10,000 件以内に分ける
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://tsuri-boon.github.io';
const HOST = new URL(SITE).host;
const ENDPOINT = process.env.INDEXNOW_ENDPOINT || 'https://api.indexnow.org/indexnow';
const BATCH = 10000; // IndexNow 公式の1リクエストあたりの上限

// ---- 引数 ----
const args = process.argv.slice(2);
const opt = { urls: [], dryRun: false, max: 500 };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--from') opt.from = args[++i];
  else if (a === '--to') opt.to = args[++i];
  else if (a === '--url') opt.urls.push(args[++i]);
  else if (a === '--max') opt.max = Number(args[++i]);
  else if (a === '--dry-run') opt.dryRun = true;
  else { console.error(`不明な引数: ${a}`); process.exit(2); }
}

const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 });
const log = (...a) => console.log(...a);
const fail = msg => { console.error(`::error::${msg}`); process.exit(1); };

// ---- 通知から外すページ（サイトマップと同じ EXCLUDE を使う）----
const sitemapSrc = fs.readFileSync(path.join(ROOT, 'tools/make-sitemap.js'), 'utf8');
const excludeBlock = (sitemapSrc.match(/const EXCLUDE = new Set\(\[([\s\S]*?)\]\)/) || [])[1] || '';
const EXCLUDE = new Set([...excludeBlock.matchAll(/'([^']+)'/g)].map(m => m[1]));

const isPublicHtml = p => /^[^/]+\.html$/.test(p) || /^article\/[^/]+\.html$/.test(p);
const toUrl = p => `${SITE}/${p === 'index.html' ? '' : p}`;
const isNoindex = html => /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html);

// ---- キーの確認 ----
async function checkKey(key) {
  if (!key) fail('INDEXNOW_KEY が設定されていません（Settings → Secrets and variables → Actions → Variables に INDEXNOW_KEY を登録）');
  if (!/^[a-zA-Z0-9-]{8,128}$/.test(key)) fail('INDEXNOW_KEY の形式が IndexNow の仕様（英数字とハイフン、8〜128文字）に合いません');
  const file = path.join(ROOT, `${key}.txt`);
  if (!fs.existsSync(file)) fail(`キーファイル ${key}.txt がリポジトリのルートにありません`);
  if (fs.readFileSync(file, 'utf8').trim() !== key) fail(`キーファイル ${key}.txt の中身がキーと一致しません`);
  const keyLocation = `${SITE}/${key}.txt`;
  try {
    const r = await fetch(keyLocation, { cache: 'no-store' });
    const body = (await r.text()).trim();
    if (r.status !== 200 || body !== key) fail(`公開中のキーファイル ${keyLocation} を確認できません（HTTP ${r.status}）。公開の反映を待ってから再実行してください`);
  } catch (e) { fail(`公開中のキーファイル ${keyLocation} を取得できません: ${e.message}`); }
  log(`キーファイルを確認しました: ${keyLocation}`);
  return keyLocation;
}

// ---- 前回成功した公開のコミットを探す（--from auto）----
async function previousPagesSha(toSha) {
  const repo = process.env.GITHUB_REPOSITORY, token = process.env.GITHUB_TOKEN;
  if (!repo || !token) fail('--from auto には GITHUB_REPOSITORY と GITHUB_TOKEN が必要です');
  const r = await fetch(`https://api.github.com/repos/${repo}/actions/runs?branch=main&status=success&per_page=50`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (!r.ok) fail(`GitHub API でワークフローの実行履歴を取得できません（HTTP ${r.status}）`);
  const runs = (await r.json()).workflow_runs
    .filter(w => w.name === 'pages build and deployment' && String(w.id) !== String(process.env.PAGES_RUN_ID || ''))
    .filter(w => w.head_sha !== toSha);
  const prev = runs.find(w => { try { git('merge-base', '--is-ancestor', w.head_sha, toSha); return true; } catch { return false; } });
  return prev ? prev.head_sha : null;
}

// ---- 差分から通知する URL を集める ----
function urlsFromDiff(from, to) {
  // --no-renames：リネームは「旧パスの削除」と「新パスの追加」として扱い、両方の URL を通知する
  const lines = git('diff', '--name-status', '--no-renames', from, to).split('\n').filter(Boolean);
  const urls = new Map(); // url → 理由
  const skipped = [];
  for (const line of lines) {
    const [status, p] = line.split('\t');
    if (!isPublicHtml(p)) continue;
    if (EXCLUDE.has(p)) { skipped.push(`${p}（EXCLUDE）`); continue; }
    const deleted = status.startsWith('D');
    // 削除されたページは削除前の内容で、それ以外は今回の内容で noindex を判定する
    let html = '';
    try { html = git('show', `${deleted ? from : to}:${p}`); } catch { /* 読めない場合は判定しない */ }
    if (isNoindex(html)) { skipped.push(`${p}（noindex）`); continue; }
    urls.set(toUrl(p), deleted ? '削除' : status.startsWith('A') ? '追加' : '更新');
  }
  return { urls, skipped, changedFiles: lines.length };
}

async function send(urlList, keyLocation, key) {
  for (let i = 0; i < urlList.length; i += BATCH) {
    const chunk = urlList.slice(i, i + BATCH);
    const body = { host: HOST, key, keyLocation, urlList: chunk };
    log(`IndexNow へ送信: ${ENDPOINT}（${chunk.length} 件）`);
    const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) });
    const text = (await r.text()).trim();
    const meaning = {
      200: 'OK（受け付けられました）', 202: 'Accepted（受け付け済み。キーの確認待ち）', 400: 'Bad request（リクエストの形式が不正）',
      403: 'Forbidden（キーが無効。キーファイルを確認してください）', 422: 'Unprocessable Entity（URL がホストやキーと一致しない）',
      429: 'Too Many Requests（送信が多すぎます。時間をおいてください）',
    }[r.status] || '想定外のレスポンス';
    log(`レスポンス: HTTP ${r.status} ${meaning}${text ? `\n本文: ${text.slice(0, 1000)}` : ''}`);
    if (r.status !== 200 && r.status !== 202) fail(`IndexNow への送信に失敗しました（HTTP ${r.status} ${meaning}）`);
  }
}

(async () => {
  let entries; // [url, 理由]
  if (opt.urls.length) {
    entries = [...new Set(opt.urls)].map(u => [u, '手動']);
    for (const [u] of entries) if (new URL(u).host !== HOST) fail(`${u} は ${HOST} の URL ではありません`);
  } else {
    if (!opt.to) fail('--to（または --url）を指定してください');
    const to = git('rev-parse', opt.to).trim();
    let from = opt.from;
    if (from === 'auto') {
      from = await previousPagesSha(to);
      if (!from) { log('前回成功した公開が見つからないため、通知しません（初回は --url で1ページだけ送ってください）'); return; }
    }
    if (!from) fail('--from を指定してください');
    from = git('rev-parse', from).trim();
    if (from === to) { log('前回と同じコミットなので、通知しません'); return; }
    log(`比較: ${from.slice(0, 7)} → ${to.slice(0, 7)}`);
    const { urls, skipped, changedFiles } = urlsFromDiff(from, to);
    log(`変更ファイル ${changedFiles} 件のうち、通知対象の公開ページ ${urls.size} 件`);
    for (const s of skipped) log(`  対象外: ${s}`);
    entries = [...urls];
  }
  for (const [u, why] of entries) log(`  ${why}: ${u}`);
  if (!entries.length) { log('通知する URL はありません'); return; }
  if (entries.length > opt.max) fail(`通知対象が ${entries.length} 件あり、上限 ${opt.max} 件を超えています。内容を確認し、必要なら --max を上げて手動で実行してください`);
  if (opt.dryRun) { log('--dry-run のため送信しません'); return; }
  const key = (process.env.INDEXNOW_KEY || '').trim();
  const keyLocation = await checkKey(key);
  await send(entries.map(e => e[0]), keyLocation, key);
  log('IndexNow への通知が完了しました');
})().catch(e => fail(e.stack || e.message));
