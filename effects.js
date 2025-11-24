export const effects = {
  "drift": async (mandarin, container, CONFIG) => {
    const el = document.createElement('div');
    el.className = 'mandarin-echo';
    el.textContent = mandarin;

    // Randomize size
    const size = Math.floor(Math.random() * 60 + 40); // 40px to 100px
    el.style.fontSize = `${size}px`;

    // Randomize start position (somewhere in the viewport)
    const startX = Math.random() * 80 + 10; // 10% to 90%
    const startY = Math.random() * 80 + 10;
    el.style.left = `${startX}%`;
    el.style.top = `${startY}%`;

    // Randomize rotation
    const rotation = Math.random() * 60 - 30; // -30 to 30 deg
    el.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(0.8)`;

    container.appendChild(el);

    // Force reflow
    await new Promise(r => requestAnimationFrame(r));

    // Animate in
    el.style.transition = 'opacity 2s ease, transform 20s linear';
    el.style.opacity = '0.4'; // Keep it subtle

    // Drift destination
    const driftX = (Math.random() - 0.5) * 200; // -100px to 100px
    const driftY = (Math.random() - 0.5) * 200;
    const finalRotation = rotation + (Math.random() * 40 - 20);

    el.style.transform = `translate(calc(-50% + ${driftX}px), calc(-50% + ${driftY}px)) rotate(${finalRotation}deg) scale(1)`;

    // Linger for a long time, then fade
    // We don't await the full duration here because we want to return control immediately
    // The cleanup logic in script.js will handle removing old elements if too many accumulate

    // However, we can add a self-cleanup after a very long time just in case
    setTimeout(() => {
      if (el.parentNode) {
        el.style.transition = 'opacity 5s ease';
        el.style.opacity = '0';
        setTimeout(() => {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, 5000);
      }
    }, 60000); // Linger for 60 seconds
  }
};