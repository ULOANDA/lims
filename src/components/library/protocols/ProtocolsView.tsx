import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, X, Upload } from "lucide-react";

import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useCreateProtocol, useCreateParameter, useCreateSampleType, useUpdateProtocol, useProtocolsList, libraryApi, type Protocol } from "@/api/library";

import { searchDocuments, documentApi } from "@/api/documents";
import { buildFileUploadFormData } from "@/api/files";

import { LibraryHeader } from "../LibraryHeader";
import { useServerPagination } from "../hooks/useServerPagination";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

import { ProtocolsTable, type ProtocolsExcelFiltersState } from "./ProtocolsTable";
import { ProtocolDetailPanel } from "./ProtocolDetailPanel";
import { SearchSelectPicker, type PickerItem } from "./SearchSelectPicker";
import { DocumentUploadModal } from "@/components/document/DocumentUploadModal";

type EditProtocolForm = {
    protocolId?: string;
    protocolCode: string;
    protocolTitle: string;
    protocolSource: string;
    protocolDescription: string;
    accreditationVilas: boolean;
    accreditationTdc: boolean;
    parameters: { parameterId: string; parameterName: string }[];
    sampleTypes: { sampleTypeId: string; sampleTypeName: string }[];
    chemicals: { chemicalId: string; chemicalName: string; chemicalCAS?: string; chemicalFormula?: string; amountUsed?: string; measurementUnit?: string }[];
    documentIds: string[];
    /* Picker internal state for documents – store label alongside id */
    selectedDocuments: PickerItem[];
};

function ProtocolsSkeleton() {
    return (
        <div className="bg-background border border-border rounded-lg p-4">
            <div className="animate-pulse space-y-3">
                <div className="h-4 w-48 bg-muted rounded" />
                <div className="h-9 w-full bg-muted rounded" />
                <div className="h-40 w-full bg-muted rounded" />
            </div>
        </div>
    );
}

function createEmptyFilters(): ProtocolsExcelFiltersState {
    return {
        protocolCode: [],
        protocolSource: [],
        accreditation: [],
    };
}

function applyLocalFilters(items: Protocol[], f: ProtocolsExcelFiltersState) {
    const matchStr = (value: string, selected: string[]) => (selected.length ? selected.includes(value) : true);

    const hasAccValue = (p: Protocol, selected: string[]) => {
        if (selected.length === 0) return true;
        const tags: string[] = [];
        if (p.protocolAccreditation?.VILAS) tags.push("VILAS");
        if (p.protocolAccreditation?.TDC) tags.push("TDC");
        if (!p.protocolAccreditation?.VILAS && !p.protocolAccreditation?.TDC) tags.push("NONE");
        return selected.some((x) => tags.includes(x));
    };

    return items.filter((p) => {
        const code = p.protocolCode ?? "";
        const source = p.protocolSource ?? "";
        return matchStr(code, f.protocolCode) && matchStr(source, f.protocolSource) && hasAccValue(p, f.accreditation);
    });
}

export function ProtocolsView() {
    const { t } = useTranslation();

    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebouncedValue(searchTerm, 300);

    const [selected, setSelected] = useState<Protocol | null>(null);

    const [editOpen, setEditOpen] = useState(false);

    const EMPTY_FORM: EditProtocolForm = {
        protocolCode: "",
        protocolTitle: "",
        protocolSource: "",
        protocolDescription: "",
        accreditationVilas: false,
        accreditationTdc: false,
        parameters: [],
        sampleTypes: [],
        chemicals: [],
        documentIds: [],
        selectedDocuments: [],
    };

    const [editForm, setEditForm] = useState<EditProtocolForm>(EMPTY_FORM);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);

    const [serverTotalPages, setServerTotalPages] = useState<number | null>(null);
    const pagination = useServerPagination(serverTotalPages, 20);

    const listInput = useMemo(
        () => ({
            query: {
                page: pagination.currentPage,
                itemsPerPage: pagination.itemsPerPage,
                search: debouncedSearch.trim().length ? debouncedSearch.trim() : null,
            },
            sort: { column: "createdAt", direction: "DESC" as const },
        }),
        [debouncedSearch, pagination.currentPage, pagination.itemsPerPage],
    );

    const protocolsQ = useProtocolsList(listInput);

    const allProtocols = useMemo(() => {
        return (protocolsQ.data?.data ?? []) as Protocol[];
    }, [protocolsQ.data]);

    const serverMeta = protocolsQ.data?.meta;
    const serverTotal = serverMeta?.total ?? serverMeta?.totalItems ?? 0;
    const serverPages = serverMeta?.totalPages ?? 1;

    useEffect(() => setServerTotalPages(serverPages), [serverPages]);

    const [excelFilters, setExcelFilters] = useState<ProtocolsExcelFiltersState>(() => createEmptyFilters());

    const filteredAll = useMemo(() => applyLocalFilters(allProtocols, excelFilters), [allProtocols, excelFilters]);
    const pageItems = filteredAll;
    const totalItems = serverTotal;
    const totalPages = serverPages;

    const createP = useCreateProtocol();
    const updateP = useUpdateProtocol();
    const createParameter = useCreateParameter();
    const createSampleType = useCreateSampleType();

    // ─── Search handlers for pickers ────────────────────────────────────────

    const searchParameters = useCallback(async (q: string): Promise<PickerItem[]> => {
        try {
            const res = await libraryApi.parameters.list({
                query: { page: 1, itemsPerPage: 30, search: q || null },
            });
            const raw = res as unknown as { data?: { parameterId: string; parameterName: string }[] };
            const data = Array.isArray(raw.data) ? raw.data : [];
            return data.map((p) => ({ id: p.parameterId, label: p.parameterName, sublabel: p.parameterId }));
        } catch {
            return [];
        }
    }, []);

    const searchSampleTypes = useCallback(async (q: string): Promise<PickerItem[]> => {
        try {
            const res = await libraryApi.sampleTypes.list({
                query: { page: 1, itemsPerPage: 30, search: q || null },
            });
            const raw = res as unknown as { data?: { sampleTypeId: string; sampleTypeName: string }[] };
            const data = Array.isArray(raw.data) ? raw.data : [];
            return data.map((s) => ({ id: s.sampleTypeId, label: s.sampleTypeName, sublabel: s.sampleTypeId }));
        } catch {
            return [];
        }
    }, []);

    const searchDocumentsFn = useCallback(async (q: string): Promise<PickerItem[]> => {
        try {
            const docs = await searchDocuments(q);
            return docs.map((d) => ({
                id: d.documentId,
                label: d.documentTitle || d.documentId,
                sublabel: d.documentId,
            }));
        } catch {
            return [];
        }
    }, []);

    // ─── Create handlers for pickers ────────────────────────────────────────

    const createParameterFn = useCallback(
        async (name: string): Promise<PickerItem> => {
            const result = await createParameter.mutateAsync({ body: { parameterName: name } });
            return { id: result.parameterId, label: result.parameterName, sublabel: result.parameterId };
        },
        [createParameter],
    );

    const createSampleTypeFn = useCallback(
        async (name: string): Promise<PickerItem> => {
            const result = await createSampleType.mutateAsync({ body: { sampleTypeName: name } });
            return { id: result.sampleTypeId, label: result.sampleTypeName, sublabel: result.sampleTypeId };
        },
        [createSampleType],
    );

    // ─── Picker change handlers ──────────────────────────────────────────────

    const onParametersChange = (items: PickerItem[]) => {
        setEditForm((s) => ({
            ...s,
            parameters: items.map((i) => ({ parameterId: i.id, parameterName: i.label })),
        }));
    };

    const onSampleTypesChange = (items: PickerItem[]) => {
        setEditForm((s) => ({
            ...s,
            sampleTypes: items.map((i) => ({ sampleTypeId: i.id, sampleTypeName: i.label })),
        }));
    };

    const onDocumentsChange = (items: PickerItem[]) => {
        setEditForm((s) => ({
            ...s,
            documentIds: items.map((i) => i.id),
            selectedDocuments: items,
        }));
    };

    // ─── Form lifecycle ──────────────────────────────────────────────────────

    const onSearchChange = (v: string) => {
        setSearchTerm(v);
        pagination.resetPage();
    };

    const onExcelFiltersChange = (next: ProtocolsExcelFiltersState) => {
        setExcelFilters(next);
        pagination.resetPage();
    };

    const openCreate = () => {
        setEditForm(EMPTY_FORM);
        setEditOpen(true);
    };

    const openEdit = (p: Protocol) => {
        setEditForm({
            protocolId: p.protocolId,
            protocolCode: p.protocolCode,
            protocolTitle: p.protocolTitle || "",
            protocolSource: p.protocolSource,
            protocolDescription: p.protocolDescription || "",
            accreditationVilas: !!p.protocolAccreditation?.VILAS,
            accreditationTdc: !!p.protocolAccreditation?.TDC,
            parameters: p.parameters || [],
            sampleTypes: p.sampleTypes || [],
            chemicals: p.chemicals || [],
            documentIds: p.protocolDocumentIds || [],
            selectedDocuments: (p.protocolDocumentIds || []).map((id) => ({
                id,
                label: id,
                sublabel: "",
            })),
        });
        setEditOpen(true);
    };

    const submitForm = async () => {
        const code = editForm.protocolCode.trim();
        const source = editForm.protocolSource.trim();
        if (!code || !source) return;

        const hasAcc = editForm.accreditationVilas || editForm.accreditationTdc;
        const body = {
            protocolCode: code,
            protocolTitle: editForm.protocolTitle.trim() || undefined,
            protocolSource: source,
            protocolDescription: editForm.protocolDescription.trim() || undefined,
            protocolAccreditation: hasAcc ? { VILAS: editForm.accreditationVilas || undefined, TDC: editForm.accreditationTdc || undefined } : undefined,
            parameters: editForm.parameters.length ? editForm.parameters : undefined,
            sampleTypes: editForm.sampleTypes.length ? editForm.sampleTypes : undefined,
            chemicals: editForm.chemicals.length ? editForm.chemicals : undefined,
            protocolDocumentIds: editForm.documentIds.length ? editForm.documentIds : undefined,
        };

        if (editForm.protocolId) {
            await updateP.mutateAsync({ body: { protocolId: editForm.protocolId, ...body } });
        } else {
            await createP.mutateAsync({ body });
        }
        setEditOpen(false);
    };

    const isLoading = protocolsQ.isLoading;
    const isError = protocolsQ.isError;

    // Picker items derived from form state
    const selectedParameterItems: PickerItem[] = editForm.parameters.map((p) => ({
        id: p.parameterId,
        label: p.parameterName,
    }));
    const selectedSampleTypeItems: PickerItem[] = editForm.sampleTypes.map((s) => ({
        id: s.sampleTypeId,
        label: s.sampleTypeName,
    }));

    return (
        <div className="space-y-4">
            <LibraryHeader
                titleKey="library.protocols.title"
                subtitleKey="library.protocols.total"
                totalCount={totalItems}
                searchValue={searchTerm}
                onSearchChange={onSearchChange}
                onAdd={openCreate}
                addLabelKey="library.protocols.actions.add"
                searchPlaceholderKey="library.protocols.searchPlaceholder"
            />

            {isLoading ? <ProtocolsSkeleton /> : null}

            {isError ? (
                <div className="bg-background border border-border rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                        <div className="text-sm font-medium text-foreground">{t("common.errorTitle")}</div>
                        <div className="text-sm text-muted-foreground">{t("library.protocols.errors.loadFailed")}</div>
                    </div>
                </div>
            ) : null}

            {!isLoading && !isError ? (
                <div className="flex gap-4">
                    <div className="flex-1 bg-background rounded-lg border border-border overflow-hidden">
                        <ProtocolsTable
                            items={pageItems}
                            selectedId={selected?.protocolId ?? null}
                            onView={(p) => setSelected(p)}
                            onEdit={openEdit}
                            excelFilters={excelFilters}
                            onExcelFiltersChange={onExcelFiltersChange}
                        />

                        <div className="border-t p-3">
                            <Pagination
                                currentPage={pagination.currentPage}
                                totalPages={totalPages}
                                itemsPerPage={pagination.itemsPerPage}
                                totalItems={totalItems}
                                onPageChange={pagination.handlePageChange}
                                onItemsPerPageChange={pagination.handleItemsPerPageChange}
                            />
                        </div>
                    </div>

                    <ProtocolDetailPanel protocol={selected} onClose={() => setSelected(null)} onEdit={openEdit} />
                </div>
            ) : null}

            {/* Create / Edit Modal */}
            {editOpen ? (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-lg border border-border w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-background z-10">
                            <div className="text-base font-semibold text-foreground">{editForm.protocolId ? t("library.protocols.edit.title") : t("library.protocols.create.title")}</div>
                            <Button variant="ghost" size="sm" onClick={() => setEditOpen(false)} type="button">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="p-5 space-y-6">
                            {/* Basic fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <div className="text-sm font-medium text-foreground">{t("library.protocols.create.protocolTitle")}</div>
                                    <Input
                                        value={editForm.protocolTitle}
                                        onChange={(e) => setEditForm((s) => ({ ...s, protocolTitle: e.target.value }))}
                                        placeholder={t("library.protocols.create.protocolTitlePlaceholder")}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-foreground">{t("library.protocols.create.protocolCode")}</div>
                                    <Input
                                        value={editForm.protocolCode}
                                        onChange={(e) => setEditForm((s) => ({ ...s, protocolCode: e.target.value }))}
                                        placeholder={t("library.protocols.create.protocolCodePlaceholder")}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-foreground">{t("library.protocols.create.protocolSource")}</div>
                                    <Input
                                        value={editForm.protocolSource}
                                        onChange={(e) => setEditForm((s) => ({ ...s, protocolSource: e.target.value }))}
                                        placeholder={t("library.protocols.create.protocolSourcePlaceholder")}
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-foreground">{t("library.protocols.create.protocolDescription")}</div>
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={editForm.protocolDescription}
                                    onChange={(e) => setEditForm((s) => ({ ...s, protocolDescription: e.target.value }))}
                                    placeholder={t("library.protocols.create.protocolDescriptionPlaceholder")}
                                />
                            </div>

                            {/* Accreditation */}
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-foreground">{t("library.protocols.create.protocolAccreditation.title")}</div>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        variant={editForm.accreditationVilas ? "default" : "outline"}
                                        onClick={() => setEditForm((s) => ({ ...s, accreditationVilas: !s.accreditationVilas }))}
                                    >
                                        {t("library.protocols.create.protocolAccreditation.vilas")}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={editForm.accreditationTdc ? "default" : "outline"}
                                        onClick={() => setEditForm((s) => ({ ...s, accreditationTdc: !s.accreditationTdc }))}
                                    >
                                        {t("library.protocols.create.protocolAccreditation.tdc")}
                                    </Button>
                                </div>
                            </div>

                            {/* Parameters search-select picker */}
                            <SearchSelectPicker
                                label={t("library.protocols.create.parameters")}
                                selected={selectedParameterItems}
                                onChange={onParametersChange}
                                onSearch={searchParameters}
                                onCreate={createParameterFn}
                                placeholder={t("library.parameters.searchPlaceholder")}
                            />

                            {/* Sample Types search-select picker */}
                            <SearchSelectPicker
                                label={t("library.protocols.create.sampleTypes")}
                                selected={selectedSampleTypeItems}
                                onChange={onSampleTypesChange}
                                onSearch={searchSampleTypes}
                                onCreate={createSampleTypeFn}
                                placeholder={t("library.sampleTypes.searchPlaceholder")}
                            />

                            {/* Documents search-select picker */}
                            <SearchSelectPicker
                                label={t("library.protocols.create.documentIds")}
                                selected={editForm.selectedDocuments}
                                onChange={onDocumentsChange}
                                onSearch={searchDocumentsFn}
                                placeholder={t("documentCenter.headers.allDesc")}
                            />

                            {/* Upload document */}
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setUploadModalOpen(true)}>
                                    <Upload className="h-4 w-4 mr-2" />
                                    {t("library.protocols.create.uploadDocument", { defaultValue: "Tải lên tài liệu" })}
                                </Button>
                            </div>

                            {/* Submit */}
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border mt-4">
                                <Button variant="outline" onClick={() => setEditOpen(false)} type="button">
                                    {t("common.cancel")}
                                </Button>
                                <Button
                                    onClick={() => void submitForm()}
                                    disabled={createP.isPending || updateP.isPending || !editForm.protocolCode.trim() || !editForm.protocolSource.trim()}
                                    type="button"
                                >
                                    {createP.isPending || updateP.isPending ? t("common.saving") : t("common.save")}
                                </Button>
                            </div>

                            {createP.isError || updateP.isError ? <div className="text-sm text-destructive">{t("library.protocols.create.error")}</div> : null}
                        </div>
                    </div>
                </div>
            ) : null}

            <DocumentUploadModal
                open={uploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
                onSuccess={(doc) => {
                    if (doc?.documentId) {
                        setEditForm((s) => ({
                            ...s,
                            documentIds: [...s.documentIds, doc.documentId],
                            selectedDocuments: [...s.selectedDocuments, { id: doc.documentId, label: doc.documentTitle || doc.documentId, sublabel: doc.documentId }],
                        }));
                    }
                }}
            />
        </div>
    );
}
