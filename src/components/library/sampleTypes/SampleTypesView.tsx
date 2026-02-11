import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";

import { Pagination } from "@/components/ui/pagination";
import { useSampleTypesAll, type SampleType } from "@/api/library";

import { LibraryHeader } from "../LibraryHeader";
import { useServerPagination } from "../hooks/useServerPagination";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

import {
  SampleTypesTable,
  type SampleTypesExcelFiltersState,
} from "./SampleTypesTable";
import { SampleTypeCreateModal } from "./SampleTypeCreateModal";

function Skeleton() {
  return (
    <div className="bg-background border border-border rounded-lg p-4">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-40 bg-muted rounded" />
        <div className="h-9 w-full bg-muted rounded" />
        <div className="h-40 w-full bg-muted rounded" />
      </div>
    </div>
  );
}

function createEmptyFilters(): SampleTypesExcelFiltersState {
  return {
    sampleTypeId: [],
    sampleTypeName: [],
    displayTypeStyle: [],
  };
}

function pickDisplayLabel(
  lang: string,
  displayTypeStyle: SampleType["displayTypeStyle"],
  fallback: string
): string {
  const l = (lang || "vi").toLowerCase();
  const en = displayTypeStyle && typeof displayTypeStyle === "object"
    ? (displayTypeStyle as Record<string, unknown>).en
    : undefined;
  const vi = displayTypeStyle && typeof displayTypeStyle === "object"
    ? (displayTypeStyle as Record<string, unknown>).vi
    : undefined;

  const enS = typeof en === "string" ? en : "";
  const viS = typeof vi === "string" ? vi : "";

  if (l.startsWith("vi")) return viS || enS || fallback;
  return enS || viS || fallback;
}

function applyLocalFilters(
  items: SampleType[],
  f: SampleTypesExcelFiltersState,
  lang: string
) {
  const matchStr = (value: string, selected: string[]) =>
    selected.length ? selected.includes(value) : true;

  return items.filter((x) => {
    const id = x.sampleTypeId ?? "";
    const name = x.sampleTypeName ?? "";
    const display = pickDisplayLabel(lang, x.displayTypeStyle, x.sampleTypeName ?? "");

    return (
      matchStr(id, f.sampleTypeId) &&
      matchStr(name, f.sampleTypeName) &&
      matchStr(display, f.displayTypeStyle)
    );
  });
}

export function SampleTypesView() {
  const { t, i18n } = useTranslation();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const [createOpen, setCreateOpen] = useState(false);

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

  const allQ = useSampleTypesAll(allInput);

  const allItems = useMemo(() => {
    return (allQ.data?.data ?? []) as SampleType[];
  }, [allQ.data]);

  const [excelFilters, setExcelFilters] = useState<SampleTypesExcelFiltersState>(() =>
    createEmptyFilters()
  );

  const filteredAll = useMemo(
    () => applyLocalFilters(allItems, excelFilters, i18n.language),
    [allItems, excelFilters, i18n.language]
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

  const onExcelFiltersChange = (next: SampleTypesExcelFiltersState) => {
    setExcelFilters(next);
    pagination.resetPage();
  };

  const isLoading = allQ.isLoading;
  const isError = allQ.isError;

  return (
    <div className="space-y-4">
      <LibraryHeader
        titleKey="library.sampleTypes.title"
        subtitleKey="library.sampleTypes.total"
        totalCount={totalItems}
        searchValue={searchTerm}
        onSearchChange={(v) => {
          setSearchTerm(v);
          pagination.resetPage();
        }}
        onAdd={() => setCreateOpen(true)}
        addLabelKey="library.sampleTypes.actions.add"
        searchPlaceholderKey="library.sampleTypes.searchPlaceholder"
      />

      {isLoading ? <Skeleton /> : null}

      {isError ? (
        <div className="bg-background border border-border rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <div className="text-sm font-medium text-foreground">
              {t("common.errorTitle")}
            </div>
            <div className="text-sm text-muted-foreground">
              {t("library.sampleTypes.errors.loadFailed")}
            </div>
          </div>
        </div>
      ) : null}

      {!isLoading && !isError ? (
        <div className="bg-background rounded-lg border border-border overflow-hidden">
          <SampleTypesTable
            items={pageItems}
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
      ) : null}

      {createOpen ? <SampleTypeCreateModal onClose={() => setCreateOpen(false)} /> : null}
    </div>
  );
}
