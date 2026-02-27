# Tài Liệu Hệ Thống Quản Lý Tài Liệu (Document System)

Hệ thống quản lý tài liệu trong LIMS-IRDOP được chia thành hai lớp đối tượng riêng biệt nhưng liên kết chặt chẽ: **File** (Vật lý — S3/MinIO) và **Document** (Nghiệp vụ — metadata + liên kết).

---

## 1. Cấu Trúc Tổng Quan

### 1.1. File Entity (`2_File.js`) — Bảng `document.files`

Đây là lớp đại diện cho **tài liệu vật lý** được lưu trữ trên Cloud Storage (S3/MinIO).

- **Mục đích**: Quản lý việc lưu trữ, đường dẫn truy cập, và metadata kỹ thuật của file.
- **Đặc điểm**:
    - Không chứa thông tin nghiệp vụ (như loại phiếu, mã đơn hàng...).
    - Được định danh bằng `id` (định dạng `file_x...`).
    - Lưu trữ đường dẫn dưới dạng URI chuẩn (`s3://bucket/objectName`).
    - Hỗ trợ presigned URL để download trực tiếp từ S3 (không qua server).

**Cấu trúc dữ liệu (`document.files`):**

| Trường        | Kiểu      | Mô tả                                                   |
| :------------ | :-------- | :------------------------------------------------------ |
| `fileId`      | PK (text) | Mã định danh duy nhất (`file_...`).                     |
| `fileName`    | Text      | Tên file gốc.                                           |
| `mimeType`    | Text      | Phân loại mime (application/pdf, image/png ...).        |
| `fileSize`    | BigInt    | Kích thước (bytes).                                     |
| `uris`        | Text[]    | Danh sách URI truy cập (VD: `["s3://irdop/file_..."]`). |
| `fileStatus`  | Text      | Trạng thái (`Pending`, `Synced`, `Deleted`...).         |
| `createdById` | Text      | Người tạo.                                              |
| `commonKeys`  | Text[]    | Các ID liên kết (documentId, orderId...).               |
| `fileTags`    | Text[]    | Tags phân loại: `Report`, `Order`,...                   |
| `opaiFile`    | JSONB     | Metadata nếu file được sync sang OpenAI (Vector Store). |
| `createdAt`   | Timestamp | Thời điểm tạo.                                          |
| `deletedAt`   | Timestamp | Thời điểm xóa mềm.                                      |

### 1.2. Document Entity (`2_Document.js`) — Bảng `document.copy`

Đây là lớp đại diện cho **tài liệu nghiệp vụ** — gắn ngữ cảnh sử dụng cho một File vật lý.

- **Mục đích**: Gắn ngữ cảnh nghiệp vụ cho một File. Ví dụ: File PDF A là "Hóa đơn", File PDF B là "Biên bản thử nghiệm".
- **Đặc điểm**:
    - Liên kết với `File` thông qua `fileId`.
    - Chứa thông tin phân loại (`classifierCode`), metadata nghiệp vụ, và nội dung JSON.
    - Có thể tạo nhiều Document trỏ cùng về 1 File (copyType: `FULL_COPY`, `PARTIAL_COPY`).
    - Hỗ trợ phân trang (`startPage`, `endPage`) cho tài liệu nhiều trang.

**Cấu trúc dữ liệu (`document.copy`):**

| Trường           | Kiểu      | Mô tả                                                    |
| :--------------- | :-------- | :------------------------------------------------------- |
| `id`             | PK (text) | Mã định danh tài liệu nghiệp vụ (VD: `D26dTKHZ9P613`).   |
| `fileId`         | FK (text) | Tham chiếu đến `document.files.fileId`.                  |
| `classifierCode` | Text      | Mã phân loại (VD: `HOA_DON`, `TAI_LIEU_THU_NGHIEM`).     |
| `copyType`       | Text      | Kiểu copy: `FULL_COPY`, `PARTIAL_COPY`.                  |
| `metadata`       | JSONB     | Metadata nghiệp vụ (VD: documentTitle, documentDate...). |
| `jsonContent`    | JSONB     | Nội dung chi tiết (phụ thuộc classifierCode).            |
| `commonKeys`     | Text[]    | Các key liên kết (VD: orderId, sampleId...).             |
| `startPage`      | Int       | Trang bắt đầu (cho extract từ file nhiều trang).         |
| `endPage`        | Int       | Trang kết thúc.                                          |
| `totalPages`     | Int       | Tổng số trang.                                           |
| `mimeType`       | Text      | Loại file.                                               |
| `docId`          | Text      | ID tài liệu gốc (nếu là bản sao).                        |
| `editId`         | Text      | ID phiên bản chỉnh sửa.                                  |
| `identityUID`    | Text      | Người tạo.                                               |
| `appUID`         | Text      | Ứng dụng nguồn.                                          |
| `createdAt`      | Timestamp | Thời điểm tạo.                                           |
| `modifiedAt`     | Timestamp | Thời điểm cập nhật.                                      |
| `deletedAt`      | Timestamp | Thời điểm xóa mềm.                                       |

---

## 2. Luồng Xử Lý (Logic Flows)

### 2.1. Upload và Tạo Mới (Upload & Create)

Hệ thống hỗ trợ upload file buffer, lưu vào S3, tạo bản ghi File, và sau đó tạo bản ghi Document.

**Quy trình `Document.createFromFile`:**

1.  **Input**: Buffer file + Metadata nghiệp vụ (`classifierCode`, `metadata`, `commonKeys`).
2.  **Xử lý File**:
    - Sinh `id` (`file_x...`).
    - Úpload file binary lên MinIO/S3 bucket.
    - Lưu metadata vào bảng `document.files`.
3.  **Xử lý Document**:
    - Lấy `fileId` (= `id` của File vừa tạo).
    - Tạo bản ghi mới trong `document.copy` với liên kết `fileId`.
    - Lưu metadata nghiệp vụ, classifierCode, commonKeys.

### 2.2. Truy Xuất Chi Tiết (Full Snapshot)

Khi cần hiển thị thông tin tài liệu trên giao diện, ta cần cả thông tin nghiệp vụ lẫn thông tin kỹ thuật của file.

**Quy trình `Document.getFullById`:**

1.  **Lấy Document**: Query bảng `document.copy` theo `id`.
2.  **Lấy File**: Dùng `fileId` từ document để query bảng `document.files`.
3.  **Merge**: Gắn object `file` vào kết quả `doc`.
    - Kết quả trả về là một object chứa `doc.*` và `doc.file.*`.

### 2.3. Lấy Link Tải Xuống (Presigned URL)

Để đảm bảo bảo mật, hệ thống không công khai direct link S3. Thay vào đó, nó sinh ra một **Presigned URL** có thời hạn (mặc định 1 giờ).

**Quy trình:**

1.  Client gọi `GET /v2/documents/get/url?id=...` hoặc `GET /v2/files/get/url?id=...`.
2.  Server tìm `File` (trực tiếp hoặc qua Document).
3.  Server dùng `MinioClient.presignedGetObject(bucketName, objectName, expiresIn)` để ký số yêu cầu.
4.  Trả về URL dạng `https://s3.irdop.org/irdop/objectName?Signature=...`.
5.  Client dùng URL này để tải trực tiếp từ S3 (không qua server nodejs).

### 2.4. Tìm File theo nhiều cách (fromAny)

`File.fromAny()` là factory method hỗ trợ resolve File từ nhiều nguồn:

1.  **Từ ID**: Truyền `fileId` hoặc `id` → query `document.files` bằng PK.
2.  **Từ URI**: Truyền `s3://bucket/objectName` → tìm trong cột `uris` (array).
3.  **Từ Buffer**: Truyền `buffer` + `fileName` + `mimeType` → upload lên S3 và tạo mới.

---

## 3. Chi Tiết Các Class (Implementation Detail)

### 3.1. `Class Storage` (`MAIN SERVICE/4_Storage.js`)

Wrapper cho thư viện `minio`. Tất cả method đều nhận `bucketName` và `objectName` trực tiếp từ caller (File instance).

- `uploadFile({ fileBuffer, fileName, mimeType, identityId, commonKeys, fileTags })`: Upload lên S3 + insert vào `document.files`.
- `downloadFile({ bucketName, objectName, fileId })`: Tải file từ S3, trả về Buffer.
- `presignedUrl({ bucketName, objectName, fileId, expiresIn })`: Sinh URL có chữ ký (mặc định 1h).
- `deleteFile({ bucketName, objectName, fileId, identityId })`: Xóa trên S3 + soft-delete trong `document.files`.

### 3.2. `Class File` (`2_File.js`)

Extend từ `DocumentEntity`. Table: `document.files`. PK: `fileId`.

| Method                   | Loại     | Mô tả                                                 |
| :----------------------- | :------- | :---------------------------------------------------- |
| `File.getList()`         | Static   | Lấy danh sách files phân trang.                       |
| `File.getById()`         | Static   | Lấy file record theo ID (từ cache hoặc DB).           |
| `File.fromAny()`         | Static   | Factory: resolve File từ ID, URI, hoặc Buffer upload. |
| `File.upload()`          | Static   | Upload file mới lên S3 + tạo DB record.               |
| `file.getPresignedUrl()` | Instance | Lấy S3 presigned download URL.                        |
| `file.download()`        | Instance | Download binary từ S3 (trả Buffer).                   |
| `file.delete()`          | Instance | Xóa file trên S3 + soft-delete DB.                    |
| `File.s3Uri()`           | Static   | Parse URI `s3://bucket/key`.                          |
| `File.parseUri()`        | Static   | Detect provider từ URI.                               |

### 3.3. `Class Document` (`2_Document.js`)

Extend từ `DocumentEntity`. Table: `document.copy`. PK: `id`.

| Method                      | Loại     | Mô tả                                           |
| :-------------------------- | :------- | :---------------------------------------------- |
| `Document.getList()`        | Static   | Lấy danh sách documents phân trang.             |
| `Document.getById()`        | Static   | Lấy document theo ID (flat data).               |
| `Document.getFullById()`    | Static   | Lấy document + object File liên kết (nested).   |
| `Document.createFromFile()` | Static   | Tạo Document từ file upload hoặc fileId có sẵn. |
| `doc.getFile()`             | Instance | Lấy instance `File` liên kết.                   |
| `doc.download()`            | Instance | Download binary qua linked File.                |

---

## 4. Ví Dụ Sử Dụng (Code Usage)

**Tạo Document từ Buffer (Upload mới):**

```javascript
const { Document } = global.get("documentEntities.js");

const newDoc = await Document.createFromFile({
    file: {
        buffer: myFileBuffer,
        fileName: "hop_dong_so_1.pdf",
        mimeType: "application/pdf",
    },
    data: {
        classifierCode: "HOP_DONG",
        metadata: { documentTitle: "Hợp đồng kiểm nghiệm" },
        commonKeys: ["DH26C0001"],
    },
    entity: currentUser,
});
// newDoc.id → "D26..."
// newDoc.fileId → "file_x..."
```

**Lấy thông tin đầy đủ (Document + File):**

```javascript
const docFull = await Document.getFullById({
    id: "D26dTKHZ9P613",
    authToken: token,
});

// docFull.id → "D26dTKHZ9P613"
// docFull.metadata.documentTitle → "HÓA ĐƠN GIÁ TRỊ GIA TĂNG"
// docFull.file.fileName → "1C26TYY_00001123.pdf"
```

**Lấy Link Download:**

```javascript
const file = await docFull.getFile();
const url = await file.getPresignedUrl({ expiresIn: 3600 });
// url → "https://s3.irdop.org/irdop/file_x...?X-Amz-Signature=..."
// Frontend: window.open(url)
```

**Tìm File từ S3 URI:**

```javascript
const { File } = global.get("documentEntities.js");

const file = await File.fromAny({
    uri: "s3://irdop/file_x4770027e65514f6c",
    authToken: token,
});
// file.fileId → "file_4770027e65514f6c"
// file.uris → ["s3://irdop/file_4770027e65514f6c_sample.pdf"]
```
