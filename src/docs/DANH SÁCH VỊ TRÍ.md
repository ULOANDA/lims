### BẢNG DANH MỤC CHỨC VỤ VÀ SYSTEM ROLE (FULL LIST)

#### 1. Ban Lãnh đạo & Quản lý Thượng tầng (Executive & Management)

_Nhóm này chịu trách nhiệm pháp lý và định hướng chiến lược._

| Chức vụ (Job Title)                             | System Role Key     | Mô tả & Quyền hạn chính (Key Permissions)                                                                                                                                                             |
| :---------------------------------------------- | :------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Giám đốc Phòng thí nghiệm**<br>(Lab Director) | `ROLE_DIRECTOR`     | **Full View (Audit)**. Ký các báo cáo tài chính/hợp đồng lớn. Thường không can thiệp sửa kết quả kỹ thuật chi tiết nhưng có quyền xem tất cả Dashboard.                                               |
| **Quản lý Kỹ thuật**<br>(Technical Manager)     | `ROLE_TECH_MANAGER` | **Chịu trách nhiệm về độ chính xác**. Phê duyệt phương pháp mới, xử lý sự cố kỹ thuật (Technical Issue). Có quyền can thiệp sâu vào cấu hình `library.matrices` và `library.protocols`.               |
| **Quản lý Chất lượng**<br>(Quality Manager)     | `ROLE_QA_MANAGER`   | **Chịu trách nhiệm về tuân thủ (Compliance)**. Quản lý hệ thống tài liệu, đánh giá nội bộ, xử lý khiếu nại (Complaint). Có quyền truy cập `audit_logs` để thanh tra. Quản lý `qa.nc`, `system.risks`. |

---

#### 2. Khối Vận hành Kỹ thuật (Technical Operations)

_Nhóm trực tiếp tạo ra dữ liệu thử nghiệm._

| Chức vụ (Job Title)                                       | System Role Key       | Mô tả & Quyền hạn chính (Key Permissions)                                                                                                                                                                            |
| :-------------------------------------------------------- | :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Trưởng phòng/Trưởng bộ phận**<br>(Section Head)         | `ROLE_SECTION_HEAD`   | Quản lý một nhóm chuyên môn (VD: Trưởng phòng Vi sinh, Hóa lý). **Quyền Phân công (Assign)** mẫu cho KTV, duyệt sơ bộ kết quả của nhân viên cấp dưới. Cập nhật `technicianId`, `technicianIds` trong `lab.analysis`. |
| **Kiểm soát viên chất lượng**<br>(QC Officer / Validator) | `ROLE_VALIDATOR`      | Người soát xét kết quả (Reviewer). Kiểm tra lại dữ liệu thô (Raw data) của KTV trước khi trình Manager duyệt. Có quyền **Trả lại (Reject)** kết quả để làm lại. Cập nhật `status`, `qaReview`.                       |
| **Kiểm nghiệm viên chính**<br>(Senior Analyst)            | `ROLE_SENIOR_ANALYST` | KTV có kinh nghiệm. Được phép thực hiện các phép thử phức tạp, validation phương pháp. Có thể có quyền tự duyệt kết quả của chính mình ở một số chỉ tiêu đơn giản. Tạo/cập nhật `lab.solutions`.                     |
| **Kiểm nghiệm viên**<br>(Analyst / Technician)            | `ROLE_TECHNICIAN`     | **Quyền Nhập liệu (Data Entry)**. Chỉ nhìn thấy mẫu được giao, nhập kết quả, upload raw data. Không được sửa cấu hình giá/phương pháp. Cập nhật `resultValue`, `data`, `status` trong `lab.analysis`.                |
| **Nhân viên IPC**<br>(In-Process Control)                 | `ROLE_IPC_INSPECTOR`  | Lấy mẫu và kiểm tra nhanh ngay tại chuyền sản xuất. Quyền nhập kết quả nhanh trên mobile/tablet, báo động nếu sai lệch quy chuẩn.                                                                                    |
| **Nhân viên R&D**<br>(R&D Specialist)                     | `ROLE_RND_SPECIALIST` | Chuyên phát triển phương pháp mới. Có quyền tạo nháp các `protocol` và `matrix` mới trong thư viện thử nghiệm (Sandbox environment).                                                                                 |

---

#### 3. Khối Quản lý Mẫu & Hậu cần (Sample & Logistics)

_Nhóm đảm bảo đầu vào và tài nguyên._

| Chức vụ (Job Title)                                | System Role Key         | Mô tả & Quyền hạn chính (Key Permissions)                                                                                                                                                                      |
| :------------------------------------------------- | :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nhân viên nhận mẫu**<br>(Sample Receptionist)    | `ROLE_RECEPTIONIST`     | **Tạo mới Hồ sơ (Receipts)**. Kiểm tra tình trạng mẫu, mã hóa mẫu (Coding), in tem nhãn (Barcode/QR). Tạo/cập nhật `lab.receipt`, `lab.sample`. Tạo `logistics.shipments`.                                     |
| **Nhân viên lấy mẫu hiện trường**<br>(Sampler)     | `ROLE_SAMPLER`          | Dùng Mobile App. Check-in địa điểm (GPS), chụp ảnh hiện trường, tạo biên bản lấy mẫu (`samplingInfo`). Cập nhật `samplingInfo` trong `lab.sample`.                                                             |
| **Thủ kho mẫu**<br>(Sample Custodian)              | `ROLE_SAMPLE_CUSTODIAN` | Quản lý Kho lưu mẫu. Cập nhật vị trí lưu kho (`sampleStorageLoc`), thực hiện hủy mẫu (`Disposal`) và lập biên bản hủy. Cập nhật `status`, `sampleDisposalDate` trong `lab.sample`.                             |
| **Quản lý Thiết bị**<br>(Equipment Manager)        | `ROLE_EQUIPMENT_MGR`    | Quản lý hồ sơ thiết bị (`lab.equipment`). Cập nhật lịch hiệu chuẩn, bảo trì, upload hồ sơ máy. Khóa thiết bị khi hỏng. Cập nhật `equipmentStatus`, `equipmentCalibDate`, `equipmentNextCalib`, `equipmentLog`. |
| **Thủ kho Hóa chất/Vật tư**<br>(Inventory Manager) | `ROLE_INVENTORY_MGR`    | Quản lý `lab.inventory_items`. Nhập kho, xuất kho hóa chất, theo dõi hạn sử dụng, báo cáo tồn kho. Cập nhật `itemStockQty`, `itemLotNo`, `itemExpiryDate`, `itemLocation`.                                     |

---

#### 4. Khối Kinh doanh & Dịch vụ khách hàng (Commercial & Admin)

_Nhóm làm việc với khách hàng (đối với Lab dịch vụ)._

| Chức vụ (Job Title)                                | System Role Key       | Mô tả & Quyền hạn chính (Key Permissions)                                                                                                                                                                  |
| :------------------------------------------------- | :-------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Trưởng phòng Kinh doanh**<br>(Sales Manager)     | `ROLE_SALES_MANAGER`  | Xem toàn bộ doanh số, phê duyệt các báo giá có mức chiết khấu cao (`Discount Approval`). Phân bổ khách hàng cho Sale. Cập nhật `discount`, `discountRate` trong `crm.quotes`, `crm.orders`.                |
| **Nhân viên Kinh doanh**<br>(Sales Executive)      | `ROLE_SALES_EXEC`     | Tạo Báo giá (`Quotes`), tạo Đơn hàng (`Orders`), chăm sóc khách hàng. Chỉ xem được khách hàng của mình (Row-level security). Tạo/cập nhật `crm.clients`, `crm.quotes`, `crm.orders`. Tạo `crm.complaints`. |
| **Chăm sóc khách hàng**<br>(Customer Service - CS) | `ROLE_CS`             | Đầu mối liên lạc. Theo dõi tiến độ đơn hàng (`Receipt Status`) để trả lời khách. Gửi báo cáo kết quả (`Report Sending`). Xem `lab.receipt`, `lab.sample`, `document.reports`.                              |
| **Kế toán**<br>(Accountant)                        | `ROLE_ACCOUNTANT`     | Theo dõi công nợ, xuất hóa đơn (`Invoice`), xác nhận thanh toán (`Payment Confirm`). Cập nhật `paymentStatus`, `transactions` trong `crm.orders`.                                                          |
| **Admin báo cáo**<br>(Report Officer)              | `ROLE_REPORT_OFFICER` | Chuyên tổng hợp kết quả để soạn thảo báo cáo, format in ấn, xin chữ ký số. Tạo/cập nhật `document.reports`.                                                                                                |

---

#### 5. Khối Hỗ trợ & Hệ thống (System Support)

| Chức vụ (Job Title)                                 | System Role Key       | Mô tả & Quyền hạn chính (Key Permissions)                                                                                                                                                                              |
| :-------------------------------------------------- | :-------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Quản trị hệ thống**<br>(Super Admin / IT)         | `ROLE_SUPER_ADMIN`    | **God Mode**. Tạo Tenant mới, cấu hình phân quyền (Role Mapping), xem tất cả Log hệ thống. Quản lý `identity.identities`, `identity.sessions`. Xem tất cả audit columns.                                               |
| **Kiểm soát tài liệu**<br>(Document Controller)     | `ROLE_DOC_CONTROLLER` | Quản lý thư viện tài liệu quy trình (`file.info` - SOP, Form biểu). Phân phối tài liệu đến các bộ phận. Quản lý `library.standards`.                                                                                   |
| **Nhân viên An toàn & Môi trường**<br>(HSE Officer) | `ROLE_HSE_OFFICER`    | **Phụ trách an toàn phòng Lab**. Kiểm soát xử lý rác thải (`lab.inventory` - Disposal), đánh giá rủi ro an toàn (`system.risks`). Xem/cập nhật `system.risk_registers`, theo dõi disposal trong `lab.inventory_items`. |

---

### GỢI Ý MÔ HÌNH PHÂN CẤP (HIERARCHY) KHI TRIỂN KHAI

Để tránh việc phải gán quá nhiều role cho một user, bạn nên thiết kế chức năng **Role Inheritance (Kế thừa quyền)**:

1. `ROLE_LAB_MANAGER` sẽ tự động bao gồm quyền của `ROLE_SECTION_HEAD` và `ROLE_TECHNICIAN`.
2. `ROLE_SALES_MANAGER` sẽ bao gồm quyền của `ROLE_SALES_EXEC`.
3. `ROLE_QA_MANAGER` sẽ bao gồm quyền của `ROLE_VALIDATOR` và `ROLE_DOC_CONTROLLER`.

### VÍ DỤ JSON CẤU HÌNH CHO USER (Trong bảng `identities`)

Một user có thể kiêm nhiệm (Ví dụ: Lab nhỏ, Giám đốc kiêm luôn Quản lý kỹ thuật):

```json
// User: Nguyen Van A
{
    "identityName": "Nguyen Van A",
    "roles": ["ROLE_DIRECTOR", "ROLE_TECH_MANAGER"],
    "permissions": {
        "lab.approve_result": true,
        "finance.view_report": true
    }
}
```

---

### MAPPING VỚI DATABASE COLUMNS

#### 1. Cột `roles` (text[])

Lưu trữ danh sách các **System Role Key** được gán cho user.
Ví dụ: `['ROLE_DIRECTOR', 'ROLE_TECH_MANAGER']`

#### 2. Cột `positionInfo` (jsonb)

Lưu trữ thông tin chi tiết về vị trí công tác, phòng ban và cấp bậc quản lý.

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

**Lưu ý:** Code xử lý phân quyền sẽ dựa trên mảng `roles` này để map ra các Policy tương ứng (theo Ma trận phân quyền).
