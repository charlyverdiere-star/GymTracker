import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  Calendar, 
  TrendingUp, 
  Dumbbell, 
  ChevronRight, 
  CheckCircle, 
  Circle,
  Activity,
  User,
  X,
  History,
  Clock,
  Trash2,
  AlertTriangle,
  ArrowUpFromLine,
  ArrowDownToLine,
  Footprints,
  BicepsFlexed,
  Filter,
  Calculator,
  ChevronDown,
  UserCheck,
  Flame,
  Scale,
  ClipboardList,
  ChevronLeft,
  Ruler,
  Weight,
  Save,
  Cloud,
  Download,
  Upload
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';

// --- Helper Functions Globales ---
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const getIconForType = (type: string) => {
    switch (type) {
        case 'Push': return <ArrowUpFromLine size={24} />;
        case 'Pull': return <ArrowDownToLine size={24} />;
        case 'Legs': return <Footprints size={24} />;
        case 'Upper': return <BicepsFlexed size={24} />;
        default: return <Activity size={24} />;
    }
};

const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d);
    }
    return days;
};

// --- Types ---
type WorkoutType = string; 
type ExerciseCategory = 'Push' | 'Pull' | 'Legs' | 'Core' | 'Other';

type SetData = {
  id: string;
  reps: number;
  weight: number;
  isBodyweight?: boolean;
  completed: boolean;
};

type ExerciseData = {
  id: string;
  name: string;
  sets: SetData[];
};

type WorkoutSession = {
  id: string;
  date: string;
  type: WorkoutType;
  exercises: ExerciseData[];
  duration?: number; // in minutes
  timestamp?: number;
};

type DailyGoal = {
  id: string;
  label: string;
  completed: boolean;
};

type ExerciseDef = {
  name: string;
  category: ExerciseCategory;
};

type PresetType = {
    type: string;
    color: string;
    isCustom?: boolean;
};

type UserProfile = {
    gender: 'Homme' | 'Femme';
    age: number;
    weight: number;
    height: number;
};

// --- Defaults ---
const INITIAL_GOALS: DailyGoal[] = [
  { id: 'g1', label: 'Créatine', completed: false },
  { id: 'g2', label: 'Magnésium', completed: false },
  { id: 'g3', label: 'Multivitamine', completed: false },
  { id: 'g4', label: 'Oméga 3', completed: false },
];

const DEFAULT_EXERCISE_DB: ExerciseDef[] = [
  { name: 'Développé Couché', category: 'Push' },
  { name: 'Squat', category: 'Legs' },
  { name: 'Tractions', category: 'Pull' },
  { name: 'Soulevé de Terre', category: 'Pull' },
  { name: 'Rowing', category: 'Pull' },
  { name: 'Curl Biceps', category: 'Pull' },
  { name: 'Dips', category: 'Push' },
  { name: 'Presse à cuisses', category: 'Legs' },
  { name: 'Élévations Latérales', category: 'Push' },
  { name: 'Extension Triceps', category: 'Push' },
  { name: 'Fentes', category: 'Legs' },
  { name: 'Leg Extension', category: 'Legs' },
  { name: 'Face Pull', category: 'Pull' },
  { name: 'Crunch', category: 'Core' },
  { name: 'Military Press', category: 'Push' },
  { name: 'Hammer Curl', category: 'Pull' },
  { name: 'Romanian Deadlift', category: 'Legs' },
];

const DEFAULT_TYPES: PresetType[] = [
    { type: 'Push', color: 'bg-orange-500' },
    { type: 'Pull', color: 'bg-blue-500' },
    { type: 'Legs', color: 'bg-purple-500' },
    { type: 'Upper', color: 'bg-emerald-500' },
];

const PIE_COLORS = ['#f97316', '#3b82f6', '#a855f7', '#10b981', '#ef4444', '#eab308', '#6366f1'];

// --- Composant Principal ---
export default function GymTrackerApp() {
  const [activeTab, setActiveTab] = useState<'home' | 'workout' | 'stats' | 'history' | 'summary' | 'profile'>('home');
  
  // -- PERSISTENCE: Chargement des données depuis le LocalStorage --
  const [workouts, setWorkouts] = useState<WorkoutSession[]>(() => {
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('gymtracker_workouts');
          return saved ? JSON.parse(saved) : [];
      }
      return [];
  });
  
  const [availableTypes, setAvailableTypes] = useState<PresetType[]>(() => {
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('gymtracker_types');
          return saved ? JSON.parse(saved) : DEFAULT_TYPES;
      }
      return DEFAULT_TYPES;
  });

  const [suggestedExercises, setSuggestedExercises] = useState<ExerciseDef[]>(() => {
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('gymtracker_exercises');
          return saved ? JSON.parse(saved) : DEFAULT_EXERCISE_DB;
      }
      return DEFAULT_EXERCISE_DB;
  });

  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>(() => {
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('gymtracker_goals');
          return saved ? JSON.parse(saved) : INITIAL_GOALS;
      }
      return INITIAL_GOALS;
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('gymtracker_profile');
          return saved ? JSON.parse(saved) : { gender: 'Homme', age: 20, weight: 75, height: 176 };
      }
      return { gender: 'Homme', age: 20, weight: 75, height: 176 };
  });

  // -- PERSISTENCE: Sauvegarde automatique --
  useEffect(() => localStorage.setItem('gymtracker_workouts', JSON.stringify(workouts)), [workouts]);
  useEffect(() => localStorage.setItem('gymtracker_types', JSON.stringify(availableTypes)), [availableTypes]);
  useEffect(() => localStorage.setItem('gymtracker_exercises', JSON.stringify(suggestedExercises)), [suggestedExercises]);
  useEffect(() => localStorage.setItem('gymtracker_goals', JSON.stringify(dailyGoals)), [dailyGoals]);
  useEffect(() => localStorage.setItem('gymtracker_profile', JSON.stringify(userProfile)), [userProfile]);

  // États Séance
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null);
  const [workoutTimer, setWorkoutTimer] = useState(0);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [customExerciseName, setCustomExerciseName] = useState('');
  
  // UI States
  const [newTypeName, setNewTypeName] = useState('');
  const [isCreatingType, setIsCreatingType] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<ExerciseCategory | 'All' | 'Upper'>('All');
  const [newGoalName, setNewGoalName] = useState('');
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [deleteState, setDeleteState] = useState<{
    type: 'workout' | 'exercise_session' | 'exercise_db' | 'cancel_workout' | 'workout_type' | 'goal';
    id?: string;
    name?: string;
  } | null>(null);
  const [selectedExerciseStats, setSelectedExerciseStats] = useState<string>('');
  const [statsMode, setStatsMode] = useState<'weight' | '1rm' | 'volume'>('weight');
  const [isStatsDropdownOpen, setIsStatsDropdownOpen] = useState(false);
  const [summaryPeriod, setSummaryPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [summaryDate, setSummaryDate] = useState(new Date());
  const [weightGraphPeriod, setWeightGraphPeriod] = useState<'1M' | '3M' | '1Y'>('1M');

  // Hidden File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---
  useEffect(() => {
    let interval: any;
    if (activeWorkout) {
      interval = setInterval(() => {
        setWorkoutTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeWorkout]);

  useEffect(() => {
    if (activeTab === 'stats' && !selectedExerciseStats && workouts.length > 0) {
        const names = new Set<string>();
        workouts.forEach(w => w.exercises.forEach(e => names.add(e.name)));
        const list = Array.from(names);
        if (list.length > 0) setSelectedExerciseStats(list[0]);
    }
  }, [activeTab, workouts, selectedExerciseStats]);

  useEffect(() => {
    if (activeWorkout) {
        if (activeWorkout.type === 'Push') setCategoryFilter('Push');
        else if (activeWorkout.type === 'Pull') setCategoryFilter('Pull');
        else if (activeWorkout.type === 'Legs') setCategoryFilter('Legs');
        else if (activeWorkout.type === 'Upper') setCategoryFilter('Upper');
        else setCategoryFilter('All');
    }
  }, [activeWorkout?.type]);

  // --- Logic Helpers ---
  const hasWorkoutOnDate = (date: Date) => {
      const dateStr = date.toISOString().split('T')[0];
      return workouts.some(w => w.date === dateStr);
  };

  const getWeightData = () => {
      const current = userProfile.weight || 0;
      const data = [];
      const now = new Date();
      let points = 5;
      let months = 1;
      
      if (weightGraphPeriod === '3M') { points = 8; months = 3; }
      if (weightGraphPeriod === '1Y') { points = 12; months = 12; }

      // Simulation pour afficher une courbe cohérente basée sur le poids actuel uniquement
      // Pour éviter de voir une ligne vide si pas d'historique
      for (let i = points - 1; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - (i * (months * 30) / points));
          const variation = i === 0 ? 0 : (Math.random() * 0.4 - 0.2); 
          data.push({
              date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
              weight: parseFloat((current + variation).toFixed(1))
          });
      }
      return data;
  };

  // --- Actions ---

  // Export Data Logic
  const handleExportData = () => {
      const data = {
          workouts,
          availableTypes,
          suggestedExercises,
          dailyGoals,
          userProfile,
          version: '1.0',
          exportDate: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gymtracker_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  // Import Data Logic
  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const content = e.target?.result as string;
              const data = JSON.parse(content);
              
              if (data.workouts) setWorkouts(data.workouts);
              if (data.availableTypes) setAvailableTypes(data.availableTypes);
              if (data.suggestedExercises) setSuggestedExercises(data.suggestedExercises);
              if (data.dailyGoals) setDailyGoals(data.dailyGoals);
              if (data.userProfile) setUserProfile(data.userProfile);

              alert("Données restaurées avec succès !");
          } catch (err) {
              alert("Erreur lors de la lecture du fichier de sauvegarde.");
              console.error(err);
          }
      };
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = ''; 
  };

  const handleStartClick = () => {
    if (activeWorkout) setActiveTab('workout');
    else setShowTypeSelector(true);
  };

  const startWorkout = (type: WorkoutType) => {
    const newWorkout: WorkoutSession = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      type: type,
      exercises: [],
      timestamp: Date.now()
    };
    setActiveWorkout(newWorkout);
    setWorkoutTimer(0);
    setShowTypeSelector(false);
    setActiveTab('workout');
  };

  const createNewType = () => {
      if (newTypeName.trim()) {
          const newType = { type: newTypeName, color: 'bg-zinc-600', isCustom: true };
          setAvailableTypes([...availableTypes, newType]);
          setNewTypeName('');
          setIsCreatingType(false);
      }
  };

  const addExercise = (name: string, category: ExerciseCategory = 'Other') => {
    if (!activeWorkout || !name.trim()) return;
    const newExercise: ExerciseData = {
      id: Date.now().toString(),
      name: name,
      sets: [{ id: Date.now().toString() + 's', reps: 0, weight: 0, completed: false, isBodyweight: false }]
    };
    setActiveWorkout({ ...activeWorkout, exercises: [...activeWorkout.exercises, newExercise] });

    if (!suggestedExercises.find(e => e.name.toLowerCase() === name.toLowerCase())) {
        let newCat = category;
        if (category === 'Other') {
             if (activeWorkout.type === 'Push') newCat = 'Push';
             else if (activeWorkout.type === 'Pull') newCat = 'Pull';
             else if (activeWorkout.type === 'Legs') newCat = 'Legs';
             else if (activeWorkout.type === 'Upper') newCat = 'Push';
        }
        setSuggestedExercises([{ name, category: newCat }, ...suggestedExercises]);
    }
    setCustomExerciseName(''); 
  };

  const updateSet = (exerciseId: string, setId: string, field: 'reps' | 'weight', value: number) => {
    if (!activeWorkout) return;
    const updatedExercises = activeWorkout.exercises.map(ex => {
      if (ex.id !== exerciseId) return ex;
      return { ...ex, sets: ex.sets.map(set => set.id === setId ? { ...set, [field]: value } : set) };
    });
    setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
  };

  const togglePDC = (exerciseId: string, setId: string) => {
    if (!activeWorkout) return;
    const updatedExercises = activeWorkout.exercises.map(ex => {
      if (ex.id !== exerciseId) return ex;
      return { ...ex, sets: ex.sets.map(set => set.id === setId ? { ...set, isBodyweight: !set.isBodyweight, weight: 0 } : set) };
    });
    setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
  };

  const toggleSetComplete = (exerciseId: string, setId: string) => {
    if (!activeWorkout) return;
    const updatedExercises = activeWorkout.exercises.map(ex => {
      if (ex.id !== exerciseId) return ex;
      return { ...ex, sets: ex.sets.map(set => set.id === setId ? { ...set, completed: !set.completed } : set) };
    });
    setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
  };

  const addSet = (exerciseId: string) => {
    if (!activeWorkout) return;
    const updatedExercises = activeWorkout.exercises.map(ex => {
      if (ex.id !== exerciseId) return ex;
      const lastSet = ex.sets[ex.sets.length - 1];
      return { ...ex, sets: [...ex.sets, { id: Date.now().toString(), reps: lastSet?.reps || 0, weight: lastSet?.weight || 0, isBodyweight: lastSet?.isBodyweight || false, completed: false }] };
    });
    setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
  };

  const finishWorkout = () => {
    if (activeWorkout) {
      const finalWorkout = { ...activeWorkout, duration: Math.floor(workoutTimer / 60), timestamp: Date.now() };
      setWorkouts([finalWorkout, ...workouts]);
      setActiveWorkout(null);
      setActiveTab('history');
    }
  };

  const cancelWorkoutRequest = () => {
    setDeleteState({ type: 'cancel_workout' });
  };

  const confirmDelete = () => {
    if (!deleteState) return;
    if (deleteState.type === 'workout' && deleteState.id) {
        setWorkouts(workouts.filter(w => w.id !== deleteState.id));
    } else if (deleteState.type === 'exercise_session' && deleteState.id && activeWorkout) {
        setActiveWorkout({ ...activeWorkout, exercises: activeWorkout.exercises.filter(ex => ex.id !== deleteState.id) });
    } else if (deleteState.type === 'exercise_db' && deleteState.name) {
        setSuggestedExercises(suggestedExercises.filter(ex => ex.name !== deleteState.name));
    } else if (deleteState.type === 'cancel_workout') {
        setActiveWorkout(null);
        setShowTypeSelector(false);
        setActiveTab('home');
    } else if (deleteState.type === 'workout_type' && deleteState.name) {
        setAvailableTypes(availableTypes.filter(t => t.type !== deleteState.name));
    } else if (deleteState.type === 'goal' && deleteState.id) {
        setDailyGoals(dailyGoals.filter(g => g.id !== deleteState.id));
    }
    setDeleteState(null);
  };

  const toggleGoal = (id: string) => {
    setDailyGoals(dailyGoals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  const addGoal = () => {
    if (newGoalName.trim()) {
        setDailyGoals([...dailyGoals, { id: Date.now().toString(), label: newGoalName.trim(), completed: false }]);
        setNewGoalName('');
        setIsAddingGoal(false);
    }
  };

  const updateUserProfile = (newProfile: Partial<UserProfile>) => {
      setUserProfile({ ...userProfile, ...newProfile });
  };

  const navigateSummary = (dir: -1 | 1) => {
      const d = new Date(summaryDate);
      if (summaryPeriod === 'week') d.setDate(d.getDate() + (dir * 7));
      else if (summaryPeriod === 'month') d.setMonth(d.getMonth() + dir);
      else d.setFullYear(d.getFullYear() + dir);
      setSummaryDate(d);
  };

  const getSummaryRange = () => {
      const date = new Date(summaryDate);
      let start = new Date(date);
      let end = new Date(date);
      let label = "";
      if (summaryPeriod === 'week') {
          const day = start.getDay();
          const diff = start.getDate() - day + (day === 0 ? -6 : 1);
          start.setDate(diff);
          end = new Date(start);
          end.setDate(start.getDate() + 6);
          label = `Semaine du ${start.getDate()}/${start.getMonth() + 1}`;
      } else if (summaryPeriod === 'month') {
          start.setDate(1);
          end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
          label = start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      } else if (summaryPeriod === 'year') {
          start.setMonth(0, 1);
          end.setMonth(11, 31);
          label = start.getFullYear().toString();
      }
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
      return { start, end, label };
  };

  // --- Render Views ---

  const renderHomeView = () => (
    <div className="space-y-6 pb-24">
      <header className="flex justify-between items-center mb-6 pt-2">
        <div><h1 className="text-3xl font-bold text-white tracking-tight">Bonjour</h1><p className="text-zinc-400 text-sm">Prêt à performer aujourd'hui ?</p></div>
        <div onClick={() => setActiveTab('profile')} className="h-10 w-10 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-300 border border-zinc-800 cursor-pointer hover:bg-zinc-800 transition-colors"><User size={20} /></div>
      </header>
      <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 shadow-xl select-none">
        <div className="flex justify-between items-center mb-3"><h3 className="text-zinc-100 font-semibold flex items-center text-sm"><Flame size={16} className="mr-2 text-orange-500" />Cette semaine</h3><span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full">{workouts.length} total</span></div>
        <div className="flex justify-between items-center">
            {getLast7Days().map((date, idx) => {
                const isActive = hasWorkoutOnDate(date);
                const isToday = date.toDateString() === new Date().toDateString();
                const dayLetter = date.toLocaleDateString('fr-FR', { weekday: 'narrow' }).charAt(0).toUpperCase();
                return (
                    <div key={idx} className="flex flex-col items-center gap-2"><span className={`text-[10px] font-bold ${isToday ? 'text-blue-500' : 'text-zinc-500'}`}>{dayLetter}</span><div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${isActive ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-transparent border-zinc-800 text-zinc-700'}`}>{isActive ? <CheckCircle size={14} /> : <div className="w-1 h-1 rounded-full bg-zinc-800"></div>}</div></div>
                );
            })}
        </div>
      </div>
      <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-xl select-none">
        <div className="flex justify-between items-center mb-4"><h3 className="text-emerald-400 font-semibold flex items-center text-sm uppercase tracking-wider"><CheckCircle size={16} className="mr-2"/> Compléments</h3><button onClick={() => setIsAddingGoal(!isAddingGoal)} className={`text-zinc-500 hover:text-emerald-400 transition-colors p-1 rounded-full ${isAddingGoal ? 'text-emerald-400 bg-emerald-900/20' : ''}`}><Plus size={18} /></button></div>
        <div className="space-y-2">
            {dailyGoals.map(goal => (
                <div key={goal.id} className="flex items-center gap-2 group"><div onClick={() => toggleGoal(goal.id)} className={`flex-grow flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-200 border ${goal.completed ? 'bg-emerald-950/30 border-emerald-900/50' : 'bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800'}`}><span className={`font-medium ${goal.completed ? 'text-emerald-400' : 'text-zinc-300'}`}>{goal.label}</span>{goal.completed ? <CheckCircle className="text-emerald-500" size={20} /> : <Circle className="text-zinc-600" size={20} />}</div><button onClick={(e) => { e.stopPropagation(); setDeleteState({ type: 'goal', id: goal.id }); }} className="text-zinc-600 hover:text-red-500 p-2 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"><X size={16} /></button></div>
            ))}
            {isAddingGoal && (<div className="flex gap-2 mt-2 animate-in slide-in-from-top-2 fade-in duration-200"><input autoFocus type="text" value={newGoalName} onChange={(e) => setNewGoalName(e.target.value)} placeholder="Nouveau..." className="flex-grow bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-zinc-600" onKeyDown={(e) => e.key === 'Enter' && addGoal()} /><button onClick={addGoal} disabled={!newGoalName.trim()} className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-500 transition shadow-lg shadow-emerald-900/20 disabled:opacity-50"><Plus size={20} /></button></div>)}
        </div>
      </div>
      <div>
        <div className="flex justify-between items-end mb-4"><h2 className="text-lg font-bold text-white">Dernière séance</h2>{workouts.length > 0 && (<button onClick={() => setActiveTab('history')} className="text-xs text-blue-500 font-medium hover:text-blue-400">Voir tout</button>)}</div>
        {workouts.length === 0 ? (<div className="text-center py-10 bg-zinc-900 rounded-3xl border border-zinc-800 border-dashed select-none"><p className="text-zinc-500 text-sm font-medium">Aucune séance enregistrée</p><button onClick={handleStartClick} className="text-blue-500 text-xs font-bold uppercase tracking-wide mt-3 hover:text-blue-400">Commencer maintenant</button></div>) : (<div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between hover:bg-zinc-800 transition cursor-pointer select-none" onClick={() => setActiveTab('history')}><div className="flex items-center"><div className="bg-gradient-to-br from-blue-600 to-blue-800 p-3 rounded-xl mr-4 shadow-lg shadow-blue-900/20"><Dumbbell className="text-white" size={20} /></div><div><h4 className="font-bold text-zinc-100 text-lg">Séance {workouts[0].type}</h4><p className="text-xs text-zinc-500 flex items-center mt-1"><Calendar size={12} className="mr-1" /> {workouts[0].date}<span className="mx-2">•</span><Clock size={12} className="mr-1" /> {workouts[0].duration || 0} min</p></div></div><ChevronRight className="text-zinc-600" size={20} /></div>)}
      </div>
    </div>
  );

  const renderHistoryView = () => (
    <div className="space-y-6 pb-24 h-full flex flex-col">
        <header className="mb-2 pt-2"><h1 className="text-2xl font-bold text-white">Historique</h1><p className="text-zinc-400 text-sm">Tes séances terminées</p></header>
        {workouts.length === 0 ? (<div className="flex-grow flex flex-col items-center justify-center text-center opacity-50 select-none"><History size={48} className="mb-4 text-zinc-600" /><p className="text-zinc-400">Ton historique est vide.</p></div>) : (
            <div className="space-y-4 overflow-y-auto pr-1 dark-scrollbar">
                {[...workouts].map(workout => (
                    <div key={workout.id} className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-sm relative overflow-hidden group select-none">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-start"><div className={`p-3 rounded-xl mr-4 ${workout.type === 'Push' ? 'bg-orange-500/10 text-orange-500' : workout.type === 'Pull' ? 'bg-blue-500/10 text-blue-500' : workout.type === 'Legs' ? 'bg-purple-500/10 text-purple-500' : 'bg-zinc-700/30 text-zinc-300'}`}>{getIconForType(workout.type)}</div><div><h3 className="text-xl font-bold text-white">Séance {workout.type}</h3><div className="flex items-center text-xs text-zinc-500 mt-1 font-medium"><span className="flex items-center mr-3"><Clock size={12} className="mr-1"/> {workout.duration} min</span><span className="flex items-center"><Dumbbell size={12} className="mr-1"/> {workout.exercises.length} Exos</span><span className="ml-3 text-zinc-600">{workout.date}</span></div></div></div>
                            <button onClick={(e) => { e.stopPropagation(); setDeleteState({ type: 'workout', id: workout.id }); }} className="text-zinc-600 hover:text-red-500 p-2 -mr-2 transition-colors"><Trash2 size={20} /></button>
                        </div>
                        <div className="space-y-2">{workout.exercises.slice(0, 3).map(ex => { const bestSet = ex.sets.reduce((prev, current) => (prev.weight > current.weight) ? prev : current); return (<div key={ex.id} className="flex justify-between items-center text-sm border-t border-zinc-800/50 pt-2"><span className="text-zinc-400">{ex.name}</span><span className="font-mono text-zinc-200 text-xs bg-zinc-800 px-2 py-0.5 rounded-md">{bestSet.weight}kg x {bestSet.reps}</span></div>); })}</div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );

  const renderWorkoutView = () => {
    if (!activeWorkout) return null;
    const filteredExercises = suggestedExercises.filter(ex => { if (categoryFilter === 'All') return true; if (categoryFilter === 'Upper') return ex.category === 'Push' || ex.category === 'Pull'; return ex.category === categoryFilter; });
    return (
      <div className="pb-24 flex flex-col h-full">
        <div className="sticky top-0 bg-zinc-950/95 backdrop-blur z-30 py-4 border-b border-zinc-800 mb-4 flex justify-between items-center select-none"><div><h2 className="text-xl font-bold text-white">Séance {activeWorkout.type}</h2><span className="text-blue-400 font-mono font-medium tracking-widest flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>{formatTime(workoutTimer)}</span></div><button onClick={finishWorkout} className="bg-blue-600 text-white px-5 py-2 rounded-full font-bold text-sm shadow-lg shadow-blue-900/20 hover:bg-blue-500 transition active:scale-95">Terminer</button></div>
        <div className="space-y-6 flex-grow">
            <div className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800">
                <div className="flex justify-between items-center mb-3 select-none"><h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Ajouter un exercice</h3><div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 overflow-x-auto dark-scrollbar">{(['All', 'Push', 'Pull', 'Legs', 'Upper'] as const).map(cat => (<button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-colors whitespace-nowrap ${categoryFilter === cat ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>{cat === 'All' ? 'Tout' : cat}</button>))}</div></div>
                <div className="flex gap-2 mb-4"><input type="text" value={customExerciseName} onChange={(e) => setCustomExerciseName(e.target.value)} placeholder="Nom de ton exercice..." className="flex-grow bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white text-base focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-zinc-600" onKeyDown={(e) => e.key === 'Enter' && addExercise(customExerciseName)} /><button onClick={() => addExercise(customExerciseName)} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-500 transition shadow-lg shadow-blue-900/20 active:scale-95" disabled={!customExerciseName.trim()}><Plus size={24} /></button></div>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 dark-scrollbar select-none">{filteredExercises.map(ex => (<div key={ex.name} className="bg-zinc-800 border border-zinc-700/50 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:border-zinc-600 transition flex items-center justify-between group overflow-hidden"><button onClick={() => addExercise(ex.name, ex.category)} className="flex-grow px-3 py-2 text-left truncate active:scale-95 flex items-center gap-2"><span>+ {ex.name}</span><span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ex.category === 'Push' ? 'bg-orange-500' : ex.category === 'Pull' ? 'bg-blue-500' : ex.category === 'Legs' ? 'bg-purple-500' : 'bg-zinc-600'}`}></span></button><button onClick={() => setDeleteState({ type: 'exercise_db', name: ex.name })} className="px-2 py-2 text-zinc-600 hover:text-red-500 hover:bg-zinc-900/50 transition-colors border-l border-zinc-700/50"><X size={12} /></button></div>))}</div>
            </div>
            {activeWorkout.exercises.map((ex, exIndex) => (
                <div key={ex.id} className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-zinc-800/50 p-4 flex justify-between items-center border-b border-zinc-800 select-none"><h3 className="font-bold text-zinc-100">{ex.name}</h3><button onClick={() => setDeleteState({ type: 'exercise_session', id: ex.id })} className="text-zinc-600 hover:text-red-500 transition-colors"><Trash2 size={16} /></button></div>
                    <div className="p-3">
                        <div className="grid grid-cols-12 gap-2 mb-3 text-[10px] uppercase tracking-wider font-bold text-zinc-500 text-center px-1 select-none"><span className="col-span-1">#</span><span className="col-span-4">Poids (kg)</span><span className="col-span-4">Reps</span><span className="col-span-3">Validé</span></div>
                        {ex.sets.map((set, idx) => (
                            <div key={set.id} className={`grid grid-cols-12 gap-2 items-center mb-3 p-1 rounded-lg transition`}><span className="col-span-1 text-center font-bold text-zinc-500 select-none">{idx + 1}</span><div className="col-span-4 relative flex items-center">{set.isBodyweight ? (<div className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-center font-bold text-zinc-400 text-xs flex items-center justify-center h-[46px]">PDC</div>) : (<input type="number" value={set.weight || ''} onChange={(e) => updateSet(ex.id, set.id, 'weight', parseFloat(e.target.value) || 0)} placeholder="0" className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 pr-14 text-center font-bold text-white text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all placeholder-zinc-700 h-[46px]" />)}<button onClick={() => togglePDC(ex.id, set.id)} className={`absolute right-2 top-1/2 -translate-y-1/2 bg-zinc-800 p-1 rounded-md border border-zinc-700 text-[9px] font-bold ${set.isBodyweight ? 'text-blue-400 border-blue-500/50' : 'text-zinc-500'}`}>{set.isBodyweight ? 'KG' : 'PDC'}</button></div><div className="col-span-4"><input type="number" value={set.reps || ''} onChange={(e) => updateSet(ex.id, set.id, 'reps', parseFloat(e.target.value) || 0)} placeholder="0" className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-center font-bold text-white text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all placeholder-zinc-700 h-[46px]" /></div><div className="col-span-3 flex justify-center"><button onClick={() => toggleSetComplete(ex.id, set.id)} className={`h-[46px] w-full rounded-xl flex items-center justify-center transition-all active:scale-95 ${set.completed ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/30' : 'bg-zinc-800 text-zinc-600 hover:bg-zinc-700'}`}><CheckCircle size={22} /></button></div></div>
                        ))}
                        <button onClick={() => addSet(ex.id)} className="w-full py-3 mt-1 text-sm font-semibold text-blue-400 bg-blue-500/10 rounded-xl hover:bg-blue-500/20 transition flex items-center justify-center border border-blue-500/20 active:scale-95 select-none"><Plus size={16} className="mr-2"/> Ajouter une série</button>
                    </div>
                </div>
            ))}
            <button onClick={() => setDeleteState({ type: 'cancel_workout' })} className="w-full py-4 text-red-400 font-medium text-sm mt-4 opacity-50 hover:opacity-100 flex items-center justify-center select-none"><X size={16} className="mr-2"/> Annuler la séance</button>
        </div>
      </div>
    );
  };

  const renderStatsView = () => {
    const availableExercises = Array.from(new Set(workouts.flatMap(w => w.exercises.map(e => e.name))));
    const currentSelected = selectedExerciseStats || (availableExercises.length > 0 ? availableExercises[0] : '');
    const data = workouts.map(w => { 
        const ex = w.exercises.find(e => e.name === currentSelected); 
        if (!ex) return null; 
        let bestSet = { weight: 0, reps: 0, oneRM: 0, isBodyweight: false }; 
        let totalVolume = 0; 
        ex.sets.forEach(s => { 
            const effectiveWeight = s.isBodyweight ? 0 : s.weight; 
            const currentOneRM = s.reps > 0 ? Math.round(effectiveWeight * (1 + s.reps / 30)) : 0; 
            totalVolume += effectiveWeight * s.reps; 
            if (currentOneRM > bestSet.oneRM || (s.isBodyweight && s.reps > bestSet.reps)) { 
                bestSet = { weight: effectiveWeight, reps: s.reps, oneRM: currentOneRM, isBodyweight: s.isBodyweight || false }; 
            } 
        }); 
        return { date: w.date, weight: bestSet.weight, oneRM: bestSet.oneRM, reps: bestSet.reps, volume: totalVolume, isBodyweight: bestSet.isBodyweight }; 
    }).filter((item): item is { date: string; weight: number; oneRM: number; reps: number; volume: number; isBodyweight: boolean } => item !== null);
    
    const isEmpty = workouts.length === 0;

    const CustomDropdown = () => (<div className="relative w-full"><button onClick={() => setIsStatsDropdownOpen(!isStatsDropdownOpen)} className="w-full bg-zinc-950 text-white font-medium p-3 rounded-xl border border-zinc-800 flex justify-between items-center focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"><span className="truncate">{currentSelected || "Sélectionner un exercice"}</span><ChevronDown size={16} className={`text-zinc-500 transition-transform ${isStatsDropdownOpen ? 'rotate-180' : ''}`} /></button>{isStatsDropdownOpen && (<div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto dark-scrollbar p-1">{availableExercises.map(ex => (<button key={ex} onClick={() => { setSelectedExerciseStats(ex); setIsStatsDropdownOpen(false); }} className={`w-full text-left p-3 rounded-lg text-sm font-medium transition-colors ${selectedExerciseStats === ex ? 'bg-blue-600 text-white' : 'text-zinc-300 hover:bg-zinc-800'}`}>{ex}</button>))}</div>)}</div>);
    const CustomTooltip = ({ active, payload, label }: any) => { if (active && payload && payload.length) { const d = payload[0].payload; let valueDisplay = ""; if (statsMode === 'weight') valueDisplay = `${d.weight} kg`; else if (statsMode === '1rm') valueDisplay = `${d.oneRM} kg (Est.)`; else valueDisplay = `${d.volume} kg (Vol.)`; if (d.isBodyweight && statsMode !== 'volume') valueDisplay = 'PDC'; return (<div className="bg-zinc-900 border border-zinc-700 p-3 rounded-xl shadow-xl"><p className="text-zinc-400 text-xs mb-1">{new Date(label).toLocaleDateString()}</p><p className="text-white font-bold text-lg">{valueDisplay}</p>{statsMode === 'volume' ? (<p className="text-emerald-400 text-xs mt-1 font-mono">Volume Total Séance</p>) : (<p className="text-emerald-400 text-xs mt-1 font-mono">{d.isBodyweight ? 'Poids du corps' : `${d.weight}kg`} × {d.reps} reps</p>)}</div>); } return null; };
    const cycleStatsMode = () => { if (statsMode === 'weight') setStatsMode('1rm'); else if (statsMode === '1rm') setStatsMode('volume'); else setStatsMode('weight'); }
    const getStatsModeIcon = () => { if (statsMode === 'weight') return <Dumbbell size={20} />; if (statsMode === '1rm') return <Calculator size={20} />; return <Scale size={20} />; }
    const getStatsModeLabel = () => { if (statsMode === 'weight') return 'Max Poids (kg)'; if (statsMode === '1rm') return 'Max Théorique (1RM)'; return 'Volume Total (kg)'; }
    const getDataKey = () => { if (statsMode === 'volume') return 'volume'; if (statsMode === '1rm') return 'oneRM'; return 'weight'; }

    return (
      <div className="pb-28 space-y-6"> 
         <header className="mb-6 pt-2"><h1 className="text-2xl font-bold text-white">Ta Progression</h1><p className="text-zinc-400 text-sm">Analyse de tes performances</p></header>
        {isEmpty ? (<div className="flex flex-col items-center justify-center h-64 bg-zinc-900 rounded-3xl border border-zinc-800 text-center p-6 select-none"><TrendingUp size={48} className="text-zinc-700 mb-4" /><h3 className="text-zinc-300 font-bold mb-2">Pas encore de données</h3><p className="text-zinc-500 text-sm">Termine ta première séance pour débloquer les graphiques.</p></div>) : (
            <>
                <div className="flex gap-2 relative z-20"><div className="flex-grow"><CustomDropdown /></div><button onClick={cycleStatsMode} className="bg-zinc-900 p-2 rounded-2xl border border-zinc-800 w-14 flex items-center justify-center text-blue-500 active:scale-95 transition flex-shrink-0">{getStatsModeIcon()}</button></div>
                {isStatsDropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setIsStatsDropdownOpen(false)} />}
                <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-xl relative z-0"><h3 className="font-bold text-zinc-100 mb-6 flex items-center justify-between"><span>Évolution</span><span className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-bold ${statsMode === 'volume' ? 'bg-purple-900/30 text-purple-400' : (statsMode === 'weight' ? 'bg-blue-900/30 text-blue-400' : 'bg-emerald-900/30 text-emerald-400')}`}>{getStatsModeLabel()}</span></h3><div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#71717a'}} tickFormatter={(str) => { const d = new Date(str); return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}`; }} /><YAxis axisLine={false} tickLine={false} domain={['dataMin - 5', 'dataMax + 5']} tick={{fontSize: 10, fill: '#71717a'}} /><Tooltip content={<CustomTooltip />} cursor={{stroke: '#3f3f46', strokeWidth: 1}} /><Line type="monotone" dataKey={getDataKey()} stroke={statsMode === 'volume' ? '#a855f7' : (statsMode === 'weight' ? '#3b82f6' : '#10b981')} strokeWidth={3} dot={{r: 4, fill: '#18181b', strokeWidth: 2, stroke: statsMode === 'volume' ? '#a855f7' : (statsMode === 'weight' ? '#3b82f6' : '#10b981')}} activeDot={{r: 6, fill: statsMode === 'volume' ? '#a855f7' : (statsMode === 'weight' ? '#3b82f6' : '#10b981')}} /></LineChart></ResponsiveContainer></div></div>
                <div><h3 className="font-bold text-zinc-100 mb-3 ml-1">Records Personnels (Est.)</h3><div className="grid grid-cols-2 gap-3 select-none"><div className="bg-gradient-to-br from-amber-900/20 to-amber-900/5 p-4 rounded-2xl border border-amber-900/30"><p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mb-1">Meilleur Perf</p><p className="text-2xl font-bold text-white">{data.length > 0 ? Math.max(...data.map(d => d.weight)) : 0} <span className="text-sm font-normal text-zinc-500 ml-1">kg</span></p></div><div className="bg-gradient-to-br from-purple-900/20 to-purple-900/5 p-4 rounded-2xl border border-purple-900/30"><p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider mb-1">Max Théorique</p><p className="text-2xl font-bold text-white">{data.length > 0 ? Math.max(...data.map(d => d.oneRM)) : 0}<span className="text-sm font-normal text-zinc-500 ml-1">kg</span></p></div></div></div>
            </>
        )}
      </div>
    );
  };

  const renderSummaryView = () => {
      const { start, end, label } = getSummaryRange();
      const filteredWorkouts = workouts.filter(w => { const d = new Date(w.date); return d >= start && d <= end; });
      const stats = { count: filteredWorkouts.length, duration: filteredWorkouts.reduce((acc, w) => acc + (w.duration || 0), 0), volume: filteredWorkouts.reduce((acc, w) => { return acc + w.exercises.reduce((exAcc, ex) => { return exAcc + ex.sets.reduce((setAcc, s) => { return setAcc + (s.isBodyweight ? 0 : (s.weight * s.reps)); }, 0); }, 0); }, 0) };
      const typeDistribution = filteredWorkouts.reduce((acc, w) => { acc[w.type] = (acc[w.type] || 0) + 1; return acc; }, {} as Record<string, number>);
      const pieData = Object.entries(typeDistribution).map(([name, value]) => ({ name, value }));
      return (
          <div className="space-y-6 pb-28">
              <header className="mb-6 pt-2"><h1 className="text-2xl font-bold text-white">Bilan Global</h1><p className="text-zinc-400 text-sm">Analyse de ton activité</p></header>
              <div className="flex flex-col gap-4">
                  <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">{(['week', 'month', 'year'] as const).map(p => (<button key={p} onClick={() => setSummaryPeriod(p)} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${summaryPeriod === p ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>{p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}</button>))}</div>
                  <div className="flex items-center justify-between bg-zinc-900 p-2 rounded-2xl border border-zinc-800"><button onClick={() => navigateSummary(-1)} className="p-2 hover:bg-zinc-800 rounded-xl transition text-zinc-400 hover:text-white"><ChevronLeft size={20} /></button><span className="font-bold text-white text-sm capitalize">{label}</span><button onClick={() => navigateSummary(1)} className="p-2 hover:bg-zinc-800 rounded-xl transition text-zinc-400 hover:text-white"><ChevronRight size={20} /></button></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800"><div className="flex items-center gap-2 mb-2 text-blue-500"><Activity size={18} /><span className="text-xs font-bold uppercase tracking-wider">Séances</span></div><p className="text-2xl font-bold text-white">{stats.count}</p></div>
                  <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800"><div className="flex items-center gap-2 mb-2 text-emerald-500"><Clock size={18} /><span className="text-xs font-bold uppercase tracking-wider">Durée</span></div><p className="text-2xl font-bold text-white">{Math.floor(stats.duration / 60)}<span className="text-sm text-zinc-500 font-normal">h</span> {stats.duration % 60}<span className="text-sm text-zinc-500 font-normal">m</span></p></div>
                  <div className="col-span-2 bg-zinc-900 p-4 rounded-2xl border border-zinc-800"><div className="flex items-center gap-2 mb-2 text-purple-500"><Scale size={18} /><span className="text-xs font-bold uppercase tracking-wider">Volume Total</span></div><p className="text-2xl font-bold text-white">{(stats.volume / 1000).toFixed(1)} <span className="text-sm text-zinc-500 font-normal">Tonnes</span></p></div>
              </div>
              {stats.count > 0 ? (<div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-xl"><h3 className="font-bold text-zinc-100 mb-6 text-sm">Répartition des Séances</h3><div className="h-48 w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">{pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="none" />))}</Pie><Tooltip contentStyle={{borderRadius: '12px', border: '1px solid #3f3f46', backgroundColor: '#18181b', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)'}} itemStyle={{color: '#fff'}} /><Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{fontSize: '10px'}} /></PieChart></ResponsiveContainer></div></div>) : (<div className="flex flex-col items-center justify-center py-10 text-zinc-600 bg-zinc-900/50 rounded-3xl border border-zinc-800 border-dashed"><p className="text-sm">Aucune donnée pour cette période</p></div>)}
          </div>
      );
  };

  const renderProfileView = () => {
      const heightInMeters = userProfile.height / 100;
      const bmi = heightInMeters > 0 ? (userProfile.weight / (heightInMeters * heightInMeters)).toFixed(1) : '0';
      let bmr = 10 * userProfile.weight + 6.25 * userProfile.height - 5 * userProfile.age;
      bmr += userProfile.gender === 'Homme' ? 5 : -161;

      // Gestion des données (Export/Import)
      const handleExportData = () => {
        const data = {
          workouts,
          availableTypes,
          suggestedExercises,
          dailyGoals,
          userProfile,
          version: '1.0'
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `gymtracker_backup_${new Date().toISOString().split('T')[0]}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      };
      const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => { try { const content = e.target?.result as string; const data = JSON.parse(content); if (data.workouts) setWorkouts(data.workouts); if (data.availableTypes) setAvailableTypes(data.availableTypes); if (data.suggestedExercises) setSuggestedExercises(data.suggestedExercises); if (data.dailyGoals) setDailyGoals(data.dailyGoals); if (data.userProfile) setUserProfile(data.userProfile); alert('Données restaurées avec succès !'); } catch (err) { alert('Erreur lors de la lecture du fichier de sauvegarde.'); } };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = ''; 
      };

      return (
          <div className="space-y-6 pb-28">
              <header className="mb-6 pt-2 flex items-center"><button onClick={() => setActiveTab('home')} className="mr-4 p-2 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white border border-zinc-800"><ChevronLeft size={20} /></button><div><h1 className="text-2xl font-bold text-white">Mon Profil</h1><p className="text-zinc-400 text-sm">Données & Compte</p></div></header>
              <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-xl mb-6"><h3 className="font-bold text-zinc-100 mb-4 text-sm uppercase tracking-wider flex items-center"><Save size={16} className="mr-2 text-emerald-500"/> Gestion des Données</h3><div className="flex gap-3"><button onClick={handleExportData} className="flex-1 bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group"><Download size={20} className="text-blue-500 group-hover:scale-110 transition-transform" /><span className="text-xs font-bold text-zinc-300">Sauvegarder</span></button><button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group"><Upload size={20} className="text-orange-500 group-hover:scale-110 transition-transform" /><span className="text-xs font-bold text-zinc-300">Restaurer</span></button><input type="file" ref={fileInputRef} onChange={handleImportData} accept=".json" className="hidden" /></div><p className="text-[10px] text-zinc-600 mt-3 text-center">Sauvegardez vos données dans un fichier pour les transférer sur un autre appareil.</p></div>
              <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-xl"><h3 className="font-bold text-zinc-100 mb-4 text-sm uppercase tracking-wider flex items-center"><User size={16} className="mr-2 text-purple-500"/> Informations</h3><div className="grid grid-cols-2 gap-4"><div className="col-span-2 flex bg-zinc-950 p-1 rounded-xl border border-zinc-800"><button onClick={() => updateUserProfile({gender: 'Homme'})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${userProfile.gender === 'Homme' ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}>Homme</button><button onClick={() => updateUserProfile({gender: 'Femme'})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${userProfile.gender === 'Femme' ? 'bg-pink-600 text-white' : 'text-zinc-500'}`}>Femme</button></div><div><label className="text-xs text-zinc-500 font-bold mb-2 block">Âge</label><input type="number" value={userProfile.age} onChange={(e) => updateUserProfile({age: parseInt(e.target.value) || 0})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white font-bold" /></div><div><label className="text-xs text-zinc-500 font-bold mb-2 block">Taille (cm)</label><input type="number" value={userProfile.height} onChange={(e) => updateUserProfile({height: parseInt(e.target.value) || 0})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white font-bold" /></div><div className="col-span-2"><label className="text-xs text-zinc-500 font-bold mb-2 block">Poids (kg)</label><input type="number" value={userProfile.weight} onChange={(e) => updateUserProfile({weight: parseFloat(e.target.value) || 0})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white font-bold text-lg" /></div></div></div>
              <div className="grid grid-cols-2 gap-3"><div className="bg-gradient-to-br from-emerald-900/40 to-emerald-900/10 p-4 rounded-2xl border border-emerald-900/50"><div className="flex items-center gap-2 mb-2 text-emerald-500"><Activity size={18} /><span className="text-xs font-bold uppercase">IMC</span></div><p className="text-3xl font-bold text-white">{bmi}</p></div><div className="bg-gradient-to-br from-orange-900/40 to-orange-900/10 p-4 rounded-2xl border border-orange-900/50"><div className="flex items-center gap-2 mb-2 text-orange-500"><Flame size={18} /><span className="text-xs font-bold uppercase">BMR</span></div><p className="text-3xl font-bold text-white">{Math.round(bmr)}</p></div></div>
              <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-xl"><div className="flex justify-between items-center mb-4"><h3 className="font-bold text-zinc-100 text-sm">Évolution Poids</h3><div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">{(['1M', '3M', '1Y'] as const).map(p => (<button key={p} onClick={() => setWeightGraphPeriod(p)} className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${weightGraphPeriod === p ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>{p === '1Y' ? '1A' : p}</button>))}</div></div><div className="h-40 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={getWeightData()}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#71717a'}} /><YAxis domain={['dataMin - 5', 'dataMax + 5']} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#71717a'}} /><Tooltip contentStyle={{borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: '#18181b'}} itemStyle={{color: '#fff'}} /><Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#18181b', strokeWidth: 2, stroke: '#10b981'}} /></LineChart></ResponsiveContainer></div></div>
          </div>
      );
  };

  const renderTypeSelectorModal = () => {
    if (!showTypeSelector) return null;
    return (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-zinc-900 w-full max-w-sm rounded-3xl border border-zinc-800 p-6 shadow-2xl flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">Type de séance</h2>
                    <button onClick={() => setShowTypeSelector(false)} className="text-zinc-500 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-4 overflow-y-auto custom-scrollbar p-1">
                    {availableTypes.map((item) => (
                        <div key={item.type} className="relative group">
                            <button
                                onClick={() => startWorkout(item.type)}
                                className="w-full bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 hover:border-zinc-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-4 transition-all active:scale-95 select-none"
                            >
                                <div className={`${item.color} bg-opacity-20 p-4 rounded-full text-white group-hover:bg-opacity-30 transition-all shadow-lg`}>
                                    {getIconForType(item.type)}
                                </div>
                                <span className="font-bold text-zinc-200 truncate w-full text-center">{item.type}</span>
                            </button>
                            {item.isCustom && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setDeleteState({ type: 'workout_type', name: item.type }); }}
                                    className="absolute top-2 right-2 bg-zinc-900/80 rounded-full p-1 text-zinc-500 hover:text-red-500 border border-zinc-700"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                    {!isCreatingType ? (
                        <button
                            onClick={() => setIsCreatingType(true)}
                            className="bg-zinc-900 border border-dashed border-zinc-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-4 hover:bg-zinc-800 transition-colors"
                        >
                            <div className="bg-zinc-800 p-4 rounded-full text-zinc-500">
                                <Plus size={24} />
                            </div>
                            <span className="font-bold text-zinc-500">Créer</span>
                        </button>
                    ) : (
                        <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-3 flex flex-col justify-center gap-2">
                            <input 
                                autoFocus
                                type="text"
                                value={newTypeName}
                                onChange={(e) => setNewTypeName(e.target.value)}
                                placeholder="Nom..."
                                className="w-full bg-zinc-900 border border-zinc-600 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                onKeyDown={(e) => e.key === 'Enter' && createNewType()}
                            />
                            <div className="flex gap-2">
                                <button onClick={() => setIsCreatingType(false)} className="flex-1 bg-zinc-700 text-zinc-300 rounded-lg py-1 text-xs">Annuler</button>
                                <button onClick={createNewType} className="flex-1 bg-blue-600 text-white rounded-lg py-1 text-xs font-bold">OK</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
  };

  const renderDeleteConfirmationModal = () => {
    if (!deleteState) return null;
    let title = "Supprimer ?";
    let message = "Cette action est irréversible.";
    if (deleteState.type === 'workout') { title = "Supprimer la séance ?"; message = "Données perdues."; }
    else if (deleteState.type === 'exercise_session') { title = "Retirer l'exercice ?"; message = "Retiré de la séance."; }
    else if (deleteState.type === 'exercise_db') { title = "Oublier l'exercice ?"; message = "Ne sera plus suggéré."; }
    else if (deleteState.type === 'cancel_workout') { title = "Annuler la séance ?"; message = "Progression perdue."; }
    else if (deleteState.type === 'goal') { title = "Supprimer ce complément ?"; message = "Retiré de la liste."; }

    return (
        <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
             <div className="bg-zinc-900 w-full max-w-xs rounded-3xl border border-zinc-800 p-6 shadow-2xl text-center">
                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="text-red-500" size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-zinc-400 text-sm mb-6">{message}</p>
                <div className="flex gap-3">
                    <button onClick={() => setDeleteState(null)} className="flex-1 py-3 bg-zinc-800 rounded-xl font-medium text-zinc-300 hover:bg-zinc-700 transition">Annuler</button>
                    <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 rounded-xl font-medium text-white hover:bg-red-700 transition">Confirmer</button>
                </div>
             </div>
        </div>
    );
  };

  const renderTabBar = () => (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-800 grid grid-cols-5 items-end px-2 py-2 pb-6 z-40 shadow-2xl select-none">
      <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center justify-center transition-colors ${activeTab === 'home' ? 'text-blue-500' : 'text-zinc-600 hover:text-zinc-400'}`}><Calendar size={22} /><span className="text-[10px] mt-1 font-medium">Accueil</span></button>
      <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center justify-center transition-colors ${activeTab === 'history' ? 'text-blue-500' : 'text-zinc-600 hover:text-zinc-400'}`}><History size={22} /><span className="text-[10px] mt-1 font-medium">Historique</span></button>
      <div className="relative flex items-center justify-center h-full"><button onClick={handleStartClick} className={`absolute -top-10 flex flex-col items-center justify-center rounded-full p-4 shadow-lg shadow-blue-500/20 transform transition active:scale-95 border-4 border-zinc-950 ${activeWorkout ? 'bg-emerald-500' : 'bg-blue-600 hover:bg-blue-500'}`}>{activeWorkout ? <Activity size={28} color="white" /> : <Plus size={28} color="white" />}</button></div>
      <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center justify-center transition-colors ${activeTab === 'stats' ? 'text-blue-500' : 'text-zinc-600 hover:text-zinc-400'}`}><TrendingUp size={22} /><span className="text-[10px] mt-1 font-medium">Progrès</span></button>
      <button onClick={() => setActiveTab('summary')} className={`flex flex-col items-center justify-center transition-colors ${activeTab === 'summary' ? 'text-blue-500' : 'text-zinc-600 hover:text-zinc-400'}`}><ClipboardList size={22} /><span className="text-[10px] mt-1 font-medium">Bilan</span></button>
    </div>
  );

  return (
    <div className="bg-black min-h-screen font-sans text-zinc-100 selection:bg-blue-500/30 select-none">
      <div className="max-w-md mx-auto min-h-screen bg-zinc-950 shadow-2xl overflow-hidden relative border-x border-zinc-900">
        <style>{`.dark-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; } .dark-scrollbar::-webkit-scrollbar-track { background: transparent; } .dark-scrollbar::-webkit-scrollbar-thumb { background-color: #3f3f46; border-radius: 20px; } .dark-scrollbar { scrollbar-width: thin; scrollbar-color: #3f3f46 transparent; }`}</style>
        {renderTypeSelectorModal()}
        {renderDeleteConfirmationModal()}
        <div className="h-full overflow-y-auto p-5 dark-scrollbar">
            {activeTab === 'home' && renderHomeView()}
            {activeTab === 'history' && renderHistoryView()}
            {activeTab === 'workout' && renderWorkoutView()}
            {activeTab === 'stats' && renderStatsView()}
            {activeTab === 'summary' && renderSummaryView()}
            {activeTab === 'profile' && renderProfileView()}
        </div>
        {renderTabBar()}
      </div>
    </div>
  );
}
