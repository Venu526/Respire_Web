import { determineRiskLevel, getPredictions } from './src/utils/AIPredictionService.js';

const testCases = [
    { name: "Normal Vitals", vitals: { spo2: 98, heart_rate: 72, respiratory_rate: 16, bp_systolic: 120, temperature: 36.6, borg_scale: 0 } },
    { name: "Slightly low SpO2 (94)", vitals: { spo2: 94 } }, // Should be Moderate (SpO2 < 94)
    { name: "RR 15 (Score 1)", vitals: { spo2: 98, respiratory_rate: 15 } }, // Should be Low Risk (Score 1 < 3)
    { name: "Temp 32.0 as per user", vitals: { spo2: 99, temperature: 32.0, accessory_muscle_use: 1 } }, // Score: Temp (2) + AM (2) + RR default (1) = 5 -> High
    { name: "Moderate Risk (Score 3)", vitals: { spo2: 98, respiratory_rate: 21, heart_rate: 101 } }, // Score: RR(2) + HR(1) = 3 -> Moderate
    { name: "Moderate Risk (Borg 4)", vitals: { spo2: 98, borg_scale: 4 } } // -> Moderate
];

testCases.forEach(tc => {
    const risk = determineRiskLevel(tc.vitals);
    console.log(`Test: ${tc.name} -> Result: ${risk}`);
    if (tc.name === "Normal Vitals") {
        const preds = getPredictions(tc.vitals);
        console.log(`  Predictions[0] risk: ${preds[0].risk}`);
    }
});
