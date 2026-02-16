import { API_URL } from "../config";

export interface AgentAccount {
  accountId: string;
  balance: string;
}

export interface NearAccount {
  accountId: string;
  balance: string;
}

export interface PaymentResult {
  success: boolean;
  txHash: string;
}

export async function getNearAccount(): Promise<NearAccount> {
  const res = await fetch(`${API_URL}/api/near-account`);
  if (!res.ok) throw new Error("Failed to get NEAR account");
  return res.json();
}

export async function getAgentAccount(): Promise<AgentAccount> {
  const res = await fetch(`${API_URL}/api/agent-account`);
  if (!res.ok) throw new Error("Failed to get agent account");
  return res.json();
}

export async function sendNearPayment(
  receiverId: string,
  amount: string,
  useDirectTransfer: boolean = true
): Promise<PaymentResult> {
  const res = await fetch(`${API_URL}/api/near-payment/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      receiverId,
      amount,
      useDirectTransfer,
    }),
  });
  if (!res.ok) throw new Error("Failed to send payment");
  return res.json();
}
