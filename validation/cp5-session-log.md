# Log vòng validation CP5 — thử prototype thật

> Khác với `willing-users-interview-log.md` (phỏng vấn hành vi quá khứ, dùng ở CP1-CP4).
> Đây là **quan sát người dùng thao tác trực tiếp trên prototype** (guide §4.2).
> Người phụ trách: Nguyễn Thùy Trang. Cần ≥5 người ngoài nhóm — ưu tiên 3 willing users đã khai (Tài, Bình, Tới) + ≥2 người khác (khuyến khích đổi chéo zone khác).

## Chuẩn bị trước khi chạy phiên

- [ ] Server chạy được (`node codebase/server.js`, có `.env` chứa `OPENAI_API_KEY` thật)
- [ ] Chọn sẵn 2 task từ golden set:
  - **Task A — case chuẩn (happy path):** dùng nội dung tương tự `CASE_06` (Chatlog T0020) — bôi đen một khái niệm có căn cứ rõ trong slide.
  - **Task B — case chỗ khó (để xem phản ứng khi AI không chắc/sai):** dùng nội dung tương tự `CASE_18` (viết sai chính tả nặng) hoặc `CASE_19` (hỏi xin nghỉ học — ngoài phạm vi) — 2 case này đã FAIL trong `eval/eval_results_run1.md`, đáng để quan sát người dùng phản ứng thế nào khi AI xử lý sai/từ chối.

## Quy trình mỗi phiên (10 phút/người, theo guide §4.2)

1. Giao task thật: "Hãy dùng cái này để làm rõ một đoạn bạn chưa hiểu" (Task A), sau đó Task B — **im lặng quan sát, không thuyết minh, không gợi ý**. Ghi lại họ bấm gì, kẹt ở đâu.
2. Hỏi đúng 3 câu:
   - "Điều gì khó hiểu hoặc khó chịu nhất?"
   - "Kết quả này bạn có tin không — vì sao?"
   - "Bạn có dùng thật không — vì sao / vì sao chưa?"
3. Ghi log nguyên văn ngay lúc đó.

---

> **Nguồn dữ liệu người thử 1-5 dưới đây:** form "Khảo sát trải nghiệm demo — VLearn Tutor Check" (Google Form, thu 2026-07-31). Đây là **khảo sát tự đánh giá sau khi dùng thử** (thang 1-5 + 1 câu mở), không phải phiên quan sát trực tiếp theo đúng protocol guide §4.2 — nên không có cột "quan sát hành vi" (họ bấm gì/kẹt đâu), chỉ có tự báo cáo. Ghi rõ để không lẫn với dữ liệu quan sát thật.
>
> **Lưu ý về willing users:** cả 5 người dưới đây **không trùng** với 3 willing users đã khai ở CP1 (Tài, Bình, Tới) — rubric R6 muốn có ≥2 người trong danh sách CP1 xuất hiện ở đây, nên nhóm nên tìm thêm feedback riêng từ 3 người đó nếu còn thời gian.

## Người thử 1

- **Tên/vai trò:** Nguyễn Thị Nam Phương — 2A202601720
- **Task / quan sát:** Không có ghi chú quan sát trực tiếp (dữ liệu từ form tự đánh giá)
- **AI trả lời giúp hiểu rõ đoạn bôi đen? (1-5):** 2
- **Câu hỏi kiểm tra hiểu có hữu ích? (1-5):** 1
- **AI có nói rõ "không chắc/không có nguồn" khi thiếu căn cứ?:** Có, nói rõ ràng
- **Muốn dùng thường xuyên? (1-5):** 5
- **Điều muốn cải thiện nhất (nguyên văn):** "Thêm OCR để đọc được slide dạng ảnh scan, không chỉ PDF có text thật."
- **Mức nghiêm trọng:** Cao — điểm 2/5 và 1/5 ở đúng 2 tiêu chí lõi (giải thích rõ + câu hỏi kiểm tra hữu ích) là thấp nhất trong 5 người, dù vẫn muốn dùng thường xuyên (5/5) — đáng chú ý, cần hỏi lại lý do vì sao điểm hiểu thấp nhưng vẫn muốn dùng.

## Người thử 2

- **Tên/vai trò:** Vũ Đình Huy — 2A202601288
- **Task / quan sát:** Không có ghi chú quan sát trực tiếp (dữ liệu từ form tự đánh giá)
- **AI trả lời giúp hiểu rõ đoạn bôi đen? (1-5):** 4
- **Câu hỏi kiểm tra hiểu có hữu ích? (1-5):** 4
- **AI có nói rõ "không chắc/không có nguồn" khi thiếu căn cứ?:** Có nhưng chưa rõ ràng
- **Muốn dùng thường xuyên? (1-5):** 5
- **Điều muốn cải thiện nhất (nguyên văn):** "Cải thiện rule phân loại HIGH / LOW / OUT_OF_SCOPE để giảm lỗi như logistics bị nhận thành LOW."
- **Mức nghiêm trọng:** Vừa-Cao — chỉ ra đúng một lỗi phân loại cụ thể (logistics bị gắn nhầm LOW thay vì OUT_OF_SCOPE), khớp với đúng lớp ③ trong 4 lớp chỗ khó của nhóm.

## Người thử 3

- **Tên/vai trò:** Lê Quang Trung — 2A202601158
- **Task / quan sát:** Không có ghi chú quan sát trực tiếp (dữ liệu từ form tự đánh giá)
- **AI trả lời giúp hiểu rõ đoạn bôi đen? (1-5):** 4
- **Câu hỏi kiểm tra hiểu có hữu ích? (1-5):** 4
- **AI có nói rõ "không chắc/không có nguồn" khi thiếu căn cứ?:** Có, nói rõ ràng
- **Muốn dùng thường xuyên? (1-5):** 5
- **Điều muốn cải thiện nhất (nguyên văn):** "Thu gọn UI phần Agent reasoning, cho phép người học bấm mở chi tiết khi cần."
- **Mức nghiêm trọng:** Thấp — góp ý UI/UX, không phải lỗi hành vi AI.

## Người thử 4

- **Tên/vai trò:** Lê Tuấn Minh — 2A202601390
- **Task / quan sát:** Không có ghi chú quan sát trực tiếp (dữ liệu từ form tự đánh giá)
- **AI trả lời giúp hiểu rõ đoạn bôi đen? (1-5):** 5
- **Câu hỏi kiểm tra hiểu có hữu ích? (1-5):** 5
- **AI có nói rõ "không chắc/không có nguồn" khi thiếu căn cứ?:** Có, nói rõ ràng
- **Muốn dùng thường xuyên? (1-5):** 4
- **Điều muốn cải thiện nhất (nguyên văn):** "Thêm lựa chọn độ khó quiz: dễ, vừa, khó hoặc tạo quiz nâng cao theo level."
- **Mức nghiêm trọng:** Thấp — đề xuất tính năng mới, không phải lỗi hiện có.

## Người thử 5

- **Tên/vai trò:** Nguyễn Cao Quang Anh — 2A202601352
- **Task / quan sát:** Không có ghi chú quan sát trực tiếp (dữ liệu từ form tự đánh giá)
- **AI trả lời giúp hiểu rõ đoạn bôi đen? (1-5):** 5
- **Câu hỏi kiểm tra hiểu có hữu ích? (1-5):** 5
- **AI có nói rõ "không chắc/không có nguồn" khi thiếu căn cứ?:** Có nhưng chưa rõ ràng
- **Muốn dùng thường xuyên? (1-5):** 4
- **Điều muốn cải thiện nhất (nguyên văn):** "Lưu lịch sử đoạn đã hỏi, câu trả lời và kết quả quiz để học viên ôn lại sau."
- **Mức nghiêm trọng:** Thấp — đề xuất tính năng mới (lưu lịch sử), không phải lỗi hiện có.

---

## Tổng hợp (từ 5 phiếu khảo sát thật, thu 2026-07-31)

- **Điểm trung bình:** "AI giải thích giúp hiểu rõ" = 4,0/5 · "câu hỏi kiểm tra hiểu hữu ích" = 3,8/5 · "muốn dùng thường xuyên" = 4,6/5 — tín hiệu rõ ràng là học viên **muốn dùng tính năng này**, dù chất lượng giải thích chưa đồng đều (1 người chấm 2/5 và 1/5).
- **Chủ đề lặp nhiều nhất:** khả năng nói rõ "không chắc/không có nguồn" **chưa rõ ràng với 2/5 người** (Vũ Đình Huy, Nguyễn Cao Quang Anh) — trùng khớp với case cụ thể Vũ Đình Huy nêu: hệ thống gắn nhầm câu hỏi logistics (lớp ③) thành LOW thay vì OUT_OF_SCOPE.
- **1-2 thay đổi cần làm trước demo** (→ đẩy vào `spec.md` §9 Changelog): rà lại rule phân loại LOW vs OUT_OF_SCOPE cho case logistics/ngoài phạm vi (theo góp ý Vũ Đình Huy) — đây là lỗi ở đúng lớp ③ nhóm đã tự nhận là "chỗ khó", nên ưu tiên sửa trước khi demo.
- **Giữ nguyên có lý do:** UI phần Agent reasoning (Lê Quang Trung góp ý thu gọn) — hoãn vì không ảnh hưởng đến quyết định trung tâm, không phải rủi ro sai kiến thức.
- **Đưa vào backlog** (cho slide 6 "nếu có thêm 1 tuần"): OCR cho slide ảnh scan (Nam Phương), tuỳ chỉnh độ khó quiz (Tuấn Minh), lưu lịch sử hỏi-đáp (Quang Anh).
- **Việc còn thiếu:** chưa có feedback từ 3 willing users CP1 (Tài, Bình, Tới) và chưa có dữ liệu quan sát hành vi trực tiếp (chỉ có tự đánh giá) — nên bổ sung nếu còn thời gian trước CP5.