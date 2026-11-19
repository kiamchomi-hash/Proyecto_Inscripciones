import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import { chromium } from 'playwright';
import { cargarTelefono } from '../aux/adaptador-playwright.mjs';

test('aplica el móvil aunque siga presente el editor anterior de teléfono', {
  skip: !existsSync(chromium.executablePath()) && 'Chromium de Playwright no instalado',
}, async () => {
  const navegador = await chromium.launch();
  try {
    const pagina = await navegador.newPage();
    pagina.setDefaultTimeout(2500);
    await pagina.setContent(`
      <input aria-label="Número de móvil *" readonly>
      <section id="uiopenpopup-56">
        <h2>Editar Número de teléfono</h2>
        <input value="1112345678">
        <button aria-disabled="true" tabindex="-1">Aplicar</button>
      </section>
      <section id="uiopenpopup-57" hidden>
        <h2>Editar Número de móvil</h2>
        <button>Eliminar formato de número</button>
        <input type="tel" aria-label="Editor" value="+54">
        <button>Aplicar</button>
      </section>
      <script>
        const movil = document.querySelector('[aria-label="Número de móvil *"]');
        const editor = document.querySelector('#uiopenpopup-57');
        const numero = editor.querySelector('input');
        const [eliminar, aplicar] = editor.querySelectorAll('button');
        movil.onclick = () => { editor.hidden = false; };
        eliminar.onclick = () => { numero.type = 'text'; numero.value = ''; eliminar.remove(); };
        aplicar.onclick = () => {
          if (numero.type === 'text') movil.value = numero.value;
          editor.hidden = true;
        };
      </script>
    `);
    await cargarTelefono(pagina, 'Número de móvil', '1198765432', () => {});
    assert.equal(await pagina.getByRole('textbox', { name: 'Número de móvil *', exact: true }).inputValue(), '1198765432');
    assert.equal(await pagina.locator('#uiopenpopup-56 input').inputValue(), '1112345678');
  } finally {
    await navegador.close();
  }
});
