"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { conversation } from "@/lib/mock/inbox";
import type { ChatMessage } from "@/lib/types";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(conversation);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  function send() {
    const text = draft.trim();
    if (!text) return;
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), from: "user", text },
    ]);
    setDraft("");
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center gap-2 border-b border-line bg-ivory-100 px-3 py-3 sm:px-5">
        <Link
          href="/"
          aria-label="Kembali ke toko"
          className="inline-flex size-11 items-center justify-center rounded-full transition-colors hover:bg-ivory-200"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="m14 6-6 6 6 6" />
          </svg>
        </Link>
        <div
          aria-hidden="true"
          className="size-10 shrink-0 rounded-full bg-sand-200"
        />
        <div className="min-w-0">
          <p className="truncate font-medium">Admin Boutique NC</p>
          <p className="flex items-center gap-1.5 text-xs text-sage-700">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-sage-700" />
            Chat lokal
          </p>
        </div>
      </header>

      <div
        role="log"
        aria-label="Percakapan dengan admin"
        aria-live="polite"
        className="flex-1 space-y-3 overflow-y-auto px-4 py-6"
      >
        <p className="pb-2 text-center text-xs text-espresso-500">Hari ini</p>

        {messages.map((message) => {
          const mine = message.from === "user";
          return (
            <div
              key={message.id}
              className={`max-w-[85%] ${
                mine
                  ? "ml-auto rounded-2xl rounded-br-sm bg-clay-500 p-4 text-white"
                  : "mr-auto rounded-2xl rounded-bl-sm bg-ivory-50 p-4"
              }`}
            >
              {message.imageLabel ? (
                <div className="mb-3 w-56 max-w-full overflow-hidden rounded-xl bg-ivory-100 p-2">
                  <div className="flex aspect-[4/3] items-end rounded-lg bg-sand-300 p-2">
                    <span className="text-[10px] text-espresso-900">
                      [{message.imageLabel}]
                    </span>
                  </div>
                </div>
              ) : null}
              {message.text ? (
                <p className="text-sm leading-relaxed">{message.text}</p>
              ) : null}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="border-t border-line bg-ivory-100 px-3 pt-3 pb-4 sm:px-5">
        <div className="flex min-w-0 items-end gap-2">
          <button
            type="button"
            aria-label="Lampirkan foto"
            onClick={() => fileRef.current?.click()}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-ivory-50 text-lg leading-none"
          >
            <span aria-hidden="true">+</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setMessages((current) => [
                ...current,
                {
                  id: crypto.randomUUID(),
                  from: "user",
                  imageLabel: `Lampiran: ${file.name}`,
                },
              ]);
              event.target.value = "";
            }}
          />

          <form
            className="flex min-w-0 flex-1 items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >
            <label htmlFor="pesan" className="sr-only">
              Tulis pesan
            </label>
            <textarea
              id="pesan"
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
              placeholder="Tulis pesan…"
              className="max-h-32 min-h-11 min-w-0 flex-1 resize-none rounded-3xl border border-line bg-ivory-50 px-5 py-3 text-sm focus-visible:border-clay-500"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="Kirim pesan"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-clay-500 text-white transition-colors hover:bg-clay-600 disabled:opacity-40"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="m4 12 16-8-6 16-2.5-6.5L4 12Z" />
              </svg>
            </button>
          </form>
        </div>
        <p className="mt-2 text-center text-[11px] text-espresso-500">
          Pesan hanya tersimpan di perangkat ini.
        </p>
      </div>
    </div>
  );
}
