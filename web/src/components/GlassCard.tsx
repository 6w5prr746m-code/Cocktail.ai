import type { PropsWithChildren, CSSProperties } from "react";

export function GlassCard({ children, style, className = "" }: PropsWithChildren<{ style?: CSSProperties; className?: string }>) {
  return (
    <div className={`glass-card rounded-2xl p-4 ${className}`} style={style}>
      {children}
    </div>
  );
}
