const subjectSelect = document.getElementById("subject");
const taskSelect= document.getElementById("study-task");
const goalInput= document.getElementById("study-goal");

const customFocusInput = document.getElementById("custom-focus");
const customBreakInput= document.getElementById("custom-break");

const timerDisplay = document.getElementById("timer");
const timerMode = document.getElementById("timer-mode");
const timerMessage= document.getElementById("timer-message");
const sessionMessage= document.getElementById("session-message");

const startButton= document.getElementById("start-button");
const pauseButton= document.getElementById("pause-button");
const resetButton= document.getElementById("reset-button");

const sessionsCount= document.getElementById("sessions-count");
const focusedTime= document.getElementById("focused-time");
const sessionHistory= document.getElementById("session-history");

const durationButtons= document.getElementById(".duration-option");

const TASKS_KEY= "study-tasks";
const SESSIONS_KEY= "focus-sessions";

let timerInterval = null;
let isRunning= false;
let currentMode="focus";
let remainingSeconds= 25 * 60;

