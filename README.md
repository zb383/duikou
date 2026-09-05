# 对口 · 精准改简历 + 投递复盘

> 一个面向找实习/校招学生的 Web App,把「盲投 + 手动改简历」变成「看懂 JD → 精准改简历 → 投递后复盘」的可持续求职流程。

这是 **「对口」单项目全流程产品经理作品集** 的仓库,包含:

- 完整的产品思考链(需求调研 → 三视角诊断 → 概念文档 → PRD)
- 一个可运行的 MVP(Next.js + DeepSeek)

---

## 一、作品集文档

按顺序阅读,能还原整个产品的诞生过程:

| 文档 | 内容 |
|------|------|
| [01 · 需求调研与三视角诊断](docs/01-需求调研与三视角诊断.md) | 从用户访谈到方向收敛的完整过程 |
| [02 · 产品概念文档](docs/02-产品概念文档.md) | 一句话定位、目标用户、边界、形态选型 |
| [03 · 产品需求文档 PRD](docs/03-产品需求文档-PRD.md) | 可直接交付开发的完整 PRD |
| [04 · 竞品与商业分析](docs/04-竞品与商业分析.md) | 变现逻辑与差异化护城河 |
| [05 · MVP 实现说明](docs/05-MVP实现说明.md) | 技术选型、架构、核心链路实现 |

---

## 二、核心功能

1. **改简历(核心)**:上传 PDF/Word 简历 + 粘贴 JD → DeepSeek 解析 JD 能力要求 → 逐项诊断「命中/缺失/薄弱」→ 一键精准改写
2. **投递看板**:集中记录投递的公司/岗位/状态,状态可流转(已投 → 笔试 → 面试 → Offer / 被拒)
3. **截止提醒**:设置截止日期,临近/过期自动高亮
4. **登录**:手机号验证码登录(测试环境验证码固定 123456)
5. **导出 Word/PDF**:改写完成后一键导出 .docx 或 .pdf 文件

---

## 三、技术栈

- **框架**:Next.js 16(App Router)+ React 19 + TypeScript
- **样式**:Tailwind CSS 4
- **AI**:DeepSeek API(deepseek-chat),密钥经服务端 API route 代理,不暴露前端
- **简历解析**:mammoth(Word)、pdf-parse(PDF)
- **文件导出**:docx(Word)、pdfkit(PDF)
- **数据存储**:localStorage(MVP 不上线,免数据库)

---

## 四、本地运行

```bash
# 1. 安装依赖
npm install

# 2. 配置 DeepSeek API Key
#    复制 .env.local.example 为 .env.local,填入你的 key
#    获取地址:https://platform.deepseek.com/api_keys
cp .env.local.example .env.local

# 3. 启动开发服务器
npm run dev

# 4. 浏览器打开 http://localhost:3000
```

> 登录时验证码固定为 `123456`(测试环境,上线前需接入短信服务)。

---

## 五、项目结构

```
duikou/
├── docs/                       # 作品集文档
│   ├── 01-需求调研与三视角诊断.md
│   ├── 02-产品概念文档.md
│   ├── 03-产品需求文档-PRD.md
│   ├── 04-竞品与商业分析.md
│   └── 05-MVP实现说明.md
├── src/
│   ├── app/
│   │   ├── page.tsx            # 改简历(核心页)
│   │   ├── board/page.tsx      # 投递看板
│   │   ├── login/page.tsx      # 登录
│   │   └── api/
│   │       ├── deepseek/route.ts       # DeepSeek 代理(诊断+改写)
│   │       ├── parse-resume/route.ts   # 简历文件解析
│   │       └── export/route.ts         # 导出 Word/PDF
│   ├── components/Nav.tsx      # 顶部导航
│   └── lib/
│       ├── types.ts            # 数据模型
│       ├── storage.ts          # localStorage 封装
│       └── deepseek.ts         # DeepSeek 调用封装
└── .env.local.example          # 环境变量模板
```
