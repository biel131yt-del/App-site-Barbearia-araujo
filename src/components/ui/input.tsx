import * as React from "react";
import { cn } from "@/lib/utils";

// Input mobile-first — fundo translúcido; foco com borda vermelha + glow.
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  rotulo: string;
  erro?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, rotulo, erro, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="w-full">
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-bold text-slate-200">
          {rotulo}
        </label>
        <input
          ref={ref}
          id={inputId}
          {...props}
          className={cn(
            "h-14 w-full rounded-xl border-2 bg-white/5 px-4 text-base text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 [color-scheme:dark]",
            erro
              ? "border-accent focus:border-accent focus:ring-accent/30"
              : "border-white/10 focus:border-accent focus:ring-accent/30",
            className
          )}
        />
        {erro && <p className="mt-1 text-xs font-semibold text-red-300">{erro}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
