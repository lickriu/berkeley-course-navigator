# Berkeley Course Navigator

A Chrome extension that adds a  overlay to Berkeley's course catalog, allowing you to quickly navigate across different semesters and years for the same course.

## Installation

### Chromium

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the `berkeley-course-navigator` folder
6. Done! Visit any Berkeley course page to see it in action

### Testing

Visit a course page like:

```
https://classes.berkeley.edu/content/2026-spring-compsci-61c-001-lec-001
```

You should see a navigator overlay in the top-right corner!

## Usage

- **Click on any semester**: Opens that term's page in a new tab
- **Current term**: Highlighted in Berkeley blue (the page you're currently on)
- **Available terms**: Shown in white with blue border
- **Unavailable terms**: Grayed out and crossed out
- **Toggle button (−/+)**: Collapse/expand the navigator

## Project Structure

```
berkeley-course-navigator/
├── manifest.json       # Extension configuration
├── content.js          # Main logic (URL parsing, overlay creation)
├── styles.css          # Styling for the overlay
├── icon16.png          # 16x16 icon (required)
├── icon48.png          # 48x48 icon (required)
├── icon128.png         # 128x128 icon (required)
└── README.md           # This file
```

## How It Works

1. **URL Parsing**: Extracts course info from Berkeley's URL pattern:

   ```
   /content/{YEAR}-{SEMESTER}-{DEPT}-{COURSE}-{SECTION}-{TYPE}-{NUM}
   ```

2. **Link Generation**: Creates URLs for all semester/year combinations

3. **Availability Check**: Makes HEAD requests to check if each term exists

   - Uses small delays (100ms) between requests to be respectful to servers

4. **UI Updates**: Shows which terms are available vs unavailable

## Customization

### Change the year range

Edit in `content.js` around line 70:

```javascript
// Currently shows 2 years past, 3 years future
for (let y = currentYear - 2; y <= currentYear + 3; y++) {
  years.push(y);
}
```

### Change colors

Edit `styles.css` - Berkeley colors are:

- Blue: `#003262`
- Gold: `#FDB515`

### Change position

Edit in `styles.css`:

```css
#course-navigator-overlay {
  top: 20px; /* Change vertical position */
  right: 20px; /* Change to 'left: 20px' for left side */
}
```

## Notes

- The extension only works on `classes.berkeley.edu/content/*` pages
- Availability checking happens in the background after the UI loads
- No API key needed - works by scraping the public website
- Respects Berkeley's servers with request delays

## Future Enhancements

Potential ideas:

- [ ] Cache availability results
- [ ] Add semester filtering (only show Fall, only show Spring, etc.)
- [ ] Show course description diff between semesters
- [ ] Quick enrollment stats if available
- [ ] Keyboard shortcuts

## Legal Note

This extension is for personal educational use. It doesn't violate Berkeley's systems - it simply makes navigating their public course catalog easier. Be respectful and don't abuse the availability checking feature.

## Troubleshooting

**Extension not showing up?**

- Make sure you're on a course content page (URL should match the pattern above)
- Check the browser console for errors (F12)

**Availability checking stuck?**

- Could be CORS issues or network problems
- The extension will still work, but you won't see availability indicators

**Overlay blocking content?**

- Click the minimize button (−)
- Or edit the CSS to change position/size

## License

MIT License - Feel free to modify and use as you wish!
