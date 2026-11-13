"use client";

import { useId, type KeyboardEventHandler } from "react";

type FieldProps = {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  error?: string;
  hint?: string;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
  required?: boolean;
};

export function Field({
  label,
  type = "text",
  value,
  onChange,
  onKeyDown,
  error,
  hint,
  autoComplete,
  inputMode,
  required = false,
}: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        className={`min-h-11 w-full rounded-full border bg-ivory-50 px-5 text-sm ${
          error ? "border-clay-500" : "border-line"
        }`}
      />
      {hint ? (
        <p id={hintId} className="text-xs text-espresso-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-clay-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
