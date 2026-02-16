import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

import videoProcessing from "./routes/videoProcessing";

const app = new Hono();

app.use(cors());

app.get("/", (c) => c.json({ message: "ReelForge Agent API" }));

app.route("/api/video", videoProcessing);

const port = Number(process.env.PORT || "3000");

console.log(`ReelForge Agent running on port ${port}`);

serve({ fetch: app.fetch, port });
