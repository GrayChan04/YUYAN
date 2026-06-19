# YUYAN Project Structure

This project is organized by game system, shared UI, data, and styles.

## Main Folders

```text
src/
  app/                  App shell and router
  components/common/    Shared UI components with no system-specific data
  components/animations Shared reusable animation components
  data/                 JSON data grouped by system
  pages/                Game systems and pages
  pages/templates/      Reusable page templates
  styles/               Global style entry, tokens, layout, themes
```

## Systems

Each system should have its own folder under `src/pages/`.

Current systems:

```text
src/pages/MoMoYouYan/
src/pages/HÖÐR/
```

Keep system folder names, page file names, and router names aligned. For
example, the HÖÐR system uses:

```text
src/pages/HÖÐR/HÖÐR.vue
route name: HÖÐR
route path: /HÖÐR
```

## Shared Template

All system pages should use:

```text
src/pages/templates/SystemPageTemplate.vue
```

The template provides:

- one main content area
- one fixed bottom footer area
- centered two-line footer text

System pages should only provide the upper content area.

## Style Management

Styles are layered as follows:

```text
src/styles/index.css
src/styles/reset.css
src/styles/tokens.css
src/styles/layout.css
src/styles/themes/MoMoYouYan.css
src/styles/themes/HÖÐR.css
```

Use `tokens.css` for global values such as fonts, base font sizes, spacing,
layer z-index, and footer sizing.

Use theme files for system-specific colors and typography variables. Shared
components should read variables like `--primary`, `--bg`, `--border-base`,
`--btn-width`, and `--text-base` instead of hardcoding system colors.

## Data Management

JSON data is grouped by system:

```text
src/data/MoMoYouYan/
src/data/HÖÐR/
```

When adding data, put it under the system that owns the gameplay. If multiple
systems must share the same data later, create `src/data/shared/`.

## Adding A New System

1. Create `src/pages/SystemName/SystemName.vue`.
2. Wrap the page in `SystemPageTemplate`.
3. Create `src/data/SystemName/` for JSON files.
4. Create `src/styles/themes/SystemName.css` if the system needs a theme.
5. Import the theme in `src/styles/index.css`.
6. Add a route in `src/app/router/index.js` with the same route name.
