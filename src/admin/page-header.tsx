import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="cms-title-row">
      <div>
        <p className="cms-eyebrow">Personal studio</p>
        <h1>{title}</h1>
        <p className="cms-description">{description}</p>
      </div>
      {action}
    </div>
  );
}
