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
        console.log(
          `Course Navigator: Loaded ${this.memoryCache.size} cached entries`
        );
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

  clearExpired() {
    const now = Date.now();
    let cleared = 0;
    for (const [url, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > this.CACHE_EXPIRY) {
        this.memoryCache.delete(url);
        cleared++;
      }
    }
    if (cleared > 0) {
      this.persist();
      console.log(`Course Navigator: Cleared ${cleared} expired entries`);
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

// Check if a course exists for a given term (async)
async function checkCourseExists(url) {
  try {
    console.log(`[NETWORK REQUEST] Fetching: ${url}`);
    const response = await fetch(url, { method: "HEAD" });
    console.log(
      `[NETWORK RESPONSE] ${url} -> ${response.ok ? "EXISTS" : "NOT FOUND"}`
    );
    return response.ok;
  } catch (e) {
    console.log(`[NETWORK ERROR] ${url} -> ${e.message}`);
    return false;
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
    <div class="cn-content" id="cn-content">
      <div class="cn-loading">Loading terms...</div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Restore saved position (if the user moved it previously)
  restoreOverlayPosition(overlay);

  // Add toggle functionality
  document.getElementById("cn-toggle").addEventListener("click", () => {
    const content = document.getElementById("cn-content");
    const button = document.getElementById("cn-toggle");
    if (content.style.display === "none") {
      content.style.display = "block";
      button.textContent = "−";
    } else {
      content.style.display = "none";
      button.textContent = "+";
    }
  });

  // Make the overlay draggable by its header
  makeDraggable(overlay);

  return overlay;
}

const OVERLAY_POSITION_KEY = "course_navigator_position";

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

  const years = [];
  for (let y = 2026; y >= 2016; y--) {
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
  checkAvailability(courseInfo);
}

// Check which terms actually have the course available
async function checkAvailability(courseInfo) {
  const buttons = document.querySelectorAll(".cn-term-btn.cn-checking");

  let cacheHits = 0;
  let cacheMisses = 0;

  console.log(`\n========== COURSE AVAILABILITY CHECK ==========`);
  console.log(
    `Checking ${buttons.length} terms for ${courseInfo.fullCourseCode}`
  );

  // Check in batches to avoid overwhelming the server
  for (const button of buttons) {
    const url = button.getAttribute("data-url");

    // Try to get from cache first
    const cachedResult = CourseCache.get(url);

    let exists;
    if (cachedResult !== null) {
      // Cache hit - use cached value
      exists = cachedResult;
      cacheHits++;
      console.log(`[CACHE HIT] ${url} -> ${exists ? "EXISTS" : "NOT FOUND"}`);
    } else {
      // Cache miss - fetch from server
      console.log(`[CACHE MISS] ${url} - fetching from server...`);
      await new Promise((resolve) => setTimeout(resolve, 100));
      exists = await checkCourseExists(url);

      // Store in cache
      CourseCache.set(url, exists);
      cacheMisses++;
    }

    // Update button state
    if (exists) {
      button.classList.remove("cn-checking");
      button.classList.add("cn-available");
    } else {
      button.classList.remove("cn-checking");
      button.classList.add("cn-unavailable");
      button.style.pointerEvents = "none";
    }
  }

  console.log(`\n========== SUMMARY ==========`);
  console.log(`✓ Cache hits: ${cacheHits} (instant)`);
  console.log(`✗ Cache misses: ${cacheMisses} (network requests made)`);
  console.log(`Total cache size: ${CourseCache.memoryCache.size} entries`);
  console.log(`===============================\n`);
}

// Initialize the extension
async function init() {
  console.log("Course Navigator: Starting initialization...");

  // Initialize cache first
  await CourseCache.init();
  console.log(
    `Course Navigator: Cache loaded with ${CourseCache.memoryCache.size} entries`
  );

  // Check if we're on a course page
  const courseInfo = parseCourseUrl();

  if (!courseInfo) {
    console.log("Course Navigator: Not on a course page");
    return;
  }

  console.log("Course Navigator: Initialized for", courseInfo.fullCourseCode);

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
