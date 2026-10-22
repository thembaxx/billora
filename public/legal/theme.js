// Read the app's preference before painting. Legal pages do not write personal data.
(() => {
  let theme = 'system';
  try {
    theme = JSON.parse(localStorage.getItem('billora-settings') || '{}').theme || 'system';
  } catch {
    // A blocked store follows the device appearance.
  }
  const system = matchMedia('(prefers-color-scheme: dark)');
  function applyTheme() {
    const dark = theme === 'dark' || (theme !== 'light' && system.matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]').content = dark ? '#17181c' : '#f5f5f8';
  }
  applyTheme();
  system.addEventListener('change', applyTheme);
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('[data-print]')?.addEventListener('click', () => window.print());
  });
})();
