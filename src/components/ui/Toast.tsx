"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface ToastMessage {
  id: number;
  text: string;
}

interface ToastContextValue {
  show: (text: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const show = (text: string) => {
    const id = Date.now();
    setMessages(prev => [...prev, { id, text }]);
    setTimeout(() => {
      setMessages(prev => prev.filter(m => m.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {messages.map(m => (
          <div
            key={m.id}
            className="rounded-md bg-slate-800 px-3 py-2 text-xs text-slate-50 shadow-lg"
          >
            {m.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
