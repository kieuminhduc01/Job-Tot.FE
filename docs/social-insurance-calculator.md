# Công cụ BHXH một lần

Route `/tools/social-insurance`, liên kết từ ToolsPage và CareerTools. Dùng trực tiếp Header, Footer, Breadcrumb và CareerResources chung với trang công ty. Tính tại trình duyệt; không có API, migration hay dữ liệu lương gửi lên server.

Phạm vi: BHXH bắt buộc theo lương doanh nghiệp quyết định, người lao động Việt Nam, giải quyết năm 2026. Không áp dụng phép bình quân này cho lương Nhà nước, BHXH tự nguyện hoặc quá trình hỗn hợp. Nhập căn cứ lương đã được xác nhận, chỉ thời gian chưa hưởng một lần. Các giai đoạn được tính cả tháng đầu/cuối, không được trùng; gián đoạn không cộng vào số tháng.

Hệ số lấy từ Công văn 340/BHXH-CSXH ngày 03/02/2026. Tách theo năm, tổng lương điều chỉnh = tổng (lương × hệ số × số tháng); bình quân = tổng chia số tháng thực tế. Không làm tròn bình quân trung gian; chỉ làm tròn kết quả tiền đến đồng.

Trước 2014: 1,5 tháng bình quân/năm; từ 2014: 2 tháng/năm. Nếu có cả hai thời kỳ, chuyển phần tháng lẻ trước 2014 sang thời kỳ sau trước khi quy đổi. Tháng lẻ 1–6 = 0,5 năm, 7–11 = 1 năm. Dưới 12 tháng: 22% tổng lương điều chỉnh, giới hạn 2 tháng bình quân.

Các điều kiện được tự xác nhận trong giao diện và đối chiếu với số tháng đóng. Trường hợp nghỉ 12 tháng yêu cầu còn thời gian đóng trước 01/07/2025, chưa đủ 20 năm và đủ 12 tháng không thuộc BHXH bắt buộc / không tham gia tự nguyện ngay trước tháng nộp hồ sơ. Trường hợp đủ tuổi hưu yêu cầu dưới 15 năm đóng. Các trường hợp khác cần giấy tờ hợp lệ; công cụ không xác nhận quyền hưởng pháp lý. Khi chưa đủ điều kiện, kết quả hưởng bằng 0, hiển thị riêng số theo công thức giả định.

Ví dụ mặc định: 01/2019–12/2021 lương 5,5 triệu; 01–04/2022 lương 6 triệu. 40 tháng, tổng điều chỉnh 257,64 triệu, bình quân 6,441 triệu. Quy đổi 3,5 năm từ 2014, số nhận 45,087 triệu. Không sao chép 42 triệu trong ảnh vì hệ số và bình quân của ảnh không khớp bảng năm 2026.

Nguồn:
- [Hệ số năm 2026](https://xaydungchinhsach.chinhphu.vn/he-so-dieu-chinh-tien-luong-thu-nhap-thang-da-dong-bao-hiem-xa-hoi-119260206103115775.htm)
- [Điều kiện và mức hưởng, Điều 70 Luật BHXH](https://xaydungchinhsach.chinhphu.vn/chinh-phu-quy-dinh-chi-tiet-huong-bao-hiem-xa-hoi-mot-lan-119250628072850982.htm)
- [Nghị định 158/2025/NĐ-CP](https://vanban.chinhphu.vn/?classid=1&docid=214189&orggroupid=2&pageid=27160)
- [BHXH hướng dẫn trường hợp dưới 1 năm](https://baohiemxahoi.gov.vn/chuyen-trang-bhxh-bhyt/tu-van-hoi-dap/Pages/default.aspx?ItemID=24102)

Kiểm tra: `node --test model-tests/social-insurance.test.js`, `npx playwright test tests/social-insurance.spec.js`.
