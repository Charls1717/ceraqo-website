#!/usr/bin/env bash
# Deploy gate: proves the new build renders measurably sharper than the
# rollback baseline on a >1920-physical-pixel viewport (1440 CSS x dpr2),
# with screenshots for visual sign-off.
#   usage: sharpness-gate.sh <baseline-ref> <outdir>
set -euo pipefail
cd "$(dirname "$0")/.."
REF=${1:?baseline ref}
OUT=${2:?output dir}
mkdir -p "$OUT"

WT=/tmp/cq-baseline
git worktree remove --force "$WT" 2>/dev/null || true
git worktree add --force "$WT" "$REF" >/dev/null
ln -sfn "$PWD/node_modules" "$WT/node_modules"

(cd "$WT" && npx vite build --logLevel error >/dev/null)
npx vite build --logLevel error >/dev/null

(cd "$WT" && npx vite preview --port 4599 --strictPort >/dev/null 2>&1 &)
(npx vite preview --port 4598 --strictPort >/dev/null 2>&1 &)
for p in 4599 4598; do until curl -s -o /dev/null "http://localhost:$p"; do sleep 0.5; done; done

cat > "$OUT/shot.mjs" <<'EOF'
import { chromium } from '@playwright/test';
const [url, out] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.goto(url);
await page.waitForSelector('.loader[data-done="true"]', { timeout: 180000 });
await page.waitForFunction(() => {
  const s = window.__frameLoadState;
  return !s || s.loaded >= s.total; // baseline may not expose it
}, undefined, { timeout: 180000 }).catch(() => {});
await page.waitForTimeout(1000);
await page.evaluate(() => {
  const t = document.querySelector('.dive-track');
  const max = t.offsetTop + t.offsetHeight - innerHeight;
  scrollTo(0, Math.round(0.25 * max));
});
await page.waitForTimeout(1800);
await page.screenshot({ path: out });
await browser.close();
EOF

node "$OUT/shot.mjs" http://localhost:4599 "$OUT/baseline.png"
node "$OUT/shot.mjs" http://localhost:4598 "$OUT/new.png"

pkill -f "[v]ite preview" || true
git worktree remove --force "$WT" 2>/dev/null || true

python3 - "$OUT" <<'PY'
import subprocess, sys
out = sys.argv[1]
def sharp(path):
    # centre crop excludes HUD text, measures the film only
    r = subprocess.run(['ffmpeg','-i',path,'-vf',
        'crop=iw*0.6:ih*0.6:iw*0.2:ih*0.2,format=gray,sobel,signalstats,metadata=print',
        '-f','null','-'],capture_output=True,text=True).stderr
    vals=[l for l in r.split('\n') if 'YAVG' in l]
    return float(vals[-1].split('=')[-1])
b = sharp(f'{out}/baseline.png'); n = sharp(f'{out}/new.png')
print(f'sobel-energy centre-crop: baseline={b:.3f} new={n:.3f} ratio={n/max(b,0.001):.3f}x')
print('GATE:', 'PASS' if n > b else 'FAIL')
PY
