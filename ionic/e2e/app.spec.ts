import { expect, test } from '@playwright/test';

// Comprueba que la app arranca y valida el login sin depender de la API
test('el login valida antes de enviar', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible();
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Escribe un correo válido')).toBeVisible();
  await expect(page.getByText('Escribe tu contraseña')).toBeVisible();
});

test('sin sesión, las páginas de la app llevan al login', async ({ page }) => {
  await page.goto('/pedidos');
  await expect(page).toHaveURL(/\/login/);
});
