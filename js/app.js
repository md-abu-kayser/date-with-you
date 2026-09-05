// ---------- Application State ----------
const AppState = {
  step: 1,
  food: null,
  date: null,
  time: null,
  calMonth: 8, // August (0-indexed)
  calYear: 2026,
};

// ---------- DOM References ----------
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const pages = {
  1: $("#page1"),
  2: $("#page2"),
  3: $("#page3"),
  4: $("#page4"),
};
const dots = $$(".progress-dots .dot");
const foodItems = $$(".food-item");
const foodNextBtn = $("#foodNextBtn");
const foodError = $("#foodError");
const dateSetBtn = $("#dateSetBtn");
const dateError = $("#dateError");
const calendarGrid = $("#calendarGrid");
const calMonthYear = $("#calMonthYear");
const calPrev = $("#calPrev");
const calNext = $("#calNext");
const timeGrid = $("#timeGrid");
const confirmDate = $("#confirmDate");
const confirmTime = $("#confirmTime");
const confirmFood = $("#confirmFood");
const resetBtn = $("#resetBtn");
const noBtn = $("#noBtn");
const noMessage = $("#noMessage");
const yesBtn = $("#yesBtn");
const confettiOverlay = $("#confettiOverlay");
const heartsContainer = $("#heartsContainer");

// ---------- Constants ----------
const TIME_SLOTS = [
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "6:30 PM",
  "7:00 PM",
  "7:30 PM",
  "8:00 PM",
  "8:30 PM",
];

const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// ---------- Floating Hearts Initialization ----------
function initFloatingHearts() {
  const emojis = ["❤️", "💕", "💖", "✨", "🌸", "💗", "🥰"];
  for (let i = 0; i < 18; i++) {
    const el = document.createElement("span");
    el.className = "heart-float";
    el.textContent = emojis[i % emojis.length];
    el.style.left = Math.random() * 100 + "%";
    el.style.fontSize = 0.8 + Math.random() * 1.2 + "rem";
    el.style.animationDuration = 8 + Math.random() * 12 + "s";
    el.style.animationDelay = Math.random() * 10 + "s";
    heartsContainer.appendChild(el);
  }
}

// ---------- Page Navigation ----------
function goToStep(step) {
  AppState.step = step;
  Object.keys(pages).forEach((k) => {
    pages[k].classList.toggle("active", parseInt(k) === step);
  });
  dots.forEach((dot, idx) => {
    const num = idx + 1;
    dot.classList.toggle("active", num === step);
    dot.classList.toggle("done", num < step);
  });
  // Scroll to top of card ---> mobile friendly
  const card = $("#appCard");
  if (card) card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  // Trigger confetti on final step
  if (step === 4) {
    launchConfetti();
  }
}

// ---------- Food Selection ----------
foodItems.forEach((item) => {
  item.addEventListener("click", () => {
    foodItems.forEach((el) => el.classList.remove("selected"));
    item.classList.add("selected");
    AppState.food = item.dataset.food;
    foodNextBtn.disabled = false;
    foodError.classList.add("hidden");
  });
});

foodNextBtn.addEventListener("click", () => {
  if (!AppState.food) {
    foodError.classList.remove("hidden");
    return;
  }
  goToStep(3);
  renderCalendar();
  renderTimes();
});

// ---------- Calendar ----------
function renderCalendar() {
  const { calMonth, calYear } = AppState;
  calMonthYear.textContent = `${MONTHS[calMonth]} ${calYear}`;

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  let html = "";
  // Day labels
  DAYS_SHORT.forEach((d) => {
    html += `<div class="day-label">${d}</div>`;
  });
  // Empty cells before the first day
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="day empty"></div>';
  }
  // Day numbers
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const isPast = dateStr < todayStr;
    const isSelected = AppState.date === dateStr;
    const classes = `day${isPast ? " empty" : ""}${isSelected ? " selected" : ""}`;
    const clickable = !isPast ? `data-date="${dateStr}"` : "";
    html += `<div class="${classes}" ${clickable}>${d}</div>`;
  }

  calendarGrid.innerHTML = html;

  // Click handlers for selectable days
  calendarGrid.querySelectorAll(".day:not(.empty)").forEach((el) => {
    el.addEventListener("click", () => {
      const dateStr = el.dataset.date;
      if (!dateStr) return;
      calendarGrid
        .querySelectorAll(".day")
        .forEach((d) => d.classList.remove("selected"));
      el.classList.add("selected");
      AppState.date = dateStr;
      checkDateTime();
    });
  });
}

calPrev.addEventListener("click", () => {
  if (AppState.calMonth === 0) {
    AppState.calMonth = 11;
    AppState.calYear--;
  } else {
    AppState.calMonth--;
  }
  renderCalendar();
});

calNext.addEventListener("click", () => {
  if (AppState.calMonth === 11) {
    AppState.calMonth = 0;
    AppState.calYear++;
  } else {
    AppState.calMonth++;
  }
  renderCalendar();
});

// ---------- Time Selection ----------
function renderTimes() {
  let html = "";
  TIME_SLOTS.forEach((t) => {
    const selected = AppState.time === t ? "selected" : "";
    html += `<div class="time-item ${selected}" data-time="${t}">${t}</div>`;
  });
  timeGrid.innerHTML = html;

  timeGrid.querySelectorAll(".time-item").forEach((el) => {
    el.addEventListener("click", () => {
      timeGrid
        .querySelectorAll(".time-item")
        .forEach((e) => e.classList.remove("selected"));
      el.classList.add("selected");
      AppState.time = el.dataset.time;
      checkDateTime();
    });
  });
}

function checkDateTime() {
  if (AppState.date && AppState.time) {
    dateSetBtn.disabled = false;
    dateError.classList.add("hidden");
  } else {
    dateSetBtn.disabled = true;
  }
}

dateSetBtn.addEventListener("click", () => {
  if (!AppState.date || !AppState.time) {
    dateError.classList.remove("hidden");
    return;
  }
  // Build confirmation details
  const d = new Date(AppState.date + "T00:00:00");
  const dayName = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][d.getDay()];
  const monthName = MONTHS[d.getMonth()];
  const dayNum = d.getDate();
  confirmDate.textContent = `${dayName}, ${monthName} ${dayNum}`;
  confirmTime.textContent = AppState.time;
  confirmFood.textContent = AppState.food || "Pasta";
  goToStep(4);
});

// ---------- Confetti Animation ----------
function launchConfetti() {
  const container = confettiOverlay;
  container.innerHTML = "";
  const colors = [
    "#ff6b9d",
    "#ffd700",
    "#8b5cf6",
    "#ff4d6d",
    "#fbbf24",
    "#34d399",
    "#f472b6",
    "#60a5fa",
  ];
  const emojis = ["❤️", "💕", "✨", "🎉", "🌸", "💖", "🥳", "🎊"];

  for (let i = 0; i < 80; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    const isEmoji = Math.random() > 0.5;
    if (isEmoji) {
      piece.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      piece.style.fontSize = 0.8 + Math.random() * 1.2 + "rem";
      piece.style.width = "auto";
      piece.style.height = "auto";
      piece.style.background = "transparent";
    } else {
      piece.style.background =
        colors[Math.floor(Math.random() * colors.length)];
      piece.style.width = 6 + Math.random() * 10 + "px";
      piece.style.height = 6 + Math.random() * 10 + "px";
      piece.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
    }
    piece.style.left = Math.random() * 100 + "%";
    piece.style.top = "-20px";
    piece.style.animationDuration = 1.5 + Math.random() * 2.5 + "s";
    piece.style.animationDelay = Math.random() * 1.5 + "s";
    piece.style.opacity = 0.7 + Math.random() * 0.3;
    container.appendChild(piece);
  }

  setTimeout(() => {
    container.innerHTML = "";
  }, 5000);
}

// ---------- Reset Everything ----------
function resetApp() {
  AppState.food = null;
  AppState.date = null;
  AppState.time = null;
  AppState.calMonth = 5;
  AppState.calYear = 2026;
  foodItems.forEach((el) => el.classList.remove("selected"));
  foodNextBtn.disabled = true;
  foodError.classList.add("hidden");
  dateSetBtn.disabled = true;
  dateError.classList.add("hidden");
  confettiOverlay.innerHTML = "";
  goToStep(1);
  renderCalendar();
  renderTimes();
}

resetBtn.addEventListener("click", resetApp);

// ---------- Playful "NO" Button ----------
let noClickCount = 0;
const noBtnWrapper = noBtn.closest(".btn-no-wrapper");
const canHover = window.matchMedia("(hover: hover)").matches;

noBtn.addEventListener("mouseenter", () => {
  if (!noBtnWrapper || !canHover) return;
  const maxX = 120;
  const maxY = 60;
  const dx = (Math.random() - 0.5) * maxX * 2;
  const dy = (Math.random() - 0.5) * maxY * 2;
  noBtnWrapper.style.transform = `translate(${dx}px, ${dy}px)`;
  noBtnWrapper.style.transition =
    "transform 0.15s cubic-bezier(0.23, 1, 0.32, 1)";
});

noBtn.addEventListener("click", (e) => {
  e.preventDefault();
  noClickCount++;
  noMessage.classList.remove("hidden");
  const messages = [
    "🥺 are you sure? try again... 💕",
    "😤 i said YES only!",
    "💀 you can't escape!",
    "🥰 just say YES already!",
    "💗 i'll keep asking...",
    "❤️ YES is the only answer!",
  ];
  noMessage.textContent =
    messages[Math.min(noClickCount - 1, messages.length - 1)];

  if (noClickCount > 3) {
    noBtn.style.transform = "scale(0.7)";
    noBtn.style.opacity = "0.3";
    setTimeout(() => {
      noBtn.style.transform = "scale(1)";
      noBtn.style.opacity = "1";
    }, 600);
  }
  if (noClickCount > 6) {
    noMessage.textContent = "💖 okay i'm clicking YES for you! 💖";
    setTimeout(() => {
      yesBtn.click();
    }, 400);
  }
});

// ---------- YES Button ----------
yesBtn.addEventListener("click", () => {
  goToStep(2);
});

// ---------- Keyboard Navigation ----------
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const step = AppState.step;
    if (step === 1) {
      yesBtn.click();
    } else if (step === 2) {
      if (!foodNextBtn.disabled) foodNextBtn.click();
    } else if (step === 3) {
      if (!dateSetBtn.disabled) dateSetBtn.click();
    }
  }
});

// Mobile browser chrome (address bar) resizing changes 100vh unreliably,
// so this custom property is used as a fallback ahead of `dvh` support
// (see the --vh usage in styles.css).
function adjustViewport() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}
adjustViewport();
window.addEventListener("resize", adjustViewport);
window.addEventListener("orientationchange", () => {
  // Fire after the browser finishes rotating and reports the new size.
  setTimeout(adjustViewport, 150);
});

// ---------- Final Initialization ----------
initFloatingHearts();
renderCalendar();
renderTimes();
goToStep(1);

console.log("💕 Made with love for someone special ✨");
