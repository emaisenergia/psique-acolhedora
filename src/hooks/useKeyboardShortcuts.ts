import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (additionalShortcuts?: KeyboardShortcut[]) => {
  const navigate = useNavigate();

  const defaultShortcuts: KeyboardShortcut[] = [
    {
      key: "p",
      altKey: true,
      action: () => navigate("/admin/pacientes"),
      description: "Ir para Pacientes",
    },
    {
      key: "a",
      altKey: true,
      action: () => navigate("/admin/agendamentos"),
      description: "Ir para Agendamentos",
    },
    {
      key: "d",
      altKey: true,
      action: () => navigate("/admin"),
      description: "Ir para Dashboard",
    },
    {
      key: "f",
      altKey: true,
      action: () => navigate("/admin/financeiro"),
      description: "Ir para Financeiro",
    },
    {
      key: "r",
      altKey: true,
      action: () => navigate("/admin/prontuarios"),
      description: "Ir para Prontuários",
    },
    {
      key: "i",
      altKey: true,
      action: () => navigate("/admin/agentes-ia"),
      description: "Ir para Agentes IA",
    },
    {
      key: "c",
      altKey: true,
      action: () => navigate("/admin/configuracoes"),
      description: "Ir para Configurações",
    },
  ];

  const allShortcuts = [...defaultShortcuts, ...(additionalShortcuts || [])];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignorar se estiver em um input, textarea ou contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of allShortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : true;
        const metaMatch = shortcut.metaKey ? event.metaKey : true;
        const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.altKey ? event.altKey : !event.altKey;

        if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [allShortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts: allShortcuts };
};

export const getShortcutDisplay = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = [];
  
  if (shortcut.ctrlKey) parts.push("Ctrl");
  if (shortcut.metaKey) parts.push("⌘");
  if (shortcut.altKey) parts.push("Alt");
  if (shortcut.shiftKey) parts.push("Shift");
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join(" + ");
};
