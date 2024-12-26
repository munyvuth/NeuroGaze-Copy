// Utility Functions
function safeJSONParse(data, fallback = []) {
    try {
        return JSON.parse(data);
    } catch {
        return fallback;
    }
}

function standardDeviation(values) {
    if (values.length === 0) return 0;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);
}

function median(values) {
    if (values.length === 0) return 0;
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Process eye tracking data
function processEyeTrackingData(rawData) {
    let jsonString = safeJSONParse(rawData);
    const data = safeJSONParse(jsonString);

    if (!data || !data.length) return null;
    const webgazer_data = data[0].webgazer_data;
    const target = data[0].webgazer_targets['#currentImg'] || data[0].webgazer_targets['#currentLetter'] || data[0].webgazer_targets['#passage'] || { x: 500, y: 500 };

    const distances = webgazer_data.map(p =>
        Math.sqrt(Math.pow(p.x - target.x, 2) + Math.pow(p.y - target.y, 2)));

    return {
        positions: webgazer_data,
        target: target,
        avgDistance: median(distances),
        variability: {
            x: standardDeviation(webgazer_data.map(p => p.x)),
            y: standardDeviation(webgazer_data.map(p => p.y))
        }
    };
}

// Process reaction times (directly from string, not JSON)
function processReactionTimes(rtString) {
    if (!rtString) return { times: [], avg: 0, median: 0, stdDev: 0 };
    const times = rtString.split(',').map(Number).filter(n => !isNaN(n));
    return {
        times: times,
        avg: times.reduce((a, b) => a + b, 0) / times.length,
        median: median(times),
        stdDev: standardDeviation(times)
    };
}

// Render eye tracking scatter plot
function renderEyeTrackingChart(canvasId, data) {
    if (!data || !data.positions.length) return;

    const ctx = document.getElementById(canvasId).getContext('2d');

    new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Eye Position',
                data: data.positions.map(p => ({ x: p.x, y: p.y })),
                borderColor: 'black',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderWidth: 1,
                pointRadius: 0,
                order: 2,
                showLine: true
            }, {
                label: 'Target',
                data: [{ x: data.target.x, y: data.target.y }],
                pointStyle: 'triangle',
                radius: 10,
                backgroundColor: 'red',
                borderWidth: 2,
                pointRadius: 5,
                order: 1,
                showLine: false,
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    min: data.target.x - 1000,
                    max: data.target.x + 1000
                },
                y: {
                    type: 'linear',
                    min: data.target.y - 1000,
                    max: data.target.y + 1000
                }
            }
        }
    });
}

// Create a table row
function createTableRow(label, value, unit = '', interpretation = '') {
    return `
        <tr class="border-b">
            <td class="py-2 font-medium">${label}</td>
            <td class="py-2 text-right">${value.toFixed(2)} ${unit}</td>
            <td class="py-2 text-sm text-gray-600">${interpretation}</td>
        </tr>
    `;
}

// Render metrics table
function renderMetricsTable(tableId, data) {
    const table = document.getElementById(tableId);
    table.innerHTML = `
        ${createTableRow("Average Reaction Time", data.rt.avg, "ms", data.rt.avg < 1500 ? "Regular" : "Slow")}
        ${createTableRow("Median Reaction Time", data.rt.median, "ms")}
        ${createTableRow("Reaction Time Variability", data.rt.stdDev, "ms", data.rt.stdDev > 500 ? "High Variability" : "Regular Variability")}
        ${createTableRow("Test Score", data.score, "%", data.score > 75 ? "Regular Performance" : "Variable Performance")}
        ${createTableRow("Omission Errors", data.omissions, "", data.omissions > 5 ? "High" : "Low")}
        ${createTableRow("Commission Errors", data.commissions, "", data.commissions > 5 ? "High" : "Low")}
    `;
}

// Process screening data
function loadScreeningResults() {
    const recommendationContent = document.getElementById("recommendationContent");

    const recommendationMessages = {
        adult: "The adult shows symptoms highly consistent with ADHD.",
        teen: {
            inattentive: "The teen shows symptoms of inattentive ADHD.",
            hyperactiveImpulsive: "The teen shows symptoms of hyperactive-impulsive ADHD.",
            combined: "The teen shows symptoms of combined inattentive and hyperactive-impulsive ADHD."
        },
        child: {
            predominantlyInattentive: "The child shows symptoms of predominantly inattentive ADHD.",
            predominantlyHyperactiveImpulsive: "The child shows symptoms of predominantly hyperactive-impulsive ADHD.",
            combinedInattentionHyperactivity: "The child shows symptoms of combined inattentive and hyperactive-impulsive ADHD.",
            oppositionalDefiantDisorder: "The child shows symptoms of oppositional defiant disorder.",
            conductDisorder: "The child shows symptoms of conduct disorder.",
            anxietyDepression: "The child shows symptoms of anxiety/depression."
        }
    };

    let recommendations = '';
    const selectedDifficulty = localStorage.getItem("selectedDifficulty");

    if (selectedDifficulty) {
        const results = JSON.parse(localStorage.getItem(`screening-${selectedDifficulty}`));
        console.log(results)
        if (selectedDifficulty === 'adult' && results.testA) {
            recommendations += `<p>${recommendationMessages.adult}</p>`;
        } else if (selectedDifficulty === 'teen' && results) {
            for (const type in recommendationMessages.teen) {
                if (results[type]) {
                    recommendations += `<p>${recommendationMessages.teen[type]}</p>`;
                }
            }
        } else if (selectedDifficulty === 'child' && results) {
            for (const type in recommendationMessages.child) {
                if (results[type]) {
                    recommendations += `<p>${recommendationMessages.child[type]}</p>`;
                }
            }
        }
        else {
            recommendations = "<p>No specific ADHD symptoms detected.</p>";
        }
    
    } else {
        recommendations = "<p>Error. Please retry the screening test.</p>";
    }

    recommendationContent.innerHTML = recommendations;
}

// Main report generation
function generateReport() {
    const attention = {
        rt: processReactionTimes(localStorage.getItem('attention-reactionTimes')),
        score: Number(localStorage.getItem('attention-testScore') || 0),
        omissions: Number(localStorage.getItem('attention-omissionErrors') || 0),
        commissions: Number(localStorage.getItem('attention-comissionErrors') || 0),
        eyeTracking: processEyeTrackingData(localStorage.getItem('attention-eyeTracking'))
    };

    const inhibition = {
        rt: processReactionTimes(localStorage.getItem('inhibition-reactionTimes')),
        score: Number(localStorage.getItem('inhibition-testScore') || 0),
        omissions: Number(localStorage.getItem('inhibition-omissionErrors') || 0),
        commissions: Number(localStorage.getItem('inhibition-comissionErrors') || 0),
        eyeTracking: processEyeTrackingData(localStorage.getItem('inhibition-eyeTracking'))
    };

    const interference = {
        eyeTracking: processEyeTrackingData(localStorage.getItem('interference-eyeTracking'))
    };

    document.getElementById('reportDate').textContent = new Date().toLocaleString();

    // Render tables
    renderMetricsTable('attentionMetrics', attention);
    renderMetricsTable('inhibitionMetrics', inhibition);

    // Render eye tracking charts (assuming you've implemented renderEyeTrackingChart)
    if (attention.eyeTracking) renderEyeTrackingChart('attentionEyeTrack', attention.eyeTracking);
    if (inhibition.eyeTracking) renderEyeTrackingChart('inhibitionEyeTrack', inhibition.eyeTracking);
    if (interference.eyeTracking) renderEyeTrackingChart('interferenceEyeTrack', interference.eyeTracking);

    loadScreeningResults();
}

document.addEventListener('DOMContentLoaded', generateReport);
