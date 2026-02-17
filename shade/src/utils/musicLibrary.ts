export interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  duration: number;
  bpm: number;
  mood: 'upbeat' | 'calm' | 'dramatic' | 'energetic' | 'fun' | 'emotional';
  genre: string;
  url?: string;
  tags: string[];
}

export const MUSIC_LIBRARY: MusicTrack[] = [
  {
    id: "custom-1",
    name: "Trillium (Slowed + Reverb)",
    artist: "S3RL ft Sara",
    duration: 48,
    bpm: 90,
    mood: "energetic",
    genre: "Electronic",
    url: "/media/S3RL(ft Sara) - Trillium(Slowed + Reverb) [edit audio].mp3",
    tags: ["energetic", "electronic", "dance", "edm"],
  },
  {
    id: "upbeat-1",
    name: "Electric Dreams",
    artist: "ReelForge",
    duration: 30,
    bpm: 128,
    mood: "energetic",
    genre: "Electronic",
    tags: ["energetic", "electronic", "dance", "fast"],
  },
  {
    id: "upbeat-2",
    name: "Sunshine",
    artist: "ReelForge",
    duration: 30,
    bpm: 120,
    mood: "upbeat",
    genre: "Pop",
    tags: ["upbeat", "pop", "happy", "positive"],
  },
  {
    id: "calm-1",
    name: "Peaceful Morning",
    artist: "ReelForge",
    duration: 30,
    bpm: 80,
    mood: "calm",
    genre: "Ambient",
    tags: ["calm", "peaceful", "ambient", "soft"],
  },
  {
    id: "calm-2",
    name: "Soft Focus",
    artist: "ReelForge",
    duration: 30,
    bpm: 75,
    mood: "calm",
    genre: "Chill",
    tags: ["calm", "chill", "relaxing", "soft"],
  },
  {
    id: "dramatic-1",
    name: "Epic Moment",
    artist: "ReelForge",
    duration: 30,
    bpm: 90,
    mood: "dramatic",
    genre: "Cinematic",
    tags: ["dramatic", "cinematic", "epic", "intense"],
  },
  {
    id: "dramatic-2",
    name: "Dark Rising",
    artist: "ReelForge",
    duration: 30,
    bpm: 85,
    mood: "dramatic",
    genre: "Orchestral",
    tags: ["dramatic", "dark", "orchestral", "intense"],
  },
  {
    id: "fun-1",
    name: "Party Time",
    artist: "ReelForge",
    duration: 30,
    bpm: 140,
    mood: "fun",
    genre: "Dance",
    tags: ["fun", "party", "dance", "happy"],
  },
  {
    id: "fun-2",
    name: "Bouncy",
    artist: "ReelForge",
    duration: 30,
    bpm: 110,
    mood: "fun",
    genre: "Pop",
    tags: ["fun", "bouncy", "playful", "upbeat"],
  },
  {
    id: "energetic-1",
    name: "Adrenaline",
    artist: "ReelForge",
    duration: 30,
    bpm: 150,
    mood: "energetic",
    genre: "EDM",
    tags: ["energetic", "edm", "high energy", "fast"],
  },
  {
    id: "energetic-2",
    name: "Power Up",
    artist: "ReelForge",
    duration: 30,
    bpm: 135,
    mood: "energetic",
    genre: "Electronic",
    tags: ["energetic", "electronic", "powerful", "fast"],
  },
  {
    id: "emotional-1",
    name: "Tender Moments",
    artist: "ReelForge",
    duration: 30,
    bpm: 70,
    mood: "emotional",
    genre: "Acoustic",
    tags: ["emotional", "tender", "acoustic", "soft"],
  },
  {
    id: "emotional-2",
    name: "Heartfelt",
    artist: "ReelForge",
    duration: 30,
    bpm: 65,
    mood: "emotional",
    genre: "Piano",
    tags: ["emotional", "piano", "touching", "soft"],
  },
];

export function searchMusic(query: string, mood?: string): MusicTrack[] {
  const q = query.toLowerCase();
  
  return MUSIC_LIBRARY.filter(track => {
    const matchesQuery = 
      track.name.toLowerCase().includes(q) ||
      track.artist.toLowerCase().includes(q) ||
      track.genre.toLowerCase().includes(q) ||
      track.tags.some(tag => tag.toLowerCase().includes(q));
    
    const matchesMood = !mood || track.mood === mood;
    
    return matchesQuery && matchesMood;
  });
}

export function getMusicByMood(mood: string): MusicTrack[] {
  return MUSIC_LIBRARY.filter(track => track.mood === mood);
}

export function getMusicByBpmRange(minBpm: number, maxBpm: number): MusicTrack[] {
  return MUSIC_LIBRARY.filter(track => track.bpm >= minBpm && track.bpm <= maxBpm);
}
