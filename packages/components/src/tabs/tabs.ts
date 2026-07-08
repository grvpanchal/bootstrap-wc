import { css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement } from '@bootstrap-wc/core';

/**
 * A single tab entry in `<bs-tabs>`'s data-driven `tabs` array. Mirrors
 * `<bs-tab-panel>`'s public API so callers can hop between prop-driven and
 * slot-driven authoring without changing anything else.
 */
export interface TabData {
  /** Unique panel id — matches the tab's `aria-controls`. */
  name: string;
  /** Text shown in the tab button. */
  label: string;
  /** Tab-panel HTML. Uses `.innerHTML` — trust your inputs. */
  content?: string;
  active?: boolean;
  disabled?: boolean;
}

/**
 * `<bs-tabs>` — Bootstrap tabbed interface.
 *
 * **Dual-nature content:** either author `<bs-tab-panel name="..." label="...">`
 * children directly, OR set the `tabs` property (or an `tabs='[…]'` JSON
 * attribute) to build the tablist AND the panels from data. When both are
 * provided, `tabs` wins and the slot is ignored — makes it easy to swap
 * between static markup and a zustand/redux store without touching the
 * surrounding template.
 *
 * ```html
 * <!-- Slot form -->
 * <bs-tabs>
 *   <bs-tab-panel name="home" label="Home">Home body</bs-tab-panel>
 *   <bs-tab-panel name="profile" label="Profile">Profile body</bs-tab-panel>
 * </bs-tabs>
 *
 * <!-- Data form -->
 * <bs-tabs
 *   tabs='[
 *     {"name":"home","label":"Home","content":"Home body","active":true},
 *     {"name":"profile","label":"Profile","content":"Profile body"}
 *   ]'
 * ></bs-tabs>
 * ```
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
  /**
   * Data-driven tab list. When non-empty, both the tablist and the panel
   * bodies are generated from this array and any `<bs-tab-panel>` children
   * are ignored. Panel bodies come from `content` as raw HTML — sanitise on
   * the store side if the data isn't fully trusted.
   */
  @property({ type: Array }) tabs: TabData[] = [];

  @state() private _panels: { name: string; label: string; disabled: boolean }[] = [];

  override connectedCallback() {
    super.connectedCallback();
    queueMicrotask(() => this._sync());
    this.addEventListener('slotchange', this._sync);
  }

  private _sync = () => {
    if (this.tabs && this.tabs.length) {
      // Data-driven mode — panels come from the `tabs` array, not the DOM.
      this._panels = this.tabs.map((t) => ({
        name: t.name,
        label: t.label,
        disabled: !!t.disabled,
      }));
      if (!this.active) {
        const first = this.tabs.find((t) => t.active) ?? this.tabs[0];
        if (first) this.active = first.name;
      }
      return;
    }
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
    if (this.tabs && this.tabs.length) return; // data-driven panels render themselves
    this.querySelectorAll<HTMLElement>('bs-tab-panel').forEach((p) => {
      const name = p.getAttribute('name');
      if (name === this.active) p.setAttribute('active', '');
      else p.removeAttribute('active');
    });
  }

  override updated(changed: Map<string, unknown>) {
    super.updated(changed);
    if (changed.has('tabs')) this._sync();
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
    const dataDriven = !!(this.tabs && this.tabs.length);
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
          ${dataDriven
            ? this.tabs.map((t) => {
                const isActive = t.name === this.active;
                const paneClasses = classMap({
                  'tab-pane': true,
                  fade: !this.noFade,
                  show: isActive,
                  active: isActive,
                });
                return html`<div
                  part="panel"
                  class=${paneClasses}
                  role="tabpanel"
                  id=${t.name}
                  aria-labelledby=${`${t.name}-tab`}
                  tabindex="0"
                  .innerHTML=${t.content ?? ''}
                ></div>`;
              })
            : html`<slot></slot>`}
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
