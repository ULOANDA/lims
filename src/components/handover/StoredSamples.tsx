import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";

import { SampleDetailModal } from "@/components/samples/SampleDetailModal";
import { SampleUpsertModal } from "@/components/samples/SampleUpsertModal";
import { SampleDeleteModal } from "@/components/samples/SampleDeleteModal";

import {
  samplesGetAllPages,
  samplesKeys,
  useSamplesAll,
  useSamplesList,
} from "@/api/samples";
import type { SampleListItem, SampleStatus } from "@/types/sample";

import { useServerPagination } from "@/components/library/hooks/useServerPagination";
import { useDebouncedValue } from "@/components/library/hooks/useDebouncedValue";

import {
  SamplesTable,
  type SamplesExcelFiltersState,
} from "../samples/SamplesTable";
import { useQueryClient } from "@tanstack/react-query";

function Skeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-48 bg-muted rounded" />
        <div className="h-9 w-full bg-muted rounded" />
        <div className="h-40 w-full bg-muted rounded" />
      </div>
    </div>
  );
}

function createEmptyFilters(): SamplesExcelFiltersState {
  return {
    receiptId: [],
    sampleStatus: [],
    sampleTypeName: [],
  };
}

function applyLocalFilters(
  items: SampleListItem[],
  f: SamplesExcelFiltersState
): SampleListItem[] {
  const matchStr = (value: string, selected: string[]) =>
    selected.length ? selected.includes(value) : true;

  const matchStatus = (value: string, selected: SampleStatus[]) =>
    selected.length ? selected.includes(value as SampleStatus) : true;

  return items.filter((s) => {
    const receiptId = s.receiptId ?? "";
    const typeName = s.sampleTypeName ?? "";
    const st = s.sampleStatus ?? "";
    return (
      matchStr(receiptId, f.receiptId) &&
      matchStr(typeName, f.sampleTypeName) &&
      matchStatus(st, f.sampleStatus)
    );
  });
}

function hasAnyExcelFilter(f: SamplesExcelFiltersState): boolean {
  return (
    (f.receiptId?.length ?? 0) > 0 ||
    (f.sampleTypeName?.length ?? 0) > 0 ||
    (f.sampleStatus?.length ?? 0) > 0
  );
}

export function StoredSamples() {
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const [excelFilters, setExcelFilters] = useState<SamplesExcelFiltersState>(
    () => createEmptyFilters()
  );

  const excelFiltering = useMemo(
    () => hasAnyExcelFilter(excelFilters),
    [excelFilters]
  );

  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);

  const [serverTotalPages, setServerTotalPages] = useState<number | null>(null);
  const pagination = useServerPagination(serverTotalPages, 10);

  const [detailOpen, setDetailOpen] = useState(false);
  const [upsertOpen, setUpsertOpen] = useState(false);
  const [upsertMode, setUpsertMode] = useState<"create" | "update">("create");
  const [selected, setSelected] = useState<SampleListItem | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const qc = useQueryClient();
  const baseInput = useMemo(
    () => ({
      query: {
        search: debouncedSearch.trim().length ? debouncedSearch.trim() : null,
      },
      sort: { column: "createdAt", direction: "DESC" as const },
    }),
    [debouncedSearch]
  );

  const listInput = useMemo(
    () => ({
      query: {
        page: pagination.currentPage,
        itemsPerPage: pagination.itemsPerPage,
        search: baseInput.query.search,
      },
      sort: baseInput.sort,
    }),
    [
      baseInput.query.search,
      baseInput.sort,
      pagination.currentPage,
      pagination.itemsPerPage,
    ]
  );

  const samplesListQ = useSamplesList(listInput, { enabled: !excelFiltering });
  const allInput = useMemo(
    () => ({
      query: {
        page: 1,
        itemsPerPage: 5000,
        search: baseInput.query.search,
      },
      sort: baseInput.sort,
    }),
    [baseInput.query.search, baseInput.sort]
  );

  const samplesAllQ = useSamplesAll(allInput, { enabled: excelFiltering });
  useEffect(() => {
    void qc.prefetchQuery({
      queryKey: samplesKeys.allPages(allInput),
      queryFn: () => samplesGetAllPages(allInput),
      staleTime: 5 * 60 * 1000,
    });
  }, [qc, allInput]);

  const allItems = useMemo(() => {
    if (!excelFiltering) return [] as SampleListItem[];
    return (samplesAllQ.data?.data ?? []) as SampleListItem[];
  }, [excelFiltering, samplesAllQ.data]);

  const filteredByExcel = useMemo(() => {
    if (!excelFiltering) return allItems;
    return applyLocalFilters(allItems, excelFilters);
  }, [excelFiltering, allItems, excelFilters]);

  const listItems = useMemo(() => {
    if (excelFiltering) return [] as SampleListItem[];
    return (samplesListQ.data?.data ?? []) as SampleListItem[];
  }, [excelFiltering, samplesListQ.data]);

  const totalItems = useMemo(() => {
    if (excelFiltering) return filteredByExcel.length;
    return (samplesListQ.data?.meta?.total ?? 0) as number;
  }, [excelFiltering, filteredByExcel.length, samplesListQ.data?.meta?.total]);

  const totalPages = useMemo(() => {
    if (excelFiltering) {
      return Math.max(1, Math.ceil(totalItems / pagination.itemsPerPage));
    }
    return (samplesListQ.data?.meta?.totalPages ?? 1) as number;
  }, [
    excelFiltering,
    totalItems,
    pagination.itemsPerPage,
    samplesListQ.data?.meta?.totalPages,
  ]);

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
    if (!excelFiltering) {
      return listItems;
    }
    const start = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const end = start + pagination.itemsPerPage;
    return filteredByExcel.slice(start, end);
  }, [
    excelFiltering,
    listItems,
    filteredByExcel,
    pagination.currentPage,
    pagination.itemsPerPage,
  ]);

  const isLoading = excelFiltering
    ? samplesAllQ.isLoading
    : samplesListQ.isLoading;
  const isError = excelFiltering ? samplesAllQ.isError : samplesListQ.isError;

  const onSearchChange = (v: string) => {
    setSearchTerm(v);
    pagination.resetPage();
  };

  const onExcelFiltersChange = (next: SamplesExcelFiltersState) => {
    setExcelFilters(next);
    pagination.resetPage();
  };

  const findRowById = (sampleId: string): SampleListItem | null => {
    const inPage = pageItems.find((x) => x.sampleId === sampleId) ?? null;
    if (inPage) return inPage;
    if (excelFiltering)
      return allItems.find((x) => x.sampleId === sampleId) ?? null;
    return null;
  };

  const openDetailById = (sampleId: string) => {
    const row = findRowById(sampleId);
    setSelected(row);
    setDetailOpen(true);
  };

  const openUpdateById = (sampleId: string) => {
    const row = findRowById(sampleId);
    setSelected(row);
    setUpsertMode("update");
    setUpsertOpen(true);
  };

  const openDeleteById = (sampleId: string) => {
    setDeleteTargetId(sampleId);
    setDeleteOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:flex-1 md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("handover.storedSamples.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>

          <div className="flex w-full md:w-auto md:justify-end">
            <Button
              variant="default"
              className="flex w-full items-center gap-2 md:w-auto"
              onClick={() => {
                setSelected(null);
                setUpsertMode("create");
                setUpsertOpen(true);
              }}>
              <Plus className="h-4 w-4" />
              {t("common.create")}
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? <Skeleton /> : null}

      {isError ? (
        <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <div className="font-medium text-foreground">
              {t("common.error")}
            </div>
            <div className="text-sm text-muted-foreground">
              {t("common.toast.failed")}
            </div>
          </div>
        </div>
      ) : null}

      {!isLoading && !isError ? (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <SamplesTable
            items={pageItems}
            selectedRowKey={selectedRowKey}
            onSelectRow={(rowKey, sampleId) => {
              setSelectedRowKey(rowKey);
              openDetailById(sampleId);
            }}
            onView={(id) => openDetailById(id)}
            onEdit={(id) => openUpdateById(id)}
            onDelete={(id) => openDeleteById(id)}
            excelFilters={excelFilters}
            onExcelFiltersChange={onExcelFiltersChange}
          />

          <Pagination
            currentPage={pagination.currentPage}
            totalPages={totalPages}
            itemsPerPage={pagination.itemsPerPage}
            totalItems={totalItems}
            onPageChange={pagination.handlePageChange}
            onItemsPerPageChange={pagination.handleItemsPerPageChange}
          />
        </div>
      ) : null}

      <SampleDetailModal
        open={detailOpen}
        sampleId={selected?.sampleId ?? null}
        onClose={() => setDetailOpen(false)}
      />

      <SampleUpsertModal
        open={upsertOpen}
        mode={upsertMode}
        sampleId={upsertMode === "update" ? selected?.sampleId ?? null : null}
        onClose={() => setUpsertOpen(false)}
      />

      <SampleDeleteModal
        open={deleteOpen}
        sampleId={deleteTargetId}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => {}}
      />
    </div>
  );
}
