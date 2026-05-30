// ===== 基本設定 =====
const CONFIG = {
  defaultBackgroundImage: "background.jpg",
  defaultBackgroundOpacity: 0.72,
  defaultBackgroundBlurPx: 2,

  latitude: 38.2404,
  longitude: 140.3633,
  locationName: "山形市",

  defaultExamDate: "2027-02-07",
  fallbackCalendarJsonUrl: "calendar.json",

  pomodoro: {
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    roundsBeforeLongBreak: 4
  }
};

const LS = {
  BG_IMAGES: "dashboard.bgImagesDataUrls",
  BG_OPACITY: "dashboard.bgOpacity",
  BG_BLUR: "dashboard.bgBlur",
  BG_MODE: "dashboard.bgMode",
  BG_ROTATE_MINUTES: "dashboard.bgRotateMinutes",
  CALENDAR_API_URL: "dashboard.calendarApiUrl",
  EXAM_DATE: "dashboard.examDate"
};

// ===== ページ切替 =====
let currentPage = 0;
const pages = Array.from(document.querySelectorAll(".page"));
const navBtns = Array.from(document.querySelectorAll(".nav-btn"));
const dots = Array.from(document.querySelectorAll(".dot"));

function showPage(index) {
  if (index < 0) currentPage = pages.length - 1;
  else if (index >= pages.length) currentPage = 0;
  else currentPage = index;

  pages.forEach((p, i) => p.classList.toggle("active", i === currentPage));
  navBtns.forEach((b, i) => b.classList.toggle("active", i === currentPage));
  dots.forEach((d, i) => d.classList.toggle("active", i === currentPage));
  applyBackground();
}

navBtns.forEach(btn => {
  btn.addEventListener("click", () => showPage(Number(btn.dataset.page)));
});

let touchStartX = 0;
document.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].clientX;
}, { passive: true });

document.addEventListener("touchend", (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 70) {
    if (dx < 0) showPage(currentPage + 1);
    else showPage(currentPage - 1);
  }
}, { passive: true });

showPage(0);

// ===== 背景画像 =====
function getStoredImages() {
  try {
    return JSON.parse(localStorage.getItem(LS.BG_IMAGES) || "[]");
  } catch {
    return [];
  }
}

function getBackgroundImageForMode() {
  const images = getStoredImages();
  if (images.length === 0) return `url("${CONFIG.defaultBackgroundImage}")`;

  const mode = localStorage.getItem(LS.BG_MODE) || "same";
  const rotateMin = Number(localStorage.getItem(LS.BG_ROTATE_MINUTES) || 5);

  let index = 0;

  if (mode === "page") {
    index = currentPage % images.length;
  } else if (mode === "time") {
    index = Math.floor(Date.now() / (rotateMin * 60 * 1000)) % images.length;
  }

  return `url("${images[index]}")`;
}

function applyBackground() {
  const bg = document.getElementById("backgroundLayer");
  const opacity = localStorage.getItem(LS.BG_OPACITY) ?? CONFIG.defaultBackgroundOpacity;
  const blur = localStorage.getItem(LS.BG_BLUR) ?? CONFIG.defaultBackgroundBlurPx;

  bg.style.setProperty("--dashboard-bg", getBackgroundImageForMode());
  bg.style.opacity = opacity;
  bg.style.filter = `blur(${blur}px) saturate(0.9)`;

  document.getElementById("bgOpacity").value = opacity;
  document.getElementById("bgBlur").value = blur;
  document.getElementById("bgMode").value = localStorage.getItem(LS.BG_MODE) || "same";
  document.getElementById("bgRotateMinutes").value = localStorage.getItem(LS.BG_ROTATE_MINUTES) || "5";
}

function resizeImageToDataUrl(file, maxWidth = 1800, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

document.getElementById("bgFile").addEventListener("change", async (e) => {
  const files = Array.from(e.target.files || []);
  if (files.length === 0) return;

  try {
    const dataUrls = [];
    for (const file of files.slice(0, 6)) {
      dataUrls.push(await resizeImageToDataUrl(file));
    }
    localStorage.setItem(LS.BG_IMAGES, JSON.stringify(dataUrls));
    applyBackground();
    alert(`${dataUrls.length}枚の背景画像を保存しました。`);
  } catch (err) {
    alert("画像の読み込みに失敗しました。枚数を減らすか、別の画像で試してください。");
  }
});

document.getElementById("clearBg").addEventListener("click", () => {
  localStorage.removeItem(LS.BG_IMAGES);
  applyBackground();
});

document.getElementById("bgOpacity").addEventListener("input", (e) => {
  localStorage.setItem(LS.BG_OPACITY, e.target.value);
  applyBackground();
});

document.getElementById("bgBlur").addEventListener("input", (e) => {
  localStorage.setItem(LS.BG_BLUR, e.target.value);
  applyBackground();
});

document.getElementById("bgMode").addEventListener("change", (e) => {
  localStorage.setItem(LS.BG_MODE, e.target.value);
  applyBackground();
});

document.getElementById("bgRotateMinutes").addEventListener("change", (e) => {
  localStorage.setItem(LS.BG_ROTATE_MINUTES, e.target.value);
  applyBackground();
});

applyBackground();
setInterval(applyBackground, 60 * 1000);

// ===== 時計 =====
function updateClock() {
  const now = new Date();

  document.getElementById("clock").textContent = now.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  document.getElementById("date").textContent = now.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  });
}

setInterval(updateClock, 1000);
updateClock();

// ===== 国試カウントダウン =====
function getExamDate() {
  return localStorage.getItem(LS.EXAM_DATE) || CONFIG.defaultExamDate;
}

function updateExamCountdown() {
  const today = new Date();
  const exam = new Date(`${getExamDate()}T00:00:00+09:00`);
  const diff = exam - today;
  const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  document.getElementById("examDays").textContent = days;
  document.getElementById("examDateInput").value = getExamDate();
}

document.getElementById("saveExamDate").addEventListener("click", () => {
  const value = document.getElementById("examDateInput").value;
  if (!value) return;
  localStorage.setItem(LS.EXAM_DATE, value);
  updateExamCountdown();
});

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
    66: "凍雨",
    67: "強い凍雨",
    71: "弱い雪",
    73: "雪",
    75: "強い雪",
    77: "雪粒",
    80: "にわか雨",
    81: "強いにわか雨",
    82: "激しいにわか雨",
    85: "にわか雪",
    86: "強いにわか雪",
    95: "雷雨",
    96: "雷雨と雹",
    99: "激しい雷雨と雹"
  };
  return map[code] ?? "不明";
}

function weatherCodeToIcon(code) {
  if ([0, 1].includes(code)) return "☀️";
  if ([2].includes(code)) return "🌤️";
  if ([3].includes(code)) return "☁️";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌡️";
}

function makeUmbrellaAdvice(maxPop, totalRainMm, currentCode) {
  const rainyNow = [51,53,55,61,63,65,66,67,80,81,82,95,96,99].includes(currentCode);

  if (rainyNow || totalRainMm >= 5 || maxPop >= 60) {
    return {
      text: "☂️ 傘を持って行く",
      detail: `今後12時間の最大降水確率 ${maxPop}% / 予想降水量 ${totalRainMm.toFixed(1)}mm`
    };
  }

  if (totalRainMm >= 1 || maxPop >= 35) {
    return {
      text: "🌂 折りたたみ傘が無難",
      detail: `今後12時間の最大降水確率 ${maxPop}% / 予想降水量 ${totalRainMm.toFixed(1)}mm`
    };
  }

  return {
    text: "傘なしでよさそう",
    detail: `今後12時間の最大降水確率 ${maxPop}% / 予想降水量 ${totalRainMm.toFixed(1)}mm`
  };
}

async function loadWeather() {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${CONFIG.latitude}&longitude=${CONFIG.longitude}&current=temperature_2m,weather_code&hourly=precipitation_probability,precipitation&forecast_days=2&timezone=Asia%2FTokyo`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("weather fetch failed");
    const data = await res.json();

    const temp = Math.round(data.current.temperature_2m);
    const code = data.current.weather_code;
    const text = weatherCodeToText(code);
    const icon = weatherCodeToIcon(code);

    const now = new Date();
    const hours = data.hourly.time.map(t => new Date(t));
    const targetIndexes = hours
      .map((d, i) => ({ d, i }))
      .filter(x => x.d >= now && x.d <= new Date(now.getTime() + 12 * 60 * 60 * 1000))
      .map(x => x.i);

    const pops = targetIndexes.map(i => data.hourly.precipitation_probability[i] ?? 0);
    const rains = targetIndexes.map(i => data.hourly.precipitation[i] ?? 0);

    const maxPop = pops.length ? Math.max(...pops) : 0;
    const totalRainMm = rains.reduce((a, b) => a + b, 0);

    const advice = makeUmbrellaAdvice(maxPop, totalRainMm, code);

    document.getElementById("weatherMain").textContent = `${temp}℃ / ${text}`;
    document.getElementById("weatherIcon").textContent = icon;
    document.getElementById("umbrellaAdvice").textContent = advice.text;
    document.getElementById("weatherDetail").textContent = advice.detail;
    document.getElementById("weatherSub").textContent = `${CONFIG.locationName} / Open-Meteo`;
  } catch (e) {
    document.getElementById("weatherMain").textContent = "取得失敗";
    document.getElementById("weatherIcon").textContent = "⚠️";
    document.getElementById("umbrellaAdvice").textContent = "傘判断できません";
    document.getElementById("weatherDetail").textContent = "ネット接続またはAPIを確認";
    document.getElementById("weatherSub").textContent = "天気取得エラー";
  }
}

loadWeather();
setInterval(loadWeather, 30 * 60 * 1000);

// ===== カレンダー表示 =====
function isToday(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

function formatTime(dateStr, allDay) {
  if (allDay) return "終日";
  return new Date(dateStr).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function normalizeEvents(events) {
  if (!Array.isArray(events)) return [];
  return events.map(ev => ({
    title: ev.title || ev.summary || "無題",
    start: ev.start || ev.startTime,
    end: ev.end || ev.endTime,
    allDay: Boolean(ev.allDay)
  })).filter(ev => ev.start);
}

async function fetchCalendarEvents() {
  const apiUrl = localStorage.getItem(LS.CALENDAR_API_URL);

  if (apiUrl) {
    const res = await fetch(apiUrl, { cache: "no-store" });
    if (!res.ok) throw new Error("Google Calendar API fetch failed");
    const data = await res.json();
    return normalizeEvents(data.events || data);
  }

  const res = await fetch(CONFIG.fallbackCalendarJsonUrl, { cache: "no-store" });
  if (!res.ok) throw new Error("calendar.json fetch failed");
  const data = await res.json();
  return normalizeEvents(data);
}

async function loadSchedule() {
  const list = document.getElementById("scheduleList");
  const status = document.getElementById("scheduleStatus");

  try {
    const events = await fetchCalendarEvents();

    const todaysEvents = events
      .filter(ev => isToday(ev.start))
      .sort((a, b) => new Date(a.start) - new Date(b.start));

    const usingGoogle = Boolean(localStorage.getItem(LS.CALENDAR_API_URL));
    status.textContent = usingGoogle ? "Googleカレンダーから取得" : "calendar.json から取得";

    if (todaysEvents.length === 0) {
      list.innerHTML = `<div class="empty">今日の予定はありません</div>`;
      return;
    }

    list.innerHTML = todaysEvents.map(ev => `
      <div class="event">
        <div class="event-time">${formatTime(ev.start, ev.allDay)}</div>
        <div class="event-title">${escapeHtml(ev.title)}</div>
      </div>
    `).join("");
  } catch (e) {
    status.textContent = "読み込み失敗";
    list.innerHTML = `<div class="empty">SettingsのURL、またはcalendar.jsonを確認してください</div>`;
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (s) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[s]));
}

const calendarInput = document.getElementById("calendarApiUrl");
calendarInput.value = localStorage.getItem(LS.CALENDAR_API_URL) || "";

document.getElementById("saveCalendarUrl").addEventListener("click", () => {
  const value = calendarInput.value.trim();
  if (!value) {
    localStorage.removeItem(LS.CALENDAR_API_URL);
  } else {
    localStorage.setItem(LS.CALENDAR_API_URL, value);
  }
  loadSchedule();
});

document.getElementById("clearCalendarUrl").addEventListener("click", () => {
  localStorage.removeItem(LS.CALENDAR_API_URL);
  calendarInput.value = "";
  loadSchedule();
});

loadSchedule();
setInterval(loadSchedule, 5 * 60 * 1000);

// ===== 共通アラーム =====
let audioCtx = null;

function ensureAudioContext() {
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone(freq, startTime, duration, gainValue = 0.13) {
  const ctx = ensureAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

function playAlarmSound() {
  const ctx = ensureAudioContext();
  const now = ctx.currentTime;

  // 少し目立つ3音チャイムを3回
  for (let r = 0; r < 3; r++) {
    const offset = r * 1.05;
    playTone(880, now + offset, 0.22);
    playTone(1174, now + offset + 0.24, 0.22);
    playTone(1568, now + offset + 0.48, 0.35);
  }
}

function showAlarm(title, text) {
  document.getElementById("alarmTitle").textContent = title;
  document.getElementById("alarmText").textContent = text;
  document.getElementById("alarmModal").classList.remove("hidden");
  playAlarmSound();

  // 通知APIは許可されている場合のみ使用
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body: text });
  }
}

document.getElementById("alarmStop").addEventListener("click", () => {
  document.getElementById("alarmModal").classList.add("hidden");
});

document.getElementById("testSound").addEventListener("click", async () => {
  ensureAudioContext();
  if ("Notification" in window && Notification.permission === "default") {
    try { await Notification.requestPermission(); } catch {}
  }
  playAlarmSound();
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

  ensureAudioContext();
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

document.getElementById("setCustomTimer").addEventListener("click", () => {
  const minutes = Math.max(0, Math.min(999, Number(document.getElementById("customMinutes").value || 0)));
  const seconds = Math.max(0, Math.min(59, Number(document.getElementById("customSeconds").value || 0)));
  const total = minutes * 60 + seconds;

  if (total <= 0) {
    alert("1秒以上で設定してください。");
    return;
  }

  timerInitial = total;
  timerSeconds = total;
  pauseTimer();
  renderTimer();
});

["customMinutes", "customSeconds"].forEach(id => {
  document.getElementById(id).addEventListener("change", () => {
    const el = document.getElementById(id);
    const max = id === "customSeconds" ? 59 : 999;
    el.value = Math.max(0, Math.min(max, Number(el.value || 0)));
  });
});


document.getElementById("timerStart").addEventListener("click", () => {
  ensureAudioContext();
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
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

  ensureAudioContext();
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

document.getElementById("pomoStart").addEventListener("click", () => {
  ensureAudioContext();
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
  if (pomoRunning) pausePomodoro();
  else startPomodoro();
});

document.getElementById("pomoSkip").addEventListener("click", () => {
  ensureAudioContext();
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
