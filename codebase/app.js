// codebase/app.js - UI flow for layered agent reasoning and level-based quiz.
document.addEventListener('DOMContentLoaded', () => {
    const slideCanvas = document.getElementById('slide-canvas');
    const slidePage = document.getElementById('slide-page');
    const tooltip = document.getElementById('selection-tooltip');
    const btnAskTooltip = document.getElementById('btn-ask-tooltip');
    const chatStream = document.getElementById('dynamic-chat-stream');
    const btnUploadSlide = document.getElementById('btn-upload-slide');
    const slideFileInput = document.getElementById('slide-file-input');
    const uploadStatus = document.getElementById('upload-status');
    const pageCountBadge = document.getElementById('page-count-badge');
    const sendBtn = document.querySelector('.send-btn');
    const input = document.querySelector('.chat-input-bar input');

    let currentSelectedText = '';
    let uploadedDeckText = '';
    let pdfjsLibPromise = null;
    let currentPdfDoc = null;
    let currentPdfJsModule = null;
    let currentPageNum = 1;
    let totalPdfPages = 1;

    const learnerProfile = {
        level: 'Beginner',
        completedSets: 0,
        lastScore: null
    };

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function scrollToBottom() {
        if (chatStream) chatStream.scrollTop = chatStream.scrollHeight;
    }

    function hideTooltip() {
        if (tooltip) tooltip.classList.add('hidden');
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
        if (input) input.value = text;
        const range = window.getSelection().getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (tooltip) {
            tooltip.style.left = `${rect.left + rect.width / 2}px`;
            tooltip.style.top = `${Math.max(58, rect.top - 48)}px`;
            tooltip.classList.remove('hidden');
        }
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
        if (slideCanvas) slideCanvas.appendChild(pageWrapper);
        return { pageWrapper, canvas, textLayer };
    }

    function updatePaginationUI() {
        const currentPageEl = document.getElementById('current-page-num');
        const totalPagesEl = document.getElementById('total-pages-num');
        const pageCountBadge = document.getElementById('page-count-badge');
        const btnPrev = document.getElementById('btn-prev-page');
        const btnNext = document.getElementById('btn-next-page');

        if (currentPageEl) currentPageEl.textContent = String(currentPageNum);
        if (totalPagesEl) totalPagesEl.textContent = String(totalPdfPages);
        if (pageCountBadge) pageCountBadge.textContent = `Trang ${currentPageNum} / ${totalPdfPages}`;

        if (btnPrev) btnPrev.disabled = currentPageNum <= 1;
        if (btnNext) btnNext.disabled = currentPageNum >= totalPdfPages;

        const tutorContextTag = document.querySelector('.slide-context-tag');
        if (tutorContextTag) tutorContextTag.textContent = `Slide trang ${currentPageNum}`;
    }

    let currentRenderTask = null;

    async function renderSinglePage(pageNumber) {
        if (!currentPdfDoc) return;
        if (pageNumber < 1) pageNumber = 1;
        if (pageNumber > totalPdfPages) pageNumber = totalPdfPages;
        currentPageNum = pageNumber;

        if (currentRenderTask) {
            try {
                currentRenderTask.cancel();
            } catch (e) {}
            currentRenderTask = null;
        }

        slideCanvas.innerHTML = '';

        try {
            const page = await currentPdfDoc.getPage(pageNumber);
            const containerWidth = Math.min(slideCanvas.clientWidth || 800, 800);
            const unscaledViewport = page.getViewport({ scale: 1.0 });
            const scale = containerWidth > 0 ? (containerWidth / unscaledViewport.width) : 1.2;
            const viewport = page.getViewport({ scale: Math.max(0.5, Math.min(scale, 1.4)) });

            const { pageWrapper, canvas, textLayer } = createPdfPageShell(pageNumber);
            const context = canvas.getContext('2d');

            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            canvas.style.width = `${Math.floor(viewport.width)}px`;
            canvas.style.height = `${Math.floor(viewport.height)}px`;
            pageWrapper.style.width = `${Math.floor(viewport.width)}px`;
            pageWrapper.style.height = `${Math.floor(viewport.height)}px`;

            // Pre-fill canvas with white background
            context.save();
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.restore();

            currentRenderTask = page.render({
                canvasContext: context,
                viewport: viewport
            });
            await currentRenderTask.promise;
            currentRenderTask = null;

            const textContent = await page.getTextContent();
            textLayer.innerHTML = '';
            const pdfjs = currentPdfJsModule;
            if (pdfjs && pdfjs.Util && textContent.items) {
                for (const item of textContent.items) {
                    if (!item.str || !item.str.trim()) continue;
                    const tx = pdfjs.Util.transform(viewport.transform, item.transform);
                    const span = document.createElement('span');
                    span.textContent = item.str;
                    span.style.left = `${tx[4]}px`;
                    span.style.top = `${Math.max(0, tx[5] - (item.height || 12))}px`;
                    span.style.fontSize = `${Math.abs(tx[0]) || 12}px`;
                    textLayer.appendChild(span);
                }
            }

            updatePaginationUI();
        } catch (err) {
            if (err?.name !== 'RenderingCancelledException') {
                console.error('Error rendering single page:', err);
            }
        }
    }

    async function renderPdf(source, fileName) {
        if (!source) return;
        if (source instanceof File && source.type && source.type !== 'application/pdf') {
            setUploadStatus('Hiện prototype chỉ hỗ trợ PDF slide. Hãy chọn file .pdf.', 'error');
            return;
        }

        const displayName = fileName || (typeof source === 'string' ? source.split('/').pop() : source.name || 'Slide.pdf');
        setUploadStatus(`Đang nạp file slide "${displayName}"...`, 'loading');

        try {
            const pdfjs = await loadPdfJs();
            currentPdfJsModule = pdfjs;

            let pdfInput;
            if (typeof source === 'string') {
                const res = await fetch(source);
                if (!res.ok) throw new Error(`HTTP ${res.status} khi tải PDF từ ${source}`);
                const arrayBuffer = await res.arrayBuffer();
                pdfInput = { data: new Uint8Array(arrayBuffer) };
            } else if (source instanceof File) {
                const buffer = await source.arrayBuffer();
                pdfInput = { data: new Uint8Array(buffer.slice(0)) };
            } else if (source instanceof ArrayBuffer) {
                pdfInput = { data: new Uint8Array(source.slice(0)) };
            } else {
                pdfInput = source;
            }

            const loadingParams = typeof pdfInput === 'object' && pdfInput.data ? pdfInput : { data: pdfInput };
            const loadingTask = pdfjs.getDocument({
                ...loadingParams,
                cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
                cMapPacked: true
            });
            currentPdfDoc = await loadingTask.promise;
            totalPdfPages = currentPdfDoc.numPages;
            currentPageNum = 1;
            uploadedDeckText = '';

            // Render page 1
            await renderSinglePage(1);
            setUploadStatus(`Đã tải "${displayName}" (${totalPdfPages} trang). Dùng nút ‹ › để chuyển trang. Bôi đen chữ trên slide rồi bấm "Hỏi AI".`, 'success');

            const docFilename = document.querySelector('.doc-filename');
            if (docFilename) docFilename.textContent = displayName;
        } catch (err) {
            console.error('renderPdf error:', err);
            setUploadStatus(`Không dựng được PDF. Vui lòng kiểm tra file. Error: ${err.message}`, 'error');
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

    function getLevelMeta(level) {
        if (level === 'Advanced') {
            return {
                className: 'advanced',
                title: 'Advanced',
                summary: 'Người học đã nắm chắc ý chính. AI có thể đẩy câu hỏi lên mức phân tích và vận dụng.'
            };
        }
        if (level === 'Intermediate') {
            return {
                className: 'intermediate',
                title: 'Intermediate',
                summary: 'Người học hiểu khung nội dung, cần thêm ví dụ và điều kiện áp dụng để tránh nhầm.'
            };
        }
        return {
            className: 'beginner',
            title: 'Beginner',
            summary: 'Người học đang cần giải thích ngắn gọn, ít thuật ngữ và có ví dụ gắn với slide.'
        };
    }

    function getConfidenceMeta(confidence, percent) {
        if (confidence === 'HIGH') {
            return {
                label: 'Đủ căn cứ từ slide',
                nextAction: 'Trả lời trực tiếp, sau đó kiểm tra bằng 5 câu quiz.',
                percent
            };
        }
        if (confidence === 'LOW') {
            return {
                label: 'Cần nói rõ giới hạn',
                nextAction: 'Giải thích có cảnh báo và tránh bổ sung nội dung ngoài slide.',
                percent
            };
        }
        return {
            label: 'Ngoài phạm vi slide',
            nextAction: 'Hỏi lại người học hoặc yêu cầu chọn đoạn khác có căn cứ hơn.',
            percent
        };
    }

    function renderAgentCard(text, data) {
        const confidence = data.confidence_level || 'LOW';
        const percent = confidencePercent(confidence);
        const level = data.agent_decision?.proficiency_level || data.proficiency_level || 'Beginner';
        const levelMeta = getLevelMeta(level);
        const confidenceMeta = getConfidenceMeta(confidence, percent);
        const isHigh = confidence === 'HIGH';
        const card = document.createElement('div');
        card.className = `ai-card-wrapper learner-answer ${isHigh ? '' : 'low-confidence'}`;
        card.dataset.topic = text;
        card.dataset.systemLevel = level;
        card.dataset.confidence = confidence;
        card.dataset.confidencePercent = String(percent);

        card.innerHTML = `
            <div class="grounding-tag ${isHigh ? 'success' : 'warning'}">
                ${confidence} confidence - Agent route: ${escapeHtml(data.agent_decision?.routing || 'Explain')}
            </div>
            <div class="confidence-bar-wrapper">
                <div class="confidence-bar-inner ${isHigh ? 'success-bar' : 'warning-bar'}" style="width:${percent}%;"></div>
            </div>

            <div class="answer-main">
                <div class="answer-kicker">Giải thích nhanh</div>
                <div class="answer-title">${escapeHtml(data.selection_analysis?.selected_text || text)}</div>
                <div class="answer-body">${escapeHtml(data.explanation_layers?.layer1_simple || data.beginner_note || 'AI chưa có đủ nội dung để giải thích chắc chắn từ slide này.')}</div>
                ${data.fallback_message ? `<div class="answer-note"><strong>Lưu ý:</strong> ${escapeHtml(data.fallback_message)}</div>` : ''}
            </div>

            <div class="level-summary-card ${levelMeta.className}">
                <div class="level-summary-top">
                    <div>
                        <div class="summary-kicker">Level hiện tại</div>
                        <div class="summary-level">${escapeHtml(levelMeta.title)}</div>
                    </div>
                    <div class="summary-score">${confidenceMeta.percent}%</div>
                </div>
                <div class="summary-line">${escapeHtml(levelMeta.summary)}</div>
                <div class="summary-metrics">
                    <span>${escapeHtml(confidenceMeta.label)}</span>
                    <span>${escapeHtml(data.agent_decision?.routing || 'Explain')}</span>
                </div>
                <div class="summary-next">${escapeHtml(confidenceMeta.nextAction)}</div>
            </div>

            <details class="agent-details">
                <summary>Vì sao AI chọn cách trả lời này?</summary>
            <div class="agent-section compact">
                <div class="section-title">Vì sao bạn có thể chọn đoạn này?</div>
                <div class="decision-grid">
                    <div><strong>Đoạn chọn</strong><span>${escapeHtml(data.selection_analysis?.selected_text || text)}</span></div>
                    <div><strong>Lý do có thể gây vướng</strong><span>${escapeHtml(data.selection_analysis?.why_user_may_choose_it)}</span></div>
                    <div><strong>Độ khớp với slide</strong><span>${escapeHtml(data.selection_analysis?.context_match)}</span></div>
                    <div><strong>Rủi ro nếu trả lời thẳng</strong><span>${escapeHtml(data.selection_analysis?.risk_if_answer_directly)}</span></div>
                </div>
            </div>

            <div class="agent-section compact">
                <div class="section-title">Agent phân tầng để trả lời hợp lý</div>
                <div class="route-card">
                    <div><strong>Quyết định:</strong> ${escapeHtml(data.agent_decision?.routing)}</div>
                    <div><strong>Vì sao:</strong> ${escapeHtml(data.agent_decision?.reason)}</div>
                    <div><strong>Tín hiệu level:</strong> ${escapeHtml(data.agent_decision?.level_signal)}</div>
                    <div><strong>Level hiện tại:</strong> <span class="prof-badge">${escapeHtml(level)}</span></div>
                </div>
            </div>

            </details>

            ${renderDeepExplanation(data)}
            ${renderExplanationLayers(data)}
            ${renderFallbackIfNeeded(data)}
            ${renderQuiz(data.quiz_items || [], level)}
            <details class="system-details">
                <summary>Đánh giá hệ thống</summary>
                <div class="system-diagnostics">
                    <span>${escapeHtml(confidenceMeta.label)} (${confidenceMeta.percent}%)</span>
                    <span>Level dự đoán: ${escapeHtml(levelMeta.title)}</span>
                    <span>Route: ${escapeHtml(data.agent_decision?.routing || 'Explain')}</span>
                </div>
                <div class="system-reason">${escapeHtml(data.agent_decision?.reason || levelMeta.summary)}</div>
            </details>
        `;

        chatStream.appendChild(card);
        bindQuizEvents(card, text);
        scrollToBottom();
    }

    function renderDeepExplanation(data) {
        const layers = data.explanation_layers || {};
        if (!layers.layer2_example && !layers.layer3_grounding && !data.beginner_note) return '';

        return `
            <details class="deep-explanation">
                <summary>Muốn hiểu sâu hơn?</summary>
                <div class="deep-explanation-body">
                    ${layers.layer2_example ? `<div class="deep-block"><strong>Ví dụ dễ hình dung</strong><span>${escapeHtml(layers.layer2_example)}</span></div>` : ''}
                    ${layers.layer3_grounding ? `<div class="deep-block"><strong>Căn cứ từ slide</strong><span>${escapeHtml(layers.layer3_grounding)}</span></div>` : ''}
                    ${data.beginner_note ? `<div class="deep-block"><strong>Gợi ý học tiếp</strong><span>${escapeHtml(data.beginner_note)}</span></div>` : ''}
                </div>
            </details>
        `;
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
            <div class="quiz-launcher">
                <div class="quiz-launcher-copy">
                    <strong>Muốn kiểm tra nhanh?</strong>
                    <span>Làm 5 câu quiz để hệ thống tự điều chỉnh câu hỏi tiếp theo.</span>
                </div>
                <button class="start-quiz-btn" type="button">Làm quiz 5 câu</button>
            </div>
            <div class="quiz-content hidden">
            <div class="check-container level-quiz" data-quiz-round="1" data-adaptive-level="${escapeHtml(level)}">
                <div class="check-header">
                    <span class="check-q">Quiz tối thiểu 5 câu theo level</span>
                    <span class="prof-badge">${escapeHtml(level)}</span>
                </div>
                <div class="quiz-actions">
                    <button class="stop-quiz-btn" type="button">Dừng quiz</button>
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
            </div>
        `;
    }

    function bindQuizEvents(scope, topic) {
        const startQuizButton = scope.querySelector('.start-quiz-btn');

        startQuizButton?.addEventListener('click', () => {
            const quizContent = scope.querySelector('.quiz-content');
            quizContent?.classList.remove('hidden');
            startQuizButton.closest('.quiz-launcher')?.classList.add('hidden');
        });

        const quizScopes = scope.matches?.('.level-quiz')
            ? [scope]
            : [...scope.querySelectorAll('.level-quiz')];
        quizScopes.forEach(quizScope => bindSingleQuiz(quizScope, topic));
    }

    function bindSingleQuiz(quizScope, topic) {
        if (!quizScope || quizScope.dataset.bound === 'true') return;
        quizScope.dataset.bound = 'true';

        const quizItems = quizScope.querySelectorAll('.interactive-quiz-item');
        const scorePanel = quizScope.querySelector('.quiz-score-panel');
        const stopButton = quizScope.querySelector('.stop-quiz-btn');

        stopButton?.addEventListener('click', () => stopQuiz(quizScope, quizItems, scorePanel));

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
                    updateQuizScore(quizItems, scorePanel, quizScope, topic);
                });
            });
        });
    }

    function stopQuiz(scope, items, scorePanel) {
        scope.dataset.stopped = 'true';
        scope.querySelectorAll('.opt-btn').forEach(button => {
            button.disabled = true;
        });

        const stopButton = scope.querySelector('.stop-quiz-btn');
        if (stopButton) {
            stopButton.disabled = true;
            stopButton.textContent = 'Đã dừng quiz';
        }

        const answered = [...items].filter(item => item.querySelector('.picked-correct, .picked-wrong')).length;
        const correct = [...items].filter(item => item.querySelector('.picked-correct')).length;
        scorePanel.className = 'quiz-score-panel assessment stopped';
        scorePanel.classList.remove('hidden');
        scorePanel.innerHTML = `
            <div class="assessment-header">
                <span>Quiz đã dừng</span>
                <strong>${correct}/${answered || 0} đúng</strong>
            </div>
            <div class="assessment-level">Chưa cập nhật level</div>
            <div class="assessment-body">Bạn đã dừng trước khi hoàn thành bộ câu hỏi, nên hệ thống chưa thay đổi mức độ học hiện tại.</div>
            <div class="assessment-next">Bạn có thể bôi đen đoạn khác để hỏi AI, hoặc tải slide khác lên học tiếp.</div>
        `;
        scrollToBottom();
    }

    function updateQuizScore(items, scorePanel, scope, topic) {
        const answered = [...items].filter(item => item.querySelector('.picked-correct, .picked-wrong')).length;
        const correct = [...items].filter(item => item.querySelector('.picked-correct')).length;
        if (!answered) return;
        if (scope.dataset.stopped === 'true') return;

        scorePanel.classList.remove('hidden');
        if (answered < items.length) {
            scorePanel.innerHTML = `Đã trả lời ${answered}/${items.length} câu. Đúng ${correct}/${answered}. Hoàn thành đủ 5 câu để nhận nhận xét.`;
            return;
        }

        const assessment = getLearnerAssessment(correct, items.length);
        learnerProfile.level = assessment.nextLevel;
        learnerProfile.completedSets += 1;
        learnerProfile.lastScore = `${correct}/${items.length}`;
        scope.classList.add('completed');

        scorePanel.className = `quiz-score-panel assessment ${assessment.className}`;
        scorePanel.innerHTML = `
            <div class="assessment-header">
                <span>Đánh giá sau quiz</span>
                <strong>${correct}/${items.length} đúng</strong>
            </div>
            <div class="assessment-level">${assessment.level}</div>
            <div class="assessment-body">${assessment.message}</div>
            <div class="assessment-next">${assessment.nextStep}</div>
            <button class="next-quiz-btn" type="button">Làm tiếp 5 câu mới</button>
        `;

        const nextQuizButton = scorePanel.querySelector('.next-quiz-btn');
        nextQuizButton?.addEventListener('click', () => {
            if (scope.dataset.nextGenerated === 'true') return;
            scope.dataset.nextGenerated = 'true';
            const nextQuiz = renderAdaptiveNextQuiz(topic, assessment.nextLevel, learnerProfile.completedSets + 1);
            scope.insertAdjacentHTML('afterend', nextQuiz);
            const nextScope = scope.nextElementSibling;
            bindQuizEvents(nextScope, topic);
            nextQuizButton.disabled = true;
            nextQuizButton.textContent = 'Đã mở bộ câu hỏi mới';
            nextScope?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    function getLearnerAssessment(correct, total) {
        const rate = total ? correct / total : 0;

        if (rate === 1) {
            return {
                level: 'Advanced - có thể học tiếp',
                className: 'advanced',
                nextLevel: 'Advanced',
                message: 'Bạn trả lời đúng toàn bộ câu hỏi, cho thấy đã nắm chắc khái niệm và biết áp dụng trong tình huống chính.',
                nextStep: 'Gợi ý: hệ thống sẽ đẩy câu hỏi tiếp theo lên mức phân tích tình huống và rủi ro.'
            };
        }

        if (rate >= 0.6) {
            return {
                level: 'Intermediate - hiểu ý chính',
                className: 'intermediate',
                nextLevel: 'Intermediate',
                message: 'Bạn đã hiểu phần lớn nội dung, nhưng vẫn còn một vài điểm cần củng cố để tránh nhầm khi áp dụng.',
                nextStep: 'Gợi ý: hệ thống sẽ giữ câu hỏi tiếp theo ở mức áp dụng, tập trung vào điều kiện dùng đúng.'
            };
        }

        return {
            level: 'Beginner - cần ôn lại',
            className: 'beginner',
            nextLevel: 'Beginner',
            message: 'Bạn mới nắm được một phần nhỏ nội dung. Nếu học tiếp ngay, khả năng cao sẽ mang theo lỗ hổng hiểu sai.',
            nextStep: 'Gợi ý: hệ thống sẽ hạ câu hỏi tiếp theo về mức nhận biết và ôn lại khái niệm nền.'
        };
    }

    function renderAdaptiveNextQuiz(topic, level, round) {
        const items = buildAdaptiveQuizItems(topic, level);
        return `
            <div class="check-container level-quiz adaptive-next-quiz" data-quiz-round="${round}" data-adaptive-level="${escapeHtml(level)}">
                <div class="check-header">
                    <span class="check-q">Bộ câu hỏi tiếp theo - tự điều chỉnh theo mức độ học</span>
                    <span class="prof-badge">${escapeHtml(level)}</span>
                </div>
                <div class="quiz-actions">
                    <button class="stop-quiz-btn" type="button">Dừng quiz</button>
                </div>
                <div class="adaptive-note">
                    Hệ thống đã tự chọn level <strong>${escapeHtml(level)}</strong> dựa trên kết quả 5 câu vừa rồi. Bộ câu hỏi này dùng để củng cố hoặc tăng độ khó phù hợp.
                </div>
                <div class="quiz-questions-list">
                    ${items.map((item, idx) => `
                        <div class="quiz-item interactive-quiz-item">
                            <div class="quiz-item-head">Câu tiếp theo ${idx + 1}</div>
                            <p class="quiz-item-q">${escapeHtml(item.question)}</p>
                            <div class="check-opts">
                                ${item.options.map(option => `
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

    function buildAdaptiveQuizItems(topic, level) {
        const cleanTopic = topic || 'khái niệm vừa học';
        if (level === 'Advanced') {
            return [
                {
                    question: `Trong tình huống nào nên KHÔNG để AI tự xử lý hoàn toàn với "${cleanTopic}"?`,
                    options: [
                        { text: 'Khi hậu quả sai cao và context thiếu căn cứ', is_correct: true },
                        { text: 'Khi người học muốn câu trả lời nhanh hơn', is_correct: false },
                        { text: 'Khi slide có nhiều màu sắc', is_correct: false }
                    ],
                    explanation: 'Mức Advanced cần nhận ra rủi ro vận hành và điều kiện dừng tự động.'
                },
                {
                    question: `Nếu phải thiết kế guardrail cho "${cleanTopic}", ưu tiên nào hợp lý nhất?`,
                    options: [
                        { text: 'Kiểm tra căn cứ slide trước khi giải thích', is_correct: true },
                        { text: 'Luôn trả lời dù không có nguồn', is_correct: false },
                        { text: 'Ẩn confidence khỏi người học', is_correct: false }
                    ],
                    explanation: 'Guardrail tốt giúp câu trả lời có căn cứ và minh bạch.'
                },
                {
                    question: `Dấu hiệu nào cho thấy câu trả lời về "${cleanTopic}" cần chuyển từ Explain sang Ask to reselect?`,
                    options: [
                        { text: 'Đoạn bôi đen quá ngắn hoặc mơ hồ', is_correct: true },
                        { text: 'Đoạn bôi đen nằm đúng trong slide', is_correct: false },
                        { text: 'Quiz có 5 câu', is_correct: false }
                    ],
                    explanation: 'Mơ hồ thì nên hỏi lại để tránh đoán sai.'
                },
                {
                    question: `Một câu trả lời Advanced tốt cần thêm yếu tố nào ngoài định nghĩa?`,
                    options: [
                        { text: 'Điều kiện áp dụng và rủi ro nếu áp dụng sai', is_correct: true },
                        { text: 'Nhiều thuật ngữ hơn', is_correct: false },
                        { text: 'Ít căn cứ hơn để ngắn gọn', is_correct: false }
                    ],
                    explanation: 'Advanced tập trung vào áp dụng có điều kiện và phân tích rủi ro.'
                },
                {
                    question: `Khi người học trả lời đúng 5/5, câu hỏi tiếp theo nên thay đổi thế nào?`,
                    options: [
                        { text: 'Tăng lên tình huống phân tích và ra quyết định', is_correct: true },
                        { text: 'Lặp lại câu hỏi nhận biết', is_correct: false },
                        { text: 'Bỏ quiz', is_correct: false }
                    ],
                    explanation: 'Đúng toàn bộ là tín hiệu có thể tăng độ khó.'
                }
            ];
        }

        if (level === 'Intermediate') {
            return [
                {
                    question: `Khi áp dụng "${cleanTopic}", điều gì cần kiểm tra trước?`,
                    options: [
                        { text: 'Có căn cứ trực tiếp trong slide hay không', is_correct: true },
                        { text: 'Câu trả lời có dài không', is_correct: false },
                        { text: 'Có emoji hay không', is_correct: false }
                    ],
                    explanation: 'Intermediate cần biết áp dụng dựa trên căn cứ.'
                },
                {
                    question: `Nếu AI phân loại LOW, người học nên làm gì?`,
                    options: [
                        { text: 'Bôi đen lại cụm rõ hơn', is_correct: true },
                        { text: 'Tin luôn câu trả lời đoán', is_correct: false },
                        { text: 'Chọn đoạn ngắn hơn', is_correct: false }
                    ],
                    explanation: 'LOW nghĩa là cần thêm context.'
                },
                {
                    question: `Tầng ví dụ giúp gì khi học "${cleanTopic}"?`,
                    options: [
                        { text: 'Biến định nghĩa thành tình huống dễ hiểu', is_correct: true },
                        { text: 'Thay thế căn cứ slide', is_correct: false },
                        { text: 'Ẩn đi phần chưa chắc chắn', is_correct: false }
                    ],
                    explanation: 'Ví dụ giúp hiểu cách áp dụng nhưng không thay thế grounding.'
                },
                {
                    question: `Khi câu trả lời có grounding tốt, người học biết được gì?`,
                    options: [
                        { text: 'Câu trả lời dựa vào phần nào của slide', is_correct: true },
                        { text: 'AI chắc chắn đúng trong mọi ngữ cảnh', is_correct: false },
                        { text: 'Không cần làm quiz nữa', is_correct: false }
                    ],
                    explanation: 'Grounding làm rõ nguồn của câu trả lời.'
                },
                {
                    question: `Mục tiêu của quiz sau giải thích là gì?`,
                    options: [
                        { text: 'Kiểm tra hiểu thật, không chỉ đọc lướt', is_correct: true },
                        { text: 'Làm giao diện dài hơn', is_correct: false },
                        { text: 'Thay slide bài học', is_correct: false }
                    ],
                    explanation: 'Quiz xác nhận người học hiểu đúng trước khi học tiếp.'
                }
            ];
        }

        return [
            {
                question: `"${cleanTopic}" nên được hiểu trước hết là gì?`,
                options: [
                    { text: 'Một khái niệm cần giải thích dựa trên context slide', is_correct: true },
                    { text: 'Một câu hỏi ngoài phạm vi bất kỳ', is_correct: false },
                    { text: 'Một phần không cần căn cứ', is_correct: false }
                ],
                explanation: 'Beginner cần bắt đầu từ nhận biết khái niệm và nguồn căn cứ.'
            },
            {
                question: `Nếu chưa hiểu một đoạn, thao tác đúng là gì?`,
                options: [
                    { text: 'Bôi đen cụm đầy đủ rồi hỏi AI', is_correct: true },
                    { text: 'Chọn một chữ bất kỳ', is_correct: false },
                    { text: 'Hỏi chuyện ngoài bài học', is_correct: false }
                ],
                explanation: 'Chọn cụm đầy đủ giúp Agent hiểu đúng ý.'
            },
            {
                question: `HIGH confidence nghĩa là gì?`,
                options: [
                    { text: 'Có căn cứ đủ rõ trong slide', is_correct: true },
                    { text: 'AI trả lời dài', is_correct: false },
                    { text: 'Người học đã chắc chắn hiểu', is_correct: false }
                ],
                explanation: 'HIGH nói về độ chắc của căn cứ, không phải độ dài câu trả lời.'
            },
            {
                question: `LOW confidence nghĩa là gì?`,
                options: [
                    { text: 'Cần thêm context hoặc chọn lại đoạn rõ hơn', is_correct: true },
                    { text: 'Chắc chắn sai', is_correct: false },
                    { text: 'Không cần làm gì thêm', is_correct: false }
                ],
                explanation: 'LOW là tín hiệu cần làm rõ trước khi tin câu trả lời.'
            },
            {
                question: `Vì sao cần 3 tầng giải thích?`,
                options: [
                    { text: 'Để đi từ dễ hiểu đến ví dụ rồi căn cứ', is_correct: true },
                    { text: 'Để làm câu trả lời rối hơn', is_correct: false },
                    { text: 'Để bỏ qua slide', is_correct: false }
                ],
                explanation: '3 tầng giúp người mới hiểu mà vẫn kiểm tra được nguồn.'
            }
        ];
    }

    slideCanvas.addEventListener('mouseup', () => setTimeout(showTooltipForSelection, 0));
    document.addEventListener('mousedown', event => {
        if (!tooltip.contains(event.target)) hideTooltip();
    });
    btnAskTooltip.addEventListener('click', () => {
        triggerAIAskFlow(currentSelectedText || getSelectedText());
        window.getSelection().removeAllRanges();
    });
    sendBtn?.addEventListener('click', () => triggerAIAskFlow(input.value || currentSelectedText || getSelectedText()));
    btnUploadSlide?.addEventListener('click', () => slideFileInput?.click());
    slideFileInput?.addEventListener('change', event => {
        const file = event.target.files?.[0];
        if (file) {
            document.querySelectorAll('.file-item').forEach(f => {
                f.classList.remove('active');
                const check = f.querySelector('.check-icon');
                if (check) check.remove();
            });
            renderPdf(file, file.name);
            slideFileInput.value = '';
        }
    });

    // Bind sidebar file item click events
    document.querySelectorAll('.file-item').forEach(item => {
        item.addEventListener('click', () => {
            const url = item.dataset.pdfUrl;
            const name = item.dataset.pdfName;
            document.querySelectorAll('.file-item').forEach(f => {
                f.classList.remove('active');
                const check = f.querySelector('.check-icon');
                if (check) check.remove();
            });
            item.classList.add('active');
            if (!item.querySelector('.check-icon')) {
                const check = document.createElement('span');
                check.className = 'check-icon';
                check.textContent = '✓';
                item.appendChild(check);
            }
            if (url) {
                renderPdf(url, name);
            }
        });
    });

    // Bind pagination buttons
    document.getElementById('btn-prev-page')?.addEventListener('click', () => {
        if (currentPageNum > 1) renderSinglePage(currentPageNum - 1);
    });
    document.getElementById('btn-next-page')?.addEventListener('click', () => {
        if (currentPageNum < totalPdfPages) renderSinglePage(currentPageNum + 1);
    });

    // Auto-load default active PDF on startup
    const activeFileItem = document.querySelector('.file-item.active');
    if (activeFileItem && activeFileItem.dataset.pdfUrl) {
        renderPdf(activeFileItem.dataset.pdfUrl, activeFileItem.dataset.pdfName);
    }
});
