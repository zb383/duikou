import { NextResponse, type NextRequest } from "next/server";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

// 简历文件解析:接收 PDF / Word,提取纯文本返回给前端。
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "未收到文件" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const name = file.name.toLowerCase();
    let text = "";

    if (name.endsWith(".pdf")) {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      text = result.text ?? "";
    } else if (name.endsWith(".docx") || name.endsWith(".doc")) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value ?? "";
    } else {
      return NextResponse.json(
        { error: "仅支持 PDF / Word 格式,请重新选择文件" },
        { status: 400 }
      );
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "未能提取到文本(可能是扫描件或纯图片),请直接粘贴简历文本" },
        { status: 422 }
      );
    }

    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "文件解析失败" },
      { status: 500 }
    );
  }
}
