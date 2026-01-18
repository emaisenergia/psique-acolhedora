import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";

interface ShortcutItem {
  keys: string;
  description: string;
}

const shortcuts: ShortcutItem[] = [
  { keys: "Alt + D", description: "Ir para Dashboard" },
  { keys: "Alt + P", description: "Ir para Pacientes" },
  { keys: "Alt + A", description: "Ir para Agendamentos" },
  { keys: "Alt + F", description: "Ir para Financeiro" },
  { keys: "Alt + R", description: "Ir para Prontuários" },
  { keys: "Alt + I", description: "Ir para Agentes IA" },
  { keys: "Alt + C", description: "Ir para Configurações" },
];

export const KeyboardShortcutsDialog = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Atalhos de teclado">
          <Keyboard className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Atalhos de Teclado
          </DialogTitle>
          <DialogDescription>
            Use estes atalhos para navegar rapidamente pelo sistema.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 mt-4">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.keys}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
            >
              <span className="text-sm text-muted-foreground">
                {shortcut.description}
              </span>
              <kbd className="px-2 py-1 text-xs font-semibold bg-background border rounded shadow-sm">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Dica: Os atalhos não funcionam quando você está digitando em campos de texto.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsDialog;
