import { useCallback, useRef, useState } from "react";

const API = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  const speak = useCallback(async (text: string, voice: "alloy" | "nova" = "alloy") => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/interview/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question_text: text, voice }),
      });
      if (!res.ok) throw new Error("TTS indisponível.");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      setPlaying(true);
      await audio.play();
    } finally {
      setLoading(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
    }
  }, []);

  return { speak, stop, playing, loading };
}
