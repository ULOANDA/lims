# TÀI LIỆU THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE DESIGN DOCUMENT)

**Dự án:** LIMS Multi-Lab SaaS Platform

**Phiên bản:** 2.4 (Merged Production + Dev + Process Coverage)

**Ngày cập nhật:** 23/02/2026

**Tham chiếu:** [RULE.md](./RULE.md), [BA.md](./BA.md), [API Documentation](./src/api/API_DOCUMENTATION.md)

---

## I. TỔNG QUAN CHIẾN LƯỢC (STRATEGIC OVERVIEW)

### 1. Kiến trúc lưu trữ (Storage Architecture)

- **Engine**: PostgreSQL 16+.

- **Multi-tenancy**: Mô hình **Schema-per-Tenant**.
    - `public`: Lưu trữ quản lý hệ thống (Tenants, Subscriptions, Global Configs).

    - `tenant_{tenantId}`: Chứa toàn bộ dữ liệu nghiệp vụ riêng biệt của từng Lab.

- **Khóa chính (PK)**: Sử dụng **Custom Text ID** (VD: `MAT-0001`, `REC2412-001`) thay cho UUID/Serial để tối ưu hóa việc đọc hiểu và tính duy nhất trên toàn hệ thống.

### 2. Quy tắc Audit & Soft Delete

Tất cả các bảng (ngoại trừ bảng trung gian thuần túy) phải bao gồm các cột:

- `createdAt` (timestamp): Thời điểm tạo.

- `createdById` (text): ID người tạo.

- `modifiedAt` (timestamp): Thời điểm cập nhật cuối.

- `modifiedById` (text): ID người cập nhật cuối.

- `deletedAt` (timestamp): Dùng cho **Soft Delete**. Mặc định là `NULL`.

---

## II. CHI TIẾT SCHEMA (DETAILED SCHEMA)

### A. SCHEMA IDENTITY (`identity`)

Chứa thông tin danh tính và phiên làm việc.

#### 1. Bảng `identities` (Danh tính User)

| Column Name | Type | Key | Description |

| `identityId` | `text` | **PK** | ID tùy chỉnh. |
| `email` | `text` | **UQ** | Email / ID đăng nhập. _(Trước: `identityEmail`)_ |
| `identityName` | `text` | | Tên hiển thị. |
| `alias` | `text` | | Bí danh (KTV, Sales...). |
| `roles` | `text[]` | | Mảng chứa System Role Key (VD: `['ROLE_TECHNICIAN']`). _(Trước: `identityRoles`)_ |
| `identityPolicies`| `jsonb` | | Ghi đè chính sách (Manual Overrides): `{ "POL_CODE": "ALLOW" / "DENY" / "LIMIT" }`. |
| `permissions` | `jsonb` | | Quyền chi tiết (Granular Cache): `{ table: { col: mask } }`. _(Trước: `identityPermission`)_ |
| `password` | `text` | | Mật khẩu (đã hash). |
| `identityStatus` | `text` | | Trạng thái: `active`, `inactive`, `pending`. |
| `identityPhone` | `text` | | Số điện thoại liên hệ. |
| `identityNID` | `text` | | CMND/CCCD. |
| `identityAddress`| `text` | | Địa chỉ thường trú. |
| `createdAt` | `timestamp` | | Thời điểm tạo. |
| `createdById` | `text` | | Người tạo. |
| `modifiedAt` | `timestamp` | | Thời điểm cập nhật cuối. |
| `modifiedById` | `text` | | Người cập nhật cuối. |
| `deletedAt` | `timestamp` | | Thời điểm xóa (Soft Delete). |

### 1.1 Chi tiết cấu trúc `positionInfo` (JSONB)

Cấu trúc mẫu:

```json
{
    "departmentId": "DEPT_LAB_MICRO",
    "departmentName": "Phòng Vi sinh",
    "sectionId": "SEC_SAMPLE_PREP",
    "sectionName": "Tổ xử lý mẫu",
    "jobTitle": "Trưởng phòng Kỹ thuật",
    "jobLevel": "L4",
    "managerId": "USR-2023-999",
    "isHeadOfDepartment": true,
    "workingLocations": ["LAB_HCM", "LAB_HN"]
}
```

### 1.2 Danh mục System Role Keys (`roles`)

- **Ban Lãnh đạo**: `ROLE_DIRECTOR`, `ROLE_TECH_MANAGER`, `ROLE_QA_MANAGER`
- **Vận hành**: `ROLE_SECTION_HEAD`, `ROLE_VALIDATOR`, `ROLE_SENIOR_ANALYST`, `ROLE_TECHNICIAN`, `ROLE_IPC_INSPECTOR`, `ROLE_RND_SPECIALIST`
- **Hậu cần**: `ROLE_RECEPTIONIST`, `ROLE_SAMPLER`, `ROLE_SAMPLE_CUSTODIAN`, `ROLE_EQUIPMENT_MGR`, `ROLE_INVENTORY_MGR`
- **Kinh doanh**: `ROLE_SALES_MANAGER`, `ROLE_SALES_EXEC`, `ROLE_CS`, `ROLE_ACCOUNTANT`, `ROLE_REPORT_OFFICER`
- **Hệ thống**: `ROLE_SUPER_ADMIN`, `ROLE_DOC_CONTROLLER`, `ROLE_HSE_OFFICER`

#### 2. Bảng `sessions` (Phiên đăng nhập)

| Column Name | Type | Key | Description |

| :-------------- | :---------- | :----- | :---------------------------------------- |

| `sessionId` | `text` | **PK** | Custom Text ID. |

| `identityId` | `text` | **FK** | Tham chiếu `identities`. |

| `sessionExpiry` | `timestamp` | | Thời gian hết hạn phiên. |

| `sessionStatus` | `text` | | `active` (default), `expired`, `revoked`. |

| `ipAddress` | `text` | | IP người dùng. |

| `sessionDomain` | `text` | | Domain đăng nhập. |

| `createdAt` | `timestamp` | | Thời điểm tạo phiên. |

| `modifiedAt` | `timestamp` | | Thời điểm cập nhật cuối. |
| `deletedAt` | `timestamp` | | Thời điểm xóa (Soft Delete). |

---

### B. SCHEMA CRM (`crm`)

Chứa thông tin khách hàng và bán hàng.

#### 1. Bảng `clients` (Danh sách Khách hàng)

| Column Name | Type | Key | Description |

| :----------------- | :-------- | :----- | :----------------------------------------------------------------------------------------- |

| `clientId` | `text` | **PK** | Custom Text ID. |

| `clientName` | `text` | | Tên công ty / Cá nhân. |

| `legalId` | `text` | | Mã số thuế / CMND. |

| `clientAddress` | `text` | | Địa chỉ trụ sở. |

| `clientPhone` | `text` | | SĐT trụ sở. |

| `clientEmail` | `text` | | Email trụ sở. |

| `clientSaleScope` | `text` | | Phạm vi quyền: `'public'` (Toàn cty), `'private'` (Riêng sale). |

| `availableByIds` | `text[]` | | Danh sách ID Sale/CTV được phép truy cập (nếu private). |

| `availableByName` | `text[]` | | Danh sách tên Sale/CTV được phép truy cập (nếu private). |

| `clientContacts` | `jsonb[]` | | [{ contactName, contactPhone, contactEmail, contactPosition, contactAddress, contactId }]. |

| `invoiceInfo` | `jsonb` | | Thông tin xuất hóa đơn {taxAddress, taxCode, taxName, taxEmail }. |

| `totalOrderAmount` | `numeric` | | Tổng doanh số tích lũy (Cached). |

| _Audit Cols_ | ... | | |

#### 2. Bảng `orders` (Đơn hàng)

| Column Name | Type | Key | Description |

| :----------------------------- | :-------- | :----- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| `orderId` | `text` | **PK** | Custom Text ID. |

| `quoteId` | `text` | **FK** | Tham chiếu báo giá nguồn (nếu có). |

| `clientId` | `text` | **FK** | |

| `client` | `jsonb` | | Structure: `{clientId, legalId, clientName, clientAddress, clientEmail, invoiceInfo:{taxAddress, taxCode, taxName, taxEmail } }` |

| `contactPerson` | `jsonb` | | Structure: `{ contactName, contactPhone, contactEmail, contactPosition, contactAddress, contactId }` |

| `reportRecipient` | `jsonb` | | Structure: `{ receiverName, receiverPhone, receiverAddress, receiverEmail}` |

| `salePersonId` | `text` | | |

| `salePerson` | `text` | | Tên Sale phụ trách. |

| `saleCommissionPercent` | `numeric` | | % doanh số cho salePerson. |

| `samples` | `jsonb[]` | | Chi tiết yêu cầu: `[{ sampleName, sampleTypeName ,analyses: [{parameterName ,parameterId, feeBeforeTax, taxRate, feeAfterTax }]`. Note: `feeBeforeTax` có thể null và cần tính ngược từ `feeAfterTax`. |

| `totalAmount` | `numeric` | | Giá trị hợp đồng. |

| `totalFeeBeforeTax` | `numeric` | | Tổng chưa thuế (Sum Net Prices). |

| `totalFeeBeforeTaxAndDiscount` | `numeric` | | Tổng giá niêm yết (Sum List Prices - trước khi trừ chiết khấu). |

| `totalTaxValue` | `numeric` | | Giá trị thuế |

| `totalDiscountValue` | `numeric` | | Giá trị giảm giá |

| `orderStatus` | `text` | | `Pending`, `Processing`, `Completed`, `Cancelled`. |

| `taxRate` | `numeric` | | Thuế suất áp dụng chung. |

| `discountRate` | `numeric` | | Số tiền/Phần trăm chiết khấu (trên tổng chưa thuế). |

| `paymentStatus` | `text` | | `Unpaid`, `Partial`, `Paid`, `Debt`. |

| `transactions` | `jsonb[]` | | Lịch sử thanh toán: `[{ amount, date, method, note }]`. |

| `orderUri` | `text` | | Token/Link truy cập công khai cho phiếu gửi mẫu. |

| `requestForm` | `text` | | Toàn bộ nội dung HTML của Phiếu gửi mẫu (từ Editor). |

| `totalPaid` | `numeric` | | Tổng số tiền đã thanh toán (cached từ transactions). |
| `invoiceNumbers` | `text[]` | | Danh sách số hóa đơn VAT đã xuất. |
| `receiptId` | `text` | **FK** | Link tới `lab.receipts` (phiếu tiếp nhận). |
| `requestDate` | `timestamp` | | Ngày khách hàng yêu cầu (ngày gửi mẫu dự kiến). |
| `paymentDate` | `timestamp` | | Ngày thanh toán hoàn tất. |
| `orderNote` | `text` | | Ghi chú nội bộ về đơn hàng. |
| _Audit Cols_ | ... | | |

#### 3. Bảng `quotes` (Báo giá)

Bảng này cập nhật logic sử dụng `matrixId` để tham chiếu giá và phương pháp.

| Column Name | Type | Key | Description |

| :----------------------------- | :-------- | :----- | :------------------------------------------------------------------------------------------------------------------------------- |

| `quoteId` | `text` | **PK** | Custom Text ID. |

| `quoteCode` | `text` | | Mã báo giá (Readable). |

| `clientId` | `text` | **FK** | |

| `client` | `jsonb` | | Structure: `{clientId, legalId, clientName, clientAddress, clientEmail, invoiceInfo:{taxAddress, taxCode, taxName, taxEmail } }` |

| `salePersonId` | `text` | | |

| `salePerson` | `text` | | Tên Sale phụ trách. |

| `contactPerson` | `jsonb` | | Structure: `{ contactName, contactPhone, contactEmail, contactPosition, contactAddress, contactId }` |

| `samples` | `jsonb[]` | | Danh sách mẫu & chỉ tiêu. Chi tiết dùng `matrixId`. |

| `totalFeeBeforeTax` | `numeric` | | Tổng chưa thuế (Sum Net Prices). |

| `totalFeeBeforeTaxAndDiscount` | `numeric` | | Tổng giá niêm yết (Sum List Prices). |

| `totalTaxValue` | `numeric` | | Giá trị thuế |

| `totalDiscountValue` | `numeric` | | Giá trị giảm giá |

| `taxRate` | `numeric` | | Thuế suất áp dụng chung. |

| `discount` | `numeric` | | Số tiền/Phần trăm chiết khấu (trên tổng chưa thuế). |

| `totalAmount` | `numeric` | | Tổng tiền cuối cùng. |

| `quoteStatus` | `text` | | `Draft`, `Sent`, `Approved`, `Expired`. |

| _Audit Cols_ | ... | | |

#### 4. Bảng `incomingRequests` (Yêu cầu tiếp nhận)

Bảng trung gian lưu trữ các yêu cầu gửi mẫu từ bên ngoài (Email, Zalo, Portal) trước khi chuyển thành Đơn hàng chính thức. Cấu trúc mở rộng tương đồng với Đơn hàng để mapping dữ liệu 1-1.

| Column Name                    | Type        | Key    | Description                                                                    |
| :----------------------------- | :---------- | :----- | :----------------------------------------------------------------------------- |
| `requestId`                    | `text`      | **PK** | Custom Text ID (VD: `REQ-2601-001`).                                           |
| `requestDate`                  | `timestamp` |        | Thời điểm nhận yêu cầu.                                                        |
| `senderInfo`                   | `jsonb`     |        | `{ name, phone, email, source }`.                                              |
| `requestContent`               | `text`      |        | Nội dung ghi chú sơ bộ.                                                        |
| `documentIds`                  | `text[]`    |        | Danh sách file đính kèm `document.documents`.                                  |
| `quoteId`                      | `text`      | **FK** | Tham chiếu báo giá nguồn (nếu có).                                             |
| `clientId`                     | `text`      | **FK** | Khách hàng (nếu đã xác định).                                                  |
| `client`                       | `jsonb`     |        | Snapshot thông tin khách hàng.                                                 |
| `contactPerson`                | `jsonb`     |        | Thông tin người liên hệ.                                                       |
| `reportRecipient`              | `jsonb`     |        | Người nhận báo cáo.                                                            |
| `salePersonId`                 | `text`      | **FK** | ID nhân viên kinh doanh.                                                       |
| `salePerson`                   | `text`      |        | Tên Sale.                                                                      |
| `saleCommissionPercent`        | `numeric`   |        | % Hoa hồng.                                                                    |
| `samples`                      | `jsonb[]`   |        | Chi tiết mẫu & chỉ tiêu (Xem cấu trúc JSON phía dưới).                         |
| `totalAmount`                  | `numeric`   |        | Tổng tiền.                                                                     |
| `totalFeeBeforeTax`            | `numeric`   |        |                                                                                |
| `totalFeeBeforeTaxAndDiscount` | `numeric`   |        |                                                                                |
| `totalTaxValue`                | `numeric`   |        |                                                                                |
| `totalDiscountValue`           | `numeric`   |        |                                                                                |
| `taxRate`                      | `numeric`   |        |                                                                                |
| `discountRate`                 | `numeric`   |        |                                                                                |
| `incomingStatus`               | `text`      |        | Trạng thái xử lý yêu cầu: `New`, `Processing`, `Converted`, `Rejected`.        |
| `linkedOrderId`                | `text`      | **FK** | Link tới `orders` khi process thành công.                                      |
| `orderUri`                     | `text`      |        | Link public (nếu tạo từ Portal).                                               |
| `requestForm`                  | `text`      |        | HTML nội dung phiếu.                                                           |
| `orderId`                      | `text`      | **FK** | Link tới `crm.orders` khi đã convert.                                          |
| `receiptId`                    | `text`      | **FK** | Link tới `lab.receipts` khi đã tạo phiếu.                                      |
| `orderStatus`                  | `text`      |        | Cached trạng thái đơn hàng: `Pending`, `Processing`, `Completed`, `Cancelled`. |
| `paymentStatus`                | `text`      |        | Cached trạng thái thanh toán: `Unpaid`, `Partial`, `Paid`.                     |
| _Audit Cols_                   | ...         |        |                                                                                |

#### 5. Bảng `transactions` (Giao dịch tài chính)

Lưu trữ log giao dịch ngân hàng (SMS/Banking) để đối soát và gạch nợ tự động.

| Column Name       | Type        | Key    | Description                                                        |
| :---------------- | :---------- | :----- | :----------------------------------------------------------------- |
| `transactionId`   | `text`      | **PK** | Custom Text ID (VD: `TRX-88291`).                                  |
| `transactionDate` | `timestamp` |        | Thời điểm phát sinh giao dịch.                                     |
| `amount`          | `numeric`   |        | Số tiền giao dịch.                                                 |
| `currency`        | `text`      |        | Đơn vị tiền tệ (VND).                                              |
| `content`         | `text`      |        | Nội dung giao dịch (Raw text từ Bank/SMS).                         |
| `senderBank`      | `text`      |        | Ngân hàng đối tác/Số tài khoản.                                    |
| `refType`         | `text`      |        | Loại giao dịch: `Incoming` (Tiền về), `Outgoing` (Hoàn tiền/Chi).  |
| `refOrderId`      | `text`      | **FK** | (Optional) Map vào đơn hàng nào.                                   |
| `status`          | `text`      |        | `Unmapped` (Chưa khớp), `Mapped` (Đã gạch nợ), `Ignored` (Bỏ qua). |
| _Audit Cols_      | ...         |        |                                                                    |

#### 6. Bảng `complaints` (Khiếu nại - QT-GQKN-07)

Quản lý khiếu nại và yêu cầu điều chỉnh kết quả từ khách hàng.

| Column Name         | Type      | Key    | Description                                                          |
| :------------------ | :-------- | :----- | :------------------------------------------------------------------- |
| `complaintId`       | `text`    | **PK** | Custom ID (VD: `CMP-2601-001`).                                      |
| `reportId`          | `text`    | **FK** | Báo cáo bị khiếu nại (`document.reports`).                           |
| `receiptId`         | `text`    | **FK** | Phiếu tiếp nhận liên quan.                                           |
| `clientId`          | `text`    | **FK** | Khách hàng khiếu nại.                                                |
| `complaintType`     | `text`    |        | `AdminError` (sai hành chính), `ResultDispute` (tranh chấp kết quả). |
| `complaintContent`  | `text`    |        | Nội dung khiếu nại chi tiết.                                         |
| `complaintStatus`   | `text`    |        | `Open`, `Investigating`, `Resolved`, `Rejected`.                     |
| `resolution`        | `text`    |        | Kết quả xử lý khiếu nại.                                             |
| `requiresRetest`    | `boolean` |        | Cần thử lại không?                                                   |
| `retestAnalysisIds` | `text[]`  |        | Danh sách `analysisId` cần retest.                                   |
| _Audit Cols_        | ...       |        |                                                                      |

#### 6. Bảng `complaints` (Khiếu nại - QT-GQKN-07)

Quản lý khiếu nại và yêu cầu điều chỉnh kết quả từ khách hàng.

| Column Name         | Type      | Key    | Description                                                     |
| :------------------ | :-------- | :----- | :-------------------------------------------------------------- |
| `complaintId`       | `text`    | **PK** | Custom ID (VD: `CMP-2601-001`).                                 |
| `reportId`          | `text`    | **FK** | Báo cáo bị khiếu nại (`document.reports`).                      |
| `receiptId`         | `text`    | **FK** | Phiếu tiếp nhận liên quan.                                      |
| `clientId`          | `text`    | **FK** | Khách hàng khiếu nại.                                           |
| `complaintType`     | `text`    |        | `AdminError` (sai hành chính), `ResultDispute` (tranh chấp KQ). |
| `complaintContent`  | `text`    |        | Nội dung khiếu nại chi tiết.                                    |
| `complaintStatus`   | `text`    |        | `Open`, `Investigating`, `Resolved`, `Rejected`.                |
| `resolution`        | `text`    |        | Kết quả xử lý khiếu nại.                                        |
| `requiresRetest`    | `boolean` |        | Cần thử lại không?                                              |
| `retestAnalysisIds` | `text[]`  |        | Danh sách `analysisId` cần retest.                              |
| _Audit Cols_        | ...       |        |                                                                 |

---

### C. SCHEMA LIBRARY (`library`)

Chứa các bảng danh mục cấu hình.

#### 1. Bảng `matrices` (Ma trận cấu hình & Giá)

Bảng trung gian quan trọng nhất, kết hợp 3 bảng trên để tạo ra đơn giá và ngưỡng kỹ thuật.

| Column Name | Type | Key | Description |

| :---------------------- | :-------- | :----- | :----------------------------------------------------- |

| `matrixId` | `text` | **PK** | ID tùy chỉnh (VD: `MAT001`). |

| `parameterId` | `text` | | (Optional) Tham chiếu `parameters` nếu có. |

| `protocolId` | `text` | | (Optional) Tham chiếu `protocols` nếu có. |

| `sampleTypeId` | `text` | **FK** | Tham chiếu `sampleTypes`. |

| `protocolCode` | `text` | | Mã phương pháp (Nhập trực tiếp hoặc từ protocol). |

| `protocolSource` | `text` | | Nguồn phương pháp. |

| `protocolAccreditation` | `jsonb` | | Phạm vi được công nhận của phương pháp. |

| `parameterName` | `text` | | Tên chỉ tiêu (Nhập trực tiếp). |

| `sampleTypeName` | `text` | | Tham chiếu `sampleTypes`. |

| `feeBeforeTax` | `numeric` | | Đơn giá trước thuế. |

| `taxRate` | `numeric` | | Thuế suất (8, 10...). |

| `feeAfterTax` | `numeric` | | Đơn giá sau thuế (Niêm yết). |

| `LOD` | `text` | | Giới hạn phát hiện (Limit of Detection). |

| `LOQ` | `text` | | Giới hạn định lượng (Limit of Quantitation). |

| `thresholdLimit` | `text` | | Ngưỡng quy chuẩn cho phép (Để đánh giá Đạt/Không đạt). |

| `turnaroundTime` | `int` | | Thời gian thực hiện tiêu chuẩn (số ngày). |

| `technicianGroupId` | `text` | | Tổ chuyên môn phụ trách. |

| _Audit Cols_ | ... | | |

#### 2. Bảng `protocols` (Phương pháp thử - SOP)

Danh mục các tiêu chuẩn áp dụng (TCVN, ISO, ASTM...).

| Column Name | Type | Key | Description |

| :---------------------- | :------ | :----- | :---------------------------------------------------------------------- |

| `protocolId` | `text` | **PK** | ID tùy chỉnh (VD: `PRO001`). |

| `protocolCode` | `text` | | Mã hiệu (VD: `TCVN 6661-1:2011`). |

| `protocolSource` | `text` | | Nguồn ban hành (ISO, AOAC, EPA...). |

| `protocolAccreditation` | `jsonb` | | Phạm vi được công nhận của phương pháp: `{"VILAS": true, "TDC": true}`. |

| `protocolTitle` | `text` | | Tên đầy đủ của phương pháp (VD: "Xác định hàm lượng Chì bằng AAS"). |

| `protocolDescription` | `text` | | Mô tả phương pháp |

| `protocolDocumentIds` | `text[]` | **FK** | Danh sách ID tài liệu liên quan (`document.documents`). |

| `parameters` | `jsonb` | | Danh sách chỉ tiêu: `[{parameterId, parameterName}]`. |

| `sampleTypes` | `jsonb` | | Danh sách loại mẫu: `[{sampleTypeId, sampleTypeName}]`. |

| `chemicals` | `jsonb` | | **[Deprecated]** Sử dụng định mức trong bảng `matrixChemicals` thay thế. |

| _Audit Cols_ | ... | | |

#### 3. Bảng `parameters` (Chỉ tiêu phân tích)

Lưu trữ danh tính của các chỉ tiêu hóa/lý/vi sinh.

| Column Name | Type | Key | Description |

| :---------------- | :------ | :----- | :--------------------------------------------- |

| `parameterId` | `text` | **PK** | ID tùy chỉnh (VD: `PAR001`). |

| `parameterName` | `text` | | Tên chỉ tiêu (VD: `Chì (Pb)`, `Tổng số VSV`). |

| `displayStyle` | `jsonb` | | Cấu hình hiển thị dạng markdown {"displayStyle": {"eng": "<tên tiếng anh>", "default": "<tên tiếng Việt>"}}. |

| `technicianAlias` | `text` | | Mã vị trí phụ trách chính cho chỉ tiêu. |

| `technicianGroupId` | `text` | | ID nhóm kỹ thuật viên phụ trách chỉ tiêu. |

| `parameterSearchKeys` | `text[]` | | Danh sách các từ khóa để tìm kiếm chỉ tiêu. |

| `parameterStatus` | `text` | | Trạng thái chỉ tiêu (Active/Inactive). |

| `parameterNote` | `text` | | Ghi chú cho chỉ tiêu. |

| _Audit Cols_ | ... | | |

#### 4. Bảng `sampleTypes` (Loại mẫu/Nhóm sản phẩm)

Phân loại mẫu để áp dụng đơn giá và ngưỡng quy chuẩn.

| Column Name | Type | Key | Description |

| :----------------- | :------ | :----- | :-------------------------------------------------- |

| `sampleTypeId` | `text` | **PK** | ID tùy chỉnh (VD: `ST001`). |

| `sampleTypeName` | `text` | | Tên (VD: `Thực phẩm bảo vệ sức khỏe`, `Nước thải`). |

| `displayTypeStyle` | `jsonb` | | {eng: <tên tiếng anh>, default: <tên tiếng Việt>} |

| _Audit Cols_ | ... | | |

#### 5. Bảng `parameterGroups` (Nhóm chỉ tiêu / Gói kiểm)

Bảng định nghĩa các gói/nhóm chỉ tiêu để tư vấn bán hàng và báo giá nhanh.

| Column Name | Type | Key | Description |

| :------------------------ | :-------------- | :----- | :----------------------------------------------------------------- |

| `groupId` | `text` | **PK** | Mã nhóm chỉ tiêu (Custom Text ID). |

| `groupName` | `text` | | Tên nhóm chỉ tiêu (VD: Gói kiểm nhanh thực phẩm). |

| `matrixIds` | `text[]` | | Mảng mã liên kết với bảng `library.matrices`. (GIN Index support). |

| `groupNote` | `text` | | Ghi chú cho nhóm chỉ tiêu. |

| `sampleTypeId` | `text` | **FK** | Link ID loại sản phẩm (`library.sampleTypes`). |

| `sampleTypeName` | `text` | | Snapshot tên loại sản phẩm áp dụng. |

| `feeBeforeTaxAndDiscount` | `numeric(15,2)` | | Giá tiền trước giảm giá. Default 0. |

| `discountRate` | `numeric(5,2)` | | Giảm giá (%). Default 0. |

| `feeBeforeTax` | `numeric(15,2)` | | Giá tiền sau giảm giá (Trước thuế). Default 0. |

| `taxRate` | `numeric(5,2)` | | Thuế suất (%). Default 0. |

| `feeAfterTax` | `numeric(15,2)` | | Giá tiền sau thuế. Default 0. |

| _Audit Cols_ | ... | | |

**Indexes:**

- `idx_paramgroup_sampletype` on `sampleTypeId` (Lọc gói theo ngành hàng).

- `idx_paramgroup_matrices` (GIN) on `matrixIds` (Tìm gói chứa matrixId cụ thể).

#### 6. Bảng `matrixChemicals` (Định mức hóa chất - BOM)

Bảng này định mức lượng hóa chất cần thiết cho mỗi test (matrix), hỗ trợ tự động trừ lùi tồn kho thực tế.

| Column Name        | Type      | Key    | Description                                      |
| :----------------- | :-------- | :----- | :----------------------------------------------- |
| `matrixChemicalId` | `text`    | **PK** | ID định mức (Tự động sinh hoặc UUID).            |
| `matrixId`         | `text`    | **FK** | Liên kết với bài test trong `matrices`.          |
| `chemicalSku`      | `text`    | **FK** | Liên kết với Bảng Kho (`inventory.chemicals`).   |
| `chemicalName`     | `text`    |        | **[Snapshot]** Tên hóa chất (VD: `Axit Nitric`). |
| `consumedQty`      | `numeric` |        | Lượng tiêu hao dự kiến.                          |
| `measurementUnit`  | `text`    |        | Đơn vị định mức (VD: `ml`, `g`).                 |
| _Audit Cols_       | ...       |        |                                                  |

---

### D. SCHEMA LAB (`lab`)

Các bảng vận hành phòng thí nghiệm, quản lý mẫu và kết quả.

#### 1. Bảng `receipts` (Phiếu tiếp nhận)

Lưu trữ thông tin giao dịch nhận mẫu. Trạng thái phiếu phản ánh tiến độ chung của cả đơn hàng kiểm nghiệm.

| Column Name | Type | Key | Description |

| :---------------------- | :---------- | :----- | :----------------------------------------------------------------------------------------------------------------------------------- |

| `receiptId` | `text` | **PK** | ID nội bộ (Custom ID). |

| `receiptCode` | `text` | **UQ** | Mã hồ sơ lưu trữ (VD: `26a1234`). |

| `receiptStatus` | `text` | | Trạng thái:<br>- Draft: Nháp (đang nhập liệu, chưa nhận mẫu).<br>- Received: Đã nhận mẫu & xác nhận yêu cầu.<br>- Processing: Đang trong quá trình thử nghiệm (có ít nhất 1 chỉ tiêu đang chạy).<br>- Completed: Tất cả chỉ tiêu đã có kết quả (chờ xuất báo cáo).<br>- Reported: Đã phát hành báo cáo/trả kết quả cho khách.<br>- Cancelled: Hủy phiếu. |

| `receiptDate` | `timestamp` | | Ngày/giờ nhận mẫu thực tế. |

| `receiptDeadline` | `timestamp` | | Hạn trả kết quả cam kết với khách. |

| `receiptNote` | `text` | | Ghi chú nội bộ cho cả phiếu. |

| `receiptPriority` | `text` | | Mức độ ưu tiên: `Normal`, `Urgent`, `Flash`. |

| `receiptDeliveryMethod` | `text` | | Cách thức nhận: `HandOver`, `Post`, `Pickup`. |

| `receiptTrackingNo` | `text` | | Mã vận đơn (nếu gửi qua bưu điện/ship). |

| `orderId` | `text` | **FK** | Link tới đơn hàng (CRM). |

| `order` | `jsonb` | | **(Snapshot)** Thông tin đơn hàng tại thời điểm nhận. |

| `clientId` | `text` | | ID Khách hàng (để search nhanh). |

| `client` | `jsonb` | | <br>Structure: `{clientId, legalId, clientName, clientAddress, clientEmail, invoiceInfo:{taxAddress, taxCode, taxName, taxEmail } }` |

| `contactPerson` | `jsonb` | | **(Snapshot)** Người liên hệ: `{ contactName, contactPhone, contactEmail, contactPosition, contactAddress, contactId }`. |

| `reportRecipient` | `jsonb` | | **(Snapshot)** Người nhận báo cáo: `{ receiverName, receiverPhone, receiverAddress, receiverEmail}`. |

| `trackingNumber` | `text` | | Mã vận đơn (nếu gửi qua bưu điện/ship). |

| `senderInfo` | `jsonb` | | **(Snapshot)** Thông tin người giao phiếu kết quả . |

| `conditionCheck` | `jsonb` | | **(Snapshot)** Tình trạng mẫu khi nhận. |

| `reportConfig` | `jsonb` | | **(Snapshot)** Cấu hình trả báo cáo `{language, copies, sendSoftCopy}`. |
| `receptionistId` | `text` | **FK** | Nhân viên lễ tân/tiếp nhận thực hiện (QT-TNM-01). |
| `isBlindCoded` | `boolean` | | `true` nếu đã áp dụng mã hóa mù - Blind Sample (QT-XLM-02). |
| `receiptReceivedImageFileIds` | `text[]` | **FK** | Danh sách ID hình ảnh tiếp nhận mẫu (Link tới bảng `document.files`). |
| _Audit Cols_ | ... | | `createdAt`, `createdById`, `modifiedAt`, `modifiedById`, `deletedAt`. |

#### 2. Bảng `samples` (Mẫu thử nghiệm)

Lưu trữ vật thể mẫu vật lý. Trạng thái mẫu vật lý tập trung vào "vị trí" và "vòng đời" của vật thể đó.

| Column Name | Type | Key | Description |

| :-------------------- | :---------- | :----- | :------------------------------------------------------------------------- |

| `sampleId` | `text` | **PK** | ID nội bộ. |
| `sampleName` | `text` | | Tên mẫu. |

| `receiptId` | `text` | **FK** | Thuộc phiếu nhận nào. |

| `sampleTypeId` | `text` | **FK** | Link tới danh mục loại mẫu (`sampleTypes`). |

| `productType` | `text` | | Tính chất của sản phẩm (chất cấm , hàng có giá trị cao ,...). |

| `sampleTypeName` | `text` | | Tên loại nền mẫu (Thực phẩm, Thực phẩm bảo vệ sức khỏe, Dược liệu ,...). |

| `sampleClientInfo` | `text` | | Thông tin mẫu do khách hàng cung cấp (VD: "Nước đầu nguồn"). |

| `sampleInfo` | `jsonb[]` | | Thông tin chi tiết của mẫu (VD: `[{label: "value", value: "value"}]`). |

| `sampleReceiptInfo` | `jsonb[]` | | Thông liên quan đến thử nghiệm (VD: `[{label: "value", value: "value"}]`). |

| `sampleStatus` | `text` | | Trạng thái vòng đời mẫu:<br>- Received: Đã nhận (đang ở bộ phận nhận mẫu).<br>- InPrep: Đang xử lý sơ bộ (nghiền, sấy, tách...).<br>- Distributed: Đang ở phòng thí nghiệm (đã giao cho KTV).<br>- Retained: Lưu mẫu (Lưu kho sau khi thử nghiệm xong).<br>- Disposed: Đã tiêu hủy.<br>- Returned: Đã trả lại khách hàng. |

| `sampleVolume` | `text` | | Lượng mẫu tính theo vật chứa (1 chai 500ml, túi 20g ,..) |

| `sampleWeight` | `numeric` | | Lượng mẫu quy ra g |

| `samplePreservation` | `text` | | Điều kiện bảo quản (VD: "Axit hóa, 4°C"). |

| `sampleStorageLoc` | `text` | | Vị trí lưu kho (VD: "Tủ lạnh A - Ngăn 2"). |

| `sampleRetentionDate` | `timestamp` | | Ngày hết hạn lưu (dự kiến hủy). |

| `sampleDisposalDate` | `timestamp` | | Ngày hủy mẫu thực tế. |

| `sampleIsReference` | `boolean` | | `true` nếu là mẫu lưu/đối chứng. |

| `samplingInfo` | `jsonb` | | **(Object)** Thông tin lấy mẫu hiện trường. |

| `physicalState` | `text` | | Trạng thái vật lý (VD: "Solid"). |

| `sampleNote` | `text` | | Ghi chú về mẫu. |

| `parentSampleId` | `text` | **FK** | ID mẫu gốc nếu đây là aliquot/chia mẫu (QT-PCM-03). |
| `custodyLog` | `jsonb[]` | | Chuỗi bàn giao nội bộ (Chain of Custody): [{from, to, timestamp, note}] (QT-PCM-03). |
| `retentionServiceFee` | `numeric` | | Phí lưu mẫu theo yêu cầu, null = miễn phí (QT-LHM-06). |
| _Audit Cols_ | ... | | |

#### 3. Bảng `analyses` (Phép thử / Chỉ tiêu)

Lưu trữ công việc phân tích cụ thể. Trạng thái này quan trọng nhất để kiểm soát chất lượng (QA/QC), phân biệt rõ giữa việc "nhập kết quả" và "duyệt kết quả".

| Column Name | Type | Key | Description |

| :---------------------- | :---------- | :----- | :---------------------------------------------------------------------- |

| `analysisId` | `text` | **PK** | ID nội bộ. |

| `sampleId` | `text` | **FK** | Thuộc mẫu nào. |

| `matrixId` | `text` | **FK** | Link tới cấu hình Matrix (Giá, Method, LOD chuẩn). |

| `parameterId` | `text` | | ID chỉ tiêu (để filter nhanh). |

| `technicianId` | `text` | **FK** | KTV chịu trách nhiệm chính. |

| `technicianIds` | `text[]` | | KTV liên quan. |

| `equipmentId` | `text` | **FK** | Thiết bị sử dụng chính (Link tới bảng `equipment`). |

| `analysisStatus` | `text` | | Quy trình xử lý kết quả:<br>- Pending: Chờ xếp lịch/phân công.<br>- HandedOver: Đã cấp phát vật tư/Bàn giao mẫu.<br>- Testing: Đang thử nghiệm (KTV đang làm).<br>- DataEntered: Đã nhập kết quả sơ bộ (chờ soát xét kỹ thuật).<br>- TechReview: Đã qua soát xét kỹ thuật (Leader check).<br>- Approved: QA/Manager đã duyệt chốt kết quả.<br>- ReTest: Yêu cầu thử nghiệm lại (do sai số/nghi ngờ).<br>- Cancelled: Hủy chỉ tiêu này. |

| `analysisResult` | `text` | | Kết quả phân tích (Raw value). |

| `analysisResultStatus` | `text` | | Đánh giá: `Pass` (Đạt), `Fail` (Không đạt), `NotEvaluated`. |

| `analysisStartedAt` | `timestamp` | | Thời gian bắt đầu test. |

| `analysisCompletedAt` | `timestamp` | | Thời gian có kết quả. |

| `analysisUncertainty` | `text` | | Độ không đảm bảo đo (± U). |

| `analysisMethodLOD` | `text` | | **(Snapshot)** LOD tại thời điểm thử. |

| `analysisMethodLOQ` | `text` | | **(Snapshot)** LOQ tại thời điểm thử. |

| `analysisUnit` | `text` | | **(Snapshot)** Đơn vị đo (mg/L, CFU...). |

| `handoverInfo` | `jsonb[]` | | **(Object)** Ghi nhận kẹp cùng lúc cấp phát `{handedOverBy, receivedBy, timestamp}`. |

| `analysisReportDisplay` | `jsonb` | | **(Object)** Định dạng hiển thị trên báo cáo `{en,vi,cn,..}`. |

| `parameterName` | `text` | | **(Snapshot)** Tên chỉ tiêu. |

| `analysisLocation` | `text` | | Nơi thực hiện thử nghiệm. |

| `protocolCode` | `text` | | **(Snapshot)** Mã phương pháp (ISO/TCVN). |

| `qaReview` | `jsonb` | | **(Object)** Lịch sử duyệt `{reviewerId, comment, timestamp}`. |

| `rawData` | `jsonb` | | **(Object)** Link file gốc, sắc ký đồ `{fileId, url}`. |

| `analysisNotes` | `text` | | Ghi chú về mẫu. |
| `analysisDeadline` | `timestamp` | | Hạn thực hiện chỉ tiêu (QT-PCM-03). |
| `rawInputData` | `jsonb` | | Dữ liệu đầu vào thô (khối lượng, thể tích, thông số — QT-PTT-04). |
| `resultHistory` | `jsonb[]` | | Lịch sử sửa kết quả: [{oldValue, newValue, changedById, reason, timestamp}] (QT-PTT-04). |
| `consumablesUsed` | `jsonb` | | **(Mảng JSONB cực kỳ quan trọng)**: Nơi lưu trữ vật tư đã cấp phát thực tế: `[{itemCode, chemicalSku, chemicalName, lotNo, allocatedQty, unit, allocatedAt, allocatedBy, type}]`. |
| `retestReason` | `text` | | Lý do yêu cầu thử lại (analysisStatus=ReTest — QT-GQKN-07). |
| _Audit Cols_ | ... | | |

#### 4. Bảng `equipment` (Thiết bị phòng Lab)

Bổ sung để link với `analyses`.

| Column Name | Type | Key | Description |

| :------------------- | :---------- | :----- | :------------------------------------------- |

| `equipmentId` | `text` | **PK** | Custom ID (VD: `EQ-HPLC-01`). |

| `equipmentName` | `text` | | Tên thiết bị (VD: Hệ thống sắc ký lỏng). |

| `equipmentCode` | `text` | **UQ** | Mã tài sản cố định. |

| `equipmentStatus` | `text` | | `Active`, `Maintenance` (Bảo trì), `Broken`. |

| `equipmentCalibDate` | `timestamp` | | Ngày hiệu chuẩn gần nhất. |

| `equipmentNextCalib` | `timestamp` | | Ngày hiệu chuẩn tiếp theo. |

| `equipmentLog` | `jsonb` | | Lịch sử sử dụng/bảo trì. |

| _Audit Cols_ | ... | | |

#### 5. Bảng `inventoryItems` (Kho hóa chất & Vật tư)

Bổ sung để quản lý kho.

| Column Name | Type   | Key    | Description                   |
| :---------- | :----- | :----- | :---------------------------- |
| `itemId`    | `text` | **PK** | Custom ID (VD: `CHEM-H2SO4`). |
| `itemName`  | `text` |        | Tên hóa chất/dụng cụ.         |

| `itemType` | `text` | | `Chemical`, `Glassware`, `Consumable`, `StandardSubstance`. |

| `itemStockQty` | `numeric` | | Số lượng tồn kho hiện tại. |

| `itemUnit` | `text` | | Đơn vị tính (Lít, Gram, Hộp). |

| `itemLotNo` | `text` | | Số Lô (Lot Number). |

| `itemExpiryDate` | `timestamp` | | Hạn sử dụng. |

| `itemLocation` | `text` | | Vị trí cất giữ. |

| `itemCasNo` | `text` | | Mã CAS (đối với hóa chất). |

| _Audit Cols_ | ... | | |

#### 6. Bảng `solutions` (Dung dịch pha chế - QT-QLNL-09)

Quản lý vòng đời dung dịch được pha chế từ hóa chất gốc.

| Column Name      | Type        | Key    | Description                            |
| :--------------- | :---------- | :----- | :------------------------------------- |
| `solutionId`     | `text`      | **PK** | Custom ID.                             |
| `solutionName`   | `text`      |        | Tên dung dịch (VD: "HCl 0.1N").        |
| `parentItemId`   | `text`      | **FK** | Hóa chất gốc (`lab.inventoryItems`).   |
| `concentration`  | `text`      |        | Nồng độ pha chế.                       |
| `preparedById`   | `text`      | **FK** | Người pha chế (`identity.identities`). |
| `preparedAt`     | `timestamp` |        | Thời điểm pha chế.                     |
| `expiryDate`     | `timestamp` |        | Hạn sử dụng dung dịch.                 |
| `solutionStatus` | `text`      |        | `Active`, `Expired`, `Consumed`.       |
| `volume`         | `numeric`   |        | Thể tích (ml).                         |
| `lotNo`          | `text`      |        | Số lô nội bộ.                          |
| _Audit Cols_     | ...         |        |                                        |

#### 7. Bảng `workAssignments` (Phân công - QT-PCM-03)

Quản lý phân công công việc giữa các tổ phân tích.

| Column Name         | Type        | Key    | Description                              |
| :------------------ | :---------- | :----- | :--------------------------------------- |
| `assignmentId`      | `text`      | **PK** | Custom ID.                               |
| `receiptId`         | `text`      | **FK** | Phiếu tiếp nhận được phân công.          |
| `technicianGroupId` | `text`      |        | Tổ chuyên môn được phân công.            |
| `assignedById`      | `text`      | **FK** | Người phân công (`identity.identities`). |
| `assignedAt`        | `timestamp` |        | Thời điểm phân công.                     |
| `workloadNote`      | `text`      |        | Ghi chú tình trạng tải công việc.        |
| `status`            | `text`      |        | `Assigned`, `Reallocated`, `Completed`.  |
| _Audit Cols_        | ...         |        |                                          |

#### 6. Bảng `solutions` (Dung dịch pha chế - QT-QLNL-09)

Quản lý vòng đời dung dịch được pha chế từ hóa chất gốc.

| Column Name      | Type        | Key    | Description                            |
| :--------------- | :---------- | :----- | :------------------------------------- |
| `solutionId`     | `text`      | **PK** | Custom ID.                             |
| `solutionName`   | `text`      |        | Tên dung dịch (VD: "HCl 0.1N").        |
| `parentItemId`   | `text`      | **FK** | Hóa chất gốc (`lab.inventoryItems`).   |
| `concentration`  | `text`      |        | Nồng độ pha chế.                       |
| `preparedById`   | `text`      | **FK** | Người pha chế (`identity.identities`). |
| `preparedAt`     | `timestamp` |        | Thời điểm pha chế.                     |
| `expiryDate`     | `timestamp` |        | Hạn sử dụng dung dịch.                 |
| `solutionStatus` | `text`      |        | `Active`, `Expired`, `Consumed`.       |
| `volume`         | `numeric`   |        | Thể tích (ml).                         |
| `lotNo`          | `text`      |        | Số lô nội bộ.                          |
| _Audit Cols_     | ...         |        |                                        |

#### 7. Bảng `workAssignments` (Phân công - QT-PCM-03)

Quản lý phân công công việc giữa các tổ phân tích.

| Column Name         | Type        | Key    | Description                              |
| :------------------ | :---------- | :----- | :--------------------------------------- |
| `assignmentId`      | `text`      | **PK** | Custom ID.                               |
| `receiptId`         | `text`      | **FK** | Phiếu tiếp nhận được phân công.          |
| `technicianGroupId` | `text`      |        | Tổ chuyên môn được phân công.            |
| `assignedById`      | `text`      | **FK** | Người phân công (`identity.identities`). |
| `assignedAt`        | `timestamp` |        | Thời điểm phân công.                     |
| `workloadNote`      | `text`      |        | Ghi chú tình trạng tải công việc.        |
| `status`            | `text`      |        | `Assigned`, `Reallocated`, `Completed`.  |
| _Audit Cols_        | ...         |        |                                          |

---

### E. SCHEMA DOCUMENT (`document`)

Liên quan đến file và tài liệu.

#### 1. Bảng `files` (Quản lý File vật lý)

| Column Name | Type | Key | Description |

| :----------- | :------- | :----- | :------------------------------------------------------ |

| `fileId` | `text` | **PK** | Custom Text ID. |

| `fileName` | `text` | | Tên file gốc. |

| `mimeType` | `text` | | Loại file (pdf, image/png...). |

| `fileSize` | `bigint` | | Kích thước (bytes). |

| `uris` | `text[]` | | Các đường dẫn truy cập (S3 URL, CDN URL). |

| `fileStatus` | `text` | | Trạng thái file (Pending, Synced, Deleted, ...). |

| `commonKeys` | `text[]` | | Các khóa chung (Common Keys) |

| `fileTags` | `text[]` | | Tag phân loại: `Order`, `Report`, `Contract`,... |

| `opaiFile` | `jsonb` | | Metadata nếu file được sync sang OpenAI (Vector Store). |

| _Audit Cols_ | ... | | |

#### 2. Bảng `documents` (Tài liệu nghiệp vụ)

| Column Name | Type | Key | Description |

| :------------ | :------ | :----- | :-------------------------------------------------------- |

| `documentId` | `text` | **PK** | Custom Text ID. |

| `documentTitle` | `text` | | Tiêu đề tài liệu. |

| `fileId` | `text` | **FK** | Link tới file vật lý. |

| `refId` | `text` | | ID tham chiếu (receiptId, orderId...). |

| `refType` | `text` | | Loại tham chiếu (`Receipt`, `Order`). |

| `commonKeys` | `text[]` | | Các khóa chung (Common Keys) |

| `documentStatus` | `text` | | Trạng thái tài liệu (Draft, Issued, Revised, Cancelled). |

| `jsonContent` | `jsonb` | | Dữ liệu thô dùng để generate file (để re-render nếu cần). |

| _Audit Cols_ | ... | | |

#### 3. Bảng `reports` (Báo cáo Kết quả)

| Column Name | Type | Key | Description |

| :----------- | :----- | :----- | :--------------------------- |

| `reportId` | `text` | **PK** | Custom Text ID. |

| `receiptId` | `text` | **FK** | |

| `sampleId` | `text` | **FK** | |

| `header` | `text` | | HTML Header tùy chỉnh. |

| `content` | `text` | | HTML Content (Bảng kết quả). |

| `footer` | `text` | | HTML Footer (Chữ ký). |

| `reportStatus` | `text` | | Trạng thái: `Draft`, `Issued`, `Revised`, `Cancelled` (QT-KDB-05). |
| `reportRevision` | `int` | | Số phiên bản, 0 = bản gốc, 1 = Rev01 (QT-GQKN-07). |
| `reportRevisionNote` | `text` | | Lý do sửa đổi phiên bản báo cáo. |
| `replacedByReportId` | `text` | **FK** | ID báo cáo thay thế bản này (nếu revise). |
| `signatures` | `jsonb[]` | | Ký số: [role, identityId, name, signedAt, method] (QT-KDB-05). |
| `complaintId` | `text` | **FK** | Link tới `crm.complaints` (QT-GQKN-07). |
| _Audit Cols_ | ... | | |

---

### F. SCHEMA SERVICE (`service`)

Liên quan đến các dịch vụ ngoài và hỗ trợ.

#### 1. Bảng `opai` (OpenAI Logs)

| Column Name | Type | Key | Description |

| :-------------- | :------ | :----- | :------------------------------------------------------- |

| `messageOpaiId` | `text` | **PK** | Custom Text ID. |

| `role` | `text` | | `user`, `assistant`, `system`. |

| `content` | `text` | | Nội dung trao đổi. |

| `tokenUsage` | `jsonb` | | `{ promptTokens, completionTokens, totalTokens }`. |

| `contextId` | `text` | | ID ngữ cảnh (VD: ID phiên chat, ID tài liệu đang xử lý). |

| _Audit Cols_ | ... | | |

#### 2. Bảng `ShipmentOrder` (service.shipments)

| Column Name      | Type                       | Key    | Description                              |
| :--------------- | :------------------------- | :----- | :--------------------------------------- |
| `shipmentId`     | `text`                     | **PK** | ID định danh (was `id`)                  |
| `createdAt`      | `timestamp with time zone` |        | Thời điểm tạo bản ghi                    |
| `modifiedAt`     | `timestamp with time zone` |        | Thời điểm cập nhật (was `updatedAt`)     |
| `createdById`    | `text`                     |        | ID người tạo (was `createdByUID`)        |
| `sender`         | `jsonb`                    |        | Thông tin người gửi                      |
| `receiver`       | `jsonb`                    |        | Thông tin người nhận                     |
| `product`        | `jsonb`                    |        | Thông tin hàng hóa                       |
| `order`          | `jsonb`                    |        | Thông tin đơn hàng (VTP)                 |
| `items`          | `jsonb[]`                  |        | Danh sách chi tiết hàng hóa              |
| `commonKeys`     | `text[]`                   |        | Các mã tham chiếu (was `foreignKeyUIDs`) |
| `receiptIds`     | `text[]`                   |        | ID phiếu nhập (VTP)                      |
| `status`         | `text`                     |        | Trạng thái vận đơn                       |
| `trackingNumber` | `text`                     |        | Mã vận đơn (VTP)                         |
| `shipmentDate`   | `timestamp with time zone` |        | Ngày gửi                                 |
| `deliveryDate`   | `timestamp with time zone` |        | Ngày giao                                |
| `fee`            | `integer`                  |        | Cước phí                                 |
| `note`           | `text`                     |        | Ghi chú                                  |

#### 3. Các bảng khác (Placeholder)

- **suppliers**: Nhà cung cấp vật tư.

- **subcontractors**: Nhà thầu phụ phân tích mẫu gửi ngoài.

---

### G. SCHEMA INVENTORY (`inventory`)

Hệ thống quản lý kho hóa chất thực tế và tự động trừ lùi (Auto-Deduction với FEFO). Mô đun này thay thế và mở rộng sâu hơn cho `lab.inventoryItems`.

#### 1. Bảng `chemicals` (Danh mục hóa chất Master)

| Column Name            | Type      | Key    | Description                                      |
| :--------------------- | :-------- | :----- | :----------------------------------------------- |
| `chemicalSku`          | `text`    | **PK** | Mã gốc của hóa chất (VD: `CHEM-HNO3-MERCK`).     |
| `chemicalCasNumber`    | `text`    |        | Số CAS.                                          |
| `chemicalName`         | `text`    |        | Tên gọi hóa chất.                                |
| `chemicalFormula`      | `text`    |        | Công thức hóa học.                               |
| `chemicalSupplier`     | `text`    |        | Nhà cung cấp mặc định.                           |
| `chemicalBaseUnit`     | `text`    |        | Đơn vị tính cơ bản (VD: `ml`, `g`).              |
| `chemicalTotalQty`     | `numeric` |        | Tổng lượng khả dụng (Tự động SUM từ bảng items). |
| `chemicalReorderLevel` | `numeric` |        | Tồn kho tối thiểu để cảnh báo đặt hàng.          |
| _Audit Cols_           | ...       |        |                                                  |

#### 2. Bảng `items` (Tồn kho thực tế - Quản lý theo lô & Lọ)

Bảng này sẽ bị tác động (trừ lùi) ngay tại thời điểm **Bàn giao/Cấp phát**.

| Column Name        | Type      | Key    | Description                                                    |
| :----------------- | :-------- | :----- | :------------------------------------------------------------- |
| `itemCode`         | `text`    | **PK** | Mã vạch/QR dán trên từng lọ (VD: `LOT123-BTL01`).              |
| `chemicalSku`      | `text`    | **FK** | Liên kết `chemicals`.                                          |
| `itemLotNumber`    | `text`    |        | Số lô của nhà sản xuất.                                        |
| `itemAvailableQty` | `numeric` |        | Thể tích/Khối lượng còn khả dụng.                              |
| `itemExpDate`      | `date`    |        | Hạn sử dụng (Để chạy FEFO).                                    |
| `itemStatus`       | `text`    |        | `New` (Mới), `InUse` (Đang sử dụng), `Empty` (Hết), `Expired`. |
| _Audit Cols_       | ...       |        |                                                                |

---

## III. CHI TIẾT CẤU TRÚC JSONB

### 1. `matrixSnapshot` (Dùng trong Quote/Order/Analysis)

Để đảm bảo khi danh mục Matrix thay đổi giá, các đơn hàng cũ không bị ảnh hưởng.

```typescript

{

  "matrixId": "MAT-001",

  "fee": 500000,

  "tax": 8,

  "lod": "0.01",

  "loq": "0.03",

  "limit": "< 0.05",

  "protocol": "TCVN 1234"

}

```

### 2. `samples` in Order/Quote (Updated for Matrix)

Lưu danh sách yêu cầu phân tích, sử dụng `matrixId` để định danh chỉ tiêu & phương pháp.

### 2. `samples` in Order/Quote/IncomingRequest

Lưu danh sách yêu cầu phân tích với cấu trúc chi tiết hỗ trợ dynamic logic.

```json
[
    {
        "sampleName": "DAY CREAM SUNSCREEN",
        "sampleNote": "",
        "sampleMatrix": "Water",
        "analyses": [
            {
                "id": "temp-analysis-...",
                "parameterId": "PM148607",
                "parameterName": "Chỉ số chống nắng SPF",
                "matrixId": "MATe7aa1cf1",
                "quantity": 1,
                "unitPrice": 1800000,
                "feeBeforeTax": 1800000,
                "taxRate": 5,
                "tax": 90000,
                "feeAfterTax": 1890000,
                "discountRate": 0,
                "LOD": null,
                "LOQ": null,
                "thresholdLimit": null,
                "turnaroundTime": null,
                "sampleTypeName": "Mỹ phẩm",
                "protocolCode": null,
                "protocolSource": null
            }
        ]
    }
]
```

### 3. `client` Snapshot

```typescript
interface ClientSnapshot {
    clientId: string;

    legalId?: string;

    clientName: string;

    clientAddress: string;

    clientEmail: string;

    invoiceInfo?: {
        taxAddress: string;

        taxCode: string;

        taxName: string;

        taxEmail: string;
    };

    contact?: {
        // Deprecated/Moved to separate column but might still be kept in sync object for backward compat or ease of access

        contactName: string;

        contactPhone: string;

        contactEmail: string;

        contactPosition?: string;

        contactAddress?: string;

        contactId?: string;
    };
}
```

---

## IV. HƯỚNG DẪN TRIỂN KHAI & QUY ĐỊNH (IMPLEMENTATION GUIDELINES)

### 1. Naming Convention

- **Table Name**: Luôn là số nhiều, `camelCase` (VD: `sampleTypes`, `parameterProtocols`).

- **Column Name**: `camelCase` (VD: `isDeleted`, `totalAmount`).

- **Foreign Key**: `tableName` (số ít) + `Id` (VD: `sampleId`, `receiptId`).

### 2. Chiến \ `lược Indexing

- **Bắt buộc**: Index cho tất cả các cột Foreign Key.

- **Bắt buộc**: Index cho cột `deletedAt` (vì hầu hết các query đều filter `deletedAt IS NULL`).

- **Tối ưu**: Sử dụng `GIN Index` cho các cột `jsonb` nếu có nhu cầu search sâu vào object.

### 3. Ràng buộc toàn vẹn (Constraints)

- Sử dụng `ON DELETE RESTRICT` cho các bảng danh mục (Parameters, Protocols, Matrix) để tránh mất dữ liệu lịch sử khi một danh mục đang được sử dụng trong phiếu phân tích.

- Check Constraint cho các trường trạng thái (`status`) để đảm bảo đúng tập dữ liệu cho phép.

### 4. Schema Evolution

- Mọi thay đổi Schema phải được thực hiện qua **Migration Scripts**.

- Khi thêm cột mới, phải đảm bảo có giá trị Default hoặc cho phép Null để không làm gãy các Tenant đang hoạt động.

---

_Tài liệu này là tài sản trí tuệ của dự án LIMS Multi-Lab SaaS Platform. Mọi thay đổi phải được thông qua Lead Architect._
