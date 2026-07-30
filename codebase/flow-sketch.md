# Flow Sketch — Giải thích đoạn bôi đen + kiểm tra hiểu (Bám sát JTBD Worksheet)

> **Core JTBD (từ `tham-khao/worksheet-jtbd-day-du.md`):**
> `"Làm rõ ngay chỗ vừa đọc không hiểu mà không phải rời trang tài liệu."`
>
> **Job Story:**
> *When* đang đọc slide/tài liệu bài giảng trên VLearn và bôi đen 1 khái niệm chưa chắc hiểu,  
> *I want to* nhận ngay câu giải thích 3 tầng đúng bối cảnh và được thử trả lời 1 câu kiểm tra hiểu ngắn,  
> *So I can* chắc chắn mình đã hiểu đúng bản chất trước khi học tiếp mà không phải tua video hay mở ChatGPT riêng.

## 1. Job Executor & Workflow (8 bước Job Map)

- **Job Executor:** Học viên đang học/ôn bài trực tiếp trên VLearn.
- **Job Map (Chặng Execute & Confirm):**
  1. *Locate & Prepare:* Học viên bôi đen khái niệm chưa chắc trên slide.
  2. *Confirm & Execute:* Floating Tooltip `[ 💬 Hỏi AI ]` xuất hiện -> AI Tutor kiểm tra căn cứ nguồn (Slide/Transcript).
  3. *Monitor & Modify:*
     - **Trường hợp đủ căn cứ (≥ 80%):** Trả lời 3 tầng (Tầng 1 Định nghĩa, Tầng 2 Ví dụ, Tầng 3 Căn cứ) + Câu hỏi trắc nghiệm kiểm tra hiểu.
     - **Trường hợp thiếu căn cứ (< 80% - HAX G10):** Thu hẹp phạm vi khi nghi ngờ, từ chối khẳng định và gợi ý 2 hướng hành động tiếp theo.
  4. *Conclude:* Học viên bấm chọn đáp án trắc nghiệm -> Nhận phản hồi kết quả và hoàn thành Job mà không rời khỏi trang tài liệu.

## 2. Alternatives & AI Leverage Point

| Alternative | Fail ở đâu? | AI Leverage Point của VLearn Tutor |
|---|---|---|
| Hỏi Tutor cũ | Trả lời 1 chiều, gần như 0% hỏi lại kiểm tra hiểu (0,2% trong chatlog) | Chủ động đặt 1 câu hỏi trắc nghiệm kiểm tra hiểu ở Tầng 3 |
| ChatGPT/Claude ngoài | Không có dữ liệu Slide/Transcript bài giảng, dễ bịa | Định danh căn cứ trích dẫn nguồn trực tiếp (Grounding Slide N) |
| Tua video bài giảng | Mất 15-20 phút tìm đúng đoạn giảng viên giải thích | Giải thích ngay tại chỗ trong 3 giây |

## 3. Quy trình Màn hình UI (codebase/index.html & app.js)

```
┌──────────────────────────────────────────────────────────────┐
│  VLearn — day05-ai-product-thinking-requirements.pdf   VI 🌙 │
│  Core JTBD: Làm rõ ngay chỗ đọc không hiểu tại chỗ           │
├──────────────────────────────────────────────────────────────┤
│  Mục tiêu buổi học:                                           │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ Conditional Automation ▓▓▓▓▓▓▓         │◄── bôi đen bằng chuột
│                 ┌─────────────────────────────────┐          │
│                 │ 💬 Hỏi AI │ ⚠ Báo bối rối │📝 Ghi chú│     │◄── floating menu
│                 └─────────────────────────────────┘          │
├──────────────────────────────────────────────────────────────┤
│ 🤖 VLearn Tutor                                              │
│                                                              │
│ 🎯 Mức độ chắc của nguồn: 85% • ĐỦ CĂN CỨ (Slide trang 4)    │
│ Tầng 1 (Định nghĩa): [giải thích ngắn]                        │
│ Tầng 2 (Ví dụ): [ví dụ minh họa]                             │
│ Tầng 3 (Căn cứ): [trích dẫn Slide 4]                          │
│                                                              │
│ ❓ Câu hỏi kiểm tra hiểu:                                    │
│ [ A. Đáp án 1 ]  [ B. Đáp án 2 (Đúng) ]                     │
│                                                              │
│ 🎉 Correct! ✅ Job Completed: Học viên hiểu bài tại chỗ!    │
└──────────────────────────────────────────────────────────────┘
```
