"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import './globals.css';

type ApiResponse =
  | { hashtags: string[]; modelUsed: string }
  | { error: string; details?: string };

export default function Home() {
  const [keywords, setKeywords] = useState("");
  const [count, setCount] = useState(12);
  const [loading, setLoading] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState("gemma:2b"); // default model

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setHashtags([]);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords, count, model }),
      });
      const data: ApiResponse = await res.json();
      if (!res.ok || "error" in data) {
        const msg = "error" in data ? data.error : "Failed to generate hashtags";
        setError(msg);
        return;
      }
      setHashtags(data.hashtags);
    } catch (e: any) {
      setError(e?.message ?? "Network error");
    } finally {
      setLoading(false);
    }
  }

  function copyAll() {
    if (hashtags.length === 0) return;
    navigator.clipboard.writeText(hashtags.join(" "));
    alert("Copied all hashtags!");
  }

  function copyOne(tag: string) {
    navigator.clipboard.writeText(tag);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6 bg-gradient-to-br from-pink-200 via-purple-200 to-orange-200">
      <div className="w-full max-w-2xl p-8 rounded-2xl shadow-2xl bg-white/40 backdrop-blur-lg border border-white/30">
        <h1 className="text-3xl font-bold text-center text-gray-900 drop-shadow mb-2">
          🔥 Hashtag Generator
        </h1>
        <p className="text-center text-sm text-gray-700 mb-6">
          Type your topic → Generate → Copy.
        </p>

        {/* Inputs */}
        <div className="space-y-4">
          {/* Topic */}
          <textarea
            rows={3}
            placeholder="Post topic / keywords (e.g., summer travel photography)"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-300 bg-white/70 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300"
          />

          {/* Settings Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                How Many
              </label>
              <input
                type="number"
                min={5}
                max={30}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full p-3 rounded-xl border border-gray-300 bg-white/70 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Model Version
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-300 bg-white/70 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300"
              >
                <option value="gemma:2b">Gemma 2B</option>
                <option value="gemma3:1b">Gemma3 1B</option>
                <option value="llama3:8b">LLaMA3 8B</option>
                <option value="mistral:7b">Mistral 7B</option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={loading || !keywords.trim()}
              className="flex-1 py-3 rounded-xl bg-black text-white font-bold shadow-md hover:bg-gray-800 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? "Generating…" : "Generate Hashtags"}
            </button>

            <button
              onClick={() => {
                const randomTopics = [
                  "summer travel photography",
                  "fitness motivation",
                  "digital marketing tips",
                  "street food adventures",
                  "AI and tech trends",
                  "fashion inspiration",
                  "mental health awareness",
                  "startup life",
                  "gaming community",
                  "book recommendations",
                ];
                const pick =
                  randomTopics[Math.floor(Math.random() * randomTopics.length)];
                setKeywords(pick);
              }}
              className="flex-1 py-3 rounded-xl bg-black text-white font-bold shadow-md hover:bg-gray-800 transition-all duration-300"
            >
              🎲 Random Topic
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="mt-4 text-red-600 text-center font-medium">{error}</p>
        )}

        {/* Results with sliding animation */}
        <AnimatePresence>
          {hashtags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.5 }}
              className="mt-8 p-6 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 shadow-lg text-gray-900"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Your Hashtags</h2>
                <button
                  onClick={copyAll}
                  className="px-3 py-1 rounded-lg bg-gray-300 hover:bg-gray-400 transition text-sm"
                >
                  Copy All
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag, i) => (
                  <motion.button
                    key={i}
                    onClick={() => copyOne(tag)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="px-3 py-1 bg-gray-300 rounded-full shadow-sm hover:bg-gray-400 transition text-sm"
                    title="Click to copy"
                  >
                    {tag}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-6 text-center text-xs text-gray-700">
          Tip: Smaller models like <b>gemma:2b</b> are faster & lighter.
        </p>
      </div>
    </div>
  );
}


