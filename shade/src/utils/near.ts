import { agent, agentCall } from "@neardefi/shade-agent-js";
import { utils } from "near-api-js";

export interface PaymentRequest {
  receiverId: string;
  amount: string;
  memo?: string;
}

export async function getNearBalance(): Promise<{ balance: string; accountId: string }> {
  try {
    const accountId = await agent("getAccountId");
    const balanceResult = await agent("getBalance");
    
    const nearBalance = utils.format.formatNearAmount(balanceResult.balance, 5);
    
    return {
      accountId: accountId.accountId,
      balance: nearBalance || "0",
    };
  } catch (error) {
    console.error("Error getting NEAR balance:", error);
    throw error;
  }
}

export async function sendNearPayment(request: PaymentRequest): Promise<{ txHash: string }> {
  try {
    const amountInYocto = utils.format.parseNearAmount(request.amount);
    
    if (!amountInYocto) {
      throw new Error("Invalid amount");
    }

    const result = await agentCall({
      methodName: "ft_transfer",
      args: {
        receiver_id: request.receiverId,
        amount: amountInYocto,
        memo: request.memo || "",
      },
      gas: "30000000000000",
      attachedDeposit: "1",
    });

    return {
      txHash: result.transaction.hash,
    };
  } catch (error) {
    console.error("Error sending NEAR payment:", error);
    throw error;
  }
}

export async function sendNearDirectTransfer(receiverId: string, amount: string): Promise<{ txHash: string }> {
  try {
    const amountInYocto = utils.format.parseNearAmount(amount);
    
    if (!amountInYocto) {
      throw new Error("Invalid amount");
    }

    const result = await agentCall({
      methodName: "transfer",
      args: {},
      gas: "30000000000000",
      attachedDeposit: amountInYocto,
    });

    return {
      txHash: result.transaction.hash,
    };
  } catch (error) {
    console.error("Error sending NEAR transfer:", error);
    throw error;
  }
}

export async function getDerivedNearAddress(path: string = "near-1"): Promise<{ address: string }> {
  try {
    const { Evm } = await import("../utils/ethereum");
    const { address } = await (Evm as any).deriveAddressAndPublicKey(
      process.env.NEXT_PUBLIC_contractId,
      path
    );
    return { address };
  } catch (error) {
    console.error("Error deriving NEAR address:", error);
    throw error;
  }
}
