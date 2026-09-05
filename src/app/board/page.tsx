"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { storage, genId, today } from "@/lib/storage";
import type { Application, ApplicationStatus } from "@/lib/types";
import { APPLICATION_STATUS_META } from "@/lib/types";

const ALL_STATUS: ApplicationStatus[] = [
  "applied",
  "written_test",
  "interview",
  "offer",
  "rejected",
];

export default function BoardPage() {
  const router = useRouter();
  const [list, setList] = useState<Application[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company: "", position: "", deadline: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!storage.getUser()) {
      router.replace("/login");
      return;
    }
    setList(storage.getApplications());
  }, [router]);

  function refresh(next: Application[]) {
    setList(next);
    storage.setApplications(next);
  }

  function handleAdd() {
    if (!form.company.trim() || !form.position.trim()) {
      setError("公司名和岗位为必填");
      return;
    }
    const app: Application = {
      id: genId(),
      company: form.company.trim(),
      position: form.position.trim(),
      status: "applied",
      appliedDate: today(),
      deadline: form.deadline || undefined,
    };
    refresh([app, ...list]);
    setForm({ company: "", position: "", deadline: "" });
    setShowForm(false);
    setError("");
  }

  function handleStatus(id: string, status: ApplicationStatus) {
    refresh(list.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  function handleDelete(id: string) {
    if (!confirm("删除后无法恢复,是否继续删除这条投递记录?")) return;
    refresh(list.filter((a) => a.id !== id));
  }

  function deadlineInfo(a: Application): { text: string; cls: string } {
    if (!a.deadline) return { text: "未设截止", cls: "text-zinc-400" };
    const days = Math.ceil(
      (new Date(a.deadline).getTime() - Date.now()) / 86400000
    );
    if (days < 0) return { text: "已截止", cls: "text-zinc-400" };
    if (days <= 1) return { text: `还剩 ${days} 天`, cls: "font-medium text-amber-600" };
    if (days <= 3) return { text: `还剩 ${days} 天`, cls: "text-amber-500" };
    return { text: `还剩 ${days} 天`, cls: "text-zinc-500" };
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">投递看板</h1>
          <p className="mt-1 text-sm text-zinc-500">
            集中记录每一次投递,不错过截止时间
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + 新增投递
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="公司名 *"
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
            <input
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              placeholder="岗位 *"
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
            <input
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              type="date"
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
            <button
              onClick={handleAdd}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white py-16 text-center">
          <p className="text-zinc-400">你还没有投递记录,去精准投递第一家吧</p>
          <Link
            href="/"
            className="mt-2 inline-block text-sm text-blue-600 hover:underline"
          >
            去改简历 →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
              <tr>
                <th className="px-4 py-3">公司</th>
                <th className="px-4 py-3">岗位</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">投递日期</th>
                <th className="px-4 py-3">截止</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => {
                const meta = APPLICATION_STATUS_META[a.status];
                const dl = deadlineInfo(a);
                return (
                  <tr key={a.id} className="border-t border-zinc-100">
                    <td className="px-4 py-3 font-medium">{a.company}</td>
                    <td className="px-4 py-3">{a.position}</td>
                    <td className="px-4 py-3">
                      <select
                        value={a.status}
                        onChange={(e) =>
                          handleStatus(a.id, e.target.value as ApplicationStatus)
                        }
                        className={`rounded-full border-0 px-2 py-1 text-xs ${meta.color}`}
                      >
                        {ALL_STATUS.map((s) => (
                          <option key={s} value={s}>
                            {APPLICATION_STATUS_META[s].label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{a.appliedDate}</td>
                    <td className={`px-4 py-3 ${dl.cls}`}>{dl.text}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
