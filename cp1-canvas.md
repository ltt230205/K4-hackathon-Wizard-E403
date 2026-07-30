# CP1 Canvas - Nhóm VLearn Tutor Check

## Thông tin nhóm

| Thành viên | Mã HV | Vai trò dự kiến |
|---|---:|---|
| Lê Trí Tùng | 2A202601458 | Lead spec, chốt canvas, điều phối demo |
| Nguyễn Quốc Bảo | 2A202601726 | Mining chatlog, bảng evidence, golden set |
| Nguyễn Thùy Trang | 2A202601294 | JTBD, user interview, validation log |
| Đỗ Thị Thanh Loan | 2A202601654 | UX flow, prototype sketch/mock |
| Vũ Xuân Anh | 2A202602010 | Prompt, AI call thật, trace/log |

## Canvas 7 dòng nộp CP1

1. **Hướng:** A - VLearn; loại: tối ưu AI tutor hiện có.

2. **Job executor:** Học viên đang học trên VLearn, đang đọc slide/tài liệu trong buổi học hoặc khi ôn lại, và bôi đen một đoạn/khái niệm mình chưa chắc đã hiểu.

3. **Pain 1 câu:** Học viên đang cố gắng làm rõ ngay một đoạn kiến thức trên VLearn nhưng tutor hiện tại thường trả lời một chiều, rất hiếm hỏi lại để kiểm tra hiểu, nên học viên dễ tưởng mình đã hiểu hoặc phải hỏi lại/tua lại tài liệu.

4. **Bằng chứng ban đầu:**
   - Mining `data/vlearn-pack/chatlog/chat_history_anonymized_for_hackathon.csv`: 358/1.261 tin nhắn học viên (28,4%) có mẫu "Giải thích đoạn bôi đen", đến từ 159 user.
   - Trong 1.261 câu trả lời tutor, `asked_check_question=True` chỉ 3 lượt (0,2%) và `follow_ups` không có lượt nào khác rỗng; tức tutor gần như không chủ động kiểm tra xem học viên đã hiểu chưa.
   - Ví dụ chatlog: `C0007/T0020/U0035` hỏi: "Giải thích đoạn bôi đen ở Trang 15." Đây là mẫu hỏi lặp lại phù hợp với lát cắt của nhóm.

5. **Lát cắt MỘT CÂU:** Khi một học viên bôi đen một khái niệm trên VLearn và hỏi giải thích, AI quyết định mức độ chắc của nguồn và tạo câu trả lời ngắn theo 3 tầng kèm 1 câu kiểm tra hiểu, để học viên biết mình đã hiểu đúng trước khi học tiếp.

6. **Automation dự kiến:** Conditional. AI tự trả lời khi có căn cứ trong slide/transcript và độ tin cậy đủ cao; nếu thiếu nguồn, ngoài phạm vi, hoặc câu hỏi mơ hồ thì AI nói rõ không chắc, hỏi lại/cần thêm context thay vì đoán. Lý do: nếu giải thích sai kiến thức, học viên có thể học sai và mất niềm tin, nên không nên automate vô điều kiện.

7. **Willing users dự kiến + phân công:**
   - Willing users ngoài nhóm cần chốt trước khi nộp: [Tên 1 - vai trò], [Tên 2 - vai trò], [Tên 3 - vai trò].
   - Tùng: chốt problem statement và spec khung.
   - Bảo: đếm thêm evidence, giữ tối thiểu 5 quote/ví dụ nguyên văn có mã hội thoại.
   - Trang: hỏi nhanh 3 willing users về lần gần nhất họ dùng VLearn tutor để hiểu một đoạn.
   - Loan: vẽ flow prototype 1 màn hình: chọn đoạn -> hỏi -> nhận giải thích 3 tầng -> trả lời câu kiểm tra.
   - Xuân Anh: làm prompt/AI call thật cho quyết định trung tâm và lưu trace trong repo.

## Bảng impact nhanh để bảo vệ lựa chọn

| Ứng viên | Evidence ban đầu | Tần suất/impact | Build kịp không | Quyết định |
|---|---|---|---|---|
| Giải thích đoạn bôi đen + kiểm tra hiểu | 358/1.261 tin nhắn học viên, 159 user | Xảy ra nhiều; ảnh hưởng trực tiếp đến việc hiểu bài | Có, chỉ cần 1 flow VLearn tutor | Chọn |
| Tóm tắt slide/buổi học | 132/1.261 tin nhắn học viên | Có nhu cầu, nhưng output dễ rộng và khó đo hơn | Có, nhưng dễ thành tính năng tóm tắt chung | Loại tạm |
| Xử lý câu ngoài phạm vi/logistics trong VLearn | Có các mẫu như hỏi download/lab/slide không có nguồn | Quan trọng nhưng gần với điều hướng/LMS hơn là học kiến thức | Có, nhưng không trung tâm VLearn tutor học bài | Loại tạm |

## Câu hỏi validation nhanh

1. Lần gần nhất bạn bôi đen một đoạn trên VLearn để hỏi tutor là khi nào, bạn muốn nó giúp mình đạt điều gì?
2. Sau khi tutor giải thích, bạn có biết chắc mình đã hiểu đúng không? Nếu không, bạn làm gì tiếp?
3. Nếu tutor thêm 1 câu kiểm tra hiểu rất ngắn sau phần giải thích, bạn có sẵn sàng trả lời không, hay thấy phiền?
