# 📦 Hộp Đồ Cá Nhân - Personal Asset Manager (Quản Lý Tài Sản Cá Nhân Tối Giản)

**Hộp Đồ Cá Nhân** là một ứng dụng web dạng Dashboard tối giản và hiện đại, giúp bạn theo dõi, quản lý vị trí, số lượng và trạng thái của các vật dụng cá nhân, tài sản lặt vặt trong nhà hoặc nơi làm việc. Ứng dụng tích hợp hệ thống xác thực người dùng và lưu trữ dữ liệu thời gian thực thông qua **Supabase**.

---

## 🚀 Hướng Dẫn Khởi Chạy

Ứng dụng được đóng gói bằng **Vite** kết hợp với thư viện kết nối **Supabase JS**.

1. **Cài đặt dependencies:**
   Mở terminal tại thư mục dự án `tinkering-assetmanagement` và chạy lệnh:
   ```bash
   npm install
   ```
2. **Khởi chạy Development Server:**
   ```bash
   npm run dev
   ```
3. **Truy cập ứng dụng:**
   Mở địa chỉ local hiển thị trên terminal (thường là **`http://localhost:5173`** hoặc cổng khác được cấp phát).

---

## 📁 Cấu Trúc Mã Nguồn

- 📄 [index.html](file:///c:/Users/hungm/OneDrive/Máy tính/tinkering-assetmanagement/index.html): Xây dựng bộ khung giao diện dashboard, bao gồm màn hình đăng nhập/đăng ký (Auth Screen), bảng điều khiển số liệu thống kê (Stats Grid), thanh tìm kiếm & bộ lọc, danh sách các vật phẩm (Assets Grid) và hộp thoại thêm/sửa đồ vật (Modal).
- 📄 [style.css](file:///c:/Users/hungm/OneDrive/Máy tính/tinkering-assetmanagement/style.css): Định nghĩa giao diện người dùng hiện đại, tinh tế với hệ thống màu sắc HSL linh hoạt, hỗ trợ chuyển đổi giao diện Sáng/Tối (Light/Dark Mode), hiệu ứng chuyển động mượt mà và responsive tương thích trên cả điện thoại và máy tính.
- 📄 [app.js](file:///c:/Users/hungm/OneDrive/Máy tính/tinkering-assetmanagement/app.js): Xử lý toàn bộ logic của ứng dụng:
  - Khởi tạo kết nối tới dịch vụ Supabase.
  - Quản lý trạng thái đăng nhập, đăng ký và đăng xuất của người dùng (Supabase Auth).
  - Thao tác CRUD (Thêm, Đọc, Sửa, Xóa) dữ liệu tài sản thời gian thực từ Supabase Database.
  - Bộ lọc động theo tên, danh mục và trạng thái.
  - Hoạt ảnh mạng lưới hạt chuyển động (Neuron Background Canvas) ở phông nền.
- 📄 [asset_management_guide.md](file:///c:/Users/hungm/OneDrive/Máy tính/tinkering-assetmanagement/asset_management_guide.md): Hướng dẫn chi tiết cấu hình cơ sở dữ liệu Supabase, phân quyền bảo mật dòng (Row Level Security - RLS) để bảo vệ dữ liệu cá nhân của từng tài khoản.

---

## ✨ Các Tính Năng Chính

1. **Xác thực người dùng bảo mật (Supabase Auth):**
   - Hỗ trợ đăng nhập và đăng ký tài khoản mới trực tiếp trên giao diện phẳng mượt mà.
   - Cơ chế tự động lưu phiên đăng nhập (Session) tiện lợi.
2. **Quản lý tài sản trực quan (CRUD Operations):**
   - Thêm mới vật phẩm đi kèm: Tên, Danh mục, Vị trí cất giữ, Số lượng, Trạng thái và Ghi chú chi tiết.
   - Cập nhật thông tin nhanh chóng qua hộp thoại hoặc thực hiện trực tiếp trên thẻ vật phẩm.
3. **Thao tác nhanh trên thẻ (Quick Actions):**
   - Tăng/giảm số lượng đồ dùng chỉ với 1 cú click (`+` / `-`).
   - Click trực tiếp vào nhãn trạng thái để xoay vòng nhanh trạng thái vật phẩm: **Bình thường** 🟢 ➔ **Đang mượn** 🟡 ➔ **Thất lạc** 🔴.
4. **Thống kê tổng quan (Stats Grid):**
   - Tự động đếm và cập nhật tổng số vật phẩm, số lượng danh mục khác nhau, số đồ vật đang cho mượn hoặc đã thất lạc.
5. **Tìm kiếm & Lọc nâng cao:**
   - Tìm kiếm thời gian thực theo tên đồ vật, vị trí hoặc ghi chú.
   - Lọc nhanh theo Danh mục (Category) được cập nhật động từ dữ liệu và lọc theo Trạng thái (Status).
6. **Tùy biến giao diện (Light/Dark Mode):**
   - Nút chuyển đổi giao diện sáng tối nhanh chóng, ghi nhớ lựa chọn của người dùng qua `localStorage`.
7. **Bảo mật dữ liệu (Row Level Security):**
   - Tích hợp chính sách bảo mật của Supabase đảm bảo mỗi người dùng sau khi đăng nhập chỉ có quyền xem và thao tác trên danh sách tài sản của riêng mình.
