import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
    useMatrixDetail,
    useUpdateMatrix,
    useParametersList,
    useProtocolsList,
    useSampleTypesList,
    useCreateParameter,
    useCreateSampleType,
    useCreateProtocol,
    type MatrixPatch,
    type Parameter,
    type Protocol,
    type SampleType,
} from "@/api/library";

import { SearchableSelect, type Option } from "@/components/common/SearchableSelect";

import { toFormNumberString } from "./matrixFormat";

type Props = {
    open: boolean;
    matrixId: string | null;
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

function useDebouncedValue(value: string, ms: number) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = window.setTimeout(() => setV(value), ms);
        return () => window.clearTimeout(t);
    }, [value, ms]);
    return v;
}

function SectionTitle(props: { children: React.ReactNode }) {
    return <div className="text-sm font-semibold text-foreground">{props.children}</div>;
}

function FieldLabel(props: { children: React.ReactNode }) {
    return <div className="text-xs text-muted-foreground">{props.children}</div>;
}

function toParameterOption(p: Parameter): Option {
    return { value: p.parameterId, label: p.parameterName, keywords: p.parameterName };
}

function toProtocolOption(p: Protocol): Option {
    return { value: p.protocolId, label: p.protocolCode, keywords: `${p.protocolSource}` };
}

function toSampleTypeOption(s: SampleType): Option {
    return { value: s.sampleTypeId, label: s.sampleTypeName, keywords: s.sampleTypeName };
}

export function MatricesEditModal(props: Props) {
    const { t } = useTranslation();
    const { open, matrixId, onClose } = props;

    const detailQ = useMatrixDetail({ params: { matrixId: matrixId ?? "" } });
    const updateM = useUpdateMatrix();

    const createParameter = useCreateParameter();
    const createSampleType = useCreateSampleType();
    const createProtocol = useCreateProtocol();

    const [form, setForm] = useState<FormState>(() => initForm());
    const [baseline, setBaseline] = useState<FormState | null>(null);

    const [parameterSearch, setParameterSearch] = useState("");
    const [protocolSearch, setProtocolSearch] = useState("");
    const [sampleTypeSearch, setSampleTypeSearch] = useState("");

    const debouncedParameterSearch = useDebouncedValue(parameterSearch, 250);
    const debouncedProtocolSearch = useDebouncedValue(protocolSearch, 250);
    const debouncedSampleTypeSearch = useDebouncedValue(sampleTypeSearch, 250);

    const parametersQ = useParametersList({
        query: {
            page: 1,
            itemsPerPage: 50,
            search: debouncedParameterSearch.trim().length ? debouncedParameterSearch.trim() : null,
        },
    });

    const protocolsQ = useProtocolsList({
        query: {
            page: 1,
            itemsPerPage: 50,
            search: debouncedProtocolSearch.trim().length ? debouncedProtocolSearch.trim() : null,
        },
    });

    const sampleTypesQ = useSampleTypesList({
        query: {
            page: 1,
            itemsPerPage: 50,
            search: debouncedSampleTypeSearch.trim().length ? debouncedSampleTypeSearch.trim() : null,
        },
    });

    const parameterItems = (parametersQ.data?.data ?? []) as Parameter[];
    const protocolItems = (protocolsQ.data?.data ?? []) as Protocol[];
    const sampleTypeItems = (sampleTypesQ.data?.data ?? []) as SampleType[];

    const parameterOptions = useMemo(() => parameterItems.map(toParameterOption), [parameterItems]);
    const protocolOptions = useMemo(() => protocolItems.map(toProtocolOption), [protocolItems]);
    const sampleTypeOptions = useMemo(() => sampleTypeItems.map(toSampleTypeOption), [sampleTypeItems]);

    useEffect(() => {
        if (!open) return;
        const m = detailQ.data;
        if (!m) return;

        const next: FormState = {
            parameterId: m.parameterId,
            parameterName: m.parameterName || "",
            protocolId: m.protocolId,
            protocolCode: m.protocolCode || "",
            protocolSource: m.protocolSource || "",
            accreditationVILAS: Boolean(m.protocolAccreditation?.VILAS),
            accreditationTDC: Boolean(m.protocolAccreditation?.TDC),
            sampleTypeId: m.sampleTypeId,
            sampleTypeName: m.sampleTypeName || "",
            technicianGroupId: m.technicianGroupId || "",
            feeBeforeTax: toFormNumberString(m.feeBeforeTax),
            taxRate: m.taxRate != null ? String(m.taxRate) : "",
            feeAfterTax: toFormNumberString(m.feeAfterTax),
            turnaroundTime: m.turnaroundTime != null ? String(m.turnaroundTime) : "",
            LOD: m.LOD || "",
            LOQ: m.LOQ || "",
            thresholdLimit: m.thresholdLimit || "",
        };

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm(next);
        setBaseline(next);
    }, [open, detailQ.data]);

    const feeBeforeTaxNum = useMemo(() => parseFiniteNumber(form.feeBeforeTax), [form.feeBeforeTax]);
    const taxRateNum = useMemo(() => parseFiniteNumber(form.taxRate), [form.taxRate]);

    const canAutoCalcFeeAfterTax = useMemo(() => {
        if (feeBeforeTaxNum === null || feeBeforeTaxNum < 0) return false;
        if (taxRateNum === null || taxRateNum < 0) return false;
        return true;
    }, [feeBeforeTaxNum, taxRateNum]);

    useEffect(() => {
        if (!open || !baseline) return;
        if (!canAutoCalcFeeAfterTax) return;

        const computed = Math.round((feeBeforeTaxNum as number) * (1 + (taxRateNum as number) / 100));
        const next = String(computed);

        // auto calc only if tax/fee changed to avoid wiping user manual input on initial load
        if (form.feeBeforeTax !== baseline.feeBeforeTax || form.taxRate !== baseline.taxRate) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setForm((s) => (s.feeAfterTax === next ? s : { ...s, feeAfterTax: next }));
        }
    }, [open, canAutoCalcFeeAfterTax, feeBeforeTaxNum, taxRateNum, baseline, form.feeBeforeTax, form.taxRate]);

    const canSave = useMemo(() => {
        if (!matrixId || !baseline) return false;
        if (!form.parameterId.trim() || !form.protocolId.trim() || !form.sampleTypeId.trim()) return false;

        if (feeBeforeTaxNum === null || feeBeforeTaxNum < 0) return false;

        const hasTaxRate = form.taxRate.trim().length > 0;
        if (hasTaxRate && (taxRateNum === null || taxRateNum < 0)) return false;

        const feeAfterTax = parseFiniteNumber(form.feeAfterTax);
        if (feeAfterTax === null || feeAfterTax < 0) return false;

        const turnaroundTime = parseOptionalInt(form.turnaroundTime);
        if (turnaroundTime !== null && turnaroundTime < 0) return false;

        return (
            form.parameterId !== baseline.parameterId ||
            form.protocolId !== baseline.protocolId ||
            form.sampleTypeId !== baseline.sampleTypeId ||
            form.feeBeforeTax !== baseline.feeBeforeTax ||
            form.taxRate !== baseline.taxRate ||
            form.feeAfterTax !== baseline.feeAfterTax ||
            form.turnaroundTime !== baseline.turnaroundTime ||
            form.LOD !== baseline.LOD ||
            form.LOQ !== baseline.LOQ ||
            form.thresholdLimit !== baseline.thresholdLimit ||
            form.technicianGroupId !== baseline.technicianGroupId ||
            form.accreditationVILAS !== baseline.accreditationVILAS ||
            form.accreditationTDC !== baseline.accreditationTDC
        );
    }, [form, feeBeforeTaxNum, taxRateNum, matrixId, baseline]);

    const resetAndClose = () => {
        setForm(initForm());
        setBaseline(null);
        setParameterSearch("");
        setProtocolSearch("");
        setSampleTypeSearch("");
        onClose();
    };

    const onPickParameter = async (idOrVal: string | null) => {
        if (!idOrVal) {
            setForm((s) => ({ ...s, parameterId: "", parameterName: "" }));
            return;
        }
        const found = parameterItems.find((x) => x.parameterId === idOrVal);
        if (found) {
            setForm((s) => ({ ...s, parameterId: found.parameterId, parameterName: found.parameterName }));
        } else {
            const res = await createParameter.mutateAsync({ body: { parameterName: idOrVal } });
            setForm((s) => ({ ...s, parameterId: res.parameterId, parameterName: res.parameterName }));
        }
    };

    const onPickSampleType = async (idOrVal: string | null) => {
        if (!idOrVal) {
            setForm((s) => ({ ...s, sampleTypeId: "", sampleTypeName: "" }));
            return;
        }
        const found = sampleTypeItems.find((x) => x.sampleTypeId === idOrVal);
        if (found) {
            setForm((s) => ({ ...s, sampleTypeId: found.sampleTypeId, sampleTypeName: found.sampleTypeName }));
        } else {
            const res = await createSampleType.mutateAsync({ body: { sampleTypeName: idOrVal } });
            setForm((s) => ({ ...s, sampleTypeId: res.sampleTypeId, sampleTypeName: res.sampleTypeName }));
        }
    };

    const onPickProtocol = async (idOrVal: string | null) => {
        if (!idOrVal) {
            setForm((s) => ({
                ...s,
                protocolId: "",
                protocolCode: "",
                protocolSource: "",
                accreditationTDC: false,
                accreditationVILAS: false,
            }));
            return;
        }
        const found = protocolItems.find((x) => x.protocolId === idOrVal);
        if (found) {
            setForm((s) => ({
                ...s,
                protocolId: found.protocolId,
                protocolCode: found.protocolCode || "",
                protocolSource: found.protocolSource || "",
                accreditationTDC: Boolean(found.protocolAccreditation?.TDC),
                accreditationVILAS: Boolean(found.protocolAccreditation?.VILAS),
            }));
        } else {
            const res = await createProtocol.mutateAsync({ body: { protocolCode: idOrVal, protocolSource: "Unknown" } });
            setForm((s) => ({
                ...s,
                protocolId: res.protocolId,
                protocolCode: res.protocolCode || "",
                protocolSource: res.protocolSource || "",
                accreditationTDC: Boolean(res.protocolAccreditation?.TDC),
                accreditationVILAS: Boolean(res.protocolAccreditation?.VILAS),
            }));
        }
    };

    const submit = async () => {
        if (!canSave || !matrixId || !baseline) return;

        const patch: MatrixPatch = {};

        if (form.parameterId !== baseline.parameterId) patch.parameterId = form.parameterId;
        if (form.protocolId !== baseline.protocolId) patch.protocolId = form.protocolId;
        if (form.sampleTypeId !== baseline.sampleTypeId) patch.sampleTypeId = form.sampleTypeId;

        if (form.feeBeforeTax !== baseline.feeBeforeTax) patch.feeBeforeTax = parseFiniteNumber(form.feeBeforeTax) ?? undefined;
        if (form.taxRate !== baseline.taxRate) patch.taxRate = form.taxRate.trim().length ? parseFiniteNumber(form.taxRate) : null;
        if (form.feeAfterTax !== baseline.feeAfterTax) patch.feeAfterTax = parseFiniteNumber(form.feeAfterTax) ?? undefined;

        if (form.turnaroundTime !== baseline.turnaroundTime) patch.turnaroundTime = parseOptionalInt(form.turnaroundTime);
        if (form.LOD !== baseline.LOD) patch.LOD = form.LOD.trim() || null;
        if (form.LOQ !== baseline.LOQ) patch.LOQ = form.LOQ.trim() || null;
        if (form.thresholdLimit !== baseline.thresholdLimit) patch.thresholdLimit = form.thresholdLimit.trim() || null;
        if (form.technicianGroupId !== baseline.technicianGroupId) patch.technicianGroupId = form.technicianGroupId.trim() || null;

        const hasAccChange = form.accreditationVILAS !== baseline.accreditationVILAS || form.accreditationTDC !== baseline.accreditationTDC;
        if (hasAccChange) {
            patch.protocolAccreditation = form.accreditationVILAS || form.accreditationTDC ? { VILAS: form.accreditationVILAS, TDC: form.accreditationTDC } : undefined;
        }

        if (Object.keys(patch).length === 0) return;

        await updateM.mutateAsync({
            params: { matrixId },
            patch,
        });

        resetAndClose();
    };

    const resetKey = open ? "open" : "closed";

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg border border-border w-full max-w-4xl shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-background z-10">
                    <div className="text-base font-semibold text-foreground">{t("library.matrices.edit.title")}</div>
                    <Button variant="ghost" size="sm" onClick={resetAndClose} type="button">
                        {t("common.close")}
                    </Button>
                </div>

                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {detailQ.isLoading ? <div className="text-sm text-muted-foreground md:col-span-2">{t("common.loading")}</div> : null}

                    {detailQ.isError ? <div className="text-sm text-destructive md:col-span-2">{t("library.matrices.errors.loadFailed")}</div> : null}

                    {!detailQ.isLoading && !detailQ.isError && detailQ.data && baseline ? (
                        <>
                            <div className="space-y-6 min-w-0">
                                <div className="space-y-3">
                                    <SectionTitle>{t("library.matrices.create.sampleParameter")}</SectionTitle>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1 min-w-0">
                                            <FieldLabel>{t("library.matrices.parameterId")}</FieldLabel>
                                            <SearchableSelect
                                                value={form.parameterId || null}
                                                options={parameterOptions}
                                                placeholder={t("library.parameters.searchPlaceholder")}
                                                searchPlaceholder={t("library.parameters.searchPlaceholder")}
                                                loading={parametersQ.isLoading || createParameter.isPending}
                                                error={parametersQ.isError}
                                                disabled={updateM.isPending}
                                                onChange={(v) => void onPickParameter(v)}
                                                resetKey={resetKey}
                                                filterMode="server"
                                                searchValue={parameterSearch}
                                                onSearchChange={setParameterSearch}
                                                allowCustomValue
                                            />
                                        </div>

                                        <div className="space-y-1 min-w-0">
                                            <FieldLabel>{t("library.matrices.parameterName")}</FieldLabel>
                                            <Input value={form.parameterName} disabled />
                                        </div>

                                        <div className="space-y-1 min-w-0">
                                            <FieldLabel>{t("library.matrices.sampleTypeId")}</FieldLabel>
                                            <SearchableSelect
                                                value={form.sampleTypeId || null}
                                                options={sampleTypeOptions}
                                                placeholder={t("library.sampleTypes.searchPlaceholder")}
                                                searchPlaceholder={t("library.sampleTypes.searchPlaceholder")}
                                                loading={sampleTypesQ.isLoading || createSampleType.isPending}
                                                error={sampleTypesQ.isError}
                                                disabled={updateM.isPending}
                                                onChange={(v) => void onPickSampleType(v)}
                                                resetKey={resetKey}
                                                filterMode="server"
                                                searchValue={sampleTypeSearch}
                                                onSearchChange={setSampleTypeSearch}
                                                allowCustomValue
                                            />
                                        </div>

                                        <div className="space-y-1 min-w-0">
                                            <FieldLabel>{t("library.matrices.sampleTypeName")}</FieldLabel>
                                            <Input value={form.sampleTypeName} disabled />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <SectionTitle>{t("library.matrices.create.protocol")}</SectionTitle>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1 min-w-0 md:col-span-2">
                                            <FieldLabel>{t("library.matrices.protocolId")}</FieldLabel>
                                            <SearchableSelect
                                                value={form.protocolId || null}
                                                options={protocolOptions}
                                                placeholder={t("library.protocols.searchPlaceholder")}
                                                searchPlaceholder={t("library.protocols.searchPlaceholder")}
                                                loading={protocolsQ.isLoading || createProtocol.isPending}
                                                error={protocolsQ.isError}
                                                disabled={updateM.isPending}
                                                onChange={(v) => void onPickProtocol(v)}
                                                resetKey={resetKey}
                                                filterMode="server"
                                                searchValue={protocolSearch}
                                                onSearchChange={setProtocolSearch}
                                                allowCustomValue
                                            />
                                        </div>

                                        <div className="space-y-1 min-w-0">
                                            <FieldLabel>{t("library.matrices.protocolCode")}</FieldLabel>
                                            <Input value={form.protocolCode} disabled />
                                        </div>

                                        <div className="space-y-1 min-w-0">
                                            <FieldLabel>{t("library.matrices.protocolSource")}</FieldLabel>
                                            <Input value={form.protocolSource} disabled />
                                        </div>

                                        <div className="space-y-2 min-w-0 md:col-span-2">
                                            <FieldLabel>{t("library.matrices.protocolAccreditation")}</FieldLabel>

                                            <div className="grid grid-cols-2 gap-2">
                                                <Button
                                                    type="button"
                                                    className="w-full whitespace-normal"
                                                    variant={form.accreditationVILAS ? "secondary" : "outline"}
                                                    aria-pressed={form.accreditationVILAS}
                                                    onClick={() => setForm((s) => ({ ...s, accreditationVILAS: !s.accreditationVILAS }))}
                                                    disabled={updateM.isPending}
                                                >
                                                    {t("library.protocols.protocolAccreditation.vilas")}
                                                </Button>

                                                <Button
                                                    type="button"
                                                    className="w-full whitespace-normal"
                                                    variant={form.accreditationTDC ? "secondary" : "outline"}
                                                    aria-pressed={form.accreditationTDC}
                                                    onClick={() => setForm((s) => ({ ...s, accreditationTDC: !s.accreditationTDC }))}
                                                    disabled={updateM.isPending}
                                                >
                                                    {t("library.protocols.protocolAccreditation.tdc")}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 min-w-0">
                                <div className="space-y-3">
                                    <SectionTitle>{t("library.matrices.create.pricing")}</SectionTitle>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1 min-w-0">
                                            <FieldLabel>{t("library.matrices.feeBeforeTax")}</FieldLabel>
                                            <Input
                                                inputMode="numeric"
                                                value={form.feeBeforeTax}
                                                onChange={(e) => setForm((s) => ({ ...s, feeBeforeTax: e.target.value }))}
                                                disabled={updateM.isPending}
                                            />
                                        </div>

                                        <div className="space-y-1 min-w-0">
                                            <FieldLabel>{t("library.matrices.taxRate")}</FieldLabel>
                                            <Input inputMode="numeric" value={form.taxRate} onChange={(e) => setForm((s) => ({ ...s, taxRate: e.target.value }))} disabled={updateM.isPending} />
                                        </div>

                                        <div className="space-y-1 min-w-0">
                                            <FieldLabel>{t("library.matrices.feeAfterTax")}</FieldLabel>
                                            <Input
                                                inputMode="numeric"
                                                value={form.feeAfterTax}
                                                disabled={updateM.isPending || canAutoCalcFeeAfterTax}
                                                onChange={(e) => setForm((s) => ({ ...s, feeAfterTax: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <SectionTitle>{t("library.matrices.create.limits")}</SectionTitle>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1 min-w-0">
                                            <FieldLabel>{t("library.matrices.LOD")}</FieldLabel>
                                            <Input value={form.LOD} onChange={(e) => setForm((s) => ({ ...s, LOD: e.target.value }))} disabled={updateM.isPending} />
                                        </div>

                                        <div className="space-y-1 min-w-0">
                                            <FieldLabel>{t("library.matrices.LOQ")}</FieldLabel>
                                            <Input value={form.LOQ} onChange={(e) => setForm((s) => ({ ...s, LOQ: e.target.value }))} disabled={updateM.isPending} />
                                        </div>

                                        <div className="space-y-1 min-w-0 md:col-span-2">
                                            <FieldLabel>{t("library.matrices.thresholdLimit")}</FieldLabel>
                                            <Input value={form.thresholdLimit} onChange={(e) => setForm((s) => ({ ...s, thresholdLimit: e.target.value }))} disabled={updateM.isPending} />
                                        </div>

                                        <div className="space-y-1 min-w-0">
                                            <FieldLabel>{t("library.matrices.turnaroundTime")}</FieldLabel>
                                            <Input
                                                inputMode="numeric"
                                                value={form.turnaroundTime}
                                                onChange={(e) => setForm((s) => ({ ...s, turnaroundTime: e.target.value }))}
                                                disabled={updateM.isPending}
                                            />
                                        </div>

                                        <div className="space-y-1 min-w-0">
                                            <FieldLabel>{t("library.matrices.technicianGroupId")}</FieldLabel>
                                            <Input value={form.technicianGroupId} onChange={(e) => setForm((s) => ({ ...s, technicianGroupId: e.target.value }))} disabled={updateM.isPending} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                                    <Button variant="outline" onClick={resetAndClose} type="button">
                                        {t("common.cancel")}
                                    </Button>
                                    <Button onClick={() => void submit()} disabled={!canSave || updateM.isPending} type="button">
                                        {updateM.isPending ? t("common.saving") : t("common.save")}
                                    </Button>
                                </div>
                                {updateM.isError ? <div className="text-sm text-destructive mt-2 text-right">{t("library.matrices.edit.error")}</div> : null}
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
