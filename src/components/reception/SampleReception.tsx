import React, { useEffect, useMemo, useState } from "react";
import { Search, AlertCircle, Truck, Package, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";

import { ReceiptDetailModal } from "@/components/reception/ReceiptDetailModal";
import { CreateReceiptModal } from "@/components/reception/CreateReceiptModal";
import { ReceiptDeleteModal } from "@/components/reception/ReceiptDeleteModal";

import { receiptsGetFull, useReceiptsAll } from "@/api/receipts";
import type { ReceiptDetail, ReceiptListItem, ReceiptStatus } from "@/types/receipt";

import { useServerPagination } from "@/components/library/hooks/useServerPagination";
import { useDebouncedValue } from "@/components/library/hooks/useDebouncedValue";

import {
  ReceiptsTable,
  type ReceiptExcelFiltersState,
  type TabKey,
} from "@/components/reception/ReceiptsTable";

function createEmptyFilters(): ReceiptExcelFiltersState {
  return {
    receiptStatus: [],
    receiptCode: [],
  };
}

function isOverdue(deadlineIso?: string | null): boolean {
  if (!deadlineIso) return false;
  const tt = new Date(deadlineIso).getTime();
  if (!Number.isFinite(tt)) return false;
  return tt < Date.now();
}

function applyLocalFilters(
  items: ReceiptListItem[],
  f: ReceiptExcelFiltersState
): ReceiptListItem[] {
  const matchStr = (value: string, selected: string[]) =>
    selected.length ? selected.includes(value) : true;

  const matchStatus = (value: ReceiptStatus, selected: ReceiptStatus[]) =>
    selected.length ? selected.includes(value) : true;

  return items.filter((r) => {
    const receiptCode = r.receiptCode ?? "";
    return (
      matchStatus(r.receiptStatus, f.receiptStatus) &&
      matchStr(receiptCode, f.receiptCode)
    );
  });
}

export function SampleReception() {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<TabKey>("processing");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const [selectedReceiptFull, setSelectedReceiptFull] =
    useState<ReceiptDetail | null>(null);
  const [isCreateReceiptModalOpen, setIsCreateReceiptModalOpen] =
    useState(false);
  const [deleteReceiptId, setDeleteReceiptId] = useState<string | null>(null);
  const [openingReceiptId, setOpeningReceiptId] = useState<string | null>(null);

  const [excelFilters, setExcelFilters] = useState<ReceiptExcelFiltersState>(() =>
    createEmptyFilters()
  );
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);

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

  const receiptsAllQ = useReceiptsAll(allInput);

  const allItems = useMemo(
    () => (receiptsAllQ.data?.data ?? []) as ReceiptListItem[],
    [receiptsAllQ.data]
  );

  const filteredByExcel = useMemo(
    () => applyLocalFilters(allItems, excelFilters),
    [allItems, excelFilters]
  );

  const tabFiltered = useMemo(() => filteredByExcel, [filteredByExcel]);

  const totalItems = tabFiltered.length;
  const totalPages = Math.max(
    1,
    Math.ceil(totalItems / pagination.itemsPerPage)
  );

  useEffect(() => {
    setServerTotalPages(totalPages);
  }, [totalPages]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoadingList(true);
      setErrorList(null);

      const res = await receiptsGetList({
        query: {
          page,
          itemsPerPage,
        },
      });

      if (cancelled) return;

      if (!res.success) {
        setList([]);
        setMeta(null);
        setErrorList(res.error?.message ?? t("common.toast.requestFailed"));
        setLoadingList(false);
        return;
      }

      const data = res.data ?? [];
      setList(data);

      const m = res.meta ?? null;

      const totalPages =
        typeof m?.totalPages === "number" && Number.isFinite(m.totalPages)
          ? m.totalPages
          : 1;
      
      const totalItems =
        typeof (m as { totalItems?: unknown })?.totalItems === "number" &&
        Number.isFinite((m as { totalItems: number }).totalItems)
          ? (m as { totalItems: number }).totalItems
          : data.length;
      
      setMeta({ totalPages, total: totalItems });
      
      setLoadingList(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const end = start + pagination.itemsPerPage;
    return tabFiltered.slice(start, end);
  }, [tabFiltered, pagination.currentPage, pagination.itemsPerPage]);

  const overdueReceipts = useMemo(() => {
    return filteredByExcel.filter((r) => isOverdue(r.receiptDeadline)).length;
  }, [filteredByExcel]);

  const totalReceipts = totalItems;

  const isLoading = receiptsAllQ.isLoading;
  const isError = receiptsAllQ.isError;

  const onSearchChange = (v: string) => {
    setSearchTerm(v);
    pagination.resetPage();
  };

  const onExcelFiltersChange = (next: ReceiptExcelFiltersState) => {
    setExcelFilters(next);
    pagination.resetPage();
  };

  async function openReceipt(receiptId: string) {
    if (openingReceiptId) return;

    setOpeningReceiptId(receiptId);
    const res = await receiptsGetFull({ receiptId });

    if (!res.success) {
      setOpeningReceiptId(null);
      return;
    }

    setSelectedReceiptFull(res.data ?? null);
    setOpeningReceiptId(null);
  }

  return (
    <div className="p-6 space-y-6">
      {selectedReceiptFull && (
        <ReceiptDetailModal
          receipt={selectedReceiptFull}
          onClose={() => setSelectedReceiptFull(null)}
          onSampleClick={() => {}}
          onUpdated={(next) => setSelectedReceiptFull(next)}
        />
      )}

      {isCreateReceiptModalOpen && (
        <CreateReceiptModal
          onClose={() => setIsCreateReceiptModalOpen(false)}
        />
      )}

      <ReceiptDeleteModal
        open={deleteReceiptId !== null}
        receiptId={deleteReceiptId}
        onClose={() => setDeleteReceiptId(null)}
        onDeleted={() => {}}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-sm text-muted-foreground">
            {t("reception.sampleReception.metrics.totalReceipts")}
          </div>
          <div className="text-3xl font-semibold mt-1 text-foreground">
            {totalReceipts}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-sm text-muted-foreground">
            {t("reception.sampleReception.metrics.overdueReceipts")}
          </div>
          <div className="text-3xl font-semibold mt-1 text-destructive">
            {overdueReceipts}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-sm text-muted-foreground">
            {t("reception.sampleReception.metrics.pendingSamples")}
          </div>
          <div className="text-3xl font-semibold mt-1 text-muted-foreground">
            0
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-sm text-muted-foreground">
            {t("reception.sampleReception.metrics.returnResults")}
          </div>
          <div className="text-3xl font-semibold mt-1 text-foreground">
            {totalItems}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex gap-2 bg-muted/50 p-1 rounded-lg">
            <Button
              variant={activeTab === "processing" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                setActiveTab("processing");
                pagination.resetPage();
              }}
              className={`flex items-center gap-2 ${
                activeTab === "processing"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <Package className="h-4 w-4" />
              {t("reception.sampleReception.tabs.processing")} ({totalItems})
            </Button>

            <Button
              variant={activeTab === "return-results" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                setActiveTab("return-results");
                pagination.resetPage();
              }}
              className={`flex items-center gap-2 ${
                activeTab === "return-results"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <Truck className="h-4 w-4" />
              {t("reception.sampleReception.tabs.returnResults")} ({totalItems})
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-1 w-full md:w-auto md:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("reception.sampleReception.search.placeholder")}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>

            <Button
              variant="default"
              className="flex items-center gap-2"
              onClick={() => setIsCreateReceiptModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              {t("reception.sampleReception.actions.createReceipt")}
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-44 bg-muted rounded" />
            <div className="h-9 w-full bg-muted rounded" />
            <div className="h-40 w-full bg-muted rounded" />
          </div>
        </div>
      ) : null}

      {isError ? (
        <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{t("common.toast.requestFailed")}</span>
        </div>
      ) : null}

      {!isLoading && !isError ? (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <ReceiptsTable
            items={pageItems}
            activeTab={activeTab}
            selectedRowKey={selectedRowKey}
            onSelectRow={(rowKey, receiptId) => {
              setSelectedRowKey(rowKey);
              void openReceipt(receiptId);
            }}
            onView={(id) => void openReceipt(id)}
            onDelete={(id) => setDeleteReceiptId(id)}
            excelFilters={excelFilters}
            onExcelFiltersChange={onExcelFiltersChange}
            openingReceiptId={openingReceiptId}
          />

          <div>
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
    </div>
  );
}
