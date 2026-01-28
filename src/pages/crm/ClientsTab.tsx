import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";

import type { ClientListItem } from "@/types/crm/client";
import { crmKeys } from "@/api/crm/crmKeys";
import { clientsGetList } from "@/api/crm/clients";
import { ClientDetailModal } from "@/components/crm/ClientDetailModal";
import { ClientUpsertModal } from "@/components/crm/ClientUpsertModal";
import { ClientDeleteModal } from "@/components/crm/ClientDeleteModal";
import { RowActionIcons } from "@/components/crm/RowActionIcons";

type Props = {
  externalSearch: string;
};

export type ClientsTabHandle = {
  openCreate: () => void;
};

function CardSkeleton() {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-48 bg-muted rounded" />
        <div className="h-40 w-full bg-muted rounded" />
      </div>
    </div>
  );
}

export const ClientsTab = forwardRef<ClientsTabHandle, Props>(
  function ClientsTab(props, ref) {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const [createOpen, setCreateOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const [selected, setSelected] = useState<ClientListItem | null>(null);

    useImperativeHandle(ref, () => ({
      openCreate: () => setCreateOpen(true),
    }));

    const query = useMemo(
      () => ({
        page,
        itemsPerPage,
        search:
          props.externalSearch.trim().length > 0
            ? props.externalSearch.trim()
            : undefined,
      }),
      [page, itemsPerPage, props.externalSearch]
    );

    const q = useQuery({
      queryKey: crmKeys.clients.list(query),
      queryFn: async () => {
        const res = await clientsGetList({ query });
        return res as unknown as {
          data: ClientListItem[];
          pagination: { total: number; totalPages: number };
        };
      },
    });

    const items: ClientListItem[] = q.data?.data ?? [];
    const totalCount = q.data?.pagination?.total ?? items.length;
    const totalPages = q.data?.pagination?.totalPages ?? 1;

    if (q.isLoading) return <CardSkeleton />;

    if (q.isError) {
      const msg = q.error instanceof Error ? q.error.message : String(q.error);
      return (
        <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {msg}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* Modals */}
        <ClientDetailModal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          data={selected}
        />

        <ClientUpsertModal
          open={createOpen}
          mode="create"
          onClose={() => setCreateOpen(false)}
          onSubmit={async () => {
            toast.success(t("common.toast.saved"));
            await q.refetch();
          }}
        />

        {editOpen && selected ? (
          <ClientUpsertModal
            open={editOpen}
            mode="update"
            initial={selected}
            onClose={() => setEditOpen(false)}
            onSubmit={async () => {
              toast.success(t("common.toast.saved"));
              await q.refetch();
            }}
          />
        ) : null}

        <ClientDeleteModal
          open={deleteOpen}
          clientId={selected?.clientId ?? null}
          onClose={() => setDeleteOpen(false)}
          onConfirm={async () => {
            toast.success(t("common.toast.deleted"));
            await q.refetch();
          }}
        />

        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="text-sm">
            {t("common.count")}: {totalCount || items.length}
          </Badge>
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("crm.clients.columns.clientId")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("crm.clients.columns.clientName")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("crm.clients.columns.legalId")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("crm.clients.columns.address")}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("common.createdAt")}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {items.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-6 text-sm text-muted-foreground"
                      colSpan={6}>
                      {t("common.empty")}
                    </td>
                  </tr>
                ) : (
                  items.map((c) => (
                    <tr
                      key={c.clientId}
                      className="hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-foreground">
                          {c.clientId}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {c.clientSaleScope ?? "-"}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-medium text-foreground">
                          {c.clientName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {c.clientPhone ?? "-"} • {c.clientEmail ?? "-"}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-foreground">
                        {c.legalId ?? "-"}
                      </td>

                      <td className="px-4 py-4 text-sm text-foreground">
                        {c.clientAddress ?? "-"}
                      </td>

                      <td className="px-4 py-4 text-center text-sm text-foreground">
                        {c.createdAt}
                      </td>

                      <td className="px-4 py-4">
                        <RowActionIcons
                          onView={() => {
                            setSelected(c);
                            setDetailOpen(true);
                          }}
                          onEdit={() => {
                            setSelected(c);
                            setEditOpen(true);
                          }}
                          onDelete={() => {
                            setSelected(c);
                            setDeleteOpen(true);
                          }}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            totalPages={totalPages}
            currentPage={page}
            itemsPerPage={itemsPerPage}
            totalItems={totalCount}
            onPageChange={setPage}
            onItemsPerPageChange={(n) => {
              setPage(1);
              setItemsPerPage(n);
            }}
          />
        </div>
      </div>
    );
  }
);
