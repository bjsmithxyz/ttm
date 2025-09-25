export const effects = {
  "center-fade": async (mandarin, mandarinCascadeEl, CONFIG) => {
    const div = document.createElement('div');
    div.className = 'center-mandarin';
    div.textContent = mandarin;
    div.style.fontSize = Math.min(260, window.innerWidth * 0.4) + 'px';
    div.style.position = 'fixed';
    div.style.left = '50%';
    div.style.top = window.innerWidth < 600 ? '40%' : '50%';
    div.style.transform = 'translate(-50%, -50%) translate(' + (Math.random() * 200 - 100) + 'px, ' + (Math.random() * 200 - 100) + 'px)';
    div.style.color = 'var(--green)';
    div.style.webkitTextStroke = '4px #000';
    div.style.textShadow = window.innerWidth < 600 ? '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000' : '-4px -4px 0 #000, 4px -4px 0 #000, -4px 4px 0 #000, 4px 4px 0 #000, 0 0 8px #000';
    div.style.opacity = '0';
    div.style.transition = 'opacity 4.5s ease';
    div.style.zIndex = (effects.zIndexCounter = (effects.zIndexCounter || 10) + 1);
    document.body.appendChild(div);
    await new Promise(r => setTimeout(r, 10));
    div.style.opacity = '1';
    await new Promise(r => setTimeout(r, 2000));
    div.style.opacity = '0';
    await new Promise(r => setTimeout(r, 4500));
    if (div.parentNode) document.body.removeChild(div);
  },
  "cascade": async (mandarin, mandarinCascadeEl, CONFIG) => {
    const lines = CONFIG.cascadeLines;
    const vw = Math.max(window.innerWidth || 800, 800);
    let baseFont = Math.max(96, Math.min(260, Math.floor(vw * 0.18)));
    for(let i=0;i<lines;i++){
      const line = document.createElement('div');
      line.className = 'mandarin-line';
      line.style.fontSize = baseFont + 'px';
      line.textContent = mandarin;
      mandarinCascadeEl.appendChild(line);
    }
    const lineEls = Array.from(mandarinCascadeEl.children).slice(-lines); // only the new ones
    for(let i=0;i<lineEls.length;i++){
      const el = lineEls[i];
      const scale = Math.pow(CONFIG.cascadeScaleStep, i);
      el.style.setProperty('--line-scale', scale);
      await new Promise(r => setTimeout(r, CONFIG.cascadeLineDelay));
      requestAnimationFrame(()=>{
        el.classList.add('visible');
      });
    }
    await new Promise(r => setTimeout(r, CONFIG.cascadeLineDelay * 4));
    for(let i=0;i<lineEls.length;i++){
      const el = lineEls[i];
      setTimeout(()=>{
        requestAnimationFrame(()=>{
          el.classList.add('fading');
        });
      }, i * CONFIG.cascadeLineDelay);
    }
    await new Promise(resolve => {
      if(!lineEls.length) return resolve();
      const last = lineEls[lineEls.length - 1];
      const onEnd = (ev) => {
        if(ev.propertyName === 'opacity'){
          last.removeEventListener('transitionend', onEnd);
          resolve();
        }
      };
      last.addEventListener('transitionend', onEnd);
    });
  },
  "night-sky": async function(mandarin, mandarinCascadeEl, CONFIG) {
    mandarinCascadeEl.classList.add('night-sky');
    await this.cascade(mandarin, mandarinCascadeEl, CONFIG);
    mandarinCascadeEl.classList.remove('night-sky');
  }
};