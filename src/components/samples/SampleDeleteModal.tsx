// src/components/samples/SampleDeleteModal.tsx
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertCircle, Trash2, X } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useDeleteSample } from "@/api/samples";

type Props = {
  open: boolean;
  sampleId: string | null;
  onClose: () => void;

  onDeleted?: () => void;
};

export function SampleDeleteModal({ open, sampleId, onClose, onDeleted }: Props) {
  const { t } = useTranslation();
  const safeId = useMemo(() => sampleId?.trim() ?? "", [sampleId]);
  const canSubmit = safeId.length > 0;

  const del = useDeleteSample();

  async function handleDelete() {
    if (!canSubmit || del.isPending) return;

    await del.mutateAsync({ body: { sampleId: safeId } });

    onDeleted?.();
    onClose();
  }

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(v) => (!v ? onClose() : undefined)}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" />

        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-6 shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <DialogPrimitive.Title className="text-lg font-semibold text-foreground">
                {t("reception.samples.delete.title")}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm text-muted-foreground">
                {t("reception.samples.delete.description")}
              </DialogPrimitive.Description>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={onClose}
              disabled={del.isPending}
              aria-label={t("common.close")}
              title={t("common.close")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 rounded-lg border border-border bg-background p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-destructive">
                <AlertCircle className="h-5 w-5" />
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-foreground">
                  {t("reception.samples.delete.confirmLabel")}
                </div>

                <div className="text-sm text-muted-foreground">
                  {t("reception.samples.delete.sampleIdLabel")}:{" "}
                  <span className="font-mono text-foreground">
                    {safeId || "--"}
                  </span>
                </div>

                {del.isError ? (
                  <div className="text-sm text-destructive">
                    {String(t("common.toast.requestFailed"))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={del.isPending}
            >
              {t("common.cancel")}
            </Button>

            <Button
              type="button"
              variant="destructive"
              className="flex items-center gap-2"
              disabled={!canSubmit || del.isPending}
              onClick={() => void handleDelete()}
            >
              <Trash2 className="h-4 w-4" />
              {t("common.delete")}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
