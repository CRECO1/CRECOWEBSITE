import fsSync from 'node:fs';
import pg from 'pg';

for (const line of fsSync.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);
  if (!m) continue;
  let val = m[2].trim();
  if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
  process.env[m[1]] = val;
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();

const { rows: pickerRows } = await client.query(
  `select id, name, email, company, default_tax_rate, default_payment_terms,
          reminders_enabled_default, reminder_cadence, portal_token
     from public.clients where active = true order by name limit 5`
);
console.log('=== ClientPicker query (with new defaults) ===');
for (const r of pickerRows) {
  console.log(`  - ${r.name.padEnd(28)} tax=${String(r.default_tax_rate ?? 'null').padEnd(8)} terms=${String(r.default_payment_terms ?? 'null').padEnd(12)} cadence=${String(r.reminder_cadence).padEnd(10)} portal=${r.portal_token?.slice(0, 8)}…`);
}

const { rows: bankReady } = await client.query(
  `select column_name from information_schema.columns
     where table_schema = 'public' and table_name = 'bank_transactions'
       and column_name in ('status', 'reconciled_invoice_id', 'expense_id')
     order by column_name`
);
console.log(`\n=== bank_transactions columns: ${bankReady.length}/3 ===`);
for (const r of bankReady) console.log(`  ✓ ${r.column_name}`);

const { rows: indexes } = await client.query(
  `select indexname from pg_indexes
     where schemaname = 'public' and tablename = 'clients' and indexname = 'clients_portal_token_idx'`
);
console.log(`\n=== Portal-token unique index ===`);
console.log(indexes.length === 1 ? '  ✓ clients_portal_token_idx present' : '  ✗ MISSING');

const { rows: fk } = await client.query(
  `select conname from pg_constraint
     where conrelid = 'public.bank_transactions'::regclass
       and contype = 'f' and conname like '%reconciled%'`
);
console.log(`\n=== bank_transactions → invoices FK ===`);
for (const r of fk) console.log(`  ✓ ${r.conname}`);
if (fk.length === 0) console.log('  ✗ NO RECONCILIATION FK');

console.log(`\n=== Portal token to test ===`);
console.log(`  ${pickerRows[0]?.portal_token}`);

await client.end();
