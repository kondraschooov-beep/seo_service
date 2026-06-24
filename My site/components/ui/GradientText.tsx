import type { ReactNode } from "react";

export default function GradientText({ children }: { children: ReactNode }) {
  return <span className="grad-text">{children}</span>;
}
