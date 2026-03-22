# Skill: Sincronizar Descuentos Especiales

Sincroniza los descuentos especiales de promoción desde el Excel de Siglo 21 hacia la columna `descuento_especial` de la tabla `carreras` en Supabase.

## Cuándo usar

- Después de cargar slides en una o varias carreras (skill `/cargar_carrera`)
- Cuando el usuario pida actualizar descuentos especiales
- Cuando haya un cambio de período promocional

## Flujo

1. **Ejecutar el scraper**: `node scripts/scrape-descuentos.mjs --cache --dry-run`
   - Usa `--cache` para no re-descargar el Excel si ya está en `/tmp/precios.xlsx`
   - Usa `--dry-run` para no tocar el descuento general en Supabase
   - La salida muestra los descuentos especiales detectados con el desglose

2. **Mostrar al usuario** las carreras especiales detectadas y sus descuentos puros (ya restado el base Siglo 21):
   - Matrícula, Ticket A, Ticket B (en porcentaje)
   - Solo las que tengan un descuento diferente al general ("Resto")

3. **Mapear nombres**: los nombres del Excel son abreviados. Usar el `NOMBRE_MAP` de `scripts/scrape-descuentos.mjs` o `scripts/precios-con-descuentos.mjs` para encontrar el nombre en Supabase.

4. **Actualizar Supabase**: para cada carrera especial, ejecutar:
   ```sql
   UPDATE carreras
   SET descuento_especial = '{"matricula": X, "ticket_a": Y, "ticket_b": Z}'::jsonb
   WHERE nombre = 'Nombre en Supabase';
   ```
   - Solo incluir las claves donde el descuento especial puro es > 0
   - Los valores son porcentajes enteros (ej: 55 para 55%)
   - El frontend suma automáticamente Siglo 21 + Sede + especial para mostrar el total

5. **Limpiar** carreras que ya no tienen descuento especial:
   ```sql
   UPDATE carreras SET descuento_especial = NULL WHERE nombre = '...' AND descuento_especial IS NOT NULL;
   ```

6. **Confirmar** con el usuario antes de ejecutar cada UPDATE

## Formato de `descuento_especial`

```typescript
interface DescuentoEspecial {
  matricula?: number | null;  // % especial puro en matrícula
  ticket_a?: number | null;   // % especial puro en 1ra cuota
  ticket_b?: number | null;   // % especial puro en 2da cuota
}
```

## Cálculo del especial puro

El Excel de Siglo 21 muestra el descuento TOTAL por carrera (incluye el general).
Para obtener la parte especial pura: `especial = valor_excel_carrera - valor_excel_resto`.

Ejemplo: si "Resto" tiene 5% en matrícula y "Abogacía" tiene 85%, el especial puro de Abogacía es 80%.

## Reglas

- **No cargar automáticamente** — siempre confirmar con el usuario
- **Solo carreras con slides** tienen sentido de actualizar (las tarjetas de descuento están en el slide de cierre)
- El descuento `tipo='sede'` (10%, amigo referido) y `tipo='universidad'` (Siglo 21) se manejan por separado en la tabla `descuentos`, NO en `descuento_especial`
- Si no hay descuentos especiales vigentes, no hace falta tocar nada
