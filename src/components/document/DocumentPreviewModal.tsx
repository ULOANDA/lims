import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";

export type PreviewType = "pdf" | "image" | "office" | null;

export type DocumentPreviewModalProps = {
    open: boolean;
    onClose: () => void;
    previewUrl: string | null;
    previewType: PreviewType;
    previewFileName: string | null;
};

export function DocumentPreviewModal({ open, onClose, previewUrl, previewType, previewFileName }: DocumentPreviewModalProps) {
    const { t } = useTranslation();

    if (!open || !previewUrl) return null;

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={onClose}>
            <div className="bg-background w-full max-w-6xl h-[95vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-border" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                            {previewType === "pdf" && <span className="text-xs font-bold text-red-600">PDF</span>}
                            {previewType === "image" && <span className="text-xs font-bold text-blue-600">IMG</span>}
                            {previewType === "office" && <span className="text-xs font-bold text-blue-800">DOC</span>}
                        </div>
                        <h3 className="font-semibold text-foreground truncate" title={previewFileName || ""}>
                            {previewFileName || String(t("documentCenter.preview.title", { defaultValue: "Xem trước tài liệu" }))}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => window.open(previewUrl, "_blank")}>
                            <ExternalLink className="h-4 w-4 mr-1" />
                            {String(t("documentCenter.preview.openNew", { defaultValue: "Mở tab mới" }))}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
                {/* Modal Body */}
                <div className="flex-1 overflow-hidden">
                    {previewType === "pdf" && <iframe src={previewUrl} className="w-full h-full border-0" title="PDF Preview" />}
                    {previewType === "image" && (
                        <div className="w-full h-full flex items-center justify-center bg-muted/20 overflow-auto p-4">
                            <img src={previewUrl} alt={previewFileName || "Image Preview"} className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
                        </div>
                    )}
                    {previewType === "office" && <iframe src={previewUrl} className="w-full h-full border-0" title="Office Preview" />}
                </div>
            </div>
        </div>,
        document.body,
    );
}
