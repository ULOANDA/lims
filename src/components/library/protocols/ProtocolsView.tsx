import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";

import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useProtocolsList, useCreateProtocol, type Protocol } from "@/api/library";

import { LibraryHeader } from "../LibraryHeader";
import { useServerPagination } from "../hooks/useServerPagination";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

import { ProtocolsTable } from "./ProtocolsTable";
import { ProtocolDetailModal } from "./ProtocolDetailModal";

type CreateProtocolForm = {
  protocolCode: string;
  protocolSource: string;
  accreditationVilas: boolean;
  accreditationTdc: boolean;
};

function ProtocolsSkeleton() {
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

export function ProtocolsView() {
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const [selected, setSelected] = useState<Protocol | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateProtocolForm>({
    protocolCode: "",
    protocolSource: "",
    accreditationVilas: false,
    accreditationTdc: false,
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

  const protocolsQ = useProtocolsList(listInput);

  const pageItems = protocolsQ.data?.data ?? [];
  const totalItems = protocolsQ.data?.meta?.total ?? 0;
  const totalPages = protocolsQ.data?.meta?.totalPages ?? 1;

  useEffect(() => {
    setServerTotalPages(totalPages);
  }, [totalPages]);

  useEffect(() => {
    if (pagination.currentPage > totalPages) {
      pagination.handlePageChange(totalPages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const createP = useCreateProtocol();

  const openCreate = () => {
    setCreateForm({
      protocolCode: "",
      protocolSource: "",
      accreditationVilas: false,
      accreditationTdc: false,
    });
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    const code = createForm.protocolCode.trim();
    const source = createForm.protocolSource.trim();
    if (!code || !source) return;

    const hasAcc = createForm.accreditationVilas || createForm.accreditationTdc;

    await createP.mutateAsync({
      body: {
        protocolCode: code,
        protocolSource: source,
        protocolAccreditation: hasAcc
          ? {
              VILAS: createForm.accreditationVilas || undefined,
              TDC: createForm.accreditationTdc || undefined,
            }
          : undefined,
      },
    });

    setCreateOpen(false);
  };

  const isLoading = protocolsQ.isLoading;
  const isError = protocolsQ.isError;

  return (
    <div className="space-y-4">
      <LibraryHeader
        titleKey="library.protocols.title"
        subtitleKey="library.protocols.total"
        totalCount={totalItems}
        searchValue={searchTerm}
        onSearchChange={(v) => {
          setSearchTerm(v);
          pagination.resetPage();
        }}
        onAdd={openCreate}
        addLabelKey="library.protocols.actions.add"
        searchPlaceholderKey="library.protocols.searchPlaceholder"
      />

      {isLoading ? <ProtocolsSkeleton /> : null}

      {isError ? (
        <div className="bg-background border border-border rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <div className="text-sm font-medium text-foreground">
              {t("common.errorTitle")}
            </div>
            <div className="text-sm text-muted-foreground">
              {t("library.protocols.errors.loadFailed")}
            </div>
          </div>
        </div>
      ) : null}

      {!isLoading && !isError ? (
        <div className="bg-background rounded-lg border border-border overflow-hidden">
          <ProtocolsTable items={pageItems} onView={(p) => setSelected(p)} />

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

      {selected ? (
        <ProtocolDetailModal protocol={selected} onClose={() => setSelected(null)} />
      ) : null}

      {createOpen ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg border border-border w-full max-w-lg shadow-xl">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="text-base font-semibold text-foreground">
                {t("library.protocols.create.title")}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCreateOpen(false)}
                type="button"
              >
                {t("common.close")}
              </Button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">
                  {t("library.protocols.create.protocolCode")}
                </div>
                <Input
                  value={createForm.protocolCode}
                  onChange={(e) =>
                    setCreateForm((s) => ({
                      ...s,
                      protocolCode: e.target.value,
                    }))
                  }
                  placeholder={t("library.protocols.create.protocolCodePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">
                  {t("library.protocols.create.protocolSource")}
                </div>
                <Input
                  value={createForm.protocolSource}
                  onChange={(e) =>
                    setCreateForm((s) => ({
                      ...s,
                      protocolSource: e.target.value,
                    }))
                  }
                  placeholder={t("library.protocols.create.protocolSourcePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">
                  {t("library.protocols.create.protocolAccreditation.title")}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={createForm.accreditationVilas ? "default" : "outline"}
                    onClick={() =>
                      setCreateForm((s) => ({
                        ...s,
                        accreditationVilas: !s.accreditationVilas,
                      }))
                    }
                  >
                    {t("library.protocols.create.protocolAccreditation.vilas")}
                  </Button>

                  <Button
                    type="button"
                    variant={createForm.accreditationTdc ? "default" : "outline"}
                    onClick={() =>
                      setCreateForm((s) => ({
                        ...s,
                        accreditationTdc: !s.accreditationTdc,
                      }))
                    }
                  >
                    {t("library.protocols.create.protocolAccreditation.tdc")}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                  type="button"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={() => void submitCreate()}
                  disabled={
                    createP.isPending ||
                    !createForm.protocolCode.trim() ||
                    !createForm.protocolSource.trim()
                  }
                  type="button"
                >
                  {createP.isPending ? t("common.saving") : t("common.save")}
                </Button>
              </div>

              {createP.isError ? (
                <div className="text-sm text-destructive">
                  {t("library.protocols.create.error")}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
