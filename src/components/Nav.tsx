"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { storage } from "@/lib/storage";

export default function Nav() {
  const pathname = usePathname();
  const [user, setUser] = useState(storage.getUser());

  useEffect(() => {
    setUser(storage.getUser());
  }, [pathname]);

  const items = [
    { href: "/", label: "改简历" },
    { href: "/board", label: "投递看板" },
  ];

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-zinc-900">
            对口
            <span className="ml-1.5 text-xs font-normal text-zinc-400">
              精准改简历 + 投递复盘
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={
                  pathname === it.href
                    ? "font-medium text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-900"
                }
              >
                {it.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="text-sm text-zinc-500">
          {user ? (
            <span>📱 {user.phone}</span>
          ) : (
            <Link href="/login" className="text-zinc-600 hover:text-zinc-900">
              登录
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
