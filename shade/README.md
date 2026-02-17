# ReelForge Agent - AI Video Editing System

Production-ready AI video editing agent for creating viral short-form videos with NEAR payments integration.

## Features

### 🎬 Advanced Video Editing
- **12+ Transition Types**: fade, crossfade, dissolve, wipe, slide, zoom, blur
- **13+ Visual Effects**: brightness, contrast, saturation, blur, sharpen, vignette, warm, cool, dramatic, cinema, VHS, grain, fade to B&W
- **Text Animations**: static, fade in, typewriter, slide up, bounce
- **Multi-track Editing**: Video, audio, and text layers

### 🎵 Audio Analysis & Beat Sync
- BPM detection
- Beat marker identification
- Cut points suggestion based on beats
- Mood and energy analysis
- Music-synced transitions

### 🤖 AI-Powered Editing
- OpenRouter LLM integration (Claude, GPT models)
- Automatic editing plan generation
- Beat-synchronized transitions
- Viral content strategies
- Multiple style generation (viral, cinematic, fun, educational, dramatic)
- Plan refinement based on feedback

### 🎵 Built-in Music Library
- 12+ curated royalty-free tracks
- Search by name, artist, genre, mood
- BPM-based filtering
- Mood-based recommendations

### 📱 Multi-Reel Generation
- Generate multiple variations at once
- Different styles for each variation
- Batch processing

### 💳 NEAR Payments
- Credit-based system for video processing
- Real NEAR token transfers
- Multiple wallet support (My NEAR Wallet, Bitte, Meteor, etc.)

## Quick Start

### 1. Install FFmpeg

```bash
cd shade
npm run setup
```

Or manually:
- **macOS**: `brew install ffmpeg`
- **Linux**: `sudo apt install ffmpeg`

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add:
OPENROUTER_API_KEY=your_openrouter_key
```

### 3. Start the Agent

```bash
npm run dev
```

### 4. Start the Web App

```bash
cd ../web
npm run dev
```

## Project Structure

```
retro-agent/
├── shade/                    # Shade Agent Backend
│   ├── src/
│   │   ├── index.ts         # Main server
│   │   ├── routes/          # API routes
│   │   │   ├── videoProcessing.ts
│   │   │   ├── aiEditing.ts
│   │   │   └── musicLibrary.ts
│   │   ├── services/        # Core services
│   │   │   ├── videoEditor.ts
│   │   │   ├── audioAnalyzer.ts
│   │   │   ├── aiEditor.ts
│   │   │   └── reelGenerator.ts
│   │   └── utils/
│   │       ├── editingTools.ts
│   │       └── musicLibrary.ts
│   └── setup-ffmpeg.sh
│
└── web/                      # React Frontend
    └── src/
        ├── components/        # UI components
        ├── contexts/         # React contexts
        ├── stores/           # Zustand stores
        └── lib/              # API client
```

## API Endpoints

### Video Processing

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/video/process` | POST | Generate a reel |
| `/api/video/status/:jobId` | GET | Get job status |
| `/api/video/jobs` | GET | List all jobs |
| `/api/video/analyze-audio` | POST | Analyze audio beats |

### AI Editing

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/edit` | POST | Generate editing plan |
| `/api/ai/refine` | POST | Refine existing plan |

### Music Library

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/music/tracks` | GET | List all tracks |
| `/api/music/search` | GET | Search tracks |
| `/api/music/moods` | GET | List moods |

### NEAR Integration

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/near-payment/transfer` | POST | Send NEAR payment |
| `/api/near-account` | GET | Get NEAR account info |

## Production Deployment

### TEE (Phala Cloud)

```bash
# Configure .env with TEE settings
# Run the Shade Agent CLI
shade-agent-cli

# Your app will be deployed to a TEE
```

### Docker

```bash
npm run docker:build
```

## Tech Stack

- **Backend**: Hono, TypeScript
- **Video Processing**: FFmpeg
- **AI**: OpenRouter (Claude, GPT)
- **Frontend**: React, TypeScript, TailwindCSS
- **State**: Zustand
- **Payments**: NEAR Protocol
- **Wallet**: @near-wallet-selector

## License

MIT
