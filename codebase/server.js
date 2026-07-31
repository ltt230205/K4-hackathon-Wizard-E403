// codebase/server.js - VLearn AI Tutor server with Gemini 3.5 Flash.
const http = require('http');
const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.join(__dirname, '../.env');
    if (!fs.existsSync(envPath)) return;

    fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const idx = trimmed.indexOf('=');
        if (idx === -1) return;
        process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    });
}

loadEnv();

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const PORT = Number(process.env.PORT || 3001);
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const SYSTEM_PROMPT = `Bạn là VLearn AI Tutor, một Agent học tập theo ngữ cảnh slide.
Nhiệm vụ của bạn:
1. Đọc đoạn học viên bôi đen và context slide.
2. Giải thích vì sao đoạn đó được phân loại HIGH, LOW hoặc OUT_OF_SCOPE.
3. Chọn cách trả lời phù hợp theo 3 tầng: đơn giản, ví dụ, căn cứ trên slide.
4. Ước lượng level học viên: Beginner, Intermediate hoặc Advanced.
5. Tạo quiz tối thiểu 5 câu đúng với level đó.

Quy tắc phân loại:
- HIGH: đoạn chọn có căn cứ trực tiếp trong slide, có thể giải thích chắc chắn.
- LOW: đoạn chọn quá ngắn, mơ hồ, hoặc chỉ có một phần căn cứ trong slide.
- OUT_OF_SCOPE: đoạn chọn không thuộc bài học hoặc là logistics/hỗ trợ kỹ thuật.

Chỉ trả về JSON hợp lệ, không markdown, theo schema:
{
  "confidence_level": "HIGH | LOW | OUT_OF_SCOPE",
  "selection_analysis": {
    "selected_text": "đoạn học viên chọn",
    "why_user_may_choose_it": "vì sao học viên có thể bôi đen đoạn này",
    "context_match": "đoạn này khớp/không khớp với slide thế nào",
    "risk_if_answer_directly": "rủi ro nếu Agent trả lời thẳng mà không phân tầng"
  },
  "agent_decision": {
    "routing": "Explain | Ask to reselect | Refuse out-of-scope",
    "reason": "lý do Agent chọn hướng này",
    "level_signal": "tín hiệu dùng để đoán level học viên",
    "proficiency_level": "Beginner | Intermediate | Advanced"
  },
  "explanation_layers": {
    "layer1_simple": "giải thích ngắn, dễ hiểu",
    "layer2_example": "ví dụ minh họa",
    "layer3_grounding": "căn cứ cụ thể trên slide"
  },
  "beginner_note": "ghi chú nền tảng nếu hữu ích",
  "quiz_items": [
    {
      "question": "câu hỏi theo level",
      "options": [
        {"text": "A", "is_correct": true},
        {"text": "B", "is_correct": false},
        {"text": "C", "is_correct": false}
      ],
      "explanation": "vì sao đáp án đúng"
    }
  ],
  "fallback_message": "chỉ dùng khi LOW hoặc OUT_OF_SCOPE"
}

quiz_items phải có ít nhất 5 câu. Nếu LOW hoặc OUT_OF_SCOPE vẫn phải tạo 5 câu quiz điều hướng an toàn về cách chọn lại, nhận biết căn cứ, và tránh học sai.`;

const EXPLAIN_TOOL_DECLARATION = {
    functionDeclarations: [{
        name: 'explain_and_generate_level_quiz',
        description: 'Analyze selected slide text, decide the response route, explain in layers, and generate at least 5 level-appropriate quiz questions.',
        parameters: {
            type: 'OBJECT',
            properties: {
                confidence_level: { type: 'STRING', enum: ['HIGH', 'LOW', 'OUT_OF_SCOPE'] },
                selection_analysis: {
                    type: 'OBJECT',
                    properties: {
                        selected_text: { type: 'STRING' },
                        why_user_may_choose_it: { type: 'STRING' },
                        context_match: { type: 'STRING' },
                        risk_if_answer_directly: { type: 'STRING' }
                    },
                    required: ['selected_text', 'why_user_may_choose_it', 'context_match', 'risk_if_answer_directly']
                },
                agent_decision: {
                    type: 'OBJECT',
                    properties: {
                        routing: { type: 'STRING', enum: ['Explain', 'Ask to reselect', 'Refuse out-of-scope'] },
                        reason: { type: 'STRING' },
                        level_signal: { type: 'STRING' },
                        proficiency_level: { type: 'STRING', enum: ['Beginner', 'Intermediate', 'Advanced'] }
                    },
                    required: ['routing', 'reason', 'level_signal', 'proficiency_level']
                },
                explanation_layers: {
                    type: 'OBJECT',
                    properties: {
                        layer1_simple: { type: 'STRING' },
                        layer2_example: { type: 'STRING' },
                        layer3_grounding: { type: 'STRING' }
                    },
                    required: ['layer1_simple', 'layer2_example', 'layer3_grounding']
                },
                beginner_note: { type: 'STRING' },
                quiz_items: {
                    type: 'ARRAY',
                    items: {
                        type: 'OBJECT',
                        properties: {
                            question: { type: 'STRING' },
                            options: {
                                type: 'ARRAY',
                                items: {
                                    type: 'OBJECT',
                                    properties: {
                                        text: { type: 'STRING' },
                                        is_correct: { type: 'BOOLEAN' }
                                    },
                                    required: ['text', 'is_correct']
                                }
                            },
                            explanation: { type: 'STRING' }
                        },
                        required: ['question', 'options', 'explanation']
                    }
                },
                fallback_message: { type: 'STRING' }
            },
            required: ['confidence_level', 'selection_analysis', 'agent_decision', 'explanation_layers', 'beginner_note', 'quiz_items', 'fallback_message']
        }
    }]
};

function buildQuiz(level, confidence) {
    const prefix = level === 'Advanced'
        ? 'Phân tích'
        : level === 'Intermediate'
            ? 'Áp dụng'
            : 'Nhận biết';

    const base = [
        {
            question: `${prefix}: Khi cost-of-error cao, AI nên tự động hóa theo cách nào?`,
            options: [
                { text: 'Chỉ tự làm case chắc chắn và chuyển giao khi thiếu căn cứ', is_correct: true },
                { text: 'Luôn tự động hóa 100%', is_correct: false },
                { text: 'Bỏ qua mức độ tin cậy', is_correct: false }
            ],
            explanation: 'Conditional Automation giảm rủi ro khi hậu quả sai số cao.'
        },
        {
            question: `${prefix}: Vì sao Agent cần xem context slide trước khi trả lời?`,
            options: [
                { text: 'Để tránh bịa kiến thức ngoài bài học', is_correct: true },
                { text: 'Để trả lời dài hơn', is_correct: false },
                { text: 'Để bỏ qua đoạn người học chọn', is_correct: false }
            ],
            explanation: 'Căn cứ slide giúp Agent biết nội dung nào được phép khẳng định.'
        },
        {
            question: `${prefix}: LOW confidence thường xảy ra khi nào?`,
            options: [
                { text: 'Đoạn chọn quá ngắn hoặc thiếu ngữ cảnh', is_correct: true },
                { text: 'Slide có căn cứ trực tiếp', is_correct: false },
                { text: 'Câu trả lời đã chắc chắn', is_correct: false }
            ],
            explanation: 'Đoạn mơ hồ nên được hỏi lại hoặc yêu cầu chọn rõ hơn.'
        },
        {
            question: `${prefix}: Tầng grounding trong câu trả lời dùng để làm gì?`,
            options: [
                { text: 'Chỉ ra căn cứ cụ thể trên slide', is_correct: true },
                { text: 'Kể chuyện ngoài bài học', is_correct: false },
                { text: 'Thay thế ví dụ minh họa', is_correct: false }
            ],
            explanation: 'Grounding nối câu trả lời với nguồn học tập.'
        },
        {
            question: `${prefix}: Nếu chọn một khái niệm ngoài phạm vi bài học, Agent nên làm gì?`,
            options: [
                { text: 'Nói rõ ngoài phạm vi và gợi ý chọn lại', is_correct: true },
                { text: 'Bịa một lời giải thích nghe hợp lý', is_correct: false },
                { text: 'Đánh dấu HIGH confidence', is_correct: false }
            ],
            explanation: 'OUT_OF_SCOPE cần từ chối an toàn để người học không học sai.'
        }
    ];

    if (confidence === 'LOW') {
        base[0].question = `${prefix}: Khi đoạn bôi đen chưa đủ rõ, hành động tốt nhất là gì?`;
        base[0].options = [
            { text: 'Bôi đen lại một cụm đầy đủ hơn', is_correct: true },
            { text: 'Yêu cầu AI đoán ý', is_correct: false },
            { text: 'Bỏ qua context slide', is_correct: false }
        ];
        base[0].explanation = 'Chọn lại giúp Agent có đủ căn cứ để phân tầng chính xác.';
    }

    return base;
}

function getSmartFallbackResponse(selectedText, slideContext) {
    const text = (selectedText || '').trim();
    const textLower = text.toLowerCase();
    const contextLower = (slideContext || '').toLowerCase();
    const inContext = text && contextLower.includes(textLower);
    const isOutOfScope = ['photoshop', 'bitcoin', 'link', 'tải', 'nghỉ', 'trợ giảng'].some(term => textLower.includes(term));
    const isLow = !text || text.length <= 4 || ['cái đó', 'đoạn đó', 'hả'].some(term => textLower.includes(term));

    if (isOutOfScope) {
        return normalizeAIResponse({
            confidence_level: 'OUT_OF_SCOPE',
            selection_analysis: {
                selected_text: text,
                why_user_may_choose_it: 'Người học có thể đang cần hỗ trợ ngoài nội dung slide.',
                context_match: 'Không thấy căn cứ học thuật trực tiếp trong slide.',
                risk_if_answer_directly: 'Agent có thể trả lời sai phạm vi hoặc biến thành hỗ trợ logistics.'
            },
            agent_decision: {
                routing: 'Refuse out-of-scope',
                reason: 'Đoạn chọn không thuộc mục tiêu giải thích bài học.',
                level_signal: 'Câu hỏi không cung cấp tín hiệu học thuật đủ để đo level.',
                proficiency_level: 'Beginner'
            },
            explanation_layers: { layer1_simple: '', layer2_example: '', layer3_grounding: '' },
            beginner_note: '',
            quiz_items: buildQuiz('Beginner', 'OUT_OF_SCOPE'),
            fallback_message: 'Nội dung này nằm ngoài phạm vi slide. Hãy bôi đen một khái niệm trong bài học để Agent phân tầng câu trả lời.'
        }, text, slideContext);
    }

    if (isLow) {
        return normalizeAIResponse({
            confidence_level: 'LOW',
            selection_analysis: {
                selected_text: text,
                why_user_may_choose_it: 'Người học có thể đang bị vướng ở một cụm quá ngắn hoặc thiếu chủ ngữ.',
                context_match: 'Đoạn chọn chưa đủ tín hiệu để nối chắc với một ý trong slide.',
                risk_if_answer_directly: 'Agent có thể đoán sai ý người học và giải thích lệch trọng tâm.'
            },
            agent_decision: {
                routing: 'Ask to reselect',
                reason: 'Cần người học chọn cụm đầy đủ hơn để có căn cứ.',
                level_signal: 'Đoạn chọn mơ hồ nên tạm xếp Beginner.',
                proficiency_level: 'Beginner'
            },
            explanation_layers: { layer1_simple: '', layer2_example: '', layer3_grounding: '' },
            beginner_note: 'Hãy bôi đen cả cụm khái niệm, ví dụ: Conditional Automation hoặc cost-of-error.',
            quiz_items: buildQuiz('Beginner', 'LOW'),
            fallback_message: 'Đoạn bôi đen còn mơ hồ. Hãy chọn cụm đầy đủ hơn để Agent giải thích đúng trọng tâm.'
        }, text, slideContext);
    }

    const level = inContext ? 'Intermediate' : 'Beginner';
    return normalizeAIResponse({
        confidence_level: inContext ? 'HIGH' : 'LOW',
        selection_analysis: {
            selected_text: text,
            why_user_may_choose_it: 'Đây là cụm có khả năng gây khó hiểu vì liên quan đến cách thiết kế AI khi không chắc chắn.',
            context_match: inContext
                ? 'Có căn cứ trực tiếp trong slide trang 4.'
                : 'Có liên quan chủ đề nhưng chưa khớp nguyên văn với context slide.',
            risk_if_answer_directly: 'Nếu không phân tầng, người học có thể nhớ ví dụ nhưng không hiểu điều kiện áp dụng.'
        },
        agent_decision: {
            routing: inContext ? 'Explain' : 'Ask to reselect',
            reason: inContext
                ? 'Đoạn chọn đủ cụ thể để giải thích theo 3 tầng.'
                : 'Agent nên giải thích thận trọng và khuyến khích chọn lại nếu cần căn cứ chắc hơn.',
            level_signal: 'Người học chọn một khái niệm trung tâm thay vì hỏi chung chung.',
            proficiency_level: level
        },
        explanation_layers: {
            layer1_simple: `${text} là cách để AI chỉ tự xử lý khi đủ chắc chắn, còn trường hợp rủi ro thì thu hẹp phạm vi hoặc chuyển cho người dùng.`,
            layer2_example: 'Giống xe tự lái: đường rõ thì xe tự chạy, gặp sương mù dày thì yêu cầu người lái tiếp quản.',
            layer3_grounding: 'Slide trang 4 nêu rằng khi cost-of-error cao, hệ thống nên dùng Conditional Automation và HAX G10 để tránh xử lý thiếu căn cứ.'
        },
        beginner_note: 'Điểm cần nhớ: AI không phải lúc nào cũng nên tự động 100%. Thiết kế tốt là biết khi nào cần dừng, hỏi lại hoặc chuyển giao.',
        quiz_items: buildQuiz(level, inContext ? 'HIGH' : 'LOW'),
        fallback_message: inContext ? '' : 'Agent chưa thấy căn cứ nguyên văn hoàn toàn, nên giải thích thận trọng.'
    }, text, slideContext);
}

function normalizeAIResponse(raw, selectedText, slideContext) {
    const confidence = ['HIGH', 'LOW', 'OUT_OF_SCOPE'].includes(raw?.confidence_level) ? raw.confidence_level : 'LOW';
    const level = ['Beginner', 'Intermediate', 'Advanced'].includes(raw?.agent_decision?.proficiency_level)
        ? raw.agent_decision.proficiency_level
        : raw?.proficiency_level || 'Beginner';
    const quiz = Array.isArray(raw?.quiz_items) ? raw.quiz_items : [];
    const normalizedQuiz = quiz.concat(buildQuiz(level, confidence)).slice(0, Math.max(5, quiz.length));

    return {
        confidence_level: confidence,
        selection_analysis: {
            selected_text: raw?.selection_analysis?.selected_text || selectedText || '',
            why_user_may_choose_it: raw?.selection_analysis?.why_user_may_choose_it || 'Người học chọn đoạn này vì có thể đây là điểm đang gây khó hiểu.',
            context_match: raw?.selection_analysis?.context_match || 'Agent đối chiếu đoạn chọn với context slide trước khi trả lời.',
            risk_if_answer_directly: raw?.selection_analysis?.risk_if_answer_directly || 'Nếu trả lời thẳng, câu trả lời có thể thiếu căn cứ hoặc quá khó.'
        },
        agent_decision: {
            routing: raw?.agent_decision?.routing || (confidence === 'HIGH' ? 'Explain' : 'Ask to reselect'),
            reason: raw?.agent_decision?.reason || 'Agent chọn hướng trả lời dựa trên độ khớp với slide.',
            level_signal: raw?.agent_decision?.level_signal || 'Tín hiệu level đến từ độ cụ thể của đoạn bôi đen.',
            proficiency_level: level
        },
        explanation_layers: {
            layer1_simple: raw?.explanation_layers?.layer1_simple || '',
            layer2_example: raw?.explanation_layers?.layer2_example || '',
            layer3_grounding: raw?.explanation_layers?.layer3_grounding || ''
        },
        beginner_note: raw?.beginner_note || '',
        proficiency_level: level,
        quiz_items: normalizedQuiz.map(item => ({
            question: item.question || 'Câu hỏi ôn tập',
            options: Array.isArray(item.options) && item.options.length >= 2 ? item.options : [
                { text: 'Đáp án đúng', is_correct: true },
                { text: 'Đáp án sai', is_correct: false }
            ],
            explanation: item.explanation || 'Xem lại phần phân tầng và căn cứ trên slide.'
        })),
        fallback_message: raw?.fallback_message || ''
    };
}

function parseAIJSONResponse(text) {
    const raw = String(text || '').trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();
    return JSON.parse(raw);
}

async function callGeminiAPI(selectedText, slideContext) {
    if (!GEMINI_KEY || GEMINI_KEY.includes('your_actual')) {
        return getSmartFallbackResponse(selectedText, slideContext);
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;
    const payload = {
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{
            role: 'user',
            parts: [{ text: `[CONTEXT SLIDE]\n${slideContext}\n\n[ĐOẠN BÔI ĐEN]\n"${selectedText}"` }]
        }],
        tools: [EXPLAIN_TOOL_DECLARATION],
        generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok || data.error) {
        console.warn('Gemini API fallback:', data.error?.message || response.status);
        return getSmartFallbackResponse(selectedText, slideContext);
    }

    const parts = data.candidates?.[0]?.content?.parts || [];
    const functionArgs = parts.find(part => part.functionCall?.args)?.functionCall?.args;
    if (functionArgs) return normalizeAIResponse(functionArgs, selectedText, slideContext);

    const text = parts.map(part => part.text || '').join('').trim();
    if (!text) return getSmartFallbackResponse(selectedText, slideContext);
    return normalizeAIResponse(parseAIJSONResponse(text), selectedText, slideContext);
}

function writeTraceLog(logData) {
    const logFilePath = path.join(logsDir, 'ai_traces.json');
    let logs = [];
    if (fs.existsSync(logFilePath)) {
        try { logs = JSON.parse(fs.readFileSync(logFilePath, 'utf8')); } catch (e) {}
    }
    logs.push(logData);
    fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2), 'utf8');
}

const MIME = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json'
};

function serveStatic(req, res) {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const relativePath = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
    const resolvedPath = path.resolve(__dirname, relativePath);
    const rootPath = path.resolve(__dirname);

    if (resolvedPath !== rootPath && !resolvedPath.startsWith(rootPath + path.sep)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
        res.writeHead(404);
        res.end('Not found');
        return;
    }

    res.writeHead(200, { 'Content-Type': `${MIME[path.extname(resolvedPath)] || 'text/plain'}; charset=utf-8` });
    fs.createReadStream(resolvedPath).pipe(res);
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/api/explain') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            const start = Date.now();
            let selectedText = '';
            let slideContext = '';

            try {
                const parsed = JSON.parse(body || '{}');
                selectedText = parsed.selectedText || '';
                slideContext = parsed.slideContext || '';
                const ai = await callGeminiAPI(selectedText, slideContext);

                writeTraceLog({
                    timestamp: new Date().toISOString(),
                    model: MODEL,
                    selected_text: selectedText,
                    confidence: ai.confidence_level,
                    route: ai.agent_decision.routing,
                    level: ai.agent_decision.proficiency_level,
                    latency_ms: Date.now() - start,
                    ai_response: ai
                });

                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(ai));
            } catch (err) {
                const fallback = getSmartFallbackResponse(selectedText, slideContext);
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(fallback));
            }
        });
        return;
    }

    if (req.method === 'GET') {
        serveStatic(req, res);
        return;
    }

    res.writeHead(404);
    res.end();
});

server.on('error', err => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} đang bị chiếm. Hãy tắt process đang dùng port này hoặc đổi PORT trong .env.`);
        process.exit(1);
    }
    console.error('Server error:', err);
    process.exit(1);
});

server.listen(PORT, () => {
    console.log(`VLearn Server ready: http://localhost:${PORT}`);
    console.log(`Gemini model: ${MODEL}`);
});
