import { useTranslation } from "react-i18next";
import type { SampleType } from "@/api/library";

import { renderInlineEm } from "@/utils/renderInlineEm";
import { pickLocalizedEng } from "@/utils/pickLocalized";

type Props = {
  items: SampleType[];
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export function SampleTypesTable(props: Props) {
  const { t, i18n } = useTranslation();
  const { items } = props;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              {t("library.sampleTypes.table.sampleTypeId")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              {t("library.sampleTypes.table.sampleTypeName")}
            </th>

            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              {t("library.sampleTypes.table.displayTypeStyle")}
            </th>

            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              {t("library.sampleTypes.table.createAt")}
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {items.map((x) => {
            const displayText = pickLocalizedEng(
              i18n,
              x.displayTypeStyle,
              x.sampleTypeName
            );

            return (
              <tr key={x.sampleTypeId} className="hover:bg-muted/50">
                <td className="px-4 py-3 text-sm text-foreground font-medium">
                  {x.sampleTypeId}
                </td>

                <td className="px-4 py-3 text-sm text-foreground">
                  {x.sampleTypeName}
                </td>

                <td className="px-4 py-3 text-sm text-foreground">
                  {displayText ? renderInlineEm(displayText) : t("common.none")}
                </td>

                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {formatDateTime(x.createdAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {items.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground">{t("common.noData")}</div>
      ) : null}
    </div>
  );
}
