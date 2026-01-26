import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import type { ParameterGroup } from "@/api/library";

type Props = {
  items: ParameterGroup[];
};

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "VND" }).format(value);
}

export function ParameterGroupsTable(props: Props) {
  const { t, i18n } = useTranslation();
  const { items } = props;

  const locale = i18n.language;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              {t("library.parameterGroups.groupId")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              {t("library.parameterGroups.groupName")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              {t("library.parameterGroups.sampleType")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              {t("library.parameterGroups.matrixIds")}
            </th>

            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              {t("library.parameterGroups.feeBeforeTaxAndDiscount")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              {t("library.parameterGroups.feeBeforeTax")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              {t("library.parameterGroups.feeAfterTax")}
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {items.map((x) => {
            const matrixCount = x.matrixIds?.length ?? 0;
            const matrixPreview = (x.matrixIds ?? []).slice(0, 3);

            return (
              <tr key={x.groupId} className="hover:bg-muted/50">
                <td className="px-4 py-3 text-sm text-foreground font-medium">{x.groupId}</td>

                <td className="px-4 py-3 text-sm text-foreground">
                  <div className="font-medium">{x.groupName}</div>
                </td>

                <td className="px-4 py-3 text-sm text-foreground">
                  <div>{x.sampleTypeName ?? x.sampleTypeId}</div>
                  <div className="text-xs text-muted-foreground">{x.sampleTypeId}</div>
                </td>

                <td className="px-4 py-3 text-sm text-foreground">
                  <div className="flex items-center gap-2 flex-wrap">
                    {matrixPreview.map((id) => (
                      <Badge key={id} variant="outline">
                        {id}
                      </Badge>
                    ))}

                    {matrixCount > matrixPreview.length ? (
                      <span className="text-xs text-muted-foreground">
                        {t("library.parameterGroups.values.moreMatrices", {
                          count: matrixCount - matrixPreview.length,
                        })}
                      </span>
                    ) : null}
                  </div>
                </td>

                <td className="px-4 py-3 text-sm text-foreground text-left font-medium">
                  {formatCurrency(x.feeBeforeTaxAndDiscount, locale)}
                </td>

                <td className="px-4 py-3 text-sm text-foreground text-left font-medium">
                  {formatCurrency(x.feeBeforeTax, locale)}
                </td>

                <td className="px-4 py-3 text-sm text-foreground text-left font-semibold">
                  {formatCurrency(x.feeAfterTax, locale)}
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
