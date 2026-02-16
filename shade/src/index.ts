import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

import ethAccount from "./routes/ethAccount";
import agentAccount from "./routes/agentAccount";
import transaction from "./routes/transaction";
import nearAccount from "./routes/nearAccount";
import nearPayment from "./routes/nearPayment";

const app = new Hono();

app.use(cors());

app.get("/", (c) => c.json({ message: "App is running (local mode)" }));

app.route("/api/eth-account", ethAccount);
app.route("/api/agent-account", agentAccount);
app.route("/api/transaction", transaction);
app.route("/api/near-account", nearAccount);
app.route("/api/near-payment", nearPayment);

const port = Number(process.env.PORT || "3000");

console.log(`App is running on port ${port} (LOCAL MODE - no TEE)`);

serve({ fetch: app.fetch, port });
