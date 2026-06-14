# Hướng dẫn sử dụng: Quản lý tài sản cá nhân tối giản (Có Xác Thực)

Ứng dụng của bạn hiện đã được tích hợp **chức năng Đăng Nhập / Đăng Ký** bảo mật bằng **Supabase Auth**.

Bạn có thể mở ứng dụng trên trình duyệt qua liên kết sau:
👉 **[http://localhost:5174/](http://localhost:5174/)**

---

## 🛠️ 1. Cấu Hình Cơ Sở Dữ Liệu (Supabase SQL)

Để phân quyền bảo mật cho từng tài khoản đăng nhập và **hỗ trợ tính năng thêm hình ảnh**, bạn cần cập nhật cấu trúc bảng `assets` bằng cách chạy đoạn code sau trong mục **SQL Editor** của Supabase:

```sql
-- 1. Thêm cột user_id liên kết với tài khoản người dùng đăng nhập (nếu chưa có)
alter table assets add column user_id uuid references auth.users(id) default auth.uid();

-- 2. Thêm cột image_url để lưu trữ hình ảnh vật dụng (ảnh tải lên dạng Base64 hoặc liên kết URL)
alter table assets add column image_url text;

-- 3. Kích hoạt tính năng bảo mật dòng (Row Level Security - RLS)
alter table assets enable row level security;

-- 4. Tạo chính sách bảo mật: Chỉ cho phép người dùng thao tác trên dòng dữ liệu của chính mình
create policy "Users can only manage their own assets" 
on assets for all 
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

> [!IMPORTANT]
> Hãy chắc chắn chạy toàn bộ các lệnh SQL trên.
> * Nếu bạn đã thiết lập bảng `assets` từ trước, bạn chỉ cần chạy thêm câu lệnh bổ sung cột `image_url`:
>   ```sql
>   alter table assets add column image_url text;
>   ```
> * Nếu không chạy lệnh tạo cột `user_id` và `image_url`, ứng dụng sẽ gặp lỗi (Error 404/400) khi tải hoặc lưu thông tin đồ vật.

---

## 🔑 2. Luồng Hoạt Động Của Chức Năng Auth

1.  **Màn hình xác thực (Auth Screen)**:
    *   Khi vào ứng dụng, nếu chưa đăng nhập, bạn sẽ được đưa đến màn hình đăng nhập phẳng màu tím tối giản.
    *   Bạn có thể chuyển đổi linh hoạt giữa Tab **Đăng nhập** và **Đăng ký mới**.
    *   *Lưu ý*: Sau khi đăng ký tài khoản mới, Supabase mặc định sẽ gửi email kích hoạt tài khoản. Bạn cần kiểm tra hộp thư email (hoặc cấu hình tắt chức năng "Confirm Email" trong phần **Auth Settings** trên trang quản trị Supabase nếu muốn tài khoản hoạt động ngay lập tức mà không cần xác nhận).
2.  **Đăng xuất (Sign Out)**:
    *   Ở góc phải thanh tiêu đề Header, nhấp vào nút `🚪 Đăng xuất` để thoát tài khoản và bảo vệ dữ liệu.
3.  **Bảo mật dữ liệu**:
    *   Tất cả các hành động thêm mới món đồ sẽ tự động gán `user_id` của tài khoản hiện tại.
    *   Các hành động sửa số lượng nhanh (+/-), xoay vòng trạng thái hoặc xóa đồ vật đều được ràng buộc bảo mật chặt chẽ từ phía Supabase.
