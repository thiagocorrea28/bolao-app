"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton({ fallback = "/leaderboard" }: { fallback?: string }) {
  const router = useRouter();

  return (
    <button
      className="btn-secondary"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push(fallback);
        }
      }}
      type="button"
    >
      <ArrowLeft size={17} />
      Voltar
    </button>
  );
}
