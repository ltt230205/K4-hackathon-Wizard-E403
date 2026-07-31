// eval/run_eval.js - Chay do Golden Set gon 10-15 case voi delay chong rate limit.
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function resultLabel(isPass) {
    return isPass ? 'PASS' : 'FAIL';
}

async function runEval() {
    loadEnv();

    const port = process.env.PORT || 3001;
    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
    const serverUrl = `http://localhost:${port}/api/explain`;
    const delayMs = 500;
    const goldenSet = JSON.parse(fs.readFileSync(path.join(__dirname, 'golden_set.json'), 'utf8'));

    console.log(`Bat dau do Golden Set (${goldenSet.length} case) voi ${model}...\n`);

    let passed = 0;
    const results = [];

    for (let i = 0; i < goldenSet.length; i++) {
        const testCase = goldenSet[i];
        process.stdout.write(`[${i + 1}/${goldenSet.length}] ${testCase.id} - ${testCase.class}... `);

        try {
            const res = await fetch(serverUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selectedText: testCase.selected_text,
                    slideContext: testCase.context
                })
            }).then(r => r.json());

            const actual = res.confidence_level || 'UNKNOWN';
            const isPass = actual === testCase.expected_confidence;
            if (isPass) passed++;

            console.log(`${resultLabel(isPass)} Expected: ${testCase.expected_confidence} | Got: ${actual}`);
            results.push({
                ID: testCase.id,
                Class: testCase.class,
                Expected: testCase.expected_confidence,
                Actual: actual,
                Result: resultLabel(isPass)
            });
        } catch (err) {
            console.log('ERROR Connection/API error');
            results.push({
                ID: testCase.id,
                Class: testCase.class,
                Expected: testCase.expected_confidence,
                Actual: 'CONN_ERROR',
                Result: 'ERROR'
            });
        }

        if (i < goldenSet.length - 1) await sleep(delayMs);
    }

    const passRate = ((passed / goldenSet.length) * 100).toFixed(1);
    console.log(`\nKET QUA: ${passed}/${goldenSet.length} case dat (${passRate}%)\n`);
    console.table(results);

    const failedRows = results.filter(r => r.Result !== 'PASS');
    const md = `# Kết quả đo lượt 1 - Golden Set (${goldenSet.length} case)

- **Thời gian đo:** ${new Date().toLocaleString()}
- **Model:** ${model}
- **Tổng số case:** ${goldenSet.length}
- **Số case đạt:** ${passed}/${goldenSet.length}
- **Tỉ lệ đạt:** **${passRate}%**
- **Quality bar:** Đạt khi ≥ 80% qua bộ case, 100% case thiếu căn cứ không bịa nguồn.
- **Case chưa đạt:** ${failedRows.length ? failedRows.map(r => `${r.ID} (${r.Expected} -> ${r.Actual})`).join(', ') : 'Không có'}

## Bảng kết quả chi tiết

| ID | Lớp chỗ khó | Mong đợi | Thực tế | Đánh giá |
|---|---|---|---|---|
${results.map(r => `| ${r.ID} | ${r.Class} | ${r.Expected} | ${r.Actual} | ${r.Result} |`).join('\n')}
`;

    fs.writeFileSync(path.join(__dirname, 'eval_results_run1.md'), md, 'utf8');
    console.log('Da luu ket qua vao eval/eval_results_run1.md');
}

runEval();
