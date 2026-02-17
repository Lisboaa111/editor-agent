import { Hono } from "hono";
import { MUSIC_LIBRARY, searchMusic, getMusicByMood, getMusicByBpmRange, type MusicTrack } from "../utils/musicLibrary";

const app = new Hono();

app.get("/tracks", (c) => {
  const query = c.req.query("q") || "";
  const mood = c.req.query("mood") || undefined;
  const minBpm = c.req.query("minBpm");
  const maxBpm = c.req.query("maxBpm");

  let tracks: MusicTrack[];

  if (minBpm && maxBpm) {
    tracks = getMusicByBpmRange(parseInt(minBpm), parseInt(maxBpm));
  } else if (mood) {
    tracks = getMusicByMood(mood);
  } else if (query) {
    tracks = searchMusic(query, mood);
  } else {
    tracks = MUSIC_LIBRARY;
  }

  return c.json({
    tracks,
    total: tracks.length,
  });
});

app.get("/tracks/:id", (c) => {
  const id = c.req.param("id");
  const track = MUSIC_LIBRARY.find(t => t.id === id);

  if (!track) {
    return c.json({ error: "Track not found" }, 404);
  }

  return c.json(track);
});

app.get("/moods", (c) => {
  const moods = [...new Set(MUSIC_LIBRARY.map(t => t.mood))];
  return c.json({ moods });
});

app.get("/genres", (c) => {
  const genres = [...new Set(MUSIC_LIBRARY.map(t => t.genre))];
  return c.json({ genres });
});

app.get("/search", (c) => {
  const query = c.req.query("q");
  
  if (!query) {
    return c.json({ error: "Query required" }, 400);
  }

  const results = searchMusic(query);
  
  return c.json({
    query,
    results,
    total: results.length,
  });
});

export default app;
