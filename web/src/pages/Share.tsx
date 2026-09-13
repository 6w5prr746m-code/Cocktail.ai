import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "qrcode";
import { ScreenHeader } from "../components/ScreenHeader";
import { useCocktail } from "../domain/catalog";

interface ShareFormat {
  id: string;
  label: string;
  width: number;
  height: number;
}

const FORMATS: ShareFormat[] = [
  { id: "story", label: "Story (9:16)", width: 1080, height: 1920 },
  { id: "post", label: "Post carré (1:1)", width: 1080, height: 1080 },
  { id: "pin", label: "Pinterest (2:3)", width: 1080, height: 1620 },
];

const GRADIENTS: Record<string, [string, string]> = {
  tropical: ["#ff7a59", "#2dd4bf"],
  tiki: ["#ff7a59", "#2dd4bf"],
  classique: ["#c9a227", "#5b2a2a"],
  frais: ["#2dd4bf", "#0b0b0f"],
  agrumes: ["#ffd166", "#ef476f"],
  "sans alcool": ["#8ac6d1", "#f5f1e8"],
  hiver: ["#5b2a2a", "#c9a227"],
};

function gradientColors(category: string): [string, string] {
  return GRADIENTS[category.toLowerCase()] ?? ["#c9a227", "#0b0b0f"];
}

export default function SharePage() {
  const { id } = useParams<{ id: string }>();
  const cocktail = useCocktail(id);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<ShareFormat>(FORMATS[0]);
  const [pngUrl, setPngUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!cocktail) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = format.width;
    canvas.height = format.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    async function draw() {
      const [c1, c2] = gradientColors(cocktail!.category);
      const gradient = ctx!.createLinearGradient(0, 0, format.width, format.height);
      gradient.addColorStop(0, c1);
      gradient.addColorStop(1, c2);
      ctx!.fillStyle = gradient;
      ctx!.fillRect(0, 0, format.width, format.height);

      ctx!.fillStyle = "rgba(0,0,0,0.28)";
      ctx!.fillRect(0, format.height * 0.62, format.width, format.height * 0.38);

      ctx!.fillStyle = "#ffffff";
      ctx!.font = `700 ${format.width * 0.09}px serif`;
      wrapText(ctx!, cocktail!.name, format.width * 0.08, format.height * 0.72, format.width * 0.84, format.width * 0.1);

      ctx!.font = `400 ${format.width * 0.03}px sans-serif`;
      ctx!.fillStyle = "rgba(255,255,255,0.85)";
      const topIngredients = cocktail!.ingredients.slice(0, 3).map((i) => i.ingredientId.replace(/_/g, " "));
      wrapText(
        ctx!,
        topIngredients.join("  •  "),
        format.width * 0.08,
        format.height * 0.85,
        format.width * 0.6,
        format.width * 0.042,
      );

      ctx!.font = `600 ${format.width * 0.026}px sans-serif`;
      ctx!.fillStyle = "#ffffff";
      ctx!.fillText("Cocktail.ai", format.width * 0.08, format.height * 0.08);

      const shareUrl = `${window.location.origin}/cocktail/${cocktail!.id}`;
      const qrDataUrl = await QRCode.toDataURL(shareUrl, { margin: 1, width: format.width * 0.18 });
      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise((resolve) => (qrImg.onload = resolve));
      const qrSize = format.width * 0.18;
      ctx!.fillStyle = "#ffffff";
      const pad = format.width * 0.02;
      ctx!.fillRect(format.width - qrSize - format.width * 0.08 - pad, format.height * 0.72 - pad, qrSize + pad * 2, qrSize + pad * 2);
      ctx!.drawImage(qrImg, format.width - qrSize - format.width * 0.08, format.height * 0.72, qrSize, qrSize);

      setPngUrl(canvas!.toDataURL("image/png"));
    }
    draw();
  }, [cocktail, format]);

  function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(" ");
    let line = "";
    let currentY = y;
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, x, currentY);
        line = word;
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  async function handleShare() {
    if (!pngUrl || !cocktail) return;
    const blob = await (await fetch(pngUrl)).blob();
    const file = new File([blob], `${cocktail.id}.png`, { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: cocktail.name, text: `Découvre le ${cocktail.name} sur Cocktail.ai` });
        return;
      } catch {
        // l'utilisateur a annulé — on retombe sur le téléchargement
      }
    }
    downloadPng();
  }

  function downloadPng() {
    if (!pngUrl || !cocktail) return;
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = `${cocktail.id}-${format.id}.png`;
    a.click();
  }

  if (!cocktail) {
    return (
      <div>
        <ScreenHeader title="Partager" />
        <p className="px-4 pt-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Cocktail introuvable.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <ScreenHeader title="Partager ce cocktail" />
      <div className="px-4 pt-3 flex flex-col gap-4">
        <div className="flex gap-2">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFormat(f)}
              className="flex-1 text-xs font-medium rounded-xl py-2.5"
              style={{
                background: format.id === f.id ? "var(--color-accent-gold)" : "var(--color-surface)",
                color: format.id === f.id ? "#0b0b0f" : "var(--color-text-primary)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div
          className="rounded-2xl overflow-hidden mx-auto"
          style={{ width: "100%", maxWidth: 260, aspectRatio: `${format.width} / ${format.height}` }}
        >
          <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="w-full rounded-2xl py-4 font-semibold text-base"
          style={{ background: "var(--color-accent-gold)", color: "#0b0b0f" }}
        >
          Partager ce visuel
        </button>
        <button
          type="button"
          onClick={downloadPng}
          className="w-full rounded-2xl py-3 text-sm font-medium"
          style={{ background: "var(--color-surface)", color: "var(--color-text-primary)" }}
        >
          Télécharger l'image
        </button>
        <p className="text-xs text-center" style={{ color: "var(--color-text-secondary)" }}>
          Le QR code renvoie vers la fiche de ce cocktail sur Cocktail.ai Web.
        </p>
      </div>
    </div>
  );
}
