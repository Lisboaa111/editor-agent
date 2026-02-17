import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { createVideoEditor, type EditingPlan, type VideoConfig, type TransitionConfig, type EffectConfig, type TextOverlayConfig, type ClipConfig, type AudioConfig } from "./videoEditor";
import { analyzeAudio, type AudioAnalysis, suggestCutPoints } from "./audioAnalyzer";
import { generateAdvancedEditingPlan, refineAdvancedPlan, generateMultipleReels, type AdvancedClipInput, type AudioAnalysis as AdvancedAudioAnalysis } from "./aiEditor";

const OUTPUT_DIR = process.env.OUTPUT_DIR || "./output";
const MEDIA_DIR = process.env.MEDIA_DIR || "./media";

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

export interface MediaFile {
  id: string;
  name: string;
  path: string;
  duration: number;
  type: 'video' | 'image' | 'audio';
}

export interface ReelRequest {
  clips: MediaFile[];
  audio?: MediaFile;
  prompt?: string;
  targetDuration?: number;
  targetStyle?: 'viral' | 'cinematic' | 'fun' | 'educational' | 'dramatic';
  aspectRatio?: '9:16' | '16:9' | '1:1';
  generateVariations?: number;
}

export interface ReelJob {
  id: string;
  status: 'pending' | 'analyzing' | 'generating' | 'processing' | 'completed' | 'failed';
  progress: number;
  progressMessage: string;
  outputUrls: string[];
  errors: string[];
  createdAt: number;
  completedAt?: number;
}

export interface ReelVariation {
  id: string;
  style: string;
  duration: number;
  outputUrl: string;
}

class ReelGenerator {
  private jobs = new Map<string, ReelJob>();

  async generateReel(request: ReelRequest): Promise<string> {
    const jobId = uuidv4();
    
    const job: ReelJob = {
      id: jobId,
      status: 'pending',
      progress: 0,
      progressMessage: 'Initializing...',
      outputUrls: [],
      errors: [],
      createdAt: Date.now(),
    };
    
    this.jobs.set(jobId, job);
    
    // Process in background
    this.processReel(jobId, request).catch(err => {
      console.error(`Job ${jobId} failed:`, err);
      const job = this.jobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.errors.push(err.message);
      }
    });
    
    return jobId;
  }

  private async processReel(jobId: string, request: ReelRequest): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      // Step 1: Analyze audio if present
      job.status = 'analyzing';
      job.progress = 10;
      job.progressMessage = 'Analyzing audio...';
      
      let audioAnalysis: AudioAnalysis | undefined;
      let advancedAudioAnalysis: AdvancedAudioAnalysis | undefined;
      
      if (request.audio) {
        audioAnalysis = await analyzeAudio(request.audio.path);
        advancedAudioAnalysis = {
          duration: audioAnalysis.duration,
          bpm: audioAnalysis.bpm,
          beats: audioAnalysis.beats,
          mood: audioAnalysis.mood,
          energy: audioAnalysis.energy,
        };
        
        job.progress = 30;
        job.progressMessage = 'Audio analyzed!';
      }

      // Step 2: Generate editing plans with AI
      job.status = 'generating';
      job.progress = 40;
      job.progressMessage = 'Generating AI editing plan...';

      const clipsInput: AdvancedClipInput[] = request.clips.map(c => ({
        id: c.id,
        name: c.name,
        url: c.path,
        duration: c.duration,
        type: c.type as 'video' | 'image',
      }));

      const audioInput = request.audio ? {
        id: request.audio.id,
        name: request.audio.name,
        url: request.audio.path,
        duration: request.audio.duration,
        type: request.audio.type as 'audio',
      } : undefined;

      let plans: object[];
      
      if (request.generateVariations && request.generateVariations > 1) {
        // Generate multiple variations
        job.progressMessage = `Generating ${request.generateVariations} reel variations...`;
        plans = await generateMultipleReels(
          clipsInput,
          audioInput!,
          request.generateVariations,
          ['viral', 'fun', 'cinematic'].slice(0, request.generateVariations) as any
        );
      } else {
        // Generate single plan
        const plan = await generateAdvancedEditingPlan({
          clips: clipsInput,
          audio: audioInput,
          audioAnalysis: advancedAudioAnalysis,
          prompt: request.prompt,
          targetDuration: request.targetDuration || 15,
          targetStyle: request.targetStyle || 'viral',
          aspectRatio: request.aspectRatio || '9:16',
        });
        plans = [plan];
      }

      job.progress = 60;
      job.progressMessage = 'Processing videos...';

      // Step 3: Process each plan
      const outputUrls: string[] = [];
      
      for (let i = 0; i < plans.length; i++) {
        const plan = plans[i] as any;
        
        try {
          const outputPath = await this.executePlan(plan, request, jobId, i);
          outputUrls.push(`/output/${path.basename(outputPath)}`);
          
          job.progress = 60 + Math.round((i + 1) / plans.length * 40);
          job.progressMessage = `Rendered variation ${i + 1}/${plans.length}`;
        } catch (err: any) {
          job.errors.push(`Variation ${i + 1} failed: ${err.message}`);
        }
      }

      // Step 4: Complete
      job.status = outputUrls.length > 0 ? 'completed' : 'failed';
      job.progress = 100;
      job.progressMessage = outputUrls.length > 0 
        ? `Complete! Generated ${outputUrls.length} reel(s)` 
        : 'All variations failed';
      job.outputUrls = outputUrls;
      job.completedAt = Date.now();

      console.log(`✅ Job ${jobId} completed: ${outputUrls.length} outputs`);

    } catch (error: any) {
      job.status = 'failed';
      job.progressMessage = 'Error: ' + error.message;
      job.errors.push(error.message);
      console.error(`❌ Job ${jobId} failed:`, error);
    }
  }

  private async executePlan(plan: any, request: ReelRequest, jobId: string, variationIndex: number): Promise<string> {
    const videoConfig: VideoConfig = this.parseVideoConfig(plan, request);
    const clips = this.buildClips(plan, request);
    const transitions = this.buildTransitions(plan, request);
    const effects = this.buildEffects(plan);
    const textOverlays = this.buildTextOverlays(plan);
    const audioConfig = this.buildAudioConfig(plan, request);

    const editingPlan: EditingPlan = {
      clips,
      transitions,
      effects,
      textOverlays,
      video: videoConfig,
      audio: audioConfig,
    };

    const editor = createVideoEditor(OUTPUT_DIR);
    
    const suffix = variationIndex > 0 ? `_variation_${variationIndex}` : '';
    const outputPath = await editor.generate({
      ...editingPlan,
      // Override to use job-based naming
    } as EditingPlan);

    return outputPath;
  }

  private parseVideoConfig(plan: any, request: ReelRequest): VideoConfig {
    const aspectRatio = request.aspectRatio || '9:16';
    const [w, h] = aspectRatio.split(':').map(Number);
    
    return {
      width: w === 9 ? 1080 : w === 16 ? 1920 : w,
      height: h === 16 ? 1920 : h === 9 ? 1080 : h,
      fps: 30,
      bitrate: '5M',
      codec: 'libx264',
      format: 'mp4',
    };
  }

  private buildClips(plan: any, request: ReelRequest): ClipConfig[] {
    const planClips = plan.clips || [];
    
    return request.clips.map((clip, i) => {
      const planClip = planClips[i] || {};
      
      let inputPath = clip.path;
      if (inputPath.startsWith('/media/')) {
        inputPath = '.' + inputPath;
      }
      
      return {
        id: clip.id,
        inputPath,
        startTime: 0,
        endTime: clip.duration,
        trimStart: planClip.trimStart || 0,
        trimEnd: planClip.trimEnd || clip.duration,
        volume: 1,
        speed: planClip.speed || 1,
        reverse: planClip.reverse || false,
      };
    });
  }

  private buildTransitions(plan: any, request: ReelRequest): TransitionConfig[] {
    const planTransitions = plan.transitions || [];
    
    return planTransitions.map((t: any) => ({
      type: t.type || 'crossfade',
      duration: t.duration || 0.5,
    }));
  }

  private buildEffects(plan: any): EffectConfig[] {
    const effects: EffectConfig[] = [];
    const planEffects = plan.clips?.flatMap((c: any) => c.effects || []) || [];
    
    for (const effect of planEffects) {
      effects.push({
        type: effect.type || 'contrast',
        intensity: effect.intensity || 0.3,
      });
    }
    
    return effects;
  }

  private buildTextOverlays(plan: any): TextOverlayConfig[] {
    const planText = plan.textOverlays || [];
    
    return planText.map((t: any) => ({
      text: t.text || '',
      startTime: t.startTime || 0,
      endTime: t.endTime || 3,
      x: this.parsePosition(t.position, 'x'),
      y: this.parsePosition(t.position, 'y'),
      fontSize: 48,
      fontFamily: 'Inter',
      color: 'white',
      animation: t.animation || 'none',
    }));
  }

  private parsePosition(position: string | undefined, axis: 'x' | 'y'): string {
    if (position === 'center') return axis === 'x' ? '(w-text_w)/2' : '(h-text_h)/2';
    if (position === 'top') return axis === 'x' ? '(w-text_w)/2' : '50';
    if (position === 'bottom') return axis === 'x' ? '(w-text_w)/2' : '(h-text_h-50)';
    return axis === 'x' ? '(w-text_w)/2' : '(h-text_h)/2';
  }

  private buildAudioConfig(plan: any, request: ReelRequest): AudioConfig {
    const audio = plan.audio || {};
    
    return {
      backgroundMusic: request.audio?.path,
      musicVolume: audio.volume || 0.3,
      originalVolume: audio.originalVolume || 0.8,
      fadeIn: audio.fadeIn || 0.5,
      fadeOut: audio.fadeOut || 0.5,
    };
  }

  getJob(jobId: string): ReelJob | undefined {
    return this.jobs.get(jobId);
  }

  listJobs(): ReelJob[] {
    return Array.from(this.jobs.values());
  }

  deleteJob(jobId: string): boolean {
    return this.jobs.delete(jobId);
  }
}

export const reelGenerator = new ReelGenerator();
