import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { ClientDetail, ClientListItem } from "@/types/crm/client";

type FormState = {
  clientId: string;
  clientName: string;
  legalId: string;
  clientAddress: string;
  clientPhone: string;
  clientEmail: string;
  clientSaleScope: string;
};

type Props = {
    open: boolean;
    mode: "create" | "update";
    initial?: ClientDetail | ClientListItem | null;
    onClose: () => void;
    onSubmit?: (values: FormState) => Promise<void> | void;
  };

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

export function ClientUpsertModal({ open, mode, initial, onClose, onSubmit }: Props) {
  const { t } = useTranslation();

  const initialForm = useMemo<FormState>(
    () => ({
      clientId: getStr(initial, "clientId"),
      clientName: getStr(initial, "clientName"),
      legalId: getStr(initial, "legalId"),
      clientAddress: getStr(initial, "clientAddress"),
      clientPhone: getStr(initial, "clientPhone"),
      clientEmail: getStr(initial, "clientEmail"),
      clientSaleScope: getStr(initial, "clientSaleScope"),
    }),
    [initial],
  );
  

  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setForm(initialForm);
  }, [open, initialForm]);

  if (!open) return null;

  const title =
    mode === "create" ? t("crm.clients.create.title") : t("crm.clients.update.title");

  const submit = async () => {
    try {
      setSubmitting(true);
      await onSubmit?.(form);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">{t("crm.clients.columns.clientId")}</div>
            <Input
              value={form.clientId}
              onChange={(e) => setForm((s) => ({ ...s, clientId: e.target.value }))}
              disabled={mode === "update"}
              placeholder={t("crm.clients.placeholders.clientId")}
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">{t("crm.clients.columns.clientName")}</div>
            <Input
              value={form.clientName}
              onChange={(e) => setForm((s) => ({ ...s, clientName: e.target.value }))}
              placeholder={t("crm.clients.placeholders.clientName")}
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">{t("crm.clients.columns.legalId")}</div>
            <Input
              value={form.legalId}
              onChange={(e) => setForm((s) => ({ ...s, legalId: e.target.value }))}
              placeholder={t("crm.clients.placeholders.legalId")}
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">{t("crm.clients.columns.address")}</div>
            <Input
              value={form.clientAddress}
              onChange={(e) => setForm((s) => ({ ...s, clientAddress: e.target.value }))}
              placeholder={t("crm.clients.placeholders.address")}
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">{t("crm.clients.columns.phone")}</div>
            <Input
              value={form.clientPhone}
              onChange={(e) => setForm((s) => ({ ...s, clientPhone: e.target.value }))}
              placeholder={t("crm.clients.placeholders.phone")}
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">{t("crm.clients.columns.email")}</div>
            <Input
              value={form.clientEmail}
              onChange={(e) => setForm((s) => ({ ...s, clientEmail: e.target.value }))}
              placeholder={t("crm.clients.placeholders.email")}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <div className="text-xs text-muted-foreground">{t("crm.clients.columns.saleScope")}</div>
            <Input
              value={form.clientSaleScope}
              onChange={(e) => setForm((s) => ({ ...s, clientSaleScope: e.target.value }))}
              placeholder={t("crm.clients.placeholders.saleScope")}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={submit} disabled={submitting}>
            {mode === "create" ? t("common.actions.create") : t("common.actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
