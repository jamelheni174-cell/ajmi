import { useState } from "react";
import { cn } from "../utils/cn";

/** Image avec repli élégant si le fichier n'est pas encore déposé dans public/images/. */
export function Img({
  src,
  alt,
  className,
  imgClassName,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn("relative overflow-hidden bg-stone/60", className)}>
      {failed ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center">
          <span className="font-serif text-3xl text-ink/25">Ajmi</span>
          <span className="text-[9px] uppercase tracking-[0.25em] text-ink/40">{src.split("/").pop()}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className={cn("h-full w-full object-cover transition-transform duration-[1.2s] hover:scale-[1.04]", imgClassName)}
        />
      )}
    </div>
  );
}
