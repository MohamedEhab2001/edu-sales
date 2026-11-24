"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { clientApi } from "@/lib/client-api";
import { Icon, type IconName } from "@/components/ui/icon";

const navigation: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/leads", label: "Leads", icon: "leads" },
  { href: "/calls", label: "Scheduled calls", icon: "calls" },
  { href: "/settings", label: "Saved values", icon: "settings" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState("Edulato Admin");

  useEffect(() => {
    clientApi<{ user: { name: string } }>("/api/auth/session")
      .then((data) => setUserName(data.user.name))
      .catch(() => undefined);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  async function logout() {
    await clientApi("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar--open" : ""}`}>
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <div>
            <strong>Edulato</strong>
            <small>Sales workspace</small>
          </div>
        </div>

        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link className={active ? "is-active" : ""} href={item.href} key={item.href}>
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-user">
          <span className="avatar">{userName.split(" ").map((word) => word[0]).slice(0, 2).join("")}</span>
          <div>
            <strong>{userName}</strong>
            <small>Administrator</small>
          </div>
          <button className="icon-button" type="button" aria-label="Log out" onClick={logout}>
            <Icon name="logout" />
          </button>
        </div>
      </aside>

      {menuOpen ? <button className="sidebar-scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} /> : null}

      <main className="app-main">
        <header className="mobile-header">
          <button className="icon-button" type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <Icon name="menu" />
          </button>
          <div className="brand-lockup brand-lockup--compact">
            <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
            <strong>Edulato Sales</strong>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
