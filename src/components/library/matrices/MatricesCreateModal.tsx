import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useCreateMatrix, type MatrixCreateBody } from "@/api/library";

type Props = {
  open: boolean;
  onClose: () => void;
};

type FormState = {
  parameterId: string;
  parameterName: string;

  protocolId: string;
  protocolCode: string;
  protocolSource: string;

  accreditationVILAS: boolean;
  accreditationTDC: boolean;

  sampleTypeId: string;
  sampleTypeName: string;

  technicianGroupId: string;

  feeBeforeTax: string;
  taxRate: string;
  feeAfterTax: string;

  turnaroundTime: string;
  LOD: string;
  LOQ: string;
  thresholdLimit: string;
};

function initForm(): FormState {
  return {
    parameterId: "",
    parameterName: "",

    protocolId: "",
    protocolCode: "",
    protocolSource: "",

    accreditationVILAS: false,
    accreditationTDC: false,

    sampleTypeId: "",
    sampleTypeName: "",

    technicianGroupId: "",

    feeBeforeTax: "",
    taxRate: "",
    feeAfterTax: "",

    turnaroundTime: "",
    LOD: "",
    LOQ: "",
    thresholdLimit: "",
  };
}

function parseFiniteNumber(raw: string): number | null {
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parseOptionalInt(raw: string): number | null {
  if (!raw.trim().length) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function SectionTitle(props: { children: React.ReactNode }) {
  return (
    <div className="text-sm font-semibold text-foreground">
      {props.children}
    </div>
  );
}

function FieldLabel(props: { children: React.ReactNode }) {
  return <div className="text-xs text-muted-foreground">{props.children}</div>;
}

export function MatricesCreateModal(props: Props) {
  const { t } = useTranslation();
  const { open, onClose } = props;

  const createM = useCreateMatrix();
  const [form, setForm] = useState<FormState>(() => initForm());

  const feeBeforeTaxNum = useMemo(
    () => parseFiniteNumber(form.feeBeforeTax),
    [form.feeBeforeTax]
  );
  const taxRateNum = useMemo(
    () => parseFiniteNumber(form.taxRate),
    [form.taxRate]
  );

  const canAutoCalcFeeAfterTax = useMemo(() => {
    if (feeBeforeTaxNum === null || feeBeforeTaxNum < 0) return false;
    if (taxRateNum === null || taxRateNum < 0) return false;
    return true;
  }, [feeBeforeTaxNum, taxRateNum]);

  useEffect(() => {
    if (!open) return;
    if (!canAutoCalcFeeAfterTax) return;

    const computed = Math.round(
      (feeBeforeTaxNum as number) * (1 + (taxRateNum as number) / 100)
    );
    const next = String(computed);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm((s) => (s.feeAfterTax === next ? s : { ...s, feeAfterTax: next }));
  }, [open, canAutoCalcFeeAfterTax, feeBeforeTaxNum, taxRateNum]);

  const canSave = useMemo(() => {
    if (!form.parameterId.trim()) return false;
    if (!form.protocolId.trim()) return false;
    if (!form.sampleTypeId.trim()) return false;

    if (feeBeforeTaxNum === null || feeBeforeTaxNum < 0) return false;

    const hasTaxRate = form.taxRate.trim().length > 0;
    if (hasTaxRate && (taxRateNum === null || taxRateNum < 0)) return false;

    if (canAutoCalcFeeAfterTax) {
      const feeAfterTax = parseFiniteNumber(form.feeAfterTax);
      if (feeAfterTax === null || feeAfterTax < 0) return false;
    } else {
      const feeAfterTax = parseFiniteNumber(form.feeAfterTax);
      if (feeAfterTax === null || feeAfterTax < 0) return false;
    }

    const turnaroundTime = parseOptionalInt(form.turnaroundTime);
    if (turnaroundTime !== null && turnaroundTime < 0) return false;

    return true;
  }, [form, feeBeforeTaxNum, taxRateNum, canAutoCalcFeeAfterTax]);

  const resetAndClose = () => {
    setForm(initForm());
    onClose();
  };

  const submit = async () => {
    if (!canSave) return;

    const feeBeforeTax = parseFiniteNumber(form.feeBeforeTax);
    if (feeBeforeTax === null) return;

    const taxRate = form.taxRate.trim().length
      ? parseFiniteNumber(form.taxRate)
      : null;

    const feeAfterTaxComputed =
      canAutoCalcFeeAfterTax && taxRateNum !== null && feeBeforeTaxNum !== null
        ? Math.round(feeBeforeTaxNum * (1 + taxRateNum / 100))
        : null;

    const feeAfterTax =
      feeAfterTaxComputed !== null
        ? feeAfterTaxComputed
        : parseFiniteNumber(form.feeAfterTax);

    if (feeAfterTax === null) return;

    const turnaroundTime = parseOptionalInt(form.turnaroundTime);

    const hasAccreditation = form.accreditationVILAS || form.accreditationTDC;

    const body: MatrixCreateBody = {
      parameterId: form.parameterId.trim(),
      protocolId: form.protocolId.trim(),
      sampleTypeId: form.sampleTypeId.trim(),

      protocolCode: form.protocolCode.trim().length
        ? form.protocolCode.trim()
        : null,
      protocolSource: form.protocolSource.trim().length
        ? form.protocolSource.trim()
        : null,
      protocolAccreditation: hasAccreditation
        ? { VILAS: form.accreditationVILAS, TDC: form.accreditationTDC }
        : undefined,

      parameterName: form.parameterName.trim().length
        ? form.parameterName.trim()
        : null,
      sampleTypeName: form.sampleTypeName.trim().length
        ? form.sampleTypeName.trim()
        : null,

      feeBeforeTax,
      taxRate: taxRate ?? undefined,
      feeAfterTax,

      LOD: form.LOD.trim().length ? form.LOD.trim() : null,
      LOQ: form.LOQ.trim().length ? form.LOQ.trim() : null,
      thresholdLimit: form.thresholdLimit.trim().length
        ? form.thresholdLimit.trim()
        : null,

      turnaroundTime,

      technicianGroupId: form.technicianGroupId.trim().length
        ? form.technicianGroupId.trim()
        : null,
    };

    await createM.mutateAsync({ body });
    resetAndClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg border border-border w-full max-w-4xl shadow-xl">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="text-base font-semibold text-foreground">
            {t("library.matrices.create.title")}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetAndClose}
            type="button">
            {t("common.close")}
          </Button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6 min-w-0">
            <div className="space-y-3">
              <SectionTitle>
                {t("library.matrices.create.sampleParameter")}
              </SectionTitle>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 min-w-0">
                  <FieldLabel>
                    {t("library.matrices.parameterId")}
                  </FieldLabel>
                  <Input
                    value={form.parameterId}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, parameterId: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-1 min-w-0">
                  <FieldLabel>
                    {t("library.matrices.parameterName")}
                  </FieldLabel>
                  <Input
                    value={form.parameterName}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, parameterName: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-1 min-w-0">
                  <FieldLabel>
                    {t("library.matrices.sampleTypeId")}
                  </FieldLabel>
                  <Input
                    value={form.sampleTypeId}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, sampleTypeId: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-1 min-w-0">
                  <FieldLabel>
                    {t("library.matrices.sampleTypeName")}
                  </FieldLabel>
                  <Input
                    value={form.sampleTypeName}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, sampleTypeName: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <SectionTitle>
                {t("library.matrices.create.protocol")}
              </SectionTitle>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 min-w-0">
                  <FieldLabel>
                    {t("library.matrices.protocolId")}
                  </FieldLabel>
                  <Input
                    value={form.protocolId}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, protocolId: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-1 min-w-0">
                  <FieldLabel>
                    {t("library.matrices.protocolCode")}
                  </FieldLabel>
                  <Input
                    value={form.protocolCode}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, protocolCode: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-1 min-w-0 md:col-span-2">
                  <FieldLabel>
                    {t("library.matrices.protocolSource")}
                  </FieldLabel>
                  <Input
                    value={form.protocolSource}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, protocolSource: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2 min-w-0 md:col-span-2">
                  <FieldLabel>
                    {t("library.matrices.protocolAccreditation")}
                  </FieldLabel>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      className="w-full whitespace-normal"
                      variant={
                        form.accreditationVILAS ? "secondary" : "outline"
                      }
                      aria-pressed={form.accreditationVILAS}
                      onClick={() =>
                        setForm((s) => ({
                          ...s,
                          accreditationVILAS: !s.accreditationVILAS,
                        }))
                      }>
                      {t("library.protocols.protocolAccreditation.vilas")}
                    </Button>

                    <Button
                      type="button"
                      className="w-full whitespace-normal"
                      variant={form.accreditationTDC ? "secondary" : "outline"}
                      aria-pressed={form.accreditationTDC}
                      onClick={() =>
                        setForm((s) => ({
                          ...s,
                          accreditationTDC: !s.accreditationTDC,
                        }))
                      }>
                      {t("library.protocols.protocolAccreditation.tdc")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 min-w-0">
            <div className="space-y-3">
              <SectionTitle>
                {t("library.matrices.create.pricing")}
              </SectionTitle>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1 min-w-0">
                  <FieldLabel>
                    {t("library.matrices.feeBeforeTax")}
                  </FieldLabel>
                  <Input
                    inputMode="numeric"
                    value={form.feeBeforeTax}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, feeBeforeTax: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-1 min-w-0">
                  <FieldLabel>
                    {t("library.matrices.taxRate")}
                  </FieldLabel>
                  <Input
                    inputMode="numeric"
                    value={form.taxRate}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, taxRate: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-1 min-w-0">
                  <FieldLabel>
                    {t("library.matrices.feeAfterTax")}
                  </FieldLabel>
                  <Input
                    inputMode="numeric"
                    value={form.feeAfterTax}
                    disabled={canAutoCalcFeeAfterTax}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, feeAfterTax: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <SectionTitle>
                {t("library.matrices.create.limits")}
              </SectionTitle>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 min-w-0">
                  <FieldLabel>{t("library.matrices.LOD")}</FieldLabel>
                  <Input
                    value={form.LOD}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, LOD: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-1 min-w-0">
                  <FieldLabel>{t("library.matrices.LOQ")}</FieldLabel>
                  <Input
                    value={form.LOQ}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, LOQ: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-1 min-w-0 md:col-span-2">
                  <FieldLabel>
                    {t("library.matrices.thresholdLimit")}
                  </FieldLabel>
                  <Input
                    value={form.thresholdLimit}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, thresholdLimit: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-1 min-w-0">
                  <FieldLabel>
                    {t("library.matrices.turnaroundTime")}
                  </FieldLabel>
                  <Input
                    inputMode="numeric"
                    value={form.turnaroundTime}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, turnaroundTime: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-1 min-w-0">
                  <FieldLabel>
                    {t("library.matrices.technicianGroupId")}
                  </FieldLabel>
                  <Input
                    value={form.technicianGroupId}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        technicianGroupId: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={resetAndClose} type="button">
                {t("common.cancel")}
              </Button>
              <Button
                onClick={() => void submit()}
                disabled={!canSave || createM.isPending}
                type="button">
                {createM.isPending ? t("common.saving") : t("common.save")}
              </Button>
            </div>

            {createM.isError ? (
              <div className="mt-3 text-sm text-destructive">
                {t("library.matrices.create.error")}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
