import { createContext, useContext, useState, useEffect, useCallback, React } from 'react';
import { setupWalletSelector } from '@near-wallet-selector/core';
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';

const NearWalletContext = createContext(null);

export function NearWalletProvider({ children }) {
  const [selector, setSelector] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const sel = await setupWalletSelector({
          network: 'testnet',
          modules: [setupMyNearWallet()],
        });
        setSelector(sel);

        const state = sel.store.getState();
        setAccounts(state.accounts);
        setIsSignedIn(state.accounts.length > 0 && state.accounts[0]?.accountId !== null);

        sel.store.subscribe((newState) => {
          setAccounts(newState.accounts);
          setIsSignedIn(newState.accounts.length > 0 && newState.accounts[0]?.accountId !== null);
        });
      } catch (err) {
        console.error('Wallet selector init failed:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const signIn = useCallback(async () => {
    if (!selector) return;
    await selector.signIn({ contractId: 'myagent123.testnet' });
  }, [selector]);

  const signOut = useCallback(async () => {
    if (!selector) return;
    await selector.signOut();
  }, [selector]);

  return (
    <NearWalletContext.Provider value={{
      selector,
      accounts,
      isSignedIn,
      signIn,
      signOut,
      loading,
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

export default NearWalletContext;
