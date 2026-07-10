/**
 * Génération de concepts d'avatars via l'API Tripo AI (text-to-3D).
 *
 * Usage HORS LIGNE uniquement (direction artistique / références) — ne jamais
 * appeler Tripo depuis l'app mobile : la clé serait extractible par n'importe
 * quel utilisateur et chaque génération consomme des crédits payants.
 *
 *   TRIPO_API_KEY=tsk_xxx node scripts/tripo-avatar-concepts.mjs
 *
 * Les modèles générés (.glb) et leurs aperçus sont listés avec leurs URLs de
 * téléchargement à la fin de l'exécution.
 */

const API_KEY = process.env.TRIPO_API_KEY;
if (!API_KEY) {
  console.error('Définis TRIPO_API_KEY (jamais en dur dans le code, jamais commitée).');
  process.exit(1);
}

const BASE = 'https://api.tripo3d.ai/v2/openapi';
const HEADERS = { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' };

const CONCEPTS = [
  ['novice-maigre', 'chibi flat design karate student, very skinny body, white gi, white belt, minimalist, T-pose'],
  ['novice-rond', 'chibi flat design karate student, chubby round body, white gi, white belt, minimalist, T-pose'],
  ['intermediaire', 'chibi flat design martial artist, fit athletic body, light gi, blue belt, white headband, minimalist, T-pose'],
  ['athlete', 'chibi flat design martial artist, muscular body, dark gi, red belt, red headband, minimalist, T-pose'],
  ['hero', 'chibi flat design martial arts master, very muscular heroic body, black gi with gold trim, black belt, golden aura, minimalist, T-pose'],
];

async function createTask(prompt) {
  const res = await fetch(`${BASE}/task`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ type: 'text_to_model', prompt }),
  });
  const json = await res.json();
  if (json.code !== 0) throw new Error(`Tripo: ${JSON.stringify(json)}`);
  return json.data.task_id;
}

async function waitTask(taskId) {
  for (;;) {
    const res = await fetch(`${BASE}/task/${taskId}`, { headers: HEADERS });
    const json = await res.json();
    const task = json.data;
    if (task.status === 'success') return task;
    if (['failed', 'cancelled', 'banned', 'expired'].includes(task.status)) {
      throw new Error(`Tâche ${taskId} : ${task.status}`);
    }
    process.stdout.write(`  ${task.status} ${task.progress ?? 0}%\r`);
    await new Promise((r) => setTimeout(r, 5000));
  }
}

for (const [name, prompt] of CONCEPTS) {
  console.log(`\n▶ ${name}`);
  try {
    const taskId = await createTask(prompt);
    const task = await waitTask(taskId);
    console.log(`\n  modèle : ${task.output?.pbr_model ?? task.output?.model ?? 'n/a'}`);
    console.log(`  aperçu : ${task.output?.rendered_image ?? 'n/a'}`);
  } catch (e) {
    console.error(`  échec : ${e.message}`);
  }
}
