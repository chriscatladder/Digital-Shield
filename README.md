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

## Known limitations
This is a rule-based (regex) detector, not an NLP/ML model - it matches
keyword patterns rather than understanding sentence meaning. Known gaps:

- **No negation handling.** A protective sentence like *"never share your
  password with anyone"* triggers the same rule as an actual request for a
  password, because the tool doesn't parse negation ("never", "don't").
- **Rigid time-phrase matching.** Urgency detection looks for patterns like
  "within 24 hours" but won't catch equivalent phrasing without a digit,
  e.g. "within the hour" or "протягом години".
- **Homoglyph domains are only caught incidentally.** Domains using
  look-alike Unicode characters (e.g. Cyrillic "і" instead of Latin "i")
  aren't handled by design - the ASCII-only domain-extraction regex happens
  to still flag some of these cases as a side effect, but this isn't
  reliable and shouldn't be treated as a real defense against homoglyph
  attacks.

These are inherent to a keyword-matching approach rather than implementation
bugs, and would require a genuine NLP/LLM-based classifier to resolve
properly - a natural next step beyond this prototype stage.


## Run it
Just open `index.html` in a browser. No build step, no dependencies beyond
Google Fonts (loaded via CDN).

## License
MIT
