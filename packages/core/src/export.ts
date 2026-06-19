import type { ExportParams, ExportResult, UsageEvent } from './types.js'
import type { UseLimitConfig } from './types.js'
import { InMemoryAdapter } from './storage/memory.js'

/** Column order for the CSV export. */
const CSV_COLUMNS = [
  'id',
  'tenantId',
  'userId',
  'feature',
  'amount',
  'metadata',
  'timestamp',
] as const

/**
 * Escape a single CSV field per RFC 4180: wrap in double quotes and double any
 * embedded quotes, but only when the value contains a comma, quote, CR, or LF.
 */
function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/** Render a single event field as a string for CSV output. */
function cellValue(event: UsageEvent, column: (typeof CSV_COLUMNS)[number]): string {
  switch (column) {
    case 'userId':
      return event.userId ?? ''
    case 'amount':
      return String(event.amount)
    case 'metadata':
      return event.metadata ? JSON.stringify(event.metadata) : ''
    default:
      return event[column]
  }
}

/** Serialize events to an RFC 4180 CSV string (header row + one row per event). */
function serializeCsv(events: UsageEvent[]): string {
  const rows = [
    CSV_COLUMNS.join(','),
    ...events.map((event) =>
      CSV_COLUMNS.map((col) => escapeCsvField(cellValue(event, col))).join(','),
    ),
  ]
  return rows.join('\r\n')
}

/**
 * exportUsage() — query recorded UsageEvents and serialize them.
 *
 * Output can be consumed by Stripe metered billing, data warehouses,
 * or handed back as CSV/JSON to the end user.
 *
 * Steps:
 *   1. Query matching events via storage.queryEvents(params)
 *   2. format === 'csv' → serialize to an RFC 4180 CSV string
 *   3. format === 'json' (default) → return the events array as-is
 *   4. Return ExportResult with format, data, and count
 *
 * Future TODO (do not implement now):
 *   - Stripe metered billing push adapter
 *   - Segment / analytics event forwarding
 *   - Webhook push on threshold exceeded
 */
export async function exportUsage(
  params: ExportParams,
  config: UseLimitConfig,
): Promise<ExportResult> {
  const storage = config.storage ?? new InMemoryAdapter()
  const format = params.format ?? 'json'

  const events = await storage.queryEvents(params)

  return {
    format,
    data: format === 'csv' ? serializeCsv(events) : events,
    count: events.length,
  }
}
