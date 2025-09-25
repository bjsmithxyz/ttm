// Load words.json at runtime (fetch) so the page works when served and shows helpful errors
import { effects } from './effects.js';

const CONFIG = {
  cascadeLines: 15,
  cascadeLineDelay: 80,
  cascadeScaleStep: 0.9,
  defaultEffect: 'center-fade'
}

const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
const green = getComputedStyle(document.documentElement).getPropertyValue('--green').trim();

const englishWordEl = document.getElementById('english-word');
const mandarinCascadeEl = document.getElementById('mandarin-cascade');
const completedGridEl = document.getElementById('completed-grid');

let mapping = {}; // will be populated from words.json
let current = {eng:'', mand:'', chars:[], typed:''};
let completedWords = [];
let specialEffect = null;
let sequences = {};
let lastEng = null;

function pickRandomWord(){
  const keys = Object.keys(mapping);
  if(!keys.length) return {eng:'(no-words)', mand:''};
  let k, eng;
  do {
    k = keys[Math.floor(Math.random()*keys.length)];
    eng = k;
    if(k.includes('/')){
      const alts = k.split('/');
      eng = alts[Math.floor(Math.random()*alts.length)];
    }
  } while (eng === lastEng && keys.length > 1);
  lastEng = eng;
  return {eng:eng, mand:mapping[k]};
}

function renderEnglish(){
  englishWordEl.innerHTML = '';
  current.chars.forEach((ch,i)=>{
    const span = document.createElement('span');
    span.className = 'letter';
    span.textContent = ch;
    if(i < current.typed.length){
      if(current.typed[i] === ch){
        span.classList.add('correct');
      } else {
        span.classList.add('incorrect');
      }
    }
    englishWordEl.appendChild(span);
  })
}

function resetToOriginal(){
  current.typed = '';
  renderEnglish();
}

async function changeToNextWord(){
  // fade out current word downwards
  englishWordEl.classList.add('fade-out-down');
  await new Promise(r => setTimeout(r, 300)); // wait for fade
  englishWordEl.classList.remove('fade-out-down');
  // prepare next word
  pickAndRender();
  // fade in from top
  englishWordEl.classList.add('fade-in-up');
  await new Promise(r => setTimeout(r, 10)); // small delay to apply class
  englishWordEl.classList.remove('fade-in-up');
}

function onKey(e){
  // allow input even during cascade
  if(e.key.length !== 1) return; // ignore special keys
  current.typed += e.key;
  // compare and keep only up to word length
  if(current.typed.length > current.chars.length) current.typed = current.typed.slice(0,current.chars.length);
  // mark correct letters only when matching at position
  renderEnglish();
  const isCorrect = current.typed === current.chars.join('');
  if(isCorrect){
    changeToNextWord();
    addToCompletedGrid(current.mand);
    triggerMandarinCascade(current.mand);
    current.typed = '';
  } else {
    // check if the last typed is wrong
    const lastIndex = current.typed.length - 1;
    if(lastIndex >= 0 && current.typed[lastIndex] !== current.chars[lastIndex]){
      // wrong letter, reset after short delay
      setTimeout(() => {
        current.typed = '';
        renderEnglish();
      }, 500);
    }
  }
}

async function triggerMandarinCascade(mandarin){
  const effectName = specialEffect ? specialEffect.effect : CONFIG.defaultEffect;
  await effects[effectName](mandarin, mandarinCascadeEl, CONFIG);
}

function addToCompletedGrid(ch){
  const span = document.createElement('div');
  span.className = 'completed-char';
  span.textContent = ch;
  // Insert at beginning so rows grow upward with latest on top
  completedGridEl.insertBefore(span, completedGridEl.firstChild);
  completedWords.push(current.eng);
  // Check for special sequences
  const seqKey = completedWords.slice(-3).join(' ');
  if (sequences[seqKey]) {
    specialEffect = { effect: sequences[seqKey] };
  } else {
    specialEffect = null;
  }
}

function pickAndRender(){
  const chosen = pickRandomWord();
  current.eng = chosen.eng;
  current.mand = chosen.mand;
  current.chars = Array.from(chosen.eng);
  current.typed = '';
  renderEnglish();
}

// init
function showStatus(msg){
  if(englishWordEl) englishWordEl.textContent = msg;
}

async function init(){
  showStatus('Loading words...');
  try{
    const res = await fetch('./words.json');
    if(!res.ok) throw new Error('Failed to load words.json: '+res.status);
    const data = await res.json();
    mapping = data;
    const seqRes = await fetch('./sequences.json');
    if(seqRes.ok) sequences = await seqRes.json();
    pickAndRender();
    // Mobile input handling
    const mobileInput = document.getElementById('mobile-input');
    if(mobileInput){
      mobileInput.addEventListener('keydown', onKey);
      mobileInput.focus();
      // Focus on any click/tap
      document.body.addEventListener('click', () => mobileInput.focus());
    } else {
      window.addEventListener('keydown', onKey);
    }
    window.addEventListener('click', ()=>{ /* focus affordance */ });
    // expose for debugging
    window.__incluspeak = {pickAndRender, mapping};
  }catch(err){
    console.warn('Could not fetch files.', err);
    pickAndRender();
    const mobileInput = document.getElementById('mobile-input');
    if(mobileInput){
      mobileInput.addEventListener('keydown', onKey);
      mobileInput.focus();
      document.body.addEventListener('click', () => mobileInput.focus());
    } else {
      window.addEventListener('keydown', onKey);
    }
    window.addEventListener('click', ()=>{ /* focus affordance */ });
    window.__incluspeak = {pickAndRender, mapping};
  }
}

document.addEventListener('DOMContentLoaded', init);
