// eval/run_eval.js - Chạy đo Golden Set 20 case với delay chống rate limit
const fs = require('fs');
const path = require('path');

const SERVER_URL = 'http://localhost:3000/api/explain';
const DELAY_MS = 500; // Chờ 0.5s giữa mỗi request

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function runEval() {
    console.log("🚀 Bắt đầu đo lượt 1 trọn bộ Golden Set (có delay chống rate limit)...\n");
    const goldenSet = JSON.parse(fs.readFileSync(path.join(__dirname, 'golden_set.json'), 'utf8'));

    let passed = 0;
    let results = [];

    for (let i = 0; i < goldenSet.length; i++) {
        const testCase = goldenSet[i];
        process.stdout.write(`[${i+1}/${goldenSet.length}] ${testCase.id} - ${testCase.class}... `);

        try {
            const res = await fetch(SERVER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ selectedText: testCase.selected_text, slideContext: testCase.context })
            }).then(r => r.json());

            if (res.error) {
                console.log(`⚠️ API Error: ${res.error.substring(0, 60)}...`);
                results.push({ ID: testCase.id, Class: testCase.class, Expected: testCase.expected_confidence, Actual: 'API_ERROR', Result: '⚠️ ERROR' });
            } else {
                const actual = res.confidence_level || 'UNKNOWN';
                const isPass = (actual === testCase.expected_confidence);
                if (isPass) passed++;
                console.log(`${isPass ? '✅' : '❌'} Expected: ${testCase.expected_confidence} | Got: ${actual}`);
                results.push({ ID: testCase.id, Class: testCase.class, Expected: testCase.expected_confidence, Actual: actual, Result: isPass ? '✅ PASS' : '❌ FAIL' });
            }
        } catch (e) {
            console.log(`❌ Connection Error`);
            results.push({ ID: testCase.id, Class: testCase.class, Expected: testCase.expected_confidence, Actual: 'CONN_ERROR', Result: '❌ ERROR' });
        }

        if (i < goldenSet.length - 1) await sleep(DELAY_MS);
    }

    const passRate = ((passed / goldenSet.length) * 100).toFixed(1);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 KẾT QUẢ: ${passed}/${goldenSet.length} Case Đạt (${passRate}%)`);
    console.log(`${'='.repeat(60)}\n`);
    console.table(results);

    // Xuất file markdown
    const md = `# Kết quả đo lượt 1 — Golden Set (${goldenSet.length} case)

- **Thời gian đo:** ${new Date().toLocaleString()}
- **Model:** gpt-4o-mini / gemini-1.5-flash
- **Tổng số case:** ${goldenSet.length}
- **Số case Đạt:** ${passed}/${goldenSet.length}
- **Tỉ lệ đạt:** **${passRate}%**
- **Quality Bar cam kết:** ≥ 80% qua bộ, 100% case thiếu căn cứ không bịa nguồn.

## Bảng kết quả chi tiết
| ID | Lớp chỗ khó | Mong đợi | Thực tế | Đánh giá |
|---|---|---|---|---|
${results.map(r => `| ${r.ID} | ${r.Class} | ${r.Expected} | ${r.Actual} | ${r.Result} |`).join('\n')}
`;
    fs.writeFileSync(path.join(__dirname, 'eval_results_run1.md'), md, 'utf8');
    console.log("📝 Đã lưu kết quả vào eval/eval_results_run1.md");
}

runEval();
