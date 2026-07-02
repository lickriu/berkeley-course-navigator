const CourseCache = {
  memoryCache: new Map(),

  STORAGE_KEY: "course_availability_cache",

  // 7 Days
  CACHE_EXPIRY: 7 * 24 * 60 * 60 * 1000,

  // Initialize cache from localStorage
  async init() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        // Load into memory cache, filtering out expired entries
        const now = Date.now();
        for (const [url, entry] of Object.entries(data)) {
          if (now - entry.timestamp < this.CACHE_EXPIRY) {
            this.memoryCache.set(url, entry);
          }
        }
      }
    } catch (e) {
      console.error("Course Navigator: Failed to load cache", e);
    }
  },

  get(url) {
    const entry = this.memoryCache.get(url);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.CACHE_EXPIRY) {
      this.memoryCache.delete(url);
      return null;
    }

    return entry.exists;
  },

  set(url, exists) {
    const entry = {
      exists,
      timestamp: Date.now(),
    };

    this.memoryCache.set(url, entry);
    this.persist();
  },

  persist() {
    try {
      const data = {};
      for (const [url, entry] of this.memoryCache.entries()) {
        data[url] = entry;
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Course Navigator: Failed to persist cache", e);
    }
  },

};

// Parse the current course URL
function parseCourseUrl() {
  const path = window.location.pathname;
  const match = path.match(
    /\/content\/(\d+)-(spring|summer|fall)-([^-]+)-([^-]+)-(.+)/
  );

  if (!match) return null;

  const [, year, semester, dept, course, sectionInfo] = match;

  return {
    year: parseInt(year),
    semester,
    dept,
    course,
    sectionInfo,
    fullCourseCode: `${dept.toUpperCase()} ${course.toUpperCase()}`,
  };
}

// Generate URL for a specific term
function generateCourseUrl(dept, course, sectionInfo, year, semester) {
  return `https://classes.berkeley.edu/content/${year}-${semester}-${dept}-${course}-${sectionInfo}`;
}

// Check if a course exists for a given term.
// Returns true/false, or null when the check itself failed (e.g. offline),
// so callers can distinguish "not offered" from "couldn't check".
async function checkCourseExists(url) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch (e) {
    return null;
  }
}

// Create the navigation overlay
function createOverlay(courseInfo) {
  const overlay = document.createElement("div");
  overlay.id = "course-navigator-overlay";
  overlay.innerHTML = `
    <div class="cn-header">
      <strong>${courseInfo.fullCourseCode}</strong>
      <button id="cn-toggle" title="Toggle navigator">−</button>
    </div>
    <div class="cn-content" id="cn-content"></div>
  `;

  document.body.appendChild(overlay);

  // Restore saved position (if the user moved it previously)
  restoreOverlayPosition(overlay);

  // Collapse/expand, remembering the choice across pages
  if (localStorage.getItem(OVERLAY_COLLAPSED_KEY) === "true") {
    setCollapsed(true);
  }
  document.getElementById("cn-toggle").addEventListener("click", () => {
    const content = document.getElementById("cn-content");
    setCollapsed(content.style.display !== "none");
  });

  // Make the overlay draggable by its header
  makeDraggable(overlay);

  return overlay;
}

const OVERLAY_POSITION_KEY = "course_navigator_position";
const OVERLAY_COLLAPSED_KEY = "course_navigator_collapsed";

// Collapse or expand the overlay content and persist the choice
function setCollapsed(collapsed) {
  const content = document.getElementById("cn-content");
  const button = document.getElementById("cn-toggle");
  content.style.display = collapsed ? "none" : "block";
  button.textContent = collapsed ? "+" : "−";
  try {
    localStorage.setItem(OVERLAY_COLLAPSED_KEY, String(collapsed));
  } catch (e) {
    console.error("Course Navigator: Failed to save collapsed state", e);
  }
}

// Clamp a position so the overlay stays within the viewport
function clampPosition(left, top, overlay) {
  const maxLeft = Math.max(0, window.innerWidth - overlay.offsetWidth);
  const maxTop = Math.max(0, window.innerHeight - overlay.offsetHeight);
  return {
    left: Math.min(Math.max(0, left), maxLeft),
    top: Math.min(Math.max(0, top), maxTop),
  };
}

// Position the overlay via left/top, overriding the default right/top CSS
function setOverlayPosition(overlay, left, top) {
  overlay.style.left = `${left}px`;
  overlay.style.top = `${top}px`;
  overlay.style.right = "auto";
}

// Restore a previously saved position from localStorage
function restoreOverlayPosition(overlay) {
  try {
    const stored = localStorage.getItem(OVERLAY_POSITION_KEY);
    if (!stored) return;
    const { left, top } = JSON.parse(stored);
    const clamped = clampPosition(left, top, overlay);
    setOverlayPosition(overlay, clamped.left, clamped.top);
  } catch (e) {
    console.error("Course Navigator: Failed to restore position", e);
  }
}

// Enable dragging the overlay around by its header
function makeDraggable(overlay) {
  const header = overlay.querySelector(".cn-header");
  if (!header) return;

  header.style.cursor = "grab";

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  const onMouseDown = (e) => {
    // Don't start a drag when interacting with the toggle button
    if (e.target.closest("#cn-toggle")) return;
    if (e.button !== 0) return;

    dragging = true;
    const rect = overlay.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left;
    startTop = rect.top;

    header.style.cursor = "grabbing";
    // Prevent text selection while dragging
    e.preventDefault();

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e) => {
    if (!dragging) return;
    const next = clampPosition(
      startLeft + (e.clientX - startX),
      startTop + (e.clientY - startY),
      overlay
    );
    setOverlayPosition(overlay, next.left, next.top);
  };

  const onMouseUp = () => {
    if (!dragging) return;
    dragging = false;
    header.style.cursor = "grab";

    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);

    // Persist the final position
    try {
      const rect = overlay.getBoundingClientRect();
      localStorage.setItem(
        OVERLAY_POSITION_KEY,
        JSON.stringify({ left: rect.left, top: rect.top })
      );
    } catch (e) {
      console.error("Course Navigator: Failed to save position", e);
    }
  };

  header.addEventListener("mousedown", onMouseDown);

  // Keep the overlay on-screen if the window is resized
  window.addEventListener("resize", () => {
    const rect = overlay.getBoundingClientRect();
    const clamped = clampPosition(rect.left, rect.top, overlay);
    setOverlayPosition(overlay, clamped.left, clamped.top);
  });
}

// Generate term buttons with availability checking
async function populateTerms(courseInfo) {
  const content = document.getElementById("cn-content");

  // Go one year past the current one so upcoming terms appear as soon
  // as Berkeley publishes them
  const years = [];
  for (let y = new Date().getFullYear() + 1; y >= 2016; y--) {
    years.push(y);
  }

  const semesters = [
    { name: "Spring", value: "spring" },
    { name: "Summer", value: "summer" },
    { name: "Fall", value: "fall" },
  ];

  let html = '<div class="cn-grid">';

  for (const year of years) {
    html += `<div class="cn-year-section">`;
    html += `<div class="cn-year-label">${year}</div>`;

    for (const sem of semesters) {
      const url = generateCourseUrl(
        courseInfo.dept,
        courseInfo.course,
        courseInfo.sectionInfo,
        year,
        sem.value
      );

      const isCurrent =
        year === courseInfo.year && sem.value === courseInfo.semester;
      const cssClass = isCurrent
        ? "cn-term-btn cn-current"
        : "cn-term-btn cn-checking";

      html += `
        <a href="${url}" 
           class="${cssClass}"
           data-url="${url}">
          ${sem.name}
        </a>
      `;
    }

    html += `</div>`;
  }

  html += "</div>";
  content.innerHTML = html;

  // Check availability for non-current terms (in background)
  checkAvailability();
}

// Cap concurrent HEAD requests to stay respectful to the server
const CHECK_CONCURRENCY = 4;

// Mark a button as available/unavailable
function applyAvailability(button, exists) {
  button.classList.remove("cn-checking", "cn-error");
  if (exists) {
    button.classList.add("cn-available");
  } else {
    button.classList.add("cn-unavailable");
    button.style.pointerEvents = "none";
  }
}

// Check a single term and update its button; caches only definitive results
async function checkTerm(button) {
  const url = button.getAttribute("data-url");
  const exists = await checkCourseExists(url);

  if (exists === null) {
    // Check failed (e.g. offline) — don't cache, allow retry
    button.classList.remove("cn-checking");
    button.classList.add("cn-error");
    button.title = "Couldn't check availability — click to retry";
    button.addEventListener("click", retryCheck, { once: true });
    return;
  }

  CourseCache.set(url, exists);
  applyAvailability(button, exists);
}

async function retryCheck(e) {
  e.preventDefault();
  const button = e.currentTarget;
  button.classList.remove("cn-error");
  button.classList.add("cn-checking");
  button.removeAttribute("title");
  await checkTerm(button);
}

// Check which terms actually have the course available
async function checkAvailability() {
  const buttons = document.querySelectorAll(".cn-term-btn.cn-checking");

  // Resolve cache hits instantly; queue the rest for fetching
  const toFetch = [];
  for (const button of buttons) {
    const cached = CourseCache.get(button.getAttribute("data-url"));
    if (cached !== null) {
      applyAvailability(button, cached);
    } else {
      toFetch.push(button);
    }
  }

  // Drain the queue with a few parallel workers
  let next = 0;
  const worker = async () => {
    while (next < toFetch.length) {
      await checkTerm(toFetch[next++]);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(CHECK_CONCURRENCY, toFetch.length) }, worker)
  );
}

// Initialize the extension
async function init() {
  // Initialize cache first
  await CourseCache.init();

  // Check if we're on a course page
  const courseInfo = parseCourseUrl();
  if (!courseInfo) return;

  // Create the overlay
  createOverlay(courseInfo);

  // Populate terms
  await populateTerms(courseInfo);
}

// Run when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
