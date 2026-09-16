import { useEffect, useRef, useState } from "react";
import { wrapText } from "../domain/canvasText";
import { useTranslation } from "../domain/i18n/useTranslation";

interface ShareCardModalProps {
  emoji: string;
  title: string;
  subtitle: string;
  onClose: () => void;
}

const WIDTH = 1080;
const HEIGHT = 1350;

// Carte de partage générique (badge débloqué, défi relevé) : même principe
// que la carte cocktail de Share.tsx (canvas -> PNG, Web Share API avec
// fallback téléchargement) mais sans art de verre, pour rester réutilisable
// sur du contenu qui n'est pas un cocktail précis.
export function ShareCardModal({ emoji, title, subtitle, onClose }: ShareCardModalProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pngUrl, setPngUrl] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    gradient.addColorStop(0, "#c9a227");
    gradient.addColorStop(1, "#0b0b0f");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.textAlign = "center";
    ctx.font = `${WIDTH * 0.22}px sans-serif`;
    ctx.fillText(emoji, WIDTH / 2, HEIGHT * 0.36);

    ctx.fillStyle = "#ffffff";
    ctx.font = `700 ${WIDTH * 0.075}px serif`;
    wrapText(ctx, title, WIDTH / 2, HEIGHT * 0.52, WIDTH * 0.82, WIDTH * 0.085);

    ctx.font = `400 ${WIDTH * 0.038}px sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    wrapText(ctx, subtitle, WIDTH / 2, HEIGHT * 0.63, WIDTH * 0.78, WIDTH * 0.05);

    ctx.textAlign = "left";
    ctx.font = `600 ${WIDTH * 0.032}px sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Cocktail.ai", WIDTH * 0.08, HEIGHT * 0.9);
    ctx.font = `400 ${WIDTH * 0.026}px sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText(t("shareCard.tagline"), WIDTH * 0.08, HEIGHT * 0.93);

    setPngUrl(canvas.toDataURL("image/png"));
  }, [emoji, title, subtitle, t]);

  function downloadPng() {
    if (!pngUrl) return;
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = "cocktail-ai-partage.png";
    a.click();
  }

  async function handleShare() {
    if (!pngUrl) return;
    const blob = await (await fetch(pngUrl)).blob();
    const file = new File([blob], "cocktail-ai.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title, text: t("shareCard.shareText", { title }) });
        return;
      } catch {
        // l'utilisateur a annulé — on retombe sur le téléchargement
      }
    }
    downloadPng();
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-4 px-6 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.72)" }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t("shareCard.closeAria")}
        className="absolute top-5 right-5 rounded-full flex items-center justify-center text-lg"
        style={{ width: 36, height: 36, background: "rgba(255,255,255,0.15)", color: "#fff" }}
      >
        ✕
      </button>
      <div className="rounded-2xl overflow-hidden" style={{ width: "100%", maxWidth: 260, aspectRatio: `${WIDTH} / ${HEIGHT}` }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
      </div>
      <button
        type="button"
        onClick={handleShare}
        className="w-full rounded-2xl py-4 font-semibold text-base"
        style={{ maxWidth: 260, background: "var(--color-accent-gold)", color: "#0b0b0f" }}
      >
        {t("shareCard.shareButton")}
      </button>
      <button
        type="button"
        onClick={downloadPng}
        className="w-full rounded-2xl py-3 text-sm font-medium"
        style={{ maxWidth: 260, background: "rgba(255,255,255,0.12)", color: "#fff" }}
      >
        {t("shareCard.downloadButton")}
      </button>
    </div>
  );
}
