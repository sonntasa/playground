// ── Real data pulled from the main site's .bib files ─────────────────────
const OUTPUTS = [
  { key: "sonntag_language_2026", year: 2026, type: "Article", coauthors: ["Mackenzie", "Schütt", "Sivec", "Oguz", "Weicker", "Dudschig"] },
  { key: "Sonntag25CogSci", year: 2025, type: "Talk", coauthors: ["Mackenzie", "Dudschig"] },
  { key: "Sonntag25TeaP", year: 2025, type: "Talk", coauthors: ["Mackenzie", "Schütt", "Sivec", "Oguz", "Weicker", "Dudschig"] },
  { key: "Mackenzie26TeaP", year: 2026, type: "Workshop", coauthors: ["Mackenzie", "Dudschig"] },
  { key: "Sonntag26TeaP", year: 2026, type: "Talk", coauthors: ["Weicker", "Mackenzie", "Dudschig"] },
  { key: "sonntag_when_2026", year: 2026, type: "Dataset", coauthors: ["Mackenzie", "Oguz", "Weicker", "Dudschig"] },
  { key: "sonntag_language_2025_data", year: 2025, type: "Dataset", coauthors: ["Mackenzie", "Schütt", "Sivec", "Oguz", "Weicker", "Dudschig"] },
  { key: "mackenzie2026anovafun", year: 2026, type: "Software", coauthors: ["Mackenzie", "Dudschig"] },
];

const CONFERENCES = [
  { title: "CogSci 2025 \u2014 Talk", loc: "San Francisco, CA, USA", year: "2025" },
  { title: "TeaP 2025 \u2014 Talk", loc: "Frankfurt, Germany", year: "2025" },
  { title: "TeaP 2026 \u2014 Talk + Workshop (co-organiser)", loc: "T\u00fcbingen, Germany", year: "2026" },
];

// ── Theme toggle (same behavior as main site) ─────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("checkbox");
  const saved = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  toggle.checked = saved === "light";
  toggle.addEventListener("change", () => {
    const next = toggle.checked ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    if (window.__redrawCharts) window.__redrawCharts();
  });

  // ── Tabs ─────────────────────────────────────────────────────────────
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`panel-${btn.dataset.tab}`).classList.add("active");
    });
  });

  initDemo();
  initStats();
});

// ── Negation mouse-tracking demo ──────────────────────────────────────────
function initDemo() {
  const wrap = document.getElementById("trialWrap");
  const canvas = document.getElementById("trailCanvas");
  const ctx = canvas.getContext("2d");
  const startBtn = document.getElementById("startBtn");
  const targetLeft = document.getElementById("targetLeft");
  const targetRight = document.getElementById("targetRight");
  const stimulusText = document.getElementById("stimulusText");
  const trialStatus = document.getElementById("trialStatus");
  const resultsBox = document.getElementById("resultsBox");

  const N_TRIALS = 10;
  let trialIndex = 0;
  let trialTypes = [];
  let results = [];
  let currentTrial = null;
  let tracking = false;
  let path = [];

  function resizeCanvas() {
    canvas.width = wrap.clientWidth;
    canvas.height = wrap.clientHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function buildTrialList() {
    const half = N_TRIALS / 2;
    trialTypes = shuffle([
      ...Array(half).fill("affirmative"),
      ...Array(half).fill("negation"),
    ]);
  }

  function setupTrial() {
    if (trialIndex >= N_TRIALS) return finishSession();

    const type = trialTypes[trialIndex];
    const correctColor = Math.random() < 0.5 ? "red" : "blue";
    const otherColor = correctColor === "red" ? "blue" : "red";
    const swapSides = Math.random() < 0.5;

    // Randomize which side shows which color to avoid motor bias
    const leftColor = swapSides ? "blue" : "red";
    const rightColor = swapSides ? "red" : "blue";
    targetLeft.textContent = leftColor.toUpperCase();
    targetRight.textContent = rightColor.toUpperCase();
    targetLeft.className = "target left " + leftColor;
    targetRight.className = "target right " + rightColor;

    const stimulus = type === "affirmative"
      ? `The square is ${correctColor.toUpperCase()}.`
      : `The square is NOT ${otherColor.toUpperCase()}.`;
    stimulusText.textContent = stimulus;

    currentTrial = { type, correctColor, leftColor, rightColor };
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    trialStatus.textContent = `Trial ${trialIndex + 1} / ${N_TRIALS} — click & hold "start", then drag to your answer`;
    trialStatus.className = "trial-status";
  }

  function pointerPos(e) {
    const rect = wrap.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - rect.left, y: p.clientY - rect.top };
  }

  function startDrag(e) {
    if (!currentTrial) return;
    tracking = true;
    const p = pointerPos(e);
    path = [p];
    e.preventDefault();
  }

  function duringDrag(e) {
    if (!tracking) return;
    const p = pointerPos(e);
    path.push(p);
    drawPath();

    // visual "arming" feedback when hovering a target
    const overLeft = isOver(p, targetLeft);
    const overRight = isOver(p, targetRight);
    targetLeft.classList.toggle("armed", overLeft);
    targetRight.classList.toggle("armed", overRight);
  }

  function isOver(p, el) {
    const wrapRect = wrap.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return (
      p.x + wrapRect.left >= r.left &&
      p.x + wrapRect.left <= r.right &&
      p.y + wrapRect.top >= r.top &&
      p.y + wrapRect.top <= r.bottom
    );
  }

  function endDrag(e) {
    if (!tracking) return;
    tracking = false;
    targetLeft.classList.remove("armed");
    targetRight.classList.remove("armed");
    const p = pointerPos(e.changedTouches ? { touches: e.changedTouches } : e);

    const overLeft = isOver(p, targetLeft);
    const overRight = isOver(p, targetRight);
    let chosenColor = null;
    if (overLeft) chosenColor = currentTrial.leftColor;
    if (overRight) chosenColor = currentTrial.rightColor;

    if (!chosenColor || path.length < 3) {
      trialStatus.textContent = "Didn't land on a button — try that trial again.";
      trialStatus.className = "trial-status incorrect";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const correct = chosenColor === currentTrial.correctColor;
    const curvature = computeCurvature(path);
    results.push({ type: currentTrial.type, correct, curvature });

    trialStatus.textContent = correct ? "Correct!" : "Not quite — that was the other color.";
    trialStatus.className = "trial-status " + (correct ? "correct" : "incorrect");

    trialIndex++;
    setTimeout(setupTrial, 550);
  }

  function computeCurvature(pts) {
    // Max perpendicular distance from the straight line start->end,
    // normalized by the straight-line distance (classic mouse-tracking AUC proxy).
    const start = pts[0];
    const end = pts[pts.length - 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lineLen = Math.hypot(dx, dy) || 1;
    let maxDev = 0;
    for (const p of pts) {
      const num = Math.abs(dy * p.x - dx * p.y + end.x * start.y - end.y * start.x);
      const dev = num / lineLen;
      if (dev > maxDev) maxDev = dev;
    }
    return maxDev / lineLen; // normalized curvature
  }

  function drawPath() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (path.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (const p of path) ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = currentTrial.type === "negation"
      ? getCSSVar("--neg-color")
      : getCSSVar("--aff-color");
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  function getCSSVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function finishSession() {
    stimulusText.textContent = "All done!";
    trialStatus.textContent = "";
    const neg = results.filter((r) => r.type === "negation");
    const aff = results.filter((r) => r.type === "affirmative");
    const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b.curvature, 0) / arr.length : 0;
    const accuracy = results.length ? results.filter((r) => r.correct).length / results.length : 0;

    document.getElementById("affCurve").textContent = avg(aff).toFixed(3);
    document.getElementById("negCurve").textContent = avg(neg).toFixed(3);
    document.getElementById("accuracy").textContent = Math.round(accuracy * 100) + "%";

    const negHigher = avg(neg) > avg(aff);
    document.getElementById("resultsBlurb").textContent = negHigher
      ? "Your negation trials curved more than your affirmative ones — a small taste of what I study for a living: negation pulls the hand (and the mind) toward the wrong answer before it's corrected."
      : "Your trajectories were fairly similar across conditions this time — real experiments run this over many more trials and people to see the effect reliably.";

    resultsBox.classList.add("show");
  }

  startBtn.addEventListener("mousedown", startDrag);
  startBtn.addEventListener("touchstart", startDrag, { passive: false });
  window.addEventListener("mousemove", duringDrag);
  window.addEventListener("touchmove", duringDrag, { passive: false });
  window.addEventListener("mouseup", endDrag);
  window.addEventListener("touchend", endDrag);

  document.getElementById("resetBtn").addEventListener("click", () => {
    trialIndex = 0;
    results = [];
    resultsBox.classList.remove("show");
    buildTrialList();
    setupTrial();
  });

  buildTrialList();
  setupTrial();
}

// ── Stats page ─────────────────────────────────────────────────────────
function initStats() {
  const years = [...new Set(OUTPUTS.map((o) => o.year))].sort();
  const byYear = years.map((y) => OUTPUTS.filter((o) => o.year === y).length);

  const coauthorCounts = {};
  OUTPUTS.forEach((o) => o.coauthors.forEach((c) => {
    coauthorCounts[c] = (coauthorCounts[c] || 0) + 1;
  }));
  const coauthorEntries = Object.entries(coauthorCounts).sort((a, b) => b[1] - a[1]);

  // Stat cards
  const statGrid = document.getElementById("statGrid");
  const stats = [
    { num: OUTPUTS.length, lbl: "Total outputs" },
    { num: OUTPUTS.filter((o) => o.type === "Article").length, lbl: "Journal articles" },
    { num: OUTPUTS.filter((o) => o.type === "Talk" || o.type === "Workshop").length, lbl: "Talks & workshops" },
    { num: OUTPUTS.filter((o) => o.type === "Dataset" || o.type === "Software").length, lbl: "Datasets & software" },
    { num: coauthorEntries.length, lbl: "Coauthors" },
  ];
  statGrid.innerHTML = stats.map((s) => `
    <div class="stat-card"><div class="num">${s.num}</div><div class="lbl">${s.lbl}</div></div>
  `).join("");

  // Timeline
  const timelineList = document.getElementById("timelineList");
  timelineList.innerHTML = CONFERENCES.map((c) => `
    <div class="timeline-item">
      <div>
        <div class="timeline-title">${c.title}</div>
        <div class="timeline-loc">${c.loc}</div>
      </div>
      <div class="timeline-year">${c.year}</div>
    </div>
  `).join("");

  let yearChart, coauthorChart;

  function drawCharts() {
    const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const textColor = cssVar("--text-main");
    const gridColor = cssVar("--back-alt");
    const accentPrime = cssVar("--accent-prime");
    const accentSec = cssVar("--accent-sec");

    if (yearChart) yearChart.destroy();
    if (coauthorChart) coauthorChart.destroy();

    yearChart = new Chart(document.getElementById("yearChart"), {
      type: "bar",
      data: {
        labels: years,
        datasets: [{
          label: "Outputs",
          data: byYear,
          backgroundColor: accentPrime,
          borderRadius: 8,
          maxBarThickness: 60,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: textColor }, grid: { display: false } },
          y: { ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor }, beginAtZero: true },
        },
      },
    });

    coauthorChart = new Chart(document.getElementById("coauthorChart"), {
      type: "bar",
      data: {
        labels: coauthorEntries.map((e) => e[0]),
        datasets: [{
          label: "Shared outputs",
          data: coauthorEntries.map((e) => e[1]),
          backgroundColor: accentSec,
          borderRadius: 8,
        }],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor }, beginAtZero: true },
          y: { ticks: { color: textColor }, grid: { display: false } },
        },
      },
    });
  }

  drawCharts();
  window.__redrawCharts = drawCharts;
}
