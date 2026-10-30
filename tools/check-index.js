// Google にインデックス登録されているかを Search Console の URL 検査 API で調べる
//   使い方：リポジトリのルートで
//     node tools/check-index.js --key <サービスアカウントの鍵JSON> --out <結果のJSON>
//   - 対象は sitemap.xml の全URL（--url <URL> で1件だけ、--limit <数> で件数を絞れる）
//   - 結果のJSONがすでにあれば、今日チェック済みのURLは飛ばす（--fresh で全部やり直す）
//   - 鍵ファイルと結果はリポジトリに置かない（鍵はパスワードと同じ）
//   - API の上限は 1日2,000件・1分600件。念のため1件ずつ少し間を空けて送る
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://tsuri-boon.github.io/';
const arg = name => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const KEY = arg('--key') || process.env.GSC_KEY;
const OUT = arg('--out');
if (!KEY || !OUT) {
  console.error('使い方: node tools/check-index.js --key <鍵JSON> --out <結果JSON> [--url <URL>] [--limit <数>] [--fresh]');
  process.exit(1);
}

// サービスアカウントの鍵でアクセストークンをもらう
async function token() {
  const key = JSON.parse(fs.readFileSync(KEY, 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
    iss: key.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600,
  })}`;
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(key.private_key).toString('base64url');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }),
  });
  const j = await res.json();
  if (!j.access_token) throw new Error('トークンを取得できませんでした: ' + JSON.stringify(j));
  return j.access_token;
}

async function inspect(tok, url) {
  const res = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspectionUrl: url, siteUrl: SITE, languageCode: 'ja' }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(j.error || j)}`);
  const r = (j.inspectionResult || {}).indexStatusResult || {};
  return {
    verdict: r.verdict || '',               // PASS = 登録済み
    coverageState: r.coverageState || '',   // 「送信して登録されました」「クロール済み - インデックス未登録」など
    indexingState: r.indexingState || '',
    lastCrawlTime: r.lastCrawlTime || '',
    pageFetchState: r.pageFetchState || '',
    googleCanonical: r.googleCanonical || '',
    userCanonical: r.userCanonical || '',
  };
}

(async () => {
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
  let urls = arg('--url') ? [arg('--url')]
    : [...fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  const out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  if (!process.argv.includes('--fresh')) urls = urls.filter(u => (out[u] || {}).checkedAt !== today);
  if (arg('--limit')) urls = urls.slice(0, Number(arg('--limit')));
  console.log(`チェックするURL: ${urls.length}件`);
  const tok = await token();
  let n = 0;
  for (const u of urls) {
    try {
      out[u] = { ...(await inspect(tok, u)), checkedAt: today };
    } catch (e) {
      console.error('失敗:', u, e.message);
      if (/429|RESOURCE_EXHAUSTED/.test(e.message)) { console.error('APIの上限に達したので止めます。明日また実行してください。'); break; }
      continue;
    }
    n++;
    if (n % 25 === 0) { fs.writeFileSync(OUT, JSON.stringify(out, null, 1)); console.log(`${n}件 完了`); }
    await new Promise(r => setTimeout(r, 300));
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  const all = Object.values(out);
  console.log(`今回 ${n}件チェック。登録済み ${all.filter(x => x.verdict === 'PASS').length}件／記録 ${all.length}件 → ${OUT}`);
})().catch(e => { console.error(e.message); process.exit(1); });
