const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Serve built client in production
app.use(express.static(path.join(__dirname, '../client/dist')));

app.post('/api/generate-brief', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY not set. Add it to Replit Secrets.',
    });
  }

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: JSON.stringify(data) });
    }

    res.json({ brief: data.content?.[0]?.text ?? '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SPA fallback (production)
app.get('*', (req, res) => {
  const html = path.join(__dirname, '../client/dist/index.html');
  res.sendFile(html, (err) => {
    if (err) res.status(200).send('Dev mode: open port 3000 for the Vite client.');
  });
});

app.listen(PORT, () => console.log(`[server] running on port ${PORT}`));
