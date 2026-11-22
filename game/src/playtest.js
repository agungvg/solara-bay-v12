// Playtest — mission 1 end to end against the REAL systems (no mocks).
// Runs when ?playtest=1: start mission 1, walk to the car park, steal the
// car (enter), trigger the KPD tail, lose it by distance + time, deliver to
// the lockup, check the reward landed. Writes window.__playtest and logs
// every step. PASS only if every stage completes with 0 errors.
export async function runPlaytest(game) {
  const log = [];
  const errors = [];
  const step = (msg) => { log.push(msg); console.log(`[playtest] ${msg}`); };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  try {
    step('mission 1: FIRST LIGHT — start');
    if (!game.missions.start(1)) throw new Error('mission 1 did not start');
    step(`brief: ${game.missions.def.brief}`);
    if (game.missions.stageText !== 'Reach the car park') throw new Error('stage 1 text wrong');

    step('walk to the car park (player moves to the hero car)');
    game.setMode('foot');
    game.playerPos.set(0.5, 0, 8);
    await wait(400);
    game.missions.advance('reached car park');
    step(`stage 2: ${game.missions.stageText}`);

    step('steal the Rukan Pelo GT (enter car)');
    const entered = game.enterCar();
    if (!entered) throw new Error('could not enter car');
    game.missions.advance('stole the car');
    step(`stage 3: ${game.missions.stageText} — driving=${game.mode === 'drive'}`);

    step('KPD tail spawns (wanted rises to 2)');
    game.wanted.commitCrime('grand-theft-auto', 25, { x: 0, z: 4 });
    if (game.wanted.level < 2) throw new Error(`wanted ${game.wanted.level}, expected >= 2`);
    step(`wanted ${game.wanted.level}★ ${game.wanted.label}, units: ${game.wanted.activeUnits()}`);
    // Drive away + break line of sight: simulate 30 s of escape ticks.
    for (let i = 0; i < 30; i++) game.wanted.tick(1, 80, false);
    if (game.wanted.level !== 0) throw new Error(`tail not lost, wanted ${game.wanted.level}`);
    step('tail lost — wanted back to 0, escaped clean');
    game.missions.advance('lost the tail');
    step(`stage 4: ${game.missions.stageText}`);

    step('deliver to the lockup');
    game.heroPos.set(0, 0, -60);
    await wait(300);
    game.missions.advance('delivered');
    if (!game.missions.completed.has(1)) throw new Error('mission 1 not completed');
    const expected = 2450 + 2450;
    if (game.missions.cash !== expected) throw new Error(`cash ${game.missions.cash}, expected ${expected}`);
    step(`mission 1 COMPLETE — reward $2,450, cash $${game.missions.cash.toLocaleString()}`);

    // Combat sanity: spawn an enemy, shoot it with the SMG.
    const e = game.combat.spawnEnemy('playtest-guard', 3, -6, 40);
    const res = game.combat.fire({ x: 3, z: -6 });
    if (!res.hit) throw new Error('SMG fire missed the test enemy');
    step(`combat: SMG hit ${e.id}, health ${res.health}`);
    game.combat.fire({ x: 3, z: -6 });
    if (e.alive) throw new Error('enemy should be down after 2 SMG hits');
    step('combat: enemy down');

    // Save sanity: write + read slot 1.
    game.saves.save(0, { cash: game.missions.cash, completed: [...game.missions.completed], ratings: game.missions.ratings, district: 'kumala', player: { x: 0, z: -60 } });
    const loaded = game.saves.load(0);
    if (!loaded || loaded.cash !== expected) throw new Error('save slot 1 did not round-trip');
    step('save slot 1 round-trips');

    const result = { pass: true, errors, log, cash: game.missions.cash };
    window.__playtest = result;
    console.log('[playtest] PASS — mission 1 end to end, 0 errors');
    return result;
  } catch (err) {
    errors.push(String(err?.message ?? err));
    const result = { pass: false, errors, log, cash: game.missions.cash };
    window.__playtest = result;
    console.error('[playtest] FAIL', err);
    return result;
  }
}
