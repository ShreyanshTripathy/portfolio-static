document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const splashIntro = document.querySelector("[data-splash-intro]");
  const introEnterDuration = 520;
  const introHoldDuration = 1700;
  const introExitDuration = 520;

  const finishIntro = () => {
    window.clearTimeout(window.__portfolioIntroFallback);
    root.classList.remove("intro-pending", "intro-visible", "intro-revealing");
    root.classList.add("intro-complete");
    if (splashIntro) splashIntro.hidden = true;
  };

  if (root.classList.contains("intro-pending") && splashIntro) {
    if (prefersReducedMotion) {
      finishIntro();
    } else {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          root.classList.add("intro-visible");
          window.setTimeout(() => {
            splashIntro.setAttribute("aria-hidden", "true");
            root.classList.add("intro-revealing");
            window.setTimeout(finishIntro, introExitDuration + 40);
          }, introEnterDuration + introHoldDuration);
        });
      });
    }
  } else if (splashIntro) {
    splashIntro.hidden = true;
  }

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

  const masthead = document.querySelector(".site-masthead");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const menuState = menuToggle?.querySelector("[data-menu-state]");
  const primaryNavigation = document.querySelector("#primary-navigation");

  if (masthead && menuToggle && primaryNavigation) {
    const mobileMenu = window.matchMedia("(max-width: 600px)");
    const setMenuOpen = (open, restoreFocus = false) => {
      masthead.dataset.menuOpen = String(open);
      menuToggle.setAttribute("aria-expanded", String(open));
      if (menuState) menuState.textContent = open ? "Close" : "Open";
      if (!open && restoreFocus) menuToggle.focus();
    };

    masthead.dataset.menuReady = "true";
    menuToggle.hidden = false;
    setMenuOpen(false);
    menuToggle.addEventListener("click", () => {
      setMenuOpen(masthead.dataset.menuOpen !== "true");
    });
    primaryNavigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenuOpen(false));
    });
    mobileMenu.addEventListener("change", (event) => {
      if (!event.matches) setMenuOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && masthead.dataset.menuOpen === "true") {
        setMenuOpen(false, true);
      }
    });
  }

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
        const scrollableRect = scrollable.getBoundingClientRect();
        const focusRect = focusEntry.getBoundingClientRect();
        const targetTop = scrollable.scrollTop
          + (focusRect.top - scrollableRect.top)
          - Math.max((scrollable.clientHeight - focusRect.height) / 2, 0);
        scrollable.scrollTo({ top: Math.max(targetTop, 0), behavior: prefersReducedMotion ? "auto" : "smooth" });
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

  document.querySelectorAll("[data-project-gallery]").forEach((gallery) => {
    const viewport = gallery.querySelector("[data-gallery-scroll]");
    const toggle = gallery.querySelector("[data-gallery-toggle]");
    const previous = gallery.querySelector("[data-gallery-scroll-prev]");
    const next = gallery.querySelector("[data-gallery-scroll-next]");
    const count = Number(gallery.dataset.galleryCount || 0);
    if (!viewport) return;

    const isExpanded = () => gallery.dataset.galleryExpanded === "true";
    const hasOverflow = () => viewport.scrollWidth > viewport.clientWidth + 2;
    const updateControls = () => {
      const expanded = isExpanded();
      const overflow = hasOverflow();
      if (previous) previous.disabled = expanded || !overflow || viewport.scrollLeft <= 2;
      if (next) next.disabled = expanded || !overflow || viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 2;
    };
    const moveGallery = (direction) => {
      viewport.scrollBy({
        left: direction * Math.max(viewport.clientWidth * 0.78, 220),
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    };

    previous?.addEventListener("click", () => moveGallery(-1));
    next?.addEventListener("click", () => moveGallery(1));
    viewport.addEventListener("scroll", updateControls, { passive: true });
    window.addEventListener("resize", () => requestAnimationFrame(updateControls));

    toggle?.addEventListener("click", () => {
      const expanded = !isExpanded();
      gallery.dataset.galleryExpanded = String(expanded);
      toggle.setAttribute("aria-expanded", String(expanded));
      toggle.textContent = expanded ? "Show fewer" : `View all ${count}`;
      if (!expanded) {
        viewport.scrollTo({ left: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
      }
      requestAnimationFrame(updateControls);
    });

    updateControls();
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
    const prevButton = shell.querySelector("[data-horizontal-timeline-prev]");
    const nextButton = shell.querySelector("[data-horizontal-timeline-next]");
    if (!strip || !marker) return;

    const shouldAutoMove = shell.dataset.horizontalTimelineAuto !== "false";
    const autoSpeed = shell.dataset.horizontalTimelineAuto === "true" ? 0.12 : 0.055;
    let direction = 1;
    let isInteracting = false;
    let idleTimer = 0;
    let lastFrame = performance.now();

    const maxScroll = () => Math.max(strip.scrollWidth - strip.clientWidth, 1);
    const hasOverflow = () => strip.scrollWidth > strip.clientWidth + 2;
    const updateMarker = () => {
      const progress = strip.scrollLeft / maxScroll();
      marker.style.left = `${Math.max(0, Math.min(progress, 1)) * 100}%`;
    };
    const moveBy = (amount, behavior = "auto") => {
      if (!hasOverflow()) return;
      strip.scrollBy({ left: amount, behavior });
      direction = amount >= 0 ? 1 : -1;
      requestAnimationFrame(updateMarker);
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
      if (shouldAutoMove && !isInteracting && hasOverflow()) {
        strip.scrollLeft += direction * delta * autoSpeed;
        if (strip.scrollLeft >= maxScroll() - 1) direction = -1;
        if (strip.scrollLeft <= 1) direction = 1;
        updateMarker();
      }
      requestAnimationFrame(tick);
    };

    strip.addEventListener("scroll", updateMarker, { passive: true });
    shell.addEventListener("wheel", (event) => {
      if (!hasOverflow()) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!delta) return;
      event.preventDefault();
      pause();
      const unit = event.deltaMode === 1 ? 28 : event.deltaMode === 2 ? strip.clientWidth : 1;
      moveBy(delta * unit, "auto");
      resumeSoon();
    }, { passive: false });
    prevButton?.addEventListener("click", () => {
      pause();
      moveBy(-Math.max(strip.clientWidth * 0.72, 220), prefersReducedMotion ? "auto" : "smooth");
      resumeSoon();
    });
    nextButton?.addEventListener("click", () => {
      pause();
      moveBy(Math.max(strip.clientWidth * 0.72, 220), prefersReducedMotion ? "auto" : "smooth");
      resumeSoon();
    });
    strip.addEventListener("touchstart", pause, { passive: true });
    strip.addEventListener("touchend", resumeSoon, { passive: true });
    window.addEventListener("resize", () => requestAnimationFrame(updateMarker));
    window.addEventListener("timeline:update", () => requestAnimationFrame(updateMarker));

    updateMarker();
    requestAnimationFrame(tick);
    if (shouldAutoMove) {
      window.setInterval(() => {
        if (isInteracting || !hasOverflow()) return;
        strip.scrollLeft += direction * 1.6;
        if (strip.scrollLeft >= maxScroll() - 1) direction = -1;
        if (strip.scrollLeft <= 1) direction = 1;
        updateMarker();
      }, 48);
    }
  });
});
