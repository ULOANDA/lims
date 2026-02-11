import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Loader2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { libraryApi } from "@/api/library";
import type { Matrix } from "@/api/library";

import type { ParameterWithMatrices } from "../hooks/useLibraryData";
import { MatricesAccordionItem } from "./MatricesAccordionItem";

type Props = {
  selected: ParameterWithMatrices | null;
  onClose: () => void;
  onSelectProtocolId: (protocolId: string) => void;
};

type ScanState = {
  matrices: Matrix[];
  scannedPages: number;
  scannedItems: number;
  totalPages: number | null;
  totalItems: number | null;

  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function getNumber(r: Record<string, unknown> | null, key: string): number | null {
  const v = r?.[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function getTotalPages(meta: unknown): number | null {
  return getNumber(asRecord(meta), "totalPages");
}

function getTotalItems(meta: unknown): number | null {
  const r = asRecord(meta);
  const totalItems = getNumber(r, "totalItems");
  if (totalItems != null) return totalItems;
  return getNumber(r, "total");
}

const ITEMS_PER_PAGE = 200;
const MAX_PAGES_HARD = 1000;

export function ParameterDetailPanel(props: Props) {
  const { t } = useTranslation();
  const { selected, onClose, onSelectProtocolId } = props;

  const parameterId = selected?.parameterId ?? null;

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const scanTokenRef = useRef(0);

  const [state, setState] = useState<ScanState>({
    matrices: [],
    scannedPages: 0,
    scannedItems: 0,
    totalPages: null,
    totalItems: null,
    isLoading: false,
    isError: false,
    errorMessage: null,
  });

  useEffect(() => {
    setExpandedId(null);

    if (!parameterId) {
      setState((s) => ({ ...s, matrices: [] }));
      return;
    }

    const token = ++scanTokenRef.current;

    const run = async () => {
      setState({
        matrices: [],
        scannedPages: 0,
        scannedItems: 0,
        totalPages: null,
        totalItems: null,
        isLoading: true,
        isError: false,
        errorMessage: null,
      });

      try {
        let page = 1;
        let totalPagesLocal: number | null = null;
        let totalItemsLocal: number | null = null;

        const map = new Map<string, Matrix>();

        let scannedPages = 0;
        let scannedItems = 0;

        while (true) {
          if (scanTokenRef.current !== token) return;

          const res = await libraryApi.matrices.list({
            query: {
              page,
              itemsPerPage: ITEMS_PER_PAGE,
              parameterId,
              search: null,
            },
            sort: { column: "createdAt", direction: "DESC" as const },
          });

          if (!res.success) {
            throw new Error(res.error?.message ?? t("library.matrices.errors.loadFailed"));
          }

          totalPagesLocal = totalPagesLocal ?? getTotalPages(res.meta);
          totalItemsLocal = totalItemsLocal ?? getTotalItems(res.meta);

          const data = (res.data ?? []) as Matrix[];
          scannedPages += 1;
          scannedItems += data.length;

          for (const m of data) {
            if (m.parameterId !== parameterId) continue;

            const id = m.matrixId;
            if (!id) continue;

            if (!map.has(id)) map.set(id, m);
          }

          setState({
            matrices: Array.from(map.values()),
            scannedPages,
            scannedItems,
            totalPages: totalPagesLocal,
            totalItems: totalItemsLocal,
            isLoading: false,
            isError: false,
            errorMessage: null,
          });

          const exhausted = Boolean(totalPagesLocal && page >= totalPagesLocal);
          if (exhausted) break;

          page += 1;
          if (page > MAX_PAGES_HARD) {
            throw new Error(t("library.matrices.errors.loadFailed"));
          }
        }
      } catch (e) {
        if (scanTokenRef.current !== token) return;
        const msg = e instanceof Error ? e.message : t("library.matrices.errors.loadFailed");
        setState((s) => ({
          ...s,
          isLoading: false,
          isError: true,
          errorMessage: msg,
        }));
      }
    };

    void run();
  }, [parameterId, t]);

  const matrices = useMemo(() => state.matrices, [state.matrices]);

  if (!selected) return null;

  const unit = selected.displayStyleResolved.unit ?? t("common.noData");

  return (
    <div className="w-xl shrink-0 bg-background rounded-lg border border-border p-4 space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-lg font-semibold text-foreground">
            {selected.parameterName}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline">{selected.parameterId}</Badge>
            <Badge variant="outline">{unit}</Badge>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={onClose} type="button">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="text-sm font-medium text-foreground">
            {t("library.parameters.detail.matrices", { count: matrices.length })}
          </div>

          {state.isLoading ? (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t("common.loading")}
            </div>
          ) : null}
        </div>

        {state.isError ? (
          <div className="bg-background border border-border rounded-lg p-3 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">
                {t("common.errorTitle")}
              </div>
              <div className="text-sm text-muted-foreground">
                {state.errorMessage ?? t("library.matrices.errors.loadFailed")}
              </div>
            </div>
          </div>
        ) : null}

        {!state.isLoading && !state.isError ? (
          <>
            <div className="space-y-2">
              {matrices.map((m) => (
                <MatricesAccordionItem
                  key={m.matrixId}
                  matrix={m}
                  expanded={expandedId === m.matrixId}
                  onToggle={() =>
                    setExpandedId((cur) => (cur === m.matrixId ? null : m.matrixId))
                  }
                  onSelectProtocolId={onSelectProtocolId}
                />
              ))}
            </div>

            {matrices.length === 0 ? (
              <div className="text-sm text-muted-foreground">{t("common.noData")}</div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
