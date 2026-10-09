import { timingSafeEqual, createHmac } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  const reply = (status: number, body: unknown) => { res.statusCode = status; res.end(JSON.stringify(body)); };
  if (req.method !== 'POST') return reply(405, { error: 'Read requests require POST.' });
  const body = req.body as { table?: string; offset?: number; action?: string } | undefined;
  const secure = req.headers['x-forwarded-proto'] === 'https' || process.env.VERCEL === '1';
  const cookieOptions = `Path=/api/dealdesk; HttpOnly; SameSite=Strict${secure ? '; Secure' : ''}`;
  if (body?.action === 'logout') {res.setHeader('Set-Cookie',`azre_session=; ${cookieOptions}; Max-Age=0`);return reply(200,{success:true});}
  const password = process.env.OFFICE_ACCESS_PASSWORD;
  const key = process.env.DEALDESK_PLUGIN_API_KEY2 || process.env.DEALDESK_PLUGIN_API_KEY;
  if (!password || password.length < 8 || !key) return reply(503, { error: 'The server connection is not configured for this site. Set the office password (8+ characters) and DealDesk API variables on this server.' });
  const equal = (a:string,b:string) => {const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);};
  const sign = (value:string) => createHmac('sha256',password).update(`azre-office-session:${value}`).digest('hex');
  const cookie = String(req.headers.cookie || '').split(';').map(v=>v.trim()).find(v=>v.startsWith('azre_session='))?.slice(13) || '';
  const [expires, signature] = cookie.split('.');
  const sessionValid = /^\d+$/.test(expires || '') && Number(expires)>Date.now() && Number(expires)<=Date.now()+8*60*60*1000 && !!signature && equal(signature,sign(expires));
  const passwordValid = equal(String(req.headers.authorization || ''),`Bearer ${password}`);
  if (!sessionValid && !passwordValid) return reply(401, { error: 'Enter your office access password to sign in.' });
  if (passwordValid) {const expiration=String(Date.now()+8*60*60*1000);res.setHeader('Set-Cookie',`azre_session=${expiration}.${sign(expiration)}; ${cookieOptions}; Max-Age=28800`);}
  if (!body || !['Deals', 'Buyers', 'Agents', 'PluginTasks'].includes(body.table || '')) return reply(400, { error: 'Unsupported read table.' });
  const offset = body.offset ?? 0;
  if (!Number.isInteger(offset) || offset < 0 || offset > 100000) return reply(400, { error: 'Invalid record offset.' });
  try {
    const url = new URL(process.env.DEALDESK_PLUGIN_URL || 'https://dealdesk.asharizakargroup.com/api/ai/plugin');
    if (url.origin !== 'https://dealdesk.asharizakargroup.com' || url.pathname !== '/api/ai/plugin' || url.search || url.hash || url.username || url.password) return reply(503, { error: 'DealDesk endpoint configuration is invalid.' });
    const upstream = await fetch(url, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000), headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'read', table: body.table, offset, limit: 100, include_archived: false }) });
    if (!upstream.ok) return reply(502, { error: `DealDesk rejected the read request (${upstream.status}).` });
    const result = await upstream.json();
    if (result.success !== true || !Array.isArray(result.records)) return reply(502, { error: 'DealDesk returned an unexpected response.' });
    return reply(200, { records: result.records, next_offset: result.next_offset ?? null, retrievedAt: new Date().toISOString() });
  } catch { return reply(502, { error: 'DealDesk could not be reached. Retry the connection.' }); }
}
