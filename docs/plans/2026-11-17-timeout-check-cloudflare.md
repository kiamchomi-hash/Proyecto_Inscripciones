# Plazo del check Cloudflare Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement the plan task-by-task.

**Goal:** Evitar que el publicador interrumpa el check integral de Cloudflare antes de que termine.

**Architecture:** `checkLocal` conservará el plazo general de cinco minutos y asignará treinta minutos sólo al comando integral de Cloudflare. Una prueba de contrato verificará ambos plazos mediante el ejecutor inyectable.

**Tech Stack:** Node.js, `node:test`.

---

### Task 1: Ampliar el plazo sólo para el check integral de Cloudflare

**Files:**
- Modify: `herramientas/deploy-check.mjs`
- Test: `tests/deploy.test.mjs`

**Steps:**
1. Extender la prueba de secuencia de comandos para comprobar los plazos: 300.000 ms en los comandos generales y 1.800.000 ms para `npm --prefix cloudflare run check`.
2. Ejecutar `node --test --test-name-pattern="instala el lock aislado de Cloudflare" tests/deploy.test.mjs` y verificar que falla por la ausencia del plazo especial.
3. Pasar el plazo como argumento al ejecutor y seleccionarlo sólo para el check integral de Cloudflare.
4. Repetir la prueba dirigida y luego `node --test tests/deploy.test.mjs`.
