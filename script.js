/* ══════════════════════════════════════════════════════════
   OPERATION: MOVIE NIGHT — interaction logic
   ══════════════════════════════════════════════════════════ */
(() => {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const screens = Array.from(document.querySelectorAll(".screen"));
  const byName = (n) => document.querySelector(`.screen[data-screen="${n}"]`);
  // narrative order (boot is index 0, not counted in mission progress)
  const order = ["boot", "recruit", "situation", "escalate", "whyyou", "objective", "ask", "accepted"];
  const missionTotal = 6; // recruit..ask
  let idx = 0;

  const hud = document.getElementById("hud");
  const hudFill = document.getElementById("hudFill");
  const hudStep = document.getElementById("hudStep");

  function show(name) {
    idx = order.indexOf(name);
    screens.forEach((s) => s.classList.toggle("is-active", s.dataset.screen === name));
    window.scrollTo(0, 0);

    // HUD visible for recruit..ask
    const missionPos = idx; // 1..6 for recruit..ask
    if (missionPos >= 1 && missionPos <= missionTotal) {
      hud.hidden = false;
      hudFill.style.width = (missionPos / missionTotal) * 100 + "%";
      hudStep.textContent = String(missionPos).padStart(2, "0") + " / " + String(missionTotal).padStart(2, "0");
    } else {
      hud.hidden = true;
    }

    // per-screen entrances
    if (name === "whyyou") runWhyYou();
    if (name === "objective") runObjective();
    if (name === "accepted") celebrate();
  }

  function next() {
    const n = order[idx + 1];
    if (n) show(n);
  }

  document.querySelectorAll("[data-next]").forEach((b) =>
    b.addEventListener("click", next)
  );

  /* ── BOOT SEQUENCE ─────────────────────────────────────── */
  const bootLog = document.getElementById("bootLog");
  const bootGo = document.getElementById("bootGo");
  const bootLines = [
    { t: "> ILLUMINATION HENCHNET — SECURE TERMINAL", c: "sys" },
    { t: "> encrypted uplink ......... OK", c: "sys" },
    { t: "> biometric scan: googly eyes detected  ✓" },
    { t: "> clearance level: BANANA (highest)", c: "hot" },
    { t: "> addressee verified: AGENT MADDY", c: "hot" },
    { t: "> UNLOCKING VAULT ...", c: "hot" },
  ];

  function typeBoot() {
    if (reduce) {
      bootLog.textContent = bootLines.map((l) => l.t).join("\n");
      bootGo.hidden = false;
      return;
    }
    let li = 0, ci = 0;
    const caret = '<span class="caret"></span>';
    function step() {
      if (bootFinished) return;
      const line = bootLines[li];
      const cls = line.c ? ` class="${line.c}"` : "";
      // build fully-typed prior lines + partial current line
      const done = bootLines.slice(0, li)
        .map((l) => l.c ? `<span class="${l.c}">${l.t}</span>` : l.t)
        .join("\n");
      const partial = line.t.slice(0, ci);
      bootLog.innerHTML = done + (done ? "\n" : "") +
        `<span${cls}>${partial}</span>` + caret;
      if (ci < line.t.length) {
        ci++;
        setTimeout(step, 8 + Math.random() * 14);
      } else {
        li++; ci = 0;
        if (li < bootLines.length) setTimeout(step, 110);
        else finishBoot();
      }
    }
    step();
  }
  function finishBoot() {
    bootFinished = true;
    const done = bootLines
      .map((l) => l.c ? `<span class="${l.c}">${l.t}</span>` : l.t)
      .join("\n");
    bootLog.innerHTML = done + '<span class="caret"></span>';
    setTimeout(() => { bootGo.hidden = false; bootGo.classList.add("pop"); }, 350);
  }
  bootGo.addEventListener("click", () => show("recruit"));

  // tap anywhere during boot to skip straight to the button
  let bootFinished = false;
  byName("boot").addEventListener("click", (e) => {
    if (bootFinished || e.target === bootGo) return;
    bootFinished = true;
    finishBoot();
  });

  /* ── WHY YOU: scan → id card → text ────────────────────── */
  let whyDone = false;
  function runWhyYou() {
    if (whyDone) return;
    whyDone = true;
    const scan = document.getElementById("scanLine");
    const card = document.getElementById("idcard");
    const text = document.getElementById("whyText");
    const dots = ["", ".", "..", "..."];
    let d = 0;
    const base = "◍  SCANNING NATIONAL REGISTRY FOR QUALIFIED PERSONNEL";
    const anim = reduce ? null : setInterval(() => {
      scan.textContent = base + dots[d++ % dots.length];
    }, 300);

    setTimeout(() => {
      if (anim) clearInterval(anim);
      scan.textContent = "◍  MATCH FOUND — 1 RESULT";
      scan.style.color = "var(--green)";
      card.hidden = false; card.classList.add("pop");
    }, reduce ? 0 : 1500);

    setTimeout(() => {
      text.hidden = false; text.classList.add("pop");
    }, reduce ? 0 : 2400);
  }

  /* ── OBJECTIVE: decrypt → reveal ───────────────────────── */
  let objDone = false;
  function runObjective() {
    if (objDone) return;
    objDone = true;
    const line = document.getElementById("decryptLine");
    const card = document.getElementById("objectiveCard");
    const btn = document.getElementById("toAsk");
    const glyphs = "▚▞▓█▒░01#*/\\<>";
    const label = "◍  DECRYPTING MISSION OBJECTIVE ";
    let ticks = 0;
    const anim = reduce ? null : setInterval(() => {
      let s = "";
      for (let i = 0; i < 10; i++) s += glyphs[Math.floor(Math.random() * glyphs.length)];
      line.textContent = label + s;
      ticks++;
    }, 70);
    setTimeout(() => {
      if (anim) clearInterval(anim);
      line.textContent = "◍  OBJECTIVE DECRYPTED";
      line.style.color = "var(--green)";
      card.hidden = false; card.classList.add("pop");
      btn.hidden = false; btn.classList.add("pop");
    }, reduce ? 0 : 1600);
  }

  /* ── EYE TRACKING ──────────────────────────────────────── */
  const tracked = () => Array.from(document.querySelectorAll("[data-track] [data-eye]"));
  function moveEyes(cx, cy) {
    tracked().forEach((eye) => {
      const svg = eye.closest("[data-track]");
      if (!svg || svg.closest(".screen") && !svg.closest(".screen").classList.contains("is-active")) return;
      const r = eye.getBoundingClientRect();
      const ex = r.left + r.width / 2;
      const ey = r.top + r.height / 2;
      const a = Math.atan2(cy - ey, cx - ex);
      const dist = Math.min(6, Math.hypot(cx - ex, cy - ey) / 22);
      const dx = Math.cos(a) * dist;
      const dy = Math.sin(a) * dist;
      eye.querySelectorAll(".pupil, .pupil-dot").forEach((p) => {
        p.style.transform = `translate(${dx}px, ${dy}px)`;
      });
    });
  }
  if (!reduce) {
    window.addEventListener("pointermove", (e) => moveEyes(e.clientX, e.clientY), { passive: true });
  }

  /* ── THE ASK: yes / dodging no ─────────────────────────── */
  const yesBtn = document.getElementById("yesBtn");
  const noBtn = document.getElementById("noBtn");
  const choices = document.getElementById("choices");
  const pleas = ["no", "you sure?", "think again", "reconsider!", "but the monsters!", "Maddy pls", "bello?", "final answer?", "🥺", "wrong button"];
  let dodges = 0;

  function dodge() {
    dodges++;
    noBtn.classList.add("roaming");
    const pad = 12;
    const bw = noBtn.offsetWidth, bh = noBtn.offsetHeight;
    const maxX = Math.max(pad, window.innerWidth - bw - pad);
    const maxY = Math.max(pad, window.innerHeight - bh - pad);
    // pick a spot that keeps clear of the YES button
    const yes = yesBtn.getBoundingClientRect();
    let x = pad, y = pad;
    for (let i = 0; i < 12; i++) {
      x = pad + Math.random() * (maxX - pad);
      y = pad + Math.random() * (maxY - pad);
      const overlapsYes =
        x < yes.right + 24 && x + bw > yes.left - 24 &&
        y < yes.bottom + 24 && y + bh > yes.top - 24;
      if (!overlapsYes) break;
    }
    noBtn.style.left = x + "px";
    noBtn.style.top = y + "px";
    noBtn.textContent = pleas[Math.min(dodges, pleas.length - 1)];
    const scale = Math.max(0.55, 1 - dodges * 0.06);
    noBtn.style.transform = `scale(${scale})`;
    if (dodges >= 6) yesBtn.style.transform = `scale(${1 + (dodges - 5) * 0.05})`;
  }

  if (!reduce) {
    noBtn.addEventListener("pointerenter", dodge);
    noBtn.addEventListener("focus", dodge);
  }
  // touch / click always dodges (no real way to press it)
  noBtn.addEventListener("click", (e) => { e.preventDefault(); dodge(); });
  yesBtn.addEventListener("click", () => show("accepted"));

  /* ── CELEBRATION ───────────────────────────────────────── */
  let celebrated = false;
  function celebrate() {
    if (celebrated || reduce) return;
    celebrated = true;
    const wrap = document.getElementById("confetti");
    const bits = ["🍌", "🍌", "🍌", "❤️", "🎬", "⭐", "🥼"];
    const N = 70;
    for (let i = 0; i < N; i++) {
      const s = document.createElement("span");
      s.textContent = bits[Math.floor(Math.random() * bits.length)];
      s.style.left = Math.random() * 100 + "vw";
      s.style.fontSize = 16 + Math.random() * 22 + "px";
      s.style.animationDuration = 2.6 + Math.random() * 2.8 + "s";
      s.style.animationDelay = Math.random() * 1.2 + "s";
      wrap.appendChild(s);
      setTimeout(() => s.remove(), 7000);
    }
  }

  /* ── GO ────────────────────────────────────────────────── */
  typeBoot();
})();
