// Re-export every Starlight component shim so MDX `import { Card, CardGrid,
// Tabs, TabItem } from '@astrojs/starlight/components'` resolves to our
// bs-* equivalents via the vite alias in astro.config.mjs.
export { default as Card } from './Card.astro';
export { default as CardGrid } from './CardGrid.astro';
export { default as Tabs } from './Tabs.astro';
export { default as TabItem } from './TabItem.astro';
