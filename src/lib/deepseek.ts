// DeepSeek 调用封装(仅在服务端 API route 中使用,密钥不暴露给前端)

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-chat";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callDeepSeek(
  messages: ChatMessage[],
  options?: { temperature?: number }
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("未配置 DEEPSEEK_API_KEY,请在项目根目录 .env.local 中填写");
  }

  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: options?.temperature ?? 0.3,
      stream: false,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepSeek 调用失败 (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";
  if (!content) {
    throw new Error("DeepSeek 返回内容为空");
  }
  return content;
}

/** 从大模型返回的文本中解析 JSON(容忍 markdown 代码块包裹) */
export function parseJson<T>(content: string): T {
  let text = content.trim();
  // 去掉 ```json ... ``` 或 ``` ... ``` 包裹
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  // 截取第一个 { 到最后一个 }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    text = text.slice(start, end + 1);
  }
  return JSON.parse(text) as T;
}
