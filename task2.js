
// ==========================================
// CHRONOX - RACING STOPWATCH
// ==========================================

// DOM ELEMENTS
const hoursDisplay = document.getElementById("hours");
const minutesDisplay = document.getElementById("minutes");
const secondsDisplay = document.getElementById("seconds");
const millisecondsDisplay = document.getElementById("milliseconds");

const startButton = document.getElementById("start-timer");
const pauseButton = document.getElementById("pause-timer");
const lapButton = document.getElementById("lap-timer");
const resetButton = document.getElementById("reset-timer");
const clearLapsButton = document.getElementById("clear-laps");

const timerStatus = document.getElementById("timer-status");
const ringStatus = document.getElementById("ring-status");
const progressCircle = document.getElementById("progress-circle");

const totalLapsDisplay = document.getElementById("total-laps");
const bestLapDisplay = document.getElementById("best-lap");
const averageLapDisplay = document.getElementById("average-lap");
const slowestLapDisplay = document.getElementById("slowest-lap");

const lapCountDisplay = document.getElementById("lap-count");
const lapInsight = document.getElementById("lap-insight");
const lapsList = document.getElementById("laps-list");

const soundToggle = document.getElementById("sound-toggle");
const soundIcon = document.getElementById("sound-icon");
const soundLabel = document.getElementById("sound-label");

// ==========================================
// STOPWATCH VARIABLES
// ==========================================

let elapsedTime = 0;
let startTime = 0;
let timerInterval = null;
let isRunning = false;

let laps = [];
let previousLapTime = 0;
let soundEnabled = false;

const CIRCUMFERENCE = 2 * Math.PI * 132;

// ==========================================
// TIME FORMATTING
// ==========================================

function formatTime(time) {
    const total = Math.floor(time);

    const hours = Math.floor(total / 3600000);
    const minutes = Math.floor((total % 3600000) / 60000);
    const seconds = Math.floor((total % 60000) / 1000);
    const milliseconds = Math.floor((total % 1000) / 10);

    return {
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
        milliseconds: String(milliseconds).padStart(2, "0")
    };
}

function formatLapTime(time) {
    const formatted = formatTime(time);

    return `${formatted.minutes}:${formatted.seconds}.${formatted.milliseconds}`;
}

// ==========================================
// UPDATE TIMER DISPLAY
// ==========================================

function updateDisplay() {
    const time = formatTime(elapsedTime);

    hoursDisplay.textContent = time.hours;
    minutesDisplay.textContent = time.minutes;
    secondsDisplay.textContent = time.seconds;
    millisecondsDisplay.textContent = time.milliseconds;

    // Circular progress repeats every 60 seconds
    const progress = (elapsedTime % 60000) / 60000;

    const offset = CIRCUMFERENCE * (1 - progress);

    progressCircle.style.strokeDasharray = CIRCUMFERENCE;
    progressCircle.style.strokeDashoffset = offset;
}

// ==========================================
// TIMER STATUS AND BUTTONS
// ==========================================

function updateStatus(status) {
    timerStatus.textContent = status;
    ringStatus.textContent = status;
}

function updateButtons() {
    startButton.disabled = isRunning;
    pauseButton.disabled = !isRunning;
    lapButton.disabled = !isRunning;
    clearLapsButton.disabled = laps.length === 0;
}

// ==========================================
// START STOPWATCH
// ==========================================

function startTimer() {
    if (isRunning) return;

    isRunning = true;

    startTime = performance.now() - elapsedTime;

    timerInterval = setInterval(() => {
        elapsedTime = performance.now() - startTime;
        updateDisplay();
    }, 10);

    document.body.classList.add("running");

    updateStatus("TIMER RUNNING");
    updateButtons();
}

// ==========================================
// PAUSE STOPWATCH
// ==========================================

function pauseTimer() {
    if (!isRunning) return;

    elapsedTime = performance.now() - startTime;

    clearInterval(timerInterval);
    timerInterval = null;

    isRunning = false;

    document.body.classList.remove("running");

    updateDisplay();
    updateStatus("TIMER PAUSED");
    updateButtons();
}

// ==========================================
// RESET STOPWATCH
// ==========================================

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;

    elapsedTime = 0;
    startTime = 0;
    isRunning = false;

    laps = [];
    previousLapTime = 0;

    document.body.classList.remove("running");

    updateDisplay();
    updateStatistics();
    renderLaps();

    updateStatus("SYSTEM READY");
    updateButtons();
}

// ==========================================
// RECORD LAP
// ==========================================

function recordLap() {
    if (!isRunning) return;

    const lapTime = elapsedTime - previousLapTime;

    laps.push({
        number: laps.length + 1,
        lapTime: lapTime,
        totalTime: elapsedTime
    });

    previousLapTime = elapsedTime;

    playLapSound();
    updateStatistics();
    renderLaps();
    updateButtons();
}

// ==========================================
// LAP STATISTICS
// ==========================================

function updateStatistics() {
    totalLapsDisplay.textContent =
        String(laps.length).padStart(2, "0");

    lapCountDisplay.textContent =
        `${String(laps.length).padStart(2, "0")} LAPS`;

    if (laps.length === 0) {
        bestLapDisplay.textContent = "--:--.--";
        averageLapDisplay.textContent = "--:--.--";
        slowestLapDisplay.textContent = "--:--.--";
        lapInsight.textContent = "NO PERFORMANCE DATA AVAILABLE";
        return;
    }

    const lapTimes = laps.map(lap => lap.lapTime);

    const best = Math.min(...lapTimes);
    const slowest = Math.max(...lapTimes);

    const average =
        lapTimes.reduce((sum, time) => sum + time, 0) / laps.length;

    bestLapDisplay.textContent = formatLapTime(best);
    averageLapDisplay.textContent = formatLapTime(average);
    slowestLapDisplay.textContent = formatLapTime(slowest);

    const fastestLapNumber =
        laps.find(lap => lap.lapTime === best).number;

    lapInsight.textContent =
        `FASTEST PERFORMANCE: LAP ${String(fastestLapNumber).padStart(2, "0")}`;
}

// ==========================================
// DISPLAY LAP HISTORY
// ==========================================

function renderLaps() {
    lapsList.innerHTML = "";

    if (laps.length === 0) {
        lapsList.innerHTML = `
            <li class="empty-state">
                <span class="empty-symbol">◎</span>
                <strong>AWAITING FIRST LAP</strong>
                <p>Start the timer and record your first split.</p>
            </li>
        `;

        return;
    }

    const bestLapTime = Math.min(
        ...laps.map(lap => lap.lapTime)
    );

    [...laps].reverse().forEach(lap => {
        const item = document.createElement("li");
        item.className = "lap-item";

        const isFastest = lap.lapTime === bestLapTime;

        if (isFastest) {
            item.classList.add("best-lap");
        }

        // Lap number
        const number = document.createElement("span");
        number.className = "lap-number";
        number.textContent =
            `#${String(lap.number).padStart(2, "0")}`;

        // Lap time
        const time = document.createElement("span");
        time.className = "lap-time";
        time.textContent = formatLapTime(lap.lapTime);

        // Difference from previous lap
        const difference = document.createElement("span");
        difference.className = "lap-difference";

        if (lap.number === 1) {
            difference.textContent = "--";
        } else {
            const previousLap = laps[lap.number - 2];
            const diff = lap.lapTime - previousLap.lapTime;

            if (diff < 0) {
                difference.textContent =
                    `-${formatLapTime(Math.abs(diff))}`;
                difference.classList.add("faster");
            } else if (diff > 0) {
                difference.textContent =
                    `+${formatLapTime(diff)}`;
                difference.classList.add("slower");
            } else {
                difference.textContent = "EVEN";
            }
        }

        // Cumulative session time
        const total = document.createElement("span");
        total.className = "lap-total";
        total.textContent = formatLapTime(lap.totalTime);

        // Performance result
        const result = document.createElement("span");
        result.className = "lap-result";

        if (isFastest) {
            result.textContent = "FASTEST";
            result.classList.add("fastest");
        } else if (lap.lapTime === Math.max(...laps.map(l => l.lapTime))) {
            result.textContent = "SLOWEST";
            result.classList.add("slower");
        } else {
            result.textContent = "RECORDED";
        }

        item.append(number, time, difference, total, result);

        lapsList.appendChild(item);
    });
}

// ==========================================
// CLEAR LAP HISTORY
// ==========================================

function clearLaps() {
    laps = [];

    // The next recorded lap starts from the current timer value
    previousLapTime = elapsedTime;

    updateStatistics();
    renderLaps();
    updateButtons();
}

// ==========================================
// OPTIONAL SOUND FEEDBACK
// ==========================================

function playLapSound() {
    if (!soundEnabled) return;

    const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);

    gain.gain.setValueAtTime(0.08, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.15
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.15);

    oscillator.onended = () => audioContext.close();
}

function toggleSound() {
    soundEnabled = !soundEnabled;

    soundToggle.setAttribute("aria-pressed", String(soundEnabled));

    soundIcon.textContent = soundEnabled ? "♫" : "♪";
    soundLabel.textContent = soundEnabled ? "SOUND ON" : "SOUND OFF";
}

// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================

document.addEventListener("keydown", (event) => {
    const activeTag = document.activeElement.tagName;

    if (
        activeTag === "INPUT" ||
        activeTag === "TEXTAREA" ||
        activeTag === "SELECT"
    ) {
        return;
    }

    if (event.code === "Space") {
        event.preventDefault();

        if (isRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    }

    if (event.key.toLowerCase() === "l") {
        if (isRunning) {
            recordLap();
        }
    }

    if (event.key.toLowerCase() === "r") {
        resetTimer();
    }
});

// ==========================================
// EVENT LISTENERS
// ==========================================

startButton.addEventListener("click", startTimer);
pauseButton.addEventListener("click", pauseTimer);
lapButton.addEventListener("click", recordLap);
resetButton.addEventListener("click", resetTimer);
clearLapsButton.addEventListener("click", clearLaps);
soundToggle.addEventListener("click", toggleSound);

// ==========================================
// INITIALIZE APPLICATION
// ==========================================

function initializeStopwatch() {
    updateDisplay();
    updateStatistics();
    renderLaps();
    updateButtons();

    updateStatus("SYSTEM READY");
}

initializeStopwatch();
