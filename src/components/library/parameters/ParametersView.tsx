import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";

import {
  useCreateParameter,
  useParametersAll,
  libraryApi,
} from "@/api/library";

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
};

type DisplayStyleResolved = {
  unit: string | null;
  decimal: number | null;
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

function toFiniteNumberOrNull(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim().length) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function resolveDisplayStyle(ds: unknown): DisplayStyleResolved {
  const obj = asRecord(ds);

  const unit =
    typeof obj?.unit === "string" && obj.unit.trim().length ? (obj.unit as string) : null;

  const decimal =
    toFiniteNumberOrNull(obj?.decimal) ??
    toFiniteNumberOrNull(obj?.decimalPlaces) ??
    null;

  return { unit, decimal };
}

function toParameterWithMatrices(p: Parameter): ParameterWithMatrices {
  const anyP = asRecord(p) ?? {};
  return {
    ...p,
    createdById: (typeof anyP.createdById === "string" ? anyP.createdById : "") ?? "",
    modifiedAt:
      (typeof anyP.modifiedAt === "string" ? anyP.modifiedAt : undefined) ??
      (typeof anyP.createdAt === "string" ? anyP.createdAt : undefined) ??
      "",
    modifiedById: (typeof anyP.modifiedById === "string" ? anyP.modifiedById : "") ?? "",
    matrices: [],
    parameterNameEnResolved:
      typeof anyP.parameterNameEn === "string" && anyP.parameterNameEn.trim().length
        ? anyP.parameterNameEn
        : p.parameterName,
    displayStyleResolved: resolveDisplayStyle(anyP.displayStyle),
  } as ParameterWithMatrices;
}

function createEmptyFilters(): ParametersExcelFiltersState {
  return {
    parameterId: [],
    parameterName: [],
    technicianAlias: [],
    unit: [],
  };
}

function applyLocalFilters(items: ParameterWithMatrices[], f: ParametersExcelFiltersState) {
  const matchStr = (value: string, selected: string[]) =>
    selected.length ? selected.includes(value) : true;

  return items.filter((p) => {
    const id = p.parameterId;
    const name = p.parameterName;
    const alias = p.technicianAlias?.trim().length ? p.technicianAlias : "";
    const unit = p.displayStyleResolved.unit?.trim().length ? p.displayStyleResolved.unit : "";

    return (
      matchStr(id, f.parameterId) &&
      matchStr(name, f.parameterName) &&
      matchStr(alias, f.technicianAlias) &&
      matchStr(unit, f.unit)
    );
  });
}

export function ParametersView() {
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const [selectedParameter, setSelectedParameter] = useState<ParameterWithMatrices | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateParameterForm>({
    parameterName: "",
    technicianAlias: "",
  });

  const [serverTotalPages, setServerTotalPages] = useState<number | null>(null);
  const pagination = useServerPagination(serverTotalPages, 10);

  const allInput = useMemo(
    () => ({
      query: {
        page: 1,
        itemsPerPage: 5000,
        search: debouncedSearch.trim().length ? debouncedSearch.trim() : null,
      },
      sort: { column: "createdAt", direction: "DESC" as const },
    }),
    [debouncedSearch]
  );

  const parametersAllQ = useParametersAll(allInput);

  const allParameters = useMemo(() => {
    const data = (parametersAllQ.data?.data ?? []) as unknown as Parameter[];
    return data.map(toParameterWithMatrices);
  }, [parametersAllQ.data]);

  const [excelFilters, setExcelFilters] = useState<ParametersExcelFiltersState>(() => createEmptyFilters());

  const filteredAll = useMemo(
    () => applyLocalFilters(allParameters, excelFilters),
    [allParameters, excelFilters]
  );

  const totalItems = filteredAll.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pagination.itemsPerPage));

  useEffect(() => setServerTotalPages(totalPages), [totalPages]);

  useEffect(() => {
    if (pagination.currentPage > totalPages) pagination.handlePageChange(totalPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const end = start + pagination.itemsPerPage;
    return filteredAll.slice(start, end);
  }, [filteredAll, pagination.currentPage, pagination.itemsPerPage]);

  const createParam = useCreateParameter();

  const onSearchChange = (v: string) => {
    setSearchTerm(v);
    pagination.resetPage();
  };

  const openCreate = () => {
    setCreateForm({ parameterName: "", technicianAlias: "" });
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    const name = createForm.parameterName.trim();
    const alias = createForm.technicianAlias.trim();
    if (!name) return;

    await createParam.mutateAsync({
      body: { parameterName: name, technicianAlias: alias.length ? alias : null },
    });

    setCreateOpen(false);
  };

  const matrixCountsQ = useQuery({
    queryKey: ["library", "matrices", "countsByParameter_fast"],
    queryFn: async () => {
      const res = await libraryApi.matrices.filter({
        body: {
          filterFrom: "parameterId",
          textFilter: null,
          otherFilters: [],
          limit: 5000,
        },
      });
      if (!res.success) throw new Error(res.error?.message ?? "Unknown API error");

      const counts: Record<string, number> = {};
      const rows = res.data ?? [];
      for (const r of rows) counts[r.filterValue] = r.count;
      return counts;
    },
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = parametersAllQ.isLoading;
  const isError = parametersAllQ.isError;

  const onExcelFiltersChange = (next: ParametersExcelFiltersState) => {
    setExcelFilters(next);
    pagination.resetPage();
  };

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
            <div className="text-sm text-muted-foreground">
              {t("library.parameters.errors.loadFailed")}
            </div>
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
              matrixCounts={matrixCountsQ.data ?? {}}
              matrixCountsLoading={matrixCountsQ.isLoading}
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

          <ParameterDetailPanel
            selected={selectedParameter}
            onClose={() => setSelectedParameter(null)}
            onSelectProtocolId={() => {}}
          />
        </div>
      ) : null}

      {createOpen ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg border border-border w-full max-w-lg shadow-xl">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="text-base font-semibold text-foreground">
                {t("library.parameters.create.title")}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setCreateOpen(false)} type="button">
                {t("common.close")}
              </Button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">
                  {t("library.parameters.parameterName")}
                </div>
                <Input
                  value={createForm.parameterName}
                  onChange={(e) => setCreateForm((s) => ({ ...s, parameterName: e.target.value }))}
                  placeholder={t("library.parameters.create.parameterNamePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">
                  {t("library.parameters.technicianAlias")}
                </div>
                <Input
                  value={createForm.technicianAlias}
                  onChange={(e) => setCreateForm((s) => ({ ...s, technicianAlias: e.target.value }))}
                  placeholder={t("library.parameters.create.technicianAliasPlaceholder")}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setCreateOpen(false)} type="button">
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={() => void submitCreate()}
                  disabled={createParam.isPending || createForm.parameterName.trim().length === 0}
                  type="button"
                >
                  {createParam.isPending ? t("common.saving") : t("common.save")}
                </Button>
              </div>

              {createParam.isError ? (
                <div className="text-sm text-destructive">{t("library.parameters.create.error")}</div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
