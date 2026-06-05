
# Murder on the Crimson Carriage

A static, mobile-first digital murder mystery dinner game.

Built to test the latest mystery-dinner research findings:

- Solo browser mystery with optional family/live reveal.
- Train-car timeline component.
- Clue-gated suspect questions.
- Notebook and hint tracker.
- Structured final accusation scoring.
- Host kit section for dinner/Zoom-style play.
- Public suspect cards avoid spoiler fields.

## Local test

```bash
python3 -m unittest tests/test_case.py
python3 -m http.server 8127
```

Open `http://127.0.0.1:8127/`.
