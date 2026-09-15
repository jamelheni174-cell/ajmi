import type { ReactNode } from "react";

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block">
    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#1e2766]/70">
      {label}
    </span>
    {children}
  </label>
);

export const inputCls =
  "w-full rounded-xl border border-[#dcd8cb] bg-white px-3.5 py-2.5 text-sm text-[#1e2766] outline-none transition focus:border-[#2e3d91] focus:ring-1 focus:ring-[#2e3d91]";

export const Btn = ({
  children,
  onClick,
  variant = "ghost",
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "secondary" | "headerGhost" | "accent";
  type?: "button" | "submit";
  disabled?: boolean;
}) => {
  const v = {
    primary: "bg-[#2e3d91] text-white hover:bg-[#1e2766] shadow-sm font-semibold",
    secondary: "bg-[#1e2766] text-white hover:bg-[#2e3d91]",
    ghost: "border border-[#dcd8cb] bg-white text-[#1e2766] hover:bg-[#ece9e2]/80",
    headerGhost: "border border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm",
    accent: "bg-amber-400 text-[#1e2766] font-bold hover:bg-amber-300 shadow-sm",
    danger: "border border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
  }[variant];
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] transition duration-200 disabled:opacity-50 ${v}`}
    >
      {children}
    </button>
  );
};

export const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-[#dcd8cb] bg-white p-6 shadow-sm ${className}`}>
    {children}
  </div>
);

export function dataUrlToBlob(dataUrl: string): Blob {
  const [head, b64] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(head)?.[1] ?? "image/jpeg";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/** Compresse une image en dataURL (max 1400px, JPEG 0.78). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const max = 1400;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.78));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
