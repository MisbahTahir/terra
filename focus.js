const subjectSelect = document.getElementById("subject");
const taskSelect = document.getElementById("study-task");
const goalInput = document.getElementById("study-goal");

const customFocusInput = document.getElementById("custom-focus");
const customBreakInput = document.getElementById("custom-break");

const timerDisplay = document.getElementById("timer");
const timerMode = document.getElementById("timer-mode");
const timerMessage = document.getElementById("timer-message");
const sessionMessage = document.getElementById("session-message");

const startButton = document.getElementById("start-button");
const pauseButton = document.getElementById("pause-button");
const resetButton = document.getElementById("reset-button");

const sessionsCount = document.getElementById("sessions-count");
const focusedTime = document.getElementById("focused-time");
const sessionHistory = document.getElementById("session-history");

const durationButtons = document.querySelectorAll(".duration-option");

const TASKS_KEY = "study-tasks";
const SESSIONS_KEY = "focus-sessions";

let timerInterval = null;
let isRunning = false;
let currentMode = "focus";
let remainingSeconds = 25 * 60;

let focusMinutes = 25;
let breakMinutes = 5;

// Get today's date in local time.
function getToday() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Safely load saved data.
function loadData(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// Save session history.
function saveSessions(sessions) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

// Display the timer as MM:SS.
function updateTimerDisplay() {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;

  document.title = `${timerDisplay.textContent} | ${
    currentMode === "focus" ? "Focus" : "Break"
  }`;
}

// Update focus and break durations.
function updateDurations() {
  const newFocus = Number(customFocusInput.value);
  const newBreak = Number(customBreakInput.value);

  if (
    !Number.isFinite(newFocus) ||
    !Number.isFinite(newBreak) ||
    newFocus < 1 ||
    newFocus > 180 ||
    newBreak < 1 ||
    newBreak > 60
  ) {
    sessionMessage.textContent =
      "Focus must be 1–180 minutes and break must be 1–60 minutes.";
    return false;
  }

  focusMinutes = Math.floor(newFocus);
  breakMinutes = Math.floor(newBreak);

  customFocusInput.value = focusMinutes;
  customBreakInput.value = breakMinutes;

  if (!isRunning && currentMode === "focus") {
    remainingSeconds = focusMinutes * 60;
    updateTimerDisplay();
  }

  sessionMessage.textContent = "";
  return true;
}

// Load tasks from the main dashboard.
function populateTasks() {
  const allTasks = loadData(TASKS_KEY);
  const selectedSubject = subjectSelect.value;
  const previousTask = taskSelect.value;

  taskSelect.innerHTML = "";

  const generalOption = document.createElement("option");
  generalOption.value = "";
  generalOption.textContent = "General study session";
  taskSelect.appendChild(generalOption);

  const matchingTasks = allTasks.filter(
    (task) => task && !task.completed && task.subject === selectedSubject
  );

  matchingTasks.forEach((task) => {
    const option = document.createElement("option");
    option.value = String(task.id);
    option.textContent = task.title;
    taskSelect.appendChild(option);
  });

  if (
    previousTask &&
    matchingTasks.some((task) => String(task.id) === previousTask)
  ) {
    taskSelect.value = previousTask;
  }
}

// Get the selected task, if any.
function getSelectedTask() {
  const taskId = taskSelect.value;

  if (!taskId) return null;

  return (
    loadData(TASKS_KEY).find((task) => task && String(task.id) === taskId) ||
    null
  );
}

// Show today's completed focus sessions.

function updateSessionSummary() {
  const sessions = loadData(SESSIONS_KEY);

  const todaysSessions = sessions.filter(
    (session) => session.date === getToday()
  );

  // Number of completed focus sessions today
  sessionsCount.textContent = todaysSessions.length;

  // Add up the minutes from completed focus sessions
  const totalMinutes = todaysSessions.reduce((total, session) => {
    return total + (Number(session.minutes) || 0);
  }, 0);

  focusedTime.textContent = `${totalMinutes} min`;

  // Display today's session history
  sessionHistory.innerHTML = "";

  if (todaysSessions.length === 0) {
    const item = document.createElement("li");
    item.textContent =
      "No sessions completed yet. Your progress will appear here.";
    sessionHistory.appendChild(item);
    return;
  }

  todaysSessions
    .slice()
    .reverse()
    .forEach((session) => {
      const item = document.createElement("li");
      const title = document.createElement("strong");
      const description = document.createElement("p");

      title.textContent = session.subject || "Study session";

      const details = [
        `${session.minutes} minutes`,
        session.goal || "Study session",
        session.taskTitle || "",
      ].filter(Boolean);

      description.textContent = details.join(" · ");

      item.appendChild(title);
      item.appendChild(description);
      sessionHistory.appendChild(item);
    });
}

// Update the timer mode and message.
function setMode(mode) {
  currentMode = mode;

  if (mode === "focus") {
    remainingSeconds = focusMinutes * 60;
    timerMode.textContent = "FOCUS SESSION";
    timerMessage.textContent = "Time to concentrate.";
    startButton.textContent = "Start Focus";
  } else {
    remainingSeconds = breakMinutes * 60;
    timerMode.textContent = "BREAK TIME";
    timerMessage.textContent = "Take a short, refreshing break.";
    startButton.textContent = "Start Break";
  }

  updateTimerDisplay();
}

// Enable or disable controls while the timer runs.
function updateControls() {
  startButton.disabled = isRunning;
  pauseButton.disabled = !isRunning;
  resetButton.disabled = false;

  subjectSelect.disabled = isRunning;
  taskSelect.disabled = isRunning;
  goalInput.disabled = isRunning;

  customFocusInput.disabled = isRunning;
  customBreakInput.disabled = isRunning;

  durationButtons.forEach((button) => {
    button.disabled = isRunning;
  });
}

// Record a completed focus session.
function recordFocusSession() {
  const sessions = loadData(SESSIONS_KEY);
  const selectedTask = getSelectedTask();

  const session = {
    id: Date.now(),
    date: getToday(),
    subject: subjectSelect.value,
    taskId: selectedTask ? selectedTask.id : null,
    taskTitle: selectedTask ? selectedTask.title : "",
    goal: goalInput.value.trim(),
    minutes: focusMinutes,
    completedAt: new Date().toISOString(),
  };

  sessions.push(session);
  saveSessions(sessions);
  updateSessionSummary();
}

// What happens when a timer reaches zero.
function finishTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;

  if (currentMode === "focus") {
    recordFocusSession();

    sessionMessage.textContent =
      "Focus session complete! Your progress has been saved.";

    setMode("break");
  } else {
    sessionMessage.textContent =
      "Break finished. You're ready for another focus session!";

    setMode("focus");
  }

  updateControls();
}

// Start or resume the timer.
function startTimer() {
  if (isRunning) return;

  if (currentMode === "focus" && !updateDurations()) {
    return;
  }

  sessionMessage.textContent = "";
  isRunning = true;
  updateControls();

  timerInterval = setInterval(() => {
    if (remainingSeconds > 0) {
      remainingSeconds--;
      updateTimerDisplay();
    }

    if (remainingSeconds <= 0) {
      finishTimer();
    }
  }, 1000);
}

// Pause the timer.
function pauseTimer() {
  if (!isRunning) return;

  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;

  timerMessage.textContent = "Timer paused. Resume when ready.";
  sessionMessage.textContent = "Your timer is paused.";
  updateControls();
}

// Reset the timer to the focus duration.
function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;

  updateDurations();
  setMode("focus");

  timerMessage.textContent = "Ready when you are.";
  sessionMessage.textContent = "Timer reset.";
  updateControls();
}

// Handle the preset timer buttons.
durationButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (isRunning) return;

    durationButtons.forEach((option) => {
      option.classList.remove("active");
    });

    button.classList.add("active");

    customFocusInput.value = button.dataset.focus;
    customBreakInput.value = button.dataset.break;

    updateDurations();
    setMode("focus");
    timerMessage.textContent = "Ready when you are.";
  });
});

// Custom timer values.
customFocusInput.addEventListener("change", () => {
  if (isRunning) return;

  if (updateDurations()) {
    durationButtons.forEach((button) => {
      const matches =
        Number(button.dataset.focus) === focusMinutes &&
        Number(button.dataset.break) === breakMinutes;

      button.classList.toggle("active", matches);
    });
  }
});

customBreakInput.addEventListener("change", () => {
  if (isRunning) return;

  if (updateDurations()) {
    durationButtons.forEach((button) => {
      const matches =
        Number(button.dataset.focus) === focusMinutes &&
        Number(button.dataset.break) === breakMinutes;

      button.classList.toggle("active", matches);
    });
  }
});

// Update available tasks when the subject changes.
subjectSelect.addEventListener("change", populateTasks);

// Timer controls.
startButton.addEventListener("click", startTimer);
pauseButton.addEventListener("click", pauseTimer);
resetButton.addEventListener("click", resetTimer);

// Initialize the page.
populateTasks();
updateSessionSummary();
setMode("focus");
updateControls();
