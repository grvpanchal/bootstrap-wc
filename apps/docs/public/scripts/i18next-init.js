// Pre-init i18next on the i18next plugin doc page so <bs-i18n> elements have
// a translation backend ready by the time they upgrade.
if (window.i18next && !window.i18next.isInitialized) {
  window.i18next.init({
    lng: 'en',
    resources: {
      en: {
        translation: {
          welcome: {
            title: 'Welcome!',
            subtitle: 'You are reading the docs.',
          },
        },
      },
      fr: {
        translation: {
          welcome: {
            title: 'Bienvenue !',
            subtitle: 'Vous lisez la documentation.',
          },
        },
      },
    },
  });
}
