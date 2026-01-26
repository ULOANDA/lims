import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages?: number;
  itemsPerPage?: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;

export function Pagination({
  currentPage,
  totalPages = 1,
  itemsPerPage = 10,
  totalItems = 0,
  onPageChange,
  onItemsPerPageChange,
}: PaginationProps) {
  const { t } = useTranslation();

  const hasItems = totalItems > 0;

  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  const startItem = hasItems ? (safeCurrentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = hasItems ? Math.min(safeCurrentPage * itemsPerPage, totalItems) : 0;

  const canGoPrev = safeCurrentPage > 1;
  const canGoNext = safeCurrentPage < safeTotalPages;

  const handleItemsPerPageChange = (next: number) => {
    onItemsPerPageChange?.(next);
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card">
      {/* Items per page selector */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t("common.pagination.itemsPerPagePrefix")}</span>

        <select
          value={itemsPerPage}
          onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
          className="border border-input rounded px-2 py-1 text-sm bg-background text-foreground"
          aria-label={t("common.pagination.itemsPerPageAria")}
        >
          {ITEMS_PER_PAGE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <span className="text-muted-foreground">{t("common.pagination.itemsPerPageSuffix")}</span>
      </div>

      {/* Page info and navigation */}
      <div className="flex items-center gap-6">
        <div className="text-sm text-muted-foreground">
          {t("common.pagination.range", {
            start: startItem,
            end: endItem,
            total: totalItems,
          })}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={!canGoPrev}
            className="h-8 w-8 p-0"
            aria-label={t("common.pagination.firstPage")}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(safeCurrentPage - 1)}
            disabled={!canGoPrev}
            className="h-8 w-8 p-0"
            aria-label={t("common.pagination.prevPage")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1 mx-2">
            {Array.from({ length: Math.min(5, safeTotalPages) }, (_, i) => {
              let pageNum: number;

              if (safeTotalPages <= 5) pageNum = i + 1;
              else if (safeCurrentPage <= 3) pageNum = i + 1;
              else if (safeCurrentPage >= safeTotalPages - 2) pageNum = safeTotalPages - 4 + i;
              else pageNum = safeCurrentPage - 2 + i;

              return (
                <Button
                  key={pageNum}
                  variant={safeCurrentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className="h-8 w-8 p-0"
                  aria-label={t("common.pagination.page", { page: pageNum })}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(safeCurrentPage + 1)}
            disabled={!canGoNext}
            className="h-8 w-8 p-0"
            aria-label={t("common.pagination.nextPage")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(safeTotalPages)}
            disabled={!canGoNext}
            className="h-8 w-8 p-0"
            aria-label={t("common.pagination.lastPage")}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
