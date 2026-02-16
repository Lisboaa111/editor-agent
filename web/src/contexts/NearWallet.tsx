import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { setupWalletSelector, WalletSelector, WalletModuleFactory } from '@near-wallet-selector/core';
import { setupModal } from '@near-wallet-selector/modal-ui-js';
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';
import { setupBitteWallet } from '@near-wallet-selector/bitte-wallet';
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet';
import { setupNarwallets } from '@near-wallet-selector/narwallets';
import { setupNightly } from '@near-wallet-selector/nightly';

interface NearWalletState {
  selector: WalletSelector | null;
  accounts: { accountId: string }[];
  isSignedIn: boolean;
  signIn: () => void;
  signOut: () => void;
  loading: boolean;
  accountId: string | null;
  signAndSendTransaction: (receiverId: string, amount: string) => Promise<string>;
}

const NearWalletContext = createContext<NearWalletState | null>(null);

const NETWORK_ID = 'testnet';
const CONTRACT_ID = 'myagent123.testnet';

export function NearWalletProvider({ children }: { children: ReactNode }) {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [accounts, setAccounts] = useState<{ accountId: string }[]>([]);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const updateAccounts = useCallback((walletSelector: WalletSelector) => {
    const state = walletSelector.store.getState();
    const accountIds = state.accounts
      .filter((a) => a.active)
      .map((a) => ({ accountId: a.accountId }));
    
    setAccounts(accountIds);
    setIsSignedIn(accountIds.length > 0);
  }, []);

  const initSelector = useCallback(async () => {
    try {
      const walletSelector = await setupWalletSelector({
        network: NETWORK_ID,
        debug: true,
        modules: [
          setupMyNearWallet() as WalletModuleFactory,
          setupBitteWallet() as WalletModuleFactory,
          setupMeteorWallet() as WalletModuleFactory,
          setupNarwallets() as WalletModuleFactory,
          setupNightly() as WalletModuleFactory,
        ],
      });
      
      setSelector(walletSelector);
      updateAccounts(walletSelector);
      
      walletSelector.subscribeOnAccountChange((accountId: string) => {
        if (accountId) {
          setAccounts([{ accountId }]);
          setIsSignedIn(true);
        } else {
          setAccounts([]);
          setIsSignedIn(false);
        }
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize wallet selector:', error);
      setLoading(false);
    }
  }, [updateAccounts]);

  useEffect(() => {
    initSelector();
  }, [initSelector]);

  const signIn = useCallback(async () => {
    if (!selector) return;
    
    try {
      const modal = setupModal(selector, {
        contractId: CONTRACT_ID,
      });
      modal.show();
    } catch (error) {
      console.error('Failed to open wallet modal:', error);
    }
  }, [selector]);

  const signOut = useCallback(async () => {
    if (!selector) return;
    
    try {
      const wallet = await selector.wallet();
      await wallet.signOut();
      updateAccounts(selector);
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  }, [selector, updateAccounts]);

  const accountId = accounts.length > 0 ? accounts[0].accountId : null;

  const signAndSendTransaction = useCallback(async (receiverId: string, amount: string): Promise<string> => {
    if (!selector || !accountId) {
      throw new Error('Wallet not connected');
    }

    try {
      const wallet = await selector.wallet();
      
      const amountInYocto = BigInt(Math.round(parseFloat(amount) * 1e24)).toString();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = await wallet.signAndSendTransaction({
        receiverId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        actions: [
          { transfer: { deposit: amountInYocto } } as any,
        ],
      });
      
      return result.transaction.hash;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }, [selector, accountId]);

  return (
    <NearWalletContext.Provider value={{
      selector,
      accounts,
      isSignedIn,
      signIn,
      signOut,
      loading,
      accountId,
      signAndSendTransaction,
    }}>
      {children}
    </NearWalletContext.Provider>
  );
}

export function useNearWallet() {
  const context = useContext(NearWalletContext);
  if (!context) {
    throw new Error('useNearWallet must be used within NearWalletProvider');
  }
  return context;
}
