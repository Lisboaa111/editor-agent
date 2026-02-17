import { Hono } from "hono";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = new Hono();

const getOpenRouterKey = () => process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

interface TimelineClip {
  id: string;
  mediaUrl?: string;
  mediaName?: string;
  startTime: number;
  endTime: number;
  duration: number;
  type?: 'video' | 'image' | 'audio';
}

interface EditRequest {
  clips: TimelineClip[];
  textOverlays?: Array<{
    text: string;
    startTime: number;
    endTime: number;
  }>;
  prompt?: string;
  quality?: string;
  format?: string;
}

const systemPrompt = `You are an expert video editor AI for creating engaging short-form videos (Reels, TikToks, YouTube Shorts). 

Your job is to analyze the user's media clips and prompt, then create a detailed video editing plan.

Guidelines:
- Cut videos to keep only the best moments
- Add smooth transitions between clips (fade, crossfade, cut)
- Suggest text overlays with timing that matches the action
- Recommend pacing that builds excitement
- Keep transitions short (0.3-0.5s) for short-form content
- Consider adding background music suggestions
- Output must be a JSON editing plan

Return a JSON object with this structure:
{
  "edits": [
    {
      "clipIndex": 0,
      "action": "cut" | "keep" | "trim" | "transition",
      "startTime": number,
      "endTime": number,
      "transition": "none" | "fade" | "crossfade" | "wipe",
      "transitionDuration": number
    }
  ],
  "textOverlays": [
    {
      "text": "string",
      "startTime": number,
      "endTime": number,
      "position": "top" | "center" | "bottom",
      "style": "modern" | "classic" | "dynamic"
    }
  ],
  "music": {
    "suggestedMood": "energetic" | "calm" | "dramatic" | "fun",
    "bpm": number
  },
  "pacing": "fast" | "medium" | "slow",
  "summary": "brief description of the editing approach"
}`;

app.post("/edit", async (c) => {
  try {
    const body = await c.req.json() as EditRequest;
    const { clips, textOverlays, prompt, quality, format } = body;

    const OPENROUTER_API_KEY = getOpenRouterKey();
    
    if (!OPENROUTER_API_KEY) {
      return c.json({ error: "OpenRouter API key not configured. Add OPENROUTER_API_KEY to .env file" }, 500);
    }

    if (!clips || clips.length === 0) {
      return c.json({ error: "No clips provided" }, 400);
    }

    const openai = new OpenAI({
      baseURL: OPENROUTER_BASE_URL,
      apiKey: OPENROUTER_API_KEY,
    });

    const mediaDescription = clips.map((clip, i) => 
      `Clip ${i + 1}: "${clip.mediaName || 'Untitled'}" - ${clip.duration}s (${clip.startTime}s - ${clip.endTime}s)`
    ).join("\n");

    const userMessage = prompt 
      ? `User request: "${prompt}"\n\nMedia:\n${mediaDescription}`
      : `Create an engaging short video edit.\n\nMedia:\n${mediaDescription}`;

    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-3.1-8b-instruct",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const editingPlan = completion.choices[0]?.message?.content;

    if (!editingPlan) {
      return c.json({ error: "Failed to generate editing plan" }, 500);
    }

    const trimmed = editingPlan.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      console.error("AI returned non-JSON response:", trimmed);
      return c.json({ error: "AI returned invalid response. Please try again." }, 500);
    }

    return c.json({
      success: true,
      plan: JSON.parse(trimmed),
      message: "Editing plan generated successfully"
    });

  } catch (error) {
    console.error("AI editing error:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return c.json({ error: `Failed to generate editing plan: ${errMsg}` }, 500);
  }
});

app.post("/refine", async (c) => {
  try {
    const body = await c.req.json() as {
      currentPlan: object;
      feedback: string;
    };

    const { currentPlan, feedback } = body;

    const OPENROUTER_API_KEY = getOpenRouterKey();
    
    if (!OPENROUTER_API_KEY) {
      return c.json({ error: "OpenRouter API key not configured" }, 500);
    }

    const openai = new OpenAI({
      baseURL: OPENROUTER_BASE_URL,
      apiKey: OPENROUTER_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-3.1-8b-instruct",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Current editing plan:\n${JSON.stringify(currentPlan, null, 2)}\n\nUser feedback: "${feedback}"\n\nRefine the editing plan based on this feedback. Return the refined plan as JSON.` }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const refinedPlan = completion.choices[0]?.message?.content;

    if (!refinedPlan) {
      return c.json({ error: "Failed to refine editing plan" }, 500);
    }

    return c.json({
      success: true,
      plan: JSON.parse(refinedPlan),
      message: "Editing plan refined successfully"
    });

  } catch (error) {
    console.error("AI refine error:", error);
    return c.json({ error: "Failed to refine editing plan" }, 500);
  }
});

export default app;
