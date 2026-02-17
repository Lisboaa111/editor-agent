import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

const advancedSystemPrompt = `You are an expert video editor AI for creating viral short-form videos (TikTok, Reels, YouTube Shorts).

## Your Capabilities

You have access to advanced editing tools:
- **Transitions**: fade, crossfade, dissolve, wipe_left, wipe_right, wipe_up, wipe_down, slide_left, slide_right, zoom_in, zoom_out, blur, glitch, rgb_split, vhs
- **Effects**: brightness, contrast, saturation, blur, sharpen, vignette, grain, chromatic_aberration, vhs, cinema, warm, cool, dramatic, fade_bw
- **Text Animations**: none, fade_in, typewriter, slide_up, bounce
- **Music Sync**: beat detection, cut on beat, zoom on beat, transition on beat
- **Pacing**: fast (quick cuts), medium (balanced), slow (cinematic)

## Editing Strategies

### For Viral Potential
1. Start with a hook in first 2 seconds
2. Use quick cuts to maintain attention
3. Add text overlays for key moments
4. Match cuts to music beats
5. Use energetic transitions between clips
6. End with a call-to-action or leaving moment

### Beat Synchronization
- Cut video clips on audio beats
- Add zoom effects on strong beats
- Sync transitions to chorus/hook
- Use rhythm to drive pacing

### Visual Style
- High contrast, saturated colors for engagement
- Add subtle effects (vignette, grain) for cinematic feel
- Use text animations to highlight key points
- Keep text readable on mobile (large font, high contrast)

## Output Format

Return a JSON editing plan:
{
  "strategy": "Description of the editing approach",
  "hooks": ["Hook suggestions for viral start"],
  "clips": [
    {
      "sourceIndex": 0,
      "startTime": 0,
      "endTime": 5,
      "trimStart": 0,
      "trimEnd": 5,
      "speed": 1,
      "reverse": false,
      "effects": [
        { "type": "contrast", "intensity": 0.3 },
        { "type": "saturation", "intensity": 0.2 }
      ]
    }
  ],
  "transitions": [
    {
      "fromClip": 0,
      "toClip": 1,
      "type": "zoom_in",
      "duration": 0.5,
      "syncToBeat": true
    }
  ],
  "textOverlays": [
    {
      "text": "YOUR TEXT HERE",
      "startTime": 0,
      "endTime": 3,
      "position": "center",
      "animation": "bounce",
      "style": "bold"
    }
  ],
  "audio": {
    "backgroundMusic": "auto-detect-or-generate",
    "volume": 0.3,
    "originalVolume": 0.8,
    "beatSync": true
  },
  "pacing": "fast",
  "targetDuration": 15,
  "aspectRatio": "9:16"
}

Guidelines:
- For 15-30 second reels, use 3-8 clips
- Keep text overlays 2-4 seconds max
- Use beat-synced transitions for music
- Add 1-2 hook text overlays at start
- Suggest effects that enhance mood
- Keep transitions snappy (0.3-0.5s)`;

export interface AdvancedClipInput {
  id: string;
  name: string;
  url?: string;
  duration: number;
  type: 'video' | 'image' | 'audio';
  hasAudio?: boolean;
}

export interface AudioAnalysis {
  duration: number;
  bpm: number;
  beats: number[];
  mood: string;
  energy: string;
}

export interface AdvancedEditingRequest {
  clips: AdvancedClipInput[];
  audio?: AdvancedClipInput;
  audioAnalysis?: AudioAnalysis;
  prompt?: string;
  targetDuration?: number;
  targetStyle?: 'viral' | 'cinematic' | 'fun' | 'educational' | 'dramatic';
  aspectRatio?: '9:16' | '16:9' | '1:1';
}

export async function generateAdvancedEditingPlan(request: AdvancedEditingRequest): Promise<object> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key not configured");
  }

  const openai = new OpenAI({
    baseURL: OPENROUTER_BASE_URL,
    apiKey: OPENROUTER_API_KEY,
  });

  // Build context about available media
  const mediaContext = request.clips.map((clip, i) => 
    `Clip ${i + 1}: "${clip.name}" - ${clip.duration}s (${clip.type})`
  ).join("\n");

  let audioContext = "";
  if (request.audio) {
    audioContext = `\n\nBackground Audio: "${request.audio.name}" - ${request.audio.duration}s`;
    if (request.audioAnalysis) {
      audioContext += `\n- BPM: ${request.audioAnalysis.bpm}
      - Detected beats: ${request.audioAnalysis.beats.slice(0, 20).join(", ")}...
      - Mood: ${request.audioAnalysis.mood}
      - Energy: ${request.audioAnalysis.energy}`;
    }
  }

  const styleGuide = {
    viral: "High energy, quick cuts, text overlays, trending effects, engaging hooks",
    cinematic: "Slow pacing, dramatic effects, color grading, smooth transitions",
    fun: "Playful edits, upbeat music sync, bouncy text, energetic transitions",
    educational: "Clear text, focused content, minimal effects, professional look",
    dramatic: "Dark effects, intense music, powerful transitions, emotional pacing"
  };

  const userMessage = `Create an advanced viral-ready video edit.

Target Duration: ${request.targetDuration || 15} seconds
Target Style: ${request.targetStyle || 'viral'}
Aspect Ratio: ${request.aspectRatio || '9:16'}

Available Media:
${mediaContext}
${audioContext}

${request.prompt ? `User Request: "${request.prompt}"` : ""}

${styleGuide[request.targetStyle || 'viral']}

Generate a complete editing plan that will go viral. Include beat-synced transitions, engaging text overlays, and effects that match the energy.`;

  const completion = await openai.chat.completions.create({
    model: "meta-llama/llama-3.1-8b-instruct",
    messages: [
      { role: "system", content: advancedSystemPrompt },
      { role: "user", content: userMessage }
    ],
    response_format: { type: "json_object" },
    max_tokens: 3000,
  });

  const result = completion.choices[0]?.message?.content;

  if (!result) {
    throw new Error("Failed to generate editing plan");
  }

  const trimmed = result.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    console.error("AI returned non-JSON response:", trimmed);
    throw new Error(`AI returned invalid response. This may indicate API issues or content policy restrictions. Response: ${trimmed.slice(0, 100)}...`);
  }

  return JSON.parse(trimmed);
}

export async function refineAdvancedPlan(
  currentPlan: object,
  feedback: string,
  audioAnalysis?: AudioAnalysis
): Promise<object> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key not configured");
  }

  const openai = new OpenAI({
    baseURL: OPENROUTER_BASE_URL,
    apiKey: OPENROUTER_API_KEY,
  });

  let audioContext = "";
  if (audioAnalysis) {
    audioContext = `\nAudio Analysis:
    - BPM: ${audioAnalysis.bpm}
    - Beats: ${audioAnalysis.beats.slice(0, 10).join(", ")}
    - Energy: ${audioAnalysis.energy}`;
  }

  const completion = await openai.chat.completions.create({
    model: "meta-llama/llama-3.1-8b-instruct",
    messages: [
      { role: "system", content: advancedSystemPrompt },
      { 
        role: "user", 
        content: `Current Editing Plan:
${JSON.stringify(currentPlan, null, 2)}

User Feedback: "${feedback}"
${audioContext}

Refine the editing plan based on the feedback. Keep the same structure but improve the edits.`
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 3000,
  });

  const result = completion.choices[0]?.message?.content;

  if (!result) {
    throw new Error("Failed to refine editing plan");
  }

  return JSON.parse(result);
}

export async function generateMultipleReels(
  clips: AdvancedClipInput[],
  audio: AdvancedClipInput,
  count: number = 3,
  styles: ('viral' | 'cinematic' | 'fun')[] = ['viral', 'fun', 'cinematic']
): Promise<object[]> {
  const plans: object[] = [];

  for (let i = 0; i < Math.min(count, styles.length); i++) {
    const plan = await generateAdvancedEditingPlan({
      clips,
      audio,
      targetStyle: styles[i],
      targetDuration: 15,
    });
    plans.push(plan);
  }

  return plans;
}
