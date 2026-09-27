"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";

import { Button } from "@/components/ui/button";

// A styled "are you sure?" dialog (instead of the browser's confirm()).
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-popover p-6 text-popover-foreground shadow-2xl transition-all duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <AlertDialog.Title className="text-lg font-semibold">{title}</AlertDialog.Title>
          {description && (
            <AlertDialog.Description className="mt-1.5 text-sm text-muted-foreground">
              {description}
            </AlertDialog.Description>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialog.Close render={<Button variant="outline" />}>Cancel</AlertDialog.Close>
            <Button
              variant="destructive"
              onClick={() => {
                onOpenChange(false);
                onConfirm();
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
