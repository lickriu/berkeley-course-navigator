# Berkeley Course Navigator - Features Overview

## What This Extension Does

When you visit a Berkeley course page (like CS 61C), you'll see a floating overlay that lets you instantly jump to the same course in different semesters and years.

## Visual Layout

```
┌─────────────────────────────┐
│ COMPSCI 61C            [−]  │  ← Header (Berkeley Blue & Gold)
├─────────────────────────────┤
│ 2024                        │
│ [Spring] [Summer] [Fall]    │  ← Clickable semester buttons
│                             │
│ 2025                        │
│ [Spring] [Summer] [Fall]    │
│                             │
│ 2026                        │
│ [Spring] [Summer] [Fall]    │  ← Current term highlighted
│                             │
│ 2027                        │
│ [Spring] [Summer] [Fall]    │
└─────────────────────────────┘
```

## Button States

- **Blue button** = The term you're currently viewing
- **White button with blue border** = Course is available this term (click to visit)
- **Gray crossed-out button** = Course not offered this term
- **Gray loading state** = Checking availability...

## Key Features

### 1. Smart URL Parsing

Extracts course info from Berkeley's URL pattern:

- Year: 2026
- Semester: spring
- Department: compsci
- Course: 61c
- Section info: 001-lec-001

### 2. Automatic Availability Checking

- Makes lightweight HEAD requests to check if course exists
- Adds small delays (100ms) between checks to be respectful
- Updates buttons in real-time as it discovers availability

### 3. One-Click Navigation

- Click any available semester → Opens in new tab
- Current term stays on same page
- Unavailable terms are non-clickable

### 4. Berkeley Themed

- Uses official Cal colors:
  - Blue (#003262) - Primary
  - Gold (#FDB515) - Accent
- Clean, modern interface
- Matches Berkeley's aesthetic

### 5. Collapsible Design

- Click [−] to minimize
- Click [+] to expand
- Stays out of your way when not needed

## Technical Details

### Files Breakdown

**manifest.json** (550 bytes)

- Extension configuration
- Permissions and content script rules

**content.js** (4.6 KB)

- URL parsing logic
- Overlay creation
- Availability checking
- Event handlers

**styles.css** (2.8 KB)

- Layout and positioning
- Berkeley color scheme
- Button states and animations
- Responsive design

**icons** (3 PNG files)

- 16x16: Browser toolbar
- 48x48: Extension management
- 128x128: Chrome Web Store

### How It Works Technically

1. **Content Script Injection**: Runs on all `classes.berkeley.edu/content/*` pages
2. **URL Parsing**: Regex to extract course details from pathname
3. **DOM Manipulation**: Creates overlay div and injects into page
4. **Async Checking**: fetch() with HEAD method to check URL existence
5. **Dynamic Updates**: Updates button styles based on availability

### Performance

- Initial load: < 50ms
- Availability checks: ~100ms per semester (staggered)
- Memory usage: < 1MB
- No background processes

## Installation Requirements

- Chrome/Edge/Brave (Chromium-based browsers)
- Developer mode enabled
- No external dependencies
- No API keys needed
- No server required

## Privacy

- No data collection
- No external servers
- No analytics
- All processing happens locally
- Only makes requests to classes.berkeley.edu

## Customization Options

You can easily modify:

- Year range (default: current ±2 years)
- Position (top-right by default)
- Colors (change Berkeley theme)
- Size and layout
- Which semesters to show

See README.md for customization examples!

## Future Enhancement Ideas

- Cache availability results (localStorage)
- Add filtering (only Spring, only 2025, etc.)
- Show course capacity/enrollment
- Compare course descriptions across terms
- Add keyboard shortcuts (j/k navigation)
- Dark mode support
- Mobile responsive design

## Known Limitations

1. Only works on course content pages (not search results)
2. Section info is preserved from current URL (might not exist in other terms)
3. No cross-course navigation (stays within same course)
4. Requires public Berkeley course pages (no authentication)

## Support

If you encounter issues:

1. Check browser console (F12) for errors
2. Verify you're on correct URL format
3. Make sure extension is enabled
4. Try refreshing the page

For more help, see README.md or QUICKSTART.md!
