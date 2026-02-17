import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

import videoProcessing from "./routes/videoProcessing";
import aiEditing from "./routes/aiEditing";
import musicLibrary from "./routes/musicLibrary";
import mediaUpload from "./routes/mediaUpload";

const app = new Hono();

app.use(cors());

// Serve processed videos
app.use("/output/*", serveStatic({ root: "./" }));
app.use("/media/*", serveStatic({ root: "./" }));

app.get("/", (c) => c.json({ 
  message: "ReelForge Agent API",
  version: "2.0",
  endpoints: {
    video: {
      process: "POST /api/video/process",
      status: "GET /api/video/status/:jobId",
      jobs: "GET /api/video/jobs",
      analyzeAudio: "POST /api/video/analyze-audio",
    },
    ai: {
      edit: "POST /api/ai/edit",
      refine: "POST /api/ai/refine",
      generateVariations: "POST /api/ai/generate-variations",
    },
    files: {
      output: "/output/:filename",
      media: "/media/:filename",
    }
  }
}));

app.route("/api/video", videoProcessing);
app.route("/api/ai", aiEditing);
app.route("/api/music", musicLibrary);
app.route("/api/media", mediaUpload);

// Health check with system info
app.get("/health", async (c) => {
  return c.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      ffmpeg: "checking...",
      openrouter: !!process.env.OPENROUTER_API_KEY ? "configured" : "not configured",
    }
  });
});

const port = Number(process.env.PORT || "3000");

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    ReelForge Agent API v2.0                  ║
╠══════════════════════════════════════════════════════════════╣
║  Server:     http://localhost:${port}                        ║
║  Health:     http://localhost:${port}/health                ║
╠══════════════════════════════════════════════════════════════╣
║  📹 Video Endpoints                                        ║
║     POST /api/video/process     - Generate reel              ║
║     GET  /api/video/status/:id - Check job status          ║
║     GET  /api/video/jobs      - List all jobs             ║
║     POST /api/video/analyze-audio - Analyze audio beats    ║
╠══════════════════════════════════════════════════════════════╣
║  🤖 AI Endpoints                                           ║
║     POST /api/ai/edit        - Generate editing plan        ║
║     POST /api/ai/refine      - Refine editing plan         ║
╠══════════════════════════════════════════════════════════════╣
║  📁 File Serving                                            ║
║     /output/:filename       - Download processed videos     ║
║     /media/:filename        - Access uploaded media        ║
╚══════════════════════════════════════════════════════════════╝
`);

serve({ fetch: app.fetch, port });
