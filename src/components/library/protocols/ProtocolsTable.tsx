import { useTranslation } from "react-i18next";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import type { Protocol } from "@/api/library";

type Props = {
  items: Protocol[];
  onView: (p: Protocol) => void;
};

export function ProtocolsTable(props: Props) {
  const { t } = useTranslation();
  const { items, onView } = props;

  function formatDdMmYyyy(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;

    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = String(d.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max">
        <thead className="bg-muted/50 border-b border-border">
          <tr className="">
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              {t("library.protocols.protocolCode")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              {t("library.protocols.protocolSource")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              {t("library.protocols.protocolAccreditation.title")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              {t("library.protocols.protocolCreateAt")}
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
              {t("library.protocols.columns.actions")}
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {items.map((p) => (
            <tr key={p.protocolId} className="hover:bg-muted/50">
              <td className="px-4 py-3 text-sm text-foreground font-medium">
                {p.protocolCode}
              </td>
              <td className="px-4 py-3 text-sm text-foreground">
                {p.protocolSource}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {p.protocolAccreditation?.VILAS ? (
                    <Badge variant="secondary" className="text-xs">
                      {t("library.protocols.protocolAccreditation.vilas")}
                    </Badge>
                  ) : null}

                  {p.protocolAccreditation?.TDC ? (
                    <Badge variant="secondary" className="text-xs">
                      {t("library.protocols.protocolAccreditation.tdc")}
                    </Badge>
                  ) : null}

                  {!p.protocolAccreditation?.VILAS &&
                  !p.protocolAccreditation?.TDC ? (
                    <Badge variant="outline" className="text-xs">
                      {t("common.noData")}
                    </Badge>
                  ) : null}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {formatDdMmYyyy(p.createdAt)}
              </td>

              <td className="px-4 py-3">
                <div className="flex items-center justify-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => onView(p)}
                    type="button"
                    title={t("common.view")}>
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {items.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground">
          {t("common.noData")}
        </div>
      ) : null}
    </div>
  );
}
