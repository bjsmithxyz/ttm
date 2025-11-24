# Echoes

An interactive digital art piece exploring the flow of language. Type English words to release their Mandarin echoes into a drifting void.

Open `index.html` in a modern browser. No build required.

## Experience

1. **Type** the English word displayed.
2. **Watch** as the Mandarin translation manifests and drifts into the background.
3. **Immerse** yourself in the accumulating cloud of language.

There are no scores, no timers, and no penalties. Mistakes simply fade away, leaving only the rhythm of typing and the visual echoes of your words.

## Running Locally

For the best experience (and to avoid CORS issues with local files), run a simple server:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000/index.html

## Customization

- **Words**: Edit `words.json` to add your own vocabulary.
- **Effects**: Modify `effects.js` to change how the echoes behave.
- **Style**: Tweak `styles.css` to alter the atmosphere.
