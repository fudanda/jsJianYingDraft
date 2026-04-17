---
"jsjianyingdraft": patch
---

Add Python-compatible `from_name` metadata enum lookup APIs.

- Add `from_name(name)` and `fromName(name)` to Python-style metadata enum exports in `jsjianyingdraft/metadata`.
- Support case-insensitive matching while ignoring spaces and underscores.
