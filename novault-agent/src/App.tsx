import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/AppShell";
import { useWalletStore } from "@/store/walletStore";
import { NETWORK_ENDPOINTS } from "@/lib/solana/connection";

import Dashboard from "@/pages/Dashboard";
import Transfer from "@/pages/Transfer";
import Review from "@/pages/Review";
import Tokens from "@/pages/Tokens";
import Activity from "@/pages/Activity";
import Recipients from "@/pages/Recipients";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppShell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/transfer" component={Transfer} />
        <Route path="/review" component={Review} />
        <Route path="/tokens" component={Tokens} />
        <Route path="/activity" component={Activity} />
        <Route path="/recipients" component={Recipients} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

function SolanaProviders({ children }: { children: React.ReactNode }) {
  const network = useWalletStore((s) => s.network);
  const endpoint = NETWORK_ENDPOINTS[network];

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SolanaProviders>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </SolanaProviders>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
