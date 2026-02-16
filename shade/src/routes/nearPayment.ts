import { Hono } from "hono";

const app = new Hono();

const DEMO_MODE = process.env.DEMO_MODE === "true" || !process.env.DEMO_MODE;

app.post("/transfer", async (c) => {
  try {
    const { receiverId, amount } = await c.req.json();
    
    if (!receiverId || !amount) {
      return c.json({ error: "receiverId and amount required" }, 400);
    }

    if (DEMO_MODE) {
      console.log(`[DEMO] Would send ${amount} NEAR to ${receiverId}`);
      return c.json({
        success: true,
        txHash: "demo_tx_" + Date.now(),
        demo: true,
      });
    }

    return c.json({ error: "Set DEMO_MODE=true or implement real signing" }, 500);
  } catch (error: any) {
    console.error("Payment error:", error.message);
    return c.json({ error: "Failed: " + error.message }, 500);
  }
});

export default app;
