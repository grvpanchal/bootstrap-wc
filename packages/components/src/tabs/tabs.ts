import { css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement } from '@bootstrap-wc/core';

/**
 * `<bs-tabs>` — Bootstrap tabbed interface. Expects `<bs-tab-panel>` children,
 * each with a `label` and `name`.
 *
 * @fires bs-tab-change - `{detail: {active}}` when active tab changes.
 */
export class BsTabs extends BootstrapElement {
  @property({ type: String }) active?: string;
  @property({ type: String, attribute: 'nav-style' }) navStyle: 'tabs' | 'pills' | 'underline' = 'tabs';
  @property({ type: String }) fill: 'none' | 'fill' | 'justified' = 'none';
  @property({ type: Boolean }) vertical = false;
  /** Opt out of the default `.fade` animation on tab panels. */
  @property({ type: Boolean, attribute: 'no-fade' }) noFade = false;

  @state() private _panels: { name: string; label: string; disabled: boolean }[] = [];

  override connectedCallback() {
    super.connectedCallback();
    queueMicrotask(() => this._sync());
    this.addEventListener('slotchange', this._sync);
  }

  private _sync = () => {
    const panels = Array.from(this.querySelectorAll<HTMLElement & { name?: string; label?: string; disabled?: boolean }>('bs-tab-panel'));
    this._panels = panels.map((p) => ({
      name: p.getAttribute('name') ?? '',
      label: p.getAttribute('label') ?? p.getAttribute('name') ?? '',
      disabled: p.hasAttribute('disabled'),
    }));
    // Propagate the fade setting to every panel so the panel's own shadow
    // picks the right class set.
    this.querySelectorAll<HTMLElement>('bs-tab-panel').forEach((p) => {
      if (this.noFade) p.setAttribute('no-fade', '');
      else p.removeAttribute('no-fade');
    });
    if (!this.active && this._panels[0]) this.active = this._panels[0].name;
    this._applyActive();
  };

  private _applyActive() {
    this.querySelectorAll<HTMLElement>('bs-tab-panel').forEach((p) => {
      const name = p.getAttribute('name');
      if (name === this.active) p.setAttribute('active', '');
      else p.removeAttribute('active');
    });
  }

  override updated(changed: Map<string, unknown>) {
    super.updated(changed);
    if (changed.has('noFade')) {
      this.querySelectorAll<HTMLElement>('bs-tab-panel').forEach((p) => {
        if (this.noFade) p.setAttribute('no-fade', '');
        else p.removeAttribute('no-fade');
      });
    }
    if (changed.has('active')) {
      this._applyActive();
      this.dispatchEvent(
        new CustomEvent('bs-tab-change', {
          bubbles: true,
          composed: true,
          detail: { active: this.active },
        }),
      );
    }
  }

  private _select(name: string) {
    if (this.active === name) return;
    this.active = name;
  }

  override render() {
    const navClasses = classMap({
      nav: true,
      'nav-tabs': this.navStyle === 'tabs',
      'nav-pills': this.navStyle === 'pills',
      'nav-underline': this.navStyle === 'underline',
      'nav-fill': this.fill === 'fill',
      'nav-justified': this.fill === 'justified',
      'flex-column': this.vertical,
    });
    const wrapperClasses = classMap({ 'd-flex': this.vertical });
    return html`
      <div part="wrapper" class=${wrapperClasses}>
        <ul
          part="nav"
          class=${navClasses}
          role="tablist"
          aria-orientation=${this.vertical ? 'vertical' : 'horizontal'}
        >
          ${this._panels.map(
            (p) => html`<li class="nav-item" role="presentation">
              <button
                part="tab"
                type="button"
                id=${`${p.name}-tab`}
                class="nav-link ${p.name === this.active ? 'active' : ''} ${p.disabled ? 'disabled' : ''}"
                role="tab"
                aria-selected=${p.name === this.active ? 'true' : 'false'}
                aria-controls=${p.name}
                tabindex=${p.name === this.active ? '0' : '-1'}
                ?disabled=${p.disabled}
                @click=${() => this._select(p.name)}
              >${p.label}</button>
            </li>`,
          )}
        </ul>
        <div part="content" class="tab-content flex-grow-1">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

defineElement('bs-tabs', BsTabs);

/** `<bs-tab-panel>` — a single panel. Requires `name` and `label` attrs. */
export class BsTabPanel extends BootstrapElement {
  /**
   * Bootstrap's `.tab-content > .tab-pane { display: none }` selector can't
   * reach across the shadow boundary to hide the inner `<div class="tab-
   * pane">` here, so without this rule every panel host stays
   * `display: block` and the inactive panels stack vertically below the
   * active one — pushing the active panel's content far below the tablist
   * and shifting it as the user switches tabs. Hide the host itself when
   * `active` isn't set so the active panel always renders directly below
   * the tabs nav.
   */
  static override styles = css`
    :host(:not([active])) {
      display: none;
    }
  `;

  @property({ type: String }) name = '';
  @property({ type: String }) label = '';
  @property({ type: Boolean, reflect: true }) active = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  /** Opt out of the default `.fade` animation. Normally set by the parent `<bs-tabs>`. */
  @property({ type: Boolean, attribute: 'no-fade', reflect: true }) noFade = false;

  override render() {
    const classes = classMap({
      'tab-pane': true,
      fade: !this.noFade,
      show: this.active,
      active: this.active,
    });
    return html`<div
      part="panel"
      class=${classes}
      role="tabpanel"
      id=${this.name}
      aria-labelledby=${`${this.name}-tab`}
      tabindex="0"
    ><slot></slot></div>`;
  }
}

defineElement('bs-tab-panel', BsTabPanel);

declare global {
  interface HTMLElementTagNameMap {
    'bs-tabs': BsTabs;
    'bs-tab-panel': BsTabPanel;
  }
}
