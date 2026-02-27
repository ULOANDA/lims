# Samples Module (Lưu mẫu)

## Tổng quan

Module `Samples` cung cấp chức năng quản lý, truy vết và điều hướng các mẫu thử hiện đang tồn tại trên hệ thống. Trách nhiệm của phân khu này không phải là quản lý _việc nhận_ mẫu (thuộc module Reception) mà là quản lý về _lô mẫu/hạn lưu_. Ví dụ: theo dõi vị trí kệ lưu, ngày hủy mẫu, quy trình lấy mẫu, lưu lượng mẫu đang còn.

## Các tính năng chính và giao diện

1. Cung cấp báo cáo chung về danh mục mẫu (thông tin vật lý, lượng, khối lượng tính bằng g).
2. Hiển thị kho và Shelf (vị trí tủ kệ).
3. Đếm thời gian hết hạn của mẫu từ `sampleRetentionDate` đến `sampleDisposalDate`.

## Quản lý ngôn ngữ (i18n)

Các chuỗi tĩnh, tiêu đề hiển thị hay placeholder đã được quốc tế hoá qua hook `useTranslation` với namespace chủ thể: `lab.samples.*`.

Một số khóa chính yếu đang sử dụng:

- `lab.samples.physicalState`: Trạng thái vật lý của mẫu.
- `lab.samples.sampleVolume`: Thể tích, trọng lượng.
- `lab.samples.sampleStorageLoc`: Vị trí lưu kho.
- `lab.samples.sampleRetentionDate`: Hạn lưu ban đầu.
- `lab.samples.sampleDisposalDate`: Ngày hủy dự định.
- `lab.samples.sampleNote`: Các ghi chú tình trạng (hư, đổ, niêm phong).

## Kiến trúc

Sử dụng React Table làm bộ khung cho các bảng hiển thị mẫu dài, đồng bộ chung Theme system, sử dụng Tailwind Utility classes kết hợp với component UI Library `shadcn/ui`. Các chuỗi tĩnh trong file được thay thế qua `String(t("key", { defaultValue: "fallback" }))` nhằm tương thích nhanh giữa `Tiếng Việt` và `Tiếng Anh` mà không phụ thuộc file `*.ts` nào bắt buộc phải update ngay.
