// pages/api/generate.js
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const prompt = req.body.prompt;
  const token = process.env.REPLICATE_API_TOKEN;

  try {
    const response = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: "a9758cb3b1e96329c2c1b22cfef7c63671cb3fc8e0f5568e0b3c4ab4070db6c4", // Stable Diffusion 1.5
        input: { prompt }
      },
      {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(200).json({ image: response.data.urls.get });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Image generation failed' });
  }
}
