import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  accountId: string | null;
  credits: number;
}

interface CreditsStore {
  user: User;
  addCredits: (amount: number) => void;
  deductCredits: (amount: number) => boolean;
  setAccountId: (accountId: string | null) => void;
  reset: () => void;
}

export const useCreditsStore = create<CreditsStore>()(
  persist(
    (set, get) => ({
      user: {
        accountId: null,
        credits: 0,
      },
      addCredits: (amount) =>
        set((state) => ({
          user: { ...state.user, credits: state.user.credits + amount },
        })),
      deductCredits: (amount) => {
        const { user } = get();
        if (user.credits >= amount) {
          set((state) => ({
            user: { ...state.user, credits: state.user.credits - amount },
          }));
          return true;
        }
        return false;
      },
      setAccountId: (accountId) =>
        set((state) => ({
          user: { ...state.user, accountId },
        })),
      reset: () =>
        set({
          user: { accountId: null, credits: 0 },
        }),
    }),
    {
      name: 'retro-credits',
    }
  )
);
