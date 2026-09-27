const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const catalog = JSON.parse(fs.readFileSync('backend/src/main/resources/exercise-catalog.json', 'utf8'));

function environment() {
  const values = new Map();
  const storage = {};
  for (const key of ['Exercises','Workouts','User','Token','TrainingPreferences']) {
    storage[`get${key}`] = async () => values.get(key) ?? (['Exercises','Workouts'].includes(key) ? [] : null);
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
