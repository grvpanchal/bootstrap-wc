import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://bootstrap-wc.dev',
  integrations: [
    starlight({
      title: 'Bootstrap Web Components',
      description: 'Bootstrap 5 as framework-agnostic Web Components. Own the code. Ship anywhere.',
      logo: { src: './src/assets/logo.svg', replacesTitle: false },
      social: {
        github: 'https://github.com/grvpanchal/bootstrap-wc',
      },
      editLink: {
        baseUrl: 'https://github.com/grvpanchal/bootstrap-wc/edit/main/apps/docs/',
      },
      customCss: [
        // Bootstrap CSS is loaded globally so examples render correctly.
        './src/styles/bootstrap.css',
        './src/styles/custom.css',
      ],
      head: [
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css',
          },
        },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', link: '/getting-started/introduction/' },
            { label: 'Installation', link: '/getting-started/installation/' },
            { label: 'CLI (bwc)', link: '/getting-started/cli/' },
            { label: 'Theming', link: '/getting-started/theming/' },
            { label: 'TypeScript', link: '/getting-started/typescript/' },
            { label: 'Framework integration', link: '/getting-started/frameworks/' },
          ],
        },
        {
          label: 'Components',
          autogenerate: { directory: 'components' },
        },
      ],
    }),
  ],
});
