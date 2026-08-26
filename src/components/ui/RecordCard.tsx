import type { ReactNode } from "react";

/** Shared card shell for a record with a title/date header and top-right
 * action buttons — used by race cards and activity (historique) cards. */
export function RecordCard({
  header,
  actions,
  children,
}: {
  header: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="neo p-5 relative flex flex-col gap-2">
      {actions ? (
        <div className="absolute top-4 right-4 flex items-center gap-1.5">{actions}</div>
      ) : null}
      <div className="pr-20">{header}</div>
      {children}
    </div>
  );
}
