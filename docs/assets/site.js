import { hoursBack, missedCallLeak } from './calc.js';
import { bootForms } from './forms.js';

export function facetState(progress) {
  const p = Math.min(1, Math.max(0, Number(progress) || 0));
  const lit = p >= 1 ? 6 : Math.floor(p * 6);
  return { lit, swoosh: p >= 1, motto: p >= 1 };
}

function money(n) {
  const v = Math.round(Number(n) || 0);
  const body = String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${v < 0 ? '-' : ''}$${body}`;
}

function numText(n) {
  const v = Number(n) || 0;
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 10) / 10);
}

export function bootNav(doc) {
  const toggle = doc.querySelector('.nav-toggle');
  const menu = doc.querySelector('#nav-menu');
  const sysBtn = doc.querySelector('.nav-systems-btn');
  const sysList = doc.querySelector('#nav-systems-list');
  const closeSys = () => {
    if (!sysBtn || !sysList) return;
    sysBtn.setAttribute('aria-expanded', 'false');
    sysList.classList.remove('is-open');
  };
  const closeMenu = () => {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');
  };
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
      menu.classList.toggle('is-open', !open);
    });
  }
  if (sysBtn && sysList) {
    sysBtn.addEventListener('click', () => {
      const open = sysBtn.getAttribute('aria-expanded') === 'true';
      sysBtn.setAttribute('aria-expanded', open ? 'false' : 'true');
      sysList.classList.toggle('is-open', !open);
    });
  }
  doc.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeSys();
      closeMenu();
    }
  });
}

export function bootStages(doc) {
  const picker = doc.querySelector('[data-stage-picker]');
  if (!picker) return;
  const buttons = [...picker.querySelectorAll('[data-stage]')];
  const cards = [...doc.querySelectorAll('[data-stages]')];
  const apply = (stage) => {
    buttons.forEach((button) => {
      button.setAttribute('aria-pressed', button.getAttribute('data-stage') === stage ? 'true' : 'false');
    });
    cards.forEach((card) => {
      const list = (card.getAttribute('data-stages') || '').split(/\s+/);
      card.classList.toggle('is-dim', !list.includes(stage));
    });
  };
  buttons.forEach((button) => {
    button.addEventListener('click', () => apply(button.getAttribute('data-stage')));
  });
  const current = buttons.find((button) => button.getAttribute('aria-pressed') === 'true');
  if (current) apply(current.getAttribute('data-stage'));
}

function bootReveals(doc) {
  const nodes = [...doc.querySelectorAll('.reveal')];
  const motion = doc.documentElement.classList.contains('js-motion');
  if (!motion || typeof IntersectionObserver !== 'function') {
    nodes.forEach((node) => node.classList.add('is-in'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15 });
  nodes.forEach((node) => observer.observe(node));
}

function bootCounts(doc) {
  const nodes = [...doc.querySelectorAll('[data-count]')];
  const motion = doc.documentElement.classList.contains('js-motion');
  if (!motion || typeof IntersectionObserver !== 'function') return;
  const tick = (node) => {
    const target = Number(node.getAttribute('data-count'));
    const decimals = Number(node.getAttribute('data-decimals') || 0);
    const suffix = node.getAttribute('data-suffix') || '';
    const start = performance.now();
    const frame = (now) => {
      const t = Math.min(1, (now - start) / 700);
      const value = target * (1 - (1 - t) ** 3);
      const shown = decimals ? value.toFixed(decimals) : String(Math.round(value));
      node.textContent = `${shown}${suffix}`;
      if (t < 1) requestAnimationFrame(frame);
    };
    node.textContent = `0${suffix}`;
    requestAnimationFrame(frame);
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || entry.target.dataset.counted) return;
      entry.target.dataset.counted = '1';
      tick(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.6 });
  nodes.forEach((node) => observer.observe(node));
}

function applyFacets(hero, state) {
  hero.querySelectorAll('[data-facet]').forEach((facet) => {
    facet.classList.toggle('is-on', Number(facet.getAttribute('data-facet')) < state.lit);
  });
  hero.querySelectorAll('[data-chip]').forEach((chip) => {
    chip.classList.toggle('is-on', Number(chip.getAttribute('data-chip')) < state.lit);
  });
  const swoosh = hero.querySelector('.gem-swoosh');
  const motto = hero.querySelector('.hero-motto');
  if (swoosh) swoosh.classList.toggle('is-on', state.swoosh);
  if (motto) motto.classList.toggle('is-on', state.motto);
}

export function bootGem(doc) {
  const hero = doc.querySelector('[data-hero-slot="v1-gem"]');
  if (!hero) return;
  const motion = doc.documentElement.classList.contains('js-motion');
  const wide = typeof matchMedia === 'function' && matchMedia('(min-width: 900px)').matches;
  if (!motion || !wide) {
    hero.classList.add('is-complete');
    applyFacets(hero, { lit: 6, swoosh: true, motto: true });
    return;
  }
  let frame = 0;
  const update = () => {
    frame = 0;
    const rect = hero.getBoundingClientRect();
    const scrollable = Math.max(1, hero.offsetHeight - (doc.defaultView || window).innerHeight);
    const passed = Math.min(Math.max(-rect.top, 0), scrollable);
    applyFacets(hero, facetState(passed / scrollable));
  };
  const request = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  const view = doc.defaultView || window;
  view.addEventListener('scroll', request, { passive: true });
  view.addEventListener('resize', request);
  update();
}

function bootTuesday(doc) {
  const root = doc.querySelector('[data-tuesday]');
  if (!root || typeof IntersectionObserver !== 'function') return;
  const clock = root.querySelector('[data-tuesday-clock]');
  const rows = [...root.querySelectorAll('[data-hour]')];
  if (!doc.documentElement.classList.contains('js-motion')) {
    if (clock && rows[0]) clock.textContent = rows[0].getAttribute('data-hour');
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible && clock) clock.textContent = visible.target.getAttribute('data-hour');
  }, { threshold: [0.45, 0.7] });
  rows.forEach((row) => observer.observe(row));
}

function bootRail(doc) {
  const rail = doc.querySelector('[data-rail]');
  if (!rail) return;
  const items = [...doc.querySelectorAll('[data-source]')];
  const countEl = rail.querySelector('[data-rail-count]');
  const totalEl = rail.querySelector('[data-rail-total]');
  if (totalEl) totalEl.textContent = String(items.length);
  if (!doc.documentElement.classList.contains('js-motion') || typeof IntersectionObserver !== 'function') {
    if (countEl) countEl.textContent = String(items.length);
    return;
  }
  const seen = new Set();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) seen.add(entry.target);
    });
    if (countEl) countEl.textContent = String(seen.size);
  }, { threshold: 0.45 });
  items.forEach((item) => observer.observe(item));
}

function readField(root, name) {
  const el = root.querySelector(`[data-field="${name}"]`);
  return el ? el.value : '';
}

export function bootCalcs(doc) {
  const paintLive = (root, name) => {
    const el = root.querySelector(`[data-field="${name}"]`);
    const live = root.querySelector(`[data-live="${name}"]`);
    if (el && live) live.textContent = el.value;
  };

  doc.querySelectorAll('[data-calc="leak"]').forEach((root) => {
    const render = () => {
      ['calls', 'miss', 'book', 'value'].forEach((name) => paintLive(root, name));
      const result = missedCallLeak({
        callsPerWeek: readField(root, 'calls'),
        missPercent: readField(root, 'miss'),
        bookPercent: readField(root, 'book'),
        jobValue: readField(root, 'value'),
      });
      const yearly = root.querySelector('[data-out="yearly"]');
      const monthly = root.querySelector('[data-out="monthly"]');
      const hint = root.querySelector('[data-hint]');
      const link = root.querySelector('[data-plan]');
      if (yearly) yearly.textContent = money(result.yearly);
      if (monthly) monthly.textContent = money(result.monthly);
      if (hint) {
        hint.hidden = !result.hint;
        hint.textContent = result.hint || '';
      }
      if (link) {
        const base = root.getAttribute('data-base') || '';
        link.setAttribute('href', `${base}free-audit/?need=missed-calls&leak=${result.yearly}`);
      }
    };
    root.addEventListener('input', render);
    render();
  });

  doc.querySelectorAll('[data-calc="hours"]').forEach((root) => {
    const render = () => {
      const names = ['calls', 'follow', 'schedule', 'quotes', 'paper', 'take', 'rate'];
      names.forEach((name) => paintLive(root, name));
      const result = hoursBack({
        parts: ['calls', 'follow', 'schedule', 'quotes', 'paper'].map((name) => readField(root, name)),
        takeoverPercent: readField(root, 'take'),
        hourlyValue: readField(root, 'rate'),
      });
      const weekly = root.querySelector('[data-out="weekly"]');
      const yearly = root.querySelector('[data-out="yearly"]');
      const dollars = root.querySelector('[data-out="dollars"]');
      const hint = root.querySelector('[data-hint]');
      const link = root.querySelector('[data-plan]');
      if (weekly) weekly.textContent = numText(result.weekly);
      if (yearly) yearly.textContent = numText(result.yearly);
      if (dollars) dollars.textContent = money(result.dollars);
      if (hint) {
        hint.hidden = !result.hint;
        hint.textContent = result.hint || '';
      }
      if (link) {
        const base = root.getAttribute('data-base') || '';
        link.setAttribute('href', `${base}free-audit/?need=hours&hours=${result.yearly}`);
      }
    };
    root.addEventListener('input', render);
    render();
  });
}

export function boot(doc, config) {
  const view = doc.defaultView || (typeof window !== 'undefined' ? window : null);
  if (view) view.__fgaiReady = true;
  bootNav(doc);
  bootStages(doc);
  bootReveals(doc);
  bootCounts(doc);
  bootGem(doc);
  bootTuesday(doc);
  bootRail(doc);
  bootCalcs(doc);
  bootForms(doc, config || (view && view.FGAI_CONFIG) || {});
}

const hasDocument = typeof document !== 'undefined' && document.documentElement;
if (hasDocument && !globalThis.__FGAI_TEST) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => boot(document));
  else boot(document);
}
