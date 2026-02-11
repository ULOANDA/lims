import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Filter, X, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import type { ParameterWithMatrices } from "../hooks/useLibraryData";
import {
  useParametersFilter,
  type ParametersFilterFrom,
  type ParametersFilterOtherFilter,
} from "@/api/library";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

export type ParametersExcelFiltersState = {
  parameterId: string[];
  parameterName: string[];
  technicianAlias: string[];
  unit: string[];
};

type FilterKey = keyof ParametersExcelFiltersState;

type Props = {
  items: ParameterWithMatrices[];
  selectedId: string | null;
  onSelect: (p: ParameterWithMatrices) => void;

  matrixCounts: Record<string, number>;
  matrixCountsLoading?: boolean;

  excelFilters: ParametersExcelFiltersState;
  onExcelFiltersChange: (next: ParametersExcelFiltersState) => void;
};

type OptionWithCount<T extends string> = { value: T; count: number };

const FILTER_FROM_MAP: Record<FilterKey, ParametersFilterFrom> = {
  parameterId: "parameterId",
  parameterName: "parameterName",
  technicianAlias: "technicianAlias",
  unit: "unit",
};

function buildOtherFilters(
  filters: ParametersExcelFiltersState,
  excludeKey: FilterKey
): ParametersFilterOtherFilter[] {
  const out: ParametersFilterOtherFilter[] = [];

  (Object.keys(filters) as FilterKey[]).forEach((k) => {
    if (k === excludeKey) return;
    const v = filters[k];
    if (!Array.isArray(v) || v.length === 0) return;

    out.push({
      filterFrom: FILTER_FROM_MAP[k],
      filterValues: v,
    });
  });

  return out;
}

type ExcelFilterPopoverProps = {
  title: string;
  filterKey: FilterKey;
  activeCount: number;
  selected: string[];
  excelFilters: ParametersExcelFiltersState;
  onApply: (values: string[]) => void;
  onClear: () => void;
  limit?: number;
};

function ExcelFilterPopover(props: ExcelFilterPopoverProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  const [localSelected, setLocalSelected] = useState<string[]>(props.selected);

  const filterFrom = FILTER_FROM_MAP[props.filterKey];

  const input = useMemo(
    () => ({
      body: {
        filterFrom,
        textFilter: debouncedSearch.trim().length
          ? debouncedSearch.trim()
          : null,
        otherFilters: buildOtherFilters(props.excelFilters, props.filterKey),
        limit: props.limit ?? 200,
      },
    }),
    [
      filterFrom,
      debouncedSearch,
      props.excelFilters,
      props.filterKey,
      props.limit,
    ]
  );

  const q = useParametersFilter(input, { enabled: open });

  const options = useMemo((): OptionWithCount<string>[] => {
    const data = q.data ?? [];

    return data
      .map((x) => {
        const raw = x?.filterValue;
        const value =
          typeof raw === "string" ? raw : raw == null ? "" : String(raw);
        return { value, count: x.count };
      })
      .filter((x) => x.value.trim().length > 0)
      .sort((a, b) => a.value.localeCompare(b.value));
  }, [q.data]);

  const toggle = (v: string) => {
    setLocalSelected((cur) =>
      cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]
    );
  };

  const apply = () => {
    props.onApply(localSelected);
    setOpen(false);
  };

  const clear = () => {
    props.onClear();
    setLocalSelected([]);
    setSearch("");
    setOpen(false);
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setLocalSelected(props.selected);
      setSearch("");
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          aria-label={t("common.filter")}
          className="relative">
          <Filter className="h-4 w-4" />
          {props.activeCount > 0 ? (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72 p-0">
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <div className="text-sm font-medium text-foreground">
            {props.title}
          </div>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-3 space-y-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("common.search")}
            className="border border-border"
          />
        </div>

        <div className="border-t border-border">
          <Command shouldFilter={false}>
            <CommandList className="max-h-64">
              {q.isLoading ? (
                <div className="p-3 text-sm text-muted-foreground">
                  {t("common.loading")}
                </div>
              ) : q.isError ? (
                <div className="p-3 text-sm text-muted-foreground">
                  {t("common.toast.failed")}
                </div>
              ) : options.length === 0 ? (
                <CommandEmpty>{t("common.noData")}</CommandEmpty>
              ) : null}

              {!q.isLoading && !q.isError ? (
                <CommandGroup>
                  {options.map((o) => {
                    const checked = localSelected.includes(o.value);
                    return (
                      <CommandItem
                        key={`${filterFrom}::${o.value}`}
                        value={o.value}
                        onSelect={() => toggle(o.value)}
                        className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 min-w-0">
                          <span
                            className={[
                              "inline-flex h-4 w-4 min-w-4 flex-none shrink-0 items-center justify-center rounded-sm border border-border",
                              checked
                                ? "bg-primary text-primary-foreground"
                                : "bg-background",
                            ].join(" ")}>
                            {checked ? <Check className="h-3 w-3" /> : null}
                          </span>

                          <span className="text-sm text-foreground break-words whitespace-normal">
                            {o.value}
                          </span>
                        </div>

                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                          {o.count}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ) : null}
            </CommandList>
          </Command>

          <div className="p-3 border-t border-border flex items-center justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={clear}
              disabled={props.activeCount === 0}>
              {t("common.clear")}
            </Button>
            <Button type="button" onClick={apply}>
              {t("common.apply")}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ParametersTable(props: Props) {
  const { t } = useTranslation();
  const {
    items,
    selectedId,
    onSelect,
    matrixCounts,
    matrixCountsLoading,
    excelFilters,
    onExcelFiltersChange,
  } = props;

  const setStr = (key: FilterKey, values: string[]) => {
    onExcelFiltersChange({ ...excelFilters, [key]: values });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              <span className="inline-flex items-center gap-2">
                {t("library.parameters.parameterId")}
                <ExcelFilterPopover
                  title={t("library.parameters.parameterId")}
                  filterKey="parameterId"
                  activeCount={excelFilters.parameterId.length}
                  selected={excelFilters.parameterId}
                  excelFilters={excelFilters}
                  onApply={(v) => setStr("parameterId", v)}
                  onClear={() => setStr("parameterId", [])}
                />
              </span>
            </th>

            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              <span className="inline-flex items-center gap-2">
                {t("library.parameters.parameterName")}
                <ExcelFilterPopover
                  title={t("library.parameters.parameterName")}
                  filterKey="parameterName"
                  activeCount={excelFilters.parameterName.length}
                  selected={excelFilters.parameterName}
                  excelFilters={excelFilters}
                  onApply={(v) => setStr("parameterName", v)}
                  onClear={() => setStr("parameterName", [])}
                />
              </span>
            </th>

            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              <span className="inline-flex items-center gap-2">
                {t("library.parameters.technicianAlias")}
                <ExcelFilterPopover
                  title={t("library.parameters.technicianAlias")}
                  filterKey="technicianAlias"
                  activeCount={excelFilters.technicianAlias.length}
                  selected={excelFilters.technicianAlias}
                  excelFilters={excelFilters}
                  onApply={(v) => setStr("technicianAlias", v)}
                  onClear={() => setStr("technicianAlias", [])}
                />
              </span>
            </th>

            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              {t("library.parameters.columns.matrixCount")}
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {items.map((param) => {
            const active = selectedId === param.parameterId;
            const alias = param.technicianAlias?.trim().length
              ? param.technicianAlias
              : t("common.noData");
            const count = matrixCounts[param.parameterId] ?? 0;

            return (
              <tr
                key={param.parameterId}
                onClick={() => onSelect(param)}
                className={`hover:bg-muted/50 cursor-pointer ${
                  active ? "bg-muted" : ""
                }`}>
                <td className="px-4 py-3 text-sm text-foreground font-medium">
                  {param.parameterId}
                </td>

                <td className="px-4 py-3 text-sm text-foreground">
                  <div>{param.parameterName}</div>
                  <div className="text-xs text-muted-foreground">
                    {param.parameterNameEnResolved}
                  </div>
                </td>

                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {alias}
                </td>

                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {matrixCountsLoading ? "-" : count}
                </td>
              </tr>
            );
          })}
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
