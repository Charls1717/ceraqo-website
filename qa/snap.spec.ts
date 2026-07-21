import { expect, test, type Page } from '@playwright/test';

/**
 * QA for the snap dive + the verbatim client copy.
 *
 * The dive is a five-state machine (OBJECT DROP SPREAD BOND LATTICE):
 * forward = one native <video> transition per scroll step (input locked,
 * one forward step queueable), backward = quick cross-fade, exit clip
 * releases the page below LATTICE. State is published on
 * window.__diveState / __divePreload for these tests.
 */

declare global {
  interface Window {
    __diveState?: { state: number; mode: string; captured: boolean; queued: boolean };
    __divePreload?: { progress: number; ready: boolean; videosReady: boolean[] };
    __marker?: () => Promise<void>;
    __hundredAt?: number;
    __doneAt?: number;
  }
}

const dive = (page: Page) => page.evaluate(() => window.__diveState);

async function waitLoaderDone(page: Page) {
  await page.waitForSelector('.loader[data-done="true"]', { state: 'attached', timeout: 90_000 });
  await page.waitForTimeout(500);
}

/** Wheel toward the dive until the state machine captures the page. */
async function approachAndCapture(page: Page) {
  for (let i = 0; i < 40; i++) {
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(100);
    if ((await dive(page))?.captured) break;
  }
  await page.waitForFunction(() => window.__diveState?.captured === true, undefined, {
    timeout: 10_000,
  });
  await page.waitForFunction(() => window.__diveState?.mode === 'rest', undefined, {
    timeout: 10_000,
  });
  await page.waitForTimeout(500);
}

async function stepForward(page: Page) {
  await page.mouse.wheel(0, 260);
}

const waitRestAt = (page: Page, state: number, timeout = 30_000) =>
  page.waitForFunction(
    (s) => window.__diveState?.mode === 'rest' && window.__diveState.state === s,
    state,
    { timeout },
  );

test.describe('loader (part 2)', () => {
  test('percentage is bound to the dismissal condition — 100% means interactive', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const watch = () => {
        const pct = document.querySelector('.loader__pct');
        const loader = document.querySelector('.loader');
        if (!pct || !loader) {
          requestAnimationFrame(watch);
          return;
        }
        const note = () => {
          if (!window.__hundredAt && pct.textContent?.includes('100')) {
            window.__hundredAt = performance.now();
          }
          if (!window.__doneAt && loader.getAttribute('data-done') === 'true') {
            window.__doneAt = performance.now();
          }
        };
        new MutationObserver(note).observe(document.documentElement, {
          attributes: true,
          childList: true,
          subtree: true,
          characterData: true,
        });
        note();
      };
      watch();
    });
    await page.goto('/');
    await waitLoaderDone(page);
    const { hundredAt, doneAt } = await page.evaluate(() => ({
      hundredAt: window.__hundredAt,
      doneAt: window.__doneAt,
    }));
    expect(hundredAt, 'loader percentage reached 100%').toBeTruthy();
    expect(doneAt, 'loader dismissed').toBeTruthy();
    const gapS = ((doneAt as number) - (hundredAt as number)) / 1000;
    console.log(`loader gap 100% -> dismissed: ${gapS.toFixed(3)}s`);
    expect(gapS, '100% and dismissal are the same moment').toBeLessThan(1.0);
    // And the page is genuinely interactive: a wheel input scrolls it.
    const y0 = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(700);
    const y1 = await page.evaluate(() => window.scrollY);
    expect(y1).toBeGreaterThan(y0);
  });
});

test.describe('snap dive (part 1)', () => {
  test('forward steps play video transitions and land on exact HUD anchors', async ({ page }) => {
    await page.goto('/');
    await waitLoaderDone(page);
    await approachAndCapture(page);
    expect((await dive(page))?.state).toBe(0);

    // Step 1: OBJECT -> DROP must be a video playback, not a fade
    await stepForward(page);
    await page.waitForFunction(() => window.__diveState?.mode === 'video', undefined, {
      timeout: 8_000,
    });
    const during = await page.evaluate(() => {
      const v = Array.from(document.querySelectorAll<HTMLVideoElement>('.dive-video')).find(
        (x) => !x.paused,
      );
      return v ? { t: v.currentTime, d: v.duration } : null;
    });
    expect(during, 'a transition video is actually playing').toBeTruthy();
    await waitRestAt(page, 1);
    await expect(page.locator('.hud__mag')).toHaveText('32×');
    await expect(page.locator('.overlay--zone').nth(1)).toBeVisible();
    await expect(page.locator('.overlay--zone').nth(1)).toContainText(
      '35–50 ml protects an entire car.',
    );

    // Steps 2-4 land on 1,000x / 31,623x / 1,000,000x
    await page.waitForTimeout(500);
    await stepForward(page);
    await waitRestAt(page, 2);
    await expect(page.locator('.hud__mag')).toHaveText('1,000×');
    await page.waitForTimeout(500);
    await stepForward(page);
    await waitRestAt(page, 3);
    await expect(page.locator('.hud__mag')).toHaveText('31,623×');
    await page.waitForTimeout(500);
    await stepForward(page);
    await waitRestAt(page, 4, 40_000);
    await expect(page.locator('.hud__mag')).toHaveText('1,000,000×');
    await expect(page.locator('.overlay--zone').nth(4)).toContainText(
      'Hardness up to 9H. Effective for up to 72 months.',
    );
    await page.screenshot({ path: 'qa/snap-lattice.png' });
  });

  test('input is locked during playback; one forward step queues', async ({ page }) => {
    await page.goto('/');
    await waitLoaderDone(page);
    await approachAndCapture(page);
    await stepForward(page);
    await page.waitForFunction(() => window.__diveState?.mode === 'video', undefined, {
      timeout: 8_000,
    });
    // Hammer the wheel mid-playback: exactly one extra step may queue.
    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(70);
    }
    expect((await dive(page))?.queued).toBe(true);
    await waitRestAt(page, 2, 45_000); // arrives at DROP, then queued step to SPREAD
    await page.waitForTimeout(1200);
    const st = await dive(page);
    expect(st?.state, 'queued exactly one step — no further').toBe(2);
    expect(st?.mode).toBe('rest');
  });

  test('backward step is a quick cross-fade to the previous rest', async ({ page }) => {
    await page.goto('/');
    await waitLoaderDone(page);
    await approachAndCapture(page);
    await stepForward(page);
    await waitRestAt(page, 1);
    await page.waitForTimeout(600);
    const t0 = Date.now();
    await page.mouse.wheel(0, -260);
    await waitRestAt(page, 0, 5_000);
    const backS = (Date.now() - t0) / 1000;
    console.log(`backward fade took ${backS.toFixed(2)}s`);
    expect(backS, 'backward is a fade, not a reverse playback').toBeLessThan(2.5);
    await expect(page.locator('.hud__mag')).toHaveText('1.0×');
  });

  test('rail jumps fade directly to any zone', async ({ page }) => {
    await page.goto('/');
    await waitLoaderDone(page);
    await approachAndCapture(page);
    await page.locator('.hud__zone').nth(4).click();
    await waitRestAt(page, 4, 8_000);
    await expect(page.locator('.hud__mag')).toHaveText('1,000,000×');
    await page.locator('.hud__zone').nth(1).click();
    await waitRestAt(page, 1, 8_000);
    await expect(page.locator('.hud__mag')).toHaveText('32×');
  });

  test('exit clip releases the page into the content below, and re-entry restores LATTICE', async ({
    page,
  }) => {
    await page.goto('/');
    await waitLoaderDone(page);
    await approachAndCapture(page);
    await page.locator('.hud__zone').nth(4).click();
    await waitRestAt(page, 4, 8_000);
    await page.waitForTimeout(600);
    const diveTop = await page.evaluate(
      () => document.getElementById('dive')!.getBoundingClientRect().top + window.scrollY,
    );
    await stepForward(page);
    await page.waitForFunction(() => window.__diveState?.mode === 'video', undefined, {
      timeout: 8_000,
    });
    await page.waitForFunction(() => window.__diveState?.captured === false, undefined, {
      timeout: 30_000,
    });
    await page.waitForTimeout(1600);
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY, 'released below the dive').toBeGreaterThan(diveTop + 300);
    await expect(page.locator('#mtp-title')).toBeVisible();

    // Scroll back up: the dive recaptures at LATTICE
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(250);
    await page.mouse.wheel(0, -300);
    await page.waitForFunction(() => window.__diveState?.captured === true, undefined, {
      timeout: 10_000,
    });
    await waitRestAt(page, 4, 8_000);
    await expect(page.locator('.hud__mag')).toHaveText('1,000,000×');
  });

  test('background preloading fills remaining transitions during dwell', async ({ page }) => {
    await page.goto('/');
    await waitLoaderDone(page);
    await page.waitForFunction(
      () => window.__divePreload?.videosReady.every((v) => v) === true,
      undefined,
      { timeout: 60_000 },
    );
    const pre = await page.evaluate(() => window.__divePreload);
    expect(pre?.videosReady).toEqual([true, true, true, true, true]);
  });

  test('mobile viewport steps with touch swipes', async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      deviceScaleFactor: 3,
    });
    const page = await ctx.newPage();
    await page.goto('/');
    await waitLoaderDone(page);
    const swipeUp = async () => {
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: 195, y: 640 }],
      });
      for (let y = 640; y >= 420; y -= 44) {
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x: 195, y }],
        });
        await page.waitForTimeout(16);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await cdp.detach();
    };
    // Approach: swipe until captured
    for (let i = 0; i < 14; i++) {
      await swipeUp();
      await page.waitForTimeout(350);
      if ((await dive(page))?.captured) break;
    }
    await page.waitForFunction(() => window.__diveState?.captured === true, undefined, {
      timeout: 15_000,
    });
    await page.waitForFunction(() => window.__diveState?.mode === 'rest', undefined, {
      timeout: 10_000,
    });
    await page.waitForTimeout(600);
    await swipeUp();
    await page.waitForFunction(() => window.__diveState?.mode === 'video', undefined, {
      timeout: 8_000,
    });
    await waitRestAt(page, 1);
    await expect(page.locator('.hud__mag')).toHaveText('32×');
    await page.screenshot({ path: 'qa/snap-mobile-drop.png' });
    await ctx.close();
  });

  test('reduced motion crosses between rests without autoplaying video', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await waitLoaderDone(page);
    await approachAndCapture(page);
    await stepForward(page);
    await waitRestAt(page, 1, 8_000);
    const played = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLVideoElement>('.dive-video')).some(
        (v) => v.currentTime > 0,
      ),
    );
    expect(played, 'no video playback under reduced motion').toBe(false);
    await expect(page.locator('.hud__mag')).toHaveText('32×');
    await ctx.close();
  });
});

test.describe('copy (part 3)', () => {
  test('title + meta description carry the approved copy', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('CERAQO™ Q-ARMOR — Advanced Surface Protection');
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toContain('More Than Protection. A New Generation of Surface Engineering.');
  });

  test('every approved line is on the page, verbatim', async ({ page }) => {
    await page.goto('/');
    await waitLoaderDone(page);
    // textContent, not innerText: several elements are styled uppercase
    // (kickers, chips, buttons) — the DOM copy underneath is verbatim.
    const body = (await page.evaluate(() => document.body.textContent ?? '')).replace(/\s+/g, ' ');
    const mustContain = [
      // Hero
      'Advanced Surface Protection',
      'The Future of Vehicle Protection Starts Here.',
      // Intro
      'For decades, protecting a vehicle has meant making compromises.',
      'Waxes fade.',
      'Sealants wear away.',
      'Professional coatings often require specialist skills, expensive equipment and complicated application procedures.',
      'Q-ARMOR changes everything.',
      'No professional installer. No complicated process. No compromise.',
      // Zone facts (unchanged)
      'A clear, colourless liquid based on silanes.',
      // Section 1
      'More Than Protection. A New Generation of Surface Engineering.',
      'Q-ARMOR is not designed to temporarily cover your vehicle. It is designed to become part of it. Once applied, it creates an ultra-thin, crystal-clear protective layer that bonds tightly with the surface to deliver long-lasting protection, exceptional gloss and effortless maintenance.',
      'This is not another wax. This is not another sealant. This is the next evolution of vehicle protection.',
      // Section 2
      'Why Q-Armor?',
      'Because your vehicle deserves more than temporary protection. Every drive exposes your paint to invisible damage.',
      'Road salt',
      'UV radiation',
      'Traffic film',
      'Industrial fallout',
      'Chemical contamination',
      'Daily abrasion',
      'Over time these elements slowly reduce the appearance, gloss and value of every vehicle. Q-ARMOR is engineered to help preserve what matters.',
      // Section 3
      'Professional Results. Made for Everyone.',
      'Advanced vehicle protection should not be limited to professional detailers. Q-ARMOR has been developed for enthusiasts and everyday drivers alike.',
      'Prepare the surface',
      'Allow the coating to cure',
      'That’s all. Professional-grade protection has never been this accessible.',
      // Section 4
      'Experience the Difference',
      'From the very first application you’ll notice the transformation.',
      'A deeper gloss.',
      'A smoother finish.',
      'Water beads and releases effortlessly.',
      'Cleaning becomes easier.',
      'The surface stays looking cleaner for longer.',
      'Your vehicle keeps the finish it deserves.',
      // Section 5
      'Engineered for Extreme Environments',
      'Originally developed for demanding applications across automotive, marine, aviation and transport industries, Q-ARMOR is built to perform where ordinary protection reaches its limits. Whether facing freezing winters, intense summer heat, coastal environments or daily commuting, Q-ARMOR delivers reliable protection where it matters most.',
      // Specs (all 13)
      'Up to 72 Months Protection*',
      'Up to 9H Pencil Hardness',
      'Deep Glass-Like Gloss',
      'Hydrophobic Performance',
      'Oleophobic Protection',
      'High Chemical Resistance',
      'Corrosion Resistance',
      'UV Protection',
      'High Abrasion Resistance',
      'Easy-to-Clean Effect',
      'Crystal Clear Finish',
      'Professional-Grade Performance',
      'Simple DIY Application',
      // Barrier + gloss + maintenance
      'Q-ARMOR forms a durable protective barrier that helps reduce the effects of:',
      '— while preserving the appearance of your vehicle.',
      'Deep Gloss. Crystal Clear Finish.',
      'Unlike products that leave heavy residues or artificial shine, Q-ARMOR enhances the natural depth of your vehicle’s finish. The result is a rich, reflective gloss that looks clean, sharp and refined.',
      'Easy Maintenance. Less Cleaning. More Driving.',
      'Its advanced surface characteristics help reduce the adhesion of water, dirt, oils and everyday contamination.',
      'Easier washing',
      'Faster drying',
      'Reduced maintenance effort',
      'A cleaner-looking vehicle between washes',
      // Long-term protection incl. the asterisk
      'Under suitable conditions, Q-ARMOR is designed to provide protection for up to 72 months.*',
      'Surface preparation',
      'Application quality',
      'Environmental conditions',
      'Vehicle usage',
      'Washing methods',
      'Maintenance routine',
      // Built to last
      'Built to Last',
      'Unlike conventional waxes and temporary sealants, Q-ARMOR creates a durable bond with compatible surfaces. It cannot simply be washed away during normal maintenance. Instead, it becomes an integrated protective layer designed to perform for years rather than weeks.',
      // Kit
      'One Kit. Everything Included.',
      'Each Q-ARMOR kit contains everything required for professional-quality application.',
      '50 ml Q-ARMOR',
      'Premium Applicator Pad',
      'Premium Microfiber Cloth',
      'Professional Application Guide',
      'One kit protects up to two large vehicles, depending on vehicle size and application method.',
      // Compatibility
      'Suitable For',
      'Classic Vehicles',
      'Motorcycles',
      'Caravans',
      'Powder-Coated Surfaces',
      'Aluminium',
      'Headlights',
      'Door Handles',
      // Science
      'The Science Behind Q-Armor',
      'Q-ARMOR creates an ultra-thin, transparent protective layer that forms a strong chemical bond with compatible surfaces. Unlike waxes or traditional sealants that gradually disappear through washing and weather exposure, this protective layer becomes tightly attached to the surface. The result is long-lasting protection combined with exceptional gloss, excellent water repellency and easier maintenance. The coating remains completely transparent, allowing the original colour and finish of the vehicle to remain unchanged while enhancing depth and clarity.',
      // Philosophy + closing
      'Designed Around One Philosophy',
      'Most products promise protection. Q-ARMOR was created to deliver something more.',
      'Confidence.',
      'Confidence every time you wash your vehicle.',
      'Confidence every time it rains.',
      'Confidence every time you park and look back.',
      'Because protecting your vehicle isn’t just about preserving paint. It’s about preserving the pride of ownership.',
      'Welcome to the Future of Surface Protection.',
      'Welcome to CERAQO™.',
      // Launch banner (kept from the original brief)
      'One bottle. One car.',
      // Waitlist mechanics (unchanged)
      'Join the Waitlist',
    ];
    const missing = mustContain.filter((s) => !body.includes(s.replace(/\s+/g, ' ')));
    expect(missing, `missing verbatim lines: ${JSON.stringify(missing, null, 2)}`).toEqual([]);
    // And the zone facts stay in the dive overlays
    for (const fact of [
      '35–50 ml protects an entire car.',
      'Wipe on. Buff. Cures at ambient temperature.',
      'A covalent bond with the paint. It cannot flake off or be washed off.',
      'Hardness up to 9H. Effective for up to 72 months.',
    ]) {
      await expect(page.locator('.overlay--zone', { hasText: fact })).toHaveCount(1);
    }
  });

  test('waitlist mechanics still work', async ({ page }) => {
    await page.goto('/');
    await waitLoaderDone(page);
    await page.locator('.waitlist__input').scrollIntoViewIfNeeded();
    await page.locator('.waitlist__input').fill('driver@example.com');
    await page.locator('.waitlist__btn').click();
    await expect(page.locator('.waitlist__ok')).toContainText('You’re on the list.');
  });
});
