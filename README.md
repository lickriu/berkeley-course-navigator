# Berkeley Course Navigator

A Chrome extension that adds a  overlay to Berkeley's course catalog, allowing you to quickly navigate across different semesters and years for the same course.

## Installation

### Chromium

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the `berkeley-course-navigator` folder
6. Visit any Berkeley course page to use

### Testing

Visit a course page like:

```
https://classes.berkeley.edu/content/2026-spring-compsci-61c-001-lec-001
```

The navigator should be in the top right corner

## Usage

- **Click on any semester**: Opens that term's page in a new tab
- **Current term**: Highlighted in blue (the page you're currently on)
- **Available terms**: Shown in white with blue border
- **Unavailable terms**: Grayed out and crossed out
- **Toggle button (−/+)**: Collapse/expand the navigator

## How It Works

1. **URL Parsing**: Extracts course info from Berkeley's URL pattern:

   ```
   /content/{YEAR}-{SEMESTER}-{DEPT}-{COURSE}-{SECTION}-{TYPE}-{NUM}
   ```

2. **Link Generation**: Creates URLs for all semester/year combinations

3. **Availability Check**: Makes HEAD requests to check if each term exists

   - Uses small delays (100ms) between requests to be respectful to servers

4. **UI Updates**: Shows which terms are available vs unavailable


## Notes

- The extension only works on `classes.berkeley.edu/content/*` pages
- Availability checking happens in the background after the UI loads
- No API key needed - works by scraping the public website

