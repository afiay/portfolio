(() => {
  "use strict";

  const menuToggle = document.querySelector(".menu-toggle");
  const navigation = document.getElementById("primary-nav");
  const mobileBreakpoint = window.matchMedia("(max-width: 720px)");

  function setMenuOpen(isOpen) {
    if (!menuToggle || !navigation) return;
    const shouldOpen = Boolean(isOpen && mobileBreakpoint.matches);
    menuToggle.setAttribute("aria-expanded", String(shouldOpen));
    menuToggle.setAttribute("aria-label", shouldOpen ? "Close navigation menu" : "Open navigation menu");
    navigation.classList.toggle("is-open", shouldOpen);
    document.body.classList.toggle("menu-open", shouldOpen);
  }

  menuToggle?.addEventListener("click", () => {
    setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  navigation?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle?.getAttribute("aria-expanded") === "true") {
      setMenuOpen(false);
      menuToggle.focus();
    }
  });

  mobileBreakpoint.addEventListener?.("change", () => setMenuOpen(false));

  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const projectCards = Array.from(document.querySelectorAll("[data-category]"));

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selected = button.dataset.filter;
      filterButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      projectCards.forEach((card) => {
        const categories = (card.dataset.category || "").split(/\s+/);
        card.hidden = selected !== "all" && !categories.includes(selected);
      });
    });
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
