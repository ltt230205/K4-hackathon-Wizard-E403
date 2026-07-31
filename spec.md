# AI SPEC — Giải thích đoạn bôi đen + kiểm tra hiểu · Nhóm VLearn Tutor Check · Zone [X]
Hướng: [x] A — VLearn  [ ] B — Trợ lý Học viên  [ ] C — Làn mở
Loại: [x] Tối ưu tính năng có sẵn  [ ] Tính năng mới

## §1. User & Job
- Job executor + workflow: xem `jtbd-worksheet.md` (đính kèm đầy đủ)
- Core JTBD (không tên sản phẩm/AI trong câu): làm rõ ngay một đoạn/khái niệm vừa đọc mà mình chưa chắc đã hiểu, ngay tại chỗ đang học, và biết chắc mình hiểu đúng trước khi học tiếp — không phải rời trang tài liệu hay tua lại cả buổi.
- Problem statement (KHÔNG chữ AI): Học viên đang đọc slide/tài liệu trong buổi học, bôi đen một đoạn/khái niệm chưa chắc đã hiểu và hỏi giải thích ngay tại chỗ; nhưng câu trả lời nhận được là một chiều, gần như không có bước xác nhận lại xem học viên đã hiểu đúng chưa, nên học viên dễ tưởng mình đã hiểu (hoặc mang lỗ hổng đi tiếp) trong khi một phần câu trả lời còn thiếu/sai căn cứ nguồn.
- Evidence (chuẩn A và/hoặc B — log đầy đủ trong repo):
  - **Chuẩn B — mining** (`data/vlearn-pack/chatlog/chat_history_anonymized_for_hackathon.csv`, phương pháp: match regex "giải thích" + "bôi đen" trên `content` của message role=student, n=1.261 tin nhắn học viên):
    - 358/1.261 tin nhắn học viên (28,4%) khớp mẫu "giải thích đoạn bôi đen", từ 159 user khác nhau.
    - `asked_check_question=True` chỉ 3/1.261 turn (0,2%); `follow_ups` và `misconceptions` luôn rỗng (0/1.261) — tutor không có cơ chế chủ động kiểm tra hiểu.
    - 46,2% turn có `citations=[]` (câu trả lời không neo vào trang tài liệu cụ thể).
  - **≥5 quote/ví dụ nguyên văn + nguồn:**
    1. `T0020/C0007/U0035`: "Giải thích đoạn bôi đen ở Trang 15." — mẫu hỏi lõi của lát cắt.
    2. `T1053/C0007/U0035` (cùng user, ngay sau T0020): "Giải thích đoạn bôi đen ở Trang 17." — cùng một học viên tự hỏi lại liên tiếp, không có xác nhận đã hiểu ý trước đó chưa.
    3. `T0399/C0023/U0257`: hỏi "Giải thích biểu đồ đc bôi đỏ" ở **trang 6**; tutor trả lời bằng nội dung **trang 71** (so sánh phong cách 3 model) — tự thừa nhận "kết quả tra cứu trang 6 hiện đang trả về nội dung của trang 71". Ví dụ cite sai nguồn cụ thể.
    4. `T0941/C0498/U0126`: học viên bôi đen trang 5, viết "TÔI KHÔNG HIỂU TRANG 6"; tutor trả lời trích **trang 71** — case cite lệch trang thứ hai, cho thấy đây không phải sự cố đơn lẻ.
    5. `T0769/C0021/U0355`: "giải thích nghĩa chi tiết của trang 4" — tutor trả lời "hệ thống tìm kiếm không tìm thấy nội dung cụ thể cho trang 4... bạn có thể cung cấp nội dung hoặc tiêu đề" — ví dụ xử lý đúng khi thiếu nguồn (hỏi lại thay vì bịa), nhóm muốn hành vi này nhất quán hơn.
  - **Khảo sát willing users** (log đầy đủ trong `validation/willing-users-interview-log.md`): 3/3 người phỏng vấn (Nguyễn Thành Tài, Vương Nguyệt Bình, Nguyễn Xuân Tới) xác nhận từng bôi đen hỏi tutor và **không chắc chắn 100% mình đã hiểu đúng** sau khi tutor trả lời; cả 3 đều đồng ý trả lời thêm 1 câu kiểm tra hiểu, với điều kiện câu hỏi phải thật ngắn.

## §2. Impact & quyết định chọn
*(Bảng impact đầy đủ + ứng viên đã loại: xem `cp1-canvas.md` mục "Bảng impact nhanh" — sẽ chuyển vào đây bản chốt trước 23:59 N1. Phụ trách: Bảo + Tùng.)*

## §3. Giải pháp tương tự đã nghiên cứu
**[TODO — cả nhóm, mỗi người 1 sản phẩm, 15'/người theo guide §2.2]**

## §4. Thiết kế
- Lát cắt MỘT CÂU: Khi một học viên bôi đen một khái niệm trên VLearn và hỏi giải thích, AI quyết định mức độ chắc của nguồn và tạo câu trả lời ngắn theo 3 tầng kèm 1 câu kiểm tra hiểu, để học viên biết mình đã hiểu đúng trước khi học tiếp.
- Non-goals (≥3): **[TODO — Tùng]**
- Mức prototype nhắm tới: **[TODO — Loan/Xuân Anh]**
- Automation: [x] conditional — lý do (cost-of-error): nếu tutor tự trả lời liều khi không đủ căn cứ, học viên có thể học sai kiến thức ngay và mất niềm tin (sửa đắt: phải phát hiện + sửa lại nhận thức sai). Khi có căn cứ vững trong slide/transcript và độ tin cậy đủ cao, AI tự trả lời (đa số case lành); khi thiếu nguồn/ngoài phạm vi/câu hỏi mơ hồ, AI nói rõ không chắc và hỏi lại thay vì đoán.
- §4b. Nguyên tắc đã áp dụng (≥4 — HAX/PAIR): **[TODO — cả nhóm chốt tại CP4, vị trí áp dụng cụ thể]**

## §5. Kiểu lỗi — 4 lớp chỗ khó + kịch bản (≥8)
**[TODO — cả nhóm, xem guide §2.5; ≥2 case/lớp phải khớp golden set §7]**

## §6. Bốn đường đi của trải nghiệm
**[TODO]**

## §7. Kiểm thử
- Chiều chất lượng + định nghĩa kiểm chứng được:
  1. **Độ đúng căn cứ (Groundedness):** AI chỉ trả lời khi có căn cứ trong tài liệu slide/transcript; thiếu căn cứ phải trả về LOW hoặc OUT_OF_SCOPE.
  2. **Định dạng 3 tầng (3-Tier Structure):** Trả về đủ Tầng 1 (định nghĩa 1 câu bình dân), Tầng 2 (ví dụ thực tế), Tầng 3 (căn cứ slide).
  3. **Kiểm tra hiểu (Verification):** Kèm 1 câu hỏi trắc nghiệm kiểm tra mức độ hiểu của học viên.
- Golden set (12 case trong `eval/golden_set.json`): bộ rút gọn 10-15 case, phủ đủ nhóm HIGH, LOW và OUT_OF_SCOPE.
- Quality bar: **Đạt khi ≥ 80% qua bộ 12 case, 100% case thiếu căn cứ không bịa nguồn.**
- Kết quả lượt đo mới nhất (Lượt 1): **10/12 case đạt (83.3%)**; 2 case chưa đạt là CASE_04 và CASE_06 (xem bảng chi tiết trong `eval/eval_results_run1.md`).


## §8. Phân công & kế hoạch
- Phân công có tên:
  - Tùng: chốt problem statement và spec khung.
  - Bảo: đếm thêm evidence, giữ tối thiểu 5 quote/ví dụ nguyên văn có mã hội thoại.
  - Trang: JTBD, phỏng vấn willing users, validation log.
  - Loan: vẽ flow prototype 1 màn hình.
  - Xuân Anh: prompt/AI call thật + trace/log.
- Willing users (≥3 tên): xem `validation/willing-users-interview-log.md` (cập nhật khi phỏng vấn xong).
- Multi-prototype (nếu làm): **[TODO]**

## §9. Changelog
| Thời điểm | Đổi gì | Vì sao (trỏ về feedback/case nào) |
|---|---|---|
| 2026-07-30 | Tạo bản nháp spec.md từ cp1-canvas.md + jtbd-worksheet.md, §1 hoàn thiện | Chuẩn bị cho CP4, phần §1 thuộc phân công Trang |
| 2026-07-31 | Ghi nhận: 3/8 người thử validation (Vũ Đình Huy, Nguyễn Cao Quang Anh, và willing user Vương Nguyệt Bình) báo AI chưa nói rõ ràng khi thiếu căn cứ; Vũ Đình Huy chỉ đích danh case logistics bị gắn nhầm LOW thay vì OUT_OF_SCOPE | Từ `validation/cp5-session-log.md` (8 người, gồm 3 willing users CP1: Tài, Bình, Tới) — nên rà lại rule phân loại LOW/OUT_OF_SCOPE trước demo |