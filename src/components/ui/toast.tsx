"use client";

import { useCallback, useEffect, useState } from "react";

export function useToast() {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timeout);
  }, [toast]);

  const show = useCallback((message: string) => setToast(message), []);

  return { toast, show };
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 animate-fade-up rounded-full border border-white/10 bg-[#14141d]/95 px-4 py-2 text-sm text-zinc-200 shadow-2xl shadow-black/50 backdrop-blur">
      {message}
    </div>
  );
}
