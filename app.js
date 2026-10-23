(() => {
  "use strict";

  const menuToggle = document.querySelector(".menu-toggle");
  const navigation = document.getElementById("primary-nav");
  const mobileBreakpoint = window.matchMedia("(max-width: 820px)");

  function setMenuOpen(isOpen, focusFirstLink = false) {
    if (!menuToggle || !navigation) return;
    const shouldOpen = Boolean(isOpen && mobileBreakpoint.matches);
    menuToggle.setAttribute("aria-expanded", String(shouldOpen));
    menuToggle.setAttribute("aria-label", shouldOpen ? "Close navigation menu" : "Open navigation menu");
    navigation.classList.toggle("is-open", shouldOpen);
    document.body.classList.toggle("menu-open", shouldOpen);
    if (shouldOpen && focusFirstLink) navigation.querySelectorAll("a")[0]?.focus();
  }

  menuToggle?.addEventListener("click", () => {
    setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true", true);
  });

  navigation?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (menuToggle?.getAttribute("aria-expanded") !== "true") return;
    if (event.key === "Escape") {
      setMenuOpen(false);
      menuToggle.focus();
    }
    if (event.key === "Tab" && navigation) {
      const focusTargets = [menuToggle, ...navigation.querySelectorAll("a")];
      const position = focusTargets.indexOf(document.activeElement);
      const next = event.shiftKey ? position - 1 : position + 1;
      if (position === -1 || next < 0 || next >= focusTargets.length) {
        event.preventDefault();
        focusTargets[position === -1 ? 1 : (next < 0 ? focusTargets.length - 1 : 0)].focus();
      }
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (menuToggle?.getAttribute("aria-expanded") === "true" &&
        !menuToggle.contains(event.target) && !navigation?.contains(event.target)) {
      setMenuOpen(false);
    }
  });

  mobileBreakpoint.addEventListener?.("change", () => setMenuOpen(false));

  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const projectCards = Array.from(document.querySelectorAll("[data-category]"));
  const projectGrid = document.getElementById("project-grid");
  const labView = document.getElementById("labs");

  function selectProjectView(selected) {
    filterButtons.forEach((item) => {
      const active = item.dataset.filter === selected;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    const showingLabs = selected === "labs";
    if (projectGrid) projectGrid.hidden = showingLabs;
    if (labView) labView.hidden = !showingLabs;
    projectCards.forEach((card) => {
      const categories = (card.dataset.category || "").split(/\s+/);
      card.hidden = showingLabs || (selected !== "all" && !categories.includes(selected));
    });
    if (typeof document.dispatchEvent === "function") {
      document.dispatchEvent(new Event("portfolio:labs-view-change"));
    }
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => selectProjectView(button.dataset.filter));
  });

  // The original #labs navigation and copied ?lab=...#labs URLs must reveal
  // the now-embedded explorer before the browser scrolls to its anchor.
  document.querySelectorAll('a[href="#labs"]').forEach((link) => {
    link.addEventListener("click", () => selectProjectView("labs"));
  });
  document.querySelectorAll('a[href="#projects"]').forEach((link) => {
    link.addEventListener("click", () => selectProjectView("all"));
  });
  if (window.location?.hash === "#labs" || /(?:^|[?&])lab=lab-0[123](?:&|$)/.test(window.location?.search || "")) {
    selectProjectView("labs");
    if (window.location?.hash === "#labs") {
      // Some browsers try their initial anchor scroll before a hidden view opens.
      window.requestAnimationFrame?.(() => labView?.scrollIntoView?.({ block: "start" }));
    }
  }
  window.addEventListener?.("hashchange", () => {
    if (window.location?.hash === "#labs") selectProjectView("labs");
    if (window.location?.hash === "#projects") selectProjectView("all");
  });

  const copyEmailButton = document.querySelector("[data-copy-email]");
  const copyStatus = document.getElementById("copy-status");

  async function copyEmailAddress(address) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(address);
      return true;
    }
    const temporaryInput = document.createElement("textarea");
    temporaryInput.value = address;
    temporaryInput.setAttribute("readonly", "");
    temporaryInput.style.position = "fixed";
    temporaryInput.style.opacity = "0";
    document.body.append(temporaryInput);
    temporaryInput.select();
    try { return document.execCommand("copy"); }
    finally { temporaryInput.remove(); }
  }

  copyEmailButton?.addEventListener("click", async () => {
    if (!copyStatus) return;
    try {
      const copied = await copyEmailAddress(copyEmailButton.dataset.copyEmail);
      copyStatus.textContent = copied ? "Email address copied" : "Could not copy. Please select the email address.";
    } catch {
      copyStatus.textContent = "Could not copy. Please select the email address.";
    }
  });

  if ("IntersectionObserver" in window && navigation) {
    const links = Array.from(navigation.querySelectorAll('a[href^="#"]:not(.nav-cta)'));
    const sections = links.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          const current = link.getAttribute("href") === "#" + entry.target.id;
          link.classList.toggle("is-current", current);
          if (current) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-20% 0px -65% 0px", threshold: 0 });
    sections.forEach((section) => observer.observe(section));
  }

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
