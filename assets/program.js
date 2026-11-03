// The program pages' motion and language — the landing page's own (index.html), shared by effects.html,
// design.html and uiux.html. A page sets window.PROGRAM before this file:
//   en      — the English strings, by data-k (the Arabic is what the page is written in)
//   ticker  — { ar: [...], en: [...] } for the band of moving words
//   light   — [[selector, a1, a2, a3]] — the chapter light, in the program's colours
//   scenes  — { "#id": (step) => {} } — what a pinned scene does at each of its steps
//   motion  — ({ wide }) => {} — the page's own scroll scenes, made before the shared ones
//   still   — () => {} — how those scenes rest when motion is reduced
//   ready   — () => {} — the page's own loops and demos, once the intro is done
(() => {
  const P = window.PROGRAM || {};
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  const isRTL = () => document.documentElement.dir === "rtl";

  // film grain: a small noise tile drawn once
  try {
    const n = document.createElement("canvas"); n.width = n.height = 160;
    const g = n.getContext("2d"), d = g.createImageData(160, 160);
    for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    g.putImageData(d, 0, 0);
    document.getElementById("grain").style.setProperty("--noise", `url(${n.toDataURL()})`);
  } catch {}

  // the logo: a 5×5 starburst
  const LOGO = (r, c) => (r === 2 && c === 2 ? "core" : r === 2 || c === 2 || r === c || r + c === 4 ? "on" : "");
  document.querySelectorAll("[data-mark]").forEach((m) => {
    for (let i = 0; i < 25; i++) { const t = document.createElement("i"); const cls = LOGO(Math.floor(i / 5), i % 5); if (cls) t.className = cls; m.appendChild(t); }
  });

  // language: the same switch and the same remembered choice as the landing page
  const EN = { brand: "EBDA<b>AI</b>", n1: "Why local", n2: "What it makes", n3: "Programs", n4: "Requirements", navcta: "Get EBDAAI", "nav-effects": "Effects", "nav-design": "Design", "nav-uiux": "UI/UX", foot: "© 2026 EBDAAI", made: "Made by", ...(P.en || {}) };
  const AR = {};
  const keyed = [...document.querySelectorAll("[data-k]")];
  keyed.forEach((el) => { AR[el.dataset.k] ??= el.innerHTML; });
  let lang = "ar";
  const listeners = [];
  const tickerRow = document.getElementById("ticker");
  const fillTicker = () => {
    if (!tickerRow || !P.ticker) return;
    const w = P.ticker[lang === "en" ? "en" : "ar"];
    const once = w.map((x, i) => `<span class="${i % 3 === 0 ? "f" : ""}">${x}</span><span class="dot">✦</span>`).join("");
    tickerRow.innerHTML = once + once + once;
  };
  const setLang = (l) => {
    lang = l;
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    keyed.forEach((el) => { const v = (l === "en" ? EN : AR)[el.dataset.k]; if (v != null) el.innerHTML = v; });
    const b = document.getElementById("lang");
    b.textContent = l === "ar" ? "EN" : "ع"; b.setAttribute("aria-label", l === "ar" ? "English" : "العربية");
    try { localStorage.setItem("ebdaai_site_lang", l); } catch {}
    fillTicker();
    listeners.forEach((fn) => fn(l));
    if (hasGsap) ScrollTrigger.refresh();
  };
  window.prog = { lang: () => lang, onLang: (fn) => listeners.push(fn), isRTL, reduce };
  fillTicker();
  try { if (localStorage.getItem("ebdaai_site_lang") === "en") setLang("en"); } catch {}
  document.getElementById("lang").addEventListener("click", () => setLang(lang === "ar" ? "en" : "ar"));

  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("solid", scrollY > 60);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // cursor and magnetic buttons
  if (fine && !reduce) {
    const ring = document.getElementById("cursor"), dot = document.getElementById("cursorDot");
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px, ${my}px)`; }, { passive: true });
    (function follow() { rx += (mx - rx) * .16; ry += (my - ry) * .16; ring.style.transform = `translate(${rx}px, ${ry}px)`; requestAnimationFrame(follow); })();
    document.querySelectorAll("a, button, .feat, .other").forEach((el) => { el.addEventListener("pointerenter", () => ring.classList.add("big")); el.addEventListener("pointerleave", () => ring.classList.remove("big")); });
    document.querySelectorAll(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => { const r = el.getBoundingClientRect(); el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .3}px, ${(e.clientY - r.top - r.height / 2) * .4}px)`; });
      el.addEventListener("pointerleave", () => { el.style.transition = "transform .5s cubic-bezier(.2,.7,.2,1), box-shadow .3s"; el.style.transform = ""; setTimeout(() => (el.style.transition = ""), 500); });
    });
  }

  // a scene's step, from the scroll (or from the start, without it)
  const scenes = [...document.querySelectorAll("[data-scene]")];
  const setStep = (scene, k) => {
    if (scene.dataset.step === String(k)) return;
    scene.dataset.step = String(k);
    scene.querySelectorAll(".step").forEach((s, i) => s.classList.toggle("on", i === k));
    // what the visual has by this step: everything marked for it or an earlier one
    scene.querySelectorAll("[data-at]").forEach((el) => el.classList.toggle("in", +el.dataset.at <= k));
    P.scenes?.["#" + scene.id]?.(k);
  };
  scenes.forEach((s) => setStep(s, 0));

  const intro = document.getElementById("intro");
  if (!hasGsap || reduce) {
    intro.style.display = "none";
    document.querySelectorAll(".words span").forEach((w) => (w.style.opacity = 1));
    P.ready?.();
    if (!hasGsap) return;
  } else {
    // the intro: the icon pops, the count runs, the curtain lifts, the headline rises
    const pct = document.getElementById("introPct");
    const counter = { v: 0 };
    const tl = gsap.timeline();
    tl.from("#intro img", { scale: 0, rotate: -12, duration: .7, ease: "back.out(2)" })
      .from("#intro .name", { y: 20, opacity: 0, duration: .6, ease: "power3.out" }, "-=.35")
      .to(counter, { v: 100, duration: 1, ease: "power2.inOut", onUpdate: () => (pct.textContent = String(Math.round(counter.v)).padStart(3, "0")) }, 0);
    Promise.race([document.fonts?.ready || Promise.resolve(), new Promise((r) => setTimeout(r, 2200))]).then(() => {
      tl.then(() => {
        gsap.timeline({ onComplete: () => { intro.style.display = "none"; } })
          .to("#intro .inner", { scale: .9, opacity: 0, duration: .4, ease: "power2.in" })
          .to(intro, { clipPath: "inset(0 0 100% 0)", duration: .9, ease: "expo.inOut" }, "-=.1")
          .from(".p-hero h1 .line > span, .cine h1 .line > span", { yPercent: 110, duration: 1.3, ease: "expo.out", stagger: .12 }, "-=.5")
          .from(".p-hero [data-hero], .cine [data-hero]", { y: 24, opacity: 0, duration: 1, ease: "power3.out", stagger: .08 }, "-=1.1")
          .add(() => P.ready?.(), "-=1");
      });
    });
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.to("#progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: .3 } });
  if (reduce) { scenes.forEach((s) => setStep(s, s.querySelectorAll(".step").length - 1)); P.still?.(); return; }
  // the page's own scroll scenes, first: pinned scenes need to be made in the order of the page
  P.motion?.({ wide: matchMedia("(min-width: 961px)").matches });

  // the arcs draw in with the scroll: the right one as the section arrives, the left one after it
  document.querySelectorAll(".arcs-host").forEach((host) => {
    const [r, l] = [host.querySelector(".arc.r path"), host.querySelector(".arc.l path")];
    [r, l].filter(Boolean).forEach((path) => { const L = path.getTotalLength(); gsap.set(path, { strokeDasharray: L, strokeDashoffset: L }); });
    if (r) gsap.to(r, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: host, start: "top 85%", end: "top 15%", scrub: .6 } });
    if (l) gsap.to(l, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: host, start: "top 45%", end: "top -25%", scrub: .6 } });
  });

  // leaving the opening: the words lift away, the window leans back
  gsap.to(".p-hero .copy", { y: -120, opacity: 0, ease: "none", scrollTrigger: { trigger: ".p-hero", start: "top top", end: "70% top", scrub: true } });
  gsap.to(".p-hero .stage", { y: -60, rotateX: 8, scale: .94, opacity: .2, transformPerspective: 1200, ease: "none", scrollTrigger: { trigger: ".p-hero", start: "20% top", end: "bottom top", scrub: true } });

  // the manifesto lights up word by word
  document.querySelectorAll(".words").forEach((words) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: words, start: "top 78%", end: "bottom 40%", scrub: .5 } });
    words.querySelectorAll("span").forEach((w, i) => tl.fromTo(w, { opacity: .12, filter: "blur(6px)" }, { opacity: 1, filter: "blur(0px)", duration: 1, ease: "none" }, i * .9));
  });

  // the chapter light
  (P.light || []).forEach(([sel, a1, a2, a3]) => ScrollTrigger.create({ trigger: sel, start: "top 60%", end: "bottom 40%", onToggle: (self) => self.isActive && gsap.to(document.documentElement, { "--a1": a1, "--a2": a2, "--a3": a3, duration: 1.6, ease: "power2.out", overwrite: true }) }));

  // the band of words: drifts, and runs with the scroll's speed
  if (tickerRow) {
    const tick = gsap.to(tickerRow, { xPercent: () => (isRTL() ? 33.33 : -33.33), ease: "none", duration: 26, repeat: -1 });
    ScrollTrigger.create({ trigger: ".ticker", start: "top bottom", end: "bottom top", onUpdate: (self) => { const v = Math.min(6, 1 + Math.abs(self.getVelocity()) / 400); gsap.to(tick, { timeScale: v * (self.direction || 1), duration: .3, overwrite: true }); gsap.to(tick, { timeScale: 1, duration: 1.2, delay: .3 }); } });
  }

  // scenes: pinned on wide screens, the scroll walks their steps; on phones each step shows as it arrives
  const mm = gsap.matchMedia();
  mm.add("(min-width: 961px)", () => {
    scenes.forEach((scene) => {
      const n = scene.querySelectorAll(".step").length;
      ScrollTrigger.create({ trigger: scene, start: "top top", end: () => "+=" + innerHeight * (n * .7), pin: true, scrub: true, onUpdate: (self) => setStep(scene, Math.min(n - 1, Math.floor(self.progress * n))) });
    });
  });
  mm.add("(max-width: 960px)", () => {
    scenes.forEach((scene) => scene.querySelectorAll(".step").forEach((s, i) => ScrollTrigger.create({ trigger: s, start: "top 70%", onEnter: () => setStep(scene, i), onEnterBack: () => setStep(scene, i) })));
  });

  // everything else rises into place
  gsap.utils.toArray("[data-reveal]").forEach((el) => gsap.from(el, { y: 36, opacity: 0, duration: .9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 86%" } }));
  ScrollTrigger.batch(".feat, .other", { start: "top 88%", onEnter: (els) => gsap.from(els, { y: 40, opacity: 0, duration: .8, ease: "power3.out", stagger: .07 }) });
})();
