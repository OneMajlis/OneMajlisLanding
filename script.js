/**
 * OneMajlis — Production Interactive & Animation Engine
 * Features:
 *  - Headings word-by-word blur reveal (Hero immediate, others on scroll)
 *  - Count-up number animation with integer, currency (₦), and percent formatting
 *  - SVG line-draw for zig-zag underlines, chart flows, and connector lines
 *  - Hero orchestration (device slide-up, widgets entrance, avatars floating)
 *  - Demo device slide-up reveal
 *  - Mobile navigation and email forms validation
 */

(function () {
  "use strict";

  // Check user preference for reduced motion
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============================================================
     1. Mobile Menu
     ============================================================ */
  var navToggle = document.getElementById("navToggle");
  var mobileMenu = document.getElementById("mobileMenu");
  if (navToggle && mobileMenu) {
    navToggle.addEventListener("click", function () {
      var isOpen = mobileMenu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
    });
    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileMenu.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Open navigation menu");
      });
    });
  }

  /* ============================================================
     2. Email Capture Forms
     ============================================================ */
  function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  }

  function wireForm(formId, noteId) {
    var form = document.getElementById(formId);
    var note = document.getElementById(noteId);
    if (!form || !note) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector("input[type='email']");
      var val = input ? input.value.trim() : "";

      if (!isValidEmail(val)) {
        note.textContent = "Please enter a valid email address.";
        note.style.color = "#E03131";
        return;
      }

      note.textContent = "Welcome to OneMajlis! You're on the waitlist. Check your inbox soon.";
      note.style.color = "#107050";
      form.reset();
    });
  }
  wireForm("heroForm", "heroFormNote");

  // Full contact form wiring
  var contactForm = document.getElementById("contactForm");
  var contactNote = document.getElementById("contactFormNote");
  if (contactForm && contactNote) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var nameVal  = (contactForm.querySelector("#contactName")  || {}).value || "";
      var emailVal = (contactForm.querySelector("#contactEmail") || {}).value || "";
      var msgVal   = (contactForm.querySelector("#contactMessage")|| {}).value || "";

      if (!nameVal.trim()) {
        contactNote.textContent = "Please enter your full name.";
        contactNote.style.color = "#E03131";
        return;
      }
      if (!isValidEmail(emailVal)) {
        contactNote.textContent = "Please enter a valid email address.";
        contactNote.style.color = "#E03131";
        return;
      }
      if (!msgVal.trim()) {
        contactNote.textContent = "Please add a message.";
        contactNote.style.color = "#E03131";
        return;
      }
      contactNote.textContent = "Message received! Our team will be in touch shortly.";
      contactNote.style.color = "#107050";
      contactForm.reset();
    });
  }

  /* ============================================================
     3. Word-by-Word Blur Reveal for Headings (h1, h2, h3)
     ============================================================ */
  function wrapHeadingWords(element) {
    function processNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        var text = node.textContent;
        if (!text.trim()) return null;
        var tokens = text.split(/(\s+)/);
        var frag = document.createDocumentFragment();
        tokens.forEach(function (token) {
          if (!token) return;
          if (/^\s+$/.test(token)) {
            frag.appendChild(document.createTextNode(token));
          } else {
            var span = document.createElement("span");
            span.className = "word-reveal";
            span.textContent = token;
            frag.appendChild(span);
          }
        });
        return frag;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === "SVG" || node.classList.contains("visually-hidden") || node.classList.contains("word-reveal")) {
          return null;
        }
        var children = Array.from(node.childNodes);
        children.forEach(function (child) {
          var replacement = processNode(child);
          if (replacement) {
            node.replaceChild(replacement, child);
          }
        });
        return null;
      }
      return null;
    }

    processNode(element);
  }

  function revealWords(headingElement, baseDelay) {
    if (prefersReducedMotion) {
      headingElement.querySelectorAll(".word-reveal").forEach(function (w) {
        w.classList.add("is-revealed");
      });
      return;
    }
    var words = headingElement.querySelectorAll(".word-reveal");
    words.forEach(function (w, idx) {
      setTimeout(function () {
        w.classList.add("is-revealed");
      }, (baseDelay || 0) + idx * 45);
    });
  }

  var allHeadings = document.querySelectorAll("h1, h2, h3");
  var heroH1 = document.querySelector(".hero h1");

  allHeadings.forEach(function (h) {
    wrapHeadingWords(h);
  });

  // Hero H1: reveal immediately on page load
  if (heroH1) {
    setTimeout(function () {
      revealWords(heroH1, 120);
    }, 100);
  }

  // Other headings: reveal on scroll into view
  if ("IntersectionObserver" in window) {
    var headingObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          if (entry.target !== heroH1) {
            revealWords(entry.target, 50);
          }
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });

    allHeadings.forEach(function (h) {
      if (h !== heroH1) {
        headingObserver.observe(h);
      }
    });
  } else {
    allHeadings.forEach(function (h) {
      revealWords(h, 0);
    });
  }

  /* ============================================================
     4. Stroke-dash Line Drawing for Zig-zag Underlines (single path per SVG)
     ============================================================ */

  // Helper: measure and arm a single path element
  function armZigPath(path) {
    try {
      var len = path.getTotalLength();
      path.style.strokeDasharray = len + " " + len;
      path.style.strokeDashoffset = len;
    } catch (e) {}
  }

  // Helper: animate a path to fully drawn
  function drawZigPath(path, duration, delay) {
    duration = duration || "1.4s";
    delay    = delay    || "0s";
    if (prefersReducedMotion) { path.style.strokeDashoffset = "0"; return; }
    path.style.transition = "stroke-dashoffset " + duration + " cubic-bezier(0.16,1,0.3,1) " + delay;
    path.style.strokeDashoffset = "0";
  }

  // Arm all zigzag paths up-front
  document.querySelectorAll(".zig-line path").forEach(armZigPath);

  // Hero zigzag — fires on load (after a brief delay so title animation starts first)
  var heroZigLine = document.querySelector(".zig-line--hero");
  if (heroZigLine) {
    heroZigLine.querySelectorAll("path").forEach(function (path) {
      armZigPath(path);
      setTimeout(function () { drawZigPath(path, "1.6s", "0s"); }, 550);
    });
  }

  // All other zigzag lines — fire on scroll into view
  if ("IntersectionObserver" in window) {
    var zigObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        if (entry.target === heroZigLine) { observer.unobserve(entry.target); return; }
        entry.target.querySelectorAll("path").forEach(function (path) {
          armZigPath(path);
          setTimeout(function () { drawZigPath(path, "1.5s", "0s"); }, 200);
        });
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.3 });

    document.querySelectorAll(".zig-line").forEach(function (zl) {
      if (zl !== heroZigLine) zigObserver.observe(zl);
    });
  }

  /* ============================================================
     5. Universal Count-up Engine (Integer, Currency ₦, Percent)
     ============================================================ */
  function formatValue(value, format, prefix, suffix) {
    var p = prefix || "";
    var s = suffix || "";
    var numStr = "";

    if (format === "currency") {
      var parts = value.toFixed(2).split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      numStr = parts.join(".");
      return p + numStr + s;
    } else if (format === "percent") {
      numStr = value.toFixed(2) + "%";
      return p + numStr + s;
    } else if (format === "integer") {
      numStr = Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return p + numStr + s;
    }
    return p + value.toLocaleString() + s;
  }

  function animateCountUp(el, durationMs) {
    if (el.dataset.animated === "true") return;
    el.dataset.animated = "true";

    var target = parseFloat(el.dataset.target) || 0;
    var format = el.dataset.format || "integer";
    var prefix = el.dataset.prefix || "";
    var suffix = el.dataset.suffix || "";
    var duration = durationMs || 1800;

    if (prefersReducedMotion) {
      el.textContent = formatValue(target, format, prefix, suffix);
      return;
    }

    var startTime = null;

    function easeOutExpo(t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var elapsed = timestamp - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var currentVal = target * easeOutExpo(progress);

      el.textContent = formatValue(currentVal, format, prefix, suffix);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = formatValue(target, format, prefix, suffix);
      }
    }

    requestAnimationFrame(step);
  }

  function triggerCountUpsIn(container, delayMs) {
    var counts = container.querySelectorAll(".count-up");
    counts.forEach(function (countEl) {
      setTimeout(function () {
        animateCountUp(countEl);
      }, delayMs || 0);
    });
  }

  /* ============================================================
     6. Hero Sequence (Device, Widgets, Floating Avatars)
     ============================================================ */
  var heroStage = document.getElementById("heroStage");
  if (heroStage) {
    var heroDevice = heroStage.querySelector(".hero__device");
    var heroWidgets = heroStage.querySelectorAll(".hero__widget");
    var heroAvatars = heroStage.querySelectorAll(".avatar");

    var heroObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          if (heroDevice) heroDevice.classList.add("in-view");

          heroWidgets.forEach(function (w, i) {
            setTimeout(function () {
              w.classList.add("in-view");
              // Count up starts once widget settles into view
              triggerCountUpsIn(w, 350);
            }, 300 + i * 200);
          });

          heroAvatars.forEach(function (avatar, i) {
            var inDelay = 0.9 + i * 0.14;
            avatar.style.setProperty("--in-delay", inDelay + "s");
            avatar.style.setProperty("--loop-delay", "0.2s");
            avatar.classList.add("in-view");
          });

          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });

    heroObserver.observe(heroStage);
  }

  /* ============================================================
     7. Feature Sections (Order & Chart-flow Animations)
     ============================================================ */
  var featureArticles = document.querySelectorAll(".feature");
  if ("IntersectionObserver" in window) {
    var featureObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          // Add in-view to feature so CSS-defined .feature.in-view rules activate
          entry.target.classList.add("in-view");

          // Also imperatively animate chart flow paths (belt-and-suspenders)
          var chartFlow = entry.target.querySelector(".chart-flow");
          if (chartFlow) {
            chartFlow.classList.add("in-view");
            chartFlow.querySelectorAll('path[stroke="#107050"]').forEach(function (chartPath) {
              try {
                var length = chartPath.getTotalLength();
                chartPath.style.strokeDasharray = length;
                chartPath.style.strokeDashoffset = length;
                requestAnimationFrame(function () {
                  chartPath.style.transition = "stroke-dashoffset 2s cubic-bezier(.16, 1, .3, 1)";
                  chartPath.style.strokeDashoffset = "0";
                });
              } catch (e) {}
            });
          }

          // Trigger widget count-ups inside this feature
          triggerCountUpsIn(entry.target, 400);

          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });

    featureArticles.forEach(function (feat) {
      featureObserver.observe(feat);
    });
  }

  /* ============================================================
     8. Network Map: Animated Connector Lines & Badges
     ============================================================ */
  var networkSection = document.getElementById("network");
  if (networkSection && "IntersectionObserver" in window) {
    var networkObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          // CSS handles all animations (connector-dash, badge-pulse, map-float)
          // via .network.in-view selector — just add the class.
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    networkObserver.observe(networkSection);
  }

  /* ============================================================
     9. Demo Device Slide-Up Reveal
     ============================================================ */
  var demoSection = document.querySelector(".demo");
  if (demoSection && "IntersectionObserver" in window) {
    var demoObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          // Adding in-view to .demo activates .demo.in-view .demo__device CSS rule
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });

    demoObserver.observe(demoSection);
  }

  /* ============================================================
     10. Generic Scroll Reveal for Content Blocks
     ============================================================ */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    revealEls.forEach(function (el, i) {
      el.style.setProperty("--i", i % 6);
      revealObserver.observe(el);
    });
  }
})();
