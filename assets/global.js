/* Viral Horn theme — progressive enhancement.
   Every component works as a plain link/form without JavaScript;
   these custom elements make it faster and smoother. */

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';

const fetchJSON = (url, options = {}) =>
  fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(options.headers || {}) }
  }).then(async (response) => {
    const data = await response.json();
    if (!response.ok || data.status) throw new Error(data.description || data.message || window.theme.strings.error);
    return data;
  });

const parseHTML = (html) => new DOMParser().parseFromString(html, 'text/html');

/* ---------- Drawers ---------- */
class DrawerElement extends HTMLElement {
  connectedCallback() {
    this.panel = this.querySelector('.drawer__panel');
    this.addEventListener('click', (event) => {
      if (event.target.closest('[data-drawer-close]')) this.close();
    });
    this.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.close();
      if (event.key === 'Tab') this.trapFocus(event);
    });
  }

  open(trigger) {
    this.trigger = trigger || document.activeElement;
    this.classList.add('is-open');
    document.body.classList.add('is-locked');
    this.trigger?.setAttribute?.('aria-expanded', 'true');
    requestAnimationFrame(() => this.panel.focus());
  }

  close() {
    if (!this.classList.contains('is-open')) return;
    this.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    this.trigger?.setAttribute?.('aria-expanded', 'false');
    this.trigger?.focus?.();
  }

  trapFocus(event) {
    const items = [...this.panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === this.panel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}

class MenuDrawer extends DrawerElement {
  connectedCallback() {
    super.connectedCallback();
    document.querySelectorAll('[data-menu-open]').forEach((button) => {
      button.addEventListener('click', () => this.open(button));
    });
    // Close when following an in-page anchor such as /#faq
    this.querySelectorAll('[data-drawer-link]').forEach((link) => {
      link.addEventListener('click', () => this.close());
    });
  }
}
customElements.define('menu-drawer', MenuDrawer);

class CartDrawer extends DrawerElement {
  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-cart-open]');
      if (!trigger) return;
      event.preventDefault();
      this.open(trigger);
    });
  }

  /* Replace drawer contents with freshly rendered section HTML */
  renderContents(sections) {
    const html = sections && sections['cart-drawer'];
    if (!html) return;
    const doc = parseHTML(html);
    const fresh = doc.querySelector('[data-cart-content]');
    const freshTitle = doc.querySelector('#CartDrawerTitle');
    if (fresh) this.querySelector('[data-cart-content]').replaceWith(fresh);
    if (freshTitle) this.querySelector('#CartDrawerTitle').replaceWith(freshTitle);
    const count = doc.querySelector('cart-drawer')?.dataset.cartCount;
    if (count !== undefined) updateCartCount(Number(count));
  }
}
customElements.define('cart-drawer', CartDrawer);

function updateCartCount(count) {
  document.querySelectorAll('[data-cart-count-bubble]').forEach((bubble) => {
    bubble.textContent = count;
    bubble.hidden = count === 0;
  });
}

const cartSectionIds = () => {
  const ids = [];
  if (document.querySelector('cart-drawer')) ids.push('cart-drawer');
  document.querySelectorAll('[data-cart-section]').forEach((el) => ids.push(el.dataset.cartSection));
  return ids;
};

/* Re-render the cart page section (if present) from Section Rendering API output */
function renderCartPage(sections) {
  document.querySelectorAll('[data-cart-section]').forEach((el) => {
    const html = sections && sections[el.dataset.cartSection];
    if (!html) return;
    const fresh = parseHTML(html).querySelector('[data-cart-section]');
    if (fresh) el.replaceWith(fresh);
  });
}

/* ---------- Quantity stepper ---------- */
class QuantityInput extends HTMLElement {
  connectedCallback() {
    this.input = this.querySelector('input');
    this.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      const min = Number(this.input.min || 0);
      const current = Number(this.input.value) || 0;
      const next = button.name === 'plus' ? current + 1 : Math.max(min, current - 1);
      if (next === current) return;
      this.input.value = next;
      this.input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
}
customElements.define('quantity-input', QuantityInput);

/* ---------- Cart line items (drawer + page) ---------- */
class CartItems extends HTMLElement {
  connectedCallback() {
    this.addEventListener('change', (event) => {
      const input = event.target.closest('input[data-line]');
      if (!input) return;
      clearTimeout(this.debounce);
      this.debounce = setTimeout(() => this.update(input.dataset.line, Number(input.value)), 300);
    });
    this.addEventListener('click', (event) => {
      const remove = event.target.closest('[data-remove-line]');
      if (!remove) return;
      event.preventDefault();
      this.update(remove.dataset.removeLine, 0);
    });
  }

  async update(line, quantity) {
    const list = this.querySelector('[data-cart-items]');
    list?.classList.add('is-updating');
    try {
      const cart = await fetchJSON(window.theme.routes.cartChange + '.js', {
        method: 'POST',
        body: JSON.stringify({ line: Number(line), quantity, sections: cartSectionIds(), sections_url: window.location.pathname })
      });
      document.querySelector('cart-drawer')?.renderContents(cart.sections);
      renderCartPage(cart.sections);
      updateCartCount(cart.item_count);
    } catch (error) {
      list?.classList.remove('is-updating');
      const errorEl = document.querySelector('[data-cart-error]');
      if (errorEl) {
        errorEl.textContent = error.message;
        errorEl.hidden = false;
      }
    }
  }
}
customElements.define('cart-items', CartItems);

/* ---------- Add to cart ---------- */
class ProductForm extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector('form');
    this.button = this.querySelector('[data-add-button]');
    this.error = this.querySelector('[data-form-error]');
    this.form.addEventListener('submit', (event) => this.onSubmit(event));
  }

  async onSubmit(event) {
    if (window.theme.cartType !== 'drawer' || !document.querySelector('cart-drawer')) return; // native POST → cart page
    event.preventDefault();
    if (this.button.disabled) return;

    this.button.classList.add('is-loading');
    this.button.setAttribute('aria-busy', 'true');
    this.error.hidden = true;

    const formData = new FormData(this.form);
    formData.append('sections', cartSectionIds().join(','));
    formData.append('sections_url', window.location.pathname);

    try {
      const response = await fetch(window.theme.routes.cartAdd + '.js', {
        method: 'POST',
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: formData
      });
      const data = await response.json();
      if (!response.ok || data.status) throw new Error(data.description || data.message || window.theme.strings.error);

      const drawer = document.querySelector('cart-drawer');
      drawer.renderContents(data.sections);
      drawer.open(this.button);
    } catch (error) {
      this.error.textContent = error.message;
      this.error.hidden = false;
    } finally {
      this.button.classList.remove('is-loading');
      this.button.removeAttribute('aria-busy');
    }
  }
}
customElements.define('product-form', ProductForm);

/* ---------- Variant picker (product page) ---------- */
class VariantPicker extends HTMLElement {
  connectedCallback() {
    this.variants = JSON.parse(this.querySelector('[data-variants-json]').textContent);
    this.sectionId = this.dataset.sectionId;
    this.productUrl = this.dataset.productUrl;
    this.addEventListener('change', () => this.onChange());
  }

  selectedOptions() {
    return [...this.querySelectorAll('fieldset')].map((fieldset) => fieldset.querySelector('input:checked')?.value);
  }

  onChange() {
    const options = this.selectedOptions();
    this.querySelectorAll('fieldset').forEach((fieldset) => {
      const legendValue = fieldset.querySelector('[data-selected-value]');
      if (legendValue) legendValue.textContent = fieldset.querySelector('input:checked')?.value || '';
    });
    const variant = this.variants.find((v) => v.options.every((value, i) => value === options[i]));
    this.updateForms(variant);
    if (!variant) return;
    window.history.replaceState({}, '', `${this.productUrl}?variant=${variant.id}`);
    this.renderSection(variant.id);
  }

  updateForms(variant) {
    const section = document.getElementById(`MainProduct-${this.sectionId}`);
    const strings = window.theme.strings;
    section.querySelectorAll('[data-variant-input]').forEach((input) => {
      input.value = variant ? variant.id : '';
      input.disabled = !variant || !variant.available;
    });
    section.querySelectorAll('[data-add-button], [data-sticky-add]').forEach((button) => {
      button.disabled = !variant || !variant.available;
      const label = button.querySelector('[data-add-label]');
      if (label) label.textContent = !variant ? strings.unavailable : variant.available ? strings.addToCart : strings.soldOut;
    });
    if (variant?.featured_media) {
      section.querySelector('product-gallery')?.showMedia(variant.featured_media.id);
    }
  }

  /* Pull fresh price + availability markup for the chosen variant from Shopify */
  async renderSection(variantId) {
    const url = `${this.productUrl}?variant=${variantId}&section_id=${this.sectionId}`;
    this.abort?.abort();
    this.abort = new AbortController();
    try {
      const html = await fetch(url, { signal: this.abort.signal }).then((r) => r.text());
      const doc = parseHTML(html);
      document.querySelectorAll(`[data-variant-region="${this.sectionId}"]`).forEach((target) => {
        const fresh = doc.querySelector(`[data-variant-region="${this.sectionId}"][data-region="${target.dataset.region}"]`);
        if (fresh) target.innerHTML = fresh.innerHTML;
      });
    } catch (error) {
      if (error.name !== 'AbortError') throw error;
    }
  }
}
customElements.define('variant-picker', VariantPicker);

/* ---------- Product gallery ---------- */
class ProductGallery extends HTMLElement {
  connectedCallback() {
    this.track = this.querySelector('[data-gallery-track]');
    this.slides = [...this.querySelectorAll('[data-media-id]')];
    this.thumbs = [...this.querySelectorAll('[data-thumb]')];
    this.counter = this.querySelector('[data-gallery-current]');
    this.thumbs.forEach((thumb) => thumb.addEventListener('click', () => this.showMedia(thumb.dataset.thumb)));
    this.querySelectorAll('[data-gallery-step]').forEach((button) => {
      button.addEventListener('click', () => this.step(Number(button.dataset.galleryStep)));
    });

    if ('IntersectionObserver' in window && this.slides.length > 1) {
      const observer = new IntersectionObserver(
        (entries) => entries.forEach((entry) => entry.isIntersecting && this.setActive(entry.target.dataset.mediaId)),
        { root: this.track, threshold: 0.6 }
      );
      this.slides.forEach((slide) => observer.observe(slide));
    }
  }

  showMedia(id) {
    const slide = this.slides.find((s) => s.dataset.mediaId === String(id));
    if (!slide) return;
    this.track.scrollTo({ left: slide.offsetLeft - this.track.offsetLeft, behavior: 'smooth' });
    this.setActive(String(id));
  }

  step(direction) {
    const index = this.slides.findIndex((s) => s.dataset.mediaId === this.activeId);
    const next = this.slides[(index + direction + this.slides.length) % this.slides.length];
    this.showMedia(next.dataset.mediaId);
  }

  setActive(id) {
    this.activeId = id;
    this.thumbs.forEach((thumb) => thumb.setAttribute('aria-current', String(thumb.dataset.thumb === id)));
    if (this.counter) this.counter.textContent = this.slides.findIndex((s) => s.dataset.mediaId === id) + 1;
  }
}
customElements.define('product-gallery', ProductGallery);

/* ---------- Sticky add-to-cart bar ---------- */
class StickyBuyBar extends HTMLElement {
  connectedCallback() {
    this.target = document.getElementById(this.dataset.watch);
    this.footer = document.querySelector('.footer');
    if (!this.target) return;
    // A scroll check (rather than IntersectionObserver) also catches jumps straight past the buy buttons, e.g. anchor links.
    this.onScroll = () => {
      if (this.ticking) return;
      this.ticking = true;
      requestAnimationFrame(() => {
        this.ticking = false;
        const pastButtons = this.target.getBoundingClientRect().bottom < 0;
        const footerInView = this.footer && this.footer.getBoundingClientRect().top < window.innerHeight;
        const show = pastButtons && !footerInView;
        this.classList.toggle('is-visible', show);
        this.toggleAttribute('inert', !show);
      });
    };
    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.onScroll();
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', this.onScroll);
  }
}
customElements.define('sticky-buy-bar', StickyBuyBar);

/* ---------- Sound lab: tabs + optional audio previews ---------- */
class SoundLab extends HTMLElement {
  connectedCallback() {
    this.tabs = [...this.querySelectorAll('[role="tab"]')];
    this.panels = [...this.querySelectorAll('[role="tabpanel"]')];
    this.audio = new Audio();
    this.audio.preload = 'none';
    this.audio.addEventListener('ended', () => this.setPlaying(null));

    this.tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => this.select(index));
      tab.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
        event.preventDefault();
        const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + this.tabs.length) % this.tabs.length;
        this.select(next);
        this.tabs[next].focus();
      });
    });

    this.addEventListener('click', (event) => {
      const button = event.target.closest('[data-sound-src]');
      if (!button) return;
      const track = button.closest('.sound-track');
      if (this.current === track) {
        this.audio.pause();
        this.setPlaying(null);
        return;
      }
      this.audio.src = button.dataset.soundSrc;
      this.audio.play().then(() => this.setPlaying(track)).catch(() => this.setPlaying(null));
    });
  }

  select(index) {
    this.tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    this.panels.forEach((panel, i) => { panel.hidden = i !== index; });
  }

  setPlaying(track) {
    this.current?.classList.remove('is-playing');
    this.current?.querySelector('[data-sound-src]')?.setAttribute('aria-pressed', 'false');
    this.current = track;
    track?.classList.add('is-playing');
    track?.querySelector('[data-sound-src]')?.setAttribute('aria-pressed', 'true');
  }

  disconnectedCallback() {
    this.audio.pause();
  }
}
customElements.define('sound-lab', SoundLab);

/* ---------- Auto-submitting selects (e.g. collection sort) ---------- */
document.addEventListener('change', (event) => {
  if (event.target.matches('select[data-auto-submit]')) event.target.form.submit();
});
