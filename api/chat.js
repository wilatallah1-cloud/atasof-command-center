export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).send('Method not allowed')

  try {
    const { apiKey, message, history, currentData } = req.body

    if (!apiKey) return res.status(400).json({ error: 'API key required' })

    const systemPrompt = `You are the AI assistant for the ATASOF AI Command Center — a private business dashboard for a 2-person AI agency.

Your job: When the user describes updates, respond conversationally AND output a structured JSON block so the app can auto-apply the changes.

CURRENT DATA STATE:
${JSON.stringify(currentData, null, 2)}

INSTRUCTIONS:
- Respond in plain English first (confirm what you're updating, ask if unclear)
- If data needs to change, include an update block at the END of your response in this exact format:

\`\`\`update
{"operations":[...]}
\`\`\`

OPERATION TYPES:
- {"type":"set","path":"outreach.pipeline.leads","value":36}
- {"type":"add","path":"outreach.log","value":{"date":"2026-03-24","text":"..."}}
- {"type":"prepend","path":"outreach.log","value":{"date":"2026-03-24","text":"..."}}
- {"type":"remove","path":"ideas","id":"idea-1"}
- {"type":"toggle","path":"outreach.todayChecklist","id":"oc-1"}
- {"type":"update","path":"ideas","id":"idea-1","value":{"text":"new text"}}

PATH REFERENCE:
- dashboard.todayFocus, dashboard.weeklyGoals, dashboard.recentActivity
- outreach.pipeline.leads/contacted/replied/meetingsBooked/closed
- outreach.todayChecklist, outreach.weeklyGoals, outreach.monthlyGoals, outreach.statuses, outreach.log
- clients (array — use clients.0.tasks, clients.1.notes, etc.)
- aiSaas.phases.0.tasks, aiSaas.phases.1.tasks, etc., aiSaas.weeklyGoals, aiSaas.notes
- coaching.tasks, coaching.weeklyGoals, coaching.monthlyRevenueGoals, coaching.log
- youtube.pipeline.ideas/scripted/filmed/edited/published, youtube.stats, youtube.notes
- ideas (top-level array)

TASK FORMAT: {"id":"task-{timestamp}","title":"...","completed":false,"assignee":"William|Dad|Both","dueDate":"YYYY-MM-DD"} (dueDate optional)
LOG/NOTE FORMAT: {"date":"YYYY-MM-DD","text":"..."}
IDEA FORMAT: {"id":"idea-{timestamp}","text":"...","project":"Outreach|Clients|AI Content SaaS|Coaching|YouTube|Other","createdAt":"ISO-8601"}

Today's date: ${new Date().toISOString().split('T')[0]}

Be concise. Be helpful. Always confirm what changes you're making.`

    const messages = [
      ...(history || []).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ]

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        messages
      })
    })

    if (!response.ok) {
      const err = await response.text()
      return res.status(response.status).send(err)
    }

    const result = await response.json()
    const text = result.content[0].text

    let operations = []
    const updateMatch = text.match(/```update\s*\n([\s\S]*?)\n```/)
    if (updateMatch) {
      try {
        const parsed = JSON.parse(updateMatch[1])
        operations = parsed.operations || []
      } catch {}
    }

    const displayText = text.replace(/```update\s*\n[\s\S]*?\n```/, '').trim()

    res.status(200).json({ text: displayText, operations })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
