const speech = require('@google-cloud/speech');
const translate = require('@google-cloud/translate');
const fs = require('fs');
const path = require('path');

// Initialize Google Cloud clients
const speechClient = new speech.SpeechClient();
const translateClient = new translate.TranslationServiceClient();

class VoiceService {
  constructor() {
    this.supportedLanguages = {
      'en': 'English',
      'hi': 'Hindi',
      'ta': 'Tamil',
      'te': 'Telugu',
      'bn': 'Bengali',
      'mr': 'Marathi',
      'gu': 'Gujarati',
      'kn': 'Kannada',
      'ml': 'Malayalam',
      'pa': 'Punjabi'
    };
  }

  // Detect language from audio
  async detectLanguage(audioBuffer) {
    try {
      const request = {
        audio: {
          content: audioBuffer.toString('base64'),
        },
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode: 'en-US',
          alternativeLanguageCodes: ['hi-IN', 'ta-IN', 'te-IN', 'bn-IN', 'mr-IN', 'gu-IN', 'kn-IN', 'ml-IN', 'pa-IN'],
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: true,
        },
      };

      const [response] = await speechClient.recognize(request);
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');

      // Detect the most likely language
      const languageCode = response.results[0]?.languageCode || 'en';
      
      return {
        transcription,
        detectedLanguage: languageCode,
        confidence: response.results[0]?.alternatives[0]?.confidence || 0
      };
    } catch (error) {
      console.error('Speech recognition error:', error);
      throw new Error('Speech recognition failed');
    }
  }

  // Translate text to English
  async translateToEnglish(text, sourceLanguage) {
    try {
      if (sourceLanguage === 'en') {
        return { translatedText: text, sourceLanguage: 'en' };
      }

      const request = {
        parent: `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/locations/global`,
        contents: [text],
        mimeType: 'text/plain',
        sourceLanguageCode: sourceLanguage,
        targetLanguageCode: 'en',
      };

      const [response] = await translateClient.translateText(request);
      const translation = response.translations[0];

      return {
        translatedText: translation.translatedText,
        sourceLanguage: sourceLanguage,
        originalText: text
      };
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error('Translation failed');
    }
  }

  // Process voice input (speech to text + translation)
  async processVoiceInput(audioBuffer) {
    try {
      // Step 1: Convert speech to text and detect language
      const speechResult = await this.detectLanguage(audioBuffer);
      
      // Step 2: Translate to English if not already in English
      const translationResult = await this.translateToEnglish(
        speechResult.transcription,
        speechResult.detectedLanguage
      );

      return {
        originalText: speechResult.transcription,
        translatedText: translationResult.translatedText,
        detectedLanguage: speechResult.detectedLanguage,
        confidence: speechResult.confidence,
        languageName: this.supportedLanguages[speechResult.detectedLanguage] || 'Unknown'
      };
    } catch (error) {
      console.error('Voice processing error:', error);
      throw error;
    }
  }

  // Get supported languages
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  // Validate if language is supported
  isLanguageSupported(languageCode) {
    return this.supportedLanguages.hasOwnProperty(languageCode);
  }
}

module.exports = new VoiceService(); 