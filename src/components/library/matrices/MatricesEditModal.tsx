import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useMatrixDetail, useUpdateMatrix, type MatrixPatch } from "@/api/library";
import { toFormNumberString } from "./matrixFormat";

type Props = {
  open: boolean;
  matrixId: string | null;
  onClose: () => void;
};

type FormState = {
  feeBeforeTax: string;
  feeAfterTax: string;
  turnaroundTime: string;
};

function initForm(): FormState {
  return { feeBeforeTax: "", feeAfterTax: "", turnaroundTime: "" };
}

export function MatricesEditModal(props: Props) {
  const { t } = useTranslation();
  const { open, matrixId, onClose } = props;

  const detailQ = useMatrixDetail({ params: { matrixId: matrixId ?? "" } });
  const updateM = useUpdateMatrix();

  const [form, setForm] = useState<FormState>(() => initForm());
  const [baseline, setBaseline] = useState<FormState | null>(null);

  useEffect(() => {
    if (!open) return;
    const m = detailQ.data;
    if (!m) return;

    const next: FormState = {
      feeBeforeTax: toFormNumberString(m.feeBeforeTax),
      feeAfterTax: toFormNumberString(m.feeAfterTax),
      turnaroundTime:
        m.turnaroundTime === null || m.turnaroundTime === undefined ? "" : String(m.turnaroundTime),
    };

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(next);
    setBaseline(next);
  }, [open, detailQ.data]);

  const canSave = useMemo(() => {
    if (!matrixId || !baseline) return false;

    const feeBeforeTax = Number(form.feeBeforeTax);
    const feeAfterTax = Number(form.feeAfterTax);
    const turnaroundTime = form.turnaroundTime.trim().length ? Number(form.turnaroundTime) : null;

    if (!Number.isFinite(feeBeforeTax) || feeBeforeTax < 0) return false;
    if (!Number.isFinite(feeAfterTax) || feeAfterTax < 0) return false;
    if (turnaroundTime !== null && (!Number.isFinite(turnaroundTime) || turnaroundTime < 0)) return false;

    return (
      form.feeBeforeTax !== baseline.feeBeforeTax ||
      form.feeAfterTax !== baseline.feeAfterTax ||
      form.turnaroundTime !== baseline.turnaroundTime
    );
  }, [form, matrixId, baseline]);

  const resetAndClose = () => {
    setForm(initForm());
    setBaseline(null);
    onClose();
  };

  const submit = async () => {
    if (!matrixId || !baseline) return;

    const patch: MatrixPatch = {};

    if (form.feeBeforeTax !== baseline.feeBeforeTax) patch.feeBeforeTax = Number(form.feeBeforeTax);
    if (form.feeAfterTax !== baseline.feeAfterTax) patch.feeAfterTax = Number(form.feeAfterTax);

    if (form.turnaroundTime !== baseline.turnaroundTime) {
      patch.turnaroundTime = form.turnaroundTime.trim().length ? Number(form.turnaroundTime) : null;
    }

    if (Object.keys(patch).length === 0) return;

    await updateM.mutateAsync({
      params: { matrixId },
      patch,
    });

    resetAndClose();
  };

  if (!open) return null;

  const m = detailQ.data;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg border border-border w-full max-w-2xl shadow-xl">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="text-base font-semibold text-foreground">
            {t("library.matrices.edit.title")}
          </div>
          <Button variant="ghost" size="sm" onClick={resetAndClose} type="button">
            {t("common.close")}
          </Button>
        </div>

        <div className="p-5 space-y-4">
          {detailQ.isLoading ? (
            <div className="text-sm text-muted-foreground">{t("common.loading")}</div>
          ) : null}

          {detailQ.isError ? (
            <div className="text-sm text-destructive">{t("library.matrices.errors.loadFailed")}</div>
          ) : null}

          {!detailQ.isLoading && !detailQ.isError && m ? (
            <>
              {/* read-only header */}
              <div className="bg-muted/30 space-y-1">
                <div className="text-sm text-foreground font-medium">{t("library.matrices.matrixId")}: {m.matrixId}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    {t("library.matrices.feeBeforeTax")}
                  </div>
                  <Input
                    inputMode="numeric"
                    value={form.feeBeforeTax}
                    onChange={(e) => setForm((s) => ({ ...s, feeBeforeTax: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    {t("library.matrices.feeAfterTax")}
                  </div>
                  <Input
                    inputMode="numeric"
                    value={form.feeAfterTax}
                    onChange={(e) => setForm((s) => ({ ...s, feeAfterTax: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    {t("library.matrices.turnaroundTime")}
                  </div>
                  <Input
                    inputMode="numeric"
                    value={form.turnaroundTime}
                    onChange={(e) => setForm((s) => ({ ...s, turnaroundTime: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" onClick={resetAndClose} type="button">
                  {t("common.cancel")}
                </Button>
                <Button onClick={() => void submit()} disabled={!canSave || updateM.isPending} type="button">
                  {updateM.isPending ? t("common.saving") : t("common.save")}
                </Button>
              </div>

              {updateM.isError ? (
                <div className="text-sm text-destructive">{t("library.matrices.edit.error")}</div>
              ) : null}

            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
