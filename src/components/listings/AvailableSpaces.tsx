import type { Listing } from '@/lib/supabase';
import { formatSqft } from '@/lib/utils';

/**
 * Suite-by-suite availability for multi-tenant centers. A tenant needs to see which
 * spaces are open and how big they are before they will ask for a brochure, so this
 * sits right under the description. Renders nothing until a listing has spaces.
 */
export function AvailableSpaces({ spaces }: { spaces: Listing['available_spaces'] }) {
  const rows = (spaces ?? []).filter(s => s && s.suite && Number(s.sqft) > 0);
  if (!rows.length) return null;
  const total = rows.reduce((sum, s) => sum + Number(s.sqft), 0);
  const hasBuilding = rows.some(s => s.building);
  const hasNote = rows.some(s => s.note);
  return (
    <div className="mb-8">
      <h2 className="mb-4 font-heading text-heading-lg font-semibold text-primary">Available Spaces</h2>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-body-sm">
          <thead className="bg-background-cream text-caption uppercase text-foreground-muted">
            <tr>
              <th className="px-4 py-2 font-semibold">Suite</th>
              {hasBuilding && <th className="px-4 py-2 font-semibold">Building</th>}
              <th className="px-4 py-2 text-right font-semibold">Size</th>
              {hasNote && <th className="hidden px-4 py-2 font-semibold sm:table-cell">Notes</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map(s => (
              <tr key={`${s.building ?? ''}-${s.suite}`} className="border-t border-border">
                <td className="px-4 py-3 font-semibold text-primary">{s.suite}</td>
                {hasBuilding && <td className="px-4 py-3 text-foreground-muted">{s.building ?? ''}</td>}
                <td className="px-4 py-3 text-right font-semibold text-primary">{formatSqft(Number(s.sqft))}</td>
                {hasNote && <td className="hidden px-4 py-3 text-foreground-muted sm:table-cell">{s.note ?? ''}</td>}
              </tr>
            ))}
          </tbody>
          {rows.length > 1 && (
            <tfoot>
              <tr className="border-t border-border bg-background-cream">
                <td className="px-4 py-2 font-semibold text-primary" colSpan={hasBuilding ? 2 : 1}>Total available</td>
                <td className="px-4 py-2 text-right font-semibold text-primary">{formatSqft(total)}</td>
                {hasNote && <td className="hidden sm:table-cell" />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
