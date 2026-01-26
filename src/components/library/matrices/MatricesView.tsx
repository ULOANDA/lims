// src/components/library/matrices/MatricesView.tsx
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";

import { Pagination } from "@/components/ui/pagination";
import { useMatricesList, type Matrix } from "@/api/library";

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

export function MatricesView() {
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const matricesQ = useMatricesList(listInput);

  const pageItems = (matricesQ.data?.data ?? []) as Matrix[];
  const totalItems = matricesQ.data?.meta?.total ?? 0;
  const totalPages = matricesQ.data?.meta?.totalPages ?? 1;

  useEffect(() => {
    setServerTotalPages(totalPages);
  }, [totalPages]);

  useEffect(() => {
    if (pagination.currentPage > totalPages) {
      pagination.handlePageChange(totalPages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

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

  const isLoading = matricesQ.isLoading;
  const isError = matricesQ.isError;

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
            <div className="text-sm font-medium text-foreground">
              {t("common.errorTitle")}
            </div>
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
            selectedId={selectedId}
            onSelect={setSelectedId}
            onOpenDetail={(id) => {
              setSelectedId(id);
              setDetailOpen(true);
            }}
            onOpenEdit={(id) => {
              setSelectedId(id);
              setEditOpen(true);
            }}
            onOpenDelete={(id) => {
              setSelectedId(id);
              setDetailOpen(false);
              setEditOpen(false);
              setDeleteOpen(true);
            }}
          />

          <MatricesDetailModal
            open={detailOpen}
            matrixId={detailOpen ? selectedId : null}
            onClose={() => setDetailOpen(false)}
          />

          <MatricesEditModal
            open={editOpen}
            matrixId={editOpen ? selectedId : null}
            onClose={() => setEditOpen(false)}
          />

          <MatricesDeleteConfirm
            open={deleteOpen}
            matrixId={selectedId}
            onClose={() => setDeleteOpen(false)}
            onDeleted={(id) => {
              setSelectedId((cur) => (cur === id ? null : cur));
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
