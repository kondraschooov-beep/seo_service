import type { ReactNode } from "react";

export default function NeonCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card${className ? ` ${className}` : ""}`}>{children}</div>;
}
