# MA TRẬN PHÂN QUYỀN (PERMISSION MATRIX) - GRANULAR MODEL

Tài liệu này định nghĩa các **Nhóm quyền nhỏ (Permission Policies/Groups)**. Mỗi nhóm quyền tương ứng với một tập hợp chức năng nhỏ trong quy trình nghiệp vụ.
Các vị trí (Positions) sẽ được gán một hoặc nhiều nhóm quyền này để hình thành nên quyền hạn thực tế.

---

## 1. DANH SÁCH CÁC NHÓM QUYỀN (PERMISSION POLICIES)

### A. NHÓM QUYỀN CRM & BÁN HÀNG

| Mã nhóm quyền (Policy Code) | Tên nhóm quyền       | Mô tả chi tiết & Phạm vi                                                 |
| :-------------------------- | :------------------- | :----------------------------------------------------------------------- |
| **`POL_CRM_VIEW_BASIC`**    | Xem thông tin cơ bản | Quyền xem danh sách KH, Báo giá, Đơn hàng công khai hoặc của chính mình. |
| **`POL_CLIENT_MANAGE`**     | Quản trị Khách hàng  | Tạo mới, cập nhật thông tin khách hàng.                                  |
| **`POL_QUOTE_CREATE`**      | Tạo Báo giá          | Lập báo giá nháp, gửi báo giá cho khách.                                 |
| **`POL_DISCOUNT_APPROVE`**  | Duyệt Chiết khấu     | Quyền phê duyệt các mức giảm giá vượt khung cho phép.                    |
| **`POL_ORDER_PROCESS`**     | Xử lý Đơn hàng       | Chuyển đổi Báo giá -> Đơn hàng, cập nhật trạng thái đơn.                 |
| **`POL_SALES_ADMIN`**       | Admin Kinh doanh     | Xem tất cả doanh số, phân bổ khách hàng cho Sale khác (Bypass RLS).      |
| **`POL_REQUEST_MANAGE`**    | Quản lý Yêu cầu      | Tiếp nhận yêu cầu gửi mẫu, chuyển đổi sang đơn hàng hoặc từ chối.        |

### B. NHÓM QUYỀN TIẾP NHẬN & HẬU CẦN

| Mã nhóm quyền             | Tên nhóm quyền    | Mô tả chi tiết & Phạm vi                          |
| :------------------------ | :---------------- | :------------------------------------------------ |
| **`POL_RECEIPT_ENTRY`**   | Tạo Phiếu nhận    | Tiếp nhận yêu cầu, tạo hồ sơ nhận mẫu.            |
| **`POL_SAMPLE_LOG`**      | Đăng ký Mẫu       | Khai báo thông tin mẫu chi tiết vào hệ thống.     |
| **`POL_SAMPLE_CODING`**   | Mã hóa & Dán nhãn | Sinh mã mẫu (Barcode/QR), in tem, dán nhãn.       |
| **`POL_SAMPLE_STORE`**    | Lưu kho Mẫu       | Cập nhật vị trí lưu kho, thực hiện hủy mẫu.       |
| **`POL_SHIPMENT_CREATE`** | Tạo Vận đơn       | Kết nối đơn vị vận chuyển, tạo tracking logistic. |

### C. NHÓM QUYỀN PHÒNG THÍ NGHIỆM (LAB EXECUTION)

| Mã nhóm quyền                | Tên nhóm quyền         | Mô tả chi tiết & Phạm vi                                 |
| :--------------------------- | :--------------------- | :------------------------------------------------------- |
| **`POL_TEST_VIEW_ASSIGNED`** | Xem chỉ tiêu được giao | Chỉ xem được các phép thử được phân công cho mình (RLS). |
| **`POL_TEST_EXECUTE`**       | Thực hiện Phép thử     | Nhập kết quả thô, upload raw data.                       |
| **`POL_TEST_REVIEW`**        | Soát xét Kết quả (QC)  | Kiểm tra lại kết quả của KTV khác, Reject nếu sai.       |
| **`POL_TEST_APPROVE`**       | Duyệt Kết quả (Mgr)    | Phê duyệt cuối cùng để lên báo cáo.                      |
| **`POL_TEST_ASSIGN`**        | Phân công KTV          | Chia việc cho nhân viên cấp dưới.                        |
| **`POL_SOLUTION_PREP`**      | Pha chế Dung dịch      | Quản lý hóa chất pha chế, dung dịch chuẩn.               |

### D. NHÓM QUYỀN QUẢN LÝ TÀI NGUYÊN (RESOURCES)

| Mã nhóm quyền              | Tên nhóm quyền    | Mô tả chi tiết & Phạm vi                      |
| :------------------------- | :---------------- | :-------------------------------------------- |
| **`POL_EQUIPMENT_OPS`**    | Vận hành Thiết bị | Ghi nhật ký sử dụng máy (Logbook).            |
| **`POL_EQUIPMENT_MGR`**    | Quản lý Thiết bị  | Cập nhật hồ sơ máy, lịch hiệu chuẩn, bảo trì. |
| **`POL_INVENTORY_USE`**    | Sử dụng Hóa chất  | Xuất kho để sử dụng (Giảm tồn kho).           |
| **`POL_INVENTORY_IMPORT`** | Nhập kho Hóa chất | Nhập mua mới, cập nhật lô, hạn dùng.          |

### E. NHÓM QUYỀN TÀI CHÍNH & BÁO CÁO

| Mã nhóm quyền             | Tên nhóm quyền      | Mô tả chi tiết & Phạm vi                                 |
| :------------------------ | :------------------ | :------------------------------------------------------- |
| **`POL_INVOICE_CREATE`**  | Xuất Hóa đơn        | Tạo hóa đơn tài chính, theo dõi công nợ.                 |
| **`POL_PAYMENT_CONFIRM`** | Xác nhận Thanh toán | Xử lý giao dịch (Map/Reject), xác nhận tiền về đơn hàng. |
| **`POL_REPORT_GENERATE`** | Tổng hợp Báo cáo    | Sinh file PDF báo cáo kết quả từ dữ liệu Approved.       |
| **`POL_REPORT_SIGN`**     | Ký số & Phát hành   | Ký điện tử và gửi báo cáo cho khách.                     |

### F. NHÓM QUYỀN HỆ THỐNG & QA

| Mã nhóm quyền         | Tên nhóm quyền     | Mô tả chi tiết & Phạm vi                      |
| :-------------------- | :----------------- | :-------------------------------------------- |
| **`POL_SYS_CONFIG`**  | Cấu hình Hệ thống  | Quản lý User, Role mapping, System Settings.  |
| **`POL_LIB_MANAGE`**  | Quản trị Thư viện  | Cập nhật danh mục chỉ tiêu, phương pháp, giá. |
| **`POL_QA_AUDIT`**    | Audit & QA         | Xem Log hệ thống, xử lý sự cố (NC).           |
| **`POL_DOC_CONTROL`** | Kiểm soát Tài liệu | Upload/Approving quy trình SOP, biểu mẫu.     |

---

## 2. MA TRẬN PHÂN BỔ QUYỀN CHO VỊ TRÍ (ROLE MAPPING MATRIX)

Bảng dưới đây thể hiện sự lắp ghép (Composition) các nhóm quyền vào từng vị trí cụ thể.

| Nhóm Vị trí       | Chức danh (Role)      | Các nhóm quyền được gán (Assigned Policies)                                                                                 | Ghi chú                               |
| :---------------- | :-------------------- | :-------------------------------------------------------------------------------------------------------------------------- | :------------------------------------ |
| **1. KINH DOANH** | **N.Viên Kinh doanh** | `POL_CRM_VIEW_BASIC`, `POL_CLIENT_MANAGE`, `POL_QUOTE_CREATE`, `POL_ORDER_PROCESS`, `POL_REQUEST_MANAGE`                    | Chỉ làm trên tập khách hàng của mình. |
| **1. KINH DOANH** | **Trưởng phòng KD**   | _Quyền của N.Viên KD_ + `POL_DISCOUNT_APPROVE`, `POL_SALES_ADMIN`                                                           | Quản lý toàn bộ team sales.           |
| **1. KINH DOANH** | **CSKH**              | `POL_CRM_VIEW_BASIC`, `POL_ORDER_PROCESS` (View only), `POL_REPORT_GENERATE` (Send only), `POL_REQUEST_MANAGE`              | Hỗ trợ theo dõi đơn.                  |
| **2. KỸ THUẬT**   | **Kiểm nghiệm viên**  | `POL_TEST_VIEW_ASSIGNED`, `POL_TEST_EXECUTE`, `POL_EQUIPMENT_OPS`, `POL_INVENTORY_USE`, `POL_SOLUTION_PREP`                 | Chỉ nhập liệu kết quả.                |
| **2. KỸ THUẬT**   | **KTV Chính / QC**    | `POL_TEST_VIEW_ASSIGNED`, `POL_TEST_EXECUTE`, `POL_TEST_REVIEW`, `POL_EQUIPMENT_OPS`                                        | Soát xét kết quả bước 1.              |
| **2. KỸ THUẬT**   | **Trưởng phòng Lab**  | `POL_TEST_VIEW_ASSIGNED`, `POL_TEST_APPROVE`, `POL_TEST_ASSIGN`, `POL_LIB_MANAGE` (Partial)                                 | Phân công và duyệt cuối.              |
| **3. NHẬN MẪU**   | **N.Viên Nhận mẫu**   | `POL_RECEIPT_ENTRY`, `POL_SAMPLE_LOG`, `POL_SAMPLE_CODING`, `POL_SAMPLE_STORE`, `POL_SHIPMENT_CREATE`, `POL_REQUEST_MANAGE` |                                       |
| **4. HẬU CẦN**    | **Thủ kho**           | `POL_INVENTORY_IMPORT`, `POL_INVENTORY_USE`, `POL_SAMPLE_STORE`                                                             |                                       |
| **4. HẬU CẦN**    | **QL Thiết bị**       | `POL_EQUIPMENT_MGR`, `POL_EQUIPMENT_OPS`                                                                                    |                                       |
| **5. TÀI CHÍNH**  | **Kế toán**           | `POL_CRM_VIEW_BASIC`, `POL_INVOICE_CREATE`, `POL_PAYMENT_CONFIRM`                                                           | Không can thiệp nghiệp vụ Lab.        |
| **6. QUẢN TRỊ**   | **Admin / IT**        | `POL_SYS_CONFIG`, `POL_QA_AUDIT` (Tech logs)                                                                                |                                       |
| **6. QUẢN TRỊ**   | **QA Manager**        | `POL_QA_AUDIT` (Process logs), `POL_DOC_CONTROL`, `POL_LIB_MANAGE`                                                          | Kiểm soát tuân thủ.                   |
| **6. QUẢN TRỊ**   | **Lab Director**      | **SUPER READ ONLY** (Xem tất cả báo cáo, dashboard), `POL_REPORT_SIGN`                                                      | Ký báo cáo pháp lý.                   |

---

## 3. LOGIC ÁP DỤNG TRONG CODE

Khi triển khai code (Middleware/Guard), ta sẽ check theo Policy Code chứ không check theo Role Name.

**Sai (Role-based):**

```typescript
if (user.role === "ROLE_SALES_MANAGER") {
    allowDiscountApproval();
}
```

**Đúng (Policy-based):**

```typescript
// User có thể có nhiều role, các role sẽ được flatmap ra danh sách policies
if (user.policies.includes("POL_DISCOUNT_APPROVE")) {
    allowDiscountApproval();
}
```

Điều này cho phép một nhân viên **Kế toán** có thể được cấp tạm quyền `POL_QUOTE_CREATE` để hỗ trợ sales mà không cần đổi chức danh của họ thành Salesman.
