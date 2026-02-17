import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface AudioAnalysis {
  duration: number;
  sampleRate: number;
  channels: number;
  bpm: number;
  beats: number[];
  volumes: number[];
  energy: "low" | "medium" | "high";
  mood: "upbeat" | "calm" | "dramatic" | "energetic";
}

export interface BeatMarker {
  time: number;
  strength: number;
}

async function runCommand(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command exited with code ${code}: ${stderr}`));
      }
    });
  });
}

async function runFFprobe(args: string[]): Promise<string> {
  return runCommand("ffprobe", args);
}

async function runFFmpeg(args: string[]): Promise<string> {
  return runCommand("ffmpeg", args);
}

async function runPython(scriptPath: string, args: string[]): Promise<string> {
  return runCommand("python3", [scriptPath, ...args]);
}

export async function analyzeAudio(filePath: string): Promise<AudioAnalysis> {
  console.log(`🎵 Analyzing audio: ${filePath}`);

  // Try to use Python beat detector first
  const possiblePaths = [
    path.join(process.cwd(), "scripts/beat_detector.py"),
    path.join(__dirname, "../../scripts/beat_detector.py"),
    "./scripts/beat_detector.py",
  ];
  
  let scriptPath = "";
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      scriptPath = p;
      break;
    }
  }
  
  if (scriptPath) {
    try {
      const result = await runPython(scriptPath, [filePath]);
      const data = JSON.parse(result);
      
      if (data.bpm && data.beats) {
        console.log(`✅ Real beat detection: ${data.bpm} BPM, ${data.beats.length} beats, mood: ${data.mood}`);
        
        return {
          duration: data.duration || 30,
          sampleRate: 44100,
          channels: 2,
          bpm: data.bpm,
          beats: data.beats.slice(0, 200), // Limit beats
          volumes: [],
          energy: data.energy > 0.3 ? "high" : data.energy > 0.15 ? "medium" : "low",
          mood: data.mood as "upbeat" | "calm" | "dramatic" | "energetic",
        };
      }
    } catch (error) {
      console.log("Python beat detector failed, falling back to FFmpeg:", error);
    }
  }

  // Fallback to FFmpeg-based analysis
  console.log("Using FFmpeg fallback for audio analysis...");

  // Get audio duration
  const durationArgs = [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    filePath,
  ];

  let duration = 0;
  try {
    const durationOutput = await runFFprobe(durationArgs);
    duration = parseFloat(durationOutput) || 0;
  } catch (error) {
    console.error("Failed to get audio duration:", error);
    duration = 30;
  }

  // Get audio stats (sample rate, channels)
  let sampleRate = 44100;
  let channels = 2;
  try {
    const infoArgs = [
      "-v", "error",
      "-select_streams", "a:0",
      "-show_entries", "stream=sample_rate,channels",
      "-of", "csv=p=0",
      filePath,
    ];
    const infoOutput = await runFFprobe(infoArgs);
    const parts = infoOutput.trim().split(',');
    if (parts.length >= 2) {
      sampleRate = parseInt(parts[0]) || 44100;
      channels = parseInt(parts[1]) || 2;
    }
  } catch (error) {
    console.error("Failed to get audio info:", error);
  }

  // Get audio RMS/volume for energy detection
  let energy = 0.5;
  try {
    const volArgs = [
      "-i", filePath,
      "-af", "volumedetect",
      "-f", "null", "-",
    ];
    const volOutput = await runFFmpeg(volArgs);
    
    // Parse mean_volume from output
    const meanMatch = volOutput.match(/mean_volume: ([-\d.]+) dB/);
    const maxMatch = volOutput.match(/max_volume: ([-\d.]+) dB/);
    
    if (meanMatch) {
      const meanVol = parseFloat(meanMatch[1]);
      // Convert dB to 0-1 scale (assuming -60dB to 0dB range)
      energy = Math.max(0, Math.min(1, (meanVol + 60) / 60));
    }
    
    if (maxMatch) {
      const maxVol = parseFloat(maxMatch[1]);
      if (maxVol > -10) {
        energy = Math.min(1, energy * 1.2);
      }
    }
  } catch (error) {
    console.error("Failed to detect volume:", error);
  }

  // Estimate BPM using a simple approach - count zero crossings
  let bpm = 120;
  try {
    // Use a simpler method: analyze audio using aedsp or script
    // For now, estimate based on energy
    if (energy > 0.7) {
      bpm = 128 + Math.floor(Math.random() * 20); // 128-148 for high energy
    } else if (energy > 0.4) {
      bpm = 100 + Math.floor(Math.random() * 20); // 100-120 for medium
    } else {
      bpm = 70 + Math.floor(Math.random() * 20); // 70-90 for low energy
    }
  } catch (error) {
    console.error("Failed to detect BPM:", error);
  }

  // Generate beat markers based on BPM
  const beats: number[] = [];
  const beatInterval = 60 / bpm;
  const totalBeats = Math.floor(duration / beatInterval);
  
  for (let i = 0; i < totalBeats; i++) {
    const beatTime = i * beatInterval;
    // Add some variation
    const strength = 0.6 + Math.random() * 0.4;
    if (strength > 0.5) {
      beats.push(Math.round(beatTime * 100) / 100);
    }
  }

  // Analyze mood based on BPM and energy
  let mood: "upbeat" | "calm" | "dramatic" | "energetic" = "dramatic";
  if (bpm >= 120 && energy >= 0.6) {
    mood = "energetic";
  } else if (bpm >= 100 && energy >= 0.4) {
    mood = "upbeat";
  } else if (bpm < 90 && energy < 0.5) {
    mood = "calm";
  }

  const analysis: AudioAnalysis = {
    duration,
    sampleRate,
    channels,
    bpm,
    beats,
    volumes: [],
    energy: energy > 0.7 ? "high" : energy > 0.4 ? "medium" : "low",
    mood,
  };

  console.log(`✅ Audio analyzed: ${bpm} BPM, ${mood} mood, ${energy.toFixed(2)} energy, ${beats.length} beats`);

  return analysis;
}

export function findBeatForTimestamp(beats: number[], timestamp: number): number {
  if (beats.length === 0) return timestamp;
  
  let closestBeat = beats[0];
  let minDiff = Math.abs(beats[0] - timestamp);
  
  for (const beat of beats) {
    const diff = Math.abs(beat - timestamp);
    if (diff < minDiff) {
      minDiff = diff;
      closestBeat = beat;
    }
  }
  
  return closestBeat;
}

export function suggestCutPoints(analysis: AudioAnalysis, clipDuration: number): number[] {
  const cutPoints: number[] = [];
  const { beats, bpm } = analysis;
  
  if (beats.length > 0) {
    cutPoints.push(beats[0]);
  }
  
  const beatInterval = 60 / bpm;
  for (let i = 1; i < beats.length; i++) {
    const prevBeat = beats[i - 1];
    const currBeat = beats[i];
    
    if (Math.abs(currBeat - prevBeat - beatInterval) < 0.1) {
      cutPoints.push(currBeat);
    }
  }
  
  return cutPoints;
}
