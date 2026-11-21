# Retirar Contacto de la navegación

## Decisión

Quitar el enlace a `/contacto` tanto del navbar como de la navegación del footer. Mantener la página publicada e indexable y conservar allí la información de la sede, incluida la dirección.

## Alcance

El cambio se limita a las listas de enlaces de navegación en `components/navbar.tsx` y `components/footer.tsx`. No se elimina ni modifica la página de contacto, sus metadatos, su ruta o su contenido. El enlace de contacto deja de mostrarse en ambos menús.

## Alternativa descartada

Quitar el enlace sólo del navbar y conservarlo en el footer mantendría la página accesible desde la navegación global. Se descarta porque el usuario pidió retirarlo de ambos lugares para evitar fricción a potenciales leads.

## Verificación

Comprobar que `/contacto` siga disponible e indexable y que las dos listas de navegación ya no incluyan ese enlace. Correr las verificaciones pertinentes al cambio de navegación.
