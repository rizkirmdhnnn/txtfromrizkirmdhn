import type { ReactNode } from "react";

export function Notice({
  children,
  role = "status",
  onDismiss,
}: {
  children: ReactNode;
  role?: "status" | "alert";
  onDismiss?: () => void;
}) {
  if (!children) return null;
  return (
    <p className="cms-notice" role={role}>
      {children}
      {onDismiss ? <button onClick={onDismiss}>Tutup</button> : null}
    </p>
  );
}
