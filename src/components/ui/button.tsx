import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Botão reutilizável — variante principal segue identidade (azul profundo + vermelho)
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-base font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-brand-600 text-white shadow-card hover:bg-brand-500",
        royal: "bg-brand-600 text-white shadow-card hover:bg-brand-500",
        accent: "bg-accent text-white shadow-glow-red hover:shadow-glow-red hover:brightness-110",
        outline:
          "border-2 border-white/20 bg-transparent text-white hover:border-white hover:bg-white/10",
        ghost: "text-slate-200 hover:bg-white/10",
      },
      size: {
        default: "h-14 px-6 py-3",
        lg: "h-16 px-8 text-lg",
        sm: "h-11 px-4 text-sm",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
