import { useEffect, useRef } from "react";
// Keep keyboard focus inside open dialogs and restore it to their trigger.
export function useModal(open: boolean, onClose: () => void) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const elements = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>(
          '[role="dialog"] button:not(:disabled), [role="dialog"] input, [role="dialog"] select, [role="dialog"] textarea, [role="dialog"] [tabindex="0"]',
        ),
      ).filter((e) => e.getClientRects().length > 0);
    const frame = requestAnimationFrame(() => elements()[0]?.focus());
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close.current();
      }
      if (e.key === "Tab") {
        const list = elements(),
          first = list[0],
          last = list.at(-1);
        if (!first) return;
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            !list.includes(document.activeElement as HTMLElement))
        ) {
          e.preventDefault();
          last?.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            !list.includes(document.activeElement as HTMLElement))
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open]);
}
