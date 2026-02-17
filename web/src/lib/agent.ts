import { API_URL } from "../config";

export interface AgentAccount {
  accountId: string;
  balance: string;
}

export interface NearAccount {
  accountId: string;
  balance: string;
}

export interface PaymentResult {
  success: boolean;
  txHash: string;
}

export interface VideoJob {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  outputUrl?: string;
  error?: string;
}

export interface UploadedFile {
  filename: string;
  path: string;
  name: string;
  size: number;
}

export async function uploadMedia(file: File): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append("file", file);
  
  const res = await fetch(`${API_URL}/api/media/upload`, {
    method: "POST",
    body: formData,
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to upload media");
  }
  
  return res.json();
}

export async function uploadMultipleMedia(files: File[]): Promise<UploadedFile[]> {
  const formData = new FormData();
  files.forEach(file => formData.append("files", file));
  
  const res = await fetch(`${API_URL}/api/media/upload-multiple`, {
    method: "POST",
    body: formData,
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to upload media");
  }
  
  const data = await res.json();
  return data.files;
}

export interface TimelineClip {
  id: string;
  mediaUrl: string;
  mediaName: string;
  serverPath?: string;
  startTime: number;
  endTime: number;
  duration: number;
  type: 'video' | 'image' | 'audio';
}

export interface TextOverlay {
  text: string;
  startTime: number;
  endTime: number;
  x?: number;
  y?: number;
  fontSize?: number;
  color?: string;
}

export interface EditingPlan {
  edits: Array<{
    clipIndex: number;
    action: string;
    startTime: number;
    endTime: number;
    transition: string;
    transitionDuration: number;
  }>;
  textOverlays: Array<{
    text: string;
    startTime: number;
    endTime: number;
    position: string;
    style: string;
  }>;
  music?: {
    suggestedMood: string;
    bpm: number;
  };
  pacing: string;
  summary: string;
}

export async function getNearAccount(): Promise<NearAccount> {
  const res = await fetch(`${API_URL}/api/near-account`);
  if (!res.ok) throw new Error("Failed to get NEAR account");
  return res.json();
}

export async function getAgentAccount(): Promise<AgentAccount> {
  const res = await fetch(`${API_URL}/api/agent-account`);
  if (!res.ok) throw new Error("Failed to get agent account");
  return res.json();
}

export async function sendNearPayment(
  receiverId: string,
  amount: string,
  useDirectTransfer: boolean = true
): Promise<PaymentResult> {
  const res = await fetch(`${API_URL}/api/near-payment/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      receiverId,
      amount,
      useDirectTransfer,
    }),
  });
  if (!res.ok) throw new Error("Failed to send payment");
  return res.json();
}

export async function generateEditingPlan(
  clips: TimelineClip[],
  textOverlays: TextOverlay[] = [],
  prompt?: string,
  quality: string = '1080p',
  format: string = 'mp4'
): Promise<{ success: boolean; plan: EditingPlan; message?: string }> {
  const res = await fetch(`${API_URL}/api/ai/edit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clips,
      textOverlays,
      prompt,
      quality,
      format,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to generate editing plan");
  }
  return res.json();
}

export async function refineEditingPlan(
  currentPlan: EditingPlan,
  feedback: string
): Promise<{ success: boolean; plan: EditingPlan; message?: string }> {
  const res = await fetch(`${API_URL}/api/ai/refine`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      currentPlan,
      feedback,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to refine editing plan");
  }
  return res.json();
}

export async function processVideo(
  clips: TimelineClip[],
  textOverlays: TextOverlay[] = [],
  quality: string = '1080p',
  length: number = 15,
  format: string = 'mp4',
  hasAudio: boolean = true,
  plan?: EditingPlan
): Promise<{ success: boolean; jobId: string; status: string }> {
  const res = await fetch(`${API_URL}/api/video/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clips,
      textOverlays,
      quality,
      length,
      format,
      hasAudio,
      plan,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to process video");
  }
  return res.json();
}

export async function getJobStatus(jobId: string): Promise<VideoJob> {
  const res = await fetch(`${API_URL}/api/video/status/${jobId}`);
  if (!res.ok) throw new Error("Failed to get job status");
  return res.json();
}
