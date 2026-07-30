document.addEventListener('DOMContentLoaded', () => {
    const slideCanvas = document.getElementById('slide-canvas');
    const tooltip = document.getElementById('selection-tooltip');
    const btnAskTooltip = document.getElementById('btn-ask-tooltip');
    
    const btnPresetHappy = document.getElementById('btn-preset-happy');
    const btnPresetLow = document.getElementById('btn-preset-low');
    
    const dynamicStream = document.getElementById('dynamic-chat-stream');
    const chatHistory = document.getElementById('chat-history');

    let currentSelectedText = '';

    // 1. Lắng nghe sự kiện bôi đen chuột trên Slide Canvas
    document.addEventListener('mouseup', (e) => {
        const selection = window.getSelection();
        const text = selection.toString().trim();

        // Kiểm tra nếu người dùng thả chuột trong vùng Slide Canvas và có chọn chữ
        if (text.length > 2 && slideCanvas.contains(selection.anchorNode)) {
            currentSelectedText = text;

            // Tính vị trí nổi lên của Menu Tooltip
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            tooltip.style.left = `${rect.left + rect.width / 2}px`;
            tooltip.style.top = `${rect.top - 48}px`;
            tooltip.classList.remove('hidden');
        } else {
            // Ẩn tooltip nếu bấm ra ngoài mà không chọn chữ (trừ khi bấm nút trên tooltip)
            if (!tooltip.contains(e.target)) {
                tooltip.classList.add('hidden');
            }
        }
    });

    // 2. Hàm chạy luồng giải thích AI Tutor từng bước (Sequence Flow)
    function processSelectionFlow(textInput) {
        const text = textInput || currentSelectedText || 'Conditional Automation';
        tooltip.classList.add('hidden');

        // Reset hoặc xóa tin nhắn chào cũ nếu cần
        dynamicStream.innerHTML = '';

        // Đánh giá độ tin cậy từ căn cứ slide (Logic Conditional Mode)
        const isLowConfidence = text.toLowerCase().includes('gan') || 
                               text.toLowerCase().includes('generative adversarial') || 
                               text.toLowerCase().includes('ngoại lệ') ||
                               text.toLowerCase().includes('đối kháng');

        const confidenceScore = isLowConfidence ? 55 : 85;
        const confidenceLabel = isLowConfidence ? '55% • Trung bình (Cảnh báo thiếu căn cứ)' : '85% • Rất tin cậy (Có trong Slide 4)';

        // STEP 1: Render User Message Bubble
        const userMsgHTML = `
            <div class="user-bubble-wrapper">
                <div class="context-label">Ngữ cảnh: Slide trang 4</div>
                <div class="user-bubble">Giải thích đoạn bôi đen: <strong>"${escapeHTML(text)}"</strong></div>
            </div>
        `;
        dynamicStream.insertAdjacentHTML('beforeend', userMsgHTML);

        // STEP 2: Render Loading State
        const loadingHTML = `
            <div class="tutor-msg-loading" id="loading-indicator">
                <div class="spinner"></div>
                <span>AI đang rà soát Slide trang 4 và kiểm tra căn cứ nguồn...</span>
            </div>
        `;
        dynamicStream.insertAdjacentHTML('beforeend', loadingHTML);
        chatHistory.scrollTop = chatHistory.scrollHeight;

        // STEP 3: Phản hồi AI sau 1 giây đối chiếu
        setTimeout(() => {
            const loadingElem = document.getElementById('loading-indicator');
            if (loadingElem) loadingElem.remove();

            if (isLowConfidence) {
                // CASE 2B: Nhánh "Không đủ căn cứ" (HAX G10 - Thu hẹp phạm vi khi nghi ngờ)
                const lowConfidenceHTML = `
                    <div class="ai-card-wrapper low-confidence">
                        <div class="grounding-tag warning">⚠️ Mức độ chắc của nguồn: ${confidenceScore}% • THIẾU CĂN CỨ</div>
                        
                        <div class="hax-warning-box">
                            <p class="hax-title">🛡️ Nguyên tắc HAX G10 — Thu hẹp phạm vi khi nghi ngờ:</p>
                            <p class="hax-body">Tài liệu Slide trang 4 buổi này không đề cập chắc chắn đến khái niệm <strong>"${escapeHTML(text)}"</strong>. AI từ chối khẳng định để tránh đưa ra kiến thức sai lệch cho học viên.</p>
                        </div>

                        <div class="fallback-options">
                            <p class="fallback-title"><strong>Bạn muốn xử lý thế nào tiếp theo?</strong></p>
                            <button class="opt-action-btn" id="btn-reselect-action">🔍 Bôi đen đoạn khác trên Slide 4 có liên quan</button>
                            <button class="opt-action-btn warning-btn" id="btn-force-action">⚠️ Vẫn thử giải thích (chấp nhận không chắc)</button>
                        </div>

                        <div class="confidence-bar-wrapper">
                            <div class="confidence-bar-inner warning-bar" style="width: ${confidenceScore}%;"></div>
                        </div>
                        <div class="confidence-text">${confidenceLabel} • ĐÃ TRẢ LỜI</div>
                    </div>
                `;
                dynamicStream.insertAdjacentHTML('beforeend', lowConfidenceHTML);
            } else {
                // CASE 1: Happy Path (Trả lời 3 Tầng + Câu hỏi kiểm tra hiểu)
                const happyHTML = `
                    <div class="ai-card-wrapper">
                        <div class="grounding-tag success">🎯 Mức độ chắc của nguồn: ${confidenceScore}% • ĐỦ CĂN CỨ (Slide trang 4)</div>
                        
                        <div class="ai-tiers">
                            <div class="tier-item">
                                💡 <strong>Tầng 1 (Định nghĩa):</strong> Khái niệm <em>"${escapeHTML(text)}"</em> là phương pháp thiết kế để hệ thống AI tự động xử lý khi có căn cứ chắc chắn và biết dừng/hỏi lại khi thiếu thông tin.
                            </div>
                            <div class="tier-item">
                                🔍 <strong>Tầng 2 (Ví dụ/Chi tiết):</strong> Giống như AI Tutor từ chối trả lời nếu khái niệm không có trong Slide thay vì bịa ngẫu nhiên làm học viên học sai kiến thức.
                            </div>
                            <div class="tier-item">
                                📌 <strong>Tầng 3 (Căn cứ):</strong> Trích từ mục 1 Slide trang 4 (VinUniversity) — nhằm đảm bảo tính chính xác tuyệt đối trong môi trường học thuật.
                            </div>
                        </div>

                        <!-- Câu hỏi kiểm tra hiểu -->
                        <div class="check-container">
                            <div class="check-q">❓ <strong>Câu hỏi kiểm tra hiểu:</strong> Dựa vào đoạn bôi đen trên, khi Cost-of-error đắt chúng ta nên áp dụng nguyên tắc nào?</div>
                            <div class="check-opts">
                                <button class="opt-btn" data-correct="false">A. Cho AI tự động trả lời 100% không cần kiểm soát.</button>
                                <button class="opt-btn" data-correct="true">B. Áp dụng Conditional Automation: chỉ tự trả lời khi chắc chắn, nghi ngờ thì từ chối/hỏi lại (HAX G10).</button>
                            </div>
                            <div class="result-badge" id="opt-feedback" style="display: none;"></div>
                        </div>

                        <div class="confidence-bar-wrapper">
                            <div class="confidence-bar-inner success-bar" style="width: ${confidenceScore}%;"></div>
                        </div>
                        <div class="confidence-text">${confidenceLabel} • ĐÃ TRẢ LỜI</div>
                    </div>
                `;
                dynamicStream.insertAdjacentHTML('beforeend', happyHTML);

                // Gắn listener chọn đáp án trắc nghiệm
                const optBtns = dynamicStream.querySelectorAll('.opt-btn');
                const feedbackElem = dynamicStream.querySelector('#opt-feedback');

                optBtns.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const isCorrect = e.target.getAttribute('data-correct') === 'true';
                        feedbackElem.style.display = 'block';
                        if (isCorrect) {
                            feedbackElem.className = 'result-badge success';
                            feedbackElem.innerHTML = '🎉 Chính xác 100%! Bạn đã hiểu sâu khái niệm Conditional Automation.';
                        } else {
                            feedbackElem.className = 'result-badge error';
                            feedbackElem.innerHTML = '❌ Chưa đúng. Hãy đọc lại Tầng 1 và Tầng 2 ở trên nhé!';
                        }
                        chatHistory.scrollTop = chatHistory.scrollHeight;
                    });
                });
            }

            chatHistory.scrollTop = chatHistory.scrollHeight;
        }, 900);
    }

    // Helper escape HTML
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    // 3. Sự kiện bấm nút "Hỏi AI" trên Tooltip bôi đen
    if (btnAskTooltip) {
        btnAskTooltip.addEventListener('click', () => processSelectionFlow());
    }

    // 4. Sự kiện bấm mẫu demo nhanh
    if (btnPresetHappy) {
        btnPresetHappy.addEventListener('click', () => processSelectionFlow('Conditional Automation'));
    }

    if (btnPresetLow) {
        btnPresetLow.addEventListener('click', () => processSelectionFlow('Generative Adversarial Networks (GANs)'));
    }
});