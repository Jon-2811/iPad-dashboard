// ===== 基本設定 =====
const CONFIG = {
  // 背景画像。好きな画像を background.jpg という名前で置くと反映される。
  // 例: "images/my-photo.jpg" のようなパスでもOK。
  backgroundImage: "background.jpg",

  // 背景画像の濃さ。0.35〜0.70くらいがおすすめ。
  backgroundOpacity: 0.58,

  // 背景ぼかし。文字を読みやすくしたいなら 2〜5。
  backgroundBlurPx: 2,

  // 山形市の緯度経度。変更したい場合はここを変える。
  latitude: 38.2404,
  longitude: 140.3633,
  locationName: "山形市",

  // 国試予定日。正式日程が出たら変更。
  examDate: "2027-02-07T00:00:00+09:00",

  // カレンダー読み込み
  calendarJsonUrl: "calendar.json",

  // ポモドーロ設定
  pomodoro: {
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    roundsBeforeLongBreak: 4
  }
};

// ===== 背景画像 =====
function applyBackground() {
  const bg = document.getElementById("backgroundLayer");
  bg.style.setProperty("--dashboard-bg", `url("${CONFIG.backgroundImage}")`);
  bg.style.opacity = CONFIG.backgroundOpacity;
  bg.style.filter = `blur(${CONFIG.backgroundBlurPx}px) saturate(0.9)`;
}

applyBackground();

// ===== 時計 =====
function updateClock() {
  const now = new Date();

  const clock = now.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const date = now.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  });

  document.getElementById("clock").textContent = clock;
  document.getElementById("date").textContent = date;
}

setInterval(updateClock, 1000);
updateClock();

// ===== 国試カウントダウン =====
function updateExamCountdown() {
  const today = new Date();
  const exam = new Date(CONFIG.examDate);
  const diff = exam - today;
  const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  document.getElementById("examDays").textContent = days;
}

updateExamCountdown();
setInterval(updateExamCountdown, 60 * 60 * 1000);

// ===== 天気 =====
function weatherCodeToText(code) {
  const map = {
    0: "快晴",
    1: "晴れ",
    2: "一部くもり",
    3: "くもり",
    45: "霧",
    48: "霧氷",
    51: "弱い霧雨",
    53: "霧雨",
    55: "強い霧雨",
    61: "弱い雨",
    63: "雨",
    65: "強い雨",
    71: "弱い雪",
    73: "雪",
    75: "強い雪",
    80: "にわか雨",
    81: "強いにわか雨",
    82: "激しいにわか雨",
    95: "雷雨"
  };
  return map[code] ?? "不明";
}

async function loadWeather() {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${CONFIG.latitude}&longitude=${CONFIG.longitude}&current=temperature_2m,weather_code&timezone=Asia%2FTokyo`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("weather fetch failed");
    const data = await res.json();

    const temp = Math.round(data.current.temperature_2m);
    const text = weatherCodeToText(data.current.weather_code);

    document.getElementById("weatherMain").textContent = `${temp}℃ / ${text}`;
    document.getElementById("weatherSub").textContent = `${CONFIG.locationName} / Open-Meteo`;
  } catch (e) {
    document.getElementById("weatherMain").textContent = "取得失敗";
    document.getElementById("weatherSub").textContent = "ネット接続またはAPIを確認";
  }
}

loadWeather();
setInterval(loadWeather, 30 * 60 * 1000);

// ===== カレンダー簡易表示 =====
function isToday(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

async function loadSchedule() {
  const list = document.getElementById("scheduleList");

  try {
    const res = await fetch(CONFIG.calendarJsonUrl, { cache: "no-store" });
    if (!res.ok) throw new Error("calendar fetch failed");
    const events = await res.json();

    const todaysEvents = events
      .filter(ev => isToday(ev.start))
      .sort((a, b) => new Date(a.start) - new Date(b.start));

    if (todaysEvents.length === 0) {
      list.innerHTML = `<div class="empty">今日の予定はありません</div>`;
      return;
    }

    list.innerHTML = todaysEvents.map(ev => `
      <div class="event">
        <div class="event-time">${formatTime(ev.start)}</div>
        <div class="event-title">${ev.title}</div>
      </div>
    `).join("");
  } catch (e) {
    list.innerHTML = `<div class="empty">calendar.json を読み込めませんでした</div>`;
  }
}

loadSchedule();
setInterval(loadSchedule, 5 * 60 * 1000);

// ===== 共通アラーム =====
let audioCtx = null;

function beep() {
  // iPadではユーザー操作後でないと音が鳴らないことがある
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = 880;
  gain.gain.value = 0.13;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  setTimeout(() => osc.stop(), 600);
}

function showAlarm(title, text) {
  document.getElementById("alarmTitle").textContent = title;
  document.getElementById("alarmText").textContent = text;
  document.getElementById("alarmModal").classList.remove("hidden");
  beep();
  setTimeout(beep, 800);
  setTimeout(beep, 1600);
}

document.getElementById("alarmStop").addEventListener("click", () => {
  document.getElementById("alarmModal").classList.add("hidden");
});

// ===== 通常タイマー =====
let timerSeconds = 10 * 60;
let timerInitial = 10 * 60;
let timerRunning = false;
let timerInterval = null;

function renderTimer() {
  const m = String(Math.floor(timerSeconds / 60)).padStart(2, "0");
  const s = String(timerSeconds % 60).padStart(2, "0");
  document.getElementById("timerDisplay").textContent = `${m}:${s}`;
}

function startTimer() {
  if (timerRunning) return;

  timerRunning = true;
  document.getElementById("timerStart").textContent = "一時停止";

  timerInterval = setInterval(() => {
    timerSeconds -= 1;
    renderTimer();

    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerSeconds = 0;
      renderTimer();
      showAlarm("通常タイマー終了", "時間になりました。");
      document.getElementById("timerStart").textContent = "開始";
    }
  }, 1000);
}

function pauseTimer() {
  timerRunning = false;
  clearInterval(timerInterval);
  document.getElementById("timerStart").textContent = "開始";
}

document.querySelectorAll("button[data-min]").forEach(btn => {
  btn.addEventListener("click", () => {
    timerInitial = Number(btn.dataset.min) * 60;
    timerSeconds = timerInitial;
    pauseTimer();
    renderTimer();
  });
});

document.getElementById("timerStart").addEventListener("click", async () => {
  if (audioCtx?.state === "suspended") await audioCtx.resume();
  if (timerRunning) pauseTimer();
  else startTimer();
});

document.getElementById("timerReset").addEventListener("click", () => {
  pauseTimer();
  timerSeconds = timerInitial;
  renderTimer();
});

renderTimer();

// ===== ポモドーロタイマー =====
const POMO_MODE = {
  WORK: "work",
  SHORT_BREAK: "short_break",
  LONG_BREAK: "long_break"
};

let pomoMode = POMO_MODE.WORK;
let pomoCompletedWorkRounds = 0;
let pomoSeconds = CONFIG.pomodoro.workMinutes * 60;
let pomoRunning = false;
let pomoInterval = null;

function getPomoModeLabel() {
  if (pomoMode === POMO_MODE.WORK) return "作業";
  if (pomoMode === POMO_MODE.SHORT_BREAK) return "休憩";
  return "長めの休憩";
}

function getPomoModeMinutes(mode = pomoMode) {
  if (mode === POMO_MODE.WORK) return CONFIG.pomodoro.workMinutes;
  if (mode === POMO_MODE.SHORT_BREAK) return CONFIG.pomodoro.shortBreakMinutes;
  return CONFIG.pomodoro.longBreakMinutes;
}

function renderPomodoro() {
  const m = String(Math.floor(pomoSeconds / 60)).padStart(2, "0");
  const s = String(pomoSeconds % 60).padStart(2, "0");

  document.getElementById("pomoMode").textContent = getPomoModeLabel();
  document.getElementById("pomoDisplay").textContent = `${m}:${s}`;

  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`pomoRound${i}`);
    if (i <= pomoCompletedWorkRounds) el.classList.add("done");
    else el.classList.remove("done");
  }
}

function setPomoMode(nextMode) {
  pomoMode = nextMode;
  pomoSeconds = getPomoModeMinutes(nextMode) * 60;
  renderPomodoro();
}

function pausePomodoro() {
  pomoRunning = false;
  clearInterval(pomoInterval);
  document.getElementById("pomoStart").textContent = "開始";
}

function advancePomodoro(showNotice = true) {
  pausePomodoro();

  if (pomoMode === POMO_MODE.WORK) {
    pomoCompletedWorkRounds += 1;

    if (pomoCompletedWorkRounds >= CONFIG.pomodoro.roundsBeforeLongBreak) {
      setPomoMode(POMO_MODE.LONG_BREAK);
      if (showNotice) showAlarm("作業終了", "4セット完了。長めに休憩しましょう。");
    } else {
      setPomoMode(POMO_MODE.SHORT_BREAK);
      if (showNotice) showAlarm("作業終了", "5分休憩しましょう。");
    }
  } else {
    if (pomoMode === POMO_MODE.LONG_BREAK) {
      pomoCompletedWorkRounds = 0;
    }
    setPomoMode(POMO_MODE.WORK);
    if (showNotice) showAlarm("休憩終了", "次の作業を始めましょう。");
  }
}

function startPomodoro() {
  if (pomoRunning) return;

  pomoRunning = true;
  document.getElementById("pomoStart").textContent = "一時停止";

  pomoInterval = setInterval(() => {
    pomoSeconds -= 1;
    renderPomodoro();

    if (pomoSeconds <= 0) {
      pomoSeconds = 0;
      renderPomodoro();
      advancePomodoro(true);
    }
  }, 1000);
}

document.getElementById("pomoStart").addEventListener("click", async () => {
  if (audioCtx?.state === "suspended") await audioCtx.resume();
  if (pomoRunning) pausePomodoro();
  else startPomodoro();
});

document.getElementById("pomoSkip").addEventListener("click", () => {
  advancePomodoro(false);
});

document.getElementById("pomoReset").addEventListener("click", () => {
  pausePomodoro();
  pomoMode = POMO_MODE.WORK;
  pomoCompletedWorkRounds = 0;
  pomoSeconds = CONFIG.pomodoro.workMinutes * 60;
  renderPomodoro();
});

renderPomodoro();
