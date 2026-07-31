# Kết quả đo lượt 1 - Golden Set (12 case)

- **Thời gian đo:** 7/31/2026, 12:51:36 PM
- **Model:** gemini-3.5-flash
- **Tổng số case:** 12
- **Số case đạt:** 0/12
- **Tỉ lệ đạt:** **0.0%**
- **Quality bar:** Đạt khi ≥ 80% qua bộ case, 100% case thiếu căn cứ không bịa nguồn.
- **Case chưa đạt:** CASE_01 (HIGH -> CONN_ERROR), CASE_02 (OUT_OF_SCOPE -> CONN_ERROR), CASE_03 (LOW -> CONN_ERROR), CASE_04 (OUT_OF_SCOPE -> CONN_ERROR), CASE_05 (HIGH -> CONN_ERROR), CASE_06 (HIGH -> CONN_ERROR), CASE_07 (HIGH -> CONN_ERROR), CASE_08 (LOW -> CONN_ERROR), CASE_09 (OUT_OF_SCOPE -> CONN_ERROR), CASE_10 (HIGH -> CONN_ERROR), CASE_11 (LOW -> CONN_ERROR), CASE_12 (HIGH -> CONN_ERROR)

## Bảng kết quả chi tiết

| ID | Lớp chỗ khó | Mong đợi | Thực tế | Đánh giá |
|---|---|---|---|---|
| CASE_01 | HIGH - Căn cứ trực tiếp | HIGH | CONN_ERROR | ERROR |
| CASE_02 | OUT_OF_SCOPE - Công cụ ngoài bài học | OUT_OF_SCOPE | CONN_ERROR | ERROR |
| CASE_03 | LOW - Input mơ hồ | LOW | CONN_ERROR | ERROR |
| CASE_04 | OUT_OF_SCOPE - Logistics | OUT_OF_SCOPE | CONN_ERROR | ERROR |
| CASE_05 | HIGH - Domain dễ nhầm | HIGH | CONN_ERROR | ERROR |
| CASE_06 | HIGH - Attention | HIGH | CONN_ERROR | ERROR |
| CASE_07 | HIGH - HAX G10 | HIGH | CONN_ERROR | ERROR |
| CASE_08 | LOW - Câu hỏi ngắn cụt | LOW | CONN_ERROR | ERROR |
| CASE_09 | OUT_OF_SCOPE - Xin tài liệu | OUT_OF_SCOPE | CONN_ERROR | ERROR |
| CASE_10 | HIGH - Khái niệm ML | HIGH | CONN_ERROR | ERROR |
| CASE_11 | LOW - Viết sai chính tả nặng | LOW | CONN_ERROR | ERROR |
| CASE_12 | HIGH - Softmax | HIGH | CONN_ERROR | ERROR |
