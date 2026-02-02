import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  Edit,
  Save,
  Upload,
  FileText,
  Printer,
  FileCheck,
  Mail,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

import type { ApiResponse } from "@/api/client";
import { receiptsUpdate } from "@/api/receipts";
import { receiptsKeys } from "@/api/receiptsKeys";

import type {
  ReceiptDetail,
  ReceiptSample,
  ReceiptAnalysis,
  ReceiptsUpdateBody,
} from "@/types/receipt";

interface ReceiptDetailModalProps {
  receipt: ReceiptDetail;
  onClose: () => void;
  onSampleClick: (sample: ReceiptSample) => void;

  onUpdated?: (next: ReceiptDetail) => void;
}

type SampleImage = {
  id: string;
  url: string;
  caption?: string;
  uploadedDate: string;
};

const RECEIPT_STATUS_OPTIONS: ReceiptDetail["receiptStatus"][] = [
  "Pending",
  "Processing",
  "Done",
  "Cancelled",
];

function unwrapApi<T>(res: ApiResponse<T>): T {
  if (!res.success) throw new Error(res.error?.message ?? "Request failed");
  if (res.data === undefined) throw new Error("Response data is missing");
  return res.data;
}

function getErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message.trim().length > 0) return e.message;
  return fallback;
}

function getAnalysisStatusBadge(
  t: (key: string, options?: Record<string, unknown>) => unknown,
  status: ReceiptAnalysis["analysisStatus"],
) {
  switch (status) {
    case "Pending":
      return (
        <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
          {String(t("lab.analyses.status.Pending"))}
        </Badge>
      );
    case "Testing":
      return (
        <Badge variant="default" className="text-xs">
          {String(t("lab.analyses.status.Testing"))}
        </Badge>
      );
    case "Approved":
      return (
        <Badge variant="default" className="text-xs">
          {String(t("lab.analyses.status.Approved"))}
        </Badge>
      );
    case "Review":
      return (
        <Badge variant="default" className="text-xs">
          {String(t("lab.analyses.status.Review"))}
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="text-xs">
          {String(status ?? "")}
        </Badge>
      );
  }
}

export function ReceiptDetailModal({
  receipt,
  onClose,
  onSampleClick,
  onUpdated,
}: ReceiptDetailModalProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editedReceipt, setEditedReceipt] = useState<ReceiptDetail>(receipt);

  useEffect(() => {
    setEditedReceipt(receipt);
    setIsEditing(false);
  }, [receipt]);

  const [showEmailModal, setShowEmailModal] = useState(false);

  const [sampleImages] = useState<SampleImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const samples = receipt.samples ?? [];

  const getAnalysesForSample = (sample: ReceiptSample): ReceiptAnalysis[] => {
    return (sample.analyses ?? []).filter((a) => Boolean(a?.analysisId));
  };

  const emailDefaults = useMemo(() => {
    const toEmail = receipt.client?.clientEmail ?? receipt.reportRecipient?.receiverEmail ?? "";

    return {
      from: String(t("reception.receiptDetail.emailTemplate.from", { defaultValue: "" })),
      to: toEmail,
      subject: String(
        t("reception.receiptDetail.emailTemplate.subject", { code: receipt.receiptCode }),
      ),
      content: String(
        t("reception.receiptDetail.emailTemplate.content", {
          clientName: receipt.client?.clientName ?? "",
          receiptCode: receipt.receiptCode ?? "",
          receiptDate: receipt.receiptDate?.split("T")[0] ?? "",
          deadline: receipt.receiptDeadline?.split("T")[0] ?? "",
        }),
      ),
      attachments: [] as string[],
    };
  }, [receipt, t]);

  const [emailForm, setEmailForm] = useState(emailDefaults);

  useEffect(() => {
    setEmailForm(emailDefaults);
  }, [emailDefaults]);

  const updateMut = useMutation({
    mutationFn: (body: ReceiptsUpdateBody) => receiptsUpdate({ body }),
    onSuccess: async (res) => {
      const next = unwrapApi(res);

      setEditedReceipt(next);
      onUpdated?.(next);
      await Promise.all([
        qc.invalidateQueries({ queryKey: receiptsKeys.list(undefined) }),
        qc.invalidateQueries({ queryKey: receiptsKeys.detail(receipt.receiptId) }),
        qc.invalidateQueries({ queryKey: receiptsKeys.full(receipt.receiptId) }),
      ]);

      toast.success(String(t("common.saved")));
      setIsEditing(false);
    },
    onError: (e) => {
      toast.error(getErrorMessage(e, String(t("common.error"))));
    },
  });

  const handleSave = async () => {
    const body: ReceiptsUpdateBody = {
      receiptId: editedReceipt.receiptId,

      receiptStatus: editedReceipt.receiptStatus ?? null,

      receiptDeadline: editedReceipt.receiptDeadline ?? null,
      receiptNote: editedReceipt.receiptNote ?? null,
      client: editedReceipt.client
        ? {
            clientId: editedReceipt.client.clientId ?? null,
            clientName: editedReceipt.client.clientName ?? null,
          }
        : null,
    };

    await updateMut.mutateAsync(body);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? sampleImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === sampleImages.length - 1 ? 0 : prev + 1));
  };

  const handleEmailChange = (field: "from" | "to" | "subject" | "content", value: string) => {
    setEmailForm((p) => ({ ...p, [field]: value }));
  };

  const handleSendEmail = () => {
    // eslint-disable-next-line no-console
    console.log("Sending email:", emailForm);
    setShowEmailModal(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-foreground/50 z-50" onClick={onClose} />

      <div className="fixed inset-4 bg-background rounded-lg shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {String(t("reception.receiptDetail.title", { code: receipt.receiptCode }))}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {String(t("reception.receiptDetail.description"))}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => console.log("Print label")}
              variant="outline"
              className="flex items-center gap-1.5 text-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              {String(t("reception.receiptDetail.printLabel"))}
            </Button>

            <Button
              size="sm"
              onClick={() => console.log("Export handover")}
              variant="outline"
              className="flex items-center gap-1.5 text-xs"
            >
              <FileCheck className="h-3.5 w-3.5" />
              {String(t("reception.receiptDetail.exportHandover"))}
            </Button>

            {!isEditing ? (
              <Button
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 text-xs"
              >
                <Edit className="h-3.5 w-3.5" />
                {String(t("common.edit"))}
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updateMut.isPending}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Save className="h-3.5 w-3.5" />
                  {String(t("common.save"))}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={updateMut.isPending}
                  onClick={() => {
                    setEditedReceipt(receipt);
                    setIsEditing(false);
                  }}
                  className="text-xs"
                >
                  {String(t("common.cancel"))}
                </Button>
              </>
            )}

            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 bg-muted/30 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                {String(t("reception.receiptDetail.description"))}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <Label className="text-sm text-muted-foreground">
                    {String(t("lab.receipts.receiptCode"))}
                  </Label>
                  <div className="mt-1 font-medium text-foreground">{receipt.receiptCode ?? "-"}</div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">
                    {String(t("crm.clients.clientName"))}
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editedReceipt.client?.clientName ?? ""}
                      onChange={(e) =>
                        setEditedReceipt((p) => ({
                          ...p,
                          client: { ...(p.client ?? { clientId: "" }), clientName: e.target.value },
                        }))
                      }
                      className="mt-1 bg-background"
                    />
                  ) : (
                    <div className="mt-1 font-medium text-foreground">
                      {receipt.client?.clientName ?? "-"}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">
                    {String(t("crm.clients.clientAddress"))}
                  </Label>
                  <div className="mt-1 text-foreground">{receipt.client?.clientAddress ?? "-"}</div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">
                    {String(t("reception.createReceipt.contactInfo"))}
                  </Label>
                  <div className="mt-1 text-foreground">
                    {(receipt.client?.clientPhone ?? "-")} - {(receipt.client?.clientEmail ?? "-")}
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">
                    {String(t("reception.receiptDetail.sendMail"))}
                  </Label>
                  <div className="mt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => setShowEmailModal(true)}
                    >
                      <Mail className="h-4 w-4" />
                      {String(t("reception.receiptDetail.sendMail"))}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">
                    {String(t("lab.receipts.receiptDate"))}
                  </Label>
                  <div className="mt-1 text-foreground">
                    {receipt.receiptDate?.split("T")[0] ?? "-"}
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">
                    {String(t("lab.receipts.receivedBy"))}
                  </Label>
                  <div className="mt-1 text-foreground">{receipt.createdBy?.identityName ?? "-"}</div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">
                    {String(t("lab.receipts.receiptDeadline"))}
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editedReceipt.receiptDeadline?.split("T")[0] ?? ""}
                      onChange={(e) =>
                        setEditedReceipt((p) => ({ ...p, receiptDeadline: e.target.value }))
                      }
                      className="mt-1 bg-background"
                      type="date"
                    />
                  ) : (
                    <div className="mt-1 text-foreground">
                      {receipt.receiptDeadline?.split("T")[0] ?? "-"}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">
                    {String(t("lab.receipts.status.title"))}
                  </Label>

                  <div className="mt-1">
                    {isEditing ? (
                      <Select
                        value={editedReceipt.receiptStatus ?? ""}
                        onValueChange={(v) =>
                          setEditedReceipt((p) => ({
                            ...p,
                            receiptStatus: v as ReceiptDetail["receiptStatus"],
                          }))
                        }
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder={String(t("common.select"))} />
                        </SelectTrigger>
                        <SelectContent>
                          {RECEIPT_STATUS_OPTIONS.map((st) => (
                            <SelectItem key={st} value={st}>
                              {String(t(`lab.receipts.status.${st}`, { defaultValue: st }))}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline">{String(receipt.receiptStatus ?? "-")}</Badge>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">{String(t("lab.receipts.priority"))}</Label>
                  <div className="mt-1">
                    <Badge variant={receipt.receiptPriority === "Urgent" ? "destructive" : "secondary"}>
                      {String(receipt.receiptPriority ?? "-")}
                    </Badge>
                  </div>
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <Label className="text-sm text-muted-foreground">{String(t("lab.receipts.receiptNote"))}</Label>
                  {isEditing ? (
                    <Textarea
                      value={editedReceipt.receiptNote ?? ""}
                      onChange={(e) =>
                        setEditedReceipt((p) => ({ ...p, receiptNote: e.target.value }))
                      }
                      className="mt-1 bg-background"
                      rows={3}
                    />
                  ) : (
                    <div className="mt-1 text-foreground">{receipt.receiptNote ?? "-"}</div>
                  )}
                </div>
              </div>
            </div>

            {sampleImages.length > 0 && (
              <div className="w-80 bg-muted/30 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  {String(t("reception.receiptDetail.sampleImage"))}
                </h3>

                <div className="relative bg-background rounded-lg overflow-hidden mb-3">
                  <img
                    src={sampleImages[currentImageIndex].url}
                    alt={sampleImages[currentImageIndex].caption || `Image ${currentImageIndex + 1}`}
                    className="w-full h-64 object-contain"
                  />

                  {sampleImages.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-foreground/50 hover:bg-foreground/70 text-background p-1.5 rounded-full transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-foreground/50 hover:bg-foreground/70 text-background p-1.5 rounded-full transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">{String(t("reception.createReceipt.samplesList"))}</h3>

            <div className="bg-background border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        {String(t("lab.samples.sampleId"))}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        {String(t("lab.samples.sampleName"))}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        {String(t("lab.samples.sampleType"))}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        {String(t("lab.analyses.parameterName"))}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        {String(t("lab.analyses.method"))}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        {String(t("lab.analyses.technician"))}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        {String(t("lab.analyses.status.title"))}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        {String(t("lab.analyses.result"))}
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {samples.map((sample) => {
                      const analyses = getAnalysesForSample(sample);

                      return (
                        <React.Fragment key={sample.sampleId}>
                          {analyses.length > 0 ? (
                            analyses.map((analysis, index) => (
                              <tr key={analysis.analysisId} className="hover:bg-muted/30">
                                {index === 0 && (
                                  <>
                                    <td className="px-4 py-3 align-top border-r bg-primary/5" rowSpan={analyses.length}>
                                      <button
                                        onClick={() => onSampleClick(sample)}
                                        className="font-medium text-primary hover:text-primary/80 hover:underline text-sm"
                                      >
                                        {sample.sampleId}
                                      </button>
                                    </td>
                                    <td className="px-4 py-3 align-top border-r bg-primary/5" rowSpan={analyses.length}>
                                      <div className="text-sm text-foreground">{sample.sampleClientInfo ?? "-"}</div>
                                    </td>
                                    <td className="px-4 py-3 align-top border-r bg-primary/5" rowSpan={analyses.length}>
                                      <Badge variant="outline" className="text-xs">
                                        {sample.sampleTypeName ?? "-"}
                                      </Badge>
                                    </td>
                                  </>
                                )}

                                <td className="px-4 py-3 text-sm text-foreground">{analysis.parameterName ?? "-"}</td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">{analysis.protocolCode ?? "-"}</td>
                                <td className="px-4 py-3 text-sm text-foreground">
                                  {analysis.technician?.identityName ?? analysis.technicianId ?? "-"}
                                </td>
                                <td className="px-4 py-3">{getAnalysisStatusBadge(t, analysis.analysisStatus)}</td>
                                <td className="px-4 py-3">
                                  {analysis.analysisResult != null ? (
                                    <div className="text-sm font-medium text-foreground">
                                      {String(analysis.analysisResult)} {analysis.analysisUnit ?? ""}
                                    </div>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">-</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr className="hover:bg-muted/30">
                              <td className="px-4 py-3 align-top border-r bg-primary/5">
                                <button
                                  onClick={() => onSampleClick(sample)}
                                  className="font-medium text-primary hover:text-primary/80 hover:underline text-sm"
                                >
                                  {sample.sampleId}
                                </button>
                              </td>
                              <td className="px-4 py-3 align-top border-r bg-primary/5">
                                <div className="text-sm text-foreground">{sample.sampleClientInfo ?? "-"}</div>
                              </td>
                              <td className="px-4 py-3 align-top border-r bg-primary/5">
                                <Badge variant="outline" className="text-xs">
                                  {sample.sampleTypeName ?? "-"}
                                </Badge>
                              </td>
                              <td colSpan={5} className="px-4 py-3 text-center text-muted-foreground text-sm">
                                {String(t("reception.createReceipt.noAnalysis"))}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">{String(t("reception.receiptDetail.digitalRecords"))}</h3>
              <Button size="sm" variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {String(t("reception.receiptDetail.uploadFile"))}
              </Button>
            </div>

            <div className="bg-background border border-border rounded-lg overflow-hidden">
              <div className="p-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p>{String(t("reception.receiptDetail.noFile"))}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEmailModal && (
        <>
          <div className="fixed inset-0 bg-foreground/50 z-[60]" onClick={() => setShowEmailModal(false)} />

          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-3xl mx-auto bg-background rounded-lg shadow-xl z-[60] flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {String(t("reception.receiptDetail.sendMailTitle"))}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {String(t("reception.receiptDetail.sendMailDesc"))}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowEmailModal(false)} className="h-10 w-10 p-0">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">{String(t("reception.receiptDetail.email.from"))}</Label>
                  <Input value={emailForm.from} onChange={(e) => handleEmailChange("from", e.target.value)} className="mt-1 bg-background" />
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">{String(t("reception.receiptDetail.email.to"))}</Label>
                  <Input value={emailForm.to} onChange={(e) => handleEmailChange("to", e.target.value)} className="mt-1 bg-background" />
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">{String(t("reception.receiptDetail.email.subject"))}</Label>
                  <Input value={emailForm.subject} onChange={(e) => handleEmailChange("subject", e.target.value)} className="mt-1 bg-background" />
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">{String(t("reception.receiptDetail.email.content"))}</Label>
                  <Textarea value={emailForm.content} onChange={(e) => handleEmailChange("content", e.target.value)} className="mt-1 bg-background" rows={10} />
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">{String(t("reception.receiptDetail.email.attachments"))}</Label>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    {emailForm.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center gap-2 bg-muted px-3 py-1 rounded-md">
                        <FileCheck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{attachment}</span>
                      </div>
                    ))}
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      {String(t("reception.receiptDetail.uploadFile"))}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-6 border-t border-border">
              <Button variant="outline" onClick={() => setShowEmailModal(false)}>
                {String(t("common.cancel"))}
              </Button>
              <Button onClick={handleSendEmail} className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {String(t("reception.receiptDetail.email.send"))}
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
