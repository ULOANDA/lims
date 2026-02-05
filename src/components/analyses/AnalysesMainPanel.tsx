import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Plus, Pencil, Trash2, Filter } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";

import {
  analysesCreate,
  analysesDelete,
  analysesGetList,
  analysesUpdate,
} from "@/api/analyses";
import { analysesKeys } from "@/api/analysesKeys";

import type {
  AnalysisListItem,
  AnalysisResultStatusDb,
  AnalysisStatusDb,
} from "@/types/analysis";

import { AnalysisCreateModal } from "./AnalysisCreateModal";
import { AnalysisUpdateModal } from "./AnalysisUpdateModal";
import { AnalysisDeleteModal } from "./AnalysisDeleteModal";

type Row = AnalysisListItem;

export function AnalysesMainPanel() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");

  const [createOpen, setCreateOpen] = useState(false);

  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateTarget, setUpdateTarget] = useState<Row | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);

  const [refreshTick, setRefreshTick] = useState(0);

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [loadingList, setLoadingList] = useState(false);
  const [errorList, setErrorList] = useState<string | null>(null);

  const [list, setList] = useState<Row[]>([]);
  const [meta, setMeta] = useState<{ totalPages: number; total: number } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoadingList(true);
      setErrorList(null);

      const res = await analysesGetList({
        query: { page, itemsPerPage },
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
      setList(Array.isArray(data) ? data : []);

      const m = res.meta ?? null;

      const totalPages =
        typeof m?.totalPages === "number" && Number.isFinite(m.totalPages)
          ? m.totalPages
          : 1;

      const total =
        typeof m?.total === "number" && Number.isFinite(m.total)
          ? m.total
          : data.length;

      setMeta({ totalPages, total });
      setLoadingList(false);
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [page, itemsPerPage, refreshTick, t]);

  const rows = list;

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((r) => {
      const sampleId = (r.sampleId ?? "").toLowerCase();
      const analysisId = (r.analysisId ?? "").toLowerCase();
      const param = (r.parameterName ?? "").toLowerCase();
      return (
        sampleId.includes(term) || analysisId.includes(term) || param.includes(term)
      );
    });
  }, [rows, searchTerm]);

  // metrics (trên page hiện tại)
  const pendingCount = rows.filter((r) => String(r.analysisStatus) === "Pending")
    .length;
  const assignedCount = rows.filter((r) => String(r.analysisStatus) === "Assigned")
    .length;

  const mCreate = useMutation({
    mutationFn: analysesCreate,
    onSuccess: async (res) => {
      if (!res.success) {
        toast.error(res.error?.message ?? t("common.toast.failed"));
        return;
      }
      toast.success(t("common.toast.success"));
      setCreateOpen(false);
      setPage(1);
      setRefreshTick((x) => x + 1);
      await qc.invalidateQueries({ queryKey: analysesKeys.lists() });
    },
    onError: () => toast.error(t("common.toast.failed")),
  });

  const mUpdate = useMutation({
    mutationFn: analysesUpdate,
    onSuccess: async (res) => {
      if (!res.success) {
        toast.error(res.error?.message ?? t("common.toast.failed"));
        return;
      }
      toast.success(t("common.toast.success"));
      setUpdateOpen(false);
      setUpdateTarget(null);
      setRefreshTick((x) => x + 1);
      await qc.invalidateQueries({ queryKey: analysesKeys.lists() });
    },
    onError: () => toast.error(t("common.toast.failed")),
  });

  const mDelete = useMutation({
    mutationFn: analysesDelete,
    onSuccess: async (res) => {
      if (!res.success) {
        toast.error(res.error?.message ?? t("common.toast.failed"));
        return;
      }
      toast.success(t("common.toast.success"));
      setDeleteOpen(false);
      setDeleteTarget(null);
      setRefreshTick((x) => x + 1);
      await qc.invalidateQueries({ queryKey: analysesKeys.lists() });
    },
    onError: () => toast.error(t("common.toast.failed")),
  });

  const totalAnalyses = meta?.total ?? rows.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-sm text-muted-foreground">
            {t("analyses.page.metrics.total")}
          </div>
          <div className="text-3xl font-semibold mt-1 text-foreground">
            {totalAnalyses}
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-sm text-muted-foreground">
            {t("analyses.page.metrics.pending")}
          </div>
          <div className="text-3xl font-semibold mt-1 text-foreground">
            {pendingCount}
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-sm text-muted-foreground">
            {t("analyses.page.metrics.assigned")}
          </div>
          <div className="text-3xl font-semibold mt-1 text-foreground">
            {assignedCount}
          </div>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("analyses.page.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-10 bg-background"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t("analyses.page.filter")}
            </Button>

            <Button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t("analyses.page.create")}
            </Button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loadingList && (
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-56 bg-muted rounded" />
            <div className="h-24 w-full bg-muted rounded" />
            <div className="h-40 w-full bg-muted rounded" />
          </div>
        </div>
      )}

      {/* Error */}
      {!loadingList && errorList && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">{errorList}</div>
        </div>
      )}

      {/* Table */}
      {!loadingList && !errorList && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    {t("analyses.page.table.analysisId")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    {t("analyses.page.table.sampleId")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    {t("analyses.page.table.parameterName")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    {t("analyses.page.table.status")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    {t("analyses.page.table.resultStatus")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    {t("analyses.page.table.createdAt")}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filtered.map((r) => (
                  <tr
                    key={r.analysisId}
                    className="hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-foreground">
                      {r.analysisId}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {r.sampleId}
                    </td>

                    <td className="px-4 py-3 text-sm text-foreground">
                      {r.parameterName ?? (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className="text-xs border-border text-foreground"
                      >
                        {String(r.analysisStatus)}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">
                      {r.analysisResultStatus ? (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-muted text-foreground"
                        >
                          {String(r.analysisResultStatus)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {r.createdAt}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setUpdateTarget(r);
                            setUpdateOpen(true);
                          }}
                          aria-label={t("common.edit")}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeleteTarget(r);
                            setDeleteOpen(true);
                          }}
                          aria-label={t("common.delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      {t("common.noData")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <Pagination
            totalPages={meta?.totalPages ?? 1}
            currentPage={page}
            itemsPerPage={itemsPerPage}
            totalItems={meta?.total ?? list.length}
            onPageChange={(p) => setPage(p)}
            onItemsPerPageChange={(n) => {
              setItemsPerPage(n);
              setPage(1);
            }}
          />
        </div>
      )}

      {/* ===== Modals live inside MainPanel ===== */}

      <AnalysisCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        submitting={mCreate.isPending}
        onSubmit={(v) => {
          mCreate.mutate({
            body: {
              sampleId: v.sampleId,
              parameterName: v.parameterName,
              analysisStatus: v.analysisStatus as AnalysisStatusDb,
              analysisResultStatus: (v.analysisResultStatus ??
                null) as AnalysisResultStatusDb | null,
              analysisResult: v.analysisResult,
              analysisCompletedAt: v.analysisCompletedAt,
            },
          });
        }}
      />

      <AnalysisUpdateModal
        open={updateOpen}
        onClose={() => {
          setUpdateOpen(false);
          setUpdateTarget(null);
        }}
        submitting={mUpdate.isPending}
        target={updateTarget}
        onSubmit={(v) => {
          if (!updateTarget) return;
          mUpdate.mutate({
            body: {
              analysisId: updateTarget.analysisId,
              analysisStatus: v.analysisStatus as AnalysisStatusDb,
              analysisResult: v.analysisResult,
              analysisResultStatus: (v.analysisResultStatus ??
                null) as AnalysisResultStatusDb | null,
              analysisCompletedAt: v.analysisCompletedAt,
            },
          });
        }}
      />

      <AnalysisDeleteModal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteTarget(null);
        }}
        submitting={mDelete.isPending}
        target={deleteTarget}
        onConfirm={() => {
          if (!deleteTarget) return;
          mDelete.mutate({ body: { analysisId: deleteTarget.analysisId } });
        }}
      />
    </div>
  );
}
