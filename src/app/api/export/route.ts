import { NextRequest } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from "docx";
import PDFDocument from "pdfkit";
import { existsSync } from "fs";

// 导出改写后的简历为 Word / PDF。
// body: { type: "docx" | "pdf", content: 简历文本, filename: 文件名(不含扩展名) }

type LineType = "h1" | "h2" | "bullet" | "text" | "empty";

interface Line {
  type: LineType;
  text: string;
}

/** 把大模型输出的 markdown 风格简历文本解析成结构化行 */
function parseResumeMarkdown(content: string): Line[] {
  return content.split("\n").map((raw) => {
    const line = raw.replace(/\r$/, "").trim();
    if (!line) return { type: "empty", text: "" };
    if (/^#{1,2}\s/.test(line)) return { type: "h1", text: line.replace(/^#{1,2}\s*/, "") };
    if (/^#{3,4}\s/.test(line)) return { type: "h2", text: line.replace(/^#{3,4}\s*/, "") };
    if (/^[-•*]\s/.test(line)) return { type: "bullet", text: line.replace(/^[-•*]\s*/, "") };
    if (/^(【[^】]*】|第[一二三四五六七八九十]+[章节部分])/.test(line)) {
      return { type: "h2", text: line };
    }
    return { type: "text", text: line };
  });
}

/** 生成 Word(.docx) 文件 */
async function buildDocx(lines: Line[]): Promise<Buffer> {
  const children: Paragraph[] = [];

  for (const line of lines) {
    if (line.type === "empty") continue;
    if (line.type === "h1") {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 120 },
          children: [new TextRun({ text: line.text, bold: true, size: 30 })],
        })
      );
    } else if (line.type === "h2") {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 120, after: 60 },
          children: [new TextRun({ text: line.text, bold: true, size: 24 })],
        })
      );
    } else if (line.type === "bullet") {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 40 },
          children: [new TextRun({ text: line.text, size: 21 })],
        })
      );
    } else {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: line.text, size: 21 })],
        })
      );
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });
  return Packer.toBuffer(doc);
}

/** 查找可用的中文字体文件 */
function findChineseFont(): string | null {
  const candidates = [
    "C:/Windows/Fonts/simhei.ttf",
    "C:/Windows/Fonts/simsun.ttc",
    "C:/Windows/Fonts/msyh.ttc",
    "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

/** 生成 PDF 文件 */
function buildPdf(lines: Line[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const fontPath = findChineseFont();
    if (fontPath) {
      doc.registerFont("CN", fontPath);
      doc.font("CN");
    } else {
      reject(new Error("未找到中文字体,无法导出 PDF"));
      return;
    }

    for (const line of lines) {
      if (line.type === "empty") {
        doc.moveDown(0.4);
        continue;
      }
      if (line.type === "h1") {
        doc.moveDown(0.6).fontSize(16).fillColor("#111111").text(line.text);
        doc.moveDown(0.3);
      } else if (line.type === "h2") {
        doc.moveDown(0.4).fontSize(13).fillColor("#333333").text(line.text);
        doc.moveDown(0.2);
      } else if (line.type === "bullet") {
        doc.fontSize(11).fillColor("#222222").text(`•  ${line.text}`, {
          indent: 12,
          lineGap: 2,
        });
      } else {
        doc.fontSize(11).fillColor("#222222").text(line.text, { lineGap: 2 });
      }
    }

    doc.end();
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = body.type as string;
    const content = (body.content as string) ?? "";
    const filename = (body.filename as string) || "对口简历";

    if (!content.trim()) {
      return new Response(JSON.stringify({ error: "简历内容为空,无法导出" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const lines = parseResumeMarkdown(content);

    if (type === "docx") {
      const buffer = await buildDocx(lines);
      return new Response(buffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}.docx`,
        },
      });
    }

    if (type === "pdf") {
      const buffer = await buildPdf(lines);
      return new Response(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}.pdf`,
        },
      });
    }

    return new Response(JSON.stringify({ error: "未知的导出类型" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "导出失败" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
