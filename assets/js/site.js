document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const persistTheme = (theme) => {
    try {
      localStorage.setItem("portfolio-theme", theme);
    } catch (error) {
      // Ignore storage failures and continue with the in-memory theme state.
    }
  };

  const applyTheme = (theme, shouldPersist = false) => {
    const isDark = theme !== "light";
    root.dataset.theme = isDark ? "dark" : "light";
    root.classList.toggle("dark", isDark);
    root.style.colorScheme = isDark ? "dark" : "light";

    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", String(isDark));
      themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    }

    if (shouldPersist) {
      persistTheme(isDark ? "dark" : "light");
    }
  };

  applyTheme(root.dataset.theme === "light" ? "light" : "dark");
  themeToggle?.addEventListener("click", () => {
    applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
  });

  const syncScrollableFade = (shell) => {
    const scrollable = shell.querySelector("[data-timeline-scroll]");
    if (!scrollable) return;

    const atTop = scrollable.scrollTop <= 2;
    const atBottom = scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 2;
    shell.classList.toggle("is-at-top", atTop);
    shell.classList.toggle("is-at-bottom", atBottom);
  };

  document.querySelectorAll("[data-expandable-trigger]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const content = trigger.parentElement.querySelector("[data-expandable-content]");
      const ellipsis = trigger.parentElement.querySelector("[data-expandable-ellipsis]");
      if (!content) return;
      const isHidden = content.classList.contains("hidden");
      content.classList.toggle("hidden");
      ellipsis?.classList.toggle("hidden", isHidden);
      trigger.textContent = isHidden ? trigger.dataset.collapseLabel : trigger.dataset.expandLabel;
    });
  });

  document.querySelectorAll("[data-scroll-fade]").forEach((shell) => {
    const scrollable = shell.querySelector("[data-timeline-scroll]");
    if (!scrollable) return;

    syncScrollableFade(shell);
    scrollable.addEventListener("scroll", () => syncScrollableFade(shell), { passive: true });

    const focusEntry = scrollable.querySelector("[data-timeline-focus]");
    if (focusEntry) {
      requestAnimationFrame(() => {
        focusEntry.scrollIntoView({ block: "nearest", behavior: prefersReducedMotion ? "auto" : "smooth" });
        syncScrollableFade(shell);
      });
    }
  });

  document.querySelectorAll("tr[data-row-link]").forEach((row) => {
    row.addEventListener("click", (event) => {
      if (event.target.closest("a, button, input, select, textarea, label")) {
        return;
      }
      window.location.href = row.dataset.rowLink;
    });
  });

  const lightbox = document.querySelector("[data-lightbox]");
  const lightboxDialog = document.querySelector("[data-lightbox-dialog]");
  const lightboxImage = document.querySelector("[data-lightbox-image]");
  const lightboxCaption = document.querySelector("[data-lightbox-caption]");
  const lightboxClose = document.querySelector("[data-lightbox-close]");
  const galleryItems = [...document.querySelectorAll("[data-gallery-item]")];
  let currentIndex = 0;
  let lastFocusedElement = null;

  const getFocusableElements = () => {
    if (!lightboxDialog) return [];
    return [...lightboxDialog.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])')];
  };

  const openLightbox = (index) => {
    if (!lightbox || !galleryItems[index]) return;
    currentIndex = index;
    const trigger = galleryItems[index];
    lastFocusedElement = document.activeElement;
    lightboxImage.src = trigger.dataset.imageSrc;
    lightboxImage.alt = trigger.dataset.imageCaption || "Project image";
    lightboxCaption.textContent = trigger.dataset.imageCaption || "";
    lightbox.hidden = false;
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const focusable = getFocusableElements();
    if (focusable[0]) {
      focusable[0].focus();
    }
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.hidden = true;
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  };

  const stepLightbox = (delta) => {
    if (!galleryItems.length) return;
    currentIndex = (currentIndex + delta + galleryItems.length) % galleryItems.length;
    openLightbox(currentIndex);
  };

  galleryItems.forEach((item, index) => {
    item.addEventListener("click", () => openLightbox(index));
  });

  lightboxClose?.addEventListener("click", closeLightbox);
  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.querySelector("[data-lightbox-prev]")?.addEventListener("click", () => stepLightbox(-1));
  document.querySelector("[data-lightbox-next]")?.addEventListener("click", () => stepLightbox(1));

  document.addEventListener("keydown", (event) => {
    if (!lightbox || lightbox.hidden) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") stepLightbox(-1);
    if (event.key === "ArrowRight") stepLightbox(1);
    if (event.key === "Tab") {
      const focusable = getFocusableElements();
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  const timelineMarker = document.querySelector("[data-timeline-marker]");
  const timelineAxis = document.querySelector("[data-timeline-axis]");

  if (timelineMarker && timelineAxis) {
    const updateTimelineMarker = () => {
      const rect = timelineAxis.getBoundingClientRect();
      const viewportAnchor = window.innerHeight * 0.38;
      const progress = Math.min(Math.max((viewportAnchor - rect.top) / Math.max(rect.height, 1), 0), 1);
      timelineMarker.style.setProperty("--timeline-progress", String(progress));
    };

    updateTimelineMarker();
    window.addEventListener("scroll", updateTimelineMarker, { passive: true });
    window.addEventListener("resize", updateTimelineMarker);
  }

  document.querySelectorAll("[data-horizontal-timeline]").forEach((shell) => {
    const strip = shell.querySelector("[data-horizontal-timeline-strip]");
    const marker = shell.querySelector("[data-horizontal-timeline-marker]");
    if (!strip || !marker) return;

    let direction = 1;
    let isInteracting = false;
    let idleTimer = 0;
    let lastFrame = performance.now();

    const maxScroll = () => Math.max(strip.scrollWidth - strip.clientWidth, 1);
    const updateMarker = () => {
      const progress = strip.scrollLeft / maxScroll();
      marker.style.left = `${Math.max(0, Math.min(progress, 1)) * 100}%`;
    };
    const pause = () => {
      isInteracting = true;
      window.clearTimeout(idleTimer);
    };
    const resumeSoon = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        isInteracting = false;
        lastFrame = performance.now();
      }, 900);
    };
    const tick = (now) => {
      const delta = Math.min(now - lastFrame, 48);
      lastFrame = now;
      if (!prefersReducedMotion && !isInteracting && strip.scrollWidth > strip.clientWidth) {
        strip.scrollLeft += direction * delta * 0.045;
        if (strip.scrollLeft >= maxScroll() - 1) direction = -1;
        if (strip.scrollLeft <= 1) direction = 1;
        updateMarker();
      }
      requestAnimationFrame(tick);
    };

    strip.addEventListener("scroll", updateMarker, { passive: true });
    shell.addEventListener("wheel", (event) => {
      if (strip.scrollWidth <= strip.clientWidth) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!delta) return;
      event.preventDefault();
      pause();
      strip.scrollLeft += delta;
      direction = delta >= 0 ? 1 : -1;
      updateMarker();
      resumeSoon();
    }, { passive: false });
    strip.addEventListener("touchstart", pause, { passive: true });
    strip.addEventListener("touchend", resumeSoon, { passive: true });
    window.addEventListener("resize", updateMarker);
    window.addEventListener("timeline:update", () => requestAnimationFrame(updateMarker));

    updateMarker();
    requestAnimationFrame(tick);
  });
});
