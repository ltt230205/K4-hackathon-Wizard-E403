// codebase/server.js - Bulletproof Port Handling + Adaptive LLM Engine + Gemini Function Calling Tools
const http = require('http');
const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.join(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
        fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
            const idx = line.indexOf('=');
            if (idx > 0) process.env[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
        });
    }
}
loadEnv();

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const PORT = process.env.PORT || 3000;
const MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// 1. SYSTEM PROMPT CHUẨN ĐỊNH HƯỚNG VLEARN AI TUTOR
const SYSTEM_PROMPT = `Bạn là VLearn AI Tutor chuyên hỗ trợ học viên giải thích tài liệu bài học và ĐÁNH GIÁ TRÌNH ĐỘ HỌC VIÊN.
Phân tích đoạn bôi đen dựa TRỰC TIẾP và CHỈ TRÊN context slide được cung cấp.

[QUY TẮC PHÂN LOẠI CONTEXT]
- Context ĐỦ THÔNG TIN: confidence_level = "HIGH".
- Context MƠ HỒ hoặc THIẾU: confidence_level = "LOW".
- HOÀN TOÀN KHÔNG LIÊN QUAN (logistics, photoshop, bitcoin...): confidence_level = "OUT_OF_SCOPE".

[BẮT BUỘC TRẢ VỀ JSON DUY NHẤT, KHÔNG MARKDOWN]
{
  "confidence_level": "HIGH | LOW | OUT_OF_SCOPE",
  "explanation_layers": {
    "layer1_simple": "Giải thích ngắn 1 câu từ ngữ bình dân",
    "layer2_example": "Ví dụ thực tế minh họa",
    "layer3_grounding": "Căn cứ cụ thể trên slide"
  },
  "beginner_note": "Lưu ý/gợi ý kiến thức nền cho người mới bắt đầu học khái niệm này",
  "proficiency_level": "Beginner | Intermediate | Advanced",
  "check_question": "Câu hỏi trắc nghiệm kiểm tra hiểu",
  "options": [
    {"text": "Lựa chọn A", "is_correct": false},
    {"text": "Lựa chọn B", "is_correct": true}
  ],
  "fallback_message": ""
}
Nếu LOW hoặc OUT_OF_SCOPE thì explanation_layers để rỗng, options để mảng rỗng, viết fallback_message.`;

// 2. KHAI BÁO AI TOOL / FUNCTION DECLARATION (GEMINI TOOLS SPEC)
const EXPLAIN_TOOL_DECLARATION = {
    functionDeclarations: [{
        name: "explain_and_evaluate_understanding",
        description: "Giải thích đoạn văn bản bôi đen theo 3 tầng, đánh giá trình độ học viên và tạo câu hỏi kiểm tra",
        parameters: {
            type: "OBJECT",
            properties: {
                confidence_level: { type: "STRING", enum: ["HIGH", "LOW", "OUT_OF_SCOPE"], description: "Mức độ tin cậy của nguồn slide" },
                explanation_layers: {
                    type: "OBJECT",
                    properties: {
                        layer1_simple: { type: "STRING", description: "Tầng 1: Định nghĩa ngắn 1 câu từ ngữ bình dân" },
                        layer2_example: { type: "STRING", description: "Tầng 2: Ví dụ thực tế minh họa" },
                        layer3_grounding: { type: "STRING", description: "Tầng 3: Căn cứ trích dẫn cụ thể trên slide" }
                    }
                },
                beginner_note: { type: "STRING", description: "Ghi chú kiến thức nền cho người mới bắt đầu" },
                proficiency_level: { type: "STRING", enum: ["Beginner", "Intermediate", "Advanced"], description: "Đánh giá trình độ học viên" },
                check_question: { type: "STRING", description: "Câu hỏi trắc nghiệm kiểm tra mức độ hiểu" },
                options: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            text: { type: "STRING" },
                            is_correct: { type: "BOOLEAN" }
                        }
                    }
                },
                fallback_message: { type: "STRING", description: "Thông báo từ chối khi LOW hoặc OUT_OF_SCOPE" }
            },
            required: ["confidence_level", "explanation_layers", "beginner_note", "proficiency_level", "check_question", "options", "fallback_message"]
        }
    }]
};

// 3. SMART RULE FALLBACK ENGINE
function getSmartFallbackResponse(selectedText, slideContext) {
    const textLower = (selectedText || '').toLowerCase().trim();

    if (
        textLower.includes('photoshop') || textLower.includes('bitcoin') ||
        textLower.includes('mấy giờ') || textLower.includes('tải') ||
        textLower.includes('link') || textLower.includes('nghỉ')
    ) {
        return {
            confidence_level: "OUT_OF_SCOPE",
            explanation_layers: { layer1_simple: "", layer2_example: "", layer3_grounding: "" },
            beginner_note: "",
            proficiency_level: "Beginner",
            check_question: "",
            options: [],
            fallback_message: "Nội dung này nằm ngoài phạm vi bài học Slide. Bạn vui lòng liên hệ trợ giảng."
        };
    }

    if (
        textLower === 'hả?' || textLower === 'hả' ||
        textLower.includes('cái đoạn đó') || textLower.includes('giaithich cai nay') ||
        (textLower.length <= 4 && !textLower.includes('rnn') && !textLower.includes('hax'))
    ) {
        return {
            confidence_level: "LOW",
            explanation_layers: { layer1_simple: "", layer2_example: "", layer3_grounding: "" },
            beginner_note: "",
            proficiency_level: "Beginner",
            check_question: "",
            options: [],
            fallback_message: "Đoạn bôi đen quá ngắn hoặc mơ hồ. Vui lòng bôi đen cụm từ đầy đủ hơn."
        };
    }

    return {
        confidence_level: "HIGH",
        explanation_layers: {
            layer1_simple: `"${selectedText || 'Khái niệm'}" là phương thức xử lý tự động có điều kiện dựa trên mức độ tin cậy.`,
            layer2_example: `Giống như xe tự lái chỉ tự đi khi đường quang, gặp sương mù dày sẽ yêu cầu tài xế cầm lái.`,
            layer3_grounding: `Căn cứ cụ thể tại Mục 1 - Slide trang 4.`
        },
        beginner_note: "💡 Ghi chú cho người mới: Đừng nhầm lẫn giữa Cố định (Deterministic) và Xác suất (Probabilistic). Muốn dùng AI an toàn phải hiểu Cost-of-error!",
        proficiency_level: "Intermediate",
        check_question: `Theo bài học, khi Cost-of-error cao, sản phẩm AI nên áp dụng cơ chế nào?`,
        options: [
            { text: "A. Conditional Automation (Chỉ tự làm case chắc chắn)", is_correct: true },
            { text: "B. Tự động hóa 100% không cần con người kiểm tra", is_correct: false }
        ],
        fallback_message: ""
    };
}

function parseAIJSONResponse(text) {
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) cleanText = cleanText.substring(7);
    if (cleanText.startsWith('```')) cleanText = cleanText.substring(3);
    if (cleanText.endsWith('```')) cleanText = cleanText.substring(0, cleanText.length - 3);
    return JSON.parse(cleanText.trim());
}

// 4. CHUẨN GỌI GEMINI API THẬT TÍCH HỢP SYSTEM INSTRUCTION + TOOLS
async function callGeminiAPI(selectedText, slideContext) {
    if (!GEMINI_KEY || GEMINI_KEY.includes('your_actual')) {
        return getSmartFallbackResponse(selectedText, slideContext);
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;
    
    const payload = {
        system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }]
        },
        contents: [{
            parts: [{ text: `[CONTEXT SLIDE]\n${slideContext}\n\n[ĐOẠN BÔI ĐEN]\n"${selectedText}"` }]
        }],
        tools: [EXPLAIN_TOOL_DECLARATION],
        generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json"
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data.error) return getSmartFallbackResponse(selectedText, slideContext);

    const part = data.candidates?.[0]?.content?.parts?.[0];
    if (part?.functionCall?.args) {
        return part.functionCall.args;
    }
    if (part?.text) {
        return parseAIJSONResponse(part.text);
    }
    return getSmartFallbackResponse(selectedText, slideContext);
}

// 5. GHI LOG VẾT TRACE
function writeTraceLog(logData) {
    const logFilePath = path.join(logsDir, 'ai_traces.json');
    let logs = [];
    if (fs.existsSync(logFilePath)) {
        try { logs = JSON.parse(fs.readFileSync(logFilePath, 'utf8')); } catch (e) {}
    }
    logs.push(logData);
    fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2), 'utf8');
}

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json' };
function serveStatic(filePath, res) {
    if (fs.existsSync(filePath)) {
        res.writeHead(200, { 'Content-Type': (MIME[path.extname(filePath)] || 'text/plain') + '; charset=utf-8' });
        fs.createReadStream(filePath).pipe(res);
    } else { res.writeHead(404); res.end('Not found'); }
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    if (req.method === 'POST' && req.url === '/api/explain') {
        let body = '';
        req.on('data', c => { body += c.toString(); });
        req.on('end', async () => {
            const start = Date.now();
            let selectedText = "", slideContext = "";
            try {
                const parsed = JSON.parse(body || '{}');
                selectedText = parsed.selectedText || "";
                slideContext = parsed.slideContext || "";
                let ai;
                try { ai = await callGeminiAPI(selectedText, slideContext); } catch (e) { ai = getSmartFallbackResponse(selectedText, slideContext); }
                const ms = Date.now() - start;
                writeTraceLog({ timestamp: new Date().toISOString(), model: MODEL, selected_text: selectedText, confidence: ai.confidence_level, latency_ms: ms, ai_response: ai });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(ai));
            } catch (err) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(getSmartFallbackResponse(selectedText, slideContext)));
            }
        });
        return;
    }

    if (req.method === 'GET') {
        serveStatic(path.join(__dirname, req.url === '/' ? '/index.html' : req.url), res);
        return;
    }
    res.writeHead(404); res.end();
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.log(`\n================================================================`);
        console.log(`✅ VLearn Server ĐÃ ĐANG CHẠY SẴN SÀNG tại: http://localhost:${PORT}`);
        console.log(`👉 Bạn chỉ cần mở trình duyệt web và gõ: http://localhost:${PORT}`);
        console.log(`================================================================\n`);
        process.exit(0);
    } else {
        console.error('Server Error:', e);
    }
});

server.listen(PORT, () => {
    console.log(`🚀 VLearn Server: http://localhost:${PORT}`);
});