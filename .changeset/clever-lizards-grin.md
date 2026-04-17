---
"jsjianyingdraft": minor
---

Improve `importSrt` migration compatibility with pyJianYingDraft advanced options.

- Add `styleReference` and `clipSettings` options to `importSrt`.
- Add deprecated snake_case aliases for `importSrt` options:
  - `time_offset`
  - `text_style`
  - `style_reference`
  - `clip_settings`
- Align clip-settings behavior with pyJianYingDraft:
  - with `styleReference` and no `clipSettings`, template clip settings are not copied;
  - with `clipSettings: null`, template clip settings are used.
