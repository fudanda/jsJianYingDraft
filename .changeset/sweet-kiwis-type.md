---
"jsjianyingdraft": patch
---

Improve automation export error mapping by introducing a dedicated timeout error.

- Add `ExportTimeoutError`.
- Map controller export timeout failures to `ExportTimeoutError` instead of generic `AutomationError`.
