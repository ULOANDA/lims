import { useMemo } from "react";
import type { Matrix, Parameter, Protocol } from "@/types/library";

export type ParameterExt = Parameter & {
  parameterNameEn?: string;
  parameterGroup?: string;
};

export type ProtocolExt = Protocol & {
  protocolName?: string;
  protocolGroup?: string;
  executionTime?: string;
  description?: string;
  executionGuide?: string;
  equipment?: string[];
  chemicals?: string[];
};

type DisplayStyleResolved = {
  unit: string | null;
  decimal: number | null;
};

export type ParameterWithMatrices = ParameterExt & {
  matrices: Matrix[];
  parameterNameEnResolved: string;
  displayStyleResolved: { unit: string | null; decimal: number | null };
};


type Args = {
  searchTerm: string;
  selectedGroup: string;
  parameters: ParameterExt[] | unknown;
  protocols: ProtocolExt[] | unknown;
  matrices: Matrix[] | unknown;
};


function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function safeLower(v: unknown): string {
  return typeof v === "string" ? v.toLowerCase() : "";
}

function normalizeJoinKey(v: unknown): string {
  // ✅ để PAR-0875 và PAR0875 match nhau
  return typeof v === "string" ? v.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() : "";
}

function toFiniteNumberOrNull(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim().length) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function resolveDisplayStyle(ds: unknown): DisplayStyleResolved {
  const obj = (ds && typeof ds === "object") ? (ds as Record<string, unknown>) : undefined;

  const unit = typeof obj?.unit === "string" && obj.unit.trim().length ? obj.unit : null;

  const decimal =
    toFiniteNumberOrNull(obj?.decimal) ??
    toFiniteNumberOrNull(obj?.decimalPlaces) ??
    null;

  return { unit, decimal };
}

export function useLibraryData(args: Args) {
  const { searchTerm, parameters, protocols, matrices } = args;

  const safeParameters = useMemo(() => asArray<ParameterExt>(parameters), [parameters]);
  const safeProtocols = useMemo(() => asArray<ProtocolExt>(protocols), [protocols]);
  const safeMatrices = useMemo(() => asArray<Matrix>(matrices), [matrices]);

  // ✅ index matrices by normalized parameterId
  const matricesByParameterId = useMemo(() => {
    const map = new Map<string, Matrix[]>();
    for (const m of safeMatrices) {
      const key = normalizeJoinKey(m.parameterId);
      const cur = map.get(key);
      if (cur) cur.push(m);
      else map.set(key, [m]);
    }
    return map;
  }, [safeMatrices]);

  const detailedParameters: ParameterWithMatrices[] = useMemo(() => {
    const lower = searchTerm.trim().toLowerCase();

    return safeParameters
      .map((p) => {
        const joinKey = normalizeJoinKey(p.parameterId);
        const relatedMatrices = matricesByParameterId.get(joinKey) ?? [];

        const parameterNameEnResolved =
          p.parameterNameEn?.trim().length ? p.parameterNameEn : p.parameterName;

        const displayStyleResolved = resolveDisplayStyle(p.displayStyle);

        return {
          ...p,
          matrices: relatedMatrices,
          parameterNameEnResolved,
          displayStyleResolved,
        };
      })
      .filter((p) => {
        const matchesSearch =
          lower.length === 0 ||
          safeLower(p.parameterName).includes(lower) ||
          safeLower(p.parameterNameEnResolved).includes(lower) ||
          safeLower(p.technicianAlias).includes(lower) ||
          safeLower(p.displayStyleResolved.unit).includes(lower) ||
          (p.displayStyleResolved.decimal != null &&
            String(p.displayStyleResolved.decimal).includes(lower));

        return matchesSearch;
      });
  }, [matricesByParameterId, safeParameters, searchTerm]);

  const filteredProtocols = useMemo(() => {
    const lower = searchTerm.trim().toLowerCase();
    if (lower.length === 0) return safeProtocols;

    return safeProtocols.filter((protocol) => {
      const name = protocol.protocolName ?? "";
      return protocol.protocolCode.toLowerCase().includes(lower) || name.toLowerCase().includes(lower);
    });
  }, [safeProtocols, searchTerm]);

  return {
    detailedParameters,
    filteredProtocols,
  };
}
