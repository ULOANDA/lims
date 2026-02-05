import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { AnalysisResultStatusDb, AnalysisStatusDb } from "@/types/analysis";

type FormValue = {
  sampleId: string;
  parameterName: string | null;

  analysisStatus: AnalysisStatusDb;
  analysisResult: string | null;
  analysisResultStatus: AnalysisResultStatusDb | null;
  analysisCompletedAt: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  submitting: boolean;
  onSubmit: (v: FormValue) => void;
};

const STATUS_OPTIONS: AnalysisStatusDb[] = [
  "Pending",
  "Testing",
  "DataEntered",
  "TechReview",
  "Approved",
  "ReTest",
  "Cancelled",
];

const RESULT_STATUS_OPTIONS: AnalysisResultStatusDb[] = ["Pass", "Fail", "NotEvaluated"];

export function AnalysisCreateModal({ open, onClose, submitting, onSubmit }: Props) {
  const { t } = useTranslation();

  const initial = useMemo<FormValue>(() => {
    return {
      sampleId: "",
      parameterName: null,
      analysisStatus: "Pending",
      analysisResult: null,
      analysisResultStatus: null,
      analysisCompletedAt: null,
    };
  }, []);

  const [sampleId, setSampleId] = useState(initial.sampleId);
  const [parameterName, setParameterName] = useState<string>("");
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatusDb>(initial.analysisStatus);
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [analysisResultStatus, setAnalysisResultStatus] = useState<AnalysisResultStatusDb | "">("");
  const [analysisCompletedAt, setAnalysisCompletedAt] = useState<string>("");

  const canSubmit = sampleId.trim().length > 0;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <DialogPrimitive.Content className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-2xl mx-auto bg-card rounded-lg shadow-xl z-50 border border-border">
          <div className="p-6 border-b border-border flex items-start justify-between gap-4">
            <div>
              <DialogPrimitive.Title className="text-xl font-semibold text-foreground">
                {t("analyses.create.title")}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm text-muted-foreground mt-1">
                {t("analyses.create.description")}
              </DialogPrimitive.Description>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label={t("common.close")}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("analyses.fields.sampleId")}</Label>
              <Input
                value={sampleId}
                onChange={(e) => setSampleId(e.target.value)}
                className="bg-background"
                placeholder="SP26204001-006"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("analyses.fields.parameterName")}</Label>
              <Input
                value={parameterName}
                onChange={(e) => setParameterName(e.target.value)}
                className="bg-background"
                placeholder="Cadmi (Cd)"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("analyses.fields.analysisStatus")}</Label>
              <Select value={analysisStatus} onValueChange={(v) => setAnalysisStatus(v as AnalysisStatusDb)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("analyses.fields.analysisResultStatus")}</Label>
              <Select
                value={analysisResultStatus}
                onValueChange={(v) => setAnalysisResultStatus(v as AnalysisResultStatusDb | "")}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={t("common.select")} />
                </SelectTrigger>
                <SelectContent>
                  {RESULT_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>{t("analyses.fields.analysisResult")}</Label>
              <Textarea
                value={analysisResult}
                onChange={(e) => setAnalysisResult(e.target.value)}
                className="bg-background min-h-20"
                placeholder="0.60"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>{t("analyses.fields.analysisCompletedAt")}</Label>
              <Input
                value={analysisCompletedAt}
                onChange={(e) => setAnalysisCompletedAt(e.target.value)}
                className="bg-background"
                placeholder="2026-02-05T12:00:00.000Z"
              />
            </div>
          </div>

          <div className="p-6 border-t border-border flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={!canSubmit || submitting}
              onClick={() =>
                onSubmit({
                  sampleId: sampleId.trim(),
                  parameterName: parameterName.trim().length ? parameterName.trim() : null,
                  analysisStatus,
                  analysisResult: analysisResult.trim().length ? analysisResult.trim() : null,
                  analysisResultStatus: analysisResultStatus === "" ? null : analysisResultStatus,
                  analysisCompletedAt: analysisCompletedAt.trim().length ? analysisCompletedAt.trim() : null,
                })
              }
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {t("common.save")}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
