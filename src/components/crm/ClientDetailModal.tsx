import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import type { ClientDetail, ClientListItem } from "@/types/crm/client";

type Props = {
  open: boolean;
  onClose: () => void;
  data: ClientDetail | ClientListItem | null;
};

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground">{value ?? "-"}</div>
    </div>
  );
}

function toStr(v: unknown) {
    return typeof v === "string" ? v : v == null ? "" : String(v);
  }
  
  function getProp(obj: unknown, key: string): unknown {
    if (obj && typeof obj === "object") {
      const rec = obj as Record<string, unknown>;
      return rec[key];
    }
    return undefined;
  }
  
  function getStr(obj: unknown, key: string): string {
    return toStr(getProp(obj, key));
  }
export function ClientDetailModal({ open, onClose, data }: Props) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("crm.clients.detail.title")}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label={t("crm.clients.columns.clientId")}
            value={data?.clientId}
          />
          <Field
            label={t("crm.clients.columns.clientName")}
            value={data?.clientName}
          />
          <Field
            label={t("crm.clients.columns.legalId")}
            value={data?.legalId}
          />
          <Field
            label={t("crm.clients.columns.address")}
            value={data?.clientAddress}
          />
          <Field
            label={t("crm.clients.columns.phone")}
            value={getStr(data, "clientPhone") || "-"}
          />
          <Field
            label={t("crm.clients.columns.email")}
            value={getStr(data, "clientEmail") || "-"}
          />
          <Field
            label={t("crm.clients.columns.saleScope")}
            value={getStr(data, "clientSaleScope") || "-"}
          />
          <Field label={t("common.createdAt")} value={data?.createdAt} />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
