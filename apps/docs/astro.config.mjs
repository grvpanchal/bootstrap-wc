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
        {
          // Mirror Starlight's `data-theme` to Bootstrap's `data-bs-theme`
          // so Bootstrap's CSS variables follow the user's light/dark
          // preference and Bootstrap components inside `.bwc-example` match
          // the surrounding docs theme.
          tag: 'script',
          content: `
            (function () {
              var root = document.documentElement;
              function sync() {
                var t = root.getAttribute('data-theme');
                if (t === 'dark') root.setAttribute('data-bs-theme', 'dark');
                else root.removeAttribute('data-bs-theme');
              }
              sync();
              new MutationObserver(sync).observe(root, {
                attributes: true,
                attributeFilter: ['data-theme'],
              });
            })();
          `,
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
