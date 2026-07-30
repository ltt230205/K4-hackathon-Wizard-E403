document.addEventListener('DOMContentLoaded', () => {
    const btnExplain = document.getElementById('btn-explain');
    const btnExplainLow = document.getElementById('btn-explain-low');
    const targetText = document.getElementById('target-text');

    const stateWelcome = document.getElementById('state-welcome');
    const stateUserMsg = document.getElementById('state-user-msg');
    const stateLoading = document.getElementById('state-loading');
    const stateAiCard = document.getElementById('state-ai-card');
    const stateAiLowConfidence = document.getElementById('state-ai-low-confidence');

    const optionBtns = document.querySelectorAll('#state-ai-card .opt-btn');
    const feedbackResult = document.getElementById('feedback-result');
    const btnResets = document.querySelectorAll('.btn-reset-flow');

    // Hàm bắt đầu flow
    function startFlow(isLowConfidence = false) {
        stateWelcome.classList.add('hidden');
        stateUserMsg.classList.remove('hidden');
        stateLoading.classList.remove('hidden');
        stateAiCard.classList.add('hidden');
        stateAiLowConfidence.classList.add('hidden');

        if (isLowConfidence) {
            stateUserMsg.innerHTML = 'Giải thích đoạn bôi đen: <strong>"Mô hình Generative Adversarial Networks"</strong> (Không có trong Slide 15)';
        } else {
            stateUserMsg.innerHTML = 'Giải thích đoạn bôi đen: <strong>"Attention Mechanism"</strong>';
        }

        // Giả lập thời gian AI phản hồi (1.2 giây)
        setTimeout(() => {
            stateLoading.classList.add('hidden');
            if (isLowConfidence) {
                stateAiLowConfidence.classList.remove('hidden');
            } else {
                stateAiCard.classList.remove('hidden');
            }
        }, 1200);
    }

    // Sự kiện khi bấm nút Happy Path hoặc bôi đen
    if (btnExplain) btnExplain.addEventListener('click', () => startFlow(false));
    if (targetText) targetText.addEventListener('click', () => startFlow(false));

    // Sự kiện khi bấm nút Low Confidence Path
    if (btnExplainLow) btnExplainLow.addEventListener('click', () => startFlow(true));

    // Sự kiện chọn đáp án câu hỏi kiểm tra hiểu (Happy Path)
    optionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const isCorrect = e.target.getAttribute('data-correct') === 'true';
            feedbackResult.classList.remove('hidden');

            const cardResetBtn = stateAiCard.querySelector('.btn-reset-flow');
            if (cardResetBtn) cardResetBtn.classList.remove('hidden');

            if (isCorrect) {
                feedbackResult.className = 'feedback-result success';
                feedbackResult.innerHTML = '🎉 Chính xác 100%! Bạn đã nắm vững khái niệm Attention Mechanism!';
            } else {
                feedbackResult.className = 'feedback-result error';
                feedbackResult.innerHTML = '❌ Chưa chính xác. Bạn hãy đọc lại Tầng 1 và thử lại nhé!';
            }
        });
    });

    // Reset flow
    btnResets.forEach(btn => {
        btn.addEventListener('click', () => {
            stateUserMsg.classList.add('hidden');
            stateLoading.classList.add('hidden');
            stateAiCard.classList.add('hidden');
            stateAiLowConfidence.classList.add('hidden');
            feedbackResult.classList.add('hidden');
            stateWelcome.classList.remove('hidden');
        });
    });
});