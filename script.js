// Load words.json at runtime (fetch) so the page works when served and shows helpful errors
import { effects } from './effects.js';

const CONFIG = {
  defaultEffect: 'drift', // New default effect
  // Animation timings
  fadeOutDuration: 500,
  fadeInDuration: 500,
  wrongLetterResetDelay: 200, // Fast reset for flow
  animationApplyDelay: 10,
  // Sequence detection
  maxSequenceLength: 5,
  // Cascade cleanup
  maxCascadeElements: 100 // Allow more elements for the "cloud" effect
}

const englishWordEl = document.getElementById('english-word');
const mandarinCascadeEl = document.getElementById('mandarin-cascade');
const completedGridEl = document.getElementById('completed-grid');

let mapping = {}; // will be populated from words.json
let current = { eng: '', mand: '', chars: [], typed: '' };
let completedWords = [];
let specialEffect = null;
let sequences = {};
let lastEng = null;
let isChangingWord = false; // Prevent race conditions
let wrongLetterTimeout = null;

function pickRandomWord() {
  const keys = Object.keys(mapping);
  if (!keys.length) return { eng: '(no-words)', mand: '' };
  let k, eng;
  do {
    k = keys[Math.floor(Math.random() * keys.length)];
    eng = k;
    if (k.includes('/')) {
      const alts = k.split('/');
      eng = alts[Math.floor(Math.random() * alts.length)];
    }
  } while (eng === lastEng && keys.length > 1);
  lastEng = eng;
  return { eng: eng, mand: mapping[k] };
}

function renderEnglish() {
  if (!englishWordEl) return; // Safety check
  englishWordEl.innerHTML = '';
  current.chars.forEach((ch, i) => {
    const span = document.createElement('span');
    span.className = 'letter';
    span.textContent = ch;
    if (i < current.typed.length) {
      if (current.typed[i] === ch) {
        span.classList.add('correct');
      } else {
        span.classList.add('incorrect');
      }
    }
    englishWordEl.appendChild(span);
  })
}

async function changeToNextWord() {
  // fade out current word downwards
  englishWordEl.classList.add('fade-out-down');
  await new Promise(r => setTimeout(r, CONFIG.fadeOutDuration));
  englishWordEl.classList.remove('fade-out-down');
  // prepare next word
  pickAndRender();
  // fade in from top - set initial state, then animate in
  await new Promise(r => requestAnimationFrame(r));
  englishWordEl.classList.add('fade-in-up');
  // Force reflow to ensure class is applied
  await new Promise(r => requestAnimationFrame(r));
  // Remove class to trigger transition animation
  englishWordEl.classList.remove('fade-in-up');
  // Wait for animation to complete
  await new Promise(r => setTimeout(r, CONFIG.fadeInDuration));
}

function onKey(e) {
  // Prevent input during word change animation
  if (isChangingWord) return;
  // allow input even during cascade
  if (e.key.length !== 1) return; // ignore special keys

  // Clear any pending wrong letter reset
  if (wrongLetterTimeout) {
    clearTimeout(wrongLetterTimeout);
    wrongLetterTimeout = null;
  }

  current.typed += e.key;
  // compare and keep only up to word length
  if (current.typed.length > current.chars.length) current.typed = current.typed.slice(0, current.chars.length);

  renderEnglish();

  // Check if word is complete
  const isCorrect = current.typed === current.chars.join('');

  if (isCorrect) {
    const mandarinToShow = current.mand;
    // Prevent further input during transition
    isChangingWord = true;
    current.typed = '';
    // Trigger word change and effects
    changeToNextWord().then(() => {
      isChangingWord = false;
    });
    if (mandarinToShow) {
      addToCompletedGrid(mandarinToShow);
      triggerMandarinCascade(mandarinToShow);
    }
  } else {
    // If the last typed letter is wrong, schedule a reset
    const lastIndex = current.typed.length - 1;
    if (lastIndex >= 0 && current.typed[lastIndex] !== current.chars[lastIndex]) {
      wrongLetterTimeout = setTimeout(() => {
        // Remove the last character if it's still there and wrong
        // We just pop the last char to let them try again
        if (!isChangingWord && current.typed.length > 0) {
          current.typed = current.typed.slice(0, -1);
          renderEnglish();
        }
        wrongLetterTimeout = null;
      }, CONFIG.wrongLetterResetDelay);
    }
  }
}

// Handle backspace
function onKeyDown(e) {
  if (isChangingWord) return;
  if (e.key === 'Backspace') {
    current.typed = current.typed.slice(0, -1);
    renderEnglish();
  }
}

function cleanupOldCascadeElements() {
  // Remove old cascade elements to prevent memory leaks
  if (!mandarinCascadeEl) return; // Safety check
  const allLines = Array.from(mandarinCascadeEl.querySelectorAll('.mandarin-echo'));
  if (allLines.length > CONFIG.maxCascadeElements) {
    // Remove oldest elements (first in DOM)
    const toRemove = allLines.slice(0, allLines.length - CONFIG.maxCascadeElements);
    toRemove.forEach(el => {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
  }
}

async function triggerMandarinCascade(mandarin) {
  if (!mandarin) return; // Skip if no mandarin character
  cleanupOldCascadeElements();
  const effectName = specialEffect ? specialEffect.effect : CONFIG.defaultEffect;
  // Validate effect exists
  if (!effects[effectName]) {
    console.warn(`Effect "${effectName}" not found, using default effect`);
    if (effects[CONFIG.defaultEffect]) {
      await effects[CONFIG.defaultEffect](mandarin, mandarinCascadeEl, CONFIG);
    }
  } else {
    await effects[effectName](mandarin, mandarinCascadeEl, CONFIG);
  }
}

function addToCompletedGrid(ch) {
  if (!ch) return; // Skip if no mandarin character
  const span = document.createElement('div');
  span.className = 'completed-char';
  span.textContent = ch;
  // Insert at beginning so rows grow upward with latest on top
  if (completedGridEl) {
    completedGridEl.insertBefore(span, completedGridEl.firstChild);
  }
  completedWords.push(current.eng);
  // Keep only recent words to prevent array from growing indefinitely
  if (completedWords.length > CONFIG.maxSequenceLength * 2) {
    completedWords = completedWords.slice(-CONFIG.maxSequenceLength * 2);
  }
  // Check for special sequences - try sequences of different lengths
  specialEffect = null;
  for (let len = CONFIG.maxSequenceLength; len >= 1; len--) {
    const seqKey = completedWords.slice(-len).join(' ');
    if (sequences[seqKey]) {
      specialEffect = { effect: sequences[seqKey] };
      break; // Use the longest matching sequence
    }
  }
}

function pickAndRender() {
  const chosen = pickRandomWord();
  current.eng = chosen.eng;
  current.mand = chosen.mand;
  current.chars = Array.from(chosen.eng);
  current.typed = '';
  renderEnglish();
}

// init
function showStatus(msg, isError = false) {
  if (englishWordEl) {
    englishWordEl.textContent = msg;
    if (isError) {
      englishWordEl.style.color = '#ff4444'; // Keep red for system errors only
    } else {
      englishWordEl.style.color = 'var(--text-secondary)';
    }
  }
}

let inputHandlersSetup = false;

function setupInputHandlers() {
  // Prevent duplicate event listeners
  if (inputHandlersSetup) return;
  inputHandlersSetup = true;

  const mobileInput = document.getElementById('mobile-input');
  if (mobileInput) {
    mobileInput.addEventListener('keypress', onKey); // keypress for chars
    mobileInput.addEventListener('keydown', onKeyDown); // keydown for backspace
    mobileInput.focus();
    // Focus on any click/tap
    document.body.addEventListener('click', () => mobileInput.focus());
  } else {
    window.addEventListener('keypress', onKey);
    window.addEventListener('keydown', onKeyDown);
  }
  window.addEventListener('click', () => { /* focus affordance */ });
}

async function init() {
  showStatus('Loading...');
  try {
    const res = await fetch('./words.json');
    if (!res.ok) throw new Error(`Failed to load words.json: ${res.status} ${res.statusText}`);
    const data = await res.json();
    // Validate words.json structure
    if (typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('words.json must be a JSON object with key-value pairs');
    }
    mapping = data;
    if (Object.keys(mapping).length === 0) {
      showStatus('No words found', true);
    }

    // Load sequences
    try {
      const seqRes = await fetch('./sequences.json');
      if (seqRes.ok) {
        const seqData = await seqRes.json();
        if (typeof seqData === 'object' && !Array.isArray(seqData)) {
          sequences = seqData;
        } else {
          console.warn('sequences.json must be a JSON object');
        }
      }
    } catch (seqErr) {
      console.warn('Could not load sequences.json:', seqErr);
      // Continue without sequences
    }

    pickAndRender();
    setupInputHandlers();
    // expose for debugging
    window.__echoes = { pickAndRender, mapping, sequences, CONFIG };
  } catch (err) {
    console.error('Initialization error:', err);
    showStatus(`Error: ${err.message}`, true);
    // Try to continue with empty mapping
    mapping = {};
    pickAndRender();
    setupInputHandlers();
    window.__echoes = { pickAndRender, mapping, sequences, CONFIG };
  }
}

document.addEventListener('DOMContentLoaded', init);
