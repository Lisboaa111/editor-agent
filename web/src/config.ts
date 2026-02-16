export const API_URL = import.meta.env.VITE_AGENT_URL || "http://localhost:3000";
export const NEAR_NETWORK = import.meta.env.VITE_NEAR_NEAR_NETWORK || "testnet";

export const PRICING = {
  export_720p: "0.1",
  export_1080p: "0.25",
  export_4k: "0.5",
  ai_generation: "0.5",
};

export const PACKAGES = [
  { id: "starter", name: "Starter", credits: 10, price: 1 },
  { id: "pro", name: "Pro", credits: 50, price: 4 },
  { id: "enterprise", name: "Enterprise", credits: 200, price: 12 },
];
