// 「对口」核心数据模型

/** 简历(解析后的结构化文本) */
export interface Resume {
  /** 简历标题/文件名 */
  name: string;
  /** 解析出的原始文本 */
  rawText: string;
  /** 最后更新时间戳 */
  updatedAt: number;
}

/** 差异诊断单项的状态 */
export type DiagnosisStatus = "matched" | "missing" | "weak";

/** 差异诊断单项 */
export interface DiagnosisItem {
  /** JD 要求的能力 */
  requirement: string;
  /** 匹配状态:命中 / 缺失 / 薄弱 */
  status: DiagnosisStatus;
  /** 具体说明 */
  detail: string;
}

/** 差异诊断完整结果 */
export interface DiagnosisResult {
  /** JD 解析出的能力要求 */
  requirements: { requirement: string; importance: string }[];
  /** 逐项诊断 */
  diagnosis: DiagnosisItem[];
  /** 整体诊断结论 */
  summary: string;
}

/** 投递状态 */
export type ApplicationStatus =
  | "applied"
  | "written_test"
  | "interview"
  | "offer"
  | "rejected";

/** 投递记录 */
export interface Application {
  id: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  /** 投递日期 yyyy-mm-dd */
  appliedDate: string;
  /** 截止日期 yyyy-mm-dd(可选) */
  deadline?: string;
  /** 备注 */
  note?: string;
  /** 被拒原因(状态=rejected 时建议填) */
  rejectReason?: string;
  /** 关联的 JD 原文(可选) */
  jd?: string;
}

/** 登录用户 */
export interface User {
  phone: string;
}

/** 投递状态的中文与颜色映射 */
export const APPLICATION_STATUS_META: Record<
  ApplicationStatus,
  { label: string; color: string }
> = {
  applied: { label: "已投", color: "bg-blue-100 text-blue-700" },
  written_test: { label: "笔试中", color: "bg-amber-100 text-amber-700" },
  interview: { label: "面试中", color: "bg-purple-100 text-purple-700" },
  offer: { label: "Offer", color: "bg-green-100 text-green-700" },
  rejected: { label: "被拒", color: "bg-gray-200 text-gray-600" },
};

/** 诊断状态的中文与样式映射 */
export const DIAGNOSIS_STATUS_META: Record<
  DiagnosisStatus,
  { label: string; icon: string; color: string }
> = {
  matched: { label: "命中", icon: "✓", color: "text-green-600" },
  missing: { label: "缺失", icon: "✗", color: "text-red-600" },
  weak: { label: "薄弱", icon: "△", color: "text-amber-600" },
};
