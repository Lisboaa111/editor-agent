import { Hono } from "hono";
import { createTikTokStyleEdit } from "../services/tikTokEditor";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

const app = new Hono();

const jobs = new Map<string, {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  progressMessage: string;
  outputUrls: string[];
  errors: string[];
  createdAt: number;
  completedAt?: number;
}>();

interface VideoRequest {
  clips: Array<{
    id: string;
    mediaUrl: string;
    mediaName: string;
    serverPath?: string;
    startTime: number;
    endTime: number;
    duration: number;
    type: 'video' | 'image' | 'audio';
  }>;
  musicUrl?: string;
  length?: number;
}

app.post("/process", async (c) => {
  try {
    const body = await c.req.json() as VideoRequest;
    const { clips, musicUrl, length } = body;

    if (!clips || clips.length === 0) {
      return c.json({ error: "No clips provided" }, 400);
    }

    console.log("🎬 Starting TikTok video generation...");

    const outputDir = "./output";
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const videoClip = clips[0];
    const inputPath = videoClip.serverPath || videoClip.mediaUrl;
    const actualInputPath = inputPath.startsWith('/media/') ? '.' + inputPath : inputPath;
    
    let musicPath: string | undefined;
    if (musicUrl) {
      musicPath = musicUrl.startsWith('/media/') ? '.' + musicUrl : musicUrl;
    }

    const jobId = uuidv4();
    
    const job = {
      id: jobId,
      status: 'processing' as const,
      progress: 0,
      progressMessage: 'Starting TikTok edit...',
      outputUrls: [] as string[],
      errors: [] as string[],
      createdAt: Date.now(),
    };
    jobs.set(jobId, job);

    (async () => {
      try {
        const directOutput = path.join(outputDir, `${jobId}.mp4`);
        const job = jobs.get(jobId);
        if (job) job.progressMessage = 'Creating quick cuts...';
        
        await createTikTokStyleEdit({
          inputPath: actualInputPath,
          outputPath: directOutput,
          targetDuration: length || 15,
          musicPath: musicPath,
          musicVolume: 0.6,
        });
        
        if (job) {
          job.status = 'completed';
          job.progress = 100;
          job.progressMessage = 'Complete!';
          job.outputUrls = [`/output/${path.basename(directOutput)}`];
          job.completedAt = Date.now();
        }
        console.log("✅ TikTok video generated:", directOutput);
      } catch (error: any) {
        const job = jobs.get(jobId);
        if (job) {
          job.status = 'failed';
          job.errors.push(error.message);
        }
        console.error("❌ TikTok generation failed:", error);
      }
    })();

    return c.json({
      success: true,
      jobId,
      status: "processing",
      message: "TikTok-style video generation started",
    });

  } catch (error) {
    console.error("Video processing error:", error);
    return c.json({ error: "Failed to start video processing" }, 500);
  }
});

app.get("/status/:jobId", async (c) => {
  const jobId = c.req.param("jobId");
  const job = jobs.get(jobId);
  
  if (!job) {
    return c.json({ error: "Job not found" }, 404);
  }
  
  return c.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    message: job.progressMessage,
    outputUrls: job.outputUrls,
    errors: job.errors,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
  });
});

app.get("/jobs", async (c) => {
  return c.json({
    jobs: Array.from(jobs.values()).map(job => ({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      outputCount: job.outputUrls.length,
      createdAt: job.createdAt,
    })),
  });
});

app.get("/download/:jobId", async (c) => {
  const jobId = c.req.param("jobId");
  const job = jobs.get(jobId);
  
  if (!job) {
    return c.json({ error: "Job not found" }, 404);
  }
  
  if (job.status !== 'completed' || job.outputUrls.length === 0) {
    return c.json({ error: "Video not ready" }, 400);
  }
  
  return c.redirect(job.outputUrls[0]);
});

app.post("/analyze-audio", async (c) => {
  return c.json({
    success: true,
    analysis: {
      duration: 30,
      bpm: 120,
      beats: [0.5, 1.0, 1.5, 2.0, 2.5, 3.0],
      energy: "high",
      mood: "upbeat",
    },
  });
});

export default app;
