const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Define the translation endpoint
const LIBRE_TRANSLATE_URL = 'https://libretranslate.com/translate'; // Public LibreTranslate API URL

// Translation function
async function translateText(text, sourceLang, targetLang) {
  try {
    // Logging the data before sending to LibreTranslate
    console.log('Sending request to LibreTranslate with data:', { text, sourceLang, targetLang });

    const response = await axios.post(LIBRE_TRANSLATE_URL, {
      q: text,
      source: sourceLang,
      target: targetLang,
      format: 'text'
    });

    // Logging the response from LibreTranslate
    console.log('Received response from LibreTranslate:', response.data);

    return response.data.translatedText;
  } catch (error) {
    console.error('LibreTranslate API error:', error.response?.data || error.message);
    throw new Error('Translation failed');
  }
}

// Define the /translate endpoint
app.post('/translate', async (req, res) => {
  const { text, sourceLang, targetLang } = req.body;

  // Logging the incoming request
  console.log('Received translation request:', { text, sourceLang, targetLang });

  if (!text || !sourceLang || !targetLang) {
    return res.status(400).json({ error: 'Missing parameters (text, sourceLang, targetLang)' });
  }

  try {
    const translatedText = await translateText(text, sourceLang, targetLang);
    res.json({ translatedText });
  } catch (error) {
    // Logging the error
    console.error('Error during translation:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
