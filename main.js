(() => {
  "use strict";

  /* ---------------------------------------------------------
     0. split headings into masked words for the reveal motion
  --------------------------------------------------------- */
  function prepReveal(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = "";
    const line = document.createElement("span");
    line.className = "line";
    words.forEach((w, i) => {
      const span = document.createElement("span");
      span.className = "word";
      span.style.setProperty("--i", i);
      span.textContent = w;
      line.appendChild(span);
      if (i < words.length - 1) line.appendChild(document.createTextNode("\u00A0"));
    });
    el.appendChild(line);
  }
  document.querySelectorAll(".reveal-lines").forEach(prepReveal);

  /* ---------------------------------------------------------
     0-1. skill marquee — duplicate the icon set once so the
     CSS loop (translateX(-50%)) is seamless. Edit the icon
     <img> list in index.html only once; this handles the rest.
  --------------------------------------------------------- */
  const skillTrack = document.getElementById("skillTrack");
  if (skillTrack) {
    skillTrack.innerHTML += skillTrack.innerHTML;
  }

  /* ---------------------------------------------------------
     1. fullpage engine — one section per scroll gesture
  --------------------------------------------------------- */
  const fp = document.getElementById("fullpage");
  const panels = Array.from(document.querySelectorAll(".panel"));
  const dots = Array.from(document.querySelectorAll(".dot"));
  const navLinks = Array.from(document.querySelectorAll("[data-nav]"));
  const arrowUp = document.getElementById("arrowUp");
  const arrowDown = document.getElementById("arrowDown");

  const isDesktop = () => window.matchMedia("(min-width: 861px)").matches;

  let current = 0;
  let animating = false;
  const LOCK_MS = 950;

  // dots / nav-highlight / arrow disabled-state only — NOT the
  // reveal animation (that's driven by the IntersectionObserver
  // below so it also works in the mobile stacked-scroll layout)
  function markCurrent(index) {
    current = index;
    dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
    navLinks.forEach((a) => {
      const idx = a.dataset.index ? Number(a.dataset.index) : 0;
      a.classList.toggle("is-active", idx === index);
    });
    arrowUp.disabled = index === 0;
    arrowDown.disabled = index === panels.length - 1;
  }

  function goTo(index) {
    index = Math.max(0, Math.min(panels.length - 1, index));
    if (!isDesktop()) {
      panels[index].scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (index === current || animating) return;
    animating = true;
    fp.style.transform = `translateY(-${index * 100}dvh)`;
    markCurrent(index);
    window.setTimeout(() => { animating = false; }, LOCK_MS);
  }

  // the reveal-lines motion + current-section bookkeeping is driven
  // by visibility, so it works the same under the desktop transform
  // and the mobile normal-scroll layout
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("is-active", entry.isIntersecting);
      if (entry.isIntersecting) {
        markCurrent(Number(entry.target.dataset.index || 0));
      }
    });
  }, { threshold: 0.55 });
  panels.forEach((p) => sectionObserver.observe(p));

  // wheel
  let wheelCooldown = false;
  window.addEventListener("wheel", (e) => {
    if (!isDesktop()) return;
    e.preventDefault();
    if (wheelCooldown || animating) return;
    if (Math.abs(e.deltaY) < 4) return;
    wheelCooldown = true;
    goTo(current + (e.deltaY > 0 ? 1 : -1));
    window.setTimeout(() => { wheelCooldown = false; }, LOCK_MS);
  }, { passive: false });

  // keyboard
  window.addEventListener("keydown", (e) => {
    if (!isDesktop()) return;
    if (["ArrowDown", "PageDown"].includes(e.key)) { e.preventDefault(); goTo(current + 1); }
    else if (["ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); goTo(current - 1); }
    else if (e.key === "Home") { e.preventDefault(); goTo(0); }
    else if (e.key === "End") { e.preventDefault(); goTo(panels.length - 1); }
  });

  // touch swipe
  let touchStartY = null;
  window.addEventListener("touchstart", (e) => {
    if (!isDesktop()) return;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  window.addEventListener("touchend", (e) => {
    if (!isDesktop() || touchStartY === null) return;
    const dy = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 40) goTo(current + (dy > 0 ? 1 : -1));
    touchStartY = null;
  }, { passive: true });

  // arrows + nav links
  arrowUp.addEventListener("click", () => goTo(current - 1));
  arrowDown.addEventListener("click", () => goTo(current + 1));
  navLinks.forEach((a) => {
    a.addEventListener("click", (e) => {
      if (!isDesktop()) return;
      e.preventDefault();
      goTo(Number(a.dataset.index || 0));
    });
  });
  dots.forEach((d, i) => d.addEventListener("click", () => goTo(i)));

  // keep layout correct across breakpoint changes / resize
  window.addEventListener("resize", () => {
    if (isDesktop()) {
      fp.style.transform = `translateY(-${current * 100}dvh)`;
    } else {
      fp.style.transform = "none";
    }
  });

  /* ---------------------------------------------------------
     2. work modal
  --------------------------------------------------------- */
  const overlay = document.getElementById("modalOverlay");
  const modalTitle = document.getElementById("modalTitle");
  const modalClose = document.getElementById("modalClose");

  function openModal(title) {
    modalTitle.textContent = title;
    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    overlay.classList.remove("is-open");
  }
  document.querySelectorAll(".work-card").forEach((card) => {
    card.addEventListener("click", () => openModal(card.dataset.modalTitle || ""));
  });
  modalClose.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

})();
