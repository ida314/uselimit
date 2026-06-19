import { NextResponse } from 'next/server'
import { getUsage } from '../../../lib/usage'

const COST = 5

// A mocked "expensive" AI call. Swap in your real model here.
async function generateText(prompt: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 50))
  return `Generated text for: ${prompt.slice(0, 40)}`
}

export async function POST(req: Request): Promise<Response> {
  const tenantId = req.headers.get('x-tenant-id') ?? 'team_demo'
  const { prompt = '' } = await req.json().catch(() => ({ prompt: '' }))

  const usage = await getUsage()

  // 1. Pre-flight: block before spending money.
  const pre = await usage.check({ tenantId, feature: 'generate-text', cost: COST })
  if (!pre.allowed) {
    return NextResponse.json({ error: pre.reason, resetAt: pre.resetAt }, { status: 402 })
  }

  // 2. Do the expensive operation.
  const text = await generateText(prompt)

  // 3. Charge only after success.
  const result = await usage.consume({ tenantId, feature: 'generate-text', amount: COST })

  return NextResponse.json({ text, creditsRemaining: result.remaining })
}
