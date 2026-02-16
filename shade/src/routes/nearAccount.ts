import { Hono } from "hono";
import { execSync } from "child_process";

const app = new Hono();

const NEAR_ACCOUNT_ID = process.env.NEAR_ACCOUNT_ID || "myagent123.testnet";

app.get("/", async (c) => {
  try {
    const result = execSync(
      `near account view-account-summary ${NEAR_ACCOUNT_ID} network-config testnet now 2>&1`,
      { encoding: "utf8" }
    );
    
    const balanceMatch = result.match(/Native account balance\s+(\d+)\s+NEAR/);
    const balance = balanceMatch ? balanceMatch[1] : "0";
    
    return c.json({
      accountId: NEAR_ACCOUNT_ID,
      balance: balance,
    });
  } catch (error) {
    console.error("Error:", error);
    return c.json({ accountId: NEAR_ACCOUNT_ID, balance: "0" }, 200);
  }
});

export default app;
