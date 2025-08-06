const express = require('express');
const multer = require('multer');
const router = express.Router();
const voiceService = require('../services/voiceService');
const auth = require('../middleware/auth');

// Configure multer for audio file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  },
});

// Process voice input (speech to text + translation)
router.post('/process', auth, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const audioBuffer = req.file.buffer;
    const result = await voiceService.processVoiceInput(audioBuffer);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Voice processing error:', error);
    res.status(500).json({
      error: 'Voice processing failed',
      message: error.message
    });
  }
});

// Get supported languages
router.get('/languages', async (req, res) => {
  try {
    const languages = voiceService.getSupportedLanguages();
    res.json({
      success: true,
      data: languages
    });
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({
      error: 'Failed to fetch supported languages'
    });
  }
});

// Translate text to English
router.post('/translate', auth, async (req, res) => {
  try {
    const { text, sourceLanguage } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = await voiceService.translateToEnglish(text, sourceLanguage || 'auto');

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      error: 'Translation failed',
      message: error.message
    });
  }
});

// Test endpoint for voice functionality
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Voice API is working',
    supportedLanguages: voiceService.getSupportedLanguages()
  });
});

module.exports = router; 