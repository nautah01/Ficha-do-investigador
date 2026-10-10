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
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

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

  function animateMoon() {
    if (motionPreference.matches) return;

    button.classList.remove('is-turning');
    // Reinicia a animação mesmo quando o usuário alterna temas em sequência.
    void button.offsetWidth;
    button.classList.add('is-turning');
    window.setTimeout(() => button.classList.remove('is-turning'), 900);
  }

  function revealTheme(theme) {
    const canReveal = typeof document.startViewTransition === 'function';
    const shouldAnimate = canReveal && !motionPreference.matches;
    animateMoon();

    if (!shouldAnimate) {
      applyTheme(theme);
      return;
    }

    changingTheme = true;
    const bounds = button.getBoundingClientRect();
    const x = bounds.left + bounds.width / 2;
    const y = bounds.top + bounds.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
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
