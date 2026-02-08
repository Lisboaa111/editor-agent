declare module '@neardefi/shade-agent-js' {
  interface AgentAccountIdResponse {
    accountId: string;
  }

  interface AgentInfoResponse {
    codehash: string;
    checksum?: string;
  }

  interface AgentBalanceResponse {
    balance: string;
  }

  interface RequestSignatureParams {
    path: string;
    payload: string;
    keyType: 'Ecdsa' | 'Eddsa';
  }

  interface SignatureResponse {
    scheme: string;
    big_r?: { affine_point: string };
    s?: { scalar: string };
    recovery_id?: number;
    signature?: number[];
  }

  export function agentAccountId(): Promise<AgentAccountIdResponse>;
  export function agentInfo(): Promise<AgentInfoResponse>;
  export function agent(method: string, args?: Record<string, unknown>): Promise<AgentBalanceResponse>;
  export function requestSignature(params: RequestSignatureParams): Promise<SignatureResponse>;
}
