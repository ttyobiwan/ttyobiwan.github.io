function initFractal() {
  const pre = document.getElementById("fractal");
  const caption = document.getElementById("fractal-c");

  const COLS = 72, ROWS = 28, MAX_ITER = 60;
  const CHARS = [" ", ".", "·", ":", "•", "●"];
  const XH = 1.5;
  const YH = (XH * (ROWS / COLS)) / 0.6;
  const RADIUS = 0.7885;
  const STEP = 0.012;
  const INTERVAL = 120;
  const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
  let t = 0;
  let timer = null;

  const fmt = (v) => (v >= 0 ? "" : "−") + Math.abs(v).toFixed(3);

  function render() {
    const cr = RADIUS * Math.cos(t);
    const ci = RADIUS * Math.sin(t);
    let out = "";
    for (let r = 0; r < ROWS; r++) {
      const y0 = (r / (ROWS - 1) - 0.5) * 2 * YH;
      let line = "";
      for (let c = 0; c < COLS; c++) {
        const x0 = (c / (COLS - 1) - 0.5) * 2 * XH;
        let zr = x0, zi = y0, n = 0;
        while (n < MAX_ITER && zr * zr + zi * zi < 4) {
          const nr = zr * zr - zi * zi + cr;
          zi = 2 * zr * zi + ci;
          zr = nr;
          n++;
        }
        const idx = Math.min(CHARS.length - 1, Math.floor((n / MAX_ITER) * CHARS.length));
        line += CHARS[idx];
      }
      out += line + "\n";
    }
    pre.textContent = out;
    caption.textContent = "c = " + fmt(cr) + " " + (ci >= 0 ? "+" : "−") + " " + Math.abs(ci).toFixed(3) + "i";
    t += STEP;
  }

  function syncMotion() {
    render();
    if (timer) clearInterval(timer);
    timer = motionQuery.matches ? null : setInterval(render, INTERVAL);
  }

  syncMotion();
  motionQuery.addEventListener("change", syncMotion);
}

const SKILLS = [
  { name: "ADR", lang: false, desc: "Architecture Decision Records. Wrote many for major technical and structural changes." },
  { name: "AWS", lang: false, desc: "Cloud infrastructure. Certified Solutions Architect. Used across multiple projects." },
  { name: "Celery", lang: false, desc: "Python async task queue. De-facto default alongside Django. My best experience with it is migrating away." },
  { name: "Datadog", lang: false, desc: "Observability & monitoring." },
  { name: "Django", lang: false, desc: "Python web framework. Used across multiple projects. Not my favorite, but it can be done right." },
  { name: "Docker", lang: false, desc: "Containers. Daily driver for development and deployment." },
  { name: "Ecto", lang: false, desc: "Elixir database toolkit. Schemas, queries, migrations." },
  { name: "ElasticSearch", lang: false, desc: "Search engine. Used for complex search. I'd normally prefer Postgres full-text search." },
  { name: "Elixir", lang: true, desc: "Backend language on the BEAM. Declarative, fault-tolerant, and a pleasure to write. My primary language for production systems these days." },
  { name: "ExUnit", lang: false, desc: "Elixir's testing framework." },
  { name: "FastAPI", lang: false, desc: "Python async web framework. Definitely my favorite in the Python ecosystem." },
  { name: "GitHub Actions", lang: false, desc: "CI/CD. Used across all my projects." },
  { name: "Go", lang: true, desc: "High-throughput APIs, CLIs, workers. Love it for the simplicity and speed." },
  { name: "GraphQL", lang: false, desc: "API query language. Used extensively in one project. Would rather avoid it." },
  { name: "gRPC", lang: false, desc: "RPC framework. Used for service-to-service communication." },
  { name: "JS/TS", lang: true, desc: "Frontend and mobile when needed. Not my specialty, but I get it done." },
  { name: "LiveView", lang: false, desc: "Phoenix LiveView. Using it for private projects and backoffice tools." },
  { name: "Oban", lang: false, desc: "Elixir job processing backed by PostgreSQL. Fantastic framework. Used across multiple projects." },
  { name: "Phoenix", lang: false, desc: "Elixir web framework. The foundation of my recent professional and personal work." },
  { name: "PostgreSQL", lang: false, desc: "Relational DB. Used throughout my entire career." },
  { name: "Python", lang: true, desc: "My first language. Years of production experience across web, data, and automation. Love it for flexibility." },
  { name: "pytest", lang: false, desc: "Python testing framework." },
  { name: "RabbitMQ", lang: false, desc: "Message broker. Used alongside Celery in Django projects." },
  { name: "React", lang: false, desc: "Frontend framework. Used when needed, not my specialty." },
  { name: "Redis", lang: false, desc: "Cache and message broker. Used across many projects." },
  { name: "RFC", lang: false, desc: "Technical proposals for larger changes before implementation." },
  { name: "Sentry", lang: false, desc: "Error tracking and monitoring." },
  { name: "SQLAlchemy", lang: false, desc: "Python ORM and database toolkit. Used mostly with FastAPI." },
  { name: "SQLite", lang: false, desc: "Embedded relational DB. My favorite database. Amazed by its simplicity and what it can do." },
  { name: "SvelteKit", lang: false, desc: "Frontend framework with server-side rendering. Really enjoyed using it." },
  { name: "Temporal", lang: false, desc: "Durable workflow engine. Used it to replace unreliable async tasks. Incredible technology." },
];

function initSkills() {
  const grid = document.getElementById("skill-grid");
  const pop = document.getElementById("popover");
  const pName = document.getElementById("popover-name");
  const pDesc = document.getElementById("popover-desc");
  let openBtn = null;

  SKILLS.forEach((s) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "skill-btn" + (s.lang ? " lang" : "");
    b.textContent = s.name;
    b.setAttribute("aria-controls", "popover");
    b.setAttribute("aria-expanded", "false");
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      toggle(b, s);
    });
    grid.appendChild(b);
  });

  function clearOpenBtn() {
    openBtn.setAttribute("aria-expanded", "false");
    openBtn.removeAttribute("aria-describedby");
  }

  function toggle(btn, s) {
    if (openBtn === btn) { close(); return; }
    if (openBtn) clearOpenBtn();
    openBtn = btn;
    btn.setAttribute("aria-expanded", "true");
    btn.setAttribute("aria-describedby", "popover-desc");
    pop.hidden = false;
    pName.textContent = s.name;
    pDesc.textContent = s.desc;
    position(btn);
  }

  function position(btn) {
    const r = btn.getBoundingClientRect();
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    let left = r.left + r.width / 2 - pw / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
    let top = r.bottom + 6;
    if (top + ph > window.innerHeight - 8) top = r.top - ph - 6;
    if (top < 8) top = 8;
    pop.style.left = left + "px";
    pop.style.top = top + "px";
  }

  function close() {
    if (openBtn) clearOpenBtn();
    openBtn = null;
    pop.hidden = true;
  }

  document.addEventListener("click", (e) => {
    if (openBtn && !pop.contains(e.target) && !openBtn.contains(e.target)) close();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  window.addEventListener("scroll", close, { passive: true });
  window.addEventListener("resize", () => { if (openBtn) position(openBtn); });
}

function initTheme() {
  const btn = document.getElementById("theme-toggle");
  const root = document.documentElement;
  function label() {
    const isDark = root.dataset.theme === "dark";
    btn.textContent = isDark ? "☀" : "⏾";
    btn.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
  }
  label();
  btn.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch {}
    label();
  });
}

function initScrollSpy() {
  const links = [...document.querySelectorAll("#sidenav a")];

  const sections = links
    .map((a) => document.getElementById(a.dataset.target))
    .filter(Boolean);

  // Anchor clicks trigger scroll events before/while browser settles target.
  // During that window, scroll-spy can pick neighboring short sections instead
  // of clicked item, so click intent wins briefly.
  let ignoreScrollUntil = 0;

  function setActive(id) {
    links.forEach((a) => a.classList.toggle("active", a.dataset.target === id));
  }

  // Use a top anchor normally. Near the bottom, move it down with the remaining
  // scroll distance so short final sections still get their own active range.
  function updateActive() {
    if (performance.now() < ignoreScrollUntil) return;

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const remainingScroll = Math.max(0, maxScroll - window.scrollY);
    const anchorOffset = Math.max(80, window.innerHeight - remainingScroll);
    const anchor = window.scrollY + anchorOffset;
    let active = sections[0];

    for (const section of sections) {
      if (section.offsetTop > anchor) break;
      active = section;
    }

    setActive(active.id);
  }

  links.forEach((a) => {
    a.addEventListener("click", () => {
      ignoreScrollUntil = performance.now() + 500;
      setActive(a.dataset.target);
    });
  });

  updateActive();
  window.addEventListener("scroll", updateActive, { passive: true });
  window.addEventListener("resize", updateActive);
}

function initYear() {
  document.getElementById("year").textContent = new Date().getFullYear();
}

function initHashScroll() {
  const id = location.hash.slice(1);
  if (!id) return;

  const target = document.getElementById(id);
  if (!target) return;

  const scroll = () => requestAnimationFrame(() => target.scrollIntoView());
  scroll();
  window.addEventListener("load", scroll, { once: true });
}

initFractal();
initSkills();
initTheme();
initScrollSpy();
initYear();
initHashScroll();
