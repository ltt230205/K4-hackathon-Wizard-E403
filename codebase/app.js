document.addEventListener('DOMContentLoaded', () => {
    const btnTriggerAi = document.getElementById('btn-trigger-ai');
    const targetHighlight = document.getElementById('target-highlight');
    const dynamicStream = document.getElementById('dynamic-chat-stream');
    const chatHistory = document.getElementById('chat-history');

    async function triggerFlow() {
        dynamicStream.innerHTML = '';

        const selectedText = "Thiết kế sản phẩm AI cho sự không chắc chắn";
        const slideContext = "Slide 1: Thiết kế sản phẩm AI cho sự không chắc chắn - Từ khả năng của model đến trải nghiệm đáng tin cậy của người dùng. Instructor: Mai Anh Nguyen (Blue) - VinUniversity Day 5 2026.";

        // 1. Tạo tin nhắn User
        const userMsgHTML = `
            <div class="user-bubble-wrapper">
                <div class="context-label">Ngữ cảnh: Slide trang 1</div>
                <div class="user-bubble">${selectedText}</div>
            </div>
        `;
        dynamicStream.insertAdjacentHTML('beforeend', userMsgHTML);

        // 2. Trạng thái Loading
        const loadingHTML = `
            <div class="tutor-msg-intro" id="loading-indicator">
                ⏳ <em>VLearn Tutor đang gọi OpenAI API (gpt-4o-mini)...</em>
            </div>
        `;
        dynamicStream.insertAdjacentHTML('beforeend', loadingHTML);
        chatHistory.scrollTop = chatHistory.scrollHeight;

        try {
            // 3. Gọi tới OpenAI Backend Server (localhost:3000)
            const response = await fetch('http://localhost:3000/api/explain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ selectedText, slideContext })
            });

            const data = await response.json();

            const loadingElem = document.getElementById('loading-indicator');
            if (loadingElem) loadingElem.remove();

            if (data.confidence_level === 'HIGH') {
                const aiCardHTML = `
                    <div class="ai-card-wrapper">
                        <div class="grounding-tag">🎯 Căn cứ: Slide trang 1 | Độ tin cậy: HIGH</div>
                        
                        <div class="ai-tiers">
                            <div class="tier-item">
                                💡 <strong>Tầng 1 (Định nghĩa):</strong> ${data.explanation_layers.layer1_simple}
                            </div>
                            <div class="tier-item">
                                🔍 <strong>Tầng 2 (Ví dụ):</strong> ${data.explanation_layers.layer2_example}
                            </div>
                            <div class="tier-item">
                                📌 <strong>Tầng 3 (Căn cứ):</strong> ${data.explanation_layers.layer3_grounding}
                            </div>
                        </div>

                        <div class="check-container">
                            <div class="check-q">❓ ${data.check_question}</div>
                            <div class="check-opts">
                                ${data.options.map((opt, idx) => `
                                    <button class="opt-btn" data-correct="${opt.is_correct}">
                                        ${String.fromCharCode(65 + idx)}. ${opt.text}
                                    </button>
                                `).join('')}
                            </div>
                            <div class="result-badge" id="opt-feedback" style="display: none;"></div>
                        </div>
                    </div>
                `;
                dynamicStream.insertAdjacentHTML('beforeend', aiCardHTML);
            } else {
                // Low Confidence / Out of Scope Fallback
                const fallbackHTML = `
                    <div class="tutor-msg-intro" style="border-left: 4px solid #f59e0b; background: #fffbeb;">
                        ⚠️ <strong>Thông báo độ tin cậy (${data.confidence_level}):</strong><br>
                        ${data.fallback_message || "Mình chưa thấy căn cứ chắc chắn trong slide bài học này cho đoạn bạn chọn."}
                    </div>
                `;
                dynamicStream.insertAdjacentHTML('beforeend', fallbackHTML);
            }

            // Gắn sự kiện kiểm tra đáp án
            const optBtns = dynamicStream.querySelectorAll('.opt-btn');
            const feedbackElem = dynamicStream.querySelector('#opt-feedback');

            optBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const isCorrect = e.target.getAttribute('data-correct') === 'true';
                    feedbackElem.style.display = 'block';
                    if (isCorrect) {
                        feedbackElem.className = 'result-badge success';
                        feedbackElem.innerHTML = '🎉 Chính xác! Bạn đã hiểu đúng kiến thức!';
                    } else {
                        feedbackElem.className = 'result-badge error';
                        feedbackElem.innerHTML = '❌ Chưa đúng. Hãy đọc kỹ lại Tầng 1 & Tầng 2 nhé!';
                    }
                    chatHistory.scrollTop = chatHistory.scrollHeight;
                });
            });

        } catch (err) {
            console.error(err);
            const loadingElem = document.getElementById('loading-indicator');
            if (loadingElem) loadingElem.remove();
            dynamicStream.insertAdjacentHTML('beforeend', `<div class="tutor-msg-intro">❌ Lỗi kết nối tới Server Node.js (Vui lòng kiểm tra đã chạy "node codebase/server.js" chưa).</div>`);
        }

        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    btnTriggerAi.addEventListener('click', triggerFlow);
    targetHighlight.addEventListener('click', triggerFlow);
});