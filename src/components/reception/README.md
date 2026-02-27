# Reception Module (Tiếp nhận mẫu)

## Tổng quan

Module `Reception` là trung tâm xử lý dữ liệu tiếp nhận mẫu thử của hệ thống LIMS. Nó cho phép người dùng (thường là bộ phận Sales hoặc Chăm sóc khách hàng) tạo các phiếu tiếp nhận (Receipts) cho các sản phẩm/mẫu, liên kết với đơn hàng CRM (Order Code), gán dịch vụ (Analyses - các chỉ tiêu phân tích), và quản lý ảnh/tệp đính kèm.

## Kiến trúc và Các Component chính

| Component                  | Mô tả                                                                                                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ReceiptsView.tsx`         | Component chính (page-level). Quản lý filter, gọi API `useReceiptsList`, và hiển thị giao diện tiếp nhận.                                                        |
| `ReceiptsTable.tsx`        | Bảng grid hiển thị danh sách phiếu. Hỗ trợ tính năng Filter/Search mở rộng.                                                                                      |
| `ReceiptDetailModal.tsx`   | Modal lớn cung cấp view 360 độ về một phiếu tiếp nhận, bao gồm: thông tin người gửi, hạn trả kết quả, quản lý ảnh phiếu, và bảng danh sách mẫu trực thuộc phiếu. |
| `SampleDetailModal.tsx`    | Modal con hiển thị thông tin chi tiết một mẫu cụ thể của một phiếu, kèm theo danh sách các phép thử (analyses) liên quan tới mẫu đó.                             |
| `CreateReceiptFromCRM.tsx` | Giao diện kéo dữ liệu đơn hàng bên nhánh CRM sang hệ thống Lab để tạo phiếu nhận tự động.                                                                        |

## i18n (Internationalization)

Toàn bộ văn bản hiển thị trong module được cấu hình qua i18next với namespace chính là `reception.*` và fallback qua `defaultValue`.

**Ví dụ các key i18n phổ biến**:

- `reception.receiptDetail.infoAndSamples`: Thông tin chung và danh sách mẫu
- `reception.receipts.contactPerson`: Người liên hệ
- `reception.receipts.isBlindCoded`: Chế độ mã hóa mù mẫu thử
- Lấy labels phân tích từ `lab.analyses.*`
- Lấy labels cấu trúc mẫu từ `lab.samples.*`

> Việc gán text tĩnh đã bị loại bỏ hoàn toàn. Thay vào đó, tất cả label, placeholder, empty states đều dùng format `{String(t("key.path", { defaultValue: "Text fallback" }))}`.

## Image & Document Integration

`ReceiptDetailModal.tsx` tích hợp sẵn khả năng uplaod và xem tài liệu:

- Truy vấn ảnh từ `relatedImages` theo `receiptCode`.
- Cung cấp nút `Tải lên` (Upload) / `Chụp ảnh` cho phép gắn file liên quan. Quá trình upload tuân theo API quản lý `DocumentCenter`.
