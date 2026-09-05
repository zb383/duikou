import { NextResponse, type NextRequest } from "next/server";
import { callDeepSeek, parseJson } from "@/lib/deepseek";
import type { DiagnosisResult, DiagnosisItem } from "@/lib/types";

// DeepSeek 代理:前端不直接持有密钥,统一走这里。
// action = "diagnose" 诊断差异;action = "rewrite" 精准改写。

const SYSTEM_PROMPT = `你是资深求职顾问与简历优化专家,服务对象是找实习/校招的学生。
你的任务:
1. 解析岗位 JD 的核心能力要求;
2. 将 JD 要求与学生简历逐项对比,诊断出"命中 / 缺失 / 薄弱";
3. 基于真实经历对简历进行针对性改写。

铁律:改写只基于简历中已有的真实经历,绝不编造不存在的项目、数据或头衔。若某项能力简历中确无对应经历,必须如实说明"无法改写",绝不杜撰。`;

function buildDiagnosePrompt(resumeText: string, jdText: string): string {
  return `请根据以下岗位 JD 和简历,完成差异诊断。

【岗位 JD】
${jdText}

【学生简历】
${resumeText}

请只输出一个 JSON 对象(不要输出 markdown 代码块,不要任何解释文字),结构如下:
{
  "requirements": [{"requirement": "JD 要求的能力", "importance": "高/中/低"}],
  "diagnosis": [{"requirement": "能力要求", "status": "matched|missing|weak", "detail": "一句话说明简历中该能力的现状或差距"}],
  "summary": "一段话总结:这份 JD 最看重什么,简历命中/缺失/薄弱各几项,最该优先补什么"
}

要求:
- status 只能取 "matched"(命中)、"missing"(缺失)、"weak"(薄弱) 三者之一;
- requirements 提取 3~8 项最核心的能力要求;
- 语言使用简体中文。`;
}

function buildRewritePrompt(
  resumeText: string,
  jdText: string,
  diagnosis: DiagnosisItem[]
): string {
  const targets = diagnosis
    .filter((d) => d.status !== "matched")
    .map((d) => `- ${d.requirement}(${d.status === "missing" ? "缺失" : "薄弱"}: ${d.detail})`)
    .join("\n");

  return `请针对以下岗位 JD,对简历中"缺失 / 薄弱"的部分进行精准改写。

【岗位 JD】
${jdText}

【学生原始简历】
${resumeText}

【需要优化的项】
${targets}

改写要求:
1. 只改写与上述"缺失/薄弱"项相关的段落,其余保持不变;
2. 严格基于原始简历中已有的真实经历,不得编造任何不存在的项目、公司、数据、技能;
3. 若某项能力在原始简历中确实没有对应经历,请在输出中明确标注「⚠️ 无法改写:简历中无相关经历,建议补充真实项目」,不要硬编;
4. 输出改写后的完整简历(用清晰的分节标题:教育背景 / 实习经历 / 项目经历 / 技能 / 其他);
5. 在简历末尾附一段"本次改动说明",逐条说明改了什么、为什么改;
6. 使用简体中文。`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action as string;
    const resumeText = (body.resumeText as string) ?? "";
    const jdText = (body.jdText as string) ?? "";
    const diagnosis = (body.diagnosis as DiagnosisItem[]) ?? [];

    if (action === "diagnose") {
      if (!resumeText.trim() || !jdText.trim()) {
        return NextResponse.json(
          { error: "简历和 JD 均不能为空" },
          { status: 400 }
        );
      }
      const content = await callDeepSeek([
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildDiagnosePrompt(resumeText, jdText) },
      ]);
      const result = parseJson<DiagnosisResult>(content);
      return NextResponse.json(result);
    }

    if (action === "rewrite") {
      if (!resumeText.trim() || !jdText.trim()) {
        return NextResponse.json(
          { error: "简历和 JD 均不能为空" },
          { status: 400 }
        );
      }
      const content = await callDeepSeek(
        [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildRewritePrompt(resumeText, jdText, diagnosis) },
        ],
        { temperature: 0.4 }
      );
      return NextResponse.json({ rewritten: content });
    }

    return NextResponse.json({ error: "未知的 action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "处理失败" },
      { status: 500 }
    );
  }
}
