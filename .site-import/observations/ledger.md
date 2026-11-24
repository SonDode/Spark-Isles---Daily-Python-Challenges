# Observation ledger — / (zh-TW home)
| Control | Viewport | Expected | Preview result | Status |
|---|---|---|---|---|
| Header icons (search, language, theme) | desktop | icons drawn | drawn after mask fix | pass |
| Language flyout (hover) | desktop | 繁體中文 / English / Español | same | pass |
| Theme switch | desktop+phone | html.dark toggles | toggles | pass |
| Hamburger → nav screen | phone | 3 links, language list, 外觀 switch | same (rebuilt from navscreen.html) | pass |
| Nav links / CTAs | both | same-site paths /spark-sprint-guide/zh-TW/{plan,setup,resources,event} | paths preserved on preview origin; pages not imported | pass (pages missing) |
| Search button | both | opens search dialog | not reproduced (no search index) | failed |
Screenshots: src_*/pre_* in this folder.
