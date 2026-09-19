const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { initDb } = require('./db')

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3000

let db: any

// POST /api/schemes/search - Search for relevant Indian govt schemes via AI
app.post('/api/schemes/search', async (req: any, res: any) => {
  try {
    const { text, lang } = req.body

    if (!text || !lang) {
      return res.status(400).json({ error: 'text and lang are required' })
    }

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant for Indian citizens. Output ONLY a valid JSON object containing an array of schemes under the key "schemes". The objects must exactly match this interface:
{
  id: number,
  name: string,
  icon: string (a relevant emoji),
  ministry: string,
  matchReason: string,
  benefit: string,
  docs: number,
  category: string,
  categoryColor: string (one of: "bg-india-green-100 text-india-green-700", "bg-saffron-100 text-saffron-700", "bg-navy-100 text-navy-700"),
  eligibility: string[],
  documents: { icon: string, name: string }[],
  steps: string[],
  officialLink: string
}
Do not wrap the output in markdown code blocks. Output just the raw JSON object. IMPORTANT: Translate all text fields to the ${lang} language.`
          },
          {
            role: 'user',
            content: `Give me 3 relevant Indian Govt subsidies/schemes for this domain: ${text}. Return a JSON object with a "schemes" array translated in ${lang}.`
          }
        ],
        response_format: { type: 'json_object' }
      })
    })

    const data: any = await groqResponse.json()

    if (data.error) {
      throw new Error(data.error.message || 'Groq API Error')
    }

    const content = data.choices[0].message.content.trim()
    const parsed = JSON.parse(content)
    const schemes = (parsed.schemes || []).slice(0, 3).map((s: any, i: number) => ({
      ...s,
      id: s.id || i + 1
    }))

    res.json({ schemes })
  } catch (error: any) {
    console.error('Search API Error:', error.message)
    res.status(500).json({ error: error.message || 'Internal Server Error' })
  }
})

// GET /api/health
app.get('/api/health', (_req: any, res: any) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

// Initialize DB then start server
initDb()
  .then((database: any) => {
    db = database
    console.log('✅ Database initialized')
    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on http://localhost:${PORT}`)
    })
  })
  .catch((err: any) => {
    console.error('❌ Failed to initialize database:', err)
    process.exit(1)
  })
