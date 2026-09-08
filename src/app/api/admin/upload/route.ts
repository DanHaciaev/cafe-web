import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Файловое хранилище не подключено (BLOB_READ_WRITE_TOKEN отсутствует)." },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Разрешены только JPG, PNG, WEBP, GIF" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Файл больше 5MB" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "jpg";
  const key = `menu/${crypto.randomUUID()}.${ext}`;

  const blob = await put(key, file, { access: "public" });

  return NextResponse.json({ url: blob.url });
}
