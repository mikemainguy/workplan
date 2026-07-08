"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { icons } from "./nav-icons";
import { ShutdownButton } from "./shutdown-button";
import { UpdateBanner } from "./update-banner";
import { AiBadge } from "./ai-badge";

const navItems = [
  { href: "/", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/people", label: "People", icon: "Users" },
  { href: "/projects", label: "Projects", icon: "FolderKanban" },
  { href: "/interactions", label: "Interactions",
    icon: "MessageSquare" },
  { href: "/actions", label: "Action Items",
    icon: "CheckCircle" },
  { href: "/search", label: "Search", icon: "Search" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full w-56 flex-col border-r
      bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/"
          className="text-lg font-semibold tracking-tight">
          WorkPlan
        </Link>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md",
                "px-3 py-2 text-sm font-medium",
                "transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              )}>
              {icons[item.icon]}
              {item.label}
              {item.href === "/interactions" && (
                <AiBadge />
              )}
            </Link>
          );
        })}
      </div>
      <UpdateBanner />
      <div className="border-t p-3 space-y-2">
        <ShutdownButton />
        <p className="text-xs text-muted-foreground text-center">
          v{process.env.APP_VERSION}
        </p>
      </div>
    </nav>
  );
}
