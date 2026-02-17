export interface MediaItem {
  id: string;
  name: string;
  type: 'video' | 'image' | 'audio';
  url: string;
  duration: number;
  thumbnail?: string;
  width?: number;
  height?: number;
  file?: File;
  serverPath?: string;
}

export interface Clip {
  id: string;
  mediaId: string;
  media?: MediaItem;
  startTime: number;
  endTime: number;
  trimStart: number;
  trimEnd: number;
  volume: number;
  effects: ClipEffect[];
}

export interface ClipEffect {
  id: string;
  type: 'brightness' | 'contrast' | 'saturation' | 'volume';
  value: number;
}

export interface TextOverlay {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor?: string;
}

export interface Transition {
  id: string;
  type: 'fade' | 'dissolve' | 'wipe' | 'slide';
  duration: number;
}

export interface Track {
  id: string;
  type: 'video' | 'audio';
  clips: Clip[];
}

export interface TimelineState {
  tracks: Track[];
  textOverlays: TextOverlay[];
  transitions: Transition[];
  duration: number;
  currentTime: number;
  selectedClipId: string | null;
}

export function createDefaultTimeline(): TimelineState {
  return {
    tracks: [
      { id: 'video-1', type: 'video', clips: [] },
      { id: 'video-2', type: 'video', clips: [] },
      { id: 'audio-1', type: 'audio', clips: [] },
      { id: 'audio-2', type: 'audio', clips: [] },
    ],
    textOverlays: [],
    transitions: [],
    duration: 60,
    currentTime: 0,
    selectedClipId: null,
  };
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
