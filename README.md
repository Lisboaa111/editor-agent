# RetroForge - AI Video Editing Agent

An AI-powered TikTok/Reels video editing agent built with NEAR Protocol integration and Shade Agent technology.

## What is RetroForge?

RetroForge is a decentralized AI video editing platform that allows users to:
- Upload video clips
- Select background music from a library
- Generate TikTok-style vertical video edits automatically
- Pay using NEAR tokens

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Media    │  │ Timeline │  │ Export   │  │ NEAR Wallet │  │
│  │ Library  │  │ Editor   │  │ Panel    │  │ Integration │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │
└───────┼────────────┼────────────┼───────────────┼──────────┘
        │            │            │               │
        └────────────┴────────────┴───────────────┘
                              │
                     HTTP API Calls
                              │
        ┌─────────────────────┴─────────────────────┐
        │              Backend (Hono/Node)          │
        │  ┌──────────────────────────────────────┐ │
        │  │         Video Processing             │ │
        │  │  • TikTok-style editing              │ │
        │  │  • FFmpeg processing                │ │
        │  │  • Background music mixing         │ │
        │  └──────────────────────────────────────┘ │
        │  ┌──────────────────────────────────────┐ │
        │  │         AI Integration               │ │
        │  │  • OpenRouter API                   │ │
        │  │  • Editing plan generation         │ │
        │  │  • Audio beat detection            │ │
        │  └──────────────────────────────────────┘ │
        │  ┌──────────────────────────────────────┐ │
        │  │         NEAR Integration              │ │
        │  │  • Payment processing               │ │
        │  │  • Agent account management         │ │
        │  └──────────────────────────────────────┘ │
        └────────────────────────────────────────────┘
```

## How NEAR Protocol is Utilized

### 1. Payment System

The platform uses NEAR tokens as payment for video processing:

- **Credit System**: Users purchase credits with NEAR
- **Deduction**: Credits are deducted when generating videos
- **Agent Account**: The Shade Agent has its own NEAR account for receiving payments

```typescript
// From shade/src/routes/transaction.ts
// NEAR payment is processed through the agent's account
const result = await near transfer({
  to: AGENT_ACCOUNT_ID,
  amount: toYoctoNEAR(price)
});
```

### 2. Agent Account

The Shade Agent operates its own NEAR account:
- Receives payments from users
- Manages credit balances
- Tracks transaction history

```
API Endpoint: /api/near-payment/transfer
```

### 3. Wallet Integration

Users connect their NEAR wallet (My NEAR Wallet, Bitte, Meteor, etc.) through `@near-wallet-selector`:

```typescript
// From web/src/contexts/NearWallet.tsx
const { signIn, signOut, wallet } = useWallet();
```

## What is a Shade Agent?

A **Shade Agent** is a decentralized AI agent that runs inside a **Trusted Execution Environment (TEE)** powered by Phala Network.

### Key Concepts

1. **TEE (Trusted Execution Environment)**
   - Secure hardware enclave for running code
   - Code execution is verified and attestable
   - Sensitive operations (signing transactions) happen securely

2. **Attestation**
   - Proof that the agent code hasn't been tampered with
   - Users can verify the agent is running legitimate code

3. **Agent Account**
   - Has its own NEAR account (e.g., `retro-agent.testnet`)
   - Can receive payments
   - Can sign transactions on behalf of users (with permission)

## How Shade Agent Works in This Project

### 1. Agent Setup

```bash
# Install Shade Agent CLI
npm i -g @neardefi/shade-agent-cli

# Start the agent
shade-agent-cli
```

### 2. Agent Code Structure

```typescript
// From agent/src/index.ts
app.post("/api/sign-transaction", async (c) => {
  // Agent signs transactions inside TEE
  const signature = await agent.signTransaction(tx);
  return c.json({ signature });
});
```

### 3. Key Agent Features Used

| Feature | Description |
|---------|-------------|
| Account Info | Get agent's NEAR account ID and balance |
| Transaction Signing | Sign payment transactions securely |
| Health Check | Verify agent is running in TEE |

### 4. Deployment Flow

```
Development                 Production (TEE)
     │                           │
     ▼                           ▼
Local Server           ┌─────────────────┐
     │                 │  Phala Cloud    │
     │                 │  (TEE Cluster)  │
     │                 │        │        │
     ▼                 │        ▼        │
Shade Agent CLI  ──────▶│   Agent Runs    │
     │                  │   Securely      │
     ▼                  │                 │
Test on Testnet         └─────────────────┘
```

## Video Processing Pipeline

```
User Uploads Video
        │
        ▼
Backend Receives Request
        │
        ├──▶ FFmpeg Cuts Video into 1-sec clips
        │
        ├──▶ Each clip: Scale to 1080x1920 (vertical)
        │
        ├──▶ Add effects (brightness, contrast, etc.)
        │
        ├──▶ Concatenate clips
        │
        └──▶ Mix with background music
                │
                ▼
        Generated Video Ready
```

### Key Files

| File | Purpose |
|------|---------|
| `shade/src/routes/videoProcessing.ts` | Main video API endpoint |
| `shade/src/services/tikTokEditor.ts` | FFmpeg video processing |
| `shade/src/services/audioAnalyzer.ts` | Beat detection with librosa |
| `shade/src/services/aiEditor.ts` | AI editing plan generation |

## Quick Start

### Prerequisites
- Node.js 18+
- FFmpeg installed
- NEAR wallet (testnet)
- OpenRouter API key (for AI features)

### Installation

```bash
# 1. Install dependencies
cd shade && npm install
cd ../web && npm install

# 2. Configure environment
cd ../shade
cp .env.example .env
# Edit .env with your keys:
# OPENROUTER_API_KEY=your_key

# 3. Start backend
cd shade && npm run dev

# 4. Start frontend
cd web && npm run dev
```

### Usage

1. Open http://localhost:5173
2. Connect NEAR wallet
3. Upload video clip(s)
4. Select background music (optional)
5. Click "Generate Video"
6. Download your TikTok-style edit

## API Reference

### Video Processing
- `POST /api/video/process` - Generate video
- `GET /api/video/status/:jobId` - Check status

### NEAR Integration
- `POST /api/near-payment/transfer` - Transfer NEAR
- `GET /api/near-account` - Get account info

### Music Library
- `GET /api/music/tracks` - List tracks
- `GET /api/music/search?q=query` - Search

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Hono, TypeScript, Node.js |
| Video | FFmpeg |
| AI | OpenRouter (Llama, Claude) |
| Audio Analysis | Python (librosa), FFmpeg |
| Frontend | React, TailwindCSS, Zustand |
| Blockchain | NEAR Protocol |
| TEE | Phala Network (Shade Agent) |
| Wallet | @near-wallet-selector |

## Project Structure

```
retro-agent/
├── shade/                    # Shade Agent Backend
│   ├── src/
│   │   ├── index.ts         # Main server entry
│   │   ├── routes/
│   │   │   ├── videoProcessing.ts   # Video API
│   │   │   ├── aiEditing.ts         # AI planning
│   │   │   ├── musicLibrary.ts      # Music tracks
│   │   │   └── transaction.ts       # NEAR payments
│   │   ├── services/
│   │   │   ├── tikTokEditor.ts      # Video editing
│   │   │   ├── audioAnalyzer.ts     # Beat detection
│   │   │   ├── aiEditor.ts          # AI plan generation
│   │   │   └── reelGenerator.ts     # Orchestration
│   │   └── utils/
│   │       └── musicLibrary.ts      # Track data
│   └── scripts/
│       └── beat_detector.py         # Python beat detection
│
├── web/                       # React Frontend
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── contexts/         # NEAR wallet context
│   │   ├── stores/           # Zustand state
│   │   ├── lib/              # API client
│   │   └── types/            # TypeScript types
│   └── package.json
│
└── agent/                     # Shade Agent Template
    ├── src/
    │   └── index.ts          # Agent endpoints
    └── Dockerfile
```

## Security Considerations

1. **TEE Execution**: Agent code runs in Phala's TEE clusters
2. **Attestation**: Each execution can be verified
3. **NEAR Key Separation**: Agent has separate signing keys
4. **No Private Keys in Code**: All secrets in environment variables

## License

MIT