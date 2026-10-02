# Arabic is unprefixed in the URL and the browser language is never auto-detected

Arabic is the primary interface language, so it keeps the bare paths (`/courses`) and English lives
under `/en` (`/en/courses`); every existing link stays valid and shared English links open in
English. We do **not** infer the language from `Accept-Language`: most of our students are Saudi
and many run English-language phones, so detection would put Arabic speakers in English they never
chose. Only an explicit choice counts — the switcher writes a cookie, and a returning student who
chose English is sent from `/` to `/en`.

## Considered Options

- **Prefix every language (`/ar`, `/en`)** — rejected: breaks every existing link for no gain.
- **Cookie only, no URL segment** — rejected: links don't carry the language and search engines
  see one language.
- **next-intl's default full detection** — rejected for the reason above.
