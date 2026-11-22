// Aluno: bloqueio por pré-requisito (R1) e matrícula que aparece na grade.
// O segundo teste grava duas matrículas da Mariana (100000002); o afterEach as cancela pela API.
const { test, expect } = require('@playwright/test');
const { aluno, entrarPelaTela, cancelarMatriculas } = require('./apoio');

test('R1: calouro vê ALG0102 bloqueado, com o motivo', async ({ page }) => {
  await entrarPelaTela(page, aluno('100000001'));
  await expect(page).toHaveURL(/#\/aluno\/ofertas$/);

  const card = page.locator('.card-turma', { hasText: 'ALG0102 — ' });
  await expect(card).toHaveClass(/bloqueada/);
  await expect(card).toContainText('Faltam pré-requisitos: ALG0101.');
  await expect(card.getByRole('button', { name: 'Matricular' })).toBeDisabled();
});

test.describe('matrícula', () => {
  test.afterEach(async ({ baseURL }) => {
    await cancelarMatriculas(baseURL, '100000002', ['ALG0102-22', 'FRT0201-42']);
  });

  test('Mariana se matricula em ALG0102 e FRT0201 e vê as duas na grade', async ({ page }) => {
    await entrarPelaTela(page, aluno('100000002'));
    await expect(page).toHaveURL(/#\/aluno\/ofertas$/);

    for (const [codigo, nome] of [['ALG0102', 'Algoritmos II'], ['FRT0201', 'Front-end Avançado']]) {
      const card = page.locator('.card-turma', { hasText: codigo + ' — ' });
      await card.getByRole('button', { name: 'Matricular' }).click();
      await expect(page.getByRole('alert').filter({ hasText: 'Matrícula realizada em ' + nome })).toBeVisible();
      await expect(card.getByText('Matriculado')).toBeVisible();
    }

    await page.getByRole('link', { name: /Ver minha grade/ }).click();
    await expect(page).toHaveURL(/#\/aluno\/grade$/);
    await expect(page.getByRole('heading', { name: /Minha grade/ })).toBeVisible();
    await expect(page.getByText('2 disciplinas')).toBeVisible();
    await expect(page.getByText('Algoritmos II').filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText('Front-end Avançado').filter({ visible: true }).first()).toBeVisible();
  });
});
