# ttM

A typing test web app for learning Mandarin characters. Type English words to reveal their Mandarin equivalents with animated effects.

Open `index.html` in a modern browser (Chrome/Firefox/Edge). No build required.

Tip: for module/fetch features open the folder over HTTP. From the project root you can run:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000/index.html

## Files

- `index.html` — main page with centered frame
- `styles.css` — styles, animations, and responsive design
- `script.js` — main logic (loads `words.json`, `sequences.json`, imports `effects.js`)
- `words.json` — English → Mandarin dictionary (supports spaces and alternatives)
- `sequences.json` — special word sequences and their effects
- `effects.js` — expandable effects module

## How It Works

1. A random English word (or phrase) is chosen and displayed at the top in gray.
2. Type the letters; correct ones turn green, wrong ones red briefly then reset.
3. On correct completion, a large Mandarin character fades in the center with effects, and the character is added to the bottom grid.
4. Special sequences trigger unique effects.
5. Effects can overlap for fast typing.

## Customization

### Adding Words

Edit `words.json` to add more English-Mandarin pairs. Supports spaces and slash-separated alternatives.

Example:

```json
{
  "hello": "你好",
  "good morning": "早上好",
  "he/she": "他/她"
}
```

### Adding Sequences

Edit `sequences.json` to add sequences like `{"word1 word2 word3": "effect-name"}`.

### Adding Effects

Edit `effects.js` to add new effects. Each effect is an async function `(mandarin, mandarinCascadeEl, CONFIG) => { ... }`.

Example:

```javascript
"new-effect": async (mandarin, mandarinCascadeEl, CONFIG) => {
  // Your effect code here
}
```

Then reference it in `sequences.json`.
