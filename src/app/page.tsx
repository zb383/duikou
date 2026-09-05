"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { storage, today } from "@/lib/storage";
import type { Application, DiagnosisResult } from "@/lib/types";
import { DIAGNOSIS_STATUS_META } from "@/lib/types";

export default function Home() {
  const router = useRouter();

  const [resumeText, setResumeText] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [jdText, setJdText] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");

  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [rewritten, setRewritten] = useState("");

  const [loading, setLoading] = useState<
    "" | "parse" | "diagnose" | "rewrite" | "save"
  >("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const u = storage.getUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    const r = storage.getResume();
    if (r) {
      setResumeText(r.rawText);
      setResumeName(r.name);
    }
  }, [router]);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading("parse");
    setError("");
    setNotice("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/parse-resume", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "解析失败");
      setResumeText(data.text);
      setResumeName(file.name);
      storage.setResume({
        name: file.name,
        rawText: data.text,
        updatedAt: Date.now(),
      });
      setNotice("简历解析成功");
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析失败");
    } finally {
      setLoading("");
    }
  }

  async function handleDiagnose() {
    if (!resumeText.trim() || !jdText.trim()) {
      setError("请先上传简历并粘贴岗位 JD");
      return;
    }
    setLoading("diagnose");
    setError("");
    setDiagnosis(null);
    setRewritten("");
    try {
      const res = await fetch("/api/deepseek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "diagnose", resumeText, jdText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "诊断失败");
      setDiagnosis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "诊断失败");
    } finally {
      setLoading("");
    }
  }

  async function handleRewrite() {
    if (!diagnosis) return;
    setLoading("rewrite");
    setError("");
    setRewritten("");
    try {
      const res = await fetch("/api/deepseek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rewrite",
          resumeText,
          jdText,
          diagnosis: diagnosis.diagnosis,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "改写失败");
      setRewritten(data.rewritten);
    } catch (err) {
      setError(err instanceof Error ? err.message : "改写失败");
    } finally {
      setLoading("");
    }
  }

  function handleSaveToBoard() {
    if (!company.trim() || !position.trim()) {
      setError("请填写公司名和岗位,才能保存到投递看板");
      return;
    }
    setLoading("save");
    const list = storage.getApplications();
    const app: Application = {
      id: `${Date.now()}`,
      company: company.trim(),
      position: position.trim(),
      status: "applied",
      appliedDate: today(),
      jd: jdText,
    };
    storage.setApplications([app, ...list]);
    setNotice("已保存到投递看板");
    setLoading("");
  }

  const matched = diagnosis?.diagnosis.filter((d) => d.status === "matched").length ?? 0;
  const missing = diagnosis?.diagnosis.filter((d) => d.status === "missing").length ?? 0;
  const weak = diagnosis?.diagnosis.filter((d) => d.status === "weak").length ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">改简历</h1>
        <p className="mt-1 text-sm text-zinc-500">
          上传简历 + 粘贴 JD,先诊断差异,再一键精准改写
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {notice}
        </div>
      )}

      {/* 第一步:简历 + JD 输入 */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-medium">① 你的简历</h2>
            <label className="cursor-pointer text-sm text-blue-600 hover:underline">
              {loading === "parse" ? "解析中…" : "上传 PDF / Word"}
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleFile}
                disabled={loading === "parse"}
              />
            </label>
          </div>
          {resumeName && (
            <p className="mb-2 text-xs text-zinc-400">已加载:{resumeName}</p>
          )}
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="也可以直接粘贴简历文本…"
            className="h-56 w-full resize-none rounded-md border border-zinc-200 p-3 text-sm focus:border-blue-400 focus:outline-none"
          />
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="mb-2 font-medium">② 岗位 JD</h2>
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="粘贴目标岗位的 JD 描述…"
            className="h-56 w-full resize-none rounded-md border border-zinc-200 p-3 text-sm focus:border-blue-400 focus:outline-none"
          />
        </section>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleDiagnose}
          disabled={loading === "diagnose"}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading === "diagnose" ? "正在分析 JD 要求…" : "开始诊断"}
        </button>
        <div className="flex flex-1 items-center gap-3">
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="公司名"
            className="w-40 rounded-md border border-zinc-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
          <input
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="岗位"
            className="w-40 rounded-md border border-zinc-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
          <button
            onClick={handleSaveToBoard}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
          >
            保存到看板
          </button>
        </div>
      </div>

      {/* 第二步:诊断结果(左右对比) */}
      {diagnosis && (
        <section className="mt-8 rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="mb-3 font-medium">③ 差异诊断报告</h2>

          <div className="mb-4 rounded-md bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {diagnosis.summary}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-medium text-zinc-500">JD 能力要求</h3>
              <ul className="space-y-2">
                {diagnosis.requirements.map((r, i) => (
                  <li key={i} className="rounded border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm">
                    <span className="font-medium">{r.requirement}</span>
                    <span className="ml-2 text-xs text-zinc-400">重要性:{r.importance}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-zinc-500">你的简历匹配情况</h3>
              <ul className="space-y-2">
                {diagnosis.diagnosis.map((d, i) => {
                  const meta = DIAGNOSIS_STATUS_META[d.status];
                  return (
                    <li key={i} className="rounded border border-zinc-100 px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={meta.color}>{meta.icon}</span>
                        <span className="font-medium">{d.requirement}</span>
                        <span className={`ml-auto text-xs ${meta.color}`}>{meta.label}</span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">{d.detail}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 border-t border-zinc-100 pt-4">
            <button
              onClick={handleRewrite}
              disabled={loading === "rewrite"}
              className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading === "rewrite" ? "正在优化简历…" : "⚡ AI 一键改写简历"}
            </button>
            <span className="text-xs text-zinc-400">
              命中 {matched} · 缺失 {missing} · 薄弱 {weak}
            </span>
          </div>
        </section>
      )}

      {/* 第三步:改写结果 */}
      {rewritten && (
        <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="mb-3 font-medium">④ 改写结果</h2>
          <pre className="whitespace-pre-wrap rounded-md bg-zinc-50 p-4 text-sm leading-relaxed">
            {rewritten}
          </pre>
          <p className="mt-3 text-xs text-zinc-400">
            改写严格基于你的真实经历,未编造内容。若标注「⚠️ 无法改写」,说明该能力简历中无对应经历,建议补充真实项目。
          </p>
        </section>
      )}
    </div>
  );
}
