"use client";

// localStorage 封装。MVP 不上线、无后端数据库,数据全部落在浏览器本地。

import type { Application, Resume, User } from "./types";

const KEYS = {
  user: "duikou:user",
  resume: "duikou:resume",
  applications: "duikou:applications",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function remove(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

export const storage = {
  // 用户
  getUser(): User | null {
    return read<User | null>(KEYS.user, null);
  },
  setUser(user: User) {
    write(KEYS.user, user);
  },
  clearUser() {
    remove(KEYS.user);
  },
  // 简历
  getResume(): Resume | null {
    return read<Resume | null>(KEYS.resume, null);
  },
  setResume(resume: Resume) {
    write(KEYS.resume, resume);
  },
  // 投递记录
  getApplications(): Application[] {
    return read<Application[]>(KEYS.applications, []);
  },
  setApplications(list: Application[]) {
    write(KEYS.applications, list);
  },
};

/** 生成简易唯一 id */
export function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 今日日期 yyyy-mm-dd */
export function today(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
