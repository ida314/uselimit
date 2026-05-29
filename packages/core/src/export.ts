import type { ExportParams, ExportResult, UseLimitConfig } from './types.js'

/**
 * exportUsage() — query recorded UsageEvents and serialize them.
 *
 * Output can be consumed by Stripe metered billing, data warehouses,
 * or handed back as CSV/JSON to the end user.
 *
 * TODO: implement the following steps:
 *   1. Call storage.queryEvents(params) to fetch matching events
 *   2. If format === 'csv', serialize events to RFC 4180 CSV string
 *   3. If format === 'json', return events as-is (or lightly shaped)
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
  // TODO: remove this stub and implement logic
  void params
  void config
  throw new Error('Not implemented: exportUsage()')
}
