'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAccount, useSignMessage, useChainId } from 'wagmi';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface LinkedWallet {
  id: string;
  address: string;
  isExternal: boolean;
  chainId: number | null;
}

export function useWalletLink() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();
  const { isAuthenticated } = useAuth();

  const [linkedWallet, setLinkedWallet] = useState<LinkedWallet | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if the connected wallet matches the linked wallet
  const isWalletLinked = linkedWallet?.address?.toLowerCase() === address?.toLowerCase();

  // Fetch linked wallet on mount
  const fetchLinkedWallet = useCallback(async () => {
    if (!isAuthenticated) {
      setLinkedWallet(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const wallet = await api.getMyWallet();
      setLinkedWallet(wallet);
    } catch (err) {
      setLinkedWallet(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchLinkedWallet();
  }, [fetchLinkedWallet]);

  // Link wallet to account
  const linkWallet = useCallback(async () => {
    if (!address || !isConnected || !isAuthenticated) {
      setError('Please connect your wallet and login first');
      return;
    }

    setIsLinking(true);
    setError(null);

    try {
      // Get nonce from server
      const { message } = await api.getWalletNonce(address);

      // Request signature from wallet
      const signature = await signMessageAsync({ message });

      // Send to backend for verification and linking
      const wallet = await api.linkWallet({
        address,
        signature,
        message,
        chainId,
      });

      setLinkedWallet(wallet);
      return wallet;
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to link wallet';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLinking(false);
    }
  }, [address, isConnected, isAuthenticated, chainId, signMessageAsync]);

  // Unlink wallet from account
  const unlinkWallet = useCallback(async () => {
    if (!isAuthenticated || !linkedWallet) {
      return;
    }

    setIsUnlinking(true);
    setError(null);

    try {
      await api.unlinkWallet();
      setLinkedWallet(null);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to unlink wallet';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUnlinking(false);
    }
  }, [isAuthenticated, linkedWallet]);

  return {
    linkedWallet,
    isWalletLinked,
    isLinking,
    isUnlinking,
    isLoading,
    error,
    linkWallet,
    unlinkWallet,
    refetch: fetchLinkedWallet,
  };
}
