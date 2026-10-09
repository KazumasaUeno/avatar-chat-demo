// ローカル専用サーバー: ページを配信し、/api/chat を OpenAI へ中継する（依存パッケージなし。Node 18 以上）
// 使い方: OPENAI_API_KEY を環境変数か .env.local に置いて `node local-server.mjs` → http://127.0.0.1:8765/
// キーはブラウザへ渡さない。127.0.0.1 だけで待ち受ける（同じ LAN の他の端末からは使えない）。
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8765;

// .env.local（Git 管理外）があれば読む。環境変数のほうを優先する
try {
  for (const line of (await readFile(path.join(ROOT, '.env.local'), 'utf8')).split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}
const KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const BASE = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');

const SYSTEM = {
  ja: 'あなたは画面の中の 3D アバターです。親しみやすく、話し言葉で答えてください。相手が英語など別の言語で書いても、必ず日本語で答えてください（音声は日本語しか読めません）。返事は音声で読み上げられるので、1〜3 文の短さにし、記号・箇条書き・絵文字・URL は使わないでください。',
  en: 'You are a friendly 3D avatar on screen. Always reply in casual spoken English, even when the user writes in Japanese or any other language (the voice can only read English). Your reply is read aloud, so keep it to 1-3 short sentences with no lists, symbols, emoji or URLs.',
};
const MAX_TURNS = 10, MAX_CHARS = 500;

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.vrm': 'application/octet-stream', '.png': 'image/png', '.md': 'text/plain; charset=utf-8' };

function json(res, status, body) { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); }

async function chat(req, res) {
  if (!KEY) return json(res, 503, { error: 'no_key' });
  let body = '';
  for await (const c of req) { body += c; if (body.length > 50_000) return json(res, 413, { error: 'too_large' }); }
  let input;
  try { input = JSON.parse(body); } catch { return json(res, 400, { error: 'bad_json' }); }
  const lang = input.lang === 'en' ? 'en' : 'ja';
  const messages = (Array.isArray(input.messages) ? input.messages : [])
    .filter(m => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_TURNS * 2)
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  if (!messages.length || messages.at(-1).role !== 'user') return json(res, 400, { error: 'no_user_message' });

  try {
    const r = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: { authorization: `Bearer ${KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, messages: [{ role: 'system', content: SYSTEM[lang] }, ...messages], max_completion_tokens: 200 }),
      signal: AbortSignal.timeout(30_000),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error(`OpenAI ${r.status}: ${data?.error?.message || ''}`);
      return json(res, 502, { error: 'upstream', status: r.status });
    }
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) return json(res, 502, { error: 'empty' });
    json(res, 200, { reply });
  } catch (e) {
    console.error('OpenAI request failed:', e.message);
    json(res, 502, { error: 'network' });
  }
}

async function serveFile(req, res) {
  const url = new URL(req.url, 'http://localhost');
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.join(ROOT, rel);
  // ルート外・隠しファイル（.env.local / .git）・このサーバー自身は配信しない
  if (!file.startsWith(ROOT + path.sep) || rel.split('/').some(s => s.startsWith('.')) || path.basename(file) === 'local-server.mjs') {
    res.writeHead(404); return res.end();
  }
  try {
    const buf = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(buf);
  } catch { res.writeHead(404); res.end(); }
}

http.createServer((req, res) => {
  if (req.url === '/api/chat' && req.method === 'POST') return chat(req, res);
  if (req.method === 'GET' || req.method === 'HEAD') return serveFile(req, res);
  res.writeHead(405); res.end();
}).listen(PORT, '127.0.0.1', () => {
  console.log(`http://127.0.0.1:${PORT}/  (model: ${MODEL}, OpenAI key: ${KEY ? 'set' : 'NOT SET - fixed replies only'})`);
});
