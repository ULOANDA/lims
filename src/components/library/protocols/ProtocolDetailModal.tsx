import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { Protocol } from "@/api/library";

type Props = {
  protocol: Protocol;
  onClose: () => void;
};

export function ProtocolDetailModal(props: Props) {
  const { t } = useTranslation();
  const { protocol, onClose } = props;

  function formatDdMmYyyy(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
  
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = String(d.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
  }
  

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-2xl w-full max-h-max overflow-y-auto shadow-xl border border-border">
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {t("library.protocols.detail.generalInfo")}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {protocol.protocolCode}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            type="button">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">
                {t("library.protocols.protocolCode")}
              </div>
              <div className="text-sm text-foreground font-medium mt-1">
                {protocol.protocolCode}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">
                {t("library.protocols.protocolSource")}
              </div>
              <div className="text-sm text-foreground font-medium mt-1">
                {protocol.protocolSource}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">
                {t("library.protocols.protocolCreateAt")}
              </div>
              <div className="text-sm text-foreground font-medium mt-1">
              {formatDdMmYyyy(protocol.createdAt)}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">
                {t("library.protocols.protocolAccreditation.title")}
              </div>
              <div className="mt-1 flex flex-wrap gap-2">
                {protocol.protocolAccreditation?.VILAS ? (
                  <Badge variant="secondary">
                    {t("library.protocols.protocolAccreditation.vilas")}
                  </Badge>
                ) : null}

                {protocol.protocolAccreditation?.TDC ? (
                  <Badge variant="secondary">
                    {t("library.protocols.protocolAccreditation.tdc")}
                  </Badge>
                ) : null}

                {!protocol.protocolAccreditation?.VILAS &&
                !protocol.protocolAccreditation?.TDC ? (
                  <Badge variant="outline">{t("common.noData")}</Badge>
                ) : null}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border flex justify-end">
            <Button variant="outline" onClick={onClose} type="button">
              {t("common.close")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
