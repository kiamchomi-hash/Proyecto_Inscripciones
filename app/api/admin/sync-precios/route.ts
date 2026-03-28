import { NextResponse } from 'next/server';

const GITHUB_REPO = 'kiamchomi-hash/Proyecto_Inscripciones';
const WORKFLOW_FILE = 'sync-precios.yml';

export async function POST() {
  const token = process.env.GITHUB_PAT;
  if (!token) {
    return NextResponse.json({ error: 'GITHUB_PAT no configurado' }, { status: 500 });
  }

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ ref: 'main' }),
    },
  );

  if (res.status === 204) {
    return NextResponse.json({ ok: true });
  }

  const body = await res.text();
  return NextResponse.json({ error: body }, { status: res.status });
}
