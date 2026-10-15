# Công cụ BHTN 2026

Trang `/tools/unemployment-insurance` dùng trực tiếp AuthHeader, AuthFooter, PageBreadcrumb, CareerResources của trang công ty. Tính tại trình duyệt, không gửi hoặc lưu dữ liệu lương/thời gian đóng. Không có API hoặc migration mới.

Phạm vi: hồ sơ theo chính sách từ 2026, mức tối thiểu vùng năm 2026 ở tháng đóng cuối. Bình quân 6 tháng có đóng BHTN gần nhất, kể cả khi có gián đoạn. Input thời gian đóng phải là thời gian còn được cơ quan BHXH xác nhận xét hưởng, không gồm thời gian đã sử dụng ở lần trước.

Mức tháng = min(60% × bình quân, 5 × tối thiểu vùng). Vùng I/II/III/IV: 5,31/4,73/4,14/3,7 triệu, trần tương ứng 26,55/23,65/20,7/18,5 triệu. Thời gian hưởng: dưới 12 tháng đóng = 0; từ 12 đến 36 = 3 tháng, tiếp đó mỗi 12 tháng thêm 1 tháng hưởng, tối đa 12. Tổng dự kiến bằng mức tháng nhân thời gian hưởng đầy đủ, không bảo đảm sẽ được chi trả toàn bộ nếu tình trạng hưởng thay đổi.

Điều kiện được người dùng xác nhận: chấm dứt hợp đồng hợp pháp, chưa đủ điều kiện lương hưu; đóng đủ 12 trong 24 tháng (36 tháng với hợp đồng từ đủ 1 đến dưới 12 tháng); nộp hồ sơ trong 3 tháng; đáp ứng điều kiện 10 ngày làm việc. Khi điều kiện chưa đáp ứng, kết quả hưởng = 0 và công cụ nêu lý do, chỉ hiển thị công thức giả định riêng. Không tự xác nhận quyền hưởng dựa trên các checkbox.

Khác ảnh tham khảo: không dùng mốc 15 ngày chờ, 90 ngày thay 3 tháng hoặc hướng dẫn quyết định trong 20 ngày cũ. Năm 2026 thời điểm hưởng từ ngày làm việc thứ 11; giải quyết trong 15 ngày làm việc từ nhận đủ hồ sơ. Không tính thuế TNCN vào trợ cấp, không cộng hỗ trợ học nghề vào tổng dự kiến. Không tự tính thời gian bảo lưu vì còn phụ thuộc quá trình đóng và quyết định hưởng.

Nguồn:

- [Luật Việc làm 74/2025/QH15, Điều 38–40](https://xaydungchinhsach.chinhphu.vn/toan-van-luat-viec-lam-119250711173403835.htm)
- [Nghị định 374/2025/NĐ-CP, hiệu lực 01/01/2026](https://vanban.chinhphu.vn/?classid=1&docid=216493&pageid=27160&typegroupid=4)
- [Mức hưởng và trần hưởng](https://xaydungchinhsach.chinhphu.vn/quy-dinh-muc-huong-tro-cap-that-nghiep-hang-thang-cua-nguoi-lao-dong-119260108103733284.htm)
- [Nghị định 293/2025/NĐ-CP về lương tối thiểu vùng](https://xaydungchinhsach.chinhphu.vn/nghi-dinh-so-293-2025-nd-cp-quy-dinh-muc-luong-toi-thieu-doi-voi-nguoi-lao-dong-lam-viec-theo-hop-dong-lao-dong-119251110172808433.htm)

Kiểm tra: `node --test model-tests/unemployment.test.js`, `npx playwright test tests/unemployment.spec.js`.
