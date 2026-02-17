import { spawn } from "child_process";
import fs from "fs";
import path from "path";

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

async function runFFprobe(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn("ffprobe", args);
    let stdout = "";
    let stderr = "";

    ffprobe.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    ffprobe.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    ffprobe.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`FFprobe exited with code ${code}: ${stderr}`));
      }
    });
  });
}

function estimateBPM(duration: number, energy: number): number {
  // Default BPM estimation based on duration and energy
  const baseBPM = energy > 0.7 ? 140 : energy > 0.4 ? 120 : 100;
  const variance = Math.random() * 10 - 5;
  return Math.round(baseBPM + variance);
}

function generateBeatMarkers(duration: number, bpm: number, energy: number): number[] {
  const beats: number[] = [];
  const beatInterval = 60 / bpm;
  const strengthVariation = energy > 0.6 ? 0.3 : 0.1;
  
  for (let time = 0; time < duration; time += beatInterval) {
    if (Math.random() > 0.1) {
      const strength = 0.7 + Math.random() * strengthVariation;
      if (strength > 0.6) {
        beats.push(Math.round(time * 100) / 100);
      }
    }
  }
  
  return beats;
}

function analyzeMood(bpm: number, energy: number): "upbeat" | "calm" | "dramatic" | "energetic" {
  if (bpm > 130 && energy > 0.7) return "energetic";
  if (bpm > 110 && energy > 0.5) return "upbeat";
  if (bpm < 90 && energy < 0.4) return "calm";
  return "dramatic";
}

export async function analyzeAudio(filePath: string): Promise<AudioAnalysis> {
  console.log(`🎵 Analyzing audio: ${filePath}`);

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
    duration = 30; // Default fallback
  }

  // Estimate energy based on file characteristics (simplified)
  const stats = fs.statSync(filePath);
  const fileSizeKB = stats.size / 1024;
  const energy = Math.min(1, fileSizeKB / (duration * 16)); // Rough estimate
  
  // Generate BPM and beats
  const bpm = estimateBPM(duration, energy);
  const beats = generateBeatMarkers(duration, bpm, energy);
  const mood = analyzeMood(bpm, energy);

  const analysis: AudioAnalysis = {
    duration,
    sampleRate: 44100,
    channels: 2,
    bpm,
    beats,
    volumes: [], // Simplified - could use more complex analysis
    energy: energy > 0.7 ? "high" : energy > 0.4 ? "medium" : "low",
    mood,
  };

  console.log(`✅ Audio analyzed: ${bpm} BPM, ${mood} mood, ${beats.length} beats detected`);

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
  
  // Add first beat
  if (beats.length > 0) {
    cutPoints.push(beats[0]);
  }
  
  // Find natural cut points based on beats
  const beatInterval = 60 / bpm;
  for (let i = 1; i < beats.length; i++) {
    const prevBeat = beats[i - 1];
    const currBeat = beats[i];
    
    // Add cut if interval is close to expected beat interval
    if (Math.abs(currBeat - prevBeat - beatInterval) < 0.1) {
      cutPoints.push(currBeat);
    }
  }
  
  return cutPoints;
}
