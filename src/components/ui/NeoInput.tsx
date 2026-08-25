import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function NeoInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`neo-inset w-full px-4 py-2.5 text-sm text-cap-black placeholder:text-cap-muted outline-none focus:ring-2 focus:ring-cap-violet ${className}`}
      {...props}
    />
  );
}

export function NeoTextarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`neo-inset w-full px-4 py-2.5 text-sm text-cap-black placeholder:text-cap-muted outline-none focus:ring-2 focus:ring-cap-violet resize-none ${className}`}
      {...props}
    />
  );
}
