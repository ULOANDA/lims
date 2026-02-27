import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";

import { useCreateParameter, useParametersList } from "@/api/library";

import type { Parameter } from "@/types/library";
import type { ParameterWithMatrices } from "../hooks/useLibraryData";

import { LibraryHeader } from "../LibraryHeader";
import { useServerPagination } from "../hooks/useServerPagination";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

import { ParametersTable, type ParametersExcelFiltersState } from "./ParametersTable";
import { ParameterDetailPanel } from "./ParametersDetailPanel";

type CreateParameterForm = {
    parameterName: string;
    technicianAlias: string;
    technicianGroupId: string;
    parameterSearchKeys: string;
    parameterStatus: string;
    parameterNote: string;
    displayStyleEng: string;
    displayStyleDefault: string;
};

type DisplayStyleResolved = {
    eng: string | null;
    default: string | null;
};

function ParametersSkeleton() {
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

function asRecord(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function resolveDisplayStyle(ds: unknown): DisplayStyleResolved {
    const obj = asRecord(ds);
    const eng = typeof obj?.eng === "string" && obj.eng.trim().length ? obj.eng : null;
    const def = typeof obj?.default === "string" && obj.default.trim().length ? obj.default : null;
    return { eng, default: def };
}

function toParameterWithMatrices(p: Parameter): ParameterWithMatrices {
    const anyP = asRecord(p) ?? {};
    return {
        ...p,
        createdById: (typeof anyP.createdById === "string" ? anyP.createdById : "") ?? "",
        modifiedAt: (typeof anyP.modifiedAt === "string" ? anyP.modifiedAt : undefined) ?? (typeof anyP.createdAt === "string" ? anyP.createdAt : undefined) ?? "",
        modifiedById: (typeof anyP.modifiedById === "string" ? anyP.modifiedById : "") ?? "",
        matrices: [],
        parameterNameEnResolved: typeof anyP.parameterNameEn === "string" && anyP.parameterNameEn.trim().length ? anyP.parameterNameEn : p.parameterName,
        displayStyleResolved: resolveDisplayStyle(anyP.displayStyle),
    } as ParameterWithMatrices;
}

function createEmptyFilters(): ParametersExcelFiltersState {
    return {
        parameterId: [],
        parameterName: [],
        technicianAlias: [],
    };
}

export function ParametersView() {
    const { t } = useTranslation();

    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebouncedValue(searchTerm, 300);

    const [selectedParameter, setSelectedParameter] = useState<ParameterWithMatrices | null>(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [editParameterId, setEditParameterId] = useState<string | null>(null);
    const [createForm, setCreateForm] = useState<CreateParameterForm>({
        parameterName: "",
        technicianAlias: "",
        technicianGroupId: "",
        parameterSearchKeys: "",
        parameterStatus: "Active",
        parameterNote: "",
        displayStyleEng: "",
        displayStyleDefault: "",
    });

    const [serverTotalPages, setServerTotalPages] = useState<number | null>(null);
    const pagination = useServerPagination(serverTotalPages, 20);

    const listInput = useMemo(
        () => ({
            query: {
                page: pagination.currentPage,
                itemsPerPage: 20,
                search: debouncedSearch.trim().length ? debouncedSearch.trim() : null,
            },
            sort: { column: "createdAt", direction: "DESC" as const },
        }),
        [debouncedSearch, pagination.currentPage],
    );

    const parametersQ = useParametersList(listInput);

    const pageItems = useMemo(() => {
        const data = (parametersQ.data?.data ?? []) as unknown as Parameter[];
        return data.map(toParameterWithMatrices);
    }, [parametersQ.data]);

    const serverMeta = parametersQ.data?.meta;
    const totalItems = serverMeta?.totalItems ?? serverMeta?.total ?? 0;
    const totalPages = serverMeta?.totalPages ?? 1;

    useEffect(() => setServerTotalPages(totalPages), [totalPages]);

    const [excelFilters] = useState<ParametersExcelFiltersState>(() => createEmptyFilters());

    const createParam = useCreateParameter();

    const onSearchChange = (v: string) => {
        setSearchTerm(v);
        pagination.resetPage();
    };

    const openCreate = () => {
        setCreateForm({
            parameterName: "",
            technicianAlias: "",
            technicianGroupId: "",
            parameterSearchKeys: "",
            parameterStatus: "Active",
            parameterNote: "",
            displayStyleEng: "",
            displayStyleDefault: "",
        });
        setCreateOpen(true);
    };

    const openEdit = (p: ParameterWithMatrices) => {
        setEditParameterId(p.parameterId);
        setCreateForm({
            parameterName: p.parameterName || "",
            technicianAlias: p.technicianAlias || "",
            technicianGroupId: p.technicianGroupId || "",
            parameterSearchKeys: (p as any).parameterSearchKeys?.join?.(", ") || "",
            parameterStatus: p.parameterStatus || "Active",
            parameterNote: (p as any).parameterNote || "",
            displayStyleEng: p.displayStyleResolved?.eng || "",
            displayStyleDefault: p.displayStyleResolved?.default || "",
        });
        setCreateOpen(true);
    };

    const submitCreate = async () => {
        const name = createForm.parameterName.trim();
        const alias = createForm.technicianAlias.trim();
        const groupId = createForm.technicianGroupId.trim();
        const searchKeys = createForm.parameterSearchKeys
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean);
        const status = createForm.parameterStatus.trim();
        const note = createForm.parameterNote.trim();
        const eng = createForm.displayStyleEng.trim();
        const def = createForm.displayStyleDefault.trim();

        if (!name) return;

        await createParam.mutateAsync({
            body: {
                parameterName: name,
                technicianAlias: alias.length ? alias : null,
                technicianGroupId: groupId.length ? groupId : null,
                parameterSearchKeys: searchKeys.length ? searchKeys : null,
                parameterStatus: status.length ? status : null,
                parameterNote: note.length ? note : null,
                displayStyle: eng.length || def.length ? { eng: eng.length ? eng : undefined, default: def.length ? def : undefined } : undefined,
            },
        });

        setCreateOpen(false);
    };

    const isLoading = parametersQ.isLoading;
    const isError = parametersQ.isError;

    return (
        <div className="space-y-4">
            <LibraryHeader
                titleKey="library.parameters.title"
                subtitleKey="library.parameters.total"
                totalCount={totalItems}
                searchValue={searchTerm}
                onSearchChange={onSearchChange}
                onAdd={openCreate}
                addLabelKey="library.parameters.actions.add"
                searchPlaceholderKey="library.parameters.searchPlaceholder"
            />

            {isLoading ? <ParametersSkeleton /> : null}

            {isError ? (
                <div className="bg-background border border-border rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                        <div className="text-sm font-medium text-foreground">{t("common.errorTitle")}</div>
                        <div className="text-sm text-muted-foreground">{t("library.parameters.errors.loadFailed")}</div>
                    </div>
                </div>
            ) : null}

            {!isLoading && !isError ? (
                <div className="flex gap-4">
                    <div className="flex-1 bg-background rounded-lg border border-border overflow-hidden">
                        <ParametersTable
                            items={pageItems}
                            selectedId={selectedParameter?.parameterId ?? null}
                            onSelect={(p) => setSelectedParameter(p)}
                            onEdit={openEdit}
                            excelFilters={excelFilters}
                            onExcelFiltersChange={() => {}}
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

                    <ParameterDetailPanel selected={selectedParameter} onClose={() => setSelectedParameter(null)} onSelectProtocolId={() => {}} />
                </div>
            ) : null}

            {createOpen ? (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-lg border border-border w-full max-w-lg shadow-xl">
                        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                            <div className="text-base font-semibold text-foreground">
                                {editParameterId ? t("library.parameters.edit.title", { defaultValue: "Chỉnh sửa chỉ tiêu" }) : t("library.parameters.create.title")}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setCreateOpen(false);
                                    setEditParameterId(null);
                                }}
                                type="button"
                            >
                                {t("common.close")}
                            </Button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-foreground">{t("library.parameters.parameterName")}</div>
                                <Input
                                    value={createForm.parameterName}
                                    onChange={(e) => setCreateForm((s) => ({ ...s, parameterName: e.target.value }))}
                                    placeholder={t("library.parameters.create.parameterNamePlaceholder")}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-foreground">{t("library.parameters.technicianAlias")}</div>
                                    <Input
                                        value={createForm.technicianAlias}
                                        onChange={(e) => setCreateForm((s) => ({ ...s, technicianAlias: e.target.value }))}
                                        placeholder={t("library.parameters.create.technicianAliasPlaceholder")}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-foreground">{t("library.parameters.technicianGroupId")}</div>
                                    <Input
                                        value={createForm.technicianGroupId}
                                        onChange={(e) => setCreateForm((s) => ({ ...s, technicianGroupId: e.target.value }))}
                                        placeholder={t("library.parameters.create.technicianGroupIdPlaceholder")}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-foreground">{t("library.parameters.parameterSearchKeys")}</div>
                                    <Input
                                        value={createForm.parameterSearchKeys}
                                        onChange={(e) => setCreateForm((s) => ({ ...s, parameterSearchKeys: e.target.value }))}
                                        placeholder={t("library.parameters.create.parameterSearchKeysPlaceholder")}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-foreground">{t("library.parameters.parameterStatus")}</div>
                                    <select
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        value={createForm.parameterStatus}
                                        onChange={(e) => setCreateForm((s) => ({ ...s, parameterStatus: e.target.value }))}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-sm font-medium text-foreground">{t("library.parameters.parameterNote")}</div>
                                <Input
                                    value={createForm.parameterNote}
                                    onChange={(e) => setCreateForm((s) => ({ ...s, parameterNote: e.target.value }))}
                                    placeholder={t("library.parameters.create.parameterNotePlaceholder")}
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setCreateOpen(false);
                                        setEditParameterId(null);
                                    }}
                                    type="button"
                                >
                                    {t("common.cancel")}
                                </Button>
                                <Button onClick={() => void submitCreate()} disabled={createParam.isPending || createForm.parameterName.trim().length === 0} type="button">
                                    {createParam.isPending ? t("common.saving") : t("common.save")}
                                </Button>
                            </div>

                            {createParam.isError ? <div className="text-sm text-destructive">{t("library.parameters.create.error")}</div> : null}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
