export const API_URL = import.meta.env.VITE_AGENT_URL || "http://localhost:3000";
export const NEAR_NETWORK = import.meta.env.VITE_NEAR_NETWORK || "testnet";
export const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID || "myagent123.testnet";

export const PRICING = {
  export_720p: 0.1,
  export_1080p: 0.25,
  export_4k: 0.5,
  ai_generation: 0.5,
  per_second: 0.01,
};

export const PACKAGES = [
  { id: "starter", name: "Starter", credits: 10, price: 1 },
  { id: "pro", name: "Pro", credits: 50, price: 4 },
  { id: "enterprise", name: "Enterprise", credits: 200, price: 12 },
];

export const EXPORT_QUALITY = [
  { id: "720p", label: "720p (HD)", price: 0.1 },
  { id: "1080p", label: "1080p (Full HD)", price: 0.25 },
  { id: "4k", label: "4K (Ultra HD)", price: 0.5 },
];

export const VIDEO_FORMATS = [
  { id: "mp4", label: "MP4", description: "Most compatible" },
  { id: "mov", label: "MOV", description: "Best quality" },
];

export const VIDEO_LENGTHS = [
  { id: "15", label: "15 seconds", priceMultiplier: 1 },
  { id: "30", label: "30 seconds", priceMultiplier: 1.5 },
  { id: "60", label: "60 seconds", priceMultiplier: 2 },
];

export function calculatePrice(
  quality: string,
  length: number,
  _format: string,
  hasAudio: boolean = true
): number {
  let price = PRICING[`export_${quality}` as keyof typeof PRICING] || PRICING.export_720p;
  
  const lengthMultiplier = length <= 15 ? 1 : length <= 30 ? 1.5 : 2;
  price = price * lengthMultiplier;
  
  if (!hasAudio) {
    price = price * 0.8;
  }
  
  return price;
}
