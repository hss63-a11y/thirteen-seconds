/* Thirteen Seconds — shared behavior. Every block checks for its element first,
   so one script serves every page. */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ---------- Scoreboard replay (home) ---------- */
  const board = $("#board");
  if (board) {
    const clock = $("#board-clock");
    const status = $("#board-status");
    const kc = $("#board-kc");
    const buf = $("#board-buf");
    const btn = $("#replay");
    let timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const setScore = (el, v) => { el.textContent = v; el.classList.remove("changed"); void el.offsetWidth; el.classList.add("changed"); };

    btn.addEventListener("click", () => {
      timers.forEach(clearTimeout); timers = [];
      buf.textContent = "36"; kc.textContent = "33";
      clock.textContent = "0:13"; status.textContent = "4TH · KICKOFF";
      btn.disabled = true; btn.textContent = "Watching it happen…";
      const beats = [
        [700, "0:13", "TOUCHBACK"],
        [1500, "0:08", "MAHOMES TO HILL · 19"],
        [2500, "0:03", "MAHOMES TO KELCE · 25"],
        [3500, "0:00", "BUTKER · 49 YD FG"],
      ];
      beats.forEach(([ms, c, s]) => later(() => { clock.textContent = c; status.textContent = s; }, ms));
      later(() => setScore(kc, "36"), 3700);
      later(() => { clock.textContent = "OT"; status.textContent = "KC WINS THE TOSS"; }, 5000);
      later(() => { status.textContent = "MAHOMES TO KELCE · 8 YD TD"; setScore(kc, "42"); }, 6400);
      later(() => { clock.textContent = "FINAL"; status.textContent = "ALLEN NEVER TOUCHED THE BALL"; btn.disabled = false; btn.textContent = "Replay the collapse"; }, 7600);
    });
  }

  /* ---------- Margin-of-defeat chart (January) ---------- */
  const chartHost = $("#margin-chart");
  if (chartHost) {
    const data = [
      { season: "2019", opp: "HOU", round: "Wild Card", score: "19–22 OT", m: 3 },
      { season: "2020", opp: "KC", round: "AFC Championship", score: "24–38", m: 14 },
      { season: "2021", opp: "KC", round: "Divisional", score: "36–42 OT", m: 6 },
      { season: "2022", opp: "CIN", round: "Divisional", score: "10–27", m: 17 },
      { season: "2023", opp: "KC", round: "Divisional", score: "24–27", m: 3 },
      { season: "2024", opp: "KC", round: "AFC Championship", score: "29–32", m: 3 },
      { season: "2025", opp: "DEN", round: "Divisional", score: "30–33 OT", m: 3 },
    ];
    const W = 720, H = 300, pad = { t: 24, r: 16, b: 52, l: 44 };
    const max = 20, ticks = [0, 5, 10, 15, 20];
    const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    const band = iw / data.length, bw = Math.min(40, band * 0.46);
    const y = (v) => pad.t + (v / max) * ih; // bars hang down from zero: losses
    const NS = "http://www.w3.org/2000/svg";
    const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); parent && parent.appendChild(n); return n; };

    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart", role: "img", "aria-labelledby": "margin-title margin-sub" });
    const grid = el("g", { class: "grid" }, svg);
    const axis = el("g", { class: "axis" }, svg);
    ticks.forEach((t) => {
      el("line", { x1: pad.l, x2: W - pad.r, y1: y(t), y2: y(t) }, grid);
      const tx = el("text", { x: pad.l - 10, y: y(t) + 4, "text-anchor": "end" }, axis);
      tx.textContent = t === 0 ? "0" : "−" + t;
    });
    const marks = el("g", {}, svg);
    data.forEach((d, i) => {
      const cx = pad.l + band * i + band / 2;
      const x = cx - bw / 2, h = y(d.m) - y(0), r = 4;
      // rounded only at the data end (bottom), square at the zero baseline
      const path = `M${x},${y(0)} H${x + bw} V${y(0) + h - r} Q${x + bw},${y(0) + h} ${x + bw - r},${y(0) + h} H${x + r} Q${x},${y(0) + h} ${x},${y(0) + h - r} Z`;
      const hit = el("rect", { class: "hit", x: cx - band / 2, y: pad.t, width: band, height: ih, tabindex: "0", "aria-label": `${d.season} ${d.round} vs ${d.opp}: lost ${d.score}, by ${d.m}` }, marks);
      el("path", { class: "bar", d: path }, marks);
      if (d.m === 3) { const v = el("text", { class: "val", x: cx, y: y(d.m) + 18, "text-anchor": "middle" }, marks); v.textContent = "3"; }
      const l1 = el("text", { class: "lbl", x: cx, y: H - pad.b + 22, "text-anchor": "middle" }, marks); l1.textContent = d.opp;
      const l2 = el("text", { class: "lbl", x: cx, y: H - pad.b + 38, "text-anchor": "middle" }, marks); l2.textContent = d.season;
      hit.dataset.i = i;
    });
    el("line", { class: "zero", x1: pad.l, x2: W - pad.r, y1: y(0), y2: y(0) }, svg);
    chartHost.appendChild(svg);

    const tip = document.createElement("div");
    tip.className = "tip"; tip.hidden = true;
    chartHost.closest(".chart-card").appendChild(tip);
    const show = (e) => {
      const d = data[e.target.dataset.i];
      const card = chartHost.closest(".chart-card").getBoundingClientRect();
      const r = e.target.getBoundingClientRect();
      tip.innerHTML = `<b>${d.season} · ${d.round}</b><br>vs ${d.opp} · L ${d.score}<br>Margin: ${d.m}`;
      tip.style.left = (r.left + r.width / 2 - card.left) + "px";
      tip.style.top = (r.top + 20 - card.top) + "px";
      tip.hidden = false;
    };
    $$(".hit", svg).forEach((h) => {
      h.addEventListener("mouseenter", show); h.addEventListener("focus", show);
      h.addEventListener("mouseleave", () => (tip.hidden = true)); h.addEventListener("blur", () => (tip.hidden = true));
    });
  }

  /* ---------- Excuse generator ---------- */
  const excuseEl = $("#excuse");
  if (excuseEl) {
    const excuses = [
      ["It was the defense. Thirteen seconds is a defensive problem.", "Overheard, every bar on Abbott Road"],
      ["They changed the overtime rules afterward, so technically we were right.", "A man in a zubaz onesie"],
      ["He's the best player on the field. He just can't be on the field when they have the ball.", "Sports-talk caller, line 3"],
      ["Regular season MVP counts. It's on the trophy and everything.", "Bills fan, February 2025"],
      ["The receivers dropped it. The receivers always drop it.", "Group chat, 11:48 p.m."],
      ["Arrowhead is a hostile environment. Also it's cold. We're from Buffalo, but still.", "Tailgate, Lot 1"],
      ["He threw that pick on purpose to keep the defense engaged.", "Optimist, unverified"],
      ["Squib the kick? Nobody squibs the kick. That's a coaching thing.", "Everyone, January 24, 2022"],
      ["The Chiefs weren't even in the playoffs this time. That's how you know it wasn't his fault.", "Bills fan, January 2026"],
      ["He's 0–4 against Mahomes in January, but have you seen him hurdle a guy?", "Highlight-reel enjoyer"],
      ["Wait until next year.", "Said every year since 2019"],
      ["Three of those were in overtime. Overtime basically doesn't count.", "Bills fan doing math"],
      ["He's paid $250 million guaranteed to win games in September. Read the contract.", "Amateur cap analyst"],
      ["You can't blame him for one drive. Or that other drive. Or the fourth down. Or—", "Trailing off"],
    ];
    const src = $("#excuse-source");
    const count = $("#excuse-count");
    const btn = $("#excuse-next");
    let order = excuses.map((_, i) => i).slice(1);
    let used = 1;
    const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    shuffle(order);
    btn.addEventListener("click", () => {
      if (!order.length) order = shuffle(excuses.map((_, i) => i));
      const [text, who] = excuses[order.pop()];
      excuseEl.textContent = "“" + text + "”";
      src.textContent = "— " + who;
      used += 1;
      count.textContent = used + " excuses issued · playoff record unchanged";
    });
  }

  /* ---------- Bingo ---------- */
  const bingo = $("#bingo");
  if (bingo) {
    const squares = [
      "“Next year is our year”", "Blames the refs", "Mentions the hurdle", "“He’s the MVP though”", "Brings up 13 seconds unprompted",
      "Table gets broken", "Blames the kicker", "“Mahomes gets every call”", "Cites rushing TDs", "Fourth-and-short goes wrong",
      "Pick in the red zone", "Overtime", "FREE: January", "Lost by exactly 3", "“The defense let him down”",
      "Scramble for −12 yards", "Throws across his body", "“He was hurt”", "Clutch drive, still loses", "Coin toss trauma",
      "“The new stadium will fix it”", "Fumbled snap", "Calls it a ‘good learning experience’", "Fans say they’re fine", "Season ends in January",
    ];
    const lines = [];
    for (let r = 0; r < 5; r++) lines.push([0, 1, 2, 3, 4].map((c) => r * 5 + c));
    for (let c = 0; c < 5; c++) lines.push([0, 1, 2, 3, 4].map((r) => r * 5 + c));
    lines.push([0, 6, 12, 18, 24], [4, 8, 12, 16, 20]);
    const status = $("#bingo-status");
    const buttons = squares.map((label, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.id = "sq-" + i;
      if (i === 12) { b.className = "free"; b.textContent = "JAN"; b.setAttribute("aria-pressed", "true"); b.setAttribute("aria-label", "Free square: January"); b.disabled = true; }
      else { b.textContent = label; b.setAttribute("aria-pressed", "false"); }
      bingo.appendChild(b);
      return b;
    });
    // pre-mark a realistic example game
    [2, 11, 13].forEach((i) => buttons[i].setAttribute("aria-pressed", "true"));
    const check = () => {
      const on = buttons.map((b) => b.getAttribute("aria-pressed") === "true");
      const won = lines.filter((l) => l.every((i) => on[i]));
      buttons.forEach((b) => b.classList.remove("win"));
      won.flat().forEach((i) => buttons[i].classList.add("win"));
      const marked = on.filter(Boolean).length - 1;
      status.innerHTML = won.length
        ? `<b>BINGO</b> &nbsp;${won.length > 1 ? won.length + " lines. " : ""}Season over. See you in September.`
        : `${marked} square${marked === 1 ? "" : "s"} marked. Keep watching.`;
    };
    buttons.forEach((b, i) => i !== 12 && b.addEventListener("click", () => {
      b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true");
      check();
    }));
    $("#bingo-reset").addEventListener("click", () => { buttons.forEach((b, i) => i !== 12 && b.setAttribute("aria-pressed", "false")); check(); });
    check();
  }

  /* ---------- Drought counters ---------- */
  const days = $("#drought-days");
  if (days) {
    // Bills' last Super Bowl appearance: Super Bowl XXVIII, January 30, 1994
    const last = new Date(1994, 0, 30);
    const d = Math.floor((Date.now() - last) / 86400000);
    days.textContent = d.toLocaleString("en-US");
    const yrs = $("#drought-years");
    if (yrs) yrs.textContent = Math.floor(d / 365.25);
  }
})();
