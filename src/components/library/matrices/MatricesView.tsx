import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";

import { Pagination } from "@/components/ui/pagination";
import { useMatricesAll, type Matrix } from "@/api/library";

import { LibraryHeader } from "../LibraryHeader";
import { useServerPagination } from "../hooks/useServerPagination";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

import { MatricesTable } from "./MatricesTable";
import { MatricesCreateModal } from "./MatricesCreateModal";
import { MatricesDeleteConfirm } from "./MatricesDeleteConfirm";
import { MatricesEditModal } from "./MatricesEditModal";
import { MatricesDetailModal } from "./MatricesDetailModal";

type CreateMatrixForm = {
  parameterId: string;
  protocolId: string;
  sampleTypeId: string;
  feeBeforeTax: string;
  taxRate: string;
  feeAfterTax: string;
};

export type ExcelFiltersState = {
  matrixId: string[];
  parameterId: string[];
  parameterName: string[];
  protocolId: string[];
  protocolCode: string[];
  sampleTypeId: string[];
  sampleTypeName: string[];
  feeBeforeTax: number[];
  feeAfterTax: number[];
};

function MatricesSkeleton() {
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

function toNumberSafe(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isNaN(n) ? null : n;
}

function getParameterLabel(m: Matrix): string {
  return m.parameterName && m.parameterName.trim() ? m.parameterName.trim() : m.parameterId;
}

function getProtocolLabel(m: Matrix): string {
  return m.protocolCode && m.protocolCode.trim() ? m.protocolCode.trim() : m.protocolId;
}

function getSampleTypeLabel(m: Matrix): string {
  return m.sampleTypeName && m.sampleTypeName.trim() ? m.sampleTypeName.trim() : m.sampleTypeId;
}

function applyLocalFilters(items: Matrix[], f: ExcelFiltersState): Matrix[] {
  const matchStr = (value: string, selected: string[]) =>
    selected.length ? selected.includes(value) : true;

  const matchNum = (value: number | null, selected: number[]) =>
    selected.length ? value !== null && selected.includes(value) : true;

  return items.filter((m) => {
    const feeBeforeTax = toNumberSafe(m.feeBeforeTax) ?? null;
    const feeAfterTax = toNumberSafe(m.feeAfterTax) ?? null;

    const parameterLabel = getParameterLabel(m);
    const protocolLabel = getProtocolLabel(m);
    const sampleTypeLabel = getSampleTypeLabel(m);

    return (
      matchStr(m.matrixId, f.matrixId) &&
      matchStr(m.parameterId, f.parameterId) &&
      matchStr(parameterLabel, f.parameterName) &&
      matchStr(m.protocolId, f.protocolId) &&
      matchStr(protocolLabel, f.protocolCode) &&
      matchStr(m.sampleTypeId, f.sampleTypeId) &&
      matchStr(sampleTypeLabel, f.sampleTypeName) &&
      matchNum(feeBeforeTax, f.feeBeforeTax) &&
      matchNum(feeAfterTax, f.feeAfterTax)
    );
  });
}

function createEmptyFilters(): ExcelFiltersState {
  return {
    matrixId: [],
    parameterId: [],
    parameterName: [],
    protocolId: [],
    protocolCode: [],
    sampleTypeId: [],
    sampleTypeName: [],
    feeBeforeTax: [],
    feeAfterTax: [],
  };
}

export function MatricesView() {
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
  const [selectedMatrixId, setSelectedMatrixId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [createForm, setCreateForm] = useState<CreateMatrixForm>({
    parameterId: "",
    protocolId: "",
    sampleTypeId: "",
    feeBeforeTax: "",
    taxRate: "",
    feeAfterTax: "",
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

  const matricesAllQ = useMatricesAll(allInput);

  const allItems = useMemo(() => (matricesAllQ.data?.data ?? []) as Matrix[], [matricesAllQ.data]);

  const onSearchChange = (v: string) => {
    setSearchTerm(v);
    pagination.resetPage();
  };

  const openCreate = () => {
    setCreateForm({
      parameterId: "",
      protocolId: "",
      sampleTypeId: "",
      feeBeforeTax: "",
      taxRate: "",
      feeAfterTax: "",
    });
    setCreateOpen(true);
  };

  const [excelFilters, setExcelFilters] = useState<ExcelFiltersState>(() => createEmptyFilters());

  const filteredAllItems = useMemo(
    () => applyLocalFilters(allItems, excelFilters),
    [allItems, excelFilters]
  );

  const totalItems = filteredAllItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pagination.itemsPerPage));

  useEffect(() => {
    setServerTotalPages(totalPages);
  }, [totalPages]);

  useEffect(() => {
    if (pagination.currentPage > totalPages) {
      pagination.handlePageChange(totalPages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const end = start + pagination.itemsPerPage;
    return filteredAllItems.slice(start, end);
  }, [filteredAllItems, pagination.currentPage, pagination.itemsPerPage]);

  const clearAllExcelFilters = () => {
    setExcelFilters(createEmptyFilters());
    pagination.resetPage();
  };

  const isLoading = matricesAllQ.isLoading;
  const isError = matricesAllQ.isError;

  const onExcelFiltersChange = (next: ExcelFiltersState) => {
    setExcelFilters(next);
    pagination.resetPage();
  };

  return (
    <div className="space-y-4">
      <LibraryHeader
        titleKey="library.matrices.title"
        subtitleKey="library.matrices.total"
        totalCount={totalItems}
        searchValue={searchTerm}
        onSearchChange={onSearchChange}
        onAdd={openCreate}
        addLabelKey="library.matrices.actions.add"
        searchPlaceholderKey="library.matrices.searchPlaceholder"
      />

      {isLoading ? <MatricesSkeleton /> : null}

      {isError ? (
        <div className="bg-background border border-border rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <div className="text-sm font-medium text-foreground">{t("common.errorTitle")}</div>
            <div className="text-sm text-muted-foreground">
              {t("library.matrices.errors.loadFailed")}
            </div>
          </div>
        </div>
      ) : null}

      {!isLoading && !isError ? (
        <div className="bg-background rounded-lg border border-border overflow-hidden">
          <MatricesTable
            items={pageItems}
            selectedRowKey={selectedRowKey}
            onSelectRow={(rowKey, matrixId) => {
              setSelectedRowKey(rowKey);
              setSelectedMatrixId(matrixId);
            }}
            onOpenDetail={(id) => {
              setSelectedMatrixId(id);
              setDetailOpen(true);
            }}
            onOpenEdit={(id) => {
              setSelectedMatrixId(id);
              setEditOpen(true);
            }}
            onOpenDelete={(id) => {
              setSelectedMatrixId(id);
              setDetailOpen(false);
              setEditOpen(false);
              setDeleteOpen(true);
            }}
            excelFilters={excelFilters}
            onExcelFiltersChange={onExcelFiltersChange}
            onClearAllExcelFilters={clearAllExcelFilters}
          />

          <MatricesDetailModal
            open={detailOpen}
            matrixId={detailOpen ? selectedMatrixId : null}
            onClose={() => setDetailOpen(false)}
          />

          <MatricesEditModal
            open={editOpen}
            matrixId={editOpen ? selectedMatrixId : null}
            onClose={() => setEditOpen(false)}
          />

          <MatricesDeleteConfirm
            open={deleteOpen}
            matrixId={selectedMatrixId}
            onClose={() => setDeleteOpen(false)}
            onDeleted={(id) => {
              setSelectedMatrixId((cur) => (cur === id ? null : cur));
              setSelectedRowKey(null);
            }}
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
      ) : null}

      <MatricesCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
