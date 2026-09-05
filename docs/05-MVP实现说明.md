# 05 · MVP 实现说明

> 技术选型、架构、核心链路实现,以及 MVP 阶段的取舍与已知限制。

---

## 一、技术选型与理由

| 决策 | 选择 | 理由 |
|------|------|------|
| 框架 | Next.js 16(App Router)+ React 19 + TypeScript | 前后端一体,API route 调 DeepSeek 能隐藏密钥;AI 生成质量高;后续可一键部署 |
| 样式 | Tailwind CSS 4 | 快速出干净 UI,响应式友好 |
| AI | DeepSeek API(deepseek-chat) | 用户已有密钥;OpenAI 兼容接口,调用简单;中文能力强 |
| 简历解析 | mammoth(Word)+ pdf-parse(PDF) | 纯 JS,服务端可用,提取纯文本喂给大模型 |
| 文件导出 | docx(Word)+ pdfkit(PDF) | 服务端生成文件,PDF 用系统黑体中文字体 |
| 数据存储 | localStorage | MVP 不上线,免数据库,快速跑通核心链路 |

## 二、架构

```
浏览器(前端)
  ├── 登录 / 改简历 / 投递看板 三个页面
  ├── localStorage:用户、简历、投递记录
  └── fetch 调用服务端 API
        │
        ├── /api/parse-resume  → mammoth / pdf-parse 提取文本
        └── /api/deepseek       → DeepSeek(诊断 + 改写)
                                      │
                                 DEEPSEEK_API_KEY(仅服务端可见)
```

**密钥安全**:前端不直接持有 DeepSeek key,统一走 `/api/deepseek` 代理,key 从 `process.env.DEEPSEEK_API_KEY` 读取。

## 三、核心链路实现

### 3.1 简历解析

- 前端上传文件 → `POST /api/parse-resume`(FormData)
- 服务端按扩展名分发:`.pdf` 用 `PDFParse`、`.docx/.doc` 用 `mammoth.extractRawText`
- 返回纯文本,前端存入 localStorage

### 3.2 JD 差异诊断(核心 Prompt 设计)

```
系统提示词:资深求职顾问,服务对象是找实习/校招学生,解析 JD → 逐项诊断 → 改写。
铁律:改写只基于简历真实经历,绝不编造。

用户提示词(诊断):
  附上【岗位 JD】+【学生简历】
  要求只输出 JSON:
  {
    "requirements": [{requirement, importance}],
    "diagnosis": [{requirement, status: matched|missing|weak, detail}],
    "summary": "..."
  }
```

### 3.3 精准改写(核心 Prompt 设计)

```
系统提示词:同上。

用户提示词(改写):
  附上【岗位 JD】+【学生原始简历】+【需要优化的项(缺失/薄弱)】
  要求:
  1. 只改写缺失/薄弱相关段落;
  2. 严格基于真实经历,不得编造;
  3. 无对应经历时明确标注「⚠️ 无法改写」;
  4. 输出完整改写后简历 + 末尾附「本次改动说明」。
```

### 3.4 大模型输出解析

DeepSeek 返回可能带 markdown 代码块包裹,`parseJson` 做了容错:剥离 ``` 围栏、截取首尾 `{}`,再 `JSON.parse`。

### 3.5 导出 Word / PDF

- 前端改写结果区提供「导出 Word」「导出 PDF」按钮 → `POST /api/export`
- 服务端把简历 markdown 文本解析成结构化行(h1 / h2 / 列表 / 正文)
- Word 用 `docx` 库生成 `.docx`;PDF 用 `pdfkit` 生成,中文用系统黑体 `simhei.ttf`

## 四、数据模型(localStorage)

```typescript
interface Resume { name: string; rawText: string; updatedAt: number }

interface DiagnosisResult {
  requirements: { requirement: string; importance: string }[];
  diagnosis: { requirement: string; status: "matched"|"missing"|"weak"; detail: string }[];
  summary: string;
}

interface Application {
  id: string; company: string; position: string;
  status: "applied"|"written_test"|"interview"|"offer"|"rejected";
  appliedDate: string; deadline?: string; note?: string;
  rejectReason?: string; jd?: string;
}
```

## 五、MVP 取舍与已知限制

| 项 | MVP 做法 | 上线前需替换 |
|----|---------|------------|
| 登录 | 验证码 mock 固定 `123456` | 接入短信服务(阿里云/腾讯云等) |
| 数据存储 | localStorage(仅本机) | 后端数据库 + 用户体系 |
| 简历版本管理 | 暂未实现多版本留存 | 补充版本历史 |
| 导出 Word/PDF | 已实现(docx + pdfkit) | 已落地,后续可加付费限制 |
| PDF 扫描件 | 无法提取文本,引导粘贴 | 接入 OCR |
| JD 关键词匹配 / 每周复盘 | 未实现(排后续) | 迭代补充 |

## 六、如何运行

```bash
npm install
cp .env.local.example .env.local   # 填入 DEEPSEEK_API_KEY
npm run dev                        # http://localhost:3000
```
