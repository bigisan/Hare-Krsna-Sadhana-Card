import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "outline" | "ghost" | "destructive";
type Size = "default" | "sm" | "lg" | "icon";

const variants: Record<Variant, string> = {
  default: "border border-primary/40 bg-primary/92 text-primary-foreground shadow-[0_10px_24px_hsl(82_24%_24%_/_0.22),0_1px_0_hsl(0_0%_100%_/_0.22)_inset] hover:bg-primary hover:shadow-[0_12px_28px_hsl(82_24%_24%_/_0.26),0_1px_0_hsl(0_0%_100%_/_0.26)_inset] active:brightness-95",
  secondary: "glass-control text-secondary-foreground hover:bg-card/70 active:brightness-95",
  outline: "glass-control text-foreground hover:bg-accent/70 hover:text-accent-foreground active:brightness-95",
  ghost: "text-foreground/80 hover:bg-card/60 hover:text-foreground active:bg-card/70 active:brightness-95",
  destructive: "border border-destructive/40 bg-destructive/92 text-destructive-foreground shadow-[0_10px_22px_hsl(8_58%_28%_/_0.22)] hover:bg-destructive active:brightness-95",
};
const sizes: Record<Size, string> = {
  default: "min-h-11 px-4 py-2",
  sm: "min-h-10 px-3 text-sm",
  lg: "min-h-12 px-6 text-base",
  icon: "h-11 w-11",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "pressable inline-flex touch-manipulation select-none items-center justify-center gap-2 rounded-md text-sm font-semibold",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:scale-100 disabled:opacity-45 disabled:shadow-none",
        variants[variant], sizes[size], className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
