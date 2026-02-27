import api from "@/api/client";

export interface FileInfo {
    fileId: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    uris: string[];
    fileStatus?: string; // "Pending" | "Synced" | "Deleted"
    createdById?: string;
    commonKeys?: string[];
    fileTags?: string[];
    opaiFile?: any | null;
    createdAt?: string;
    deletedAt?: string | null;
}

export interface FileUrlResponse {
    url: string;
    expiresIn: number;
    fileId: string;
}

export interface FileUploadFormData {
    file: File;
    commonKeys?: string[]; // will be JSON stringified in FormData
    fileTags?: string[]; // will be JSON stringified in FormData
}

export interface FileUploadJsonBody {
    buffer: string; // base64
    fileName: string;
    mimeType: string;
    commonKeys?: string[];
    fileTags?: string[];
}

export interface FileDeleteBody {
    fileId: string;
}

export const fileApi = {
    list: (query?: any) => api.get<FileInfo[]>("/v2/files/get/list", { query }),
    detail: (id: string) => api.get<FileInfo>("/v2/files/get/detail", { query: { id } }),
    url: (id: string, expiresIn?: number) => api.get<FileUrlResponse>("/v2/files/get/url", { query: { id, expiresIn } }),
    upload: (body: FormData | FileUploadJsonBody) => api.post<FileInfo>("/v2/files/upload", { body }),
    delete: (body: FileDeleteBody) => api.post<{ success: boolean; id: string; status: string; details?: any }>("/v2/files/delete", { body }),
};

/** Helper: build a FormData for file upload with optional commonKeys & fileTags */
export function buildFileUploadFormData(file: File, opts?: { commonKeys?: string[]; fileTags?: string[] }): FormData {
    const fd = new FormData();
    fd.append("file", file);
    if (opts?.commonKeys?.length) fd.append("commonKeys", JSON.stringify(opts.commonKeys));
    if (opts?.fileTags?.length) fd.append("fileTags", JSON.stringify(opts.fileTags));
    return fd;
}
