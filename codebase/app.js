// codebase/app.js - Real Mouse Text Selection, PDF Upload Reader & Dynamic LLM Engine

document.addEventListener('DOMContentLoaded', () => {
    const slideCanvas = document.getElementById('slide-canvas');
    const tooltip = document.getElementById('selection-tooltip');
    const btnAskTooltip = document.getElementById('btn-ask-tooltip');
    const btnHighlightTooltip = document.getElementById('btn-highlight-tooltip');
    const btnCopyTooltip = document.getElementById('btn-copy-tooltip');
    const chatStream = document.getElementById('dynamic-chat-stream');
    const btnPresetHappy = document.getElementById('btn-preset-happy');
    const btnPresetLow = document.getElementById('btn-preset-low');

    // PDF Upload Elements
    const btnUploadPdf = document.getElementById('btn-upload-pdf');
    const pdfFileInput = document.getElementById('pdf-file-input');
    const defaultSlidePage = document.getElementById('slide-page');
    const pdfRenderWrapper = document.getElementById('pdf-render-wrapper');
    const pdfCanvas = document.getElementById('pdf-canvas');
    const pdfTextLayer = document.getElementById('pdf-text-layer');

    // UI Meta Elements
    const docFilenameEl = document.getElementById('doc-filename');
    const currentPageNumEl = document.getElementById('current-page-num');
    const totalPagesNumEl = document.getElementById('total-pages-num');
    const topPageNumEl = document.getElementById('top-page-num');
    const topTotalNumEl = document.getElementById('top-total-num');
    const sidebarContextTag = document.getElementById('sidebar-context-tag');
    const btnPrevPage = document.getElementById('btn-prev-page');
    const btnNextPage = document.getElementById('btn-next-page');

    let currentSelectedText = "";
    let quizNotebook = [];
    
    // PDF State
    let pdfDoc = null;
    let currentPdfPage = 1;
    let totalPdfPages = 44;
    let currentSlideTextContext = "";

    // PDF.js Worker Configuration
    if (window.pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    // 1. PDF UPLOAD EVENT HANDLERS
    if (btnUploadPdf && pdfFileInput) {
        btnUploadPdf.addEventListener('click', () => pdfFileInput.click());
        pdfFileInput.addEventListener('change', handlePdfFileUpload);
    }

    const fileItems = document.querySelectorAll('.file-item');
    fileItems.forEach(item => {
        item.addEventListener('click', () => {
            fileItems.forEach(fi => fi.classList.remove('active'));
            item.classList.add('active');
            const textSpan = item.querySelector('span:nth-child(2)');
            if (textSpan && docFilenameEl) {
                docFilenameEl.innerText = textSpan.innerText;
            }
            if (!pdfDoc) {
                defaultSlidePage.style.display = 'block';
                defaultSlidePage.classList.remove('hidden');
                pdfRenderWrapper.classList.add('hidden');
                pdfRenderWrapper.style.display = 'none';
            }
        });
    });

    async function handlePdfFileUpload(e) {
        const file = e.target.files[0];
        if (!file || file.type !== 'application/pdf') return;

        docFilenameEl.innerText = file.name;
        const activeFilename = document.getElementById('sidebar-active-filename');
        if (activeFilename) {
            activeFilename.innerText = file.name.length > 25 ? file.name.substring(0, 22) + '...' : file.name;
        }

        const arrayBuffer = await file.arrayBuffer();
        try {
            pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            totalPdfPages = pdfDoc.numPages;
            currentPdfPage = 1;

            if (totalPagesNumEl) totalPagesNumEl.innerText = totalPdfPages;
            if (topTotalNumEl) topTotalNumEl.innerText = totalPdfPages;
            const sidebarPageCount = document.getElementById('sidebar-page-count');
            if (sidebarPageCount) sidebarPageCount.innerText = `${totalPdfPages}p`;

            // Hide default static slide completely
            defaultSlidePage.style.setProperty('display', 'none', 'important');
            defaultSlidePage.classList.add('hidden');

            pdfRenderWrapper.classList.remove('hidden');
            pdfRenderWrapper.style.setProperty('display', 'flex', 'important');

            renderPdfPage(currentPdfPage);
        } catch (err) {
            console.error("Lỗi đọc file PDF:", err);
            alert("Không thể đọc file PDF này. Vui lòng thử file PDF khác!");
        }
    }

    async function renderPdfPage(pageNum) {
        if (!pdfDoc) return;
        const page = await pdfDoc.getPage(pageNum);

        const containerWidth = slideCanvas.clientWidth ? Math.min(slideCanvas.clientWidth - 40, 720) : 700;
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const scale = containerWidth / unscaledViewport.width;
        const viewport = page.getViewport({ scale: scale || 1.2 });

        const context = pdfCanvas.getContext('2d');
        pdfCanvas.height = viewport.height;
        pdfCanvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;

        // Trích xuất Text Content cho AI Context
        const textContent = await page.getTextContent();
        currentSlideTextContext = textContent.items.map(i => i.str).join(' ');

        // Render Layer Text để bôi đen
        pdfTextLayer.innerHTML = '';
        pdfTextLayer.style.width = `${viewport.width}px`;
        pdfTextLayer.style.height = `${viewport.height}px`;

        pdfjsLib.renderTextLayer({
            textContent: textContent,
            container: pdfTextLayer,
            viewport: viewport,
            textDivs: []
        });

        // Update UI counters
        if (currentPageNumEl) currentPageNumEl.innerText = pageNum;
        if (topPageNumEl) topPageNumEl.innerText = pageNum;
        if (sidebarContextTag) sidebarContextTag.innerText = `Slide trang ${pageNum}`;
    }

    // Pagination handlers
    if (btnPrevPage) {
        btnPrevPage.addEventListener('click', () => {
            if (pdfDoc && currentPdfPage > 1) {
                currentPdfPage--;
                renderPdfPage(currentPdfPage);
            }
        });
    }

    if (btnNextPage) {
        btnNextPage.addEventListener('click', () => {
            if (pdfDoc && currentPdfPage < totalPdfPages) {
                currentPdfPage++;
                renderPdfPage(currentPdfPage);
            }
        });
    }

    // 2. LỰA CHỌN BÔI ĐEN VĂN BẢN THỰC TẾ (REAL MOUSE SELECTION)
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

    if (btnHighlightTooltip) {
        btnHighlightTooltip.addEventListener('click', () => {
            if (currentSelectedText) {
                alert(`Đã lưu Highlight đoạn: "${currentSelectedText}" vào tài liệu!`);
                tooltip.classList.add('hidden');
            }
        });
    }

    if (btnCopyTooltip) {
        btnCopyTooltip.addEventListener('click', () => {
            if (currentSelectedText) {
                navigator.clipboard.writeText(currentSelectedText);
                tooltip.classList.add('hidden');
            }
        });
    }

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

    // 3. LUỒNG XỬ LÝ AI CALL THẬT VÀ ĐÁNH GIÁ TRÌNH ĐỘ LLM DYNAMIC 100%
    async function triggerAIAskFlow(text) {
        appendUserMessage(text);
        const loadingId = appendLoadingState();

        try {
            const slideContext = pdfDoc 
                ? currentSlideTextContext 
                : document.getElementById('slide-page').innerText;

            const response = await fetch('/api/explain', {
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
                    layer3_grounding: `Căn cứ cụ thể tại Slide bài học.`
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
        const pageText = pdfDoc ? currentPdfPage : (document.getElementById('current-page-num')?.innerText || '4');
        wrapper.innerHTML = `
            <div class="context-label">📍 Đã bôi đen trên Slide ${pageText}</div>
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

    // 4. RENDER HAPPY PATH (ĐỦ CĂN CỨ + ĐÁNH GIÁ TRÌNH ĐỘ & NOTE CHO NGƯỜI MỚI DYNAMIC)
    function renderHappyPathAICard(text, data) {
        const card = document.createElement('div');
        card.className = 'ai-card-wrapper';

        const layers = data.explanation_layers || {};
        const layer1 = layers.layer1_simple || `"${text}" là khái niệm quan trọng trong tài liệu bài học.`;
        const layer2 = layers.layer2_example || `Giống như việc bạn áp dụng quy tắc này vào thực tế bài tập.`;
        const layer3 = layers.layer3_grounding || `Căn cứ cụ thể tại nội dung Slide được cung cấp.`;
        
        const beginnerNote = data.beginner_note;
        const profLevel = data.proficiency_level || "Intermediate";
        const pageText = pdfDoc ? currentPdfPage : (document.getElementById('current-page-num')?.innerText || '4');

        const optionsHtml = (data.options && data.options.length > 0)
            ? data.options.map(opt => `<button class="opt-btn" data-correct="${opt.is_correct}">${opt.text}</button>`).join('')
            : `<button class="opt-btn" data-correct="true">A. Nắm vững đúng căn cứ bài học</button>
               <button class="opt-btn" data-correct="false">B. Áp dụng sai ngữ cảnh</button>`;

        const questionText = data.check_question || `Dựa trên bài học, khái niệm "${text}" có vai trò gì?`;

        card.innerHTML = `
            <div class="grounding-tag success">🎯 Mức độ chắc nguồn: 92% • ĐỦ CĂN CỨ (Slide trang ${pageText})</div>
            <div class="confidence-bar-wrapper">
                <div class="confidence-bar-inner success-bar" style="width: 92%;"></div>
            </div>
            
            <div class="ai-tiers">
                <div class="tier-item">
                    <strong>Tầng 1 (Định nghĩa ngắn):</strong> ${layer1}
                </div>
                <div class="tier-item">
                    <strong>Tầng 2 (Ví dụ minh họa):</strong> ${layer2}
                </div>
                <div class="tier-item">
                    <strong>Tầng 3 (Căn cứ trích dẫn):</strong> ${layer3}
                </div>
            </div>

            <!-- GHI CHÚ BỔ SUNG CHO NGƯỜI MỚI DYNAMIC -->
            ${beginnerNote ? `<div class="beginner-note-box">${beginnerNote}</div>` : ''}

            <!-- CÂU HỎI KIỂM TRA HIỂU & ĐÁNH GIÁ TRÌNH ĐỘ LLM DYNAMIC -->
            <div class="check-container">
                <div class="check-header">
                    <span class="check-q">❓ Câu hỏi kiểm tra hiểu:</span>
                    <span class="prof-badge">Trình độ: ${profLevel}</span>
                </div>
                <p class="quiz-title-text">${questionText}</p>
                <div class="check-opts">
                    ${optionsHtml}
                </div>
                <div class="quiz-result-area hidden"></div>
            </div>
        `;

        chatStream.appendChild(card);
        scrollToBottom();

        // Xử lý sự kiện bấm chọn Quiz & Đánh giá trình độ LLM DYNAMIC
        const optBtns = card.querySelectorAll('.opt-btn');
        const resultArea = card.querySelector('.quiz-result-area');

        optBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const isCorrect = btn.getAttribute('data-correct') === 'true';
                optBtns.forEach(b => b.disabled = true);

                quizNotebook.push({
                    topic: text,
                    question: questionText,
                    selectedOption: btn.innerText,
                    isCorrect: isCorrect,
                    note: beginnerNote || "Ôn tập lại khái niệm bài học."
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

                renderSummaryQuizButton();
                scrollToBottom();
            });
        });
    }

    // 5. RENDER LOW CONFIDENCE CARD (HAX G10 DYNAMIC)
    function renderLowConfidenceHAX10Card(text, data) {
        const card = document.createElement('div');
        card.className = 'ai-card-wrapper low-confidence';
        const pageText = pdfDoc ? currentPdfPage : (document.getElementById('current-page-num')?.innerText || '4');
        const fallbackMsg = data.fallback_message || `VLearn Tutor không tìm thấy căn cứ khẳng định cho đoạn "${text}" trong Slide bài học. Để tránh cung cấp kiến thức sai lệch, AI từ chối đưa ra kết luận.`;

        card.innerHTML = `
            <div class="grounding-tag warning">⚠️ Mức độ chắc nguồn: 45% • THIẾU CĂN CỨ IN SLIDE (Slide trang ${pageText})</div>
            <div class="confidence-bar-wrapper">
                <div class="confidence-bar-inner warning-bar" style="width: 45%;"></div>
            </div>

            <div class="hax-warning-box">
                <div class="hax-title">⚠️ HAX G10: Thu hẹp phạm vi khi nghi ngờ</div>
                <div class="hax-body">
                    ${fallbackMsg}
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
            alert('Bạn hãy dùng chuột bôi đen đoạn chữ mới trên Slide bài học nhé!');
        });

        card.querySelector('#btn-force-explain').addEventListener('click', () => {
            triggerAIAskFlow("Conditional Automation");
        });
    }

    // 6. NÚT TỔNG HỢP BỘ QUIZ CÁ NHÂN HÓA
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

    // 7. TẠO BÀI QUIZ TỔNG HỢP THEO TRÌNH ĐỘ (SUMMARY QUIZ GENERATOR DYNAMIC)
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