// src/components/library/hooks/useServerPagination.ts
import { useMemo, useState } from "react";

export function useServerPagination(
  serverTotalPages: number | null | undefined,
  initialItemsPerPage = 10
) {
  const [page, setPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(initialItemsPerPage);

  const clampMax = useMemo(() => {
    if (typeof serverTotalPages !== "number" || !Number.isFinite(serverTotalPages)) {
      return Number.MAX_SAFE_INTEGER;
    }
    return Math.max(1, serverTotalPages);
  }, [serverTotalPages]);

  const currentPage = useMemo(() => {
    return Math.min(Math.max(1, page), clampMax);
  }, [page, clampMax]);

  const handlePageChange = (nextPage: number) => {
    const safe = Math.min(Math.max(1, nextPage), clampMax);
    setPage(safe);
  };

  const handleItemsPerPageChange = (nextItemsPerPage: number) => {
    const safe = Math.max(1, nextItemsPerPage);
    setItemsPerPage(safe);
    setPage(1);
  };

  const resetPage = () => setPage(1);

  return {
    currentPage,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
    resetPage,
  };
}
