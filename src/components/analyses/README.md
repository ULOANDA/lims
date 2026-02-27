# Analyses Module (Thử nghiệm & Phân công chỉ tiêu)

## Tổng quan

Module `Analyses` đứng cốt lõi ở khu vực làm việc của các Kỹ thuật viên (KTV) trong Phòng Thử Nghiệm. Đây là nơi các chỉ tiêu lẻ tẻ (Analyses) được phát sinh từ nhiều mẫu (Samples) gom tụ và phân task tương ứng. Báo cáo, tiến trình, Raw Data và Kết quả chuẩn sẽ được nhập tại module này.

## Tính năng nổi bật và Workflow

1. Xem tổng số phép thử đang phân công.
2. Form điền tiến độ xử lý.
3. Form nhập liệu thông số (LOD, LOQ, Giá trị thô / Raw Result).
4. Phê duyệt kiểm thử độc lập cho những phân cụm thử nghiệm chưa hoàn tất.

### Phân rã Component

| Component                 | Trách nhiệm                                                                                                                   |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `AnalysisCreateModal.tsx` | (Chuyên dùng trong luồng CRM hoặc tự sinh đột xuất): Định hình form thủ công thêm phép thử ngoài quy trình cho mẫu đang chạy. |
| `AnalysisUpdateModal.tsx` | Khung Popup Form cho phép KTV vào ghi số liệu (Result Input) hoặc chuyển trạng thái phân tích sang Hoàn Thành.                |

> Helper function `assertSuccess(res: ApiResponse<T>): T` được dùng chung trên layout modal API để móc dữ liệu trả về và tránh lồng ghép lỗi if/else quá sâu.

## Internationalization (i18n)

Module chạy trên định tuyến hệ ngôn ngữ chung: Namespace `lab.analyses.*`.
Các mục tiêu chính trong việc dịch qua `t()` bao gồm:

- Tên thẻ (VD: `lab.analyses.analysisId`, `lab.analyses.analysisStatus`).
- KTV xử lý (`lab.analyses.technicianIds`).
- Data nhập (`lab.analyses.result`, `lab.analyses.resultNote`).
- Quá hạn phân tích (`lab.analyses.analysisDeadline`).

Tất cả đã áp dụng `defaultValue` cho tiếng Việt để tạo safety-net hoàn hảo. Mọi thay đổi logic UI được tích hợp sẵn Theme Variables để dùng màu cảnh báo Đỏ, Xanh tương ứng deadline.
