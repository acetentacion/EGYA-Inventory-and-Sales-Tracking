const express = require('express');
const router = express.Router();
//const fetch = require('node-fetch');
const fetch = global.fetch;

const knownFields = {
  "Perfume & Fragrance": ["Bottle Size (ml)", "Gender", "Fragrance Type"],
  "Clothing": ["Size", "Color", "Material"],
  "Electronics": ["Warranty", "Voltage", "Power"]
};

router.get('/category-fields', async (req, res) => {
  const category = req.query.category;
  if (!category) return res.status(400).json({ error: 'Category is required' });

  // Step 1: Known fields first
  if (knownFields[category]) {
    return res.json({ fields: knownFields[category].slice(0, 3) }); // ✅ Limit to 3
  }

  // Step 2: AI Fallback
  try {
    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Return only the 3 most relevant product attributes as a JSON array for the given category. No extra text." },
          { role: "user", content: `Category: ${category}` }
        ]
      })
    });

    const aiData = await aiResponse.json();
    let response = aiData?.choices?.[0]?.message?.content || "";

    let fields = [];
    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
        fields = parsed.slice(0, 3); // ✅ Limit to 3
      } else if (typeof parsed === "object") {
        fields = Object.keys(parsed).slice(0, 3); // ✅ Limit to 3
      }
    } catch {
      fields = response.split('\n').filter(f => f.trim()).slice(0, 3); // ✅ Limit to 3
    }

    res.json({ fields });

  } catch (err) {
    console.error("AI suggestion error:", err);
    res.status(500).json({ error: 'Failed to fetch AI suggestions' });
  }
});

module.exports = router;
