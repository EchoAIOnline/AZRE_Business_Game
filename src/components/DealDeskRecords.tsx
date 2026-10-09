import { useState } from 'react';

export function DealDeskRecords() {
  const [password, setPassword] = useState('');
  const [table, setTable] = useState('Deals');
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [status, setStatus] = useState('Enter your separate office access password to retrieve CRM records.');
  const [busy, setBusy] = useState(false);
  async function load() {
    setBusy(true); setRecords([]); setStatus('Reading DealDesk…');
    try {
      const response = await fetch('/api/dealdesk', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` }, body: JSON.stringify({ table }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Connection failed.');
      setRecords(data.records);
      setStatus(`${data.records.length} records retrieved at ${new Date(data.retrievedAt).toLocaleString()}.${data.next_offset !== null ? ' Showing the first 100 records; additional records exist.' : ''}`);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Connection failed. Retry.'); }
    finally { setBusy(false); }
  }
  return <section><h2>DealDesk Hosted · Read-only records</h2><p>This retrieves actual CRM records. Avatar animations remain visual demonstrations; automated business tasks are not running.</p><form className="wd-inputs" onSubmit={e => { e.preventDefault(); void load(); }}><label>Office access password<input type="password" autoComplete="off" value={password} onChange={e => setPassword(e.target.value)} required /></label><label>Records<select value={table} onChange={e => { setTable(e.target.value); setRecords([]); setStatus('Select Read DealDesk to retrieve this record type.'); }}><option>Deals</option><option>Buyers</option><option>PluginTasks</option></select></label><button disabled={busy}>{busy ? 'Reading…' : 'Read DealDesk'}</button><button type="button" onClick={() => { setPassword(''); setRecords([]); setStatus('Disconnected.'); }}>Disconnect</button></form><p role="status">{status}</p>{records.map((record, index) => <details key={String(record.id || index)}><summary>{String(record.address || record.name || record.title || record.id || `Record ${index + 1}`)}</summary><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{JSON.stringify(record, null, 2)}</pre></details>)}</section>;
}
