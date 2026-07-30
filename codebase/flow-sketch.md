# Flow Sketch — Giải thích đoạn bôi đen + kiểm tra hiểu

> Prototype UX flow cho lát cắt (xem `cp1-canvas.md` mục 5):
> "Khi một học viên bôi đen một khái niệm trên VLearn và hỏi giải thích, AI quyết định mức độ chắc của nguồn và tạo câu trả lời ngắn theo 3 tầng kèm 1 câu kiểm tra hiểu, để học viên biết mình đã hiểu đúng trước khi học tiếp."

## Luồng chính (happy path)

1. Học viên đang đọc slide/tài liệu trên VLearn, **bôi đen** một đoạn/khái niệm chưa chắc hiểu.
2. Menu bôi đen nổi lên với nút **"Hỏi AI"** (cạnh các nút có sẵn khác như "Báo bối rối", "Ghi chú").
3. Bấm nút → AI kiểm tra đoạn này có đủ căn cứ trong slide/transcript buổi học không (quyết định trung tâm).
4. Nếu **đủ căn cứ** → AI trả lời theo 3 tầng:
   - **Tầng 1:** giải thích ngắn gọn 1-2 câu, đúng trọng tâm đoạn bôi đen.
   - **Tầng 2:** ví dụ/diễn giải cụ thể hơn (nếu học viên cần đọc thêm).
   - **Tầng 3:** liên hệ mở rộng/điểm dễ nhầm liên quan (nếu có).
   - Kèm **1 câu kiểm tra hiểu** ở cuối (dạng trắc nghiệm ngắn hoặc yêu cầu diễn giải lại bằng lời mình).
5. Học viên trả lời câu kiểm tra → AI phản hồi đúng/sai + gợi ý học tiếp hay xem lại tầng 2.

## Nhánh "hành vi khi sai" (bắt buộc thể hiện ở mức Sketch)

3b. Nếu **không đủ căn cứ** / đoạn bôi đen mơ hồ / ngoài phạm vi tài liệu → AI **không bịa**, hiện rõ: *"Mình chưa thấy căn cứ chắc chắn trong tài liệu buổi này cho đoạn bạn chọn"* + 1 hành động tiếp theo (bôi đen lại đoạn rõ hơn / xác nhận vẫn muốn AI thử giải thích ở mức "không chắc"). Nguyên tắc áp dụng: **G10 — thu hẹp phạm vi khi nghi ngờ**.

## Màn hình dựng nhanh (2 màn hình nối tiếp)

### Màn hình 1 — Bôi đen trên slide, nút "Hỏi AI" hiện ra

```
┌──────────────────────────────────────────────────────────────┐
│ ←  VLearn   day05-ai-product-thinking-requirements.pdf   VI 🌙│
├──────────────────────────────────────────────────────────────┤
│ [Đọc] [Bút] [Highlight] ···           Trang 4 · 1 note  100% │
├──────────────────────────────────────────────────────────────┤
│  Mục tiêu buổi học                                            │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ AI product ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓     │◄── đoạn bôi đen
│                  ┌─────────────────────────────────┐         │
│                  │ 💬 Hỏi AI │ ⚠ Báo bối rối │📝 Ghi chú│    │◄── menu nổi khi bôi đen
│                  └─────────────────────────────────┘         │
│  Biết cách chuyển user needs thành requirements đo được       │
│  Viết được PRD dùng chung cho PM, BA, Engineer, Stakeholder    │
└──────────────────────────────────────────────────────────────┘
```

Học viên bôi đen đoạn chưa chắc hiểu → menu nổi lên → bấm **"Hỏi AI"** → chuyển sang Màn hình 2.

### Màn hình 2 — Panel "VLearn Tutor" trả lời

```
┌───────────────────────────────────┐
│ 🤖 VLearn Tutor                    │
│    Trợ lý học theo ngữ cảnh        │
├───────────────────────────────────┤
│ Ngữ cảnh: Slide trang 4            │
│ "AI product vs software feature    │
│  thông thường"                     │
│                                     │
│ Tầng 1: [giải thích ngắn 1-2 câu]  │
│ Tầng 2: [ví dụ cụ thể hơn]         │
│ Tầng 3: [mở rộng/liên hệ nếu có]   │
│                                     │
│ ❓ Kiểm tra hiểu: [1 câu hỏi ngắn]  │
│ [ Ô trả lời__________ ]  [Gửi]     │
│                                     │
│ Phản hồi này có hữu ích không?     │
│  👍 👎                             │
│ ▓▓▓▓▓▓▓▓▓░░ 85% · Rất tin cậy      │
│                     ● ĐÃ TRẢ LỜI   │
└───────────────────────────────────┘
```

### Màn hình 2b — Nhánh "không đủ căn cứ" (hành vi khi sai, bắt buộc ở mức Sketch)

```
┌───────────────────────────────────┐
│ 🤖 VLearn Tutor                    │
├───────────────────────────────────┤
│ Ngữ cảnh: Slide trang 4            │
│                                     │
│ Mình chưa đủ căn cứ chắc chắn      │
│ trong tài liệu buổi này cho đoạn   │
│ bạn chọn.                          │
│                                     │
│ [ Bôi đen lại đoạn khác ]          │
│ [ Vẫn thử giải thích (không chắc) ]│
│                                     │
│ ▓▓▓▓▓░░░░░ 60% · Trung bình        │
│                     ● ĐÃ TRẢ LỜI   │
└───────────────────────────────────┘
```

Thanh % ở cả hai màn hình 2 chính là hiển thị **mức độ chắc của nguồn** — quyết định trung tâm của lát cắt (theo automation "Conditional" đã chốt ở canvas): ≥ ngưỡng → trả lời đầy đủ 3 tầng + câu kiểm tra; < ngưỡng → chuyển sang nhánh 2b.

## Ghi chú build (mức Sketch — CP2)

- Data giả: 1-2 đoạn slide mẫu hard-code, không cần kết nối VLearn thật.
- Bước 3 (đánh giá độ chắc + sinh câu trả lời 3 tầng) là nơi gắn AI call thật nếu kịp.
- Phần còn lại (menu bôi đen, hiển thị badge, luồng điều hướng) có thể mock tay.
