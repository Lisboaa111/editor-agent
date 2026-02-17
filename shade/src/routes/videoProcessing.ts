import { Hono } from "hono";
import { reelGenerator, type MediaFile, type ReelRequest } from "../services/reelGenerator";
import { analyzeAudio } from "../services/audioAnalyzer";

const app = new Hono();

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
  audio?: {
    id: string;
    mediaUrl: string;
    mediaName: string;
    duration: number;
    type: 'audio';
  };
  textOverlays?: Array<{
    text: string;
    startTime: number;
    endTime: number;
  }>;
  quality?: string;
  length?: number;
  format?: string;
  hasAudio?: boolean;
  prompt?: string;
  targetStyle?: 'viral' | 'cinematic' | 'fun' | 'educational' | 'dramatic';
  aspectRatio?: '9:16' | '16:9' | '1:1';
  generateVariations?: number;
  plan?: object;
}

app.post("/process", async (c) => {
  try {
    const body = await c.req.json() as VideoRequest;
    const { clips, audio, prompt, quality, length, format, hasAudio, targetStyle, aspectRatio, generateVariations, plan } = body;

    if (!clips || clips.length === 0) {
      return c.json({ error: "No clips provided" }, 400);
    }

    // Map clips to media files
    const mediaClips: MediaFile[] = clips.map(clip => ({
      id: clip.id,
      name: clip.mediaName,
      path: clip.serverPath || clip.mediaUrl,
      duration: clip.duration,
      type: clip.type,
    }));

    // Map audio
    let audioFile: MediaFile | undefined;
    if (audio) {
      audioFile = {
        id: audio.id,
        name: audio.mediaName,
        path: audio.mediaUrl || '',
        duration: audio.duration,
        type: 'audio',
      };
    }

    // Generate reel
    const request: ReelRequest = {
      clips: mediaClips,
      audio: audioFile,
      prompt,
      targetDuration: length,
      targetStyle: targetStyle || 'viral',
      aspectRatio: aspectRatio || '9:16',
      generateVariations,
    };

    const jobId = await reelGenerator.generateReel(request);

    return c.json({
      success: true,
      jobId,
      status: "processing",
      message: "Reel generation started",
    });

  } catch (error) {
    console.error("Video processing error:", error);
    return c.json({ error: "Failed to start video processing" }, 500);
  }
});

app.get("/status/:jobId", async (c) => {
  const jobId = c.req.param("jobId");
  const job = reelGenerator.getJob(jobId);
  
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
  const jobs = reelGenerator.listJobs();
  
  return c.json({
    jobs: jobs.map(job => ({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      message: job.progressMessage,
      outputCount: job.outputUrls.length,
      createdAt: job.createdAt,
    })),
  });
});

app.delete("/jobs/:jobId", async (c) => {
  const jobId = c.req.param("jobId");
  const deleted = reelGenerator.deleteJob(jobId);
  
  if (!deleted) {
    return c.json({ error: "Job not found" }, 404);
  }
  
  return c.json({ success: true, message: "Job deleted" });
});

app.post("/analyze-audio", async (c) => {
  try {
    const body = await c.req.json();
    const { audioUrl } = body;

    if (!audioUrl) {
      return c.json({ error: "audioUrl required" }, 400);
    }

    // In production, download the audio first
    // For now, return mock analysis
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
  } catch (error) {
    console.error("Audio analysis error:", error);
    return c.json({ error: "Failed to analyze audio" }, 500);
  }
});

app.get("/download/:jobId", async (c) => {
  const jobId = c.req.param("jobId");
  const job = reelGenerator.getJob(jobId);
  
  if (!job) {
    return c.json({ error: "Job not found" }, 404);
  }
  
  if (job.status !== 'completed' || job.outputUrls.length === 0) {
    return c.json({ error: "Video not ready" }, 400);
  }
  
  const outputUrl = job.outputUrls[0];
  return c.redirect(outputUrl);
});

export default app;
