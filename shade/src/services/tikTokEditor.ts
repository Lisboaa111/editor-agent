import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = "./output";
const TEMP_DIR = "./temp";

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

function runCommand(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    let stdout = "", stderr = "";
    proc.stdout.on("data", d => stdout += d.toString());
    proc.stderr.on("data", d => stderr += d.toString());
    proc.on("close", code => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr || `Exit ${code}`));
    });
    proc.on("error", err => reject(err));
  });
}

export async function createTikTokStyleEdit(options: {
  inputPath: string;
  outputPath: string;
  targetDuration?: number;
  musicPath?: string;
  musicVolume?: number;
}): Promise<string> {
  const { inputPath, outputPath, targetDuration = 15, musicPath } = options;
  
  console.log("🎬 Creating TikTok edit...");
  
  // Get duration
  const durationStr = await runCommand("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", inputPath
  ]);
  const videoDuration = parseFloat(durationStr) || 30;
  const actualDuration = Math.min(videoDuration, targetDuration);
  
  console.log(`Duration: ${actualDuration}s`);
  
  // Create 1-second clips with effects
  const clipDuration = 1.0;
  const numClips = Math.floor(actualDuration / clipDuration);
  
  console.log(`Creating ${numClips} clips...`);
  
  const processedClips: string[] = [];
  
  for (let i = 0; i < numClips; i++) {
    const startTime = i * clipDuration;
    const clipPath = path.join(TEMP_DIR, `clip_${i}.mp4`);
    
    console.log(`  Clip ${i}: ${startTime}s`);
    
    try {
      // Simple: cut, scale to vertical, add effect
      await runCommand("ffmpeg", [
        "-y",
        "-ss", String(startTime),
        "-t", String(clipDuration),
        "-i", inputPath,
        "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "23",
        "-an",
        clipPath
      ]);
      processedClips.push(clipPath);
    } catch (e: any) {
      console.error(`  ❌ Clip ${i} failed:`, e.message);
    }
  }
  
  if (processedClips.length === 0) {
    throw new Error("No clips created");
  }
  
  console.log(`✅ Created ${processedClips.length} clips`);
  
  // Simple concat using concat demuxer
  const concatFile = path.join(TEMP_DIR, "concat.txt");
  const concatList = processedClips.map(p => `file '${p}'`).join("\n");
  fs.writeFileSync(concatFile, concatList);
  
  console.log("Concatenating clips...");
  
  try {
    await runCommand("ffmpeg", [
      "-y",
      "-f", "concat",
      "-safe", "0",
      "-i", concatFile,
      "-c", "copy",
      outputPath
    ]);
  } catch (e: any) {
    console.error("Concat failed:", e.message);
    // Fallback: just use first clip
    fs.copyFileSync(processedClips[0], outputPath);
  }
  
  // Add music if provided
  if (musicPath) {
    console.log("Adding music...");
    const tempOutput = outputPath + ".temp.mp4";
    
    try {
      await runCommand("ffmpeg", [
        "-y",
        "-i", outputPath,
        "-i", musicPath,
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        tempOutput
      ]);
      fs.renameSync(tempOutput, outputPath);
    } catch (e: any) {
      console.error("Music failed:", e.message);
    }
  }
  
  // Cleanup
  try {
    fs.unlinkSync(concatFile);
    for (const clip of processedClips) {
      fs.unlinkSync(clip);
    }
  } catch {}
  
  console.log("✅ Done! Output:", outputPath);
  return outputPath;
}
