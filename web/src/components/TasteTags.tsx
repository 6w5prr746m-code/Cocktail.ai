interface TasteTagsProps {
  tags: string[];
  size?: "sm" | "md";
  /** "onImage" pour un fond translucide blanc, lisible sur les dégradés photo/illustration. */
  variant?: "default" | "onImage";
}

export function TasteTags({ tags, size = "sm", variant = "default" }: TasteTagsProps) {
  if (tags.length === 0) return null;
  const padding = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  const style =
    variant === "onImage"
      ? { background: "rgba(255,255,255,0.22)", color: "#ffffff" }
      : { background: "color-mix(in srgb, var(--color-accent-gold) 16%, transparent)", color: "var(--color-accent-gold-text)" };
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span key={tag} className={`rounded-full font-medium ${padding}`} style={style}>
          {tag}
        </span>
      ))}
    </div>
  );
}
