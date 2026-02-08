# Simple Shade Agent

A minimal Shade Agent template demonstrating the core concepts.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.development.local.example` to `.env.development.local` and fill in your values:

```bash
cp .env.development.local.example .env.development.local
```

### 3. Run Locally (Development)

```bash
# Terminal 1: Start the Shade Agent CLI
shade-agent-cli

# Terminal 2: Start your agent
npm run dev
```

### 4. Deploy to TEE (Production)

Update `.env.development.local` with:
```
NEXT_PUBLIC_contractId=ac-sandbox.your-account.testnet
```

Then run:
```bash
shade-agent-cli
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agent-account` | GET | Get the agent's NEAR account ID |
| `/api/agent-info` | GET | Get code hash and attestation checksum |
| `/api/balance` | GET | Get agent's NEAR balance |
| `/api/sign-transaction` | POST | Request signature for multichain transaction |
| `/api/health` | GET | Health check |

## Example: Request Transaction Signature

```bash
curl -X POST http://localhost:3000/api/sign-transaction \
  -H "Content-Type: application/json" \
  -d '{
    "path": "ethereum-1",
    "payload": "0x1234...",
    "keyType": "Ecdsa"
  }'
```

## Project Structure

```
agent/
├── src/
│   └── index.ts          # Main agent application
├── Dockerfile            # Docker image definition
├── docker-compose.yaml  # Multi-container setup
├── package.json         # Node dependencies
├── tsconfig.json        # TypeScript config
└── .env.development.local.example  # Environment template
```

## Requirements

- Node.js 18+
- Docker
- NEAR CLI
- Shade Agent CLI: `npm i -g @neardefi/shade-agent-cli`
- NEAR testnet account
- Phala Cloud account (for TEE deployment)
