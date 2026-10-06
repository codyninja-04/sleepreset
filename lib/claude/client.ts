import Anthropic from '@anthropic-ai/sdk'

export const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5-5'

let client: Anthropic | null = null

export function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
    client = new Anthropic({ apiKey })
  }
  return client
}

export function claudeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

/** Shared voice so every coaching line sounds like the same person. */
export const VOICE = `Voice:
- Calm, plain and practical, like a friend who knows a bit about sleep. Not a wellness app.
- No exclamation marks. No em dashes. No hype, no guilt, no lecturing.
- Specific beats generic. Refer to their actual numbers and habits, not textbook sleep hygiene.
- Never diagnose. Do not mention sleep disorders, apnea or insomnia as conditions. If something looks persistently bad, suggesting they talk to a doctor is fine.`

/**
 * Forces the model to answer through a single tool call, which gives us
 * schema shaped JSON without parsing prose or stripping code fences.
 */
export async function callStructured<T>(params: {
  system: string
  content: string
  toolName: string
  toolDescription: string
  schema: Anthropic.Tool['input_schema']
  maxTokens: number
}): Promise<T> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: params.maxTokens,
    system: params.system,
    tools: [{ name: params.toolName, description: params.toolDescription, input_schema: params.schema }],
    tool_choice: { type: 'tool', name: params.toolName },
    messages: [{ role: 'user', content: params.content }],
  })

  const block = response.content.find((b) => b.type === 'tool_use')
  if (!block || block.type !== 'tool_use') throw new Error('The model did not return a structured answer')
  if (response.stop_reason === 'max_tokens') throw new Error('The answer was cut off')
  return block.input as T
}

/** Strips em and en dashes and exclamation marks the model sometimes slips in. */
export function tidy(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/!/g, '.')
    .replace(/\.{2,}/g, '.')
    .trim()
}

/** Wraps user written text so it is read as data, not instructions. */
export function quote(text: string | null | undefined, max = 200): string | null {
  const clean = (text ?? '').replace(/[<>]/g, '').slice(0, max).trim()
  return clean ? `<user_text>${clean}</user_text>` : null
}

export const str = { type: 'string' } as const
