import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { ParameterWithMatrices } from "../hooks/useLibraryData";
import { MatricesAccordionItem } from "./MatricesAccordionItem";

type Props = {
  selected: ParameterWithMatrices | null;
  onClose: () => void;
  onSelectProtocolCode: (protocolCode: string) => void;
};

export function ParameterDetailPanel(props: Props) {
  const { t } = useTranslation();
  const { selected, onClose, onSelectProtocolCode } = props;

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const matrices = useMemo(() => selected?.matrices ?? [], [selected]);

  if (!selected) return null;

  const unit = selected.displayStyleResolved.unit ?? t("common.noData");

  return (
    <div className="w-fit bg-background rounded-lg border border-border p-4 space-y-4">
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

      {/* matrices list giữ nguyên */}
      <div>
        <div className="text-sm font-medium text-foreground mb-2">
          {t("library.parameters.detail.matrices", {
            count: matrices.length,
          })}
        </div>

        <div className="space-y-2">
          {matrices.map((m) => (
            <MatricesAccordionItem
              key={m.matrixId}
              matrix={m}
              expanded={expandedId === m.matrixId}
              onToggle={() =>
                setExpandedId((cur) => (cur === m.matrixId ? null : m.matrixId))
              }
              onSelectProtocolCode={onSelectProtocolCode}
            />
          ))}
        </div>

        {matrices.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {t("common.noData")}
          </div>
        ) : null}
      </div>
    </div>
  );
}
