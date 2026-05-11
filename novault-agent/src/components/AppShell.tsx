import { Link, useLocation } from "wouter";
import { useState } from "react";
import {
  LayoutDashboard,
  ArrowUpRight,
  FileSearch,
  Activity,
  Users,
  Settings,
  ChevronRight,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard", testId: "sidebar-nav-dashboard" },
  { href: "/transfer", icon: ArrowUpRight, label: "New Transfer", testId: "sidebar-nav-transfer" },
  { href: "/tokens", icon: FileSearch, label: "Token Readiness", testId: "sidebar-nav-tokens" },
  { href: "/activity", icon: Activity, label: "Activity", testId: "sidebar-nav-activity" },
  { href: "/recipients", icon: Users, label: "Recipients", testId: "sidebar-nav-recipients" },
  { href: "/settings", icon: Settings, label: "Settings", testId: "sidebar-nav-settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "flex flex-col border-r border-border bg-sidebar transition-all duration-200 ease-in-out fixed inset-y-0 left-0 z-40",
          expanded ? "w-56" : "w-14"
        )}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <div className="flex items-center gap-2.5 h-14 px-3 border-b border-border overflow-hidden">
          <img src="/logofav.png" alt="Novault" className="w-8 h-8 rounded shrink-0" />
          <span
            className={cn(
              "font-bold text-foreground text-sm tracking-wider whitespace-nowrap transition-opacity duration-150",
              expanded ? "opacity-100" : "opacity-0"
            )}
          >
            NOVAULT
          </span>
        </div>

        <nav className="flex-1 py-3 flex flex-col gap-1 px-1.5">
          {NAV_ITEMS.map(({ href, icon: Icon, label, testId }) => {
            const active = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                data-testid={testId}
                className={cn(
                  "flex items-center gap-3 px-2.5 py-2 rounded text-sm transition-colors duration-100 relative overflow-hidden",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span
                  className={cn(
                    "whitespace-nowrap transition-opacity duration-150",
                    expanded ? "opacity-100" : "opacity-0"
                  )}
                >
                  {label}
                </span>
                {active && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-r" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-1.5 py-3 border-t border-border">
          <div
            className={cn(
              "flex items-center gap-2 px-2.5 py-2",
              expanded ? "opacity-100" : "opacity-0",
              "transition-opacity duration-150"
            )}
          >
            <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-primary" />
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
              MAINNET
            </span>
          </div>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center justify-center w-full py-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight
              className={cn(
                "w-3.5 h-3.5 transition-transform duration-200",
                expanded ? "rotate-180" : ""
              )}
            />
          </button>
        </div>
      </aside>

      <div className={cn("flex-1 flex flex-col transition-all duration-200", "ml-14")}>
        <main className="flex-1 overflow-auto">{children}</main>
        <footer className="px-6 py-3 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Shield className="w-3 h-3 text-primary" />
            <span>
              Novault Agent prepares transactions but cannot move funds without your wallet
              signature. Never enter a seed phrase.
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
