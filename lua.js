/* Troca dos quatro cenários e animação de passagem entre paletas. */
(() => {
  'use strict';

  const themes = ['green', 'red', 'blue', 'paper'];
  const names = {
    green: 'verde',
    red: 'vermelho',
    blue: 'azul',
    paper: 'papel pautado'
  };
  const storageKey = 'cthulhu-tema';
  const root = document.documentElement;
  const button = document.getElementById('moon');

  if (!button) return;

  const dots = [...button.querySelectorAll('.mdots i')];
  let scrollFrame = 0;
  let changingTheme = false;

  function currentTheme() {
    return themes.includes(root.dataset.theme) ? root.dataset.theme : 'green';
  }

  function applyTheme(theme) {
    if (theme === 'green') {
      delete root.dataset.theme;
    } else {
      root.dataset.theme = theme;
    }

    const index = themes.indexOf(theme);
    const nextTheme = themes[(index + 1) % themes.length];
    dots.forEach((dot, dotIndex) => dot.classList.toggle('on', dotIndex === index));
    button.setAttribute('aria-label', `Trocar cenário. Tema atual: ${names[theme]}.`);
    button.title = `Cenário ${names[theme]} — clique para ${names[nextTheme]}`;

    try {
      localStorage.setItem(storageKey, theme);
    } catch (_) {
      // O tema continua funcionando mesmo quando o navegador bloqueia o armazenamento.
    }
  }

  function updateScrollFade() {
    scrollFrame = 0;
    const progress = Math.min(1, Math.max(0, window.scrollY / 760));
    const opacity = 0.92 - progress * 0.76;
    button.style.setProperty('--moon-scroll-opacity', opacity.toFixed(2));
  }

  function scheduleScrollFade() {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScrollFade);
  }

  function animateMoon(target) {
    target.animate(
      [
        { transform: 'translateX(-14px) rotate(-150deg) scale(.72)', filter: 'brightness(.76) saturate(.65)' },
        { transform: 'translateX(9px) rotate(205deg) scale(1.12)', filter: 'brightness(1.35) saturate(1.3)', offset: .55 },
        { transform: 'translateX(0) rotate(360deg) scale(1)', filter: 'brightness(1) saturate(1)' }
      ],
      { duration: 820, easing: 'cubic-bezier(.2,.75,.25,1)' }
    );
  }

  function syncSnapshotControls(snapshot) {
    const original = [...document.querySelectorAll('input, textarea, select')];
    const copy = [...snapshot.querySelectorAll('input, textarea, select')];

    original.forEach((control, index) => {
      const cloned = copy[index];
      if (!cloned) return;

      if (control instanceof HTMLInputElement) {
        cloned.setAttribute('value', control.value);
        if (control.checked) cloned.setAttribute('checked', '');
        else cloned.removeAttribute('checked');
      } else if (control instanceof HTMLTextAreaElement) {
        cloned.textContent = control.value;
      } else if (control instanceof HTMLSelectElement) {
        [...cloned.options].forEach((option, optionIndex) => {
          if (optionIndex === control.selectedIndex) option.setAttribute('selected', '');
          else option.removeAttribute('selected');
        });
      }
    });
  }

  function revealWithSnapshot(theme, x, y, radius) {
    return new Promise(resolve => {
      const frame = document.createElement('iframe');
      const snapshot = document.documentElement.cloneNode(true);
      const targetButton = snapshot.querySelector('#moon');
      const targetIndex = themes.indexOf(theme);

      if (theme === 'green') delete snapshot.dataset.theme;
      else snapshot.dataset.theme = theme;

      snapshot.querySelectorAll('script').forEach(script => script.remove());
      syncSnapshotControls(snapshot);

      if (targetButton) {
        const dots = [...targetButton.querySelectorAll('.mdots i')];
        dots.forEach((dot, index) => dot.classList.toggle('on', index === targetIndex));
        targetButton.setAttribute('aria-label', `Trocar cenário. Tema atual: ${names[theme]}.`);
      }

      let base = snapshot.querySelector('base');
      if (!base) {
        base = snapshot.ownerDocument.createElement('base');
        snapshot.querySelector('head')?.prepend(base);
      }
      base.href = document.baseURI;

      frame.title = 'Transição de cenário';
      frame.setAttribute('aria-hidden', 'true');
      frame.style.cssText = `position:fixed;inset:0;width:100vw;height:100vh;border:0;pointer-events:none;z-index:2147483647;clip-path:circle(0 at ${x}px ${y}px)`;

      let settled = false;
      const finish = apply => {
        if (settled) return;
        settled = true;
        if (apply) applyTheme(theme);
        frame.remove();
        resolve();
      };

      frame.addEventListener('load', () => {
        const frameWindow = frame.contentWindow;
        const frameDocument = frame.contentDocument;
        if (!frameWindow || !frameDocument) {
          finish(true);
          return;
        }

        frameWindow.scrollTo(window.scrollX, window.scrollY);
        const moonCopy = frameDocument.getElementById('moon');
        if (moonCopy) animateMoon(moonCopy);

        const glow = getComputedStyle(frameDocument.documentElement).getPropertyValue('--moonglow').trim() || '220,220,220';
        const wave = frame.animate(
          {
            clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
            filter: [`drop-shadow(0 0 14px rgba(${glow}, .9))`, `drop-shadow(0 0 0 rgba(${glow}, 0))`]
          },
          { duration: 1050, easing: 'cubic-bezier(.16,.72,.22,1)', fill: 'forwards' }
        );
        wave.finished.then(() => finish(true), () => finish(true));
      }, { once: true });

      frame.addEventListener('error', () => finish(true), { once: true });
      document.body.append(frame);
      frame.srcdoc = `<!doctype html>${snapshot.outerHTML}`;
    });
  }

  function revealTheme(theme) {
    const canReveal = typeof document.startViewTransition === 'function';
    const bounds = button.getBoundingClientRect();
    const x = bounds.left + bounds.width / 2;
    const y = bounds.top + bounds.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    animateMoon(button);

    if (!canReveal) {
      changingTheme = true;
      revealWithSnapshot(theme, x, y, radius).then(() => { changingTheme = false; });
      return;
    }

    changingTheme = true;
    const transition = document.startViewTransition(() => applyTheme(theme));

    transition.ready.then(() => {
        const glow = getComputedStyle(button).getPropertyValue('--moonglow').trim() || '220,220,220';
        // A nova paleta abre a partir da lua, com uma borda luminosa que atravessa a tela.
        root.animate(
          {
            clipPath: [
              `circle(0 at ${x}px ${y}px)`,
              `circle(${radius}px at ${x}px ${y}px)`
            ],
            filter: [
              `drop-shadow(0 0 14px rgba(${glow}, .88)) brightness(1.2) saturate(1.18)`,
              `drop-shadow(0 0 0 rgba(${glow}, 0)) brightness(1) saturate(1)`
            ]
          },
          {
            duration: 1050,
            easing: 'cubic-bezier(.16,.72,.22,1)',
            fill: 'both',
            pseudoElement: '::view-transition-new(root)'
          }
        );

        root.animate(
          {
            transform: [
              'translateX(-13px) rotate(-150deg) scale(.72)',
              'translateX(8px) rotate(205deg) scale(1.12)',
              'translateX(0) rotate(360deg) scale(1)'
            ],
            filter: ['brightness(.76) saturate(.65)', 'brightness(1.35) saturate(1.3)', 'brightness(1) saturate(1)']
          },
          {
            duration: 820,
            easing: 'cubic-bezier(.2,.75,.25,1)',
            pseudoElement: '::view-transition-new(theme-moon)'
          }
        );
    }).catch(() => {
      // Se o navegador cancelar a transição, a paleta já foi aplicada pelo callback.
    });

    transition.finished.then(
      () => { changingTheme = false; },
      () => { changingTheme = false; }
    );
  }

  button.addEventListener('click', () => {
    if (changingTheme) return;
    const index = themes.indexOf(currentTheme());
    revealTheme(themes[(index + 1) % themes.length]);
  });

  window.addEventListener('scroll', scheduleScrollFade, { passive: true });
  window.addEventListener('resize', scheduleScrollFade, { passive: true });
  updateScrollFade();
  applyTheme(currentTheme());
})();
