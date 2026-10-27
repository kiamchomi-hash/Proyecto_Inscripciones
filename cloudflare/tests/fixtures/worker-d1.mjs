// Worker vacío exclusivamente del harness. No se importa desde src/ ni se publica.
export default { fetch() { return new Response(null, { status: 404 }); } };
