**Goal:** Refactor the application's UI to improve visual consistency and professional appearance.

## Files to Create:
- None

## Files to Modify:
- `frontend/src/components/layout/`
- `frontend/src/components/layout/TitleBar.tsx`
- `frontend/src/components/layout/StatusBar.tsx`

## Tasks:
1. **Style guide directive**
- Styling: You must exclusively use the pre-configured Tailwind CSS theme variables for all colors, spacing, fonts, etc. Do not use hardcoded values. The theme is defined in frontend/tailwind.config.js and variables are in frontend/src/index.css.

2. **Replace all emojis and unicode characters**
- Icons: You must replace all emojis and unicode characters (like '☀️', '🌙', '➖', '🗖', '✖') with icons from an installed icon pack.*
- Ensure correct icons are used for the theme toggle and window controls in the TitleBar.

3. **Component Review:**
- Review and refactor frontend/src/components/layout/AppLayout.tsx.
- Review and refactor frontend/src/components/layout/TitleBar.tsx.
- Review and refactor frontend/src/components/layout/StatusBar.tsx.
- Ensure consistent padding, margins, and component styling across the application.

4. **Verification:** 
- After making changes, run npm run build to ensure the application builds without any new warnings or errors.

