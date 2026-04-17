---
"jsjianyingdraft": minor
---

Add migration-friendly path constructors for media segments.

- `VideoSegment` now supports creating directly from a file path string.
- `AudioSegment` now supports creating directly from a file path string.
- Add optional segment path constructor media options:
  - `materialOptions` (recommended)
  - `material_options` (deprecated alias)
