import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Upload, Download, Eye, Image as ImageIcon, File, Search, FolderOpen, Archive, Shield, FileBarChart, FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Document {
    id: string;
    fileName: string;
    fileType: "pdf" | "excel" | "image" | "other";
    refId?: string;
    refType?: string;
    uploadedBy: string;
    uploadedDate: string;
    fileSize: string;
}

const mockDocuments = {
    receipt: [
        {
            id: "d1",
            fileName: "Phiếu yêu cầu TNM2501-001.pdf",
            fileType: "pdf" as const,
            refId: "TNM2501-001",
            refType: "Receipt",
            uploadedBy: "Nguyễn Văn A",
            uploadedDate: "15/01/2026",
            fileSize: "245 KB",
        },
        {
            id: "d2",
            fileName: "Hợp đồng Công ty ABC.pdf",
            fileType: "pdf" as const,
            refId: "TNM2501-001",
            refType: "Receipt",
            uploadedBy: "Trần Thị B",
            uploadedDate: "15/01/2026",
            fileSize: "1.2 MB",
        },
        {
            id: "d3",
            fileName: "Email khách hàng - Yêu cầu bổ sung.pdf",
            fileType: "pdf" as const,
            refId: "TNM2501-002",
            refType: "Receipt",
            uploadedBy: "Nguyễn Văn A",
            uploadedDate: "16/01/2026",
            fileSize: "180 KB",
        },
    ],
    lab: [
        {
            id: "d4",
            fileName: "Nhật ký thử nghiệm pH - Batch 2501.xlsx",
            fileType: "excel" as const,
            refId: "TNM2501-001-S01",
            refType: "Sample",
            uploadedBy: "KTV Lê Văn C",
            uploadedDate: "16/01/2026",
            fileSize: "95 KB",
        },
        {
            id: "d5",
            fileName: "Sắc ký đồ Pb - Mẫu S01.png",
            fileType: "image" as const,
            refId: "TNM2501-003-S01",
            refType: "Analysis",
            uploadedBy: "KTV Phạm Thị D",
            uploadedDate: "17/01/2026",
            fileSize: "520 KB",
        },
        {
            id: "d6",
            fileName: "Raw data ICP-MS - 17012026.xlsx",
            fileType: "excel" as const,
            refId: "Batch-170126",
            refType: "Batch",
            uploadedBy: "KTV Phạm Thị D",
            uploadedDate: "17/01/2026",
            fileSize: "1.8 MB",
        },
    ],
    report: [
        {
            id: "d7",
            fileName: "Phiếu kết quả TNM2501-002 (Scan).pdf",
            fileType: "pdf" as const,
            refId: "TNM2501-002",
            refType: "Receipt",
            uploadedBy: "Trưởng phòng E",
            uploadedDate: "17/01/2026",
            fileSize: "1.5 MB",
        },
        {
            id: "d8",
            fileName: "Bản nháp kết quả TNM2501-001.docx",
            fileType: "other" as const,
            refId: "TNM2501-001",
            refType: "Receipt",
            uploadedBy: "KTV Lê Văn C",
            uploadedDate: "17/01/2026",
            fileSize: "340 KB",
        },
    ],
    sop: [
        {
            id: "d9",
            fileName: "SOP-001 Quy trình lấy mẫu nước.pdf",
            fileType: "pdf" as const,
            uploadedBy: "Admin",
            uploadedDate: "01/01/2026",
            fileSize: "2.1 MB",
        },
        {
            id: "d10",
            fileName: "ISO 17025-2017 Hướng dẫn áp dụng.pdf",
            fileType: "pdf" as const,
            uploadedBy: "Admin",
            uploadedDate: "01/01/2026",
            fileSize: "5.3 MB",
        },
        {
            id: "d11",
            fileName: "Quy trình vận hành ICP-MS.pdf",
            fileType: "pdf" as const,
            uploadedBy: "Kỹ thuật viên",
            uploadedDate: "10/01/2026",
            fileSize: "1.7 MB",
        },
    ],
    other: [
        {
            id: "d12",
            fileName: "Báo cáo tài chính Q4-2025.xlsx",
            fileType: "excel" as const,
            uploadedBy: "Kế toán",
            uploadedDate: "05/01/2026",
            fileSize: "450 KB",
        },
    ],
};

export function DocumentCenter() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("receipt");
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const getFileIcon = (type: string) => {
        switch (type) {
            case "pdf":
                return <FileText className="h-6 w-6 text-red-500" />;
            case "doc":
            case "docx":
                return <FileText className="h-6 w-6 text-blue-500" />;
            case "xls":
            case "xlsx":
            case "excel": // Added for existing mock data
                return <FileBarChart className="h-6 w-6 text-green-500" />;
            case "image": // Added for existing mock data
                return <ImageIcon className="h-6 w-6 text-blue-500" />;
            default:
                return <File className="h-6 w-6 text-muted-foreground" />;
        }
    };

    const DocumentList = ({ documents }: { documents: Document[] }) => (
        <div className="divide-y divide-border">
            {documents
                .filter((doc) => doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((doc) => (
                    <div key={doc.id} className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${selectedDoc?.id === doc.id ? "bg-primary/10" : ""}`} onClick={() => setSelectedDoc(doc)}>
                        <div className="flex items-start gap-3">
                            <div className="mt-1">{getFileIcon(doc.fileType)}</div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-foreground truncate">{doc.fileName}</div>
                                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                                    <span>{doc.uploadedBy}</span>
                                    <span>•</span>
                                    <span>{doc.uploadedDate}</span>
                                    <span>•</span>
                                    <span>{doc.fileSize}</span>
                                    {doc.refId && (
                                        <>
                                            <span>•</span>
                                            <Badge variant="outline" className="text-xs">
                                                {doc.refType}: {doc.refId}
                                            </Badge>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                    <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                    <Download className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
        </div>
    );

    const filteredDocuments = mockDocuments[activeTab as keyof typeof mockDocuments];

    return (
        <div className="p-6 h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-foreground">{t("documentCenter.title")}</h1>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder={t("common.search")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-64 bg-background" />
                    </div>
                    <Button className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        {t("documentCenter.upload")}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
                {/* Sidebar Navigation */}
                <div className="col-span-3 bg-card rounded-lg border border-border p-4 h-full flex flex-col">
                    <nav className="space-y-1">
                        <button
                            onClick={() => setActiveTab("receipt")}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                                activeTab === "receipt" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"
                            }`}
                        >
                            <FolderOpen className="h-5 w-5" />
                            <div className="text-left">
                                <div>{t("documentCenter.tabs.receipt")}</div>
                                <div className="text-xs opacity-70 font-normal">{t("documentCenter.headers.receiptDesc")}</div>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("lab")}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                                activeTab === "lab" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"
                            }`}
                        >
                            <FileBarChart className="h-5 w-5" />
                            <div className="text-left">
                                <div>{t("documentCenter.tabs.lab")}</div>
                                <div className="text-xs opacity-70 font-normal">{t("documentCenter.headers.labDesc")}</div>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("report")}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                                activeTab === "report" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"
                            }`}
                        >
                            <FileCheck className="h-5 w-5" />
                            <div className="text-left">
                                <div>{t("documentCenter.tabs.report")}</div>
                                <div className="text-xs opacity-70 font-normal">{t("documentCenter.headers.reportDesc")}</div>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("sop")}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                                activeTab === "sop" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"
                            }`}
                        >
                            <Shield className="h-5 w-5" />
                            <div className="text-left">
                                <div>{t("documentCenter.tabs.sop")}</div>
                                <div className="text-xs opacity-70 font-normal">{t("documentCenter.headers.sopDesc")}</div>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("other")}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                                activeTab === "other" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"
                            }`}
                        >
                            <Archive className="h-5 w-5" />
                            <div className="text-left">
                                <div>{t("documentCenter.tabs.other")}</div>
                                <div className="text-xs opacity-70 font-normal">{t("documentCenter.headers.otherDesc")}</div>
                            </div>
                        </button>
                    </nav>
                </div>

                {/* Documents List */}
                <div className="col-span-5 space-y-6">
                    <div className="bg-card rounded-lg border overflow-hidden h-full">
                        <div className="bg-muted/50 px-4 py-3 border-b border-border">
                            <h3 className="font-medium text-foreground">{t(`documentCenter.headers.${activeTab}`)}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{t(`documentCenter.headers.${activeTab}Desc`)}</p>
                        </div>
                        <div className="h-[calc(100%-6rem)] overflow-y-auto">
                            {" "}
                            {/* Adjust height based on header */}
                            <DocumentList documents={filteredDocuments} />
                        </div>
                    </div>
                </div>

                {/* Preview Panel */}
                <div className="col-span-4">
                    <div className="bg-card rounded-lg border p-6 sticky top-6 h-full">
                        {selectedDoc ? (
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div>{getFileIcon(selectedDoc.fileType)}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-muted-foreground">{t("documentCenter.preview.size")}</div>
                                        <div className="font-medium text-foreground">{selectedDoc.fileSize}</div>
                                    </div>
                                    {selectedDoc.refId && (
                                        <div>
                                            <div className="text-sm text-muted-foreground">{t("documentCenter.preview.link")}</div>
                                            <Badge variant="outline" className="mt-1">
                                                {selectedDoc.refType}: {selectedDoc.refId}
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-border space-y-2">
                                    <Button className="w-full justify-start" variant="outline">
                                        <Eye className="h-4 w-4 mr-2" />
                                        {t("documentCenter.preview.preview")}
                                    </Button>
                                    <Button className="w-full justify-start" variant="outline">
                                        <Download className="h-4 w-4 mr-2" />
                                        {t("documentCenter.preview.download")}
                                    </Button>
                                </div>

                                {/* Preview area */}
                                <div className="pt-4 border-t border-border">
                                    <div className="bg-muted/30 rounded-lg p-8 text-center min-h-[300px] flex items-center justify-center">
                                        <div className="text-muted-foreground">
                                            {getFileIcon(selectedDoc.fileType)}
                                            <p className="mt-2 text-sm">{t("documentCenter.preview.preview")}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-12">
                                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                                <p>{t("documentCenter.preview.select")}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
