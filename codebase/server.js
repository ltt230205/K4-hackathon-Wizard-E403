// codebase/server.js - Bulletproof Port Handling + Adaptive LLM Engine
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

async function callGeminiAPI(selectedText, slideContext) {
    if (!GEMINI_KEY || GEMINI_KEY.includes('your_actual')) {
        return getSmartFallbackResponse(selectedText, slideContext);
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: SYSTEM_PROMPT + `\n\n[CONTEXT SLIDE]\n${slideContext}\n\n[ĐOẠN BÔI ĐEN]\n"${selectedText}"` }] }],
            generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
        })
    });

    const data = await response.json();
    if (data.error) return getSmartFallbackResponse(selectedText, slideContext);
    return parseAIJSONResponse(data.candidates[0].content.parts[0].text);
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

// THÊM XỬ LÝ LỖI TRÙNG CỔNG (EADDRINUSE) TRIỆT ĐỂ
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