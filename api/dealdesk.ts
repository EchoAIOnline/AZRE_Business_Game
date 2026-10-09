import { timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  const reply = (status: number, body: unknown) => { res.statusCode = status; res.end(JSON.stringify(body)); };
  if (req.method !== 'POST') return reply(405, { error: 'Read requests require POST.' });
  const password = process.env.OFFICE_ACCESS_PASSWORD;
  const key = process.env.DEALDESK_PLUGIN_API_KEY;
  if (!password || password.length < 24 || !key) return reply(503, { error: 'Server connection is not configured. Set OFFICE_ACCESS_PASSWORD (24+ characters) and the DealDesk variables.' });
  const supplied = Buffer.from(String(req.headers.authorization || ''));
  const expected = Buffer.from(`Bearer ${password}`);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return reply(401, { error: 'Office access password is incorrect.' });
  const body = req.body as { table?: string } | undefined;
  if (!body || !['Deals', 'Buyers', 'PluginTasks'].includes(body.table || '')) return reply(400, { error: 'Unsupported read table.' });
  try {
    const url = new URL(process.env.DEALDESK_PLUGIN_URL || 'https://dealdesk.asharizakargroup.com/api/ai/plugin');
    if (url.origin !== 'https://dealdesk.asharizakargroup.com' || url.pathname !== '/api/ai/plugin' || url.search || url.hash || url.username || url.password) return reply(503, { error: 'DealDesk endpoint configuration is invalid.' });
    const upstream = await fetch(url, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000), headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'read', table: body.table, offset: 0, limit: 100, include_archived: false }) });
    if (!upstream.ok) return reply(502, { error: `DealDesk rejected the read request (${upstream.status}).` });
    const result = await upstream.json();
    if (result.success !== true || !Array.isArray(result.records)) return reply(502, { error: 'DealDesk returned an unexpected response.' });
    return reply(200, { records: result.records, next_offset: result.next_offset ?? null, retrievedAt: new Date().toISOString() });
  } catch { return reply(502, { error: 'DealDesk could not be reached. Retry the connection.' }); }
}
