# Digital Shield - Anti-Fraud Message Analyzer (Prototype)

A rule-based prototype that analyzes suspicious SMS/messenger text and explains,
in plain language, why it resembles a scam. Built in response to the sharp rise
in AI-assisted phishing and fake-payout scams targeting Ukrainian citizens
(fake Diia clones, fake energy compensation payouts, SIM-swap attempts) in 2025-2026.

## Why this exists
Existing tools either check a single URL (e.g. link-only phishing checkers) or are
built for enterprise email filtering. Digital Shield targets the message itself,
in plain non-technical language, for people who are not tech-savvy - particularly
elderly users and internally displaced people, who are disproportionately targeted.

## Features
- 7 detection categories: phishing links, look-alike/typosquatted domains
  (Levenshtein distance check), requests for sensitive data, SIM-swap attempts,
  fake payouts/compensation, urgency pressure, hijacked-contact money requests.
- Plain-language explanation per flag, not just a score.
- UA / EN toggle.
- Session check history.

## Status
Early rule-based prototype, built as part of an application project. Not a
production security tool - always verify suspicious messages through official
channels regardless of this tool's output.

## Run it
Just open `index.html` in a browser. No build step, no dependencies beyond
Google Fonts (loaded via CDN).

## License
MIT
