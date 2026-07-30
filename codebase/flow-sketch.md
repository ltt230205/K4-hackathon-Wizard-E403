# Flow Sketch — Giải thích đoạn bôi đen + kiểm tra hiểu

> Prototype UX flow cho lát cắt (xem `cp1-canvas.md` mục 5):
> "Khi một học viên bôi đen một khái niệm trên VLearn và hỏi giải thích, AI quyết định mức độ chắc của nguồn và tạo câu trả lời ngắn theo 3 tầng kèm 1 câu kiểm tra hiểu, để học viên biết mình đã hiểu đúng trước khi học tiếp."

## Luồng chính (happy path)

1. Học viên đang đọc slide/tài liệu trên VLearn, **bôi đen** một đoạn/khái niệm chưa chắc hiểu.
2. Menu bôi đen nổi lên nút **"Hỏi AI giải thích"**.
3. Bấm nút → AI kiểm tra đoạn này có đủ căn cứ trong slide/transcript buổi học không (quyết định trung tâm).
4. Nếu **đủ căn cứ** → AI trả lời theo 3 tầng:
   - **Tầng 1:** giải thích ngắn gọn 1-2 câu, đúng trọng tâm đoạn bôi đen.
   - **Tầng 2:** ví dụ/diễn giải cụ thể hơn (nếu học viên cần đọc thêm).
   - **Tầng 3:** liên hệ mở rộng/điểm dễ nhầm liên quan (nếu có).
   - Kèm **1 câu kiểm tra hiểu** ở cuối (dạng trắc nghiệm ngắn hoặc yêu cầu diễn giải lại bằng lời mình).
5. Học viên trả lời câu kiểm tra → AI phản hồi đúng/sai + gợi ý học tiếp hay xem lại tầng 2.

## Nhánh "hành vi khi sai" (bắt buộc thể hiện ở mức Sketch)

3b. Nếu **không đủ căn cứ** / đoạn bôi đen mơ hồ / ngoài phạm vi tài liệu → AI **không bịa**, hiện rõ: *"Mình chưa thấy căn cứ chắc chắn trong tài liệu buổi này cho đoạn bạn chọn"* + 1 hành động tiếp theo (bôi đen lại đoạn rõ hơn / xác nhận vẫn muốn AI thử giải thích ở mức "không chắc"). Nguyên tắc áp dụng: **G10 — thu hẹp phạm vi khi nghi ngờ**.

## Màn hình dựng nhanh (1 màn hình)

```
┌─────────────────────────────────────────────┐
│  VLearn — Buổi 4: Cấu trúc dữ liệu           │
│                                               │
│  ...một hàng đợi ưu tiên (priority queue)    │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ dùng heap để...   │◄── đoạn bôi đen
│                     ┌───────────────────────┐│
│                     │ 💬 Hỏi AI giải thích  ││◄── nút nổi lên khi bôi đen
│                     └───────────────────────┘│
│  ...phần còn lại của slide...                │
├─────────────────────────────────────────────┤
│  🔵 Đủ căn cứ — theo slide trang 12          │◄── badge độ chắc
│                                               │
│  Tầng 1: [giải thích ngắn 1-2 câu]           │
│  Tầng 2: [ví dụ cụ thể hơn]                  │
│  Tầng 3: [mở rộng/liên hệ, nếu có]           │
│                                               │
│  ❓ Kiểm tra hiểu: [1 câu hỏi ngắn]           │
│  [ Ô trả lời________________ ]  [Gửi]        │
│                                               │
│  👍 👎  (feedback nhanh)                     │
└─────────────────────────────────────────────┘

--- Nhánh không đủ căn cứ ---
┌─────────────────────────────────────────────┐
│  🟡 Chưa đủ căn cứ trong tài liệu buổi này   │
│  Mình chưa chắc về đoạn bạn chọn.            │
│  [ Bôi đen lại đoạn khác ]  [ Vẫn thử giải   │
│                               thích (không   │
│                               chắc) ]        │
└─────────────────────────────────────────────┘
```

## Ghi chú build (mức Sketch — CP2)

- Data giả: 1-2 đoạn slide mẫu hard-code, không cần kết nối VLearn thật.
- Bước 3 (đánh giá độ chắc + sinh câu trả lời 3 tầng) là nơi gắn AI call thật nếu kịp.
- Phần còn lại (menu bôi đen, hiển thị badge, luồng điều hướng) có thể mock tay.
