import { spawn, ChildProcess } from "child_process";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export type TransitionType = 
  | "none" 
  | "fade" 
  | "crossfade" 
  | "dissolve" 
  | "wipe_left" 
  | "wipe_right" 
  | "wipe_up" 
  | "wipe_down"
  | "slide_left"
  | "slide_right"
  | "zoom_in"
  | "zoom_out"
  | "blur"
  | "glitch"
  | "rgb_split"
  | "vhs";

export type EffectType = 
  | "brightness"
  | "contrast"
  | "saturation"
  | "blur"
  | "sharpen"
  | "vignette"
  | "grain"
  | "chromatic_aberration"
  | "vhs"
  | "cinema"
  | "warm"
  | "cool"
  | "dramatic"
  | "fade_bw";

export interface ClipConfig {
  id: string;
  inputPath: string;
  startTime: number;
  endTime: number;
  trimStart?: number;
  trimEnd?: number;
  volume: number;
  speed: number;
  reverse: boolean;
}

export interface TransitionConfig {
  type: TransitionType;
  duration: number;
}

export interface EffectConfig {
  type: EffectType;
  intensity: number;
  startTime?: number;
  endTime?: number;
}

export interface TextOverlayConfig {
  text: string;
  startTime: number;
  endTime: number;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor?: string;
  animation?: "none" | "fade_in" | "typewriter" | "slide_up" | "bounce";
}

export interface VideoConfig {
  width: number;
  height: number;
  fps: number;
  bitrate: string;
  codec: string;
  format: string;
}

export interface AudioConfig {
  backgroundMusic?: string;
  musicVolume: number;
  originalVolume: number;
  fadeIn?: number;
  fadeOut?: number;
}

export interface EditingPlan {
  clips: ClipConfig[];
  transitions: TransitionConfig[];
  effects: EffectConfig[];
  textOverlays: TextOverlayConfig[];
  video: VideoConfig;
  audio: AudioConfig;
}

const DEFAULT_VIDEO: VideoConfig = {
  width: 1080,
  height: 1920,
  fps: 30,
  bitrate: "5M",
  codec: "libx264",
  format: "mp4",
};

export class VideoEditor {
  private tempDir: string;
  private outputDir: string;
  private jobId: string;
  private ffmpegProcess: ChildProcess | null = null;

  constructor(outputDir: string = "./output", tempDir: string = "./temp") {
    this.outputDir = outputDir;
    this.tempDir = tempDir;
    this.jobId = uuidv4();
    
    // Ensure directories exist
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async generate(plan: EditingPlan): Promise<string> {
    console.log(`🎬 Starting video generation: ${this.jobId}`);
    
    const videoConfig = { ...DEFAULT_VIDEO, ...plan.video };
    const hasBackgroundMusic = !!plan.audio?.backgroundMusic;
    const musicPath = hasBackgroundMusic ? plan.audio.backgroundMusic : null;
    const musicVolume = plan.audio?.musicVolume ?? 0.5;
    
    const outputPath = path.join(this.outputDir, `${this.jobId}.${videoConfig.format}`);
    const tempVideoPath = path.join(this.tempDir, `${this.jobId}_video.mp4`);
    
    const scaleFilter = `scale=${videoConfig.width}:${videoConfig.height}:force_original_aspect_ratio=decrease,pad=${videoConfig.width}:${videoConfig.height}:(ow-iw)/2:(oh-ih)/2,setsar=1`;
    
    let videoArgs: string[] = [];
    let videoFilterParts: string[] = [];
    
    if (plan.clips.length === 1) {
      const clip = plan.clips[0];
      let clipFilter = `[0:v]`;
      if (clip.trimStart !== undefined) {
        clipFilter += `trim=start=${clip.trimStart},setpts=PTS-STARTPTS,`;
      }
      if (clip.speed !== 1) {
        clipFilter += `setpts=${1/clip.speed}*PTS,`;
      }
      clipFilter += scaleFilter;
      videoFilterParts.push(clipFilter);
    } else {
      for (let i = 0; i < plan.clips.length; i++) {
        const clip = plan.clips[i];
        let clipFilter = `[${i}:v]`;
        if (clip.trimStart !== undefined) {
          clipFilter += `trim=start=${clip.trimStart},setpts=PTS-STARTPTS,`;
        }
        if (clip.speed !== 1) {
          clipFilter += `setpts=${1/clip.speed}*PTS,`;
        }
        clipFilter += scaleFilter;
        videoFilterParts.push(clipFilter);
      }
      
      let concatInputs = "";
      for (let i = 0; i < plan.clips.length; i++) {
        concatInputs += `[v${i}]`;
      }
      videoFilterParts.push(`${concatInputs}concat=n=${plan.clips.length}:v=1:a=0`);
    }
    
    const videoFilter = videoFilterParts.join(";");
    
    const inputArgs: string[] = [];
    for (const clip of plan.clips) {
      inputArgs.push("-i", clip.inputPath);
    }
    
    console.log("Step 1: Processing video...");
    const videoArgsFinal = [
      "-y",
      ...inputArgs,
      "-filter_complex", videoFilter,
      "-map", "0:v",
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-crf", "28",
      "-r", "30",
      tempVideoPath,
    ];
    
    console.log("Video FFmpeg args:", videoArgsFinal.join(" "));
    await this.runFFmpeg(videoArgsFinal);
    
    if (!fs.existsSync(tempVideoPath)) {
      throw new Error("Video processing failed - no output file");
    }
    
    if (hasBackgroundMusic && musicPath) {
      console.log("Step 2: Adding background music...");
      
      const escapedMusicPath = musicPath.replace(/"/g, '\\"');
      
      const audioArgs = [
        "-y",
        "-i", tempVideoPath,
        "-i", escapedMusicPath,
        "-filter_complex", `[1:a]volume=${musicVolume}[music]`,
        "-map", "0:v",
        "-map", "[music]",
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "128k",
        "-shortest",
        outputPath,
      ];
      
      console.log("Audio FFmpeg args:", audioArgs.join(" "));
      await this.runFFmpeg(audioArgs);
      
      fs.unlinkSync(tempVideoPath);
    } else {
      fs.renameSync(tempVideoPath, outputPath);
    }
    
    if (!fs.existsSync(outputPath)) {
      throw new Error("Final video not created");
    }
    
    const stats = fs.statSync(outputPath);
    console.log(`✅ Video generated: ${outputPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    
    return outputPath;
  }

  // Legacy method kept for compatibility
  private buildVideoFilters(
    clips: ClipConfig[],
    transitions: TransitionConfig[],
    effects: EffectConfig[],
    videoConfig: VideoConfig,
    filterComplex: string[]
  ): string {
    const filters: string[] = [];
    const scaleFilter = `scale=${videoConfig.width}:${videoConfig.height}:force_original_aspect_ratio=decrease,pad=${videoConfig.width}:${videoConfig.height}:(ow-iw)/2:(oh-ih)/2`;

    // Process each clip
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      let clipFilter = `[${i}:v]`;

      // Apply trim
      if (clip.trimStart !== undefined || clip.trimEnd !== undefined) {
        const start = clip.trimStart || 0;
        const end = clip.trimEnd || "D";
        clipFilter += `trim=start=${start}:end=${end},setpts=PTS-STARTPTS,`;
      }

      // Apply speed
      if (clip.speed !== 1) {
        clipFilter += `setpts=${1/clip.speed}*PTS,`;
      }

      // Apply reverse
      if (clip.reverse) {
        clipFilter += "reverse,";
      }

      // Apply effects
      for (const effect of effects) {
        clipFilter += this.applyEffect(effect) + ",";
      }

      // Scale and pad
      clipFilter += scaleFilter;

      // Apply volume
      if (clip.volume !== 1) {
        clipFilter += `,volume=${clip.volume}`;
      }

      filters.push(clipFilter + `[v${i}]`);
    }

    // Build concatenation with transitions
    if (clips.length > 1) {
      for (let i = 0; i < clips.length - 1; i++) {
        const transition = transitions.find(t => t.type !== "none");
        const duration = transition?.duration || 0.5;

        if (transition && transition.type !== "none") {
          // Apply transition
          const transitionFilter = this.applyTransition(transition.type, duration);
          filters.push(`[v${i}][v${i+1}]${transitionFilter}[v${i}_t]`);
          filters.push(`[v${i}_t][v${i+1}]concat=n=2:v=1:a=0[v${i}]`);
        } else {
          // Simple concatenation
          filters.push(`[v${i}][v${i+1}]concat=n=2:v=1:a=0[v${i}]`);
        }
      }
      
      filterComplex.push(...filters.slice(0, -1));
      filterComplex.push(`[v${clips.length - 1}]copy[outv]`);
    } else if (clips.length === 1) {
      filterComplex.push(...filters);
      filterComplex.push(`[v0]copy[outv]`);
    }

    return filters.join(";");
  }

  private applyEffect(effect: EffectConfig): string {
    switch (effect.type) {
      case "brightness":
        return `eq=brightness=${effect.intensity}`;
      case "contrast":
        return `eq=contrast=${1 + effect.intensity}`;
      case "saturation":
        return `eq=saturation=${1 + effect.intensity}`;
      case "blur":
        return `boxblur= ${effect.intensity}:${effect.intensity}`;
      case "sharpen":
        return `unsharp=5:5:1.0:5:5:0.0`;
      case "vignette":
        return `vignette=angle=${effect.intensity}`;
      case "warm":
        return `eq=gamma=1.2:gamma_r=1.1:gamma_g=1.0:gamma_b=0.9`;
      case "cool":
        return `eq=gamma=1.2:gamma_r=0.9:gamma_g=1.0:gamma_b=1.1`;
      case "dramatic":
        return `eq=contrast=1.3:brightness=-0.05:saturation=1.2`;
      case "cinema":
        return `eq=saturation=0.8:contrast=1.1:gamma=0.9`;
      case "fade_bw":
        return `hue=s=0`;
      default:
        return "";
    }
  }

  private applyTransition(type: TransitionType, duration: number): string {
    switch (type) {
      case "fade":
        return `xfade=transition=fade:duration=${duration}`;
      case "crossfade":
        return `xfade=transition=crossfade:duration=${duration}`;
      case "dissolve":
        return `xfade=transition=dissolve:duration=${duration}`;
      case "wipe_left":
        return `xfade=transition=wipeleft:duration=${duration}`;
      case "wipe_right":
        return `xfade=transition=wiperight:duration=${duration}`;
      case "slide_left":
        return `xfade=transition=slideleft:duration=${duration}`;
      case "slide_right":
        return `xfade=transition=slideright:duration=${duration}`;
      case "zoom_in":
        return `xfade=transition=zoomin:duration=${duration}`;
      case "zoom_out":
        return `xfade=transition=zoomout:duration=${duration}`;
      default:
        return `xfade=transition=fade:duration=${duration}`;
    }
  }

  private buildTextFilter(overlays: TextOverlayConfig[], videoConfig: VideoConfig): string {
    const drawtextFilters = overlays.map((overlay, index) => {
      const escapedText = overlay.text.replace(/'/g, "\\'").replace(/:/g, "\\:");
      const fontPath = "/System/Library/Fonts/Helvetica.ttc"; // Default macOS font
      
      let filter = `drawtext=fontfile='${fontPath}':text='${escapedText}':fontsize=${overlay.fontSize}:fontcolor=${overlay.color}:x=${overlay.x}:y=${overlay.y}`;
      
      if (overlay.backgroundColor) {
        filter += `:box=1:boxcolor=${overlay.backgroundColor}:boxborderw=10`;
      }

      // Enable text only during specified time
      filter += `:enable='between(t,${overlay.startTime},${overlay.endTime})'`;
      
      return `[${index}:v]${filter}[t${index}]`;
    });

    // Chain text overlays
    if (drawtextFilters.length === 1) {
      return drawtextFilters[0].replace(`[0:v]`, "[outv]").replace(`[t0]`, "[outv]");
    }

    return drawtextFilters.join(";") + `;${drawtextFilters.map((_, i) => `[t${i}]`).join("")}overlay=format=auto[outv]`;
  }

  private runFFmpeg(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const safeArgs = args.map(arg => {
        if (arg.includes(' ') || arg.includes('(') || arg.includes(')')) {
          return `"${arg}"`;
        }
        return arg;
      });
      console.log("Running FFmpeg command:", "ffmpeg " + safeArgs.join(" "));
      
      this.ffmpegProcess = spawn("ffmpeg", args);
      
      let stderr = "";
      
      this.ffmpegProcess.stderr?.on("data", (data) => {
        stderr += data.toString();
      });
      
      this.ffmpegProcess.on("close", (code) => {
        this.ffmpegProcess = null;
        if (code === 0) {
          resolve();
        } else {
          console.error("FFmpeg stderr:", stderr);
          reject(new Error(`FFmpeg exited with code ${code}\n${stderr}`));
        }
      });
      
      this.ffmpegProcess.on("error", (err) => {
        this.ffmpegProcess = null;
        reject(err);
      });
    });
  }

  cancel(): void {
    if (this.ffmpegProcess) {
      this.ffmpegProcess.kill("SIGTERM");
      this.ffmpegProcess = null;
    }
  }

  getProgress(): number {
    // In production, parse FFmpeg stderr for progress
    return 0;
  }
}

export function createVideoEditor(outputDir?: string, tempDir?: string): VideoEditor {
  return new VideoEditor(outputDir, tempDir);
}
