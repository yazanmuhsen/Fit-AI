import type { GenerateProgramRequest, ProgramResponse, Exercise } from '@shared/schema';

// ─── Internal Types ───────────────────────────────────────────────────────────
interface ExTemplate { name: string; technique: string; keyCues: string[]; muscles: string[] }
interface WeekCfg { phaseLabel: string; phaseKey: string; mainSets: number; mainReps: string; mainRpe?: number; accSets: number; accReps: string; accRpe?: number }
interface DayDef { num: number; name: string; type: string }

// ─── 12-Week Periodization Config ─────────────────────────────────────────────
const WEEK_CFGS: WeekCfg[] = [
  { phaseKey:'volume',   phaseLabel:'Volume Accumulation',      mainSets:4, mainReps:'10–12', mainRpe:7,   accSets:3, accReps:'12–15', accRpe:7 },
  { phaseKey:'volume',   phaseLabel:'Volume Accumulation',      mainSets:4, mainReps:'10–12', mainRpe:7.5, accSets:3, accReps:'12–15', accRpe:7 },
  { phaseKey:'volume',   phaseLabel:'Volume Accumulation',      mainSets:4, mainReps:'8–10',  mainRpe:7.5, accSets:3, accReps:'10–12', accRpe:7.5 },
  { phaseKey:'volume',   phaseLabel:'Volume Accumulation',      mainSets:5, mainReps:'8–10',  mainRpe:8,   accSets:3, accReps:'10–12', accRpe:7.5 },
  { phaseKey:'strength', phaseLabel:'Strength Development',     mainSets:4, mainReps:'6–8',   mainRpe:7.5, accSets:3, accReps:'8–12',  accRpe:7.5 },
  { phaseKey:'strength', phaseLabel:'Strength Development',     mainSets:4, mainReps:'5–8',   mainRpe:8,   accSets:3, accReps:'8–12',  accRpe:8 },
  { phaseKey:'strength', phaseLabel:'Strength Development',     mainSets:5, mainReps:'5–6',   mainRpe:8.5, accSets:3, accReps:'8–10',  accRpe:8 },
  { phaseKey:'strength', phaseLabel:'Strength Development',     mainSets:5, mainReps:'4–6',   mainRpe:8.5, accSets:4, accReps:'8–10',  accRpe:8 },
  { phaseKey:'peak',     phaseLabel:'High Intensity / Peaking', mainSets:4, mainReps:'4–5',   mainRpe:8.5, accSets:3, accReps:'6–8',   accRpe:8 },
  { phaseKey:'peak',     phaseLabel:'High Intensity / Peaking', mainSets:4, mainReps:'3–5',   mainRpe:9,   accSets:3, accReps:'6–8',   accRpe:8.5 },
  { phaseKey:'peak',     phaseLabel:'High Intensity / Peaking', mainSets:4, mainReps:'3–4',   mainRpe:9,   accSets:3, accReps:'5–6',   accRpe:8.5 },
  { phaseKey:'deload',   phaseLabel:'Deload',                   mainSets:2, mainReps:'8–10',  mainRpe:6,   accSets:2, accReps:'12–15', accRpe:6 },
];

function phaseIdx(phaseKey: string): 0 | 1 | 2 {
  if (phaseKey === 'strength') return 1;
  if (phaseKey === 'peak')     return 2;
  return 0;
}

// ─── Goal-adjusted periodisation ──────────────────────────────────────────────
// Returns WEEK_CFGS modified for the user's primary goal.
// weight_loss/endurance → higher reps, moderate intensity (metabolic stimulus)
// strength (non-PL sport) → lower reps, extra sets in later phases
// muscle_size/general_health → default WEEK_CFGS (already optimised for hypertrophy)
function getGoalAdjustedCfgs(goals: string[], sport: string): WeekCfg[] {
  const primary = goals[0] ?? 'general_health';

  // Powerlifting has its own built-in periodisation — don't override it
  if (sport === 'powerlifting') return WEEK_CFGS;

  if (primary === 'weight_loss' || primary === 'endurance') {
    // Higher rep ranges → more metabolic, more calories burned per session
    return [
      { phaseKey:'volume',   phaseLabel:'Volume Accumulation',      mainSets:4, mainReps:'12–15', mainRpe:7,   accSets:3, accReps:'15–20', accRpe:7 },
      { phaseKey:'volume',   phaseLabel:'Volume Accumulation',      mainSets:4, mainReps:'12–15', mainRpe:7.5, accSets:3, accReps:'15–20', accRpe:7 },
      { phaseKey:'volume',   phaseLabel:'Volume Accumulation',      mainSets:4, mainReps:'12–15', mainRpe:7.5, accSets:3, accReps:'15–20', accRpe:7.5 },
      { phaseKey:'volume',   phaseLabel:'Volume Accumulation',      mainSets:5, mainReps:'10–12', mainRpe:8,   accSets:3, accReps:'15–20', accRpe:7.5 },
      { phaseKey:'strength', phaseLabel:'Strength Development',     mainSets:4, mainReps:'10–12', mainRpe:7.5, accSets:3, accReps:'12–15', accRpe:7.5 },
      { phaseKey:'strength', phaseLabel:'Strength Development',     mainSets:4, mainReps:'10–12', mainRpe:8,   accSets:3, accReps:'12–15', accRpe:8 },
      { phaseKey:'strength', phaseLabel:'Strength Development',     mainSets:5, mainReps:'8–12',  mainRpe:8,   accSets:3, accReps:'12–15', accRpe:8 },
      { phaseKey:'strength', phaseLabel:'Strength Development',     mainSets:5, mainReps:'8–12',  mainRpe:8.5, accSets:4, accReps:'12–15', accRpe:8 },
      { phaseKey:'peak',     phaseLabel:'High Intensity / Peaking', mainSets:4, mainReps:'8–10',  mainRpe:8.5, accSets:3, accReps:'10–12', accRpe:8 },
      { phaseKey:'peak',     phaseLabel:'High Intensity / Peaking', mainSets:4, mainReps:'6–10',  mainRpe:8.5, accSets:3, accReps:'10–12', accRpe:8.5 },
      { phaseKey:'peak',     phaseLabel:'High Intensity / Peaking', mainSets:4, mainReps:'6–8',   mainRpe:9,   accSets:3, accReps:'8–10',  accRpe:8.5 },
      { phaseKey:'deload',   phaseLabel:'Deload',                   mainSets:2, mainReps:'12–15', mainRpe:6,   accSets:2, accReps:'15–20', accRpe:6 },
    ];
  }

  if (primary === 'strength') {
    // Lower rep ranges, extra sets → strength-biased even without powerlifting sport
    return [
      { phaseKey:'volume',   phaseLabel:'Volume Accumulation',      mainSets:4, mainReps:'8–10',  mainRpe:7,   accSets:3, accReps:'10–12', accRpe:7 },
      { phaseKey:'volume',   phaseLabel:'Volume Accumulation',      mainSets:4, mainReps:'8–10',  mainRpe:7.5, accSets:3, accReps:'10–12', accRpe:7 },
      { phaseKey:'volume',   phaseLabel:'Volume Accumulation',      mainSets:5, mainReps:'6–8',   mainRpe:7.5, accSets:3, accReps:'8–12',  accRpe:7.5 },
      { phaseKey:'volume',   phaseLabel:'Volume Accumulation',      mainSets:5, mainReps:'6–8',   mainRpe:8,   accSets:4, accReps:'8–12',  accRpe:7.5 },
      { phaseKey:'strength', phaseLabel:'Strength Development',     mainSets:4, mainReps:'5–6',   mainRpe:8,   accSets:3, accReps:'8–10',  accRpe:7.5 },
      { phaseKey:'strength', phaseLabel:'Strength Development',     mainSets:5, mainReps:'4–6',   mainRpe:8,   accSets:3, accReps:'8–10',  accRpe:8 },
      { phaseKey:'strength', phaseLabel:'Strength Development',     mainSets:5, mainReps:'4–5',   mainRpe:8.5, accSets:4, accReps:'6–8',   accRpe:8 },
      { phaseKey:'strength', phaseLabel:'Strength Development',     mainSets:5, mainReps:'3–5',   mainRpe:8.5, accSets:4, accReps:'6–8',   accRpe:8 },
      { phaseKey:'peak',     phaseLabel:'High Intensity / Peaking', mainSets:4, mainReps:'3–4',   mainRpe:8.5, accSets:3, accReps:'5–6',   accRpe:8 },
      { phaseKey:'peak',     phaseLabel:'High Intensity / Peaking', mainSets:4, mainReps:'2–4',   mainRpe:9,   accSets:3, accReps:'4–6',   accRpe:8.5 },
      { phaseKey:'peak',     phaseLabel:'High Intensity / Peaking', mainSets:5, mainReps:'2–3',   mainRpe:9,   accSets:3, accReps:'4–5',   accRpe:8.5 },
      { phaseKey:'deload',   phaseLabel:'Deload',                   mainSets:2, mainReps:'6–8',   mainRpe:6,   accSets:2, accReps:'10–12', accRpe:6 },
    ];
  }

  // Default (muscle_size, general_health, powerbuilding)
  return WEEK_CFGS;
}

// ─── Exercise Database ─────────────────────────────────────────────────────────
// DB[pattern][equipment] = [phase0_exercise, phase1_exercise, phase2_exercise]
// phase0=Volume/Deload, phase1=Strength, phase2=Peak
// Upper body patterns ONLY contain upper body exercises.
// Lower body patterns ONLY contain lower body exercises.
const DB: Record<string, Record<string, ExTemplate[]>> = {

  horizontal_push: {
    barbell: [
      { name:'Barbell Bench Press',        technique:'Retract scapula, feet flat, lower bar to lower chest with elbows at 45–75°, press in a slight arc to lockout.', keyCues:['Tight upper back','Bar to lower chest','Drive legs into floor'], muscles:['Chest','Triceps','Shoulders'] },
      { name:'Incline Barbell Bench Press', technique:'Bench at 30–45°, unrack and lower bar to upper chest under control, press along the same arc.', keyCues:['Pin shoulders back','Controlled descent','Squeeze at top'], muscles:['Upper Chest','Shoulders','Triceps'] },
      { name:'Paused Barbell Bench Press',  technique:'Full bench press with a deliberate 1-second pause on chest — kill the bounce, press explosively from dead stop.', keyCues:['Stay tight at bottom','No bounce','Explosive off chest'], muscles:['Chest','Triceps','Shoulders'] },
    ],
    dumbbell: [
      { name:'Dumbbell Bench Press',   technique:'Press dumbbells from shoulder height, squeeze chest at top, controlled descent to a gentle stretch at bottom.', keyCues:['Full range of motion','Squeeze at top','Elbows at 45°'], muscles:['Chest','Triceps'] },
      { name:'Incline Dumbbell Press', technique:'Bench at 30–45°, press above upper chest with a slight inward arc on the way up, stretch at bottom.', keyCues:['Control the negative','Slight inward arc','Squeeze upper chest'], muscles:['Upper Chest','Shoulders'] },
      { name:'Dumbbell Floor Press',   technique:'Lie on floor, press from triceps resting on ground to full lockout — removes leg drive, tricep focus.', keyCues:['Full lockout','Touch and go','Elbows at 45°'], muscles:['Chest','Triceps'] },
    ],
    cables: [
      { name:'Cable Fly (Mid Height)',   technique:'Cables at mid height, slight forward lean, sweep hands together in a wide hugging arc, squeeze at peak.', keyCues:['Fixed elbow bend','Lead with elbows','Squeeze at peak'], muscles:['Chest'] },
      { name:'Low-to-High Cable Fly',    technique:'Cables at floor level, drive hands upward and together — emphasises upper chest fibres.', keyCues:['Drive upward','Long arc','Squeeze at top'], muscles:['Upper Chest','Shoulders'] },
      { name:'High-to-Low Cable Fly',    technique:'Cables overhead, pull downward and together — emphasises lower chest fibres, great stretch at top.', keyCues:['Control the pull','Full stretch at start','Squeeze at bottom'], muscles:['Chest'] },
    ],
    machines: [
      { name:'Machine Chest Press',   technique:'Adjust seat so handles align with lower chest, press to full extension, slow controlled return.', keyCues:['Full extension','Controlled return','Elbows at 45°'], muscles:['Chest','Triceps'] },
      { name:'Incline Machine Press', technique:'Use incline setting, press upward focusing on upper chest contraction, slow negative.', keyCues:['Squeeze at top','Controlled negative','Upper chest focus'], muscles:['Upper Chest'] },
      { name:'Pec Deck Fly',          technique:'Round elbows slightly, sweep pads together, hold 1 second at peak contraction, controlled return.', keyCues:['Round elbows','1s hold at peak','Feel the stretch'], muscles:['Chest'] },
    ],
    bodyweight: [
      { name:'Push-Up',         technique:'Plank position, lower chest to floor, push through hands with body in a rigid straight line.', keyCues:['Straight body line','Elbows at 45°','Full range'], muscles:['Chest','Triceps','Core'] },
      { name:'Decline Push-Up', technique:'Feet elevated on a surface, full range of motion — targets upper chest fibres more.', keyCues:['Feet elevated','Rigid body','Control descent'], muscles:['Upper Chest','Shoulders'] },
      { name:'Archer Push-Up',  technique:'Wide stance, shift full bodyweight onto one arm while the other stays extended — alternate each rep.', keyCues:['Full weight shift','Extended arm straight','Slow and controlled'], muscles:['Chest','Triceps'] },
    ],
  },

  horizontal_push_b: {
    barbell: [
      { name:'Incline Barbell Bench Press', technique:'Bench at 30–45°, lower to upper chest, press with shoulder-width or slightly wider grip.', keyCues:['Upper chest drive','Controlled descent','Squeeze at top'], muscles:['Upper Chest','Shoulders','Triceps'] },
      { name:'Close-Grip Bench Press',      technique:'Shoulder-width grip, elbows tucked at 45° — maximum tricep involvement throughout.', keyCues:['Elbows tucked','Full lockout','Lower to sternum'], muscles:['Triceps','Chest','Shoulders'] },
      { name:'Paused Incline Bench Press',  technique:'Incline bench with 1-second pause at chest — builds upper chest and explosive pressing power.', keyCues:['Stay tight','No bounce','Explosive press'], muscles:['Upper Chest','Shoulders','Triceps'] },
    ],
    dumbbell: [
      { name:'Incline Dumbbell Press',   technique:'30–45° bench, press from shoulder level, slight inward arc, stretch at bottom.', keyCues:['Control the negative','Upper chest focus','Squeeze at top'], muscles:['Upper Chest','Shoulders'] },
      { name:'Dumbbell Floor Press',     technique:'Lie on floor, press from triceps touching ground to full lockout — strict pressing.', keyCues:['Full lockout','Elbows at 45°','Control descent'], muscles:['Chest','Triceps'] },
      { name:'Neutral-Grip DB Press',   technique:'Palms facing each other, press from chest to full lockout — easier on shoulders.', keyCues:['Neutral grip','Squeeze at top','Elbow tuck'], muscles:['Chest','Triceps'] },
    ],
    cables: [
      { name:'Low-to-High Cable Fly',  technique:'Cables at floor, drive upward and inward — upper chest and anterior delt emphasis.', keyCues:['Drive upward','Long arc','Squeeze at peak'], muscles:['Upper Chest'] },
      { name:'Cable Crossover',        technique:'Mid-height pulleys, sweep together and cross hands at finish, 1-second hold.', keyCues:['Cross at finish','1s hold','Full stretch at start'], muscles:['Chest'] },
      { name:'Single-Arm Cable Press', technique:'Cable at shoulder height, press across body to full extension — great for isolation.', keyCues:['Press across body','Full extension','Squeeze at end'], muscles:['Chest','Triceps'] },
    ],
    machines: [
      { name:'Incline Machine Press', technique:'Upper chest focus, press upward to full extension, controlled return, squeeze hard.', keyCues:['Squeeze at top','Full extension','Slow negative'], muscles:['Upper Chest'] },
      { name:'Pec Deck Fly',         technique:'Round elbows, sweep pads together, hold 1s at peak, controlled return.', keyCues:['Round elbows','1s hold','Full stretch'], muscles:['Chest'] },
      { name:'Machine Chest Press',  technique:'Full extension each rep, emphasise the chest squeeze, slow return for time under tension.', keyCues:['Squeeze chest','Full extension','Slow return'], muscles:['Chest','Triceps'] },
    ],
    bodyweight: [
      { name:'Decline Push-Up',   technique:'Feet elevated, full range — greater upper chest activation than standard push-up.', keyCues:['Feet elevated','Full range','Rigid body'], muscles:['Upper Chest'] },
      { name:'Wide-Grip Push-Up', technique:'Hands wider than shoulders, increases chest stretch at bottom of every rep.', keyCues:['Wide hands','Chest to floor','Full range'], muscles:['Chest'] },
      { name:'Archer Push-Up',    technique:'Shift weight fully to one arm, extended arm stays straight — simulates single-arm press.', keyCues:['Full weight shift','Straight arm','Control shift'], muscles:['Chest','Triceps'] },
    ],
  },

  vertical_push: {
    barbell: [
      { name:'Barbell Overhead Press', technique:'Bar at clavicle level, brace hard, press straight overhead past face, lock out completely.', keyCues:['Brace core hard','Bar past face','Full lockout'], muscles:['Shoulders','Triceps','Core'] },
      { name:'Push Press',             technique:'Slight knee dip, explosive leg drive transfers to the bar overhead — more weight than strict press.', keyCues:['Slight knee dip','Leg drive into press','Full lockout'], muscles:['Shoulders','Triceps','Legs'] },
      { name:'Seated Barbell Press',   technique:'Seated removes leg drive — pure shoulder and tricep strength, strict lockout required.', keyCues:['Strict press','No leg drive','Full lockout'], muscles:['Shoulders','Triceps'] },
    ],
    dumbbell: [
      { name:'Dumbbell Shoulder Press', technique:'Press from ear height to lockout overhead, squeeze shoulders at the top.', keyCues:['From ear height','Full lockout','Control descent'], muscles:['Shoulders','Triceps'] },
      { name:'Arnold Press',            technique:'Start palms facing you, rotate outward as you press — hits all three delt heads.', keyCues:['Rotate outward','Controlled rotation','Full lockout'], muscles:['Shoulders','Triceps'] },
      { name:'Seated Dumbbell Press',   technique:'Seated, back supported, no leg drive — strict shoulder pressing movement.', keyCues:['Strict press','Full lockout','Control negative'], muscles:['Shoulders','Triceps'] },
    ],
    cables: [
      { name:'Single-Arm Cable Press',         technique:'Cable at low setting, press upward to lockout — constant tension throughout range.', keyCues:['Constant tension','Full lockout','Brace core'], muscles:['Shoulders','Triceps'] },
      { name:'Cable Face Pull',                technique:'Rope at eye level, pull to face with external rotation, elbows flared high throughout.', keyCues:['Elbows high','External rotation','Pull to nose'], muscles:['Rear Delts','Rotator Cuff'] },
      { name:'Single-Arm Cable Lateral Raise', technique:'Cable at side, raise arm to shoulder height with slight forward tilt, control descent.', keyCues:['Lead with elbow','Slight forward tilt','Control descent'], muscles:['Lateral Delts'] },
    ],
    machines: [
      { name:'Machine Shoulder Press',       technique:'Adjust seat so handles align at shoulders, press to full extension, controlled return.', keyCues:['Full extension','Controlled return','Brace core'], muscles:['Shoulders','Triceps'] },
      { name:'Smith Machine Overhead Press', technique:'Seated or standing, press along Smith track to lockout, control descent.', keyCues:['Full lockout','Controlled negative','Core braced'], muscles:['Shoulders','Triceps'] },
      { name:'Lateral Raise Machine',        technique:'Pad on forearm, raise elbows to shoulder level, hold 1s at top, slow descent.', keyCues:['Elbow to shoulder level','1s hold','Slow descent'], muscles:['Lateral Delts'] },
    ],
    bodyweight: [
      { name:'Pike Push-Up',         technique:'Hips high in inverted V, lower head toward floor, press back up through shoulders.', keyCues:['Hips high','Head toward floor','Press through shoulders'], muscles:['Shoulders','Triceps'] },
      { name:'Decline Pike Push-Up', technique:'Feet elevated on surface, hips high — harder version targeting shoulders more vertically.', keyCues:['Feet elevated','Vertical torso','Full range'], muscles:['Shoulders','Triceps'] },
      { name:'Wall Handstand Hold',  technique:'Kick up into wall-supported handstand, press through shoulders actively, hold for time.', keyCues:['Tight hollow body','Press through shoulders','Pointed toes'], muscles:['Shoulders','Triceps','Core'] },
    ],
  },

  horizontal_pull: {
    barbell: [
      { name:'Barbell Bent-Over Row',       technique:'Hip-hinged at 45°, pull bar to lower ribs, squeeze back hard at top, lower with control.', keyCues:['45° torso','Bar to lower ribs','Squeeze lats'], muscles:['Lats','Rhomboids','Biceps'] },
      { name:'Pendlay Row',                 technique:'Bar starts on the floor each rep, explosive pull to lower chest, fully controlled return.', keyCues:['Bar from floor','Explosive pull','Flat back'], muscles:['Lats','Rhomboids','Traps'] },
      { name:'Barbell Chest-Supported Row', technique:'Chest against incline bench, row barbell to lower ribs with zero momentum.', keyCues:['No momentum','Squeeze at top','Full stretch at bottom'], muscles:['Mid-Back','Lats','Biceps'] },
    ],
    dumbbell: [
      { name:'Dumbbell Row (Single Arm)',     technique:'One knee on bench, pull dumbbell to hip, row elbow past torso, hold 1s at top.', keyCues:['Row to hip','Elbow past torso','1s hold at top'], muscles:['Lats','Rhomboids','Biceps'] },
      { name:'Chest-Supported Dumbbell Row', technique:'Prone on incline bench, row both dumbbells to ribs simultaneously — strict form only.', keyCues:['Chest on bench','Row to ribs','Squeeze mid-back'], muscles:['Mid-Back','Rear Delts'] },
      { name:'Dumbbell Renegade Row',         technique:'Push-up position, row one dumbbell at a time while resisting rotation with the core.', keyCues:['Anti-rotation core','Row elbow high','No hip twist'], muscles:['Lats','Core','Biceps'] },
    ],
    cables: [
      { name:'Seated Cable Row',    technique:'Neutral grip, pull to sternum keeping elbows close to body, hold 1s, slow return.', keyCues:['Pull to sternum','Elbows close','1s hold'], muscles:['Lats','Mid-Back','Biceps'] },
      { name:'Wide-Grip Cable Row', technique:'Wider overhand grip, pull to upper abs — emphasises mid and upper back.', keyCues:['Wide grip','Pull to upper abs','Squeeze shoulder blades'], muscles:['Upper Back','Rhomboids'] },
      { name:'Face Pull',           technique:'Rope at eye level, pull to face with external rotation at end, elbows flared high.', keyCues:['Elbows high','External rotation','Pull to nose'], muscles:['Rear Delts','Rotator Cuff'] },
    ],
    machines: [
      { name:'Seated Machine Row',     technique:'Chest pad for support, pull handles to ribs, squeeze back hard at peak, slow return.', keyCues:['Chest against pad','Pull to ribs','Squeeze mid-back'], muscles:['Mid-Back','Lats','Biceps'] },
      { name:'T-Bar Row (Machine)',    technique:'V-grip, row to lower chest squeezing mid-back at top, controlled descent, full stretch.', keyCues:['V-grip','Row to lower chest','Squeeze at top'], muscles:['Lats','Mid-Back','Biceps'] },
      { name:'Reverse Pec Deck',       technique:'Face the machine, arms extended, squeeze pads apart using rear delts exclusively.', keyCues:['Arms extended','Squeeze apart','1s hold at rear'], muscles:['Rear Delts','Rhomboids'] },
    ],
    bodyweight: [
      { name:'Inverted Row (Australian)', technique:'Bar at hip height, body in straight line, pull chest to bar, squeeze back at top.', keyCues:['Straight body','Pull chest to bar','Squeeze at top'], muscles:['Lats','Rhomboids','Biceps'] },
      { name:'Archer Inverted Row',       technique:'Wide grip inverted row, shift body weight to one arm each rep — builds unilateral pulling strength.', keyCues:['Full weight shift','Non-pulling arm straight','Squeeze at top'], muscles:['Lats','Biceps'] },
      { name:'Inverted Row (Feet Elevated)', technique:'Feet elevated on bench, more horizontal body angle — harder than standard inverted row.', keyCues:['Feet elevated','More horizontal','Pull explosively'], muscles:['Lats','Core','Biceps'] },
    ],
  },

  vertical_pull: {
    barbell: [
      { name:'Pull-Up',           technique:'Full hang at the bottom, drive elbows down and back, pull chin over bar, lower fully.', keyCues:['Full hang','Elbows down and back','Chin over bar'], muscles:['Lats','Biceps','Core'] },
      { name:'Weighted Pull-Up',  technique:'Add weight via belt or vest, same strict full-range pull-up technique throughout.', keyCues:['Full range','Elbows back','Control descent'], muscles:['Lats','Biceps'] },
      { name:'Close-Grip Pull-Up', technique:'Parallel or close grip — maximises lower lat and bicep engagement.', keyCues:['Close grip','Elbows pull back','Full hang'], muscles:['Lats','Biceps'] },
    ],
    dumbbell: [
      { name:'Pull-Up',           technique:'Full extension at bottom, drive elbows down and back, chin clears bar.', keyCues:['Full hang','Elbows down','Chin over bar'], muscles:['Lats','Biceps'] },
      { name:'Chin-Up',           technique:'Supinated grip (palms toward you), pull chin over bar — maximises bicep contribution.', keyCues:['Palms toward you','Full range','Elbows back'], muscles:['Lats','Biceps'] },
      { name:'Dumbbell Pullover', technique:'Lie across bench, lower dumbbell behind head in a wide arc, pull back using lats only.', keyCues:['Wide arc','Feel the lat stretch','Drive elbows down'], muscles:['Lats','Chest'] },
    ],
    cables: [
      { name:'Lat Pulldown',            technique:'Overhand grip slightly wider than shoulders, pull to upper chest driving elbows down.', keyCues:['Elbows drive down','Bar to upper chest','Full extension at top'], muscles:['Lats','Biceps'] },
      { name:'Close-Grip Lat Pulldown', technique:'Neutral grip, pull to lower chest — maximises lower lat activation.', keyCues:['Neutral grip','Pull to lower chest','Full stretch at top'], muscles:['Lats','Biceps'] },
      { name:'Straight-Arm Pulldown',   technique:'Arms nearly straight throughout, pull from overhead to hips using lats only.', keyCues:['Arms nearly straight','Hinge at shoulder only','Full squeeze at bottom'], muscles:['Lats'] },
    ],
    machines: [
      { name:'Lat Pulldown Machine',     technique:'Thighs secured under pads, pull bar to upper chest, full extension at top.', keyCues:['Thighs secured','Pull to upper chest','Full extension'], muscles:['Lats','Biceps'] },
      { name:'Assisted Pull-Up Machine', technique:'Appropriate weight assistance, full range pull-up — build toward unassisted.', keyCues:['Full range','Elbows back','Control descent'], muscles:['Lats','Biceps'] },
      { name:'Seated Machine Pulldown',  technique:'Different hand position targets different lat fibres, pull to chin level.', keyCues:['Drive elbows down','Pull to chin','Full stretch at top'], muscles:['Lats','Mid-Back'] },
    ],
    bodyweight: [
      { name:'Pull-Up',          technique:'Full hang, drive elbows down and back, chin clears bar, lower fully controlled.', keyCues:['Full hang','Elbows down','Chin over bar'], muscles:['Lats','Biceps','Core'] },
      { name:'Chin-Up',          technique:'Supinated grip, pull chin over bar, maximises lat and bicep engagement.', keyCues:['Palms toward you','Full range','Squeeze at top'], muscles:['Lats','Biceps'] },
      { name:'Negative Pull-Up', technique:'Jump to top position, lower yourself as slowly as possible — 5 to 8 seconds.', keyCues:['As slow as possible','Full range','Controlled throughout'], muscles:['Lats','Biceps'] },
    ],
  },

  biceps: {
    barbell: [
      { name:'Barbell Curl',          technique:'Stand, hold bar at hip width, curl to shoulder height keeping elbows fixed at sides.', keyCues:['Elbows fixed','Full range','Squeeze at top'], muscles:['Biceps','Forearms'] },
      { name:'EZ-Bar Curl',           technique:'Neutral wrist position reduces forearm strain, curl to chin level, squeeze hard at top.', keyCues:['Neutral wrists','Curl to chin','Squeeze at top'], muscles:['Biceps','Brachialis'] },
      { name:'Barbell Preacher Curl', technique:'Chest against pad — removes all momentum, strict curl emphasising the stretched position.', keyCues:['Chest on pad','No momentum','Full stretch at bottom'], muscles:['Biceps'] },
    ],
    dumbbell: [
      { name:'Dumbbell Bicep Curl',   technique:'Curl dumbbells alternating or together, supinate at the top for the peak squeeze.', keyCues:['Supinate at top','Elbows fixed','Full range'], muscles:['Biceps'] },
      { name:'Hammer Curl',           technique:'Neutral grip throughout — targets brachialis and brachioradialis for arm thickness.', keyCues:['Neutral grip','Elbows fixed','Squeeze at top'], muscles:['Brachialis','Biceps','Forearms'] },
      { name:'Incline Dumbbell Curl', technique:'Seated on incline, arms hang behind torso — longer stretch creates better peak contraction.', keyCues:['Arms hang behind','Full stretch','Squeeze hard at top'], muscles:['Biceps'] },
    ],
    cables: [
      { name:'Cable Curl',       technique:'Low pulley, curl to shoulder with constant tension — no rest at top or bottom.', keyCues:['Constant tension','Elbows fixed','Squeeze at top'], muscles:['Biceps'] },
      { name:'High Cable Curl',  technique:'Cable at shoulder height, curl inward — keeps tension at peak contraction.', keyCues:['Cable at shoulder','Curl inward','Hold peak'], muscles:['Biceps'] },
      { name:'Rope Hammer Curl', technique:'Rope at low pulley, neutral grip curl — targets brachialis for arm width.', keyCues:['Neutral grip','Rope curl','Squeeze at top'], muscles:['Brachialis','Biceps'] },
    ],
    machines: [
      { name:'Machine Bicep Curl',    technique:'Seat adjusted so elbows align with machine pivot, curl to full contraction.', keyCues:['Elbow pivot aligned','Full contraction','Control return'], muscles:['Biceps'] },
      { name:'Preacher Machine Curl', technique:'Chest against pad, strict curling motion, full range of motion.', keyCues:['Chest on pad','Full range','Squeeze at top'], muscles:['Biceps'] },
      { name:'Cable Machine Curl',    technique:'Standing cable curl with constant tension throughout the full range.', keyCues:['Constant tension','Squeeze at top','Control descent'], muscles:['Biceps'] },
    ],
    bodyweight: [
      { name:'Chin-Up (Bicep Focus)',  technique:'Supinated grip pull-up — maximises bicep contribution to vertical pulling movements.', keyCues:['Palms toward you','Squeeze bicep at top','Full range'], muscles:['Biceps','Lats'] },
      { name:'Underhand Inverted Row', technique:'Underhand grip on low bar, pull chest to bar focusing on bicep squeeze at top.', keyCues:['Underhand grip','Squeeze bicep','Full stretch at bottom'], muscles:['Biceps','Lats'] },
      { name:'Towel Curl',             technique:'Loop towel around a sturdy pole, lean back and curl using bodyweight for resistance.', keyCues:['Full range','Curl explosively','Slow descent'], muscles:['Biceps'] },
    ],
  },

  triceps: {
    barbell: [
      { name:'Close-Grip Bench Press', technique:'Shoulder-width grip, elbows tucked at 45°, lower to lower chest, press to full lockout.', keyCues:['Elbows tucked','Full lockout','Touch chest gently'], muscles:['Triceps','Chest','Shoulders'] },
      { name:'Skull Crusher (EZ-Bar)', technique:'Lying on bench, lower bar toward forehead bending elbows only, press back to extension.', keyCues:['Only elbows move','Control descent','Full extension'], muscles:['Triceps'] },
      { name:'Barbell JM Press',       technique:'Hybrid between close-grip and skull crusher — forearms angled, elbows slightly out.', keyCues:['Elbows slightly out','Forearms angled','Full extension'], muscles:['Triceps','Chest'] },
    ],
    dumbbell: [
      { name:'DB Overhead Tricep Extension', technique:'Hold one dumbbell overhead with both hands, lower behind head bending elbows, extend fully.', keyCues:['Elbows point up','Full stretch at bottom','Full extension'], muscles:['Triceps (Long Head)'] },
      { name:'Dumbbell Skull Crusher',       technique:'Lying on bench, lower dumbbells beside head bending elbows only, press to extension.', keyCues:['Only elbows move','Control descent','Full lockout'], muscles:['Triceps'] },
      { name:'Tricep Kickback',              technique:'Bent-over, upper arm parallel to floor, extend forearm fully rearward, squeeze at lockout.', keyCues:['Upper arm stays parallel','Full extension','Squeeze at lockout'], muscles:['Triceps'] },
    ],
    cables: [
      { name:'Cable Tricep Pushdown',     technique:'High pulley, elbows pinned at sides, push bar to full lockout, hold 1s at bottom.', keyCues:['Elbows pinned','Full lockout','1s hold'], muscles:['Triceps'] },
      { name:'Overhead Cable Tricep Ext', technique:'Rope at high pulley, face away, extend overhead to full lockout — long head emphasis.', keyCues:['Face away','Elbows up','Full extension overhead'], muscles:['Triceps (Long Head)'] },
      { name:'Single-Arm Cable Pushdown', technique:'One arm, full extension, squeeze hard at lockout — allows full unilateral range.', keyCues:['One arm','Full extension','Squeeze at bottom'], muscles:['Triceps'] },
    ],
    machines: [
      { name:'Tricep Dip Machine',       technique:'Grip handles, push to full lockout, control the return — hits all three tricep heads.', keyCues:['Full lockout','Control return','Upright posture'], muscles:['Triceps'] },
      { name:'Machine Tricep Extension', technique:'Full lockout each rep, squeeze hard at bottom, slow controlled return.', keyCues:['Full lockout','Squeeze hard','Slow return'], muscles:['Triceps'] },
      { name:'Cable Rope Pushdown',      technique:'Rope pushdown spreading hands at bottom for better lateral head contraction.', keyCues:['Spread hands at bottom','Full lockout','Elbows fixed'], muscles:['Triceps'] },
    ],
    bodyweight: [
      { name:'Tricep Dip (Parallel Bars)', technique:'Upright torso (not leaning forward), dip until upper arms parallel, press to lockout.', keyCues:['Upright torso','Elbows back','Full lockout'], muscles:['Triceps','Shoulders'] },
      { name:'Diamond Push-Up',            technique:'Hands in diamond shape under chest, elbows track rearward, full push-up range.', keyCues:['Diamond hands','Elbows back not flared','Full range'], muscles:['Triceps','Chest'] },
      { name:'Close-Grip Push-Up',         technique:'Hands shoulder-width or closer, elbows tucked — more tricep involvement than standard.', keyCues:['Hands close','Elbows tucked','Full range'], muscles:['Triceps'] },
    ],
  },

  rear_delt: {
    barbell: [
      { name:'Wide-Grip Bent-Over Row', technique:'Extra-wide overhand grip, pull to upper chest — elbows flare out targeting rear delts.', keyCues:['Extra wide grip','Pull to upper chest','Elbows flared'], muscles:['Rear Delts','Upper Back'] },
      { name:'Barbell Face Pull (Rack)', technique:'Bar at face height in rack, pull toward nose with elbows flared high and wide.', keyCues:['Elbows high and wide','Pull to nose','External rotation at end'], muscles:['Rear Delts','Rotator Cuff'] },
      { name:'Barbell Upright Row',      technique:'Pull bar to chin keeping elbows above wrists — rear and lateral delt emphasis.', keyCues:['Elbows above wrists','Pull to chin','Control descent'], muscles:['Lateral Delts','Rear Delts'] },
    ],
    dumbbell: [
      { name:'Dumbbell Rear Delt Fly', technique:'Bent forward at 45°, raise dumbbells out to the side with slight elbow bend, hold 1s.', keyCues:['Bent over torso','Lead with elbows','1s hold at top'], muscles:['Rear Delts','Rhomboids'] },
      { name:'Prone DB Rear Delt Fly', technique:'Face-down on incline bench, raise dumbbells to each side — removes all momentum.', keyCues:['Face down on bench','Lead with elbows','Strict form'], muscles:['Rear Delts'] },
      { name:'Dumbbell Lateral Raise', technique:'Raise to side until shoulder-height with slight forward tilt, slow controlled descent.', keyCues:['Lead with elbow','Slight forward tilt','Slow descent'], muscles:['Lateral Delts'] },
    ],
    cables: [
      { name:'Face Pull (Rope)',     technique:'Rope at eye level, pull to face with external rotation, elbows flared high throughout.', keyCues:['Elbows high','External rotation','Pull to nose'], muscles:['Rear Delts','Rotator Cuff'] },
      { name:'Reverse Cable Fly',   technique:'Stand between two cables, pull to sides in a wide arc, squeeze rear delts at the end.', keyCues:['Wide arc','Squeeze rear delts','Lead with elbows'], muscles:['Rear Delts'] },
      { name:'Cable Lateral Raise', technique:'Side cable, raise arm to shoulder height with a slight forward tilt, control descent.', keyCues:['Slight forward tilt','Raise to shoulder','Control descent'], muscles:['Lateral Delts'] },
    ],
    machines: [
      { name:'Reverse Pec Deck',      technique:'Face the machine, arms extended, squeeze pads apart using rear delts exclusively.', keyCues:['Arms extended','Squeeze apart','1s hold'], muscles:['Rear Delts','Rhomboids'] },
      { name:'Lateral Raise Machine', technique:'Pad on forearm, raise elbows to shoulder height, hold 1s, slow descent.', keyCues:['Elbow on pad','Raise to shoulder','1s hold'], muscles:['Lateral Delts'] },
      { name:'Machine Rear Delt Row', technique:'Wide grip row to upper body with elbows flared — specifically targets rear delts.', keyCues:['Elbows flared','Pull to upper chest','Squeeze rear delts'], muscles:['Rear Delts','Upper Back'] },
    ],
    bodyweight: [
      { name:'Band Pull-Apart', technique:'Stretch resistance band apart at chest level, squeeze rear delts at full extension.', keyCues:['Full extension','Squeeze rear delts','1s hold'], muscles:['Rear Delts','Rhomboids'] },
      { name:'YTW (Floor)',     technique:'Prone on floor, create Y, T, and W arm shapes — each targets different rear delt fibres.', keyCues:['Thumbs up','Hold each position','Strict form'], muscles:['Rear Delts','Rhomboids'] },
      { name:'Superman Hold',   technique:'Prone, raise arms and legs simultaneously, hold 2–3 seconds — builds posterior chain.', keyCues:['Lift everything together','Squeeze upper back','Hold 2–3s'], muscles:['Rear Delts','Erectors','Glutes'] },
    ],
  },

  squat: {
    barbell: [
      { name:'Barbell Back Squat',  technique:'Bar on traps, feet shoulder-width, descend until hips below knees, drive through mid-foot to lockout.', keyCues:['Brace core','Chest up','Drive knees out'], muscles:['Quadriceps','Glutes','Core'] },
      { name:'Barbell Front Squat', technique:'Bar on front delts, elbows high and parallel to floor — very upright torso, highly quad dominant.', keyCues:['Elbows high','Upright torso','Knees over toes'], muscles:['Quadriceps','Core'] },
      { name:'Box Squat',           technique:'Squat back to a box at parallel, pause briefly, drive up explosively — builds power from the hole.', keyCues:['Sit back to box','Brief pause','Explosive drive up'], muscles:['Quadriceps','Glutes','Hamstrings'] },
    ],
    dumbbell: [
      { name:'Goblet Squat',         technique:'Hold dumbbell at chest, squat deep with elbows guiding knees outward at the bottom.', keyCues:['Elbows guide knees out','Chest up','Full depth'], muscles:['Quadriceps','Glutes','Core'] },
      { name:'Dumbbell Sumo Squat',  technique:'Wide stance, toes out, hold dumbbell between legs, squat keeping chest tall.', keyCues:['Wide stance','Toes out','Knees track toes'], muscles:['Quadriceps','Glutes','Inner Thigh'] },
      { name:'Dumbbell Split Squat', technique:'Front foot forward, lower rear knee toward floor, drive up through front heel.', keyCues:['Front heel stays down','Vertical shin','Drive through front heel'], muscles:['Quadriceps','Glutes'] },
    ],
    machines: [
      { name:'Leg Press',            technique:'Feet shoulder-width on platform, lower to 90° knee angle, press through heels to near lockout.', keyCues:['Lower back stays flat','90° minimum','Press through heels'], muscles:['Quadriceps','Glutes'] },
      { name:'Hack Squat (Machine)', technique:'Shoulder pads, full controlled descent, drive through heels to near lockout.', keyCues:['Full depth','Drive through heels','Knees track toes'], muscles:['Quadriceps','Glutes'] },
      { name:'Smith Machine Squat',  technique:'Feet positioned slightly forward, controlled descent to parallel, drive up to lockout.', keyCues:['Feet slightly forward','Core braced','Drive up'], muscles:['Quadriceps','Glutes'] },
    ],
    bodyweight: [
      { name:'Bodyweight Squat',        technique:'Feet shoulder-width, arms extended for balance, descend to below parallel.', keyCues:['Chest up','Knees out','Full depth'], muscles:['Quadriceps','Glutes'] },
      { name:'Jump Squat',              technique:'Squat to parallel, explode leaving the ground, land softly — builds explosive power.', keyCues:['Land softly','Full squat depth','Explosive jump'], muscles:['Quadriceps','Glutes','Calves'] },
      { name:'Pistol Squat Progression', technique:'Single leg squat with support assistance — progresses toward full unassisted pistol squat.', keyCues:['Balance focus','Front heel down','Control descent'], muscles:['Quadriceps','Glutes','Core'] },
    ],
  },

  squat_b: {
    barbell: [
      { name:'Pause Back Squat',              technique:'Full back squat with a 2-second dead-stop pause in the hole — eliminates stretch reflex.', keyCues:['2s pause at bottom','Stay braced','Explosive drive out'], muscles:['Quadriceps','Glutes','Core'] },
      { name:'Barbell Front Squat',           technique:'Bar on front delts, elbows high — quad-dominant, excellent strength builder.', keyCues:['Elbows high','Upright torso','Knees over toes'], muscles:['Quadriceps','Core'] },
      { name:'Barbell Bulgarian Split Squat', technique:'Rear foot on bench, lower front hip to below knee level, drive up through front heel.', keyCues:['Front heel stays down','Hip drops low','Drive up'], muscles:['Quadriceps','Glutes'] },
    ],
    dumbbell: [
      { name:'Bulgarian Split Squat', technique:'Rear foot on a bench, hold dumbbells, lower front leg until hip drops below knee.', keyCues:['Front heel stays down','Hip drops low','Drive up through heel'], muscles:['Quadriceps','Glutes'] },
      { name:'Dumbbell Step-Up',      technique:'Step onto a knee-height box, drive up to full standing, step down controlled.', keyCues:['Drive through heel','Full stand at top','Control step down'], muscles:['Quadriceps','Glutes'] },
      { name:'Goblet Squat',          technique:'Deep goblet squat, elbows guide knees outward, controlled descent and drive.', keyCues:['Full depth','Elbows guide knees','Chest stays up'], muscles:['Quadriceps','Glutes','Core'] },
    ],
    machines: [
      { name:'Hack Squat (Machine)',      technique:'Full depth under shoulder pads, drive through heels — quad emphasis.', keyCues:['Full depth','Drive through heels','Knees track toes'], muscles:['Quadriceps','Glutes'] },
      { name:'Leg Extension Machine',     technique:'Extend to full lockout, squeeze quads hard for 1s, slow controlled descent.', keyCues:['Full lockout','Squeeze quads 1s','Slow descent'], muscles:['Quadriceps'] },
      { name:'Smith Machine Split Squat', technique:'Split stance under Smith bar, lower rear knee in a controlled manner, full range.', keyCues:['Front heel stays down','Controlled descent','Drive up'], muscles:['Quadriceps','Glutes'] },
    ],
    bodyweight: [
      { name:'Bulgarian Split Squat (BW)', technique:'Rear foot on a chair, lower front knee until hip drops below knee level.', keyCues:['Hip drops low','Front heel stays down','Drive up'], muscles:['Quadriceps','Glutes'] },
      { name:'Reverse Lunge',              technique:'Step backward, lower rear knee to near floor, drive back up — less knee stress.', keyCues:['Front heel stays down','Control descent','Drive up tall'], muscles:['Quadriceps','Glutes'] },
      { name:'Wall Sit',                   technique:'Back against wall, thighs parallel to floor — isometric quad and glute endurance.', keyCues:['Thighs parallel','Hold position','Breathe steadily'], muscles:['Quadriceps','Glutes'] },
    ],
  },

  hip_hinge: {
    barbell: [
      { name:'Barbell Deadlift',     technique:'Bar over mid-foot, hinge to grip, brace hard, drive floor away maintaining neutral spine throughout.', keyCues:['Bar over mid-foot','Push floor away','Neutral spine'], muscles:['Hamstrings','Glutes','Erectors'] },
      { name:'Romanian Deadlift',    technique:'Hip-hinge with soft knees, lower bar along legs to deep hamstring stretch, drive hips through at top.', keyCues:['Hip hinge not squat','Bar stays close','Feel the hamstring stretch'], muscles:['Hamstrings','Glutes','Erectors'] },
      { name:'Sumo Deadlift',        technique:'Wide stance, toes out, grip inside legs — shorter range, more hip and inner thigh involvement.', keyCues:['Wide stance','Drive knees out','Hips close to bar'], muscles:['Hamstrings','Glutes','Inner Thigh'] },
    ],
    dumbbell: [
      { name:'Dumbbell Romanian Deadlift', technique:'Hold dumbbells in front, hinge at hips with soft knees, lower to deep hamstring stretch.', keyCues:['Hip hinge','Soft knees','Feel the stretch'], muscles:['Hamstrings','Glutes'] },
      { name:'Single-Leg Dumbbell RDL',    technique:'Balance on one leg, hinge forward as rear leg rises — each glute works independently.', keyCues:['Hinge forward','Stable standing leg','Even hips'], muscles:['Hamstrings','Glutes','Core'] },
      { name:'Dumbbell Good Morning',      technique:'Dumbbells on shoulders, hinge forward keeping back neutral, drive hips through at top.', keyCues:['Neutral spine','Deep hip hinge','Drive hips through'], muscles:['Hamstrings','Erectors','Glutes'] },
    ],
    cables: [
      { name:'Cable Pull-Through',     technique:'Rope between legs, hinge forward, drive hips forward and through at the top — excellent glute.', keyCues:['Drive hips back','Rope between legs','Full hip extension'], muscles:['Glutes','Hamstrings'] },
      { name:'Cable Romanian Deadlift', technique:'Low cable attachment, hip hinge maintaining neutral spine, feel full hamstring stretch.', keyCues:['Hip hinge','Neutral back','Hamstring stretch'], muscles:['Hamstrings','Glutes'] },
      { name:'Cable Kickback',          technique:'Ankle attachment, kick leg back to full hip extension, squeeze glute hard at end.', keyCues:['Full hip extension','Squeeze glute','No lower back arch'], muscles:['Glutes','Hamstrings'] },
    ],
    machines: [
      { name:'Lying Leg Curl Machine', technique:'Prone position, curl to full contraction, hold 1s at peak, slow controlled descent.', keyCues:['Full contraction','1s hold','Slow descent'], muscles:['Hamstrings'] },
      { name:'Seated Leg Curl',        technique:'Knee aligned with pivot, curl to full contraction, squeeze hard at peak.', keyCues:['Full contraction','Squeeze hard','Slow return'], muscles:['Hamstrings'] },
      { name:'Back Extension Machine', technique:'Hinge forward at hips, extend back to neutral, squeeze erectors and glutes at top.', keyCues:['Hinge at hips','Stop at neutral','Squeeze at top'], muscles:['Erectors','Glutes','Hamstrings'] },
    ],
    bodyweight: [
      { name:'Hip Thrust (Bodyweight)',  technique:'Shoulders on bench, feet flat, drive hips to full extension squeezing glutes at top.', keyCues:['Shoulders on bench','Full hip extension','Squeeze glutes'], muscles:['Glutes','Hamstrings'] },
      { name:'Nordic Hamstring Curl',    technique:'Feet anchored, slowly lower body controlling the descent with hamstrings — very demanding.', keyCues:['Slow descent','Hamstrings absorb force','Push up with hands if needed'], muscles:['Hamstrings'] },
      { name:'Single-Leg Hip Thrust',    technique:'One leg extended, drive hips through the working leg, squeeze glute hard at top.', keyCues:['One leg working','Full hip extension','Squeeze at top'], muscles:['Glutes','Hamstrings'] },
    ],
  },

  hip_hinge_b: {
    barbell: [
      { name:'Romanian Deadlift',  technique:'Hip-hinge with soft knees, lower bar along legs to deep hamstring stretch, drive hips through.', keyCues:['Hip hinge not squat','Bar stays close','Hamstring stretch'], muscles:['Hamstrings','Glutes'] },
      { name:'Good Morning',       technique:'Bar on traps, hinge forward keeping back neutral, feel hamstring stretch, drive hips up.', keyCues:['Neutral spine','Hinge deeply','Drive hips through'], muscles:['Hamstrings','Erectors','Glutes'] },
      { name:'Deficit Deadlift',   technique:'Stand on plates for a longer range of motion — builds strength and power off the floor.', keyCues:['Greater ROM','Neutral spine','Drive floor away'], muscles:['Hamstrings','Glutes','Erectors'] },
    ],
    dumbbell: [
      { name:'Single-Leg Dumbbell RDL', technique:'One leg, hinge forward as rear leg rises, dumbbell follows shin down, hamstring stretch.', keyCues:['Even hips','Stable leg','Feel hamstring stretch'], muscles:['Hamstrings','Glutes','Core'] },
      { name:'Dumbbell Glute Bridge',   technique:'Supine, dumbbells on hips, drive to full extension, squeeze glutes hard for 1s.', keyCues:['Full hip extension','Squeeze glutes','1s hold'], muscles:['Glutes','Hamstrings'] },
      { name:'Stiff-Leg Dumbbell DL',   technique:'Legs nearly straight, maximum hip hinge — targets hamstrings with maximum stretch.', keyCues:['Legs nearly straight','Maximum stretch','Neutral back'], muscles:['Hamstrings','Glutes'] },
    ],
    cables: [
      { name:'Cable Pull-Through',   technique:'Rope between legs, drive hips back then explosively through — great glute activation.', keyCues:['Rope between legs','Drive hips through','Full extension at top'], muscles:['Glutes','Hamstrings'] },
      { name:'Cable Glute Kickback', technique:'Ankle attachment, kick leg back to full extension, squeeze glute at the end.', keyCues:['Full extension','Squeeze glute','No lower back arch'], muscles:['Glutes'] },
      { name:'Low Cable RDL',        technique:'Low cable, hip hinge keeping spine neutral, full hamstring stretch at bottom.', keyCues:['Neutral spine','Hip hinge','Hamstring stretch'], muscles:['Hamstrings','Glutes'] },
    ],
    machines: [
      { name:'Lying Leg Curl',        technique:'Prone, curl to full contraction, hold 1s, slow deliberate descent.', keyCues:['Full contraction','1s hold','Slow descent'], muscles:['Hamstrings'] },
      { name:'Seated Leg Curl',       technique:'Pivot aligned with knee, curl to full contraction, squeeze hard at peak.', keyCues:['Squeeze at peak','Full contraction','Slow return'], muscles:['Hamstrings'] },
      { name:'Back Extension Machine', technique:'Hinge at hips, extend to neutral, squeeze erectors and glutes at top.', keyCues:['Stop at neutral','Squeeze at top','Controlled hinge'], muscles:['Erectors','Glutes','Hamstrings'] },
    ],
    bodyweight: [
      { name:'Glute Bridge',              technique:'Supine, feet flat, drive hips to full extension and hold 1s, lower with control.', keyCues:['Full extension','Squeeze glutes','1s hold'], muscles:['Glutes','Hamstrings'] },
      { name:'Single-Leg Glute Bridge',   technique:'One leg bent, other extended, drive through working leg, squeeze glute at top.', keyCues:['One leg','Full extension','Squeeze glute'], muscles:['Glutes','Hamstrings'] },
      { name:'Nordic Hamstring Curl',     technique:'Kneel with feet anchored, slowly lower body using hamstrings, push up with hands.', keyCues:['Slow controlled descent','Hamstrings working','Build to full reps'], muscles:['Hamstrings'] },
    ],
  },

  lunge: {
    barbell: [
      { name:'Barbell Walking Lunge',         technique:'Alternate legs stepping forward, lower rear knee near floor, drive up through front heel.', keyCues:['Front heel stays down','Vertical front shin','Drive through front heel'], muscles:['Quadriceps','Glutes'] },
      { name:'Barbell Reverse Lunge',         technique:'Step backward, lower rear knee near floor — less knee stress than forward lunge.', keyCues:['Step back','Front heel stays down','Drive up tall'], muscles:['Quadriceps','Glutes'] },
      { name:'Barbell Bulgarian Split Squat', technique:'Rear foot elevated on bench, lower front hip below knee level, drive up.', keyCues:['Front heel stays down','Hip drops low','Drive up through heel'], muscles:['Quadriceps','Glutes'] },
    ],
    dumbbell: [
      { name:'Dumbbell Reverse Lunge',          technique:'Hold dumbbells, step backward, lower rear knee near floor, drive back to standing.', keyCues:['Step back','Front heel stays down','Drive up'], muscles:['Quadriceps','Glutes'] },
      { name:'Bulgarian Split Squat (Dumbbell)', technique:'Rear foot on bench, hold dumbbells, lower front leg until hip drops below knee.', keyCues:['Front heel stays down','Hip drops low','Drive up through heel'], muscles:['Quadriceps','Glutes'] },
      { name:'Dumbbell Step-Up',                technique:'Step onto knee-height box with one leg, drive to full stand, step down controlled.', keyCues:['Drive through heel','Full stand at top','Controlled step down'], muscles:['Quadriceps','Glutes'] },
    ],
    machines: [
      { name:'Smith Machine Reverse Lunge', technique:'Split stance, lower rear knee near floor, drive up through front leg — Smith guides path.', keyCues:['Front heel stays down','Controlled descent','Drive up'], muscles:['Quadriceps','Glutes'] },
      { name:'Cable Assisted Lunge',        technique:'Hold cable for stability, step into lunge, lower under control.', keyCues:['Cable for stability','Front heel stays down','Drive up'], muscles:['Quadriceps','Glutes'] },
      { name:'Single-Leg Press (Machine)',  technique:'One foot on platform, single-leg press — builds unilateral leg strength safely.', keyCues:['One foot','Full range','Drive through heel'], muscles:['Quadriceps','Glutes'] },
    ],
    bodyweight: [
      { name:'Reverse Lunge',         technique:'Step backward, lower rear knee to near floor, push back to standing through front heel.', keyCues:['Front heel stays down','Vertical shin','Drive up'], muscles:['Quadriceps','Glutes'] },
      { name:'Walking Lunge',         technique:'Alternate forward steps, lower rear knee, drive forward through front heel.', keyCues:['Front heel first','Vertical shin','Drive forward'], muscles:['Quadriceps','Glutes'] },
      { name:'Bulgarian Split Squat', technique:'Rear foot on a chair, lower until front hip drops below knee, drive up through heel.', keyCues:['Hip drops low','Front heel stays down','Drive up'], muscles:['Quadriceps','Glutes'] },
    ],
  },

  leg_curl: {
    barbell: [
      { name:'Romanian Deadlift (Hamstring)', technique:'Hip hinge keeping legs nearly straight — maximum hamstring loading and stretch.', keyCues:['Maximum stretch','Soft knees','Hip drive at top'], muscles:['Hamstrings','Glutes'] },
      { name:'Good Morning',                  technique:'Bar on traps, hinge forward, feel hamstring stretch, drive up through hips.', keyCues:['Neutral spine','Hamstring stretch','Drive hips through'], muscles:['Hamstrings','Erectors'] },
      { name:'Stiff-Leg Deadlift',            technique:'Minimal knee bend, maximum hip hinge — pure hamstring loading throughout.', keyCues:['Minimal knee bend','Maximum stretch','Neutral spine'], muscles:['Hamstrings','Glutes'] },
    ],
    dumbbell: [
      { name:'Single-Leg Dumbbell RDL',    technique:'Balance on one leg, hinge forward — works each hamstring and glute independently.', keyCues:['Balance focus','Neutral spine','Hamstring stretch'], muscles:['Hamstrings','Glutes','Core'] },
      { name:'Dumbbell Leg Curl (Lying)',   technique:'Prone on floor, hold dumbbell between feet, curl toward glutes, slow return.', keyCues:['Squeeze at top','Slow return','Full range'], muscles:['Hamstrings'] },
      { name:'Dumbbell Glute Bridge Hold', technique:'Heels on elevated surface with dumbbells at hips, bridge up and hold for time.', keyCues:['Full hip extension','Squeeze glutes','Hold at top'], muscles:['Hamstrings','Glutes'] },
    ],
    machines: [
      { name:'Lying Leg Curl Machine',  technique:'Prone, curl to full contraction, hold 1 second at peak, slow controlled descent.', keyCues:['Full contraction','1s hold','Slow descent'], muscles:['Hamstrings'] },
      { name:'Seated Leg Curl Machine', technique:'Knee pivot aligned, curl to full contraction, squeeze hard, slow controlled return.', keyCues:['Full contraction','Squeeze hard','Slow return'], muscles:['Hamstrings'] },
      { name:'Single-Leg Lying Curl',   technique:'One leg at a time on lying curl machine — addresses left-right strength imbalances.', keyCues:['One leg','Full contraction','Equal both sides'], muscles:['Hamstrings'] },
    ],
    cables: [
      { name:'Standing Cable Leg Curl', technique:'Ankle cuff, stand on opposite leg, curl working leg to full contraction.', keyCues:['Stable standing leg','Full contraction','Squeeze at top'], muscles:['Hamstrings'] },
      { name:'Cable Romanian Deadlift', technique:'Low cable, hip hinge keeping back neutral, full hamstring stretch at bottom.', keyCues:['Hip hinge','Neutral back','Full stretch'], muscles:['Hamstrings','Glutes'] },
      { name:'Kneeling Cable Leg Curl', technique:'Kneeling position, curl lower leg toward glutes against cable resistance.', keyCues:['Thigh stays vertical','Full contraction','Squeeze at top'], muscles:['Hamstrings'] },
    ],
    bodyweight: [
      { name:'Nordic Hamstring Curl',    technique:'Feet anchored, slowly lower body using hamstrings — very demanding but very effective.', keyCues:['Slow controlled descent','Hamstrings absorb force','Hands assist at bottom'], muscles:['Hamstrings'] },
      { name:'Single-Leg Glute Bridge', technique:'One leg bent, drive hips through, squeeze working glute at full extension.', keyCues:['One leg','Full extension','Squeeze glute'], muscles:['Glutes','Hamstrings'] },
      { name:'Prone Hip Extension Hold', technique:'Lie prone, squeeze glutes and lift heels off the floor, hold the contraction.', keyCues:['Squeeze glutes','Lift heels','Hold the contraction'], muscles:['Glutes','Hamstrings'] },
    ],
  },

  calf: {
    barbell: [
      { name:'Standing Calf Raise',          technique:'Bar on traps, raise onto balls of feet, full stretch at bottom, squeeze hard at top.', keyCues:['Full stretch at bottom','Squeeze at top','1s hold'], muscles:['Calves (Gastrocnemius)'] },
      { name:'Donkey Calf Raise',            technique:'Hinge forward at hips, raise heels — emphasises the stretched position of the calf.', keyCues:['Hinge forward','Full stretch','High rise on toes'], muscles:['Calves'] },
      { name:'Single-Leg Elevated Calf Raise', technique:'One leg on edge of a step — maximises both the stretch and contraction range.', keyCues:['Full range','Squeeze at top','Slow descent'], muscles:['Calves (Gastrocnemius)'] },
    ],
    dumbbell: [
      { name:'Standing DB Calf Raise',    technique:'Hold dumbbells at sides, raise onto balls of feet, full stretch at bottom, hold 1s at top.', keyCues:['Full stretch at bottom','1s hold at top','Squeeze calves'], muscles:['Calves'] },
      { name:'Single-Leg DB Calf Raise', technique:'One leg, hold dumbbell — more demanding, use a step edge if available for full range.', keyCues:['Full range','Squeeze at top','Balance challenge'], muscles:['Calves'] },
      { name:'Seated DB Calf Raise',     technique:'Seated on bench, dumbbells on knees, raise onto balls of feet — targets soleus.', keyCues:['Targets soleus','Full range','Squeeze at top'], muscles:['Calves (Soleus)'] },
    ],
    machines: [
      { name:'Standing Calf Raise Machine', technique:'Pads on shoulders, raise onto balls of feet, full stretch at bottom, squeeze at top.', keyCues:['Full stretch','Squeeze at top','1s hold'], muscles:['Calves'] },
      { name:'Seated Calf Raise Machine',   technique:'Pads on knees — isolates the soleus (deeper calf), full controlled range.', keyCues:['Full range','Targets soleus','Slow controlled'], muscles:['Calves (Soleus)'] },
      { name:'Leg Press Calf Raise',        technique:'Only balls of feet on the platform — raise and lower through full range.', keyCues:['Only toes on platform','Full range','Squeeze at top'], muscles:['Calves'] },
    ],
    cables: [
      { name:'Cable Calf Raise',          technique:'Low cable with ankle attachment, single-leg calf raise with constant tension.', keyCues:['Single leg','Full range','Squeeze at top'], muscles:['Calves'] },
      { name:'Standing Cable Calf Raise', technique:'Hold cable for balance, raise onto balls of feet, full range of motion.', keyCues:['Full range','1s squeeze at top','Control descent'], muscles:['Calves'] },
      { name:'Seated Cable Calf Raise',   technique:'Creative low cable setup in seated position — targets soleus like seated calf raises.', keyCues:['Full range','Squeeze at top','Seated position'], muscles:['Calves (Soleus)'] },
    ],
    bodyweight: [
      { name:'Standing Calf Raise (BW)', technique:'Use a wall for light support, raise onto balls of feet, full stretch at bottom.', keyCues:['Full range','1s at top','Slow 3s descent'], muscles:['Calves'] },
      { name:'Single-Leg Calf Raise',   technique:'One leg, use a stair or ledge for full range — significantly more demanding.', keyCues:['Full range','Squeeze at top','Slow 3s descent'], muscles:['Calves'] },
      { name:'Jump Rope Calisthenics',  technique:'Continuous calf-based bouncing — builds calf endurance, reactivity, and ankle strength.', keyCues:['Stay on toes','Light bounces','Smooth rhythm'], muscles:['Calves','Ankle Stability'] },
    ],
  },

  core: {
    barbell: [
      { name:'Plank',            technique:'Forearms on floor, body in rigid line from head to heels, breathe steadily throughout.', keyCues:['Rigid straight line','Glutes squeezed','Breathe steadily'], muscles:['Core','Glutes','Shoulders'] },
      { name:'Ab Wheel Rollout', technique:'Kneel, roll wheel out to near-floor level, pull back using core — not hip flexors.', keyCues:['Core not hip flexors','Roll slowly out','Pull back with core'], muscles:['Core','Lats'] },
      { name:'Dead Bug',         technique:'Supine, opposite arm and leg lower toward floor while lower back stays pressed to floor.', keyCues:['Lower back pressed down','Opposite arm and leg','Slow and controlled'], muscles:['Core','Hip Flexors'] },
    ],
    dumbbell: [
      { name:'Dumbbell Plank Row', technique:'Push-up position, row one dumbbell at a time resisting rotation with the core.', keyCues:['Anti-rotation','Row elbow high','No hip twist'], muscles:['Core','Lats'] },
      { name:'Dumbbell Side Bend', technique:'Hold dumbbell in one hand, laterally bend toward the weighted side, return upright.', keyCues:['Controlled movement','Both sides','No forward lean'], muscles:['Obliques','Core'] },
      { name:'Farmer Carry',       technique:'Heavy dumbbells in each hand, walk with upright posture — anti-lateral-flexion core.', keyCues:['Upright posture','Shoulders back','Core braced'], muscles:['Core','Grip','Traps'] },
    ],
    bodyweight: [
      { name:'Hollow Body Hold',     technique:'Supine, arms overhead, lift legs and shoulders creating a "hollow" banana shape.', keyCues:['Lower back pressed down','Point toes','Hold the tension'], muscles:['Core','Hip Flexors'] },
      { name:'L-Sit',                technique:'Parallel bars or floor, arms locked, hold legs parallel to floor — full body tension.', keyCues:['Arms locked out','Legs parallel','Breathe out'], muscles:['Core','Hip Flexors','Triceps'] },
      { name:'Dragon Flag Negative', technique:'Hold bench, lift legs up, slowly lower rigid body down — very demanding exercise.', keyCues:['Rigid body','Slow controlled descent','Arms fixed'], muscles:['Core','Lats','Hip Flexors'] },
    ],
    cables: [
      { name:'Pallof Press',          technique:'Cable at chest height, stand sideways, press straight ahead and hold — resists rotation.', keyCues:['Anti-rotation','Press and hold','Core stays still'], muscles:['Core','Obliques'] },
      { name:'Cable Woodchop',        technique:'High cable, chop downward and across body diagonally — oblique rotational power.', keyCues:['Rotate through hips','Arms nearly straight','Control return'], muscles:['Obliques','Core'] },
      { name:'Kneeling Cable Crunch', technique:'Rope overhead, kneel and crunch down to knees, squeeze abs hard at bottom.', keyCues:['Crunch not pull','Squeeze at bottom','Round lower back'], muscles:['Abs','Core'] },
    ],
    machines: [
      { name:'Captain\'s Chair Leg Raise', technique:'Forearms on pads, raise knees or straight legs to parallel, lower controlled.', keyCues:['Control the descent','Core not hip flexors','Breathe out on way up'], muscles:['Core','Hip Flexors'] },
      { name:'Cable Pallof Press',         technique:'High pulley cable, press straight forward and hold — anti-rotation stability.', keyCues:['Anti-rotation','Press and hold','Core stays still'], muscles:['Core','Obliques'] },
      { name:'Crunch Machine',             technique:'Adjust pad at chest, crunch forward rounding spine, squeeze abs hard at peak.', keyCues:['Round the spine','Squeeze abs hard','Slow return'], muscles:['Abs','Core'] },
    ],
  },
};

// ─── Training Splits ──────────────────────────────────────────────────────────
const SPLITS: Record<string, DayDef[]> = {
  '1': [
    { num:1, name:'Full Body', type:'full_a' },
  ],
  '2': [
    { num:1, name:'Full Body A', type:'full_a' },
    { num:2, name:'Full Body B', type:'full_b' },
  ],
  '3': [
    { num:1, name:'Push', type:'push' },
    { num:2, name:'Pull', type:'pull' },
    { num:3, name:'Legs', type:'legs' },
  ],
  '4': [
    { num:1, name:'Upper Body A (Push Focus)', type:'upper_a' },
    { num:2, name:'Lower Body A (Quad Focus)', type:'lower_a' },
    { num:3, name:'Upper Body B (Pull Focus)', type:'upper_b' },
    { num:4, name:'Lower Body B (Hip Focus)',  type:'lower_b' },
  ],
  '5': [
    { num:1, name:'Push',       type:'push' },
    { num:2, name:'Pull',       type:'pull' },
    { num:3, name:'Legs',       type:'legs' },
    { num:4, name:'Upper Body', type:'upper_a' },
    { num:5, name:'Lower Body', type:'lower_a' },
  ],
  '6': [
    { num:1, name:'Push A',     type:'push' },
    { num:2, name:'Pull A',     type:'pull' },
    { num:3, name:'Legs A',     type:'legs' },
    { num:4, name:'Push B',     type:'upper_a' },
    { num:5, name:'Pull B',     type:'upper_b' },
    { num:6, name:'Lower Body', type:'lower_a' },
  ],
  'pl3': [
    { num:1, name:'Squat Day',     type:'squat_day' },
    { num:2, name:'Bench Day',     type:'bench_day' },
    { num:3, name:'Deadlift Day',  type:'deadlift_day' },
  ],
  'pl4': [
    { num:1, name:'Squat Day',     type:'squat_day' },
    { num:2, name:'Bench Day',     type:'bench_day' },
    { num:3, name:'Deadlift Day',  type:'deadlift_day' },
    { num:4, name:'Accessory Day', type:'accessory_day' },
  ],
  'pl5': [
    { num:1, name:'Squat Day A',   type:'squat_day' },
    { num:2, name:'Bench Day A',   type:'bench_day' },
    { num:3, name:'Deadlift Day',  type:'deadlift_day' },
    { num:4, name:'Squat Day B',   type:'squat_day' },
    { num:5, name:'Bench Day B',   type:'bench_day' },
  ],
};

// ─── Day Templates ─────────────────────────────────────────────────────────────
// UPPER days: ONLY upper body patterns. LOWER days: ONLY lower body patterns.
const DAY_TEMPLATES: Record<string, Array<[string, 'main' | 'acc']>> = {
  upper_a:       [['horizontal_push','main'], ['vertical_pull','acc'],     ['vertical_push','acc'],     ['triceps','acc']],
  upper_b:       [['horizontal_pull','main'], ['horizontal_push_b','acc'], ['biceps','acc'],             ['rear_delt','acc']],
  lower_a:       [['squat','main'],           ['lunge','acc'],              ['leg_curl','acc'],           ['calf','acc']],
  lower_b:       [['hip_hinge','main'],       ['squat_b','acc'],            ['hip_hinge_b','acc'],        ['core','acc']],
  push:          [['horizontal_push','main'], ['vertical_push','acc'],      ['horizontal_push_b','acc'],  ['triceps','acc']],
  pull:          [['vertical_pull','main'],   ['horizontal_pull','acc'],    ['biceps','acc'],             ['rear_delt','acc']],
  legs:          [['squat','main'],           ['hip_hinge','acc'],          ['lunge','acc'],              ['calf','acc']],
  full_a:        [['squat','main'],           ['horizontal_push','acc'],    ['horizontal_pull','acc'],    ['core','acc']],
  full_b:        [['hip_hinge','main'],       ['horizontal_push_b','acc'],  ['vertical_pull','acc'],      ['lunge','acc']],
  squat_day:     [['squat','main'],           ['squat_b','acc'],            ['leg_curl','acc'],           ['core','acc']],
  bench_day:     [['horizontal_push','main'], ['horizontal_push_b','acc'],  ['triceps','acc'],            ['rear_delt','acc']],
  deadlift_day:  [['hip_hinge','main'],       ['hip_hinge_b','acc'],        ['horizontal_pull','acc'],    ['biceps','acc']],
  accessory_day: [['vertical_push','main'],   ['vertical_pull','acc'],      ['lunge','acc'],              ['core','acc']],
};

// ─── Equipment Priority per Movement ─────────────────────────────────────────
const EQUIP_PRIORITY: Record<string, string[]> = {
  horizontal_push:   ['barbell','dumbbell','cables','machines','bodyweight'],
  horizontal_push_b: ['barbell','dumbbell','cables','machines','bodyweight'],
  vertical_push:     ['barbell','dumbbell','cables','machines','bodyweight'],
  horizontal_pull:   ['barbell','cables','dumbbell','machines','bodyweight'],
  vertical_pull:     ['bodyweight','cables','machines','dumbbell','barbell'],
  biceps:            ['barbell','dumbbell','cables','machines','bodyweight'],
  triceps:           ['cables','barbell','dumbbell','machines','bodyweight'],
  rear_delt:         ['cables','dumbbell','machines','barbell','bodyweight'],
  squat:             ['barbell','machines','dumbbell','bodyweight'],
  squat_b:           ['barbell','dumbbell','machines','bodyweight'],
  hip_hinge:         ['barbell','dumbbell','cables','machines','bodyweight'],
  hip_hinge_b:       ['barbell','dumbbell','cables','machines','bodyweight'],
  lunge:             ['dumbbell','barbell','machines','bodyweight'],
  leg_curl:          ['machines','cables','dumbbell','barbell','bodyweight'],
  calf:              ['machines','barbell','dumbbell','cables','bodyweight'],
  core:              ['bodyweight','cables','dumbbell','machines','barbell'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getSplitKey(sport: string, days: number): string {
  if (sport === 'powerlifting') {
    if (days <= 3) return 'pl3';
    if (days <= 4) return 'pl4';
    return 'pl5';
  }
  return String(Math.min(Math.max(days, 1), 6));
}

function getEquip(pattern: string, available: Set<string>, sport: string): string {
  if (sport === 'calisthenics') return 'bodyweight';
  const priority = EQUIP_PRIORITY[pattern] ?? ['barbell','dumbbell','bodyweight'];
  return priority.find(e => available.has(e)) ?? 'bodyweight';
}

function getExercise(pattern: string, equip: string, pIdx: 0|1|2): ExTemplate {
  const pool = DB[pattern]?.[equip] ?? DB[pattern]?.['bodyweight'] ?? [];
  if (pool.length === 0) return { name:`${pattern}`, technique:'Perform with control through full range.', keyCues:['Full range','Controlled movement'], muscles:['Muscles'] };
  return pool[Math.min(pIdx, pool.length - 1)];
}

function buildExercise(pattern: string, role: 'main'|'acc', equip: string, pIdx: 0|1|2, cfg: WeekCfg): Exercise {
  const ex = getExercise(pattern, equip, pIdx);
  const isMain = role === 'main';
  return {
    name:      ex.name,
    sets:      isMain ? cfg.mainSets : cfg.accSets,
    reps:      isMain ? cfg.mainReps : cfg.accReps,
    rpe:       isMain ? cfg.mainRpe  : cfg.accRpe,
    technique: ex.technique,
    keyCues:   ex.keyCues,
    muscles:   ex.muscles,
  };
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export async function generateFitnessProgram(req: GenerateProgramRequest): Promise<ProgramResponse> {
  // Map kettlebell → dumbbell for our equipment lookup
  const rawEquip = (req.equipment ?? []).map(e => e === 'kettlebell' ? 'dumbbell' : e);
  const available = new Set<string>(rawEquip.length > 0 ? rawEquip : ['bodyweight']);

  const splitKey = getSplitKey(req.sport, req.daysPerWeek);
  const split = SPLITS[splitKey] ?? SPLITS['3'];

  // Use goal-adjusted periodisation configs
  const weekCfgs = getGoalAdjustedCfgs(req.goals ?? [], req.sport);

  const program = weekCfgs.map((cfg, weekIdx) => {
    const week = weekIdx + 1;
    const pIdx = phaseIdx(cfg.phaseKey);

    const days = split.map(slot => {
      const template = DAY_TEMPLATES[slot.type] ?? DAY_TEMPLATES['full_a'];
      const exercises: Exercise[] = template.map(([pattern, role]) => {
        const equip = getEquip(pattern, available, req.sport);
        return buildExercise(pattern, role, equip, pIdx, cfg);
      });
      return { day: slot.num, focus: slot.name, phase: cfg.phaseLabel, exercises };
    });

    return { week, phaseLabel: cfg.phaseLabel, days };
  });

  return { sport: req.sport, experience: req.experience, totalWeeks: 12, program };
}
