# EyeZen mobile browser navigation acceptance — v1.2.1

The desktop application has a minimum window width, but the **web edition** also supports narrow browser viewports. In v1.2.0, the sidebar disappeared below 680 CSS pixels while the body still required 600 pixels, leaving navigation inaccessible and causing horizontal scrolling on phones.

## Expected behavior

- At widths **under 681 CSS pixels**, the sidebar is hidden and a labelled **EyeZen section** selector is visible in the top bar.
- The selector lists all ten application sections and shows the current section.
- Choosing a section navigates to it without resetting settings or profiles.
- The top-bar Settings button remains reachable by keyboard, touch and mouse.
- The entire app no longer has a forced 600px minimum width.
- At desktop widths, the ordinary sidebar remains available and the mobile selector is hidden.
- At 681–1020px, sidebar icons retain accessible names and hover titles even though their visual text labels are hidden.

## Real-browser checks (pending)

- [ ] Chrome/Chromium at 320px, 375px, 390px, 600px and 680px
- [ ] Firefox at 320px and 680px
- [ ] Safari/iOS if test hardware is available
- [ ] At 681px and above, the normal sidebar navigation is usable; at 681–1020px, verify the icon-only navigation has screen-reader labels and hover titles
- [ ] Keyboard-only focus reaches the selector; all options are reachable and change pages
- [ ] Native screen reader announces the selector's accessible name and selected section
- [ ] Zoom to 200% and enable enlarged browser fonts; labels and controls should remain legible
- [ ] Check long profile names, imported data warnings and recovery screen at 320px
- [ ] Confirm no application-wide unintended horizontal overflow at 320px
- [ ] Confirm theme, settings and profile changes persist after switching sections and reloading
- [ ] First visit: keyboard focus enters the onboarding dialog automatically rather than starting behind the dialog
- [ ] Tab from the dialog's final action wraps to its first control; Shift+Tab from the first control wraps to the final action
- [ ] Screen-reader focus and keyboard navigation cannot reach background navigation while onboarding is open
- [ ] Press Escape or activate Skip: onboarding closes and keyboard focus returns to the previously focused element if it is still present
- [ ] Reopen onboarding from Settings and verify theme choices are announced as selected/unselected

Passing compilation or Vitest alone is not proof of these real-browser behaviors. Record actual viewport, browser version, observed results and screenshots only where they do not contain private information.
