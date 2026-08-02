"use client";

import type { InputHTMLAttributes } from "react";
import { inputClass } from "./field";

/** A number input that blurs itself on wheel scroll. Browsers default to
 * changing a focused number input's value on every scroll tick with no
 * visual feedback -- scrolling the page to reach a Save button while the
 * cursor happens to pass over one of these silently corrupts it. That's
 * how "typed 2, saved, it's -2" happens with no server-side bug involved. */
export function NumberInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="number" {...props} onWheel={(e) => e.currentTarget.blur()} className={inputClass} />;
}
