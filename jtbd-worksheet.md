# Worksheet JTBD — Nhóm VLearn Tutor Check

**Nhóm:** VLearn Tutor Check · **Hướng:** [x] A — VLearn (tối ưu AI tutor hiện có)

> Bản nháp dựng từ `cp1-canvas.md` + mining thật trên `data/vlearn-pack/chatlog/chat_history_anonymized_for_hackathon.csv`.
> Các chỗ đánh dấu **[CẦN TRANG XÁC NHẬN/BỔ SUNG]** là phần chỉ người phỏng vấn thật mới điền được — không tự bịa.

## 1. Chọn job executor

**Job executor:** Học viên đang học trên VLearn, đang đọc slide/tài liệu **trong buổi học** (data pack 100% `conversation_mode = in_class`), bôi đen một đoạn/khái niệm mình chưa chắc đã hiểu và hỏi tutor giải thích ngay tại chỗ.

**Vì sao là người này:** 358/1.261 tin nhắn học viên (28,4%, từ 159 user) khớp mẫu "giải thích đoạn bôi đen" — đây là hành vi lặp lại nhiều nhất, xảy ra đúng lúc AI có thể can thiệp (ngay trong luồng đọc, chưa rời trang).

## 2. Workflow thật quanh một buổi học

| Chặng | Họ đang cố làm gì? | Hôm nay họ dùng gì? | Kẹt ở đâu? | Mức đau |
|---|---|---|---|---|
| Trước buổi | N/A — data pack chỉ có `in_class`, nhóm không có bằng chứng cho chặng này | — | — | N/A |
| Trong buổi | Đọc slide, bôi đen đoạn/khái niệm không chắc, hỏi tutor giải thích ngay | Hỏi tutor VLearn (vd. `T0020/C0007/U0035`: "Giải thích đoạn bôi đen ở Trang 15") | Tutor trả lời 1 chiều, không hỏi lại kiểm tra hiểu (`asked_check_question=True` chỉ 3/1.261 = 0,2%); đôi khi **trích dẫn sai trang** — `T0399/C0023/U0257` hỏi "Giải thích biểu đồ đc bôi đỏ" ở **trang 6**, tutor trả lời bằng nội dung **trang 71** (so sánh phong cách 3 model), tự thừa nhận "kết quả tra cứu trang 6 hiện đang trả về nội dung của trang 71" | H |
| Ngay sau buổi | Muốn chắc mình đã hiểu đúng trước khi học tiếp | Tự hỏi lại tutor lần nữa nếu còn nghi (vd. cùng user `U0035` hỏi tiếp `T1053/C0007`: "Giải thích đoạn bôi đen ở Trang 17" ngay sau `T0020`) hoặc im lặng học tiếp — **63/206 hội thoại (30,6%)** có học viên hỏi lại mẫu "giải thích đoạn bôi đen" ≥2 lần trong cùng một hội thoại, cho thấy đây là hành vi phổ biến chứ không phải cá biệt | Không có cơ chế nào chủ động xác nhận — học viên phải tự nhận ra và tự hỏi lại; nếu không tự nhận ra thì mang lỗ hổng đi tiếp | M-H |
| Khi ôn lại | Tìm lại đúng đoạn/khái niệm đã hỏi trước đó | N/A — data pack không có nhãn phân biệt "ôn lại" | **[CẦN TRANG XÁC NHẬN]** qua phỏng vấn | ? |

**Hai chỗ đau nhất trong workflow:**
- **#1** Tutor gần như không bao giờ chủ động kiểm tra hiểu (0,2%) → học viên dễ tưởng mình đã hiểu dù chưa chắc.
- **#2** Một phần câu trả lời không có căn cứ vững (46,2% turn có `citations=[]`) hoặc cite sai trang (case `T0399`, `T0941/C0498/U0126`: học viên bôi đen trang 5 viết "TÔI KHÔNG HIỂU TRANG 6", tutor trả lời trích trang 71) → rủi ro học sai kiến thức mà không biết.

**Bằng chứng ban đầu cho 2 chỗ này:** xem bảng trên — số liệu từ `DATA_DICTIONARY.md` + 2 case cite sai trang mining được (`T0399`, `T0941`).

## 3. Core JTBD

- Chưa tốt: `hỏi AI tutor giải thích đoạn bôi đen` (có "AI" trong câu — vẫn đang nhét sản phẩm vào job)
- **Core JTBD bản chốt:** làm rõ ngay một đoạn/khái niệm vừa đọc mà mình chưa chắc đã hiểu, ngay tại chỗ đang học, và biết chắc mình hiểu đúng trước khi học tiếp — không phải rời trang tài liệu hay tua lại cả buổi.

Tự kiểm: bỏ AI đi, job "làm rõ + biết chắc đã hiểu đúng" vẫn tồn tại (học viên vẫn cần việc này dù không có tutor AI) → hợp lệ.

## 4. Ba job stories

| # | When | I want to | So I can | Story này cho thấy gì |
|---|---|---|---|---|
| JS1 | đang đọc slide trong buổi và gặp một khái niệm không chắc (vd. "instruction" trang 15, `C0007/T0020`) | bôi đen và nhận giải thích ngắn gọn đúng cấp độ của mình | tiếp tục đọc ngay, không phải rời trang tài liệu đi tra cứu chỗ khác | Job lõi: giải thích tại chỗ, đúng lát cắt nhóm chọn |
| JS2 | đã nhận giải thích nhưng không chắc mình hiểu đúng, hoặc tutor có thể đã trả lời nhầm nguồn (case cite sai trang `T0399`, `T0941`) | có một cách nhanh để tự kiểm tra lại mình hiểu đúng ý hay chưa | phát hiện ngay chỗ hiểu sai/tutor trả lời sai nguồn, trước khi mang hiểu lầm đó sang phần học tiếp theo | Lý do bắt buộc phải có bước "kiểm tra hiểu" — không chỉ là giải thích hay hơn |
| JS3 | đoạn bôi đen không có đủ căn cứ trong tài liệu buổi đó (vd. `T0769/C0021/U0355`: "giải thích nghĩa chi tiết của trang 4" — hệ thống không tìm thấy nội dung trang 4) | biết rõ AI không chắc/không có nguồn, thay vì AI đoán đại | tự tìm nguồn khác hoặc hỏi lại đúng cách, thay vì tin nhầm một câu trả lời không có căn cứ | Lý do cho automation "conditional" — không automate vô điều kiện |

## 5. Current alternatives

| Alternative | Làm tốt gì? | Fail ở đâu? | Vì sao user chưa bỏ nó? |
|---|---|---|---|
| Hỏi tutor VLearn hiện tại | Có sẵn ngay trong trang học, không cần rời trang, có trích trang | Trả lời 1 chiều, không kiểm tra hiểu (0,2%); một phần cite sai/thiếu trang (46,2% rỗng + case cite sai) | Vẫn là cách nhanh nhất vì không cần rời trang đang đọc |
| Tua lại video/transcript bài giảng | Xem đúng lời giảng viên, ngữ cảnh đầy đủ | Tốn thời gian tìm đúng đoạn, phải dừng đọc tài liệu | Dùng khi tutor trả lời không rõ hoặc học viên muốn nghe giọng giảng viên |
| Hỏi bạn cùng lớp | Ngữ cảnh gần, nhanh nếu bạn đang online | Không phải lúc nào cũng có bạn rảnh cùng lúc | Vẫn dùng như phương án dự phòng |
| Bỏ qua, học tiếp | Không tốn thời gian ngay lúc đó | Mang theo lỗ hổng hiểu sang phần sau, phát hiện muộn (lúc làm quiz) | Học viên ngại hỏi lại nhiều lần / không nhận ra mình chưa hiểu |

**Nếu sản phẩm nhóm không ra đời, user sẽ tiếp tục:** hỏi tutor hiện tại như cũ, tự tưởng mình đã hiểu vì không ai kiểm tra lại, và mang lỗ hổng hiểu sang phần học/quiz tiếp theo.

## 6. AI leverage point

**AI nên vào bước nào của workflow, vai trò gì:** Ngay bước "trong buổi — tutor vừa nhận câu hỏi bôi đen", đóng 2 vai trò: (a) quyết định độ chắc của nguồn trước khi trả lời, (b) sinh kèm 1 câu kiểm tra hiểu ngắn ngay sau câu trả lời.

**Vì sao không phải bước khác:** Data pack không có bằng chứng cho chặng "trước buổi"/"khi ôn lại"; root cause của pain nằm đúng ở thời điểm trả lời (thiếu bước xác nhận + thiếu kiểm tra nguồn), không phải ở khâu tìm tài liệu hay tổng kết cuối buổi.

**Product hypothesis:** Nếu giúp học viên đang đọc tài liệu trong buổi học biết chắc mình hiểu đúng một đoạn vừa hỏi, bằng cách AI tự đánh giá độ chắc của nguồn trước khi trả lời và luôn kèm 1 câu kiểm tra hiểu ngắn, họ sẽ chuyển từ việc tự đoán mình đã hiểu (rồi phát hiện sai muộn) sang biết chắc ngay tại chỗ, vì lỗ hổng hiểu được phát hiện sớm — rẻ hơn nhiều so với phát hiện lúc làm quiz/bài tập.

**Assumption nguy hiểm nhất nếu nhóm đang sai:** Học viên có thể thấy phiền khi phải trả lời thêm 1 câu kiểm tra hiểu sau mỗi câu giải thích (chỉ muốn câu trả lời nhanh, sẽ lờ đi bước này) — đây chính là câu hỏi validation #3 trong canvas, cần kiểm bằng phỏng vấn 3 willing users + vòng validation CP5.