import { Hono } from "hono";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const app = new Hono();

const MEDIA_DIR = process.env.MEDIA_DIR || "./media";

if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

app.post("/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    const ext = path.extname(file.name) || ".mp4";
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(MEDIA_DIR, filename);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filepath, buffer);

    return c.json({
      success: true,
      filename,
      path: `/media/${filename}`,
      name: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Failed to upload file" }, 500);
  }
});

app.post("/upload-multiple", async (c) => {
  try {
    const formData = await c.req.formData();
    const files = formData.getAll("files") as File[];
    
    if (files.length === 0) {
      return c.json({ error: "No files provided" }, 400);
    }

    const uploaded: Array<{ filename: string; path: string; name: string; size: number }> = [];

    for (const file of files) {
      const ext = path.extname(file.name) || ".mp4";
      const filename = `${uuidv4()}${ext}`;
      const filepath = path.join(MEDIA_DIR, filename);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(filepath, buffer);

      uploaded.push({
        filename,
        path: `/media/${filename}`,
        name: file.name,
        size: file.size,
      });
    }

    return c.json({
      success: true,
      files: uploaded,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Failed to upload files" }, 500);
  }
});

export default app;
