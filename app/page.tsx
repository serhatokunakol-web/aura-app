"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  UploadCloud,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Lock,
  Camera,
} from "lucide-react";

type AuraResult = {
  auraScore: number; // -100 to 100 from API
  vibeLabel: string;
  roast: string;
};

const LOADING_MESSAGES = [
  "Questioning your fashion choices...",
  "Calculating your negative aura...",
  "Cross-referencing with Pinterest boards from 2014...",
  "Checking if this outfit is a cry for help...",
  "Seeing if TikTok would cancel this fit...",
  "Scanning for 'old money' but finding 'old navy'...",
];

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingText, setLoadingText] = useState(LOADING_MESSAGES[0]);
  const [result, setResult] = useState<AuraResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  // Rotate loading messages while "analyzing"
  useEffect(() => {
    if (!isAnalyzing) return;
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % LOADING_MESSAGES.length;
      setLoadingText(LOADING_MESSAGES[index]);
    }, 1400);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Clean up preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          // result is a data URL: data:image/...;base64,XXXX
          const base64 = result.split(",")[1] ?? "";
          resolve(base64);
        } else {
          reject(new Error("Failed to read file as base64."));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const image = files[0];
      if (!image.type.startsWith("image/")) return;

      setError(null);
      setFile(image);
      setResult(null);
      setImageBase64(null);

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(image);
      setPreviewUrl(url);

      try {
        const base64 = await fileToBase64(image);
        setImageBase64(base64);
      } catch (err) {
        console.error(err);
        setError("Could not read image. Try another file.");
      }
    },
    [previewUrl]
  );

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      let base64 = imageBase64;
      if (!base64) {
        base64 = await fileToBase64(file);
        setImageBase64(base64);
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Something went wrong roasting your fit.";
        throw new Error(message);
      }

      const data = (await res.json()) as AuraResult;
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          "Our AI choked on your outfit. Try again in a bit."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const scoreColor = useMemo(() => {
    if (!result) return "text-gray-400";
    if (result.auraScore >= 40) return "text-emerald-400";
    if (result.auraScore >= 0) return "text-yellow-300";
    return "text-rose-400";
  }, [result]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="mx-auto h-72 w-72 rounded-full bg-purple-700/20 blur-3xl" />
        </div>

        {/* Hero */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-200 shadow-neon-sm">
            <Sparkles className="h-3.5 w-3.5 text-purple-300" />
            Gen Z Approved. Ego Not Included.
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
            Upload your fit,&nbsp;
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">
              we&apos;ll destroy your ego.
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-gray-300">
            Aura & Vibe Analyzer is your brutally honest internet bestie.
            Drop your outfit pic and get a ruthless roast, an aura score,
            and a vibe label straight from fashion hell.
          </p>
        </section>

        {/* Main Card */}
        <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* Upload + Preview */}
          <div className="flex flex-col gap-4">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
              }}
              className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-slate-900/80 px-4 py-10 transition
                ${
                  isDragging
                    ? "border-purple-400 shadow-neon-cyan"
                    : "border-slate-700/80 hover:border-purple-400/60 hover:shadow-neon-sm"
                }`}
            >
              <div className="absolute inset-x-6 -top-4 mx-auto flex w-max items-center gap-1.5 rounded-full bg-black/80 px-3 py-1 text-[11px] font-medium text-gray-300 border border-purple-500/50">
                <Camera className="h-3 w-3 text-purple-300" />
                Drop today&apos;s fit. Be brave.
              </div>

              <UploadCloud className="mb-3 h-8 w-8 text-purple-300" />
              <p className="text-sm font-medium">
                Drag & drop your outfit photo
              </p>
              <p className="mb-4 text-xs text-gray-400">
                Or click below. We support JPG, PNG, and questionable life choices.
              </p>

              <label className="relative inline-flex cursor-pointer items-center justify-center rounded-full bg-white/5 px-4 py-2 text-xs font-medium text-gray-100 shadow-md shadow-purple-500/40 ring-1 ring-purple-500/60 transition hover:bg-white/10 hover:shadow-neon-sm">
                <span className="flex items-center gap-2">
                  <ImageIcon className="h-3.5 w-3.5 text-purple-200" />
                  Choose image
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </label>

              {file && (
                <p className="mt-3 max-w-xs truncate text-xs text-gray-400">
                  Selected: <span className="font-medium text-gray-200">{file.name}</span>
                </p>
              )}
            </div>

            {/* Preview */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-300">
                  Fit preview
                </p>
                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-gray-400 border border-slate-700">
                  {previewUrl ? "Hope this was intentional." : "No fit, no feelings."}
                </span>
              </div>
              <div className="relative flex h-52 items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-black">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Outfit preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-xs text-gray-500">
                    <ImageIcon className="h-6 w-6 text-slate-600" />
                    Drop a fit to see if it was a mistake.
                  </div>
                )}
              </div>
            </div>

            {/* Analyze button */}
            <button
              type="button"
              disabled={!file || isAnalyzing}
              onClick={handleAnalyze}
              className={`mt-1 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition
                ${
                  !file
                    ? "cursor-not-allowed bg-slate-800 text-gray-500"
                    : "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-400 text-black shadow-neon-cyan hover:brightness-110 active:scale-[0.98]"
                }`}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Roasting in progress...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze my aura & vibe
                </>
              )}
            </button>

            <p className="text-[11px] text-gray-500">
              Powered by real AI vision. Emotional support not included.
            </p>

            {error && (
              <p className="mt-1 text-[11px] text-rose-400">
                {error}
              </p>
            )}
          </div>

          {/* Results + Paywall */}
          <div className="flex flex-col gap-4">
            {/* Loading State */}
            {isAnalyzing && (
              <div className="rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-950/40 via-slate-950 to-slate-950/90 p-4 shadow-neon-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/20">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-300" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-purple-100">
                      Analyzing your digital aura…
                    </p>
                    <p className="text-[11px] text-purple-200/80">
                      {loadingText}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Result Card */}
            <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950/80 to-slate-900/90 p-4 sm:p-5 shadow-lg shadow-black/50">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-gray-300">
                    Aura & Vibe Report
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Statistically significant amount of judgement.
                  </p>
                </div>
                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-gray-400 border border-slate-700">
                  v0.2 · Vision AI
                </span>
              </div>

              {/* If no result yet */}
              {!result && !isAnalyzing && (
                <div className="mt-2 rounded-xl border border-dashed border-slate-700/80 bg-slate-950/60 p-4 text-xs text-gray-400">
                  <p className="font-medium text-gray-300 mb-1">
                    No aura yet.
                  </p>
                  <p>
                    Upload a fit and let the fake AI decide if you&apos;re
                    main character, background NPC, or just chronically online.
                  </p>
                </div>
              )}

              {/* Result content */}
              {result && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">
                        Aura Score
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span
                          className={`text-2xl sm:text-3xl font-semibold ${scoreColor}`}
                        >
                          {result.auraScore}
                        </span>
                        <span className="text-sm text-gray-500">/100</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-gray-500">
                        Vibe Label
                      </p>
                      <p className="text-sm font-semibold text-cyan-300">
                        {result.vibeLabel}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="h-1.5 w-full rounded-full bg-slate-800">
                      <div
                        className={`h-1.5 rounded-full bg-gradient-to-r from-rose-500 via-purple-500 to-cyan-400 transition-all`}
                        style={{
                          width: `${
                            Math.max(
                              8,
                              // map -100..100 → 0..100
                              Math.round(((result.auraScore + 100) / 200) * 100)
                            )
                          }%`,
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-500">
                      0–30: Fashion war crime · 30–60: Recoverable · 60+: Okay main
                      character, we see you.
                    </p>
                  </div>

                  {/* Roast */}
                  <div className="rounded-lg border border-slate-800 bg-slate-950/90 p-3 text-xs text-gray-200">
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-300">
                      Ruthless Roast
                    </p>
                    <p>{result.roast}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Paywall / CTA */}
            <div className="mt-1 rounded-2xl border border-purple-500/40 bg-gradient-to-r from-purple-900/40 via-slate-950 to-cyan-900/20 p-4 shadow-neon-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-purple-100">
                    Ready for real drip?
                  </p>
                  <p className="text-[11px] text-purple-100/80">
                    Unlock an AI-powered style consultation and stop dressing like a tutorial.
                  </p>
                </div>
                <Lock className="h-4 w-4 text-purple-200" />
              </div>

              <button
                type="button"
                className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-black shadow-neon-cyan transition hover:brightness-110 active:scale-[0.98]"
              >
                <span className="absolute inset-0 opacity-0 group-hover:opacity-30 bg-[radial-gradient(circle_at_top,_white,_transparent_60%)] transition" />
                <span className="relative flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Save your style: Get AI style consultation – $2
                </span>
              </button>

              <p className="mt-2 text-[10px] text-purple-100/70">
                Paywall is fake for now. In the real thing, this is where
                Stripe meets your questionable wardrobe.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}