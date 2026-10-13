# Hồ sơ doanh nghiệp của nhà tuyển dụng

Đường dẫn: `/employer/company`, liên kết từ tài khoản nhà tuyển dụng và mục Công ty trong EmployerHeader. Header dành riêng cho nhà tuyển dụng; AuthFooter và PageBreadcrumb dùng chung với danh sách công ty. Trang BHXH một lần giữ nguyên.

GET/PUT `/api/employer/company` dùng policy EmployerOnly. Công ty được xác định từ RecruiterProfile của tài khoản, không nhận companyId từ client. Quản trị viên được chỉnh sửa; HR khởi tạo doanh nghiệp Pending được hoàn thiện hồ sơ; thành viên khác chỉ đọc. MST, tên pháp lý và trạng thái xác minh không thể đổi qua endpoint này.

Các khối: thông tin doanh nghiệp, bản đồ địa chỉ, ban tuyển dụng thực tế, câu chuyện và giá trị, chỉ số nổi bật, phúc lợi, quy trình tuyển dụng, văn hóa, hoạt động và ảnh. Dữ liệu chưa có hiển thị trạng thái chưa cập nhật. Không giả số lượt xem, đánh giá hoặc xác minh Google Jobs.

Chỉnh sửa qua dialog, Áp dụng cập nhật bản nháp; Lưu thay đổi mới gọi PUT. Lỗi lưu giữ nguyên bản nháp. Revision và UPDATE có điều kiện ngăn ghi đè phiên khác. Dữ liệu thương hiệu có version lưu trong Culture JSON sẵn có, không thêm bảng/migration. Culture dạng văn bản cũ được giữ làm nội dung ban đầu. Phần công khai trả dữ liệu branding khi tìm companyId; không trả danh sách HR hoặc email nội bộ.

Ảnh bìa, logo và gallery hiện dùng URL HTTP/HTTPS (tối đa 12 ảnh); không có tải tệp ảnh từ thiết bị trong thay đổi này. Ban tuyển dụng hiển thị thành viên hiện có; thêm HR cần được quản trị viên xử lý, chưa có luồng mời thành viên. Chiến dịch và quản lý CV trên header dùng ServiceNotice hiện có cho tính năng chưa triển khai.

Khởi động lại API của người dùng để nạp endpoint mới. Kiểm tra bằng frontend lint/build/Playwright và backend CodexVerify để không ghi đè Debug.
