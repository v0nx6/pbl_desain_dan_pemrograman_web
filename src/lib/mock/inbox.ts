import type { ChatMessage, ChatThread } from "@/lib/types";

// SAMPLE DATA. Chat is stored locally only. Customer names stay as placeholders
// on purpose: no invented people.
export const chatThreads: ChatThread[] = [
  {
    id: "t1",
    name: "[Nama pelanggan]",
    preview: "Ini hasil try-on saya, bagus tidak?",
    unread: 1,
  },
  {
    id: "t2",
    name: "[Nama pelanggan]",
    preview: "Apakah ukuran M masih tersedia?",
    unread: 1,
  },
];

export const conversation: ChatMessage[] = [
  {
    id: "m1",
    from: "user",
    text: "Halo, apakah Kebaya Encim ukuran M masih tersedia?",
  },
  {
    id: "m2",
    from: "admin",
    text: "Masih tersedia kak. Mau kami kirimkan ukuran lengkapnya?",
  },
  {
    id: "m3",
    from: "user",
    text: "Ini hasil try-on saya, bagus tidak?",
    imageLabel: "Foto hasil try-on",
  },
  {
    id: "m4",
    from: "admin",
    text: "Cocok sekali kak! Pesanan bisa langsung kami proses.",
  },
];

export function unansweredCount(): number {
  return chatThreads.reduce((total, thread) => total + thread.unread, 0);
}
