# Pages (Trang định tuyến)

## Tổng quan

Thư mục `src/pages` đóng vai trò là container chứa các màn hình cấp cao nhất (top-level routing components). Các module chuyên sâu (ví dụ: Reception, Samples, Analyses, Library) đều phơi bày các component UI (dưới mục `src/components`) và được nhúng vào các "Pages" này để kết nối với `React Router`.

## Danh sách các Pages

1. **`LoginPage.tsx`**: Trang đăng nhập công cộng.
    - Cung cấp form xác thực mật khẩu.
    - Được bảo vệ phía Router, cung cấp quyền vào phiên.
    - Đã ứng dụng `react-i18next` sử dụng namespace `auth.login.*`. Toàn bộ hiển thị thông báo lỗi (hết hạn, sai info) đều tích hợp `defaultValue`.
2. **Các Page chuyên dụng** (ReceptionPage, LibraryPage, v.v.): Gọi cấu trúc Layout chính, bọc ThemeProvider, QueryClientProvider nếu không áp tại `main.tsx`.

## Cơ chế Đa ngôn ngữ và Theme (Chủ đề sáng/tối)

- Trên các Page này thường sẽ gài một nút cài đặt ngôn ngữ ở Menu Navigation, tuỳ biến gọi `i18n.changeLanguage()`.
- Lớp Theme (`theme.config.ts`) được inject ở Page/Layout root để áp sắc màu chung (background, card, text-foreground, primary...) nhằm mang đến một UI thống nhất, chuyển đổi linh hoạt.
