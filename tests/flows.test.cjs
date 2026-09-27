const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const catalog = JSON.parse(fs.readFileSync('backend/src/main/resources/exercise-catalog.json', 'utf8'));

function environment() {
  const values = new Map();
  const storage = {};
  for (const key of ['Exercises','Workouts','User','Token','TrainingPreferences','Logs']) {
    storage[`get${key}`] = async () => values.get(key) ?? (['Exercises','Workouts','Logs'].includes(key) ? [] : null);
    storage[`set${key}`] = async value => values.set(key, value);
  }
  storage.getCustom = async (key, fallback) => values.get(key) ?? fallback;
  storage.setCustom = async (key, value) => values.set(key, value);
  let online = true;
  let calls = 0;
  const remote = catalog.map((entry, index) => ({ ...entry, id: `server-${index}`, isCustom: false, catalogOrigin: 'api', createdAt: '2026-01-01' }));
  const api = {
    exercisesApi: { enabled: () => online, getAll: async () => { calls++; return remote; } },
    workoutsApi: { enabled: () => false },
    logsApi: { enabled: () => false },
    userApi: { enabled: () => true, authMe: async () => ({id:'user-1', name:'Atleta'}), login: async () => ({ user: {id:'user-1',name:'Atleta'} }) },
  };
  const cache = new Map();
  function load(filename) {
    const file = path.resolve(filename);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    const code = ts.transpileModule(fs.readFileSync(file,'utf8'), { compilerOptions: {module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022} }).outputText;
    const requireMock = name => {
      if (name === '../storage') return { storage };
      if (name === '../api') return api;
      if (name === '../api/client') return { ensureApiOnline: async () => online };
      if (name === './ExerciseMediaCache') return { prepareExerciseImages: async () => {} };
      if (name === './MediaService') return { persistImage: async uri => `file:///documents/${uri.split('/').pop()}` };
      if (name === 'react-native-get-random-values') return {};
      if (name === 'uuid') return { v4: require('node:crypto').randomUUID };
      if (name.startsWith('.')) {
        const base = path.resolve(path.dirname(file),name);
        return load(fs.existsSync(base+'.ts') ? base+'.ts' : path.join(base,'index.ts'));
      }
      return require(name);
    };
    new Function('require','module','exports',code)(requireMock,module,module.exports);
    return module.exports;
  }
  return { load, remote, storage, offline: () => {online=false;}, calls: () => calls };
}
const prefs = (id) => ({userId:'user-1',goal:'gain-mass',trainingDays:['monday','tuesday','thursday','friday'],preference:id,plannedSets:4,plannedReps:13,updatedAt:'2026-01-01'});

for (const [split, count] of [['UPPER_LOWER_4X',4],['ANTERIOR_POSTERIOR_4X',4],['PPL_UPPER_LOWER_5X',5],['FULL_BODY_3X',3]]) {
  test(`${split}: all exercises belong to the real catalog, prescription and IDs survive save/retry`, async () => {
    const env=environment(); await env.storage.setUser({id:'user-1'});
    const generator=env.load('src/services/WorkoutPlanGeneratorService.ts').workoutPlanGeneratorService;
    const plan=await generator.generatePlan(prefs(split));
    assert.equal(plan.workouts.length,count);
    for (const workout of plan.workouts) {
      assert.equal(new Set(workout.exercises.map(e=>e.exerciseId)).size,workout.exercises.length);
      for (const exercise of workout.exercises) {
        const real=env.remote.find(e=>e.id===exercise.exerciseId);
        assert.ok(real?.startImage && real.sourceId && real.name !== 'Exercício');
        assert.ok(real.startImage.includes(real.sourceId));
        assert.equal(exercise.plannedSets,4); assert.equal(exercise.plannedReps,13);
      }
    }
    await generator.savePlanWorkouts(plan.workouts);
    await generator.savePlanWorkouts(plan.workouts);
    assert.equal((await env.storage.getWorkouts()).length,count);
    env.offline();
    assert.deepEqual((await generator.generatePlan(prefs(split))).workouts.map(w=>w.exercises),plan.workouts.map(w=>w.exercises));
  });
}
test('Por mim bypasses API and creates no workouts even with stale assigned template',async()=>{
  const env=environment(); const generator=env.load('src/services/WorkoutPlanGeneratorService.ts').workoutPlanGeneratorService;
  const plan=await generator.generatePlan({...prefs('manual'),assignedTemplateId:'UPPER_LOWER_4X'});
  await generator.savePlanWorkouts(plan.workouts);
  assert.equal(env.calls(),0); assert.deepEqual(plan.workouts,[]); assert.deepEqual(plan.schedule,[]);
});
test('Missing Remada Cavalinho selects the complete Remada Baixa API record; exact match wins',()=>{
  const env=environment(); const {resolveMovement}=env.load('src/services/WorkoutPlanGeneratorService.ts');
  const real=env.remote.find(e=>e.name==='Remada Baixa no Triângulo');
  assert.equal(resolveMovement('tRow',env.remote,new Set()),real);
  const exact={...real,id:'exact-api',name:'Remada Cavalinho'};
  assert.equal(resolveMovement('tRow',[...env.remote,exact],new Set()),exact);
  assert.throws(()=>resolveMovement('tRow',[{...real,startImage:undefined}],new Set()),/alternativa com imagem/);
});
test('No offline catalog: fail before saving, never manufacture records or trust legacy local seeds',async()=>{
  const env=environment(); env.offline();
  await env.storage.setExercises(env.remote.map(e=>({...e,catalogOrigin:undefined})));
  const generator=env.load('src/services/WorkoutPlanGeneratorService.ts').workoutPlanGeneratorService;
  await assert.rejects(generator.generatePlan(prefs('UPPER_LOWER_4X')),/catálogo/);
  assert.deepEqual(await env.storage.getWorkouts(),[]);
});
test('API media/name/ID are preserved together across caching and offline reads',async()=>{
  const env=environment(); const service=env.load('src/services/ExerciseService.ts').exerciseService;
  assert.deepEqual(await service.getCatalog(),env.remote);
  env.offline(); assert.deepEqual(await service.getCatalog(),env.remote);
});
test('Profile photo is durable and survives auth refresh and another login',async()=>{
  const env=environment(); await env.storage.setUser({id:'user-1',name:'Atleta'});
  const user=env.load('src/services/UserService.ts').userService;
  assert.equal((await user.updateProfile({avatarUrl:'file:///cache/photo.jpg'})).avatarUrl,'file:///documents/photo.jpg');
  assert.equal((await user.getOrCreate()).avatarUrl,'file:///documents/photo.jpg');
  await user.logout(); assert.equal((await user.login('test','test')).avatarUrl,'file:///documents/photo.jpg');
});
test('New workouts reject unknown IDs, including IDs from the obsolete text-only templates',async()=>{
  const env=environment(); const service=env.load('src/services/WorkoutService.ts').workoutService;
  await assert.rejects(service.saveWorkout('Invalid',[{exerciseId:'supino-reto',order:1,plannedSets:3,plannedReps:10}]),/catálogo/);
  assert.deepEqual(await env.storage.getWorkouts(),[]);
});
test('Finished session volume and duration use completed working sets, ignoring unfinished/warmup sets',()=>{
  const env=environment(); const {buildLog}=env.load('src/services/WorkoutLogService.ts');
  const set=(completed,weight,reps,category='working')=>({id:Math.random().toString(),setNumber:1,weight,reps,completed,type:'normal',category});
  const log=buildLog({workoutId:'workout',workoutName:'Upper A',startedAt:'2026-09-01T12:00:00Z',finishedAt:'2026-09-01T13:12:34Z',exercises:[{exerciseId:'actual-id',exerciseName:'Supino Reto',muscleGroup:'Peito',plannedSets:3,plannedReps:10,completed:true,sets:[set(true,40,10),set(true,50,8),set(false,100,10),set(true,10,10,'warmup')]}]});
  assert.equal(log.durationSeconds,4354);assert.equal(log.totalVolume,800);
});

test('Isolation: Conta A unlocks achievements, logout, Conta B starts with 0 and unlocks 1, Conta A retains only its own', async () => {
  const env = environment();
  const { achievementService } = env.load('src/services/AchievementService.ts');
  const { userService } = env.load('src/services/UserService.ts');
  const { workoutLogService, buildLog } = env.load('src/services/WorkoutLogService.ts');

  const makeSet = (weight = 20, reps = 10) => ({
    id: Math.random().toString(),
    setNumber: 1,
    weight,
    reps,
    completed: true,
    type: 'normal',
    category: 'working',
  });

  // --- Conta A: Login e progresso inicial ---
  await env.storage.setUser({ id: 'user-A', name: 'Atleta A' });
  const logA1 = buildLog({
    workoutId: 'w-a1',
    workoutName: 'Treino A1',
    startedAt: '2026-09-01T10:00:00Z',
    finishedAt: '2026-09-01T11:00:00Z',
    exercises: [
      {
        exerciseId: 'ex-1',
        exerciseName: 'Supino',
        muscleGroup: 'Peito',
        plannedSets: 1,
        plannedReps: 10,
        completed: true,
        sets: [makeSet(50, 10)],
      },
    ],
  });
  await workoutLogService.saveLog(logA1);

  const logsA = await workoutLogService.getAll();
  assert.equal(logsA.length, 1);
  assert.equal(logsA[0].ownerId, 'user-A');

  // Conta A avalia conquistas (desbloqueia PRIMEIRO_PASSO)
  const unlockedA = await achievementService.evaluateOnWorkoutComplete({
    userId: 'user-A',
    allLogs: logsA,
    currentLog: logA1,
    currentStreak: 1,
  });
  assert.ok(unlockedA.some((a) => a.id === 'PRIMEIRO_PASSO'));
  const userAAchievements = await achievementService.getUserAchievements('user-A');
  assert.ok(userAAchievements.length > 0);
  const userACount = userAAchievements.length;

  // --- Logout de Conta A ---
  await userService.logout();
  assert.equal(await env.storage.getUser(), null);

  // --- Conta B: Login recém-criada ---
  await env.storage.setUser({ id: 'user-B', name: 'Atleta B' });

  // Conta B NÃO pode ter nenhuma conquista de Conta A
  const userBAchievementsInitial = await achievementService.getUserAchievements('user-B');
  assert.equal(userBAchievementsInitial.length, 0, 'Conta B recém-criada não deve ter conquistas');

  // Conta B NÃO pode ver os logs da Conta A
  const logsBInitial = await workoutLogService.getAll();
  assert.equal(logsBInitial.length, 0, 'Conta B não deve ver treinos da Conta A');

  // Conta B realiza seu primeiro treino
  const logB1 = buildLog({
    workoutId: 'w-b1',
    workoutName: 'Treino B1',
    startedAt: '2026-09-02T14:00:00Z',
    finishedAt: '2026-09-02T15:00:00Z',
    exercises: [
      {
        exerciseId: 'ex-2',
        exerciseName: 'Agachamento',
        muscleGroup: 'Pernas',
        plannedSets: 1,
        plannedReps: 10,
        completed: true,
        sets: [makeSet(30, 10)],
      },
    ],
  });
  await workoutLogService.saveLog(logB1);

  const logsB = await workoutLogService.getAll();
  assert.equal(logsB.length, 1);
  assert.equal(logsB[0].ownerId, 'user-B');

  // Conta B avalia conquistas
  const unlockedB = await achievementService.evaluateOnWorkoutComplete({
    userId: 'user-B',
    allLogs: logsB,
    currentLog: logB1,
    currentStreak: 1,
  });
  assert.ok(unlockedB.some((a) => a.id === 'PRIMEIRO_PASSO'));
  const userBAchievementsFinal = await achievementService.getUserAchievements('user-B');
  assert.ok(userBAchievementsFinal.length > 0);

  // --- Logout de Conta B ---
  await userService.logout();

  // --- Conta A: Login novamente ---
  await env.storage.setUser({ id: 'user-A', name: 'Atleta A' });
  const userAAchievementsAfter = await achievementService.getUserAchievements('user-A');
  assert.equal(userAAchievementsAfter.length, userACount, 'Conta A mantém exclusivamente suas próprias conquistas');

  const logsAAfter = await workoutLogService.getAll();
  assert.equal(logsAAfter.length, 1, 'Conta A mantém exclusivamente seus próprios treinos');
  assert.equal(logsAAfter[0].ownerId, 'user-A');
});

test('Achievement storage keys are strictly isolated per user and legacy global key is cleared on logout', async () => {
  const env = environment();
  const { getAchievementsStorageKey, achievementService } = env.load('src/services/AchievementService.ts');
  const { userService } = env.load('src/services/UserService.ts');

  assert.equal(getAchievementsStorageKey('user-123'), '@dallas/achievements/user-123');
  assert.equal(getAchievementsStorageKey('user-456'), '@dallas/achievements/user-456');
  assert.equal(getAchievementsStorageKey(''), '@dallas/achievements/anonymous');
  assert.equal(getAchievementsStorageKey(null), '@dallas/achievements/anonymous');

  // Save achievement for user-123
  await achievementService.saveUserAchievements([{ achievementId: 'PRIMEIRO_PASSO', unlockedAt: '2026-09-01' }], 'user-123');
  
  // Set a legacy dirty global key
  await env.storage.setCustom('@treino/achievements', [{ achievementId: 'CENTURIAO', unlockedAt: '2026-01-01' }]);
  assert.ok((await env.storage.getCustom('@treino/achievements', null)) !== null);

  // Logout clears user, token, and legacy @treino/achievements
  await userService.logout();
  assert.equal(await env.storage.getCustom('@treino/achievements', null), null);

  // user-123 achievements are still preserved in @dallas/achievements/user-123
  const user123 = await achievementService.getUserAchievements('user-123');
  assert.equal(user123.length, 1);
  assert.equal(user123[0].achievementId, 'PRIMEIRO_PASSO');

  // user-456 still has zero achievements
  const user456 = await achievementService.getUserAchievements('user-456');
  assert.equal(user456.length, 0);
});


