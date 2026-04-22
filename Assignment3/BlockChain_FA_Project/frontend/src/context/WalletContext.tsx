import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { BrowserProvider, type Eip1193Provider } from "ethers";

/** MetaMask exposes event subscription beyond minimal EIP-1193 typing. */
type EthereumWithEvents = Eip1193Provider & {
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

type WalletState = {
  address: string | null;
  chainId: bigint | null;
  connecting: boolean;
  error: string | null;
  provider: BrowserProvider | null;
};

type WalletContextValue = WalletState & {
  connect: () => Promise<void>;
  disconnect: () => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

function getEthereum(): EthereumWithEvents | undefined {
  return (window as unknown as { ethereum?: EthereumWithEvents }).ethereum;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<bigint | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const provider = useMemo(() => {
    const eth = getEthereum();
    return eth ? new BrowserProvider(eth) : null;
  }, []);

  const refresh = useCallback(async () => {
    const eth = getEthereum();
    if (!eth) return;
    const p = new BrowserProvider(eth);
    const accounts = await p.listAccounts();
    if (accounts.length > 0 && accounts[0]) {
      setAddress(await accounts[0].getAddress());
    } else {
      setAddress(null);
    }
    const net = await p.getNetwork();
    setChainId(net.chainId);
  }, []);

  useEffect(() => {
    void refresh();
    const eth = getEthereum();
    const subscribe = eth?.on;
    const unsubscribe = eth?.removeListener;
    if (!eth || !subscribe || !unsubscribe) return;
    const onAccounts = () => void refresh();
    const onChain = () => void refresh();
    subscribe.call(eth, "accountsChanged", onAccounts);
    subscribe.call(eth, "chainChanged", onChain);
    return () => {
      unsubscribe.call(eth, "accountsChanged", onAccounts);
      unsubscribe.call(eth, "chainChanged", onChain);
    };
  }, [refresh]);

  const connect = useCallback(async () => {
    setError(null);
    const eth = getEthereum();
    if (!eth) {
      setError("Install MetaMask or another EIP-1193 wallet.");
      return;
    }
    setConnecting(true);
    try {
      await eth.request({ method: "eth_requestAccounts" });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setConnecting(false);
    }
  }, [refresh]);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      address,
      chainId,
      connecting,
      error,
      provider,
      connect,
      disconnect,
    }),
    [address, chainId, connecting, error, provider, connect, disconnect]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
