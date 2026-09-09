"use client";

import { useRef, useState } from "react";
import { LayoutGrid, Upload } from "lucide-react";

type Props = {
  defaultValue: string | null;
};

export default function CategoryImageField({ defaultValue }: Props) {
  const [url, setUrl] = useState(defaultValue || "");
  const [failed, setFailed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setUrl(data.url);
        setFailed(false);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="relative shrink-0">
      <input type="hidden" name="imageUrl" value={url} />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="group relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-indigo-50 text-indigo-600"
        title="Изменить фото категории"
      >
        {url && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
        ) : (
          <LayoutGrid size={15} />
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
          {uploading ? (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Upload size={13} />
          )}
        </span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
