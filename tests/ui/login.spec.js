// Login e proteção de rotas. Só lê: não grava nada no banco.
const { test, expect } = require('@playwright/test');
const { aluno, entrarPelaTela } = require('./apoio');

test('rota protegida sem sessão volta ao login', async ({ page }) => {
  await page.goto('/#/aluno/ofertas');
  await expect(page).toHaveURL(/#\/login$/);
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
});

test('senha errada mostra o aviso e continua no login', async ({ page }) => {
  await entrarPelaTela(page, { ...aluno('100000001'), senha: 'errada123' });
  await expect(page.getByRole('alert')).toContainText('incorretos');
  await expect(page).toHaveURL(/#\/login$/);
});

test('campos vazios são recusados antes de chamar a API', async ({ page }) => {
  await page.goto('/#/login');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByLabel('Matrícula ou e-mail')).toHaveAttribute('aria-invalid', 'true');
});

test('aluno entra e cai na tela de matrícula', async ({ page }) => {
  await entrarPelaTela(page, aluno('100000001'));
  await expect(page).toHaveURL(/#\/aluno\/ofertas$/);
  await expect(page.getByRole('heading', { name: 'Matrícula' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toContainText('Lucas Pereira');
});
