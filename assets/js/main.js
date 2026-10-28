/* =========================================================
   Buddha Resort — site scripts (shared by every page)
   ========================================================= */

// ---- Fill these in with the hotel's real numbers ----------
const CONFIG = {
  phone: "+91 73720 00041",   // from the hotel's own business card (second number: +91 70792 64141)
  whatsapp: "917372000041",   // digits only, with country code (assumed to be the main line)
};

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Contact details ---------- */
(function contact() {
  const tel = CONFIG.phone.replace(/[^\d+]/g, "");
  $$(".js-phone").forEach(el => { if (CONFIG.phone) el.textContent = CONFIG.phone; });
  $$(".js-tel").forEach(a => { a.href = tel ? `tel:${tel}` : "contact.html"; });
  $$(".js-wa").forEach(a => {
    if (!CONFIG.whatsapp) { a.href = "contact.html#enquiry"; return; }
    a.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent("Hello Buddha Resort, I'd like to enquire about a booking.")}`;
    a.target = "_blank"; a.rel = "noopener";
  });
  $$(".js-year").forEach(el => (el.textContent = new Date().getFullYear()));
})();

/* ---------- Smooth scroll ---------- */
let lenis = null;
if (window.Lenis && !reduceMotion) {
  lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
}

/* ---------- Header, mobile nav, progress, back-to-top ---------- */
(function chrome() {
  const header = $(".header"), burger = $(".burger"), mnav = $(".mnav");
  const bar = $(".progress span"), top = $(".to-top");

  const onScroll = () => {
    const y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
    header.classList.toggle("scrolled", y > 40);
    if (bar) bar.style.height = `${max > 0 ? (y / max) * 100 : 0}%`;
    top?.classList.toggle("show", y > innerHeight);
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const setMenu = open => {
    burger.classList.toggle("open", open);
    mnav.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
    open ? lenis?.stop() : lenis?.start();
  };
  burger.addEventListener("click", () => setMenu(!mnav.classList.contains("open")));
  $$("a", mnav).forEach(a => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

  top?.addEventListener("click", () => (lenis ? lenis.scrollTo(0) : scrollTo({ top: 0, behavior: "smooth" })));

  // in-page anchors go through Lenis
  $$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
    const t = $(a.getAttribute("href"));
    if (!t) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(t, { offset: -90 }) : t.scrollIntoView({ behavior: "smooth" });
  }));
})();

/* ---------- Enquire widget ---------- */
(function enquire() {
  const box = $(".enq");
  if (!box) return;
  const btn = $(".enq__btn", box), panel = $(".enq__panel", box);
  const set = open => {
    box.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", String(open));
    panel.setAttribute("aria-hidden", String(!open));
    if (open) $(".enq__opt", panel).focus({ preventScroll: true });
  };
  btn.addEventListener("click", () => set(!box.classList.contains("open")));
  $(".enq__close", box).addEventListener("click", () => { set(false); btn.focus(); });
  $$(".enq__opt", panel).forEach(a => a.addEventListener("click", () => set(false)));
  document.addEventListener("click", e => { if (!box.contains(e.target)) set(false); });
  addEventListener("keydown", e => { if (e.key === "Escape" && box.classList.contains("open")) { set(false); btn.focus(); } });
})();

/* ---------- Reveal on scroll ---------- */
(function reveal() {
  const els = $$("[data-reveal]");
  if (!("IntersectionObserver" in window) || reduceMotion) { els.forEach(e => e.classList.add("in")); return; }
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }), { threshold: .14, rootMargin: "0px 0px -40px 0px" });
  els.forEach(e => io.observe(e));
})();

/* ---------- Counters ---------- */
(function counters() {
  const els = $$("[data-count]");
  const run = el => {
    const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), t0 = performance.now(), dur = 1800;
    const tick = now => {
      const p = Math.min((now - t0) / dur, 1), v = to * (1 - Math.pow(1 - p, 3));
      el.textContent = dec ? v.toFixed(dec) : Math.round(v);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(en => en.forEach(x => { if (x.isIntersecting) { run(x.target); io.unobserve(x.target); } }), { threshold: .5 });
  els.forEach(e => io.observe(e));
})();

/* ---------- Simple cycler used by hero, split images, rotator ---------- */
function cycle(items, ms, onChange) {
  if (items.length < 2) return null;
  let i = items.findIndex(x => x.classList.contains("on"));
  if (i < 0) { i = 0; items[0].classList.add("on"); }
  const go = n => {
    const prev = items[i];
    i = (n + items.length) % items.length;
    prev.classList.remove("on");
    items[i].classList.add("on");
    onChange?.(i, prev);
  };
  let timer = setInterval(() => go(i + 1), ms);
  return { go: n => { clearInterval(timer); go(n); timer = setInterval(() => go(i + 1), ms); } };
}

/* ---------- Home hero ---------- */
(function hero() {
  const slides = $$(".hero__slides img");
  if (!slides.length) return;
  const dots = $$(".hero__dots button");
  const c = cycle(slides, 6000, i => dots.forEach((d, k) => d.classList.toggle("on", k === i)));
  dots.forEach((d, k) => d.addEventListener("click", () => c?.go(k)));

  if (window.gsap && !reduceMotion) {
    gsap.from(".hero h1 .ln > span", { yPercent: 110, duration: 1.3, stagger: .12, ease: "expo.out", delay: .15 });
    gsap.from(".hero__sub, .hero__btns", { y: 30, opacity: 0, duration: 1.1, stagger: .12, ease: "expo.out", delay: .5 });
    gsap.from(".hero__stats > div", { y: 30, opacity: 0, duration: 1, stagger: .1, ease: "expo.out", delay: .8 });
    gsap.from(".header", { y: -30, opacity: 0, duration: 1, ease: "expo.out" });
  }
})();

/* ---------- Rotating word ---------- */
$$(".rotator").forEach(r => cycle($$("span", r), 2400, (i, prev) => {
  prev.classList.add("out");
  setTimeout(() => prev.classList.remove("out"), 700);
}));

/* ---------- Crossfading split images ---------- */
$$("[data-fade]").forEach(box => cycle($$("img", box), +box.dataset.fade || 3800));

/* ---------- Tabs showcase ---------- */
$$("[data-tabs]").forEach(wrap => {
  const btns = $$(".tabs button", wrap), slides = $$(".showcase__slide", wrap);
  const c = cycle(slides, 5000, i => btns.forEach((b, k) => b.classList.toggle("on", k === i)));
  btns.forEach((b, k) => b.addEventListener("click", () => c?.go(k)));
});

/* ---------- Pinned horizontal feature cards ---------- */
(function why() {
  const track = $(".why__track");
  if (!track || !window.gsap || !window.ScrollTrigger || reduceMotion) return;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.matchMedia({
    "(min-width: 761px)": () => {
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      gsap.to(track, {
        x: () => -dist(), ease: "none",
        scrollTrigger: { trigger: ".why", pin: ".why__pin", start: "top top", end: () => "+=" + dist(), scrub: 1, invalidateOnRefresh: true },
      });
    },
  });
  addEventListener("load", () => ScrollTrigger.refresh());
})();

/* ---------- Room thumbnails ---------- */
$$(".room-row").forEach(row => {
  const main = $(".room-row__main img", row), thumbs = $$(".room-row__thumbs button", row);
  thumbs.forEach(t => t.addEventListener("click", () => {
    thumbs.forEach(x => x.classList.toggle("on", x === t));
    main.style.opacity = 0;
    setTimeout(() => { main.src = $("img", t).src; main.alt = $("img", t).alt; main.style.opacity = 1; }, 220);
  }));
});

/* ---------- Gallery: filter + lightbox ---------- */
(function gallery() {
  const items = $$(".gitem");
  if (!items.length) return;
  $$("[data-filter]").forEach(btn => btn.addEventListener("click", () => {
    $$("[data-filter]").forEach(b => b.classList.toggle("on", b === btn));
    const f = btn.dataset.filter;
    items.forEach(it => it.classList.toggle("hide", f !== "all" && it.dataset.cat !== f));
  }));

  const lb = $(".lightbox"), img = $("img", lb), cap = $("p", lb);
  let idx = 0;
  const visible = () => items.filter(i => !i.classList.contains("hide"));
  const show = n => {
    const v = visible(); idx = (n + v.length) % v.length;
    img.src = $("img", v[idx]).src; img.alt = $("img", v[idx]).alt; cap.textContent = v[idx].dataset.title;
  };
  const open = it => { show(visible().indexOf(it)); lb.classList.add("open"); lenis?.stop(); };
  const close = () => { lb.classList.remove("open"); lenis?.start(); };
  items.forEach(it => it.addEventListener("click", () => open(it)));
  $(".lb-close", lb).addEventListener("click", close);
  $(".lb-prev", lb).addEventListener("click", () => show(idx - 1));
  $(".lb-next", lb).addEventListener("click", () => show(idx + 1));
  lb.addEventListener("click", e => { if (e.target === lb) close(); });
  addEventListener("keydown", e => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(idx - 1);
    if (e.key === "ArrowRight") show(idx + 1);
  });
})();

/* ---------- Enquiry forms → WhatsApp ---------- */
$$(".js-form").forEach(form => {
  const f = form.elements, msg = $(".form-msg", form);
  const today = new Date().toISOString().slice(0, 10);
  if (f.checkin) { f.checkin.min = today; f.checkout.min = today; }
  f.checkin?.addEventListener("change", () => { f.checkout.min = f.checkin.value || today; });

  // ?type=Family%20Room preselects the enquiry type
  const pre = new URLSearchParams(location.search).get("type");
  if (pre && f.type) [...f.type.options].forEach(o => { if (o.text === pre) f.type.value = o.text; });

  form.addEventListener("submit", e => {
    e.preventDefault();
    let ok = true;
    $$("[required]", form).forEach(inp => {
      const bad = !inp.value.trim();
      inp.closest(".fld").classList.toggle("err", bad);
      if (bad) ok = false;
    });
    if (!ok) { msg.textContent = "Please fill in the highlighted fields."; return; }

    const line = (k, v) => (v ? `${k}: ${v}` : "");
    const text = [
      `Hello Buddha Resort! New enquiry from the website:`,
      line("Name", f.name?.value), line("Phone", f.phone?.value),
      line("Enquiry", f.type?.value),
      line("Check-in", f.checkin?.value), line("Check-out", f.checkout?.value),
      line("Event date", f.date?.value), line("Guests", f.guests?.value),
      line("Message", f.message?.value.trim()),
    ].filter(Boolean).join("\n");

    if (CONFIG.whatsapp) {
      window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
      msg.textContent = "Opening WhatsApp — we'll get back to you shortly.";
      form.reset();
    } else if (CONFIG.phone) {
      msg.textContent = `Thank you! Please call us on ${CONFIG.phone} to confirm.`;
    } else {
      msg.textContent = "Thank you! Please call or visit our front desk to confirm your booking.";
    }
  });
});
