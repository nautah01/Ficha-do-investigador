(function () {
  const style = document.createElement('style');
  style.textContent = `
    .win.occupational-skill-mode [data-occupational-skill="true"] {
      border-radius: 4px;
      background: rgba(var(--gr), .12);
      box-shadow: inset 3px 0 0 var(--head);
      padding-left: 5px;
    }
    .occupation-skill-badge {
      flex: 0 0 auto;
      padding: 1px 5px;
      border: 1px solid var(--head);
      border-radius: 999px;
      color: var(--head);
      font-size: .62rem;
      font-weight: bold;
      line-height: 1.4;
      white-space: nowrap;
    }
  `;
  document.head.append(style);

  function update(root = document) {
    root.querySelectorAll('.win').forEach(card => {
      const mode = card.querySelector('[data-budget-mode]');
      const isOccupational = !!card.querySelector('[data-occ-main]') && mode?.value === 'occupational';
      card.classList.toggle('occupational-skill-mode', isOccupational);

      card.querySelectorAll('[data-occupational-skill="true"] .sk-label').forEach(label => {
        let badge = label.querySelector('.occupation-skill-badge');
        if (isOccupational && !badge) {
          badge = document.createElement('span');
          badge.className = 'occupation-skill-badge';
          badge.textContent = 'Ocupação';
          badge.setAttribute('aria-label', 'Perícia da ocupação escolhida');
          label.append(badge);
        } else if (!isOccupational) {
          badge?.remove();
        }
      });
    });
  }

  document.addEventListener('change', event => {
    if (event.target.matches('[data-budget-mode], [data-occ-main], [data-occ-spec]')) update();
  });

  const desk = document.getElementById('desk');
  if (desk) new MutationObserver(() => update(desk)).observe(desk, { childList: true, subtree: true });
  update();
})();
