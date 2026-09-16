// Compresse une image uploadée (logo, photo d'histoire) en un data URI JPEG
// de petite taille avant de l'intégrer au lien de carte — indispensable
// puisque le lien entier doit tenir dans la capacité d'un QR code (mesuré
// empiriquement à ~2280 caractères de code pour des données base64url
// réalistes, voir MenuBuilder.tsx). Redimensionnement fait entièrement côté
// client via un <canvas> hors-écran, l'image n'est jamais envoyée à un serveur.
export function compressImageFile(file: File, maxDimension: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read-failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode-failed"));
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas-unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
