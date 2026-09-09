"use client";

import { useState } from "react";
import { Coffee } from "lucide-react";

export default function ProductThumb({ imageUrl }: { imageUrl: string | null }) {
  const [failed, setFailed] = useState(false);
  if (imageUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    );
  }
  return <Coffee size={18} />;
}
