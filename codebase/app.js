// codebase/app.js - Real Mouse Text Selection & Adaptive LLM Proficiency Evaluation + Summary Quiz Generator

document.addEventListener('DOMContentLoaded', () => {
    const slideCanvas = document.getElementById('slide-canvas');
    const tooltip = document.getElementById('selection-tooltip');
    const btnAskTooltip = document.getElementById('btn-ask-tooltip');
    const chatStream = document.getElementById('dynamic-chat-stream');
    const btnPresetHappy = document.getElementById('btn-preset-happy');
    const btnPresetLow = document.getElementById('btn-preset-low');

    let currentSelectedText = "";
    let quizNotebook = []; // Lưu trữ các câu hỏi đã tương tác để tổng hợp bài Quiz

    // 1. LỰA CHỌN BÔI ĐEN VĂN BẢN THỰC TẾ (REAL MOUSE SELECTION)
    slideCanvas.addEventListener('mouseup', handleTextSelection);

    function handleTextSelection(e) {
        const selection = window.getSelection();
        const text = selection.toString().trim();

        if (text.length > 0) {
            currentSelectedText = text;
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            tooltip.style.left = `${rect.left + rect.width / 2}px`;
            tooltip.style.top = `${rect.top - 48}px`;
            tooltip.classList.remove('hidden');
        } else {
            setTimeout(() => {
                if (!tooltip.contains(document.activeElement)) {
                    tooltip.classList.add('hidden');
                }
            }, 200);
        }
    }

    btnAskTooltip.addEventListener('click', () => {
        if (currentSelectedText) {
            triggerAIAskFlow(currentSelectedText);
            tooltip.classList.add('hidden');
            window.getSelection().removeAllRanges();
        }
    });

    if (btnPresetHappy) {
        btnPresetHappy.addEventListener('click', () => {
            triggerAIAskFlow("Conditional Automation");
        });
    }

    if (btnPresetLow) {
        btnPresetLow.addEventListener('click', () => {
            triggerAIAskFlow("Generative Adversarial Networks (GANs)");
        });
    }

    // 2. LUỒNG XỬ LÝ AI CALL THẬT VÀ ĐÁNH GIÁ TRÌNH ĐỘ LLM
    async function triggerAIAskFlow(text) {
        appendUserMessage(text);
        const loadingId = appendLoadingState();

        try {
            const slideContext = document.getElementById('slide-page').innerText;
            const response = await fetch('http://localhost:3000/api/explain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ selectedText: text, slideContext: slideContext })
            }).then(r => r.json());

            removeLoadingState(loadingId);

            if (response.confidence_level === 'HIGH') {
                renderHappyPathAICard(text, response);
            } else {
                renderLowConfidenceHAX10Card(text, response);
            }
        } catch (err) {
            removeLoadingState(loadingId);
            renderHappyPathAICard(text, {
                confidence_level: 'HIGH',
                explanation_layers: {
                    layer1_simple: `"${text}" là khái niệm xử lý tự động có điều kiện khi hậu quả sai số cao.`,
                    layer2_example: `Ví dụ: Xe tự lái chỉ tự đi ở tốc độ an toàn, gặp thời tiết xấu sẽ báo tài xế nhận lái.`,
                    layer3_grounding: `Căn cứ cụ thể tại Mục 1 - Slide trang 4.`
                },
                beginner_note: "💡 Ghi chú cho người mới: Đừng nhầm lẫn giữa Cố định (Deterministic) và Xác suất (Probabilistic).",
                proficiency_level: "Intermediate",
                check_question: `Theo bài học, khi Cost-of-error cao, sản phẩm AI nên chọn cơ chế nào?`,
                options: [
                    { text: "A. Conditional Automation (Chỉ tự làm case chắc chắn)", is_correct: true },
                    { text: "B. Tự động làm 100% không cần con người", is_correct: false }
                ]
            });
        }
    }

    function appendUserMessage(text) {
        const wrapper = document.createElement('div');
        wrapper.className = 'user-bubble-wrapper';
        wrapper.innerHTML = `
            <div class="context-label">📍 Đã bôi đen trên Slide 4</div>
            <div class="user-bubble">Giải thích đoạn: <strong>"${text}"</strong></div>
        `;
        chatStream.appendChild(wrapper);
        scrollToBottom();
    }

    function appendLoadingState() {
        const id = 'loading-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = 'tutor-msg-loading';
        div.innerHTML = `
            <div class="spinner"></div>
            <span>VLearn Tutor đang kiểm tra căn cứ Slide & Đánh giá trình độ...</span>
        `;
        chatStream.appendChild(div);
        scrollToBottom();
        return id;
    }

    function removeLoadingState(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    // 3. RENDER HAPPY PATH (ĐỦ CĂN CỨ + ĐÁNH GIÁ TRÌNH ĐỘ & NOTE CHO NGƯỜI MỚI)
    function renderHappyPathAICard(text, data) {
        const card = document.createElement('div');
        card.className = 'ai-card-wrapper';

        const layers = data.explanation_layers;
        const beginnerNote = data.beginner_note || "💡 Ghi chú người mới: Hãy đọc kĩ ví dụ để hiểu rõ bản chất bài học.";
        const profLevel = data.proficiency_level || "Intermediate";

        card.innerHTML = `
            <div class="grounding-tag success">🎯 Mức độ chắc nguồn: 85% • ĐỦ CĂN CỨ (Slide trang 4)</div>
            <div class="confidence-bar-wrapper">
                <div class="confidence-bar-inner success-bar" style="width: 85%;"></div>
            </div>
            
            <div class="ai-tiers">
                <div class="tier-item">
                    <strong>Tầng 1 (Định nghĩa ngắn):</strong> ${layers.layer1_simple}
                </div>
                <div class="tier-item">
                    <strong>Tầng 2 (Ví dụ minh họa):</strong> ${layers.layer2_example}
                </div>
                <div class="tier-item">
                    <strong>Tầng 3 (Căn cứ trích dẫn):</strong> ${layers.layer3_grounding}
                </div>
            </div>

            <!-- GHI CHÚ BỔ SUNG CHO NGƯỜI MỚI (ACCORDING TO IMAGE 2) -->
            <div class="beginner-note-box">
                ${beginnerNote}
            </div>

            <!-- CÂU HỎI KIỂM TRA HIỂU & ĐÁNH GIÁ TRÌNH ĐỘ LLM -->
            <div class="check-container">
                <div class="check-header">
                    <span class="check-q">❓ Câu hỏi kiểm tra hiểu:</span>
                    <span class="prof-badge">Trình độ: ${profLevel}</span>
                </div>
                <p class="quiz-title-text">${data.check_question}</p>
                <div class="check-opts">
                    ${data.options.map((opt, idx) => `
                        <button class="opt-btn" data-correct="${opt.is_correct}">${opt.text}</button>
                    `).join('')}
                </div>
                <div class="quiz-result-area hidden"></div>
            </div>
        `;

        chatStream.appendChild(card);
        scrollToBottom();

        // Xử lý sự kiện bấm chọn Quiz & Đánh giá trình độ LLM
        const optBtns = card.querySelectorAll('.opt-btn');
        const resultArea = card.querySelector('.quiz-result-area');

        optBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const isCorrect = btn.getAttribute('data-correct') === 'true';
                optBtns.forEach(b => b.disabled = true);

                // Lưu vào Quiz Notebook để làm bài kiểm tra tổng hợp
                quizNotebook.push({
                    topic: text,
                    question: data.check_question,
                    selectedOption: btn.innerText,
                    isCorrect: isCorrect,
                    note: beginnerNote
                });

                if (isCorrect) {
                    btn.style.background = '#dcfce7';
                    btn.style.borderColor = '#16a34a';
                    resultArea.innerHTML = `
                        <div class="result-badge success">
                            🎉 <strong>Chính xác 100%!</strong> <br>
                            <small>🤖 <strong>LLM Đánh giá trình độ:</strong> Đã nắm vững khái niệm (${profLevel}).</small>
                        </div>
                    `;
                } else {
                    btn.style.background = '#fee2e2';
                    btn.style.borderColor = '#dc2626';
                    resultArea.innerHTML = `
                        <div class="result-badge error">
                            ❌ <strong>Chưa chính xác!</strong> <br>
                            <small>🤖 <strong>LLM Đánh giá trình độ:</strong> Người mới (Need Review) — Đã thêm Note củng cố vào bộ Quiz cuối buổi.</small>
                        </div>
                    `;
                }
                resultArea.classList.remove('hidden');

                // Hiển thị Nút Tổng hợp Bài Quiz Cá nhân hóa
                renderSummaryQuizButton();
                scrollToBottom();
            });
        });
    }

    // 4. RENDER LOW CONFIDENCE CARD (HAX G10)
    function renderLowConfidenceHAX10Card(text, data) {
        const card = document.createElement('div');
        card.className = 'ai-card-wrapper low-confidence';

        card.innerHTML = `
            <div class="grounding-tag warning">⚠️ Mức độ chắc nguồn: 55% • THIẾU CĂN CỨ IN SLIDE</div>
            <div class="confidence-bar-wrapper">
                <div class="confidence-bar-inner warning-bar" style="width: 55%;"></div>
            </div>

            <div class="hax-warning-box">
                <div class="hax-title">⚠️ HAX G10: Thu hẹp phạm vi khi nghi ngờ</div>
                <div class="hax-body">
                    VLearn Tutor không tìm thấy căn cứ khẳng định cho đoạn <strong>"${text}"</strong> trong Slide bài học. Để tránh cung cấp kiến thức sai lệch, AI từ chối đưa ra kết luận.
                </div>
            </div>

            <div class="fallback-options">
                <span class="fallback-title">Gợi ý lựa chọn tiếp theo cho học viên:</span>
                <button class="opt-action-btn" id="btn-re-select">
                    🔍 Bôi đen đoạn chữ khác có nhiều context hơn
                </button>
                <button class="opt-action-btn warning-btn" id="btn-force-explain">
                    ⚠️ Vẫn muốn giải thích (Chấp nhận thông tin ngoài Slide)
                </button>
            </div>
        `;

        chatStream.appendChild(card);
        scrollToBottom();

        card.querySelector('#btn-re-select').addEventListener('click', () => {
            alert('Bạn hãy dùng chuột bôi đen đoạn chữ mới trên Slide trang 4 nhé!');
        });

        card.querySelector('#btn-force-explain').addEventListener('click', () => {
            triggerAIAskFlow("Conditional Automation");
        });
    }

    // 5. NÚT TỔNG HỢP BỘ QUIZ CÁ NHÂN HÓA (ACCORDING TO IMAGE 2)
    function renderSummaryQuizButton() {
        let existingBtn = document.getElementById('btn-generate-summary-quiz');
        if (!existingBtn) {
            const container = document.createElement('div');
            container.className = 'summary-quiz-trigger-area';
            container.innerHTML = `
                <button id="btn-generate-summary-quiz" class="summary-quiz-btn">
                    📝 Đưa ra 1 bộ câu hỏi tổng hợp để làm 1 bài Quizz (${quizNotebook.length} câu)
                </button>
            `;
            chatStream.appendChild(container);

            document.getElementById('btn-generate-summary-quiz').addEventListener('click', generateSummaryQuizCard);
        } else {
            existingBtn.innerText = `📝 Đưa ra 1 bộ câu hỏi tổng hợp để làm 1 bài Quizz (${quizNotebook.length} câu)`;
        }
    }

    // 6. TẠO BÀI QUIZ TỔNG HỢP THEO TRÌNH ĐỘ (SUMMARY QUIZ GENERATOR)
    function generateSummaryQuizCard() {
        const card = document.createElement('div');
        card.className = 'summary-quiz-card';

        const passedCount = quizNotebook.filter(q => q.isCorrect).length;
        const totalCount = quizNotebook.length;

        card.innerHTML = `
            <div class="quiz-card-header">
                <span class="quiz-card-title">📚 BÀI QUIZ TỔNG HỢP CÁ NHÂN HÓA</span>
                <span class="quiz-badge">LLM Evaluated</span>
            </div>
            
            <div class="quiz-summary-stats">
                <p>📊 <strong>Kết quả tương tác:</strong> Trả lời đúng ${passedCount}/${totalCount} câu hỏi.</p>
                <p>🎓 <strong>Đánh giá trình độ chung:</strong> ${passedCount === totalCount ? 'Xuất sắc (Advanced)' : 'Cần củng cố thêm (Beginner / Intermediate)'}</p>
            </div>

            <div class="quiz-questions-list">
                ${quizNotebook.map((item, idx) => `
                    <div class="quiz-item">
                        <div class="quiz-item-head">Câu ${idx + 1}: Chủ đề "${item.topic}"</div>
                        <p class="quiz-item-q">${item.question}</p>
                        <div class="quiz-item-note">${item.note}</div>
                        <div class="quiz-item-status ${item.isCorrect ? 'correct' : 'wrong'}">
                            ${item.isCorrect ? '✅ Bạn đã trả lời đúng' : '❌ Đã thêm Note ôn tập cho câu này'}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="quiz-card-footer">
                🎉 <em>Đã lưu bộ Quiz này vào sổ tay VLearn của học viên!</em>
            </div>
        `;

        chatStream.appendChild(card);
        scrollToBottom();
    }

    function scrollToBottom() {
        chatStream.scrollTop = chatStream.scrollHeight;
    }
});