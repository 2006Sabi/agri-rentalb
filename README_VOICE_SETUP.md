# Voice & Multilingual Input Setup Guide

This guide explains how to set up the voice recognition and translation features for the AgriRental application.

## Features

- **Speech Recognition**: Convert voice to text using Google Speech-to-Text API
- **Language Detection**: Automatically detect spoken language
- **Translation**: Translate Indian languages to English
- **Supported Languages**: English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi

## Prerequisites

1. Google Cloud Platform account
2. Google Cloud project with billing enabled
3. Node.js and npm installed

## Setup Instructions

### 1. Google Cloud Project Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Speech-to-Text API
   - Cloud Translation API

### 2. Service Account Setup

1. In Google Cloud Console, go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Give it a name like "agri-rental-voice-api"
4. Grant the following roles:
   - Speech-to-Text API User
   - Cloud Translation API User
5. Create and download the JSON key file

### 3. Environment Configuration

Create a `.env` file in the `server` directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/sece

# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=your_google_cloud_project_id
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 4. Install Dependencies

```bash
cd server
npm install
```

### 5. Place Service Account Key

Place your downloaded service account JSON key file in the server directory and update the `GOOGLE_APPLICATION_CREDENTIALS` path in your `.env` file.

## API Endpoints

### Voice Processing
- `POST /api/voice/process` - Process voice input (speech to text + translation)
- `GET /api/voice/languages` - Get supported languages
- `POST /api/voice/translate` - Translate text to English
- `GET /api/voice/test` - Test voice API functionality

### Request Format

For voice processing:
```javascript
const formData = new FormData();
formData.append('audio', audioBlob, 'voice-input.webm');

fetch('/api/voice/process', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### Response Format

```json
{
  "success": true,
  "data": {
    "originalText": "मैं चावल उगाना चाहता हूं",
    "translatedText": "I want to grow rice",
    "detectedLanguage": "hi",
    "confidence": 0.95,
    "languageName": "Hindi"
  }
}
```

## Frontend Integration

The voice input component is integrated into the AI Crop Planner page. Users can:

1. Click "Show Voice Input" to reveal the voice input interface
2. Click the microphone button to start recording
3. Speak in any supported Indian language
4. View the original text and English translation
5. Use the translated text to auto-fill form fields

## Supported Voice Commands

The system can automatically extract information from voice input:

- **Crops**: "rice", "wheat", "maize", "cotton", etc.
- **Regions**: "Tamil Nadu", "Punjab", "Maharashtra", etc.
- **Soil Types**: "clay", "sandy", "loamy", etc.
- **Farm Size**: "10 acres", "5 hectares", etc.

## Troubleshooting

### Common Issues

1. **Microphone Permission Denied**
   - Ensure the browser has microphone permissions
   - Check if HTTPS is enabled (required for microphone access)

2. **Google Cloud API Errors**
   - Verify service account credentials are correct
   - Check if APIs are enabled in Google Cloud Console
   - Ensure billing is enabled for the project

3. **Audio Format Issues**
   - The system expects WebM audio format
   - Ensure the browser supports MediaRecorder API

### Testing

Use the test endpoint to verify setup:
```bash
curl http://localhost:5000/api/voice/test
```

## Security Considerations

1. **API Key Security**: Never commit service account keys to version control
2. **Rate Limiting**: Consider implementing rate limiting for voice API calls
3. **Audio Storage**: Audio files are processed in memory and not stored
4. **User Authentication**: Voice API endpoints require authentication

## Cost Considerations

Google Cloud APIs have usage-based pricing:
- Speech-to-Text: ~$0.006 per 15 seconds
- Cloud Translation: ~$20 per million characters

Monitor usage in Google Cloud Console to manage costs.

## Future Enhancements

- Offline speech recognition for basic commands
- Voice feedback in local languages
- Integration with other form pages
- Voice-based navigation
- Custom language models for agricultural terms 