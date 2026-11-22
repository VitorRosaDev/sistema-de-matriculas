// Testes de interface (npm run test:ui). Sobem o servidor numa porta própria e usam o Firestore do serviceAccountKey.json.
const { defineConfig } = require('@playwright/test');

const PORTA = 3058;

module.exports = defineConfig({
  testDir: './tests/ui',
  workers: 1, // os testes gravam no mesmo banco: nada de paralelismo
  retries: 0,
  reporter: 'list',
  use: { baseURL: 'http://localhost:' + PORTA, locale: 'pt-BR', trace: 'retain-on-failure' },
  webServer: {
    command: 'node server.js',
    url: 'http://localhost:' + PORTA + '/api/sessao',
    env: { PORT: String(PORTA) },
    reuseExistingServer: false,
    timeout: 30000,
  },
});
