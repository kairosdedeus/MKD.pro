/**
 * Componente de Logo MKD
 * K: barra vertical + dois braços diagonais partindo do centro
 * D: arco semicircular grosso, sem parte reta
 */

import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "default" | "white" | "colored";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
};

export function Logo({
  variant = "default",
  size = "md",
  className,
  showText = false,
}: LogoProps) {
  const sizeClass = sizeClasses[size];

  const kColor = variant === "white" ? "#FFFFFF" : "#29ABD4";
  const dColor = variant === "white" ? "#FFFFFF" : "#EFEFEF";
  const bgColor = "#000000";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("relative flex-shrink-0", sizeClass)}>
        <svg
          viewBox="0 0 1024 1024"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Fundo preto (variante colored) */}
          {variant === "colored" && (
            <rect width="1024" height="1024" fill={bgColor} />
          )}

          {/* D — arco semicircular grosso, abre para a esquerda */}
          <path
            d="M 430,242 A 270,270 0 0 1 430,782 L 430,672 A 160,160 0 0 0 430,352 Z"
            fill={dColor}
          />

          {/* K — barra vertical */}
          <rect x="272" y="242" width="70" height="540" fill={kColor} />

          {/* K — braço superior (do centro para cima-direita) */}
          <line
            x1="342"
            y1="512"
            x2="490"
            y2="370"
            stroke={kColor}
            strokeWidth="58"
            strokeLinecap="square"
          />

          {/* K — braço inferior (do centro para baixo-direita) */}
          <line
            x1="342"
            y1="512"
            x2="490"
            y2="654"
            stroke={kColor}
            strokeWidth="58"
            strokeLinecap="square"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span
            className={cn(
              "font-bold leading-none tracking-tight",
              size === "sm" && "text-lg",
              size === "md" && "text-xl",
              size === "lg" && "text-2xl",
              size === "xl" && "text-3xl",
              variant === "white" ? "text-white" : "text-foreground",
            )}
          >
            MKD
          </span>
          <span
            className={cn(
              "text-xs leading-none mt-1 font-medium",
              variant === "white" ? "text-white/70" : "text-muted-foreground",
            )}
          >
            Escalas Ministeriais
          </span>
        </div>
      )}
    </div>
  );
}

export function LogoCompact({ className }: { className?: string }) {
  return <Logo size="sm" className={className} />;
}

export function LogoWithText({
  variant = "default",
  size = "lg",
  className,
}: Omit<LogoProps, "showText">) {
  return <Logo variant={variant} size={size} showText className={className} />;
}
