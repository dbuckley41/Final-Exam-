// ============================================
// SCRIPT.JS - Probability and Odds Visualizer
// Log-odds visualizations and comparisons
// ============================================

// ============================================
// 1. UTILITY FUNCTIONS
// ============================================

/**
 * Rounds a number to 3 decimal places
 * @param {number} value - The value to round
 * @returns {number} Rounded value
 */
function roundToThreeDecimals(value) {
    return Math.round(value * 1000) / 1000;
}

/**
 * Calculates odds from probability
 * Formula: odds = p / (1 - p)
 * @param {number} probability - Value between 0 and 1
 * @returns {number} Calculated odds
 */
function probabilityToOdds(probability) {
    if (probability >= 1) return Infinity;
    if (probability <= 0) return 0;
    return probability / (1 - probability);
}

/**
 * Calculates log-odds (logit) from probability
 * Formula: log-odds = ln(p / (1 - p))
 * @param {number} probability - Value between 0 and 1
 * @returns {number} Calculated log-odds
 */
function probabilityToLogOdds(probability) {
    if (probability >= 1) return Infinity;
    if (probability <= 0) return -Infinity;
    return Math.log(probability / (1 - probability));
}

/**
 * Converts log-odds back to probability
 * Formula: p = e^(logit) / (1 + e^(logit))
 * @param {number} logOdds - The log-odds value
 * @returns {number} Calculated probability
 */
function logOddsToProbability(logOdds) {
    const eLogOdds = Math.exp(logOdds);
    return eLogOdds / (1 + eLogOdds);
}

/*
 * Updates the Real-World Examples panel text based on probability ranges.
 * @param {number} p - probability between 0 and 1
 */
function updateRealWorldExample(p) {
    const el = document.getElementById('real-world-example');
    if (!el) return;

    // Use percent for readability
    const pct = Math.round(p * 100);

    let text = '';
    if (p < 0.02) {
        text = `Very rare (~${pct}%). Example: Winning a small lottery prize or a very unlikely event.`;
    } else if (p < 0.08) {
        text = `Uncommon (~${pct}%). Example: Getting a "6" on a fair die is about 16.7% (close to this range).`;
    } else if (p < 0.2) {
        text = `Occasional (~${pct}%). Example: About the chance of rolling a specific number on a 6-sided die (≈16.7%).`;
    } else if (p < 0.4) {
        text = `Somewhat likely (~${pct}%). Example: A somewhat likely weather event or underdog winning.`;
    } else if (p < 0.6) {
        text = `About 50/50 (~${pct}%). Example: A fair coin toss has p = 50%.`;
    } else if (p < 0.8) {
        text = `Likely (~${pct}%). Example: A favored sports team winning a match.`;
    } else if (p < 0.95) {
        text = `Very likely (~${pct}%). Example: A heavily favored team or an expected outcome.`;
    } else {
        text = `Near certain (~${pct}%). Example: Almost guaranteed events (close to certain).`;
    }

    el.textContent = text;
}

// ============================================
// 2. CHART SETUP
// ============================================

// Global chart instances
let logitChart = null;
let comparisonChart = null;
let simulationChart = null;

// Chart colors and styling
const chartConfig = {
    primaryColor: 'rgba(102, 126, 234, 0.8)',
    primaryColorLight: 'rgba(102, 126, 234, 0.1)',
    secondaryColor: 'rgba(118, 75, 162, 0.8)',
    gridColor: 'rgba(255, 255, 255, 0.05)',
    markerColor: 'rgba(244, 67, 54, 1)',
    tooltipBgColor: 'rgba(15, 20, 25, 0.95)',
    probabilityColor: 'rgba(102, 126, 234, 0.8)',
    oddsColor: 'rgba(244, 67, 54, 0.8)',
};

/**
 * Creates the Log-Odds (Logit) chart
 */
function createLogitChart() {
    // Generate data points for the S-shaped curve
    const labels = [];
    const dataPoints = [];
    
    // Create finer resolution near boundaries for smoothness
    const probabilities = [
        0.01, 0.02, 0.03, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45,
        0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 0.97, 0.98, 0.99
    ];
    
    probabilities.forEach(p => {
        labels.push(p);
        const logOdds = probabilityToLogOdds(p);
        dataPoints.push(logOdds);
    });

    const ctx = document.getElementById('logit-chart').getContext('2d');
    logitChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Log-Odds (Logit)',
                    data: dataPoints,
                    borderColor: chartConfig.primaryColor,
                    backgroundColor: chartConfig.primaryColorLight,
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 2,
                    pointBackgroundColor: chartConfig.primaryColor,
                    pointBorderColor: 'rgba(255, 255, 255, 0.5)',
                    pointBorderWidth: 1,
                    pointHoverRadius: 5,
                    hoverBackgroundColor: chartConfig.secondaryColor,
                },
                // Marker point (updated dynamically)
                {
                    label: 'Current Value',
                    data: [{ x: 0.5, y: 0 }],
                    type: 'scatter',
                    pointRadius: 8,
                    pointBackgroundColor: chartConfig.markerColor,
                    pointBorderColor: 'rgba(255, 255, 255, 0.8)',
                    pointBorderWidth: 2,
                    showLine: false,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#b0b8d4',
                        font: { size: 12, weight: 600 },
                        padding: 15,
                    },
                },
                tooltip: {
                    backgroundColor: chartConfig.tooltipBgColor,
                    padding: 12,
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 12 },
                    cornerRadius: 6,
                    borderColor: 'rgba(102, 126, 234, 0.5)',
                    borderWidth: 1,
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += roundToThreeDecimals(context.parsed.y);
                            }
                            return label;
                        },
                    },
                },
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Probability',
                        font: { size: 13, weight: 600 },
                        color: '#667eea',
                    },
                    grid: {
                        color: chartConfig.gridColor,
                    },
                    ticks: {
                        color: '#7f8c8d',
                        font: { size: 11 },
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: 'Log-Odds',
                        font: { size: 13, weight: 600 },
                        color: '#667eea',
                    },
                    grid: {
                        color: chartConfig.gridColor,
                    },
                    ticks: {
                        color: '#7f8c8d',
                        font: { size: 11 },
                    },
                },
            },
        },
    });
}

/**
 * Creates the Probability vs Odds Comparison chart
 */
function createComparisonChart() {
    // Generate data points for both curves
    const labels = [];
    const probDataPoints = [];
    const oddsDataPoints = [];
    
    for (let p = 0.01; p <= 0.99; p += 0.02) {
        labels.push(roundToThreeDecimals(p));
        probDataPoints.push(p);
        const odds = probabilityToOdds(p);
        // Cap odds at 20 for visibility
        oddsDataPoints.push(Math.min(odds, 20));
    }

    const ctx = document.getElementById('comparison-chart').getContext('2d');
    comparisonChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Probability',
                    data: probDataPoints,
                    borderColor: chartConfig.probabilityColor,
                    backgroundColor: 'rgba(102, 126, 234, 0.05)',
                    fill: true,
                    tension: 0.1,
                    borderWidth: 3,
                    pointRadius: 2,
                    pointBackgroundColor: chartConfig.probabilityColor,
                    pointBorderColor: 'rgba(255, 255, 255, 0.5)',
                    pointBorderWidth: 1,
                    pointHoverRadius: 5,
                    hoverBackgroundColor: chartConfig.probabilityColor,
                    yAxisID: 'y1',
                },
                {
                    label: 'Odds',
                    data: oddsDataPoints,
                    borderColor: chartConfig.oddsColor,
                    backgroundColor: 'rgba(244, 67, 54, 0.05)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 3,
                    pointRadius: 2,
                    pointBackgroundColor: chartConfig.oddsColor,
                    pointBorderColor: 'rgba(255, 255, 255, 0.5)',
                    pointBorderWidth: 1,
                    pointHoverRadius: 5,
                    hoverBackgroundColor: chartConfig.oddsColor,
                    yAxisID: 'y2',
                },
                // Probability marker
                {
                    label: 'Current Probability',
                    data: [{ x: 0.5, y: 0.5 }],
                    type: 'scatter',
                    pointRadius: 8,
                    pointBackgroundColor: chartConfig.probabilityColor,
                    pointBorderColor: 'rgba(255, 255, 255, 0.8)',
                    pointBorderWidth: 2,
                    showLine: false,
                    yAxisID: 'y1',
                },
                // Odds marker
                {
                    label: 'Current Odds',
                    data: [{ x: 0.5, y: 1 }],
                    type: 'scatter',
                    pointRadius: 8,
                    pointBackgroundColor: chartConfig.oddsColor,
                    pointBorderColor: 'rgba(255, 255, 255, 0.8)',
                    pointBorderWidth: 2,
                    showLine: false,
                    yAxisID: 'y2',
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#b0b8d4',
                        font: { size: 12, weight: 600 },
                        padding: 15,
                    },
                },
                tooltip: {
                    backgroundColor: chartConfig.tooltipBgColor,
                    padding: 12,
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 12 },
                    cornerRadius: 6,
                    borderColor: 'rgba(102, 126, 234, 0.5)',
                    borderWidth: 1,
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += roundToThreeDecimals(context.parsed.y);
                            }
                            return label;
                        },
                    },
                },
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Probability',
                        font: { size: 13, weight: 600 },
                        color: '#667eea',
                    },
                    grid: {
                        color: chartConfig.gridColor,
                    },
                    ticks: {
                        color: '#7f8c8d',
                        font: { size: 11 },
                    },
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Probability',
                        font: { size: 13, weight: 600 },
                        color: chartConfig.probabilityColor,
                    },
                    min: 0,
                    max: 1,
                    grid: {
                        color: chartConfig.gridColor,
                    },
                    ticks: {
                        color: '#7f8c8d',
                        font: { size: 11 },
                    },
                },
                y2: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Odds',
                        font: { size: 13, weight: 600 },
                        color: chartConfig.oddsColor,
                    },
                    min: 0,
                    max: 20,
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        color: '#7f8c8d',
                        font: { size: 11 },
                    },
                },
            },
        },
    });
}

/**
 * Creates the simulation bar chart (successes vs failures)
 */
function createSimulationChart() {
    const ctx = document.getElementById('simulation-chart').getContext('2d');
    simulationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Successes', 'Failures'],
            datasets: [
                {
                    label: 'Count',
                    data: [0, 0],
                    backgroundColor: [chartConfig.probabilityColor, chartConfig.oddsColor],
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: chartConfig.tooltipBgColor,
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ${context.parsed.y}`;
                        },
                    },
                },
            },
            scales: {
                y: { beginAtZero: true, ticks: { color: '#b0b8d4' } },
                x: { ticks: { color: '#b0b8d4' } },
            },
        },
    });
}

// ============================================
// 3. EVENT HANDLERS
// ============================================

/**
 * Updates log-odds display when slider changes
 */
function handleLogitSliderChange(event) {
    const probability = parseFloat(event.target.value);

    // Update display
    document.getElementById('logit-prob-value').textContent = roundToThreeDecimals(probability);

    // Calculate and display odds
    const odds = probabilityToOdds(probability);
    document.getElementById('logit-odds-value').textContent = roundToThreeDecimals(odds);

    // Calculate and display log-odds
    const logOdds = probabilityToLogOdds(probability);
    document.getElementById('logit-value').textContent = roundToThreeDecimals(logOdds);

    // Update chart marker
    if (logitChart) {
        logitChart.data.datasets[1].data = [
            {
                x: probability,
                y: logOdds,
            },
        ];
        logitChart.update('none');
    }

    // Update real-world example panel based on the selected probability
    updateRealWorldExample(probability);
}

/**
 * Updates comparison display when input changes
 */
function handleComparisonInputChange(event) {
    let probability = parseFloat(event.target.value);

    // Validate and constrain probability
    if (isNaN(probability) || probability < 0) {
        probability = 0.01;
    } else if (probability > 1) {
        probability = 0.99;
    }

    // Update display
    document.getElementById('comp-prob-value').textContent = roundToThreeDecimals(probability);

    // Calculate and display odds
    const odds = probabilityToOdds(probability);
    document.getElementById('comp-odds-value').textContent = roundToThreeDecimals(odds);

    // Update chart markers
    if (comparisonChart) {
        // Update probability marker
        comparisonChart.data.datasets[2].data = [
            {
                x: probability,
                y: probability,
            },
        ];
        // Update odds marker
        comparisonChart.data.datasets[3].data = [
            {
                x: probability,
                y: Math.min(odds, 20),
            },
        ];
        comparisonChart.update('none');
    }
}

/**
 * Runs a simulation with `n` trials using probability `p`.
 * Updates DOM elements and the simulation chart.
 */
function runSimulation(p, n) {
    // Ensure p is in (0,1)
    p = Math.min(Math.max(p, 0), 1);

    let successes = 0;
    for (let i = 0; i < n; i++) {
        if (Math.random() < p) successes++;
    }
    const failures = n - successes;
    const rate = successes / n;

    // Update DOM
    document.getElementById('sim-successes').textContent = successes;
    document.getElementById('sim-failures').textContent = failures;
    document.getElementById('sim-rate').textContent = roundToThreeDecimals(rate);

    // Update chart
    if (simulationChart) {
        simulationChart.data.datasets[0].data = [successes, failures];
        // adjust y max slightly to fit
        const maxVal = Math.max(successes, failures);
        simulationChart.options.scales.y.max = Math.ceil(maxVal * 1.1);
        simulationChart.update();
    }
}

// ============================================
// 4. PRACTICE QUESTIONS
// ============================================

/**
 * Question generator class for conceptual questions
 */
let questionGenerator = null; // will be initialized in initializeApp()

class ConceptualQuestionGenerator {
    constructor(questionCount = 5) {
        this.questionCount = questionCount;
        this.questions = [];
        this.answers = [];
        this.questionTypes = [
            'logit-conversion',
            'odds-growth',
            'logit-interpretation',
            'probability-conversion',
            'compare-metrics',
        ];
    }

    /**
     * Generates random conceptual practice questions
     */
    generate() {
        this.questions = [];
        this.answers = [];

        for (let i = 0; i < this.questionCount; i++) {
            const typeIndex = i % this.questionTypes.length;
            const questionType = this.questionTypes[typeIndex];

            switch (questionType) {
                case 'logit-conversion':
                    this.generateLogitConversion();
                    break;
                case 'odds-growth':
                    this.generateOddsGrowthQuestion();
                    break;
                case 'logit-interpretation':
                    this.generateLogitInterpretation();
                    break;
                case 'probability-conversion':
                    this.generateProbabilityConversion();
                    break;
                case 'compare-metrics':
                    this.generateComparisonQuestion();
                    break;
            }
        }
    }

    /**
     * Generates a logit conversion question
     */
    generateLogitConversion() {
        const probability = roundToThreeDecimals(Math.random() * 0.8 + 0.1); // 0.1 to 0.9
        const logOdds = probabilityToLogOdds(probability);
        const roundedLogOdds = roundToThreeDecimals(logOdds);

        this.questions.push({
            type: 'logit-conversion',
            text: `If probability = ${probability}, what is the log-odds (logit)?`,
            inputId: `question-${this.questions.length}`,
        });

        this.answers.push({
            question: `If probability = ${probability}, what is the log-odds (logit)?`,
            answer: roundedLogOdds,
            formula: `log-odds = ln(${probability} / (1 - ${probability})) = ln(${roundToThreeDecimals(probability / (1 - probability))}) = ${roundedLogOdds}`,
        });
    }

    /**
     * Generates a question about why odds grow faster
     */
    generateOddsGrowthQuestion() {
        // Make this a True/False question
        this.questions.push({
            type: 'odds-growth',
            text: 'True or False: Odds grow much faster than probability as p approaches 1.',
            inputId: `question-${this.questions.length}`,
        });

        this.answers.push({
            question: 'True or False: Odds grow much faster than probability as p approaches 1.',
            answer: 'True',
            formula: 'Odds = p/(1-p). As p→1, the denominator (1-p)→0, causing odds→∞. Probability stays bounded at 1.',
        });
    }

    /**
     * Generates a logit interpretation question
     */
    generateLogitInterpretation() {
        const logOdds = roundToThreeDecimals((Math.random() - 0.5) * 4); // -2 to 2
        const probability = logOddsToProbability(logOdds);
        const roundedProb = roundToThreeDecimals(probability);

        this.questions.push({
            type: 'logit-interpretation',
            text: `If log-odds = ${logOdds}, what is the probability?`,
            inputId: `question-${this.questions.length}`,
        });

        this.answers.push({
            question: `If log-odds = ${logOdds}, what is the probability?`,
            answer: roundedProb,
            formula: `p = e^${logOdds} / (1 + e^${logOdds}) = ${roundToThreeDecimals(Math.exp(logOdds))} / ${roundToThreeDecimals(1 + Math.exp(logOdds))} = ${roundedProb}`,
        });
    }

    /**
     * Generates a probability to odds conversion
     */
    generateProbabilityConversion() {
        const probability = roundToThreeDecimals(Math.random() * 0.7 + 0.15); // 0.15 to 0.85
        const odds = probabilityToOdds(probability);
        const roundedOdds = roundToThreeDecimals(odds);

        this.questions.push({
            type: 'probability-conversion',
            text: `Convert probability = ${probability} to odds.`,
            inputId: `question-${this.questions.length}`,
        });

        this.answers.push({
            question: `Convert probability = ${probability} to odds.`,
            answer: roundedOdds,
            formula: `odds = ${probability} / (1 - ${probability}) = ${probability} / ${roundToThreeDecimals(1 - probability)} = ${roundedOdds}`,
        });
    }

    /**
     * Generates a comparison question
     */
    generateComparisonQuestion() {
        // Make this a True/False question
        this.questions.push({
            type: 'compare-metrics',
            text: 'True or False: A positive log-odds (logit > 0) indicates the event is more likely than not.',
            inputId: `question-${this.questions.length}`,
        });

        this.answers.push({
            question: 'True or False: A positive log-odds (logit > 0) indicates the event is more likely than not.',
            answer: 'True',
            formula: 'log-odds = ln(p/(1-p)) > 0 implies p > 0.5, so the event is more likely than not.',
        });
    }

    /**
     * Renders questions to the DOM
     */
    renderQuestions() {
        const container = document.getElementById('questions-container');
        container.innerHTML = '';

        this.questions.forEach((question, index) => {
            const questionElement = document.createElement('div');
            questionElement.className = 'question-item';

            // For True/False questions render radio buttons
            if (question.type === 'odds-growth' || question.type === 'compare-metrics') {
                questionElement.innerHTML = `
                    <span class="question-text">${index + 1}. ${question.text}</span>
                    <div class="question-input boolean-input">
                        <label style="margin-right:12px;"><input type="radio" name="${question.inputId}-tf" value="True"> True</label>
                        <label><input type="radio" name="${question.inputId}-tf" value="False"> False</label>
                    </div>
                    <div id="feedback-${index}" class="small-hint" aria-live="polite"></div>
                `;
            } else {
                questionElement.innerHTML = `
                    <span class="question-text">${index + 1}. ${question.text}</span>
                    <input 
                        type="text" 
                        id="${question.inputId}" 
                        class="question-input" 
                        placeholder="Enter answer"
                    >
                    <div id="feedback-${index}" class="small-hint" aria-live="polite"></div>
                `;
            }

            container.appendChild(questionElement);
        });
    }

    /**
     * Renders answer key to the DOM (method on the generator)
     */
    renderAnswerKey() {
        const container = document.getElementById('answer-key-container');
        container.innerHTML = '<h3>Answer Key</h3>';

        this.answers.forEach((answer, index) => {
            const answerElement = document.createElement('div');
            answerElement.className = 'answer-item';
            answerElement.innerHTML = `
                <strong>Question ${index + 1}:</strong> ${answer.question}<br>
                <strong>Answer:</strong> ${answer.answer}<br>
                <strong>Explanation:</strong> ${answer.formula}
            `;
            container.appendChild(answerElement);
        });
    }

}


/**
 * Compares student answers to answer key and updates feedback
 */
function checkSubmittedAnswers() {
    if (!questionGenerator) return;

    let numCorrect = 0;
    const total = questionGenerator.answers.length;

    questionGenerator.answers.forEach((ansObj, idx) => {
        const q = questionGenerator.questions[idx];
        const feedbackEl = document.getElementById(`feedback-${idx}`);
        const questionItem = document.getElementById(`question-${idx}`)?.closest('.question-item') || document.querySelector(`#feedback-${idx}`)?.closest('.question-item');
        if (!feedbackEl) return;

        let userRaw = '';
        const expected = ansObj.answer;

        // Handle True/False questions
        if (q.type === 'odds-growth' || q.type === 'compare-metrics') {
            const sel = document.querySelector(`input[name="${q.inputId}-tf"]:checked`);
            userRaw = sel ? sel.value : '';
        } else {
            const inputEl = document.getElementById(`question-${idx}`);
            if (!inputEl) return;
            userRaw = inputEl.value.trim();
        }

        let correct = false;

        // Determine if expected is numeric
        const expectedNum = parseFloat(expected);
        const userNum = parseFloat(userRaw);

        if (!isNaN(expectedNum) && isFinite(expectedNum)) {
            // numeric comparison with tolerance
            if (!isNaN(userNum) && isFinite(userNum)) {
                const diff = Math.abs(userNum - expectedNum);
                correct = diff <= 0.001; // within 0.001
            } else {
                correct = false;
            }
        } else {
            // textual/comprehension or boolean answer
            const expectedStr = String(expected).toLowerCase();
            const userStr = String(userRaw).toLowerCase();
            if (userStr.length === 0) {
                correct = false;
            } else if (userStr === expectedStr) {
                correct = true;
            } else if (userStr.includes(expectedStr) || expectedStr.includes(userStr)) {
                correct = true;
            } else {
                correct = false;
            }
        }

        if (correct) {
            numCorrect += 1;
            if (questionItem) {
                questionItem.classList.remove('answer-incorrect');
                questionItem.classList.add('answer-correct');
            }
            feedbackEl.textContent = 'Correct';
        } else {
            if (questionItem) {
                questionItem.classList.remove('answer-correct');
                questionItem.classList.add('answer-incorrect');
            }
            // show correct answer in feedback
            feedbackEl.textContent = `Incorrect — answer: ${ansObj.answer}`;
        }
    });

    // Update overall feedback area
    const overall = document.getElementById('questions-feedback');
    if (overall) {
        overall.textContent = `Score: ${numCorrect} / ${total}`;
    }
}


// ============================================
// 5. INITIALIZATION
// ============================================

/**
 * Initializes the application
 */
function initializeApp() {
    // Create question generator (global)
    questionGenerator = new ConceptualQuestionGenerator(5);
    questionGenerator.generate();
    questionGenerator.renderQuestions();
    questionGenerator.renderAnswerKey();

    // Create charts
    createLogitChart();
    createComparisonChart();
    createSimulationChart();

    // Initialize logit slider with default value (0.5)
    const logitSlider = document.getElementById('logit-slider');
    document.getElementById('logit-prob-value').textContent = '0.500';
    document.getElementById('logit-odds-value').textContent = roundToThreeDecimals(
        probabilityToOdds(0.5)
    );
    document.getElementById('logit-value').textContent = roundToThreeDecimals(
        probabilityToLogOdds(0.5)
    );

    // Initialize comparison input with default value (0.5)
    const comparisonInput = document.getElementById('comparison-input');
    document.getElementById('comp-prob-value').textContent = '0.500';
    document.getElementById('comp-odds-value').textContent = roundToThreeDecimals(
        probabilityToOdds(0.5)
    );

    // Event listeners
    logitSlider.addEventListener('input', handleLogitSliderChange);
    comparisonInput.addEventListener('input', handleComparisonInputChange);

    // Simulation button wiring (uses its own probability input independent from top graphs)
    document.getElementById('run-simulation-btn').addEventListener('click', () => {
        const trialsSelect = document.getElementById('simulation-trials');
        const n = parseInt(trialsSelect.value, 10) || 100;
        const pInput = document.getElementById('simulation-probability');
        let p = parseFloat(pInput.value);
        if (isNaN(p)) p = 0.5;
        // constrain p to sensible range
        if (p <= 0) p = 0.01;
        if (p >= 1) p = 0.99;
        // update displayed sim probability
        document.getElementById('sim-prob-display').textContent = roundToThreeDecimals(p);
        runSimulation(p, n);
    });

    // Update the displayed simulation probability when user edits the simulation input
    const simProbInput = document.getElementById('simulation-probability');
    simProbInput.addEventListener('input', (e) => {
        let v = parseFloat(e.target.value);
        if (isNaN(v)) v = 0;
        if (v < 0.01) v = 0.01;
        if (v > 0.99) v = 0.99;
        document.getElementById('sim-prob-display').textContent = roundToThreeDecimals(v);
    });

    // Initialize the real-world example for the default slider value
    updateRealWorldExample(parseFloat(logitSlider.value));

    // Generate questions button
    document.getElementById('generate-questions-btn').addEventListener('click', () => {
        questionGenerator.generate();
        questionGenerator.renderQuestions();
        questionGenerator.renderAnswerKey();
        // Hide answer key when generating new questions
        document.getElementById('answer-key-container').style.display = 'none';
        document.getElementById('answer-key-toggle').textContent = 'Show Answer Key';
    });

    // Submit answers button wiring
    const submitBtn = document.getElementById('submit-answers-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            checkSubmittedAnswers();
        });
    }

    // Answer key toggle button
    document.getElementById('answer-key-toggle').addEventListener('click', () => {
        const answerKeyContainer = document.getElementById('answer-key-container');
        const isVisible = answerKeyContainer.style.display !== 'none';

        if (isVisible) {
            answerKeyContainer.style.display = 'none';
            document.getElementById('answer-key-toggle').textContent = 'Show Answer Key';
        } else {
            answerKeyContainer.style.display = 'block';
            document.getElementById('answer-key-toggle').textContent = 'Hide Answer Key';
        }
    });

    console.log('Probability and Odds Visualizer initialized successfully!');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
