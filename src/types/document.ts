import type { BaseEntity } from "./common";

export interface FileEntity extends BaseEntity {
    fileId: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    uris: string[];
    fileTags: string[];
    opaiFile?: Record<string, any>;
}

export type DocumentStatus = "Draft" | "Issued" | "Revised" | "Cancelled";

export interface DocumentEntity extends BaseEntity {
    documentId: string;
    documentTitle?: string;
    fileId: string;
    refId?: string;
    refType?: "Receipt" | "Order" | string;
    commonKeys?: string[];
    documentStatus?: DocumentStatus;
    jsonContent?: Record<string, any>;
}

export interface Report extends BaseEntity {
    reportId: string;
    receiptId: string;
    sampleId: string;
    header?: string; // HTML
    content?: string; // HTML
    footer?: string; // HTML
    reportStatus?: "Draft" | "Issued" | "Revised" | "Cancelled";
    reportRevision?: number;
    reportRevisionNote?: string;
    replacedByReportId?: string;
    signatures?: Record<string, unknown>[];
    complaintId?: string;
}
