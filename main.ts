// Sky Vault: Penthouse Heist — the hand-in program (Node 22, stdlib only).
//
// It stages the entry for the grader: the static game/ folder and the
// screenshots/ renders are copied from beside this file into the output
// directory, and dossier.json is written there with the vendored make.fun
// library's buildDossier, so the dossier always matches the files exactly.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The run is deterministic: copying files and hashing them writes the same
// bytes every time, so two runs produce identical output trees.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's own caps, from the bounty RULES: game/ at most 993 entries and
// 48 MiB, screenshots at most 4 files of 256 KiB, dossier text 160 KiB.
const GATE_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
} as const;

function stageTree() {
  mkdirSync(outputDir, { recursive: true });
  cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
  const shots = join(repoRoot, 'screenshots');
  if (existsSync(shots)) {
    cpSync(shots, join(outputDir, 'screenshots'), { recursive: true });
  }
}

stageTree();
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, GATE_CAPS),
);
