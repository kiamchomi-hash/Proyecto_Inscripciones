# Guía práctica de verificación

## Objetivo

Reducir regresiones dando al agente una ruta breve para verificar cada cambio habitual y recordando fallas anteriores cuando el diff toque áreas relacionadas.

## Diseño

La guía será documentación del repositorio, no una nueva herramienta ni un gate. Indicará cómo elegir controles según el área afectada: código compartido, sitio Cloudflare, estilos/interfaz, datos/API o documentación. Reutilizará los comandos y límites ya declarados en `AGENTS.md` y `cloudflare/LEER.md`.

Un checklist pequeño relacionará señales visibles en archivos modificados con preguntas de confiabilidad basadas en incidentes documentados. Se limitará a disparadores accionables y verificables; no duplicará controles automáticos ni pretenderá cubrir todos los fallos.

## Fuera de alcance

- Gate local de commits o registro obligatorio por commit.
- Segunda revisión automática.
- Incorporar una librería de property testing sin un invariante concreto.
- Cambiar el workflow de publicación o las suites existentes.

## Aceptación

- Las instrucciones permiten elegir los controles correctos sin correr por rutina la suite completa de Cloudflare.
- El checklist vincula cada disparador a un riesgo conocido y una verificación concreta.
- No se atribuye al CI una cobertura que no tiene.
