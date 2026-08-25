import type { ButtonHTMLAttributes } from "react";

type Variant = "default" | "violet" | "lime" | "danger";

const variantClass: Record<Variant, string> = {
  default: "neo-btn text-cap-black",
  violet: "neo-btn-violet",
  lime: "neo-btn-lime",
  danger: "neo-btn-danger",
};

export function NeoButton({
  variant = "default",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`${variantClass[variant]} px-4 py-2.5 font-semibold text-sm inline-flex items-center justify-center gap-2 cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
