// eval/run_eval.js - Script tự động chạy đo trọn bộ Golden Set 20 case
const fs = require('fs');
const path = require('path');

async function runEval() {
    console.log("🚀 Bắt đầu đo lượt 1 với OpenAI API...");
    const goldenSet = JSON.parse(fs.readFileSync(path.join(__dirname, 'golden_set.json'), 'utf8'));

    let passed = 0;
    let results = [];

    for (let testCase of goldenSet) {
        try {
            const res = await fetch('http://localhost:3000/api/explain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ selectedText: testCase.selected_text, slideContext: testCase.context })
            }).then(r => r.json());

            const isPass = (res.confidence_level === testCase.expected_confidence);
            if (isPass) passed++;

            results.push({
                ID: testCase.id,
                Class: testCase.class,
                Expected: testCase.expected_confidence,
                Actual: res.confidence_level,
                Result: isPass ? '✅ PASS' : '❌ FAIL'
            });
        } catch (e) {
            results.push({ ID: testCase.id, Class: testCase.class, Result: '❌ ERROR' });
        }
    }

    const passRate = ((passed / goldenSet.length) * 100).toFixed(1);
    console.log(`\n📊 KẾT QUẢ ĐO LƯỢT 1: ${passed}/${goldenSet.length} Case Đạt (${passRate}%)\n`);
    console.table(results);

    // Xuất file kết quả markdown
    const mdContent = `
# Kết quả đo lượt 1 — Golden Set (20 case)

- **Thời gian đo:** ${new Date().toLocaleString()}
- **Tổng số case:** ${goldenSet.length}
- **Số case Đạt:** ${passed}/${goldenSet.length}
- **Tỉ lệ đạt:** **${passRate}%**
- **Quality Bar cam kết:** ≥ 80% qua bộ, 100% case thiếu căn cứ không bịa nguồn.

## Bảng kết quả chi tiết
| ID | Lớp chỗ khó | Kết quả mong đợi | Thực tế | Đánh giá |
|---|---|---|---|---|
${results.map(r => `| ${r.ID} | ${r.Class} | ${r.Expected || '-'} | ${r.Actual || '-'} | ${r.Result} |`).join('\n')}
`;
    fs.writeFileSync(path.join(__dirname, 'eval_results_run1.md'), mdContent, 'utf8');
    console.log("📝 Đã xuất kết quả vào file eval/eval_results_run1.md!");
}

runEval();
