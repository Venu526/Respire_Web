// AI Prediction Engine (Aligned with iOS AIRiskEngine.swift and MEWS)
export const determineRiskLevel = (vitals) => {
    if (!vitals) return 'No Data';

    let score = 0;
    const spo2 = parseInt(vitals.spo2) || 98;
    const rr = parseInt(vitals.respiratory_rate) || 16;
    const hr = parseInt(vitals.heart_rate) || 72;
    const sbp = parseInt(vitals.bp_systolic) || 120;
    const temp = parseFloat(vitals.temperature) || 36.6;
    const wob = vitals.work_of_breathing || 'Normal';
    const am = vitals.accessory_muscle_use;
    const borg = parseInt(vitals.borg_scale) || 0;

    // 1. SpO2 Score
    if (spo2 >= 96) score += 0; // Aligned with iOS ClinicalAssessment.swift (96% is 0)
    else if (spo2 >= 94) score += 1;
    else if (spo2 >= 92) score += 2;
    else score += 3; // < 92

    // 2. Respiratory Rate Score (Aligned with iOS MEWS)
    if (rr < 9) score += 2;
    else if (rr >= 9 && rr <= 14) score += 0; 
    else if (rr >= 15 && rr <= 20) score += 1; // Correct MEWS escalation
    else if (rr >= 21 && rr <= 29) score += 2;
    else score += 3; // >= 30

    // 3. Heart Rate Score
    if (hr < 40) score += 2;
    else if (hr >= 40 && hr <= 50) score += 1;
    else if (hr >= 51 && hr <= 100) score += 0;
    else if (hr >= 101 && hr <= 110) score += 1;
    else if (hr >= 111 && hr <= 129) score += 2;
    else score += 3; // >= 130

    // 4. Systolic BP Score
    if (sbp < 70) score += 3;
    else if (sbp >= 70 && sbp <= 80) score += 2;
    else if (sbp >= 81 && sbp <= 100) score += 1;
    else if (sbp >= 101 && sbp <= 199) score += 0;
    else score += 2; // >= 200

    // 5. Temperature Score (With Fahrenheit safety check)
    let clinicalTemp = temp;
    if (temp > 70) clinicalTemp = (temp - 32) * 5 / 9; // Auto-convert Fahrenheit

    if (clinicalTemp < 35.0) score += 2;
    else if (clinicalTemp >= 35.0 && clinicalTemp <= 38.4) score += 0;
    else score += 2; // >= 38.5

    // 6. Work of Breathing (Matching iOS)
    if (wob === 'Mild') score += 1;
    else if (wob === 'Moderate') score += 2;
    else if (wob === 'Severe') score += 3;

    // 7. Accessory Muscle Use (Matching iOS)
    if (am === "1" || am === 1 || am === true) score += 2;

    // 8. Borg Scale
    if (borg >= 7) score += 3;
    else if (borg >= 5) score += 2;
    else if (borg >= 3) score += 1;

    // --- Risk Level Mapping (Aligned with iOS AIRiskEngine.swift) ---
    
    // Critical: SpO2 < 90 OR MEWS >= 7
    if (spo2 < 90 || score >= 7) return 'Critical';
    
    // High: SpO2 < 92 OR MEWS >= 5 OR Borg >= 7
    if (spo2 < 92 || score >= 5 || borg >= 7) return 'High';
    
    // Moderate: SpO2 < 94 OR MEWS >= 3 OR Borg >= 4
    if (spo2 < 94 || score >= 3 || borg >= 4) {
        return 'Moderate';
    }
    
    return 'Low Risk';
};

export const getPredictions = (currentVitals) => {
    if (!currentVitals) return [];

    let currentSpo2 = parseInt(currentVitals.spo2) || 98;
    let currentHr = parseInt(currentVitals.heart_rate) || 72;
    let currentRr = parseInt(currentVitals.respiratory_rate) || 16;

    const currentRisk = determineRiskLevel(currentVitals);

    // Only deteriorate if high or critical risk
    const isEscalating = currentRisk === 'High' || currentRisk === 'Critical';
    const isModerate = currentRisk === 'Moderate';

    // Slopes (how much worse/better per hour)
    let spo2Slope = isEscalating ? -0.8 : (isModerate ? -0.3 : 0);
    let hrSlope = isEscalating ? 3 : (isModerate ? 1 : 0);
    let rrSlope = isEscalating ? 2 : (isModerate ? 0.5 : 0);

    const predictions = [];

    for (let i = 1; i <= 5; i++) {
        // Extrapolate with some randomness for healthy, or steady decline for sick
        currentSpo2 = currentSpo2 + spo2Slope + (!isEscalating && !isModerate ? (Math.random() > 0.5 ? 0.2 : -0.2) : 0);
        currentHr = currentHr + hrSlope + (!isEscalating && !isModerate ? (Math.random() > 0.5 ? 1 : -1) : 0);
        currentRr = currentRr + rrSlope + (!isEscalating && !isModerate ? (Math.random() > 0.5 ? 0.5 : -0.5) : 0);

        // Cap values to clinical limits
        currentSpo2 = Math.min(100, Math.max(70, currentSpo2));
        currentHr = Math.min(200, Math.max(30, currentHr));
        currentRr = Math.min(50, Math.max(5, currentRr));

        // Create a temporary object for simulation
        const simulatedVitals = {
            ...currentVitals,
            spo2: Math.round(currentSpo2),
            heart_rate: Math.round(currentHr),
            respiratory_rate: Math.round(currentRr)
        };

        const nextRisk = determineRiskLevel(simulatedVitals);

        predictions.push({
            hour: i,
            timeLabel: `+${i} Hr`,
            spo2: Math.round(currentSpo2),
            hr: Math.round(currentHr),
            rr: Math.round(currentRr),
            risk: nextRisk
        });
    }

    return predictions;
};
