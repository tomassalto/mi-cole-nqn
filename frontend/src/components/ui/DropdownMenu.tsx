import { useEffect, useRef, type ReactNode } from "react";

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
}

interface DropdownMenuProps {
  items: MenuItem[];
  open: boolean;
  onClose: () => void;
}

export default function DropdownMenu({ items, open, onClose }: DropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    // Delay listener to avoid catching the click that opened the menu
    requestAnimationFrame(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full z-50 mt-1 min-w-[180px] origin-top-right animate-[menuIn_0.15s_ease-out] rounded-xl border border-slate-200/80 bg-white/92 py-1 shadow-lg backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-800/95"
      role="menu"
    >
      {items.map((item) => (
        <button
          key={item.label}
          role="menuitem"
          className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[0.82rem] font-medium text-slate-700 transition-colors hover:bg-slate-100/80 dark:text-slate-200 dark:hover:bg-slate-700/60"
          onClick={() => {
            item.onClick();
            onClose();
          }}
        >
          {item.icon && (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center text-slate-400 dark:text-slate-500">
              {item.icon}
            </span>
          )}
          {item.label}
        </button>
      ))}
    </div>
  );
}
