// Secretaria monta a oferta e o sistema recusa o conflito de horário do professor (R5).
// Grava a turma MAT0101-51 no Firestore; o afterEach a remove pela API mesmo que o teste falhe.
const { test, expect } = require('@playwright/test');
const { SECRETARIA, entrarPelaTela, removerTurmas } = require('./apoio');

test.afterEach(async ({ baseURL }) => {
  await removerTurmas(baseURL, ['MAT0101-51']);
});

test('R5: recusa Ana às 21 (já tem ALG0101-21) e aceita às 51', async ({ page }) => {
  await entrarPelaTela(page, SECRETARIA);
  await page.goto('/#/admin/turmas');

  await page.getByLabel('Disciplina').selectOption('MAT0101');
  await page.getByLabel('Professor (menor carga primeiro)').selectOption('prof-ana');
  // Dia e turno iniciais (Segunda, Manhã) formam o código 21, que Ana já ocupa.
  await expect(page.getByText('Código de horário:')).toContainText('21');
  await expect(page.getByRole('alert').filter({ hasText: 'O professor já tem turma neste horário.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ofertar turma' })).toBeDisabled();

  await page.getByLabel('Dia').selectOption('5'); // Quinta → 51
  await expect(page.getByText('Código de horário:')).toContainText('51');
  await expect(page.getByRole('button', { name: 'Ofertar turma' })).toBeEnabled();

  await page.getByRole('button', { name: 'Ofertar turma' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Turma MAT0101-51 ofertada.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Excluir MAT0101-51' })).toBeVisible();
});
