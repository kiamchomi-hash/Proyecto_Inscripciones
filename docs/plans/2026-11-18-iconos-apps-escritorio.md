# Íconos de escritorio — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Distinguir Carga de leads y Revisión de pagos en el escritorio.

**Architecture:** Guardar dos SVG locales y referenciarlos mediante `Icon=` en los accesos existentes. Conservar `Exec=`, los permisos de ejecución y la confianza de los lanzadores.

**Tech Stack:** SVG y lanzadores `.desktop` de Linux.

---

### Tarea 1: Crear, aplicar y verificar los íconos

1. Confirmar el estado inicial: los accesos `~/Escritorio/Carga de leads.desktop` y `~/Escritorio/revision-pagos.desktop` tienen ícono genérico o sin configurar.
2. Crear `~/.local/share/icons/cau-carga-leads.svg` y `~/.local/share/icons/cau-revision-pagos.svg` según el diseño aprobado.
3. Apuntar `Icon=` en cada lanzador a su SVG, sin cambiar los demás campos.
4. Renderizar ambos SVG a 32 px y verificar que cada lanzador reconozca el ícono y conserve su comando.
