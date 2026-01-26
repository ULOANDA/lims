import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";

import { useMatricesList, useParametersList, useCreateParameter } from "@/api/library";

import type { Parameter, Matrix } from "@/types/library";

import type { ParameterWithMatrices } from "../hooks/useLibraryData";

import { LibraryHeader } from "../LibraryHeader";
import { useServerPagination } from "../hooks/useServerPagination";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

import { ParametersTable } from "./ParametersTable";
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

function resolveDisplayStyle(ds: unknown): DisplayStyleResolved {
  const obj = ds && typeof ds === "object" ? (ds as Record<string, unknown>) : undefined;

  const unit = typeof obj?.unit === "string" && obj.unit.trim().length ? obj.unit : null;

  const decimal =
    toFiniteNumberOrNull(obj?.decimal) ??
    toFiniteNumberOrNull(obj?.decimalPlaces) ??
    null;

  return { unit, decimal };
}

function toParameterWithMatrices(p: Parameter): ParameterWithMatrices {
  const anyP = p as unknown as Record<string, unknown>;

  return {
    ...p,
    createdById: (anyP.createdById as string) ?? "",
    modifiedAt: (anyP.modifiedAt as string) ?? (anyP.createdAt as string) ?? "",
    modifiedById: (anyP.modifiedById as string) ?? "",

    matrices: [],
    parameterNameEnResolved:
      typeof (anyP.parameterNameEn as string | undefined) === "string" &&
      (anyP.parameterNameEn as string).trim().length
        ? (anyP.parameterNameEn as string)
        : p.parameterName,

    displayStyleResolved: resolveDisplayStyle(anyP.displayStyle),
  } as ParameterWithMatrices;
} 

export function ParametersView() {
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const [selectedParameter, setSelectedParameter] =
    useState<ParameterWithMatrices | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateParameterForm>({
    parameterName: "",
    technicianAlias: "",
  });

  const [serverTotalPages, setServerTotalPages] = useState<number | null>(null);
  const pagination = useServerPagination(serverTotalPages, 10);

  const listInput = useMemo(
    () => ({
      query: {
        page: pagination.currentPage,
        itemsPerPage: pagination.itemsPerPage,
        search: debouncedSearch.trim().length ? debouncedSearch.trim() : null,
      },
      sort: { column: "createdAt", direction: "DESC" as const },
    }),
    [pagination.currentPage, pagination.itemsPerPage, debouncedSearch]
  );

  const parametersQ = useParametersList(listInput);

  const totalItems = parametersQ.data?.meta?.total ?? 0;
  const totalPages = parametersQ.data?.meta?.totalPages ?? 1;

  useEffect(() => {
    setServerTotalPages(totalPages);
  }, [totalPages]);

  useEffect(() => {
    if (pagination.currentPage > totalPages) pagination.handlePageChange(totalPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const pageParameters = (parametersQ.data?.data ?? []) as unknown as Parameter[];

  const pageItems = useMemo<ParameterWithMatrices[]>(
    () => pageParameters.map(toParameterWithMatrices),
    [pageParameters]
  );

  const selectedParameterId = selectedParameter?.parameterId ?? null;

const selectedMatricesInput = useMemo(
  () => ({
    query: {
      page: 1,
      itemsPerPage: 10,
      parameterId: selectedParameterId,
      search: null,
    },
    sort: { column: "createdAt", direction: "DESC" as const },
  }),
  [selectedParameterId]
);

const selectedMatricesQ = useMatricesList(selectedMatricesInput, {
  enabled: Boolean(selectedParameterId),
});

useEffect(() => {
  if (!selectedParameterId) return;

  const mats = (selectedMatricesQ.data?.data ?? []) as unknown as Matrix[];

  setSelectedParameter((prev) => {
    if (!prev) return prev;
    if (prev.parameterId !== selectedParameterId) return prev;
    return { ...prev, matrices: mats };
  });
}, [selectedMatricesQ.data, selectedParameterId]);

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
      body: {
        parameterName: name,
        technicianAlias: alias.length ? alias : null,
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
            onSelectProtocolCode={() => {}}
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
                <div className="text-sm text-destructive">
                  {t("library.parameters.create.error")}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
