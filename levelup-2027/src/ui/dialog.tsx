"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "./cn";

const Ctx = createContext<{ close: () => void }>({ close: () => {} });
export const useDialog = () => useContext(Ctx);

/** Accessible modal built on <dialog>. Renders a trigger button and the dialog. */
export function Dialog({
  trigger,
  triggerClassName = "btn-secondary",
  title,
  children,
  open: controlledOpen,
  onOpenChange,
  wide,
  triggerLabel,
}: {
  trigger?: ReactNode;
  triggerClassName?: string;
  triggerLabel?: string;
  title: string;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  // Controlled when onOpenChange is given; otherwise `open` is just the initial state.
  const [innerOpen, setInnerOpen] = useState(controlledOpen ?? false);
  const open = onOpenChange ? !!controlledOpen : innerOpen;
  const setOpen = (o: boolean) => (onOpenChange ? onOpenChange(o) : setInnerOpen(o));
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <>
      {trigger !== undefined && (
        <button type="button" className={triggerClassName} onClick={() => setOpen(true)} aria-label={triggerLabel}>
          {trigger}
        </button>
      )}
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === ref.current && setOpen(false)}
        aria-label={title}
        className={cn(
          "m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-3xl border border-ink-700 bg-ink-850 p-0 text-white sm:m-auto sm:max-w-lg sm:rounded-3xl",
          wide && "sm:max-w-2xl",
        )}
      >
        {open && (
          <Ctx.Provider value={{ close: () => setOpen(false) }}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-700 bg-ink-850/95 px-5 py-4 backdrop-blur">
              <h2 className="h2">{title}</h2>
              <button type="button" className="btn-ghost btn-sm -mr-2" onClick={() => setOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-4">{children}</div>
          </Ctx.Provider>
        )}
      </dialog>
    </>
  );
}
