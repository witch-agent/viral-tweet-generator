// Vercel API Route for Viral Tweet Generator

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_BASE_URL = 'https://api.minimax.io/anthropic';

const formatPrompts = {
    thread: 'Create a Twitter thread (5-7 tweets)',
    single: 'Create a single viral tweet',
    poll: 'Create a Twitter poll with options',
    question: 'Create an engaging question tweet',
    opinion: 'Create a hot take / controversial opinion',
    story: 'Create a mini story tweet'
};

const tonePrompts = {
    bold: 'Bold, confident, unapologetic',
    mysterious: 'Mysterious, intriguing, hint at secrets',
    humor: 'Funny, witty, sarcastic',
    provocative: 'Controversial, eye-opening',
    wise: 'Wise, philosophical, thought-provoking'
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    try {
        const { topic, format, tone } = req.body;
        
        if (!topic) return res.status(400).json({ error: 'Topic is required' });
        if (!MINIMAX_API_KEY) return res.status(500).json({ error: 'API key not configured' });
        
        const formatPrompt = formatPrompts[format] || formatPrompts.single;
        const tonePrompt = tonePrompts[tone] || tonePrompts.bold;
        
        const userPrompt = `Create a viral Twitter post about: ${topic}

Format: ${formatPrompt}
Tone: ${tonePrompt}

Requirements:
- Use viral writing techniques
- Start with a HOOK
- Include emojis naturally
- Use line breaks for readability
- Maximum engagement tactics
- ${format === 'thread' ? 'Create 5-7 tweets that hook, provide value, and end with CTA' : 'Single punchy tweet'}

Write the tweet(s) now.`;

        const response = await fetch(`${MINIMAX_BASE_URL}/v1/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': MINIMAX_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'MiniMax-M2.5',
                max_tokens: 2048,
                system: 'You are a viral Twitter writer. Create tweets that get engagement, retweets, and followers.',
                messages: [{ role: 'user', content: [{ type: 'text', text: userPrompt }] }]
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json({ error: 'API failed', details: errorData });
        }
        
        const data = await response.json();
        let result = '';
        for (const block of data.content) {
            if (block.type === 'text') result += block.text;
        }
        
        return res.status(200).json({ result });
        
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
