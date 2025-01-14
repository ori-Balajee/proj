const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const { exec } = require('child_process');

// Initialize app
const app = express();
const upload = multer();
app.use(cors()); // Enable CORS for the frontend
app.use(express.json());

// Function to convert speech to text using Vosk
function speechToText(audioFilePath, callback) {
  const command = `python3 vosk_transcribe.py ${audioFilePath}`;  // Assuming you use a Python script for Vosk
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    callback(stdout);  // Pass the transcribed text to the callback
  });
}

// Function to translate text using LibreTranslate
async function translateText(text, targetLanguage) {
  try {
    const response = await axios.post('https://libretranslate.de/translate', {
      q: text,
      source: 'en',  // Assuming the text is in English
      target: targetLanguage,
      format: 'text'
    });
    return response.data.translatedText;
  } catch (error) {
    console.error('Error during translation:', error);
    return null;
  }
}

// Function to convert text to speech using Festival or eSpeak
function textToSpeech(text, callback) {
  const command = `echo "${text}" | festival --tts`;  // Using Festival TTS
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    callback(stdout);  // Return any output from Festival
  });
}

// API endpoint to process the translation
app.post('/translate', upload.single('audio'), async (req, res) => {
  const audioFile = req.file;
  const targetLanguage = req.body.targetLanguage || 'es'; // Default to Spanish if no language is provided

  if (!audioFile) {
    return res.status(400).json({ error: 'No audio file uploaded' });
  }

  // Save the uploaded audio file to the server
  const audioFilePath = `./uploads/${Date.now()}.wav`;
  require('fs').writeFileSync(audioFilePath, audioFile.buffer);

  // Step 1: Convert speech to text using Vosk
  speechToText(audioFilePath, async (transcribedText) => {
    if (!transcribedText) {
      return res.status(500).json({ error: 'Failed to transcribe speech' });
    }

    // Step 2: Translate the transcribed text using LibreTranslate
    const translatedText = await translateText(transcribedText, targetLanguage);
    if (!translatedText) {
      return res.status(500).json({ error: 'Translation failed' });
    }

    // Step 3: Convert the translated text to speech using Festival
    textToSpeech(translatedText, (ttsOutput) => {
      res.json({
        originalText: transcribedText,
        translatedText: translatedText,
        audioFile: ttsOutput,  // Audio response (Festival will produce speech output)
      });
    });
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
