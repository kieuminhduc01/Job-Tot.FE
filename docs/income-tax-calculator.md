# Tính thuế TNCN

Route: `/tools/income-tax`. Tính tại trình duyệt, không gửi hay lưu dữ liệu tiền lương. Dùng chung bộ tính bảo hiểm với Gross–Net và các thành phần Header, Footer, Breadcrumb, CareerResources của trang công ty.

Phạm vi: người lao động Việt Nam cư trú, hợp đồng từ 3 tháng, làm đủ tháng. Gross gồm khoản miễn thuế; người dùng chỉ nhập khoản miễn/giảm trừ đủ điều kiện, có chứng từ. Không thay thế quyết toán thuế năm.

2026: giảm trừ bản thân 15,5 triệu, người phụ thuộc 6,2 triệu/tháng; biểu 5 bậc 5/10/20/30/35% trên khoảng 10/30/60/100 triệu. Hưu trí tự nguyện/bổ sung giảm trừ tối đa 3 triệu/tháng. Từ thiện đủ điều kiện được trừ tối đa phần thu nhập còn lại. Các khoản bảo hiểm bắt buộc được tính theo kỳ và trần đóng trong bộ Gross–Net.

So sánh minh họa 2025: 7 bậc 5/10/15/20/25/30/35% với khoảng 5/10/18/32/52/80 triệu, giảm trừ 11 triệu và 4,4 triệu/người, hưu trí tự nguyện giới hạn 1 triệu. Giữ cùng Gross, khoản miễn thuế và bảo hiểm hiện tại để cô lập chênh lệch chính sách; không dùng tính lại bảo hiểm/quyết toán năm 2025. Không cố định tỷ lệ tiết kiệm như ảnh; chênh lệch được tính thực tế.

Nguồn chính thức:

- https://xaydungchinhsach.chinhphu.vn/quy-dinh-moi-ve-khau-tru-thue-thu-nhap-ca-nhan-119260703150410707.htm
- https://xaydungchinhsach.chinhphu.vn/quy-dinh-giam-tru-gia-canh-119260703144038062.htm
- https://xaydungchinhsach.chinhphu.vn/huong-dan-quyet-toan-thue-thu-nhap-ca-nhan-doi-voi-thu-nhap-tu-tien-luong-tien-cong-119260306092819051.htm
- https://chinhphu.vn/?docid=51258&pageid=27160

Kiểm tra: `node --test model-tests/income-tax.test.js`, `npx playwright test tests/income-tax.spec.js`.
