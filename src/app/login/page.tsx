"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/storage";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function handleSend() {
    if (!/^1\d{10}$/.test(phone)) {
      setError("请输入正确的 11 位手机号");
      return;
    }
    setSent(true);
    setError("");
    // 测试环境:验证码固定 123456,上线前接入短信服务
  }

  function handleLogin() {
    if (!/^1\d{10}$/.test(phone)) {
      setError("请输入正确的 11 位手机号");
      return;
    }
    if (code !== "123456") {
      setError("验证码错误(测试环境验证码为 123456)");
      return;
    }
    storage.setUser({ phone });
    router.replace("/");
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6">
        <h1 className="mb-1 text-xl font-bold">登录「对口」</h1>
        <p className="mb-5 text-sm text-zinc-500">手机号验证码登录</p>

        {error && (
          <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="手机号"
          inputMode="numeric"
          className="mb-3 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
        />

        <div className="mb-3 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="验证码"
            inputMode="numeric"
            className="flex-1 rounded-md border border-zinc-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
          <button
            onClick={handleSend}
            className="shrink-0 rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
          >
            {sent ? "已发送" : "发送验证码"}
          </button>
        </div>

        {sent && (
          <p className="mb-3 text-xs text-zinc-400">
            测试环境验证码:123456(上线前接入短信服务)
          </p>
        )}

        <button
          onClick={handleLogin}
          className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          登录
        </button>
      </div>
    </div>
  );
}
