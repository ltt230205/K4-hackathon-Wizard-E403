// codebase/app.js - UI flow for layered agent reasoning and level-based quiz.
document.addEventListener('DOMContentLoaded', () => {
    const slideCanvas = document.getElementById('slide-canvas');
    const slidePage = document.getElementById('slide-page');
    const tooltip = document.getElementById('selection-tooltip');
    const btnAskTooltip = document.getElementById('btn-ask-tooltip');
    const chatStream = document.getElementById('dynamic-chat-stream');
    const btnPresetHappy = document.getElementById('btn-preset-happy');
    const btnPresetLow = document.getElementById('btn-preset-low');
    const btnUploadSlide = document.getElementById('btn-upload-slide');
    const slideFileInput = document.getElementById('slide-file-input');
    const uploadStatus = document.getElementById('upload-status');
    const pageCountBadge = document.getElementById('page-count-badge');
    const sendBtn = document.querySelector('.send-btn');
    const input = document.querySelector('.chat-input-bar input');

    let currentSelectedText = '';
    let uploadedDeckText = '';
    let pdfjsLibPromise = null;

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function scrollToBottom() {
        chatStream.scrollTop = chatStream.scrollHeight;
    }

    function hideTooltip() {
        tooltip.classList.add('hidden');
    }

    function getSlideContext() {
        return uploadedDeckText || (slideCanvas ? slideCanvas.innerText : '');
    }

    function getSelectedText() {
        const selection = window.getSelection();
        const text = selection ? selection.toString().trim() : '';
        if (!text || !slideCanvas || !slideCanvas.contains(selection.anchorNode)) return '';
        return text;
    }

    function showTooltipForSelection() {
        const text = getSelectedText();
        if (!text) {
            hideTooltip();
            return;
        }

        currentSelectedText = text;
        input.value = text;
        const range = window.getSelection().getRangeAt(0);
        const rect = range.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${Math.max(58, rect.top - 48)}px`;
        tooltip.classList.remove('hidden');
    }

    function setUploadStatus(message, state = 'info') {
        if (!uploadStatus) return;
        uploadStatus.textContent = message;
        uploadStatus.className = `upload-status ${state}`;
    }

    async function loadPdfJs() {
        if (!pdfjsLibPromise) {
            pdfjsLibPromise = import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs')
                .then(module => {
                    module.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
                    return module;
                });
        }
        return pdfjsLibPromise;
    }

    function createPdfPageShell(pageNumber) {
        const pageWrapper = document.createElement('div');
        pageWrapper.className = 'pdf-render-page';
        pageWrapper.dataset.page = String(pageNumber);

        const pageLabel = document.createElement('div');
        pageLabel.className = 'pdf-page-label';
        pageLabel.textContent = `Trang ${pageNumber}`;

        const canvas = document.createElement('canvas');
        canvas.className = 'pdf-page-canvas';

        const textLayer = document.createElement('div');
        textLayer.className = 'textLayer';

        pageWrapper.append(pageLabel, canvas, textLayer);
        slideCanvas.appendChild(pageWrapper);
        return { pageWrapper, canvas, textLayer };
    }

    async function renderUploadedPdf(file) {
        if (!file) return;
        if (file.type && file.type !== 'application/pdf') {
            setUploadStatus('Hiện prototype chỉ hỗ trợ PDF slide. Hãy chọn file .pdf.', 'error');
            return;
        }

        setUploadStatus(`Đang tải "${file.name}" và dựng text layer để bôi đen...`, 'loading');

        try {
            const pdfjs = await loadPdfJs();
            const buffer = await file.arrayBuffer();
            const pdf = await pdfjs.getDocument({ data: buffer }).promise;
            const allText = [];

            slideCanvas.innerHTML = '';
            uploadedDeckText = '';
            if (pageCountBadge) pageCountBadge.textContent = `1 / ${pdf.numPages} trang`;

            for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
                const page = await pdf.getPage(pageNumber);
                const viewport = page.getViewport({ scale: 1.35 });
                const { pageWrapper, canvas, textLayer } = createPdfPageShell(pageNumber);
                const context = canvas.getContext('2d');

                canvas.width = viewport.width;
                canvas.height = viewport.height;
                canvas.style.width = `${viewport.width}px`;
                canvas.style.height = `${viewport.height}px`;
                pageWrapper.style.width = `${viewport.width}px`;
                pageWrapper.style.height = `${viewport.height}px`;

                await page.render({ canvasContext: context, viewport }).promise;
                const textContent = await page.getTextContent();
                allText.push(`Trang ${pageNumber}:\n${textContent.items.map(item => item.str).join(' ')}`);

                await pdfjs.renderTextLayer({
                    textContentSource: textContent,
                    container: textLayer,
                    viewport,
                    textDivs: []
                }).promise;
            }

            uploadedDeckText = allText.join('\n\n');
            setUploadStatus(`Đã tải "${file.name}" (${pdf.numPages} trang). Bôi đen chữ trực tiếp trên PDF rồi bấm "Hỏi AI".`, 'success');
            if (pageCountBadge) pageCountBadge.textContent = `${pdf.numPages} trang PDF`;
        } catch (err) {
            console.error(err);
            setUploadStatus('Không dựng được PDF text layer. Kiểm tra kết nối mạng để tải PDF.js hoặc thử file PDF khác có text thật.', 'error');
        }
    }

    function appendUserMessage(text) {
        const wrapper = document.createElement('div');
        wrapper.className = 'user-bubble-wrapper';
        wrapper.innerHTML = `
            <div class="context-label">Đoạn đã chọn trên Slide 4</div>
            <div class="user-bubble">"${escapeHtml(text)}"</div>
        `;
        chatStream.appendChild(wrapper);
        scrollToBottom();
    }

    function appendLoadingState() {
        const id = `loading-${Date.now()}`;
        const div = document.createElement('div');
        div.id = id;
        div.className = 'tutor-msg-loading';
        div.innerHTML = `
            <div class="spinner"></div>
            <span>Agent đang đối chiếu slide, phân tầng câu trả lời và tạo quiz theo level...</span>
        `;
        chatStream.appendChild(div);
        scrollToBottom();
        return id;
    }

    function removeLoadingState(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    async function triggerAIAskFlow(text) {
        const selectedText = text.trim();
        if (!selectedText) return;

        hideTooltip();
        input.value = selectedText;
        appendUserMessage(selectedText);
        const loadingId = appendLoadingState();

        try {
            const response = await fetch('/api/explain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ selectedText, slideContext: getSlideContext() })
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            removeLoadingState(loadingId);
            renderAgentCard(selectedText, data);
        } catch (err) {
            removeLoadingState(loadingId);
            renderConnectionError();
        }
    }

    function renderConnectionError() {
        const card = document.createElement('div');
        card.className = 'ai-card-wrapper low-confidence';
        card.innerHTML = `
            <div class="grounding-tag warning">Không kết nối được server</div>
            <div class="hax-warning-box">
                <div class="hax-title">Cách xử lý</div>
                <div class="hax-body">Chạy <strong>npm run start</strong>, sau đó mở đúng URL server in ra trong terminal.</div>
            </div>
        `;
        chatStream.appendChild(card);
        scrollToBottom();
    }

    function confidencePercent(confidence) {
        if (confidence === 'HIGH') return 85;
        if (confidence === 'LOW') return 55;
        return 30;
    }

    function renderAgentCard(text, data) {
        const confidence = data.confidence_level || 'LOW';
        const percent = confidencePercent(confidence);
        const level = data.agent_decision?.proficiency_level || data.proficiency_level || 'Beginner';
        const isHigh = confidence === 'HIGH';
        const card = document.createElement('div');
        card.className = `ai-card-wrapper ${isHigh ? '' : 'low-confidence'}`;

        card.innerHTML = `
            <div class="grounding-tag ${isHigh ? 'success' : 'warning'}">
                ${confidence} confidence - Agent route: ${escapeHtml(data.agent_decision?.routing || 'Explain')}
            </div>
            <div class="confidence-bar-wrapper">
                <div class="confidence-bar-inner ${isHigh ? 'success-bar' : 'warning-bar'}" style="width:${percent}%;"></div>
            </div>

            <div class="agent-section">
                <div class="section-title">Vì sao bạn có thể chọn đoạn này?</div>
                <div class="decision-grid">
                    <div><strong>Đoạn chọn</strong><span>${escapeHtml(data.selection_analysis?.selected_text || text)}</span></div>
                    <div><strong>Lý do có thể gây vướng</strong><span>${escapeHtml(data.selection_analysis?.why_user_may_choose_it)}</span></div>
                    <div><strong>Độ khớp với slide</strong><span>${escapeHtml(data.selection_analysis?.context_match)}</span></div>
                    <div><strong>Rủi ro nếu trả lời thẳng</strong><span>${escapeHtml(data.selection_analysis?.risk_if_answer_directly)}</span></div>
                </div>
            </div>

            <div class="agent-section">
                <div class="section-title">Agent phân tầng để trả lời hợp lý</div>
                <div class="route-card">
                    <div><strong>Quyết định:</strong> ${escapeHtml(data.agent_decision?.routing)}</div>
                    <div><strong>Vì sao:</strong> ${escapeHtml(data.agent_decision?.reason)}</div>
                    <div><strong>Tín hiệu level:</strong> ${escapeHtml(data.agent_decision?.level_signal)}</div>
                    <div><strong>Level hiện tại:</strong> <span class="prof-badge">${escapeHtml(level)}</span></div>
                </div>
            </div>

            ${renderExplanationLayers(data)}
            ${renderFallbackIfNeeded(data)}
            ${renderQuiz(data.quiz_items || [], level)}
        `;

        chatStream.appendChild(card);
        bindQuizEvents(card);
        scrollToBottom();
    }

    function renderExplanationLayers(data) {
        const layers = data.explanation_layers || {};
        if (!layers.layer1_simple && !layers.layer2_example && !layers.layer3_grounding) return '';

        return `
            <div class="agent-section">
                <div class="section-title">Câu trả lời 3 tầng</div>
                <div class="ai-tiers">
                    <div class="tier-item"><strong>Tầng 1 - Nói đơn giản:</strong> ${escapeHtml(layers.layer1_simple)}</div>
                    <div class="tier-item"><strong>Tầng 2 - Ví dụ:</strong> ${escapeHtml(layers.layer2_example)}</div>
                    <div class="tier-item"><strong>Tầng 3 - Căn cứ slide:</strong> ${escapeHtml(layers.layer3_grounding)}</div>
                </div>
                ${data.beginner_note ? `<div class="beginner-note-box">${escapeHtml(data.beginner_note)}</div>` : ''}
            </div>
        `;
    }

    function renderFallbackIfNeeded(data) {
        if (!data.fallback_message) return '';
        return `
            <div class="hax-warning-box">
                <div class="hax-title">Thông điệp an toàn</div>
                <div class="hax-body">${escapeHtml(data.fallback_message)}</div>
            </div>
        `;
    }

    function renderQuiz(quizItems, level) {
        const items = quizItems.slice(0, Math.max(5, quizItems.length));
        return `
            <div class="check-container level-quiz">
                <div class="check-header">
                    <span class="check-q">Quiz tối thiểu 5 câu theo level</span>
                    <span class="prof-badge">${escapeHtml(level)}</span>
                </div>
                <div class="quiz-questions-list">
                    ${items.map((item, idx) => `
                        <div class="quiz-item interactive-quiz-item">
                            <div class="quiz-item-head">Câu ${idx + 1}</div>
                            <p class="quiz-item-q">${escapeHtml(item.question)}</p>
                            <div class="check-opts">
                                ${(item.options || []).map(option => `
                                    <button class="opt-btn" data-correct="${Boolean(option.is_correct)}" data-explain="${escapeHtml(item.explanation)}">
                                        ${escapeHtml(option.text)}
                                    </button>
                                `).join('')}
                            </div>
                            <div class="quiz-result-area hidden"></div>
                        </div>
                    `).join('')}
                </div>
                <div class="quiz-score-panel hidden"></div>
            </div>
        `;
    }

    function bindQuizEvents(card) {
        const quizItems = card.querySelectorAll('.interactive-quiz-item');
        const scorePanel = card.querySelector('.quiz-score-panel');

        quizItems.forEach(item => {
            const buttons = item.querySelectorAll('.opt-btn');
            const result = item.querySelector('.quiz-result-area');

            buttons.forEach(button => {
                button.addEventListener('click', () => {
                    const isCorrect = button.dataset.correct === 'true';
                    buttons.forEach(btn => {
                        btn.disabled = true;
                        if (btn.dataset.correct === 'true') btn.classList.add('correct-answer');
                    });
                    button.classList.add(isCorrect ? 'picked-correct' : 'picked-wrong');
                    result.classList.remove('hidden');
                    result.innerHTML = `
                        <div class="result-badge ${isCorrect ? 'success' : 'error'}">
                            ${isCorrect ? 'Đúng.' : 'Chưa đúng.'} ${escapeHtml(button.dataset.explain || '')}
                        </div>
                    `;
                    updateQuizScore(quizItems, scorePanel);
                    scrollToBottom();
                });
            });
        });
    }

    function updateQuizScore(items, scorePanel) {
        const answered = [...items].filter(item => item.querySelector('.picked-correct, .picked-wrong')).length;
        const correct = [...items].filter(item => item.querySelector('.picked-correct')).length;
        if (!answered) return;

        scorePanel.classList.remove('hidden');
        scorePanel.innerHTML = `Đã trả lời ${answered}/${items.length} câu. Đúng ${correct}/${answered}.`;
    }

    slideCanvas.addEventListener('mouseup', () => setTimeout(showTooltipForSelection, 0));
    document.addEventListener('mousedown', event => {
        if (!tooltip.contains(event.target)) hideTooltip();
    });
    btnAskTooltip.addEventListener('click', () => {
        triggerAIAskFlow(currentSelectedText || getSelectedText());
        window.getSelection().removeAllRanges();
    });
    btnPresetHappy?.addEventListener('click', () => triggerAIAskFlow('Conditional Automation'));
    btnPresetLow?.addEventListener('click', () => triggerAIAskFlow('Generative Adversarial Networks (GANs)'));
    sendBtn?.addEventListener('click', () => triggerAIAskFlow(input.value || 'Conditional Automation'));
    btnUploadSlide?.addEventListener('click', () => slideFileInput?.click());
    slideFileInput?.addEventListener('change', event => renderUploadedPdf(event.target.files?.[0]));
});
