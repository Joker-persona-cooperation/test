export interface ServerSentEvent {
  event: string
  data: string
}

export function parseSseChunk(buffer: string): {
  events: ServerSentEvent[]
  rest: string
} {
  const normalized = buffer.replace(/\r\n/g, '\n')
  const blocks = normalized.split('\n\n')
  const rest = blocks.pop() ?? ''
  const events: ServerSentEvent[] = []

  for (const block of blocks) {
    let event = 'message'
    const data: string[] = []
    for (const line of block.split('\n')) {
      if (!line || line.startsWith(':')) continue
      if (line.startsWith('event:')) {
        event = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        data.push(line.slice(5).trimStart())
      }
    }
    if (data.length) events.push({ event, data: data.join('\n') })
  }

  return { events, rest }
}
