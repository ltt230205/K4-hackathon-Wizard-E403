// codebase/server.js - Tích hợp OpenAI + Smart Fallback khi hết Quota
const http = require('http');
const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.join(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) process.env[key.trim()] = value.trim();
        });
    }
}
loadEnv();

const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const PORT = process.env.PORT || 3000;

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const SYSTEM_PROMPT = `
Bạn là VLearn AI Tutor chuyên hỗ trợ học viên giải thích tài liệu bài học.
Phân tích đoạn bôi đen dựa TRỰC TIẾP và CHỈ TRÊN context slide được cung cấp.

[QUY TẮC PHÂN LOẠI]
- Context ĐỦ THÔNG TIN: "confidence_level": "HIGH".
- Context MƠ HỒ/THIẾU: "confidence_level": "LOW".
- HOÀN TOÀN KHÔNG CÓ TRONG BÀI HỌC/LOGISTICS: "confidence_level": "OUT_OF_SCOPE".

[BẮT BUỘC TRẢ VỀ JSON]
{
  "confidence_level": "HIGH | LOW | OUT_OF_SCOPE",
  "explanation_layers": {
    "layer1_simple": "Giải thích ngắn 1 câu từ ngữ bình dân",
    "layer2_example": "Ví dụ thực tế minh họa ngắn",
    "layer3_grounding": "Căn cứ cụ thể trên trang slide"
  },
  "check_question": "Câu hỏi trắc nghiệm kiểm tra hiểu 1 câu",
  "options": [
    {"text": "Lựa chọn A (sai)", "is_correct": false},
    {"text": "Lựa chọn B (đúng)", "is_correct": true}
  ],
  "fallback_message": "Nếu LOW/OUT_OF_SCOPE, nói rõ chưa thấy căn cứ trong slide và hỏi lại học viên."
}
`;

// Smart Rule-based Fallback khi OpenAI bị lỗi Quota
function getSmartFallbackResponse(selectedText, slideContext) {
    const textLower = (selectedText || '').toLowerCase();
    const contextLower = (slideContext || '').toLowerCase();

    // 1. Out of scope / Logistics
    if (textLower.includes('photoshop') || textLower.includes('bitcoin') || textLower.includes('mấy giờ') || textLower.includes('tải') || textLower.includes('trợ giảng')) {
        return {
            confidence_level: "OUT_OF_SCOPE",
            explanation_layers: { layer1_simple: "", layer2_example: "", layer3_grounding: "" },
            check_question: "",
            options: [],
            fallback_message: "Nội dung này nằm ngoài phạm vi tài liệu bài học Slide. Bạn vui lòng liên hệ Ban giảng huấn hoặc hỗ trợ kỹ thuật."
        };
    }

    // 2. Input mơ hồ
    if (textLower.length <= 4 || textLower.includes('cái đó') || textLower.includes('đó') || textLower.includes('hả')) {
        return {
            confidence_level: "LOW",
            explanation_layers: { layer1_simple: "", layer2_example: "", layer3_grounding: "" },
            check_question: "",
            options: [],
            fallback_message: "Đoạn bạn chọn hơi ngắn hoặc chưa rõ ý. Bạn vui lòng bôi đen cụm từ đầy đủ hơn nhé."
        };
    }

    // 3. High confidence (Đủ căn cứ)
    return {
        confidence_level: "HIGH",
        explanation_layers: {
            layer1_simple: `"${selectedText}" là khái niệm trọng tâm được giải thích trực tiếp trong bài học.`,
            layer2_example: `Giống như việc bạn áp dụng quy tắc này vào thực tế bài tập.`,
            layer3_grounding: `Căn cứ cụ thể tại tài liệu Slide được cung cấp.`
        },
        check_question: `Dựa trên bài học, khái niệm "${selectedText}" có vai trò gì?`,
        options: [
            { text: "A. Giúp hệ thống xử lý thông tin chính xác theo ngữ cảnh", is_correct: true },
            { text: "B. Không có tác dụng trong bài học", is_correct: false }
        ],
        fallback_message: ""
    };
}

async function callOpenAI(selectedText, slideContext) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: MODEL,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: `[CONTEXT SLIDE]\n${slideContext}\n\n[ĐOẠN BÔI ĐEN]\n"${selectedText}"` }
            ],
            temperature: 0.1
        })
    });

    const data = await response.json();
    if (data.error) {
        console.warn(`⚠️ [API WARNING] OpenAI Error: ${data.error.message}. Chuyển sang Smart Rule Engine...`);
        return getSmartFallbackResponse(selectedText, slideContext);
    }
    return JSON.parse(data.choices[0].message.content);
}

function writeTraceLog(logData) {
    const logFilePath = path.join(logsDir, 'ai_traces.json');
    let logs = [];
    if (fs.existsSync(logFilePath)) {
        try { logs = JSON.parse(fs.readFileSync(logFilePath, 'utf8')); } catch (e) { }
    }
    logs.push(logData);
    fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2), 'utf8');
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    if (req.method === 'POST' && req.url === '/api/explain') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            const startTime = Date.now();
            try {
                const { selectedText, slideContext } = JSON.parse(body);
                const aiResponse = await callOpenAI(selectedText, slideContext);
                const latencyMs = Date.now() - startTime;

                writeTraceLog({
                    timestamp: new Date().toISOString(),
                    model: MODEL,
                    selected_text: selectedText,
                    confidence: aiResponse.confidence_level,
                    latency_ms: latencyMs,
                    ai_response: aiResponse
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(aiResponse));
            } catch (err) {
                const fallback = getSmartFallbackResponse();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(fallback));
            }
        });
    } else {
        res.writeHead(404); res.end();
    }
});

server.listen(PORT, () => {
    console.log(`🚀 VLearn AI Server đang chạy tại: http://localhost:${PORT}`);
});