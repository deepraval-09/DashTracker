"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  Activity,
  ArrowDownUp,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CalendarPlus,
  Check,
  CheckCircle2,
  Clock3,
  Command,
  Flame,
  PlusCircle,
  FolderKanban,
  ListChecks,
  TrendingUp,
  LayoutDashboard,
  ListTodo,
  LogOut,
  ShieldCheck,
  UserRound,
  Menu,
  MoreHorizontal,
  Pin,
  PinOff,
  StickyNote,
  Pencil,
  Plus,
  Search,
  Target,
  Trash2,
  Wallet,
  ReceiptText,
  Download,
  X,
  type LucideIcon,
} from "lucide-react";

type Priority = "low" | "medium" | "high";
type TaskCategory = "Personal" | "Study" | "Work" | "Health" | "Other";
type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  priority: Priority;
  dueDate: string;
  category: TaskCategory;
};
type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  notes: string;
  createdAt: string;
};
type Note = {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};
type NoteFields = Pick<Note, "title" | "content">;
const EMPTY_NOTE: NoteFields = { title: "", content: "" };

type TransactionType = "income" | "expense";
type FinanceCategory = "Salary" | "Freelance" | "Gift" | "Other income" | "Food" | "Shopping" | "Bills" | "Travel" | "Health" | "Education" | "Entertainment" | "Other expense";
type Transaction = {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: FinanceCategory;
  date: string;
  notes: string;
  createdAt: string;
};
type TransactionFields = Pick<Transaction, "title" | "amount" | "type" | "category" | "date" | "notes">;
const INCOME_CATEGORIES: FinanceCategory[] = ["Salary", "Freelance", "Gift", "Other income"];
const EXPENSE_CATEGORIES: FinanceCategory[] = ["Food", "Shopping", "Bills", "Travel", "Health", "Education", "Entertainment", "Other expense"];
const EMPTY_TRANSACTION: TransactionFields = { title: "", amount: 0, type: "expense", category: "Food", date: "", notes: "" };

function financeCategories(type: TransactionType): FinanceCategory[] {
  return type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

const moneyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2,
});
function formatINR(value: number): string { return moneyFormatter.format(value); }

type ProjectStatus = "planned" | "active" | "on-hold" | "completed";
type Milestone = { id: string; title: string; done: boolean; createdAt: string };
type Project = {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  milestones: Milestone[];
};
type ProjectFields = Pick<Project, "title" | "description" | "status" | "dueDate">;
const PROJECT_STATUSES: ProjectStatus[] = ["planned", "active", "on-hold", "completed"];
const EMPTY_PROJECT: ProjectFields = { title: "", description: "", status: "planned", dueDate: "" };

function isProjectStatus(value: unknown): value is ProjectStatus {
  return typeof value === "string" && PROJECT_STATUSES.includes(value as ProjectStatus);
}

type EventFields = Pick<CalendarEvent, "title" | "date" | "time" | "notes">;

type Habit = {
  id: string;
  name: string;
  category: TaskCategory;
  createdAt: string;
  checkIns: string[];
};
type Goal = {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  createdAt: string;
};
type HabitFields = Pick<Habit, "name" | "category">;
type GoalFields = Pick<Goal, "title" | "target" | "unit">;
const emptyHabit: HabitFields = { name: "", category: "Personal" };
const emptyGoal: GoalFields = { title: "", target: 10, unit: "times" };

const emptyEventFields: EventFields = { title: "", date: "", time: "", notes: "" };

type Section =
  | "dashboard"
  | "tasks"
  | "calendar"
  | "habits"
  | "projects"
  | "finance"
  | "notes"
  | "settings";
type Filter = "all" | "active" | "done";
type SortMode = "newest" | "oldest" | "due" | "priority";
type TaskFields = Pick<Task, "title" | "priority" | "dueDate" | "category">;

const APP_NAME = "DashTracker";
const APP_TAGLINE = "PERSONAL LIFE OS";
const BrandIcon = Activity;

const PRIORITIES: Priority[] = ["low", "medium", "high"];
const CATEGORIES: TaskCategory[] = ["Personal", "Study", "Work", "Health", "Other"];
const PRIORITY_WEIGHT: Record<Priority, number> = { low: 1, medium: 2, high: 3 };

const navigation: { id: Section; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "tasks", label: "My Tasks", icon: ListTodo },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "habits", label: "Habits", icon: Flame },
  { id: "projects", label: "Projects", icon: Target },
  { id: "finance", label: "Finances", icon: Wallet },
  { id: "notes", label: "Notes", icon: Command },
  { id: "settings", label: "Settings", icon: MoreHorizontal },
];

const cardClass = "rounded-2xl border border-white/10 bg-[#171717]";
const fieldClass =
  "min-h-11 w-full min-w-0 rounded-xl border border-white/15 bg-[#0c0c0c] px-3 text-sm text-neutral-100 outline-none focus:border-neutral-400 focus-visible:ring-2 focus-visible:ring-white/10";

function isPriority(value: unknown): value is Priority {
  return typeof value === "string" && PRIORITIES.includes(value as Priority);
}

function isCategory(value: unknown): value is TaskCategory {
  return typeof value === "string" && CATEGORIES.includes(value as TaskCategory);
}

function isDateInput(value: unknown): value is string {
  if (value === "") return true;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

type CloudTaskRow = {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
  due_date: string | null;
  category: string;
  created_at: string;
};

function mapCloudTask(row: CloudTaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed,
    priority: isPriority(row.priority) ? row.priority : "medium",
    category: isCategory(row.category) ? row.category : "Personal",
    dueDate: row.due_date ?? "",
    createdAt: row.created_at,
  };
}

async function readCloudTasks(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<Task[]> {
  const results: Task[] = [];
  const pageSize = 500;
  for (let start = 0; ; start += pageSize) {
    const { data, error } = await supabase.from("tasks")
      .select("id,title,completed,priority,due_date,category,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(start, start + pageSize - 1);
    if (error) throw error;
    const rows = (data ?? []) as CloudTaskRow[];
    results.push(...rows.map(mapCloudTask));
    if (rows.length < pageSize) break;
  }
  return results;
}

type CloudRow = Record<string, unknown>;

// Supabase defaults to a 1,000-row limit; fetch each page until complete.
async function readCloudRows(
  supabase: ReturnType<typeof createClient>, table: string, userId: string,
  orderColumn = "created_at"
): Promise<CloudRow[]> {
  const all: CloudRow[] = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.from(table).select("*")
      .eq("user_id", userId)
      .order(orderColumn, { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    const rows = (data ?? []) as CloudRow[];
    all.push(...rows);
    if (rows.length < pageSize) return all;
  }
}

function cloudError(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Request failed. Please check your connection and try again.";
}

function cloudString(value: unknown): string {
  return typeof value === "string" ? value : "";
}
function cloudDate(value: unknown): string {
  const text = cloudString(value);
  return isDateInput(text) ? text : "";
}
function cloudNumber(value: unknown): number {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
}

const mapCloudEvent = (row: CloudRow): CalendarEvent => ({
  id: String(row.id), title: cloudString(row.title),
  date: cloudString(row.event_date),
  time: cloudString(row.event_time).slice(0, 5),
  notes: cloudString(row.notes), createdAt: cloudString(row.created_at),
});
const mapCloudHabit = (row: CloudRow): Habit => ({
  id: String(row.id), name: cloudString(row.name),
  category: isCategory(row.category) ? row.category : "Personal",
  checkIns: Array.isArray(row.check_ins) ? row.check_ins.map(cloudString).filter(Boolean) : [],
  createdAt: cloudString(row.created_at),
});
const mapCloudGoal = (row: CloudRow): Goal => ({
  id: String(row.id), title: cloudString(row.title),
  target: cloudNumber(row.target), current: cloudNumber(row.current),
  unit: cloudString(row.unit), createdAt: cloudString(row.created_at),
});
const mapCloudNote = (row: CloudRow): Note => ({
  id: String(row.id), title: cloudString(row.title),
  content: cloudString(row.content), pinned: row.pinned === true,
  createdAt: cloudString(row.created_at), updatedAt: cloudString(row.updated_at),
});
const mapCloudProject = (row: CloudRow): Project => ({
  id: String(row.id), title: cloudString(row.title),
  description: cloudString(row.description),
  status: isProjectStatus(row.status) ? row.status : "planned",
  dueDate: cloudDate(row.due_date),
  milestones: Array.isArray(row.milestones) ? row.milestones.flatMap((entry): Milestone[] => {
    if (!entry || typeof entry !== "object") return [];
    const value = entry as Record<string, unknown>;
    if (typeof value.id !== "string" || typeof value.title !== "string") return [];
    return [{ id: value.id, title: value.title, done: value.done === true,
      createdAt: cloudString(value.createdAt) || cloudString(row.created_at) }];
  }) : [],
  createdAt: cloudString(row.created_at), updatedAt: cloudString(row.updated_at),
});
const mapCloudTransaction = (row: CloudRow): Transaction => ({
  id: String(row.id), title: cloudString(row.title), amount: cloudNumber(row.amount),
  type: row.type === "income" ? "income" : "expense",
  category: cloudString(row.category) as FinanceCategory,
  date: cloudString(row.transaction_date), notes: cloudString(row.notes),
  createdAt: cloudString(row.created_at),
});

function taskErrorText(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to save tasks. Please try again.";
}

function previousDate(key: string, days: number): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  date.setDate(date.getDate() - days);
  return localDateKey(date);
}

function habitStreak(habit: Habit, today: string): number {
  if (!today) return 0;
  const done = new Set(habit.checkIns);
  // A streak remains visible until the end of the current day.
  const start = done.has(today) ? today : previousDate(today, 1);
  let length = 0;
  for (let offset = 0; offset < 3660; offset++) {
    if (!done.has(previousDate(start, offset))) break;
    length++;
  }
  return length;
}

function firstOfMonth(key: string): Date {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1, 12);
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(key: string, offset: number): string {
  const date = firstOfMonth(key);
  date.setMonth(date.getMonth() + offset);
  return monthKey(date);
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(date);
}

function greeting(date: Date): string {
  const hour = date.getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

function readableDueDate(value: string): string {
  // Noon avoids time-zone shifts when formatting a YYYY-MM-DD date.
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

const emptyFields: TaskFields = {
  title: "", priority: "medium", dueDate: "", category: "Personal",
};

// Authentication gate: keep the dashboard unmounted until Supabase has
// verified the current user. Server-side route protection is added separately.
export default function ProtectedHome() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [authStatus, setAuthStatus] = useState<"checking" | "authenticated" | "error">("checking");
  const [authError, setAuthError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let alive = true;

    async function verifyUser() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!alive) return;
        if (error) {
          setAuthError("Could not verify your session. Check your internet connection and retry.");
          setAuthStatus("error");
          return;
        }
        if (!data.user) {
          router.replace("/login");
          return;
        }
        setUser(data.user);
        setAuthStatus("authenticated");
      } catch {
        if (alive) {
          setAuthError("Could not contact Supabase. Please check your connection and retry.");
          setAuthStatus("error");
        }
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && alive) {
        setUser(null);
        setAuthStatus("checking");
        router.replace("/login");
      }
      if (event === "SIGNED_IN" && alive) {
        // Run validation outside the synchronous auth callback.
        window.setTimeout(() => { if (alive) void verifyUser(); }, 0);
      }
    });
    void verifyUser();
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, [router, supabase]);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    setAuthError("");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Preserve all existing browser data for future migration.
      setUser(null);
      setAuthStatus("checking");
      // A full navigation also clears the previous dashboard component tree.
      window.location.replace("/login");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Sign out failed. Please retry.");
      setSigningOut(false);
    }
  }

  if (authStatus !== "authenticated" || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090909] px-4 text-neutral-100">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#171717] p-8 text-center">
          <ShieldCheck size={34} className="mx-auto mb-4 text-neutral-200" aria-hidden="true" />
          <h1 className="text-xl font-semibold">DashTracker</h1>
          {authStatus === "error" ? (
            <>
              <p role="alert" className="mt-3 text-sm text-neutral-300">{authError}</p>
              <button type="button" onClick={() => window.location.reload()}
                className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black">Retry</button>
            </>
          ) : (
            <p role="status" className="mt-3 text-sm text-neutral-400">Checking your account...</p>
          )}
        </div>
      </main>
    );
  }

  return (
    <Home
      key={user.id}
      accountEmail={user.email || "Signed in"}
      accountUserId={user.id}
      onSignOut={signOut}
      signingOut={signingOut}
      authError={authError}
    />
  );
}

type HomeProps = {
  accountEmail: string;
  accountUserId: string;
  onSignOut: () => Promise<void>;
  signingOut: boolean;
  authError: string;
};

function Home({ accountEmail, accountUserId, onSignOut, signingOut, authError }: HomeProps) {
  const supabase = useMemo(() => createClient(), []);
  const taskBusyRef = useRef(false);
  const [taskBusy, setTaskBusy] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [newTask, setNewTask] = useState<TaskFields>(emptyFields);
  const taskInputRef = useRef<HTMLInputElement>(null);
  const [taskMessage, setTaskMessage] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [categoryFilter, setCategoryFilter] = useState<"all" | TaskCategory>("all");
  const [section, setSection] = useState<Section>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingFields, setEditingFields] = useState<TaskFields>(emptyFields);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [viewMonth, setViewMonth] = useState("");
  const [eventFields, setEventFields] = useState<EventFields>(emptyEventFields);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventMessage, setEventMessage] = useState("");
  const [eventBusy, setEventBusy] = useState(false);
  const eventBusyRef = useRef(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habitsLoaded, setHabitsLoaded] = useState(false);
  const [habitFields, setHabitFields] = useState<HabitFields>(emptyHabit);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [goalFields, setGoalFields] = useState<GoalFields>(emptyGoal);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [habitMessage, setHabitMessage] = useState("");
  const [habitBusy, setHabitBusy] = useState(false);
  const habitBusyRef = useRef(false);

  useEffect(() => {
    const update = () => setCurrentDate(new Date());
    const start = window.setTimeout(() => {
      const now = new Date();
      setCurrentDate(now);
      setSelectedDate(localDateKey(now));
      setViewMonth(monthKey(now));
    }, 0);
    const interval = window.setInterval(update, 60_000);
    return () => { window.clearTimeout(start); window.clearInterval(interval); };
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [eventRows, habitRows, goalRows] = await Promise.all([
          readCloudRows(supabase, "calendar_events", accountUserId),
          readCloudRows(supabase, "habits", accountUserId),
          readCloudRows(supabase, "goals", accountUserId),
        ]);
        if (!active) return;
        setEvents(eventRows.map(mapCloudEvent));
        setHabits(habitRows.map(mapCloudHabit));
        setGoals(goalRows.map(mapCloudGoal));
        setEventsLoaded(true);
        setHabitsLoaded(true);
      } catch (error) {
        if (active) {
          setEventMessage(`Unable to load cloud data: ${cloudError(error)}. Refresh to retry.`);
          setHabitMessage(`Unable to load cloud data: ${cloudError(error)}. Refresh to retry.`);
        }
      }
    })();
    return () => { active = false; };
  }, [supabase, accountUserId]);

  async function runEventMutation(action: () => Promise<void>) {
    if (!eventsLoaded || eventBusyRef.current) return false;
    eventBusyRef.current = true;
    setEventBusy(true);
    try { await action(); return true; }
    catch (error) { setEventMessage(`Cloud save failed: ${cloudError(error)}`); return false; }
    finally { eventBusyRef.current = false; setEventBusy(false); }
  }

  async function runHabitMutation(action: () => Promise<void>) {
    if (!habitsLoaded || habitBusyRef.current) return false;
    habitBusyRef.current = true;
    setHabitBusy(true);
    try { await action(); return true; }
    catch (error) { setHabitMessage(`Cloud save failed: ${cloudError(error)}`); return false; }
    finally { habitBusyRef.current = false; setHabitBusy(false); }
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const cloudTasks = await readCloudTasks(supabase, accountUserId);
        if (!active) return;
        setTasks(cloudTasks);
        setLoaded(true);
      } catch (error) {
        if (active) setTaskMessage(`Could not load cloud tasks: ${taskErrorText(error)}. Retry by refreshing the page.`);
      }
    })();
    return () => { active = false; };
  }, [supabase, accountUserId]);

  async function runTaskMutation(operation: () => Promise<void>): Promise<boolean> {
    if (taskBusyRef.current || !loaded) return false;
    taskBusyRef.current = true;
    setTaskBusy(true);
    setTaskMessage("");
    try {
      await operation();
      return true;
    } catch (error) {
      setTaskMessage(`Cloud save failed: ${taskErrorText(error)}. No change was applied locally.`);
      return false;
    } finally {
      taskBusyRef.current = false;
      setTaskBusy(false);
    }
  }

  async function saveHabit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!habitsLoaded) return;
    const name = habitFields.name.trim();
    if (!name) { setHabitMessage("Enter a habit name."); return; }
    const current = habits.find(item => item.id === editingHabitId);
    if (editingHabitId && !current) return;
    const habit: Habit = current ? { ...current, name, category: habitFields.category } : {
      id: crypto.randomUUID(), name, category: habitFields.category,
      createdAt: new Date().toISOString(), checkIns: []
    };
    const saved = await runHabitMutation(async () => {
      if (current) {
        const { data, error } = await supabase.from("habits")
          .update({ name: habit.name, category: habit.category })
          .eq("id", habit.id).eq("user_id", accountUserId).select("id").single();
        if (error || !data) throw error ?? new Error("Habit not found.");
        setHabits(items => items.map(item => item.id === habit.id ? habit : item));
      } else {
        const { error } = await supabase.from("habits").insert({
          id: habit.id, user_id: accountUserId, name: habit.name,
          category: habit.category, check_ins: [], created_at: habit.createdAt
        });
        if (error) throw error;
        setHabits(items => [habit, ...items]);
      }
    });
    if (!saved) return;
    setHabitMessage(current ? "Habit updated in cloud." : "Habit created in cloud.");
    setEditingHabitId(null);
    setHabitFields(emptyHabit);
  }

  async function toggleHabit(id: string, date: string) {
    if (!habitsLoaded || !date) return;
    const habit = habits.find(item => item.id === id);
    if (!habit) return;
    const days = new Set(habit.checkIns);
    if (days.has(date)) days.delete(date); else days.add(date);
    const checkIns = [...days].sort();
    await runHabitMutation(async () => {
      const { data, error } = await supabase.from("habits")
        .update({ check_ins: checkIns }).eq("id", id)
        .eq("user_id", accountUserId).select("id").single();
      if (error || !data) throw error ?? new Error("Habit not found.");
      setHabits(items => items.map(item => item.id === id ? { ...item, checkIns } : item));
    });
  }

  async function deleteHabit(id: string) {
    const saved = await runHabitMutation(async () => {
      const { data, error } = await supabase.from("habits").delete()
        .eq("id", id).eq("user_id", accountUserId).select("id").single();
      if (error || !data) throw error ?? new Error("Habit not found.");
      setHabits(items => items.filter(item => item.id !== id));
    });
    if (saved) {
      if (editingHabitId === id) { setEditingHabitId(null); setHabitFields(emptyHabit); }
      setHabitMessage("Habit deleted from cloud.");
    }
  }

  async function saveGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!habitsLoaded) return;
    const title = goalFields.title.trim();
    const unit = goalFields.unit.trim() || "times";
    if (!title || !Number.isFinite(goalFields.target) || goalFields.target <= 0) {
      setHabitMessage("Enter a goal name and a positive target."); return;
    }
    const current = goals.find(item => item.id === editingGoalId);
    if (editingGoalId && !current) return;
    const goal: Goal = current ? { ...current, title, unit, target: goalFields.target } : {
      id: crypto.randomUUID(), title, unit, target: goalFields.target,
      current: 0, createdAt: new Date().toISOString()
    };
    const saved = await runHabitMutation(async () => {
      if (current) {
        const { data, error } = await supabase.from("goals").update({
          title: goal.title, unit: goal.unit, target: goal.target
        }).eq("id", goal.id).eq("user_id", accountUserId).select("id").single();
        if (error || !data) throw error ?? new Error("Goal not found.");
        setGoals(items => items.map(item => item.id === goal.id ? goal : item));
      } else {
        const { error } = await supabase.from("goals").insert({
          id: goal.id, user_id: accountUserId, title: goal.title,
          unit: goal.unit, target: goal.target, current: 0, created_at: goal.createdAt
        });
        if (error) throw error;
        setGoals(items => [goal, ...items]);
      }
    });
    if (!saved) return;
    setHabitMessage(current ? "Goal updated in cloud." : "Goal created in cloud.");
    setGoalFields(emptyGoal);
    setEditingGoalId(null);
  }

  async function changeGoalProgress(id: string, difference: number) {
    const goal = goals.find(item => item.id === id);
    if (!goal) return;
    const current = Math.max(0, Math.min(goal.target, goal.current + difference));
    await runHabitMutation(async () => {
      const { data, error } = await supabase.from("goals")
        .update({ current }).eq("id", id).eq("user_id", accountUserId)
        .select("id").single();
      if (error || !data) throw error ?? new Error("Goal not found.");
      setGoals(items => items.map(item => item.id === id ? { ...item, current } : item));
    });
  }

  async function deleteGoal(id: string) {
    const saved = await runHabitMutation(async () => {
      const { data, error } = await supabase.from("goals").delete()
        .eq("id", id).eq("user_id", accountUserId).select("id").single();
      if (error || !data) throw error ?? new Error("Goal not found.");
      setGoals(items => items.filter(item => item.id !== id));
    });
    if (saved) {
      if (editingGoalId === id) { setEditingGoalId(null); setGoalFields(emptyGoal); }
      setHabitMessage("Goal deleted from cloud.");
    }
  }

  function selectCalendarDate(date: string) {
    setSelectedDate(date);
    setViewMonth(date.slice(0, 7));
    setEventFields(emptyEventFields);
    setEditingEventId(null);
    setEventMessage("");
  }

  async function saveCalendarEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!eventsLoaded) { setEventMessage("Calendar is loading."); return; }
    const title = eventFields.title.trim();
    const date = eventFields.date || selectedDate;
    if (!title || !date || !isDateInput(date)) {
      setEventMessage("Enter a title and valid date."); return;
    }
    if (eventFields.time && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(eventFields.time)) {
      setEventMessage("Choose a valid time."); return;
    }
    const current = events.find(item => item.id === editingEventId);
    if (editingEventId && !current) return;
    const next: CalendarEvent = {
      id: current?.id ?? crypto.randomUUID(), title, date,
      time: eventFields.time, notes: eventFields.notes.trim(),
      createdAt: current?.createdAt ?? new Date().toISOString()
    };
    const saved = await runEventMutation(async () => {
      if (current) {
        const { data, error } = await supabase.from("calendar_events").update({
          title: next.title, event_date: next.date, event_time: next.time || null,
          notes: next.notes
        }).eq("id", next.id).eq("user_id", accountUserId).select("id").single();
        if (error || !data) throw error ?? new Error("Event not found.");
        setEvents(items => items.map(item => item.id === next.id ? next : item));
      } else {
        const { error } = await supabase.from("calendar_events").insert({
          id: next.id, user_id: accountUserId, title: next.title,
          event_date: next.date, event_time: next.time || null, notes: next.notes,
          created_at: next.createdAt
        });
        if (error) throw error;
        setEvents(items => [next, ...items]);
      }
    });
    if (!saved) return;
    setEventMessage(current ? "Event updated in cloud." : "Event saved in cloud.");
    setSelectedDate(date);
    setViewMonth(date.slice(0, 7));
    setEditingEventId(null);
    setEventFields(emptyEventFields);
  }

  function editCalendarEvent(item: CalendarEvent) {
    setEditingEventId(item.id);
    setEventFields({ title: item.title, date: item.date, time: item.time, notes: item.notes });
    setEventMessage("");
  }

  function cancelCalendarEdit() {
    setEditingEventId(null);
    setEventFields(emptyEventFields);
    setEventMessage("");
  }

  async function deleteCalendarEvent(id: string) {
    const saved = await runEventMutation(async () => {
      const { data, error } = await supabase.from("calendar_events").delete()
        .eq("id", id).eq("user_id", accountUserId).select("id").single();
      if (error || !data) throw error ?? new Error("Event not found.");
      setEvents(items => items.filter(item => item.id !== id));
    });
    if (!saved) return;
    if (editingEventId === id) cancelCalendarEdit();
    setEventMessage("Event deleted from cloud.");
  }

  const today = currentDate ? localDateKey(currentDate) : "";
  const completedCount = tasks.filter((task) => task.completed).length;
  const pendingCount = tasks.length - completedCount;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  const dueTodayCount = today
    ? tasks.filter((task) => !task.completed && task.dueDate === today).length : 0;
  const overdueCount = today
    ? tasks.filter((task) => !task.completed && task.dueDate && task.dueDate < today).length : 0;

  const visibleTasks = useMemo(() => {
    const result = tasks.filter((task) => {
      const statusOk = filter === "all" || (filter === "done" ? task.completed : !task.completed);
      const categoryOk = categoryFilter === "all" || categoryFilter === task.category;
      return statusOk && categoryOk && task.title.toLowerCase().includes(search.trim().toLowerCase());
    });
    result.sort((a, b) => {
      if (sortMode === "priority") {
        return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority] || b.createdAt.localeCompare(a.createdAt);
      }
      if (sortMode === "due") {
        return (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31") ||
          b.createdAt.localeCompare(a.createdAt);
      }
      return sortMode === "oldest"
        ? a.createdAt.localeCompare(b.createdAt)
        : b.createdAt.localeCompare(a.createdAt);
    });
    return result;
  }, [tasks, filter, categoryFilter, sortMode, search]);

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loaded) { setTaskMessage("Cloud tasks are loading. Please try again."); return; }
    const title = newTask.title.trim();
    if (!title) {
      setTaskMessage("Enter a task title first.");
      taskInputRef.current?.focus();
      return;
    }
    if (!isDateInput(newTask.dueDate)) {
      setTaskMessage("Please choose a valid due date.");
      return;
    }
    const task: Task = {
      ...newTask, title, id: crypto.randomUUID(), completed: false,
      createdAt: new Date().toISOString(),
    };
    const saved = await runTaskMutation(async () => {
      const { error } = await supabase.from("tasks").insert({
        id: task.id, user_id: accountUserId, title: task.title,
        completed: task.completed, priority: task.priority,
        due_date: task.dueDate || null, category: task.category,
        created_at: task.createdAt,
      });
      if (error) throw error;
      setTasks((previous) => [task, ...previous]);
    });
    if (!saved) return;
    setNewTask(emptyFields);
    setFilter("all");
    setCategoryFilter("all");
    setSearch("");
    setSortMode("newest");
    setTaskMessage("Task saved to Supabase.");
    taskInputRef.current?.focus();
  }

  async function toggleTask(id: string) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    await runTaskMutation(async () => {
      const { data, error } = await supabase.from("tasks")
        .update({ completed: !task.completed })
        .eq("id", id).eq("user_id", accountUserId)
        .select("id").single();
      if (error || !data) throw error ?? new Error("Task not found in your cloud account.");
      setTasks((previous) => previous.map((item) => item.id === id
        ? { ...item, completed: !task.completed } : item));
    });
  }

  async function deleteTask(id: string) {
    const saved = await runTaskMutation(async () => {
      const { data, error } = await supabase.from("tasks")
        .delete().eq("id", id).eq("user_id", accountUserId)
        .select("id").single();
      if (error || !data) throw error ?? new Error("Task not found in your cloud account.");
      setTasks((previous) => previous.filter((task) => task.id !== id));
    });
    if (!saved) return;
    if (editingId === id) cancelEdit();
    setTaskMessage("Task deleted from Supabase.");
  }

  function beginEdit(task: Task) {
    setEditingId(task.id);
    setEditingFields({ title: task.title, priority: task.priority, dueDate: task.dueDate, category: task.category });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingFields(emptyFields);
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = editingFields.title.trim();
    if (!editingId || !title || !isDateInput(editingFields.dueDate)) return;
    const id = editingId;
    const saved = await runTaskMutation(async () => {
      const { data, error } = await supabase.from("tasks").update({
        title,
        priority: editingFields.priority,
        due_date: editingFields.dueDate || null,
        category: editingFields.category,
      }).eq("id", id).eq("user_id", accountUserId).select("id").single();
      if (error || !data) throw error ?? new Error("Task not found in your cloud account.");
      setTasks((previous) => previous.map((task) => task.id === id
        ? { ...task, ...editingFields, title } : task));
    });
    if (!saved) return;
    cancelEdit();
    setTaskMessage("Task updated in Supabase.");
  }

  function navigate(nextSection: Section) {
    setSection(nextSection);
    setMobileMenuOpen(false);
    setTaskMessage("");
    setSearch("");
    setFilter("all");
    setCategoryFilter("all");
  }

  const activeSection = navigation.find((item) => item.id === section);
  const showingTasks = section === "dashboard" || section === "tasks";

  return (
    <div className="min-h-screen bg-[#090909] font-sans text-neutral-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col overflow-y-auto overscroll-contain border-r border-white/10 bg-[#101010] lg:flex">
        <div className="flex h-20 items-center gap-3 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-950">
            <BrandIcon size={23} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">{APP_NAME}</h1>
            <p className="text-[11px] tracking-wider text-neutral-500">{APP_TAGLINE}</p>
          </div>
        </div>
        <div className="px-4 pt-5">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Workspace</p>
          <nav aria-label="Desktop navigation" className="space-y-1">
            {navigation.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => navigate(id)}
                aria-current={section === id ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
                  section === id ? "bg-white/10 font-semibold text-white" : "text-neutral-400 hover:bg-white/5 hover:text-white"
                }`}>
                <Icon size={18} />{label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Target size={16} />Your workspace</div>
            <p className="text-xs leading-5 text-neutral-400">Track your day, stay organized, and build better habits.</p>
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-neutral-200">
              <UserRound size={15} aria-hidden="true" /> Signed in as
            </div>
            <p className="break-all text-xs text-neutral-400">{accountEmail}</p>
          </div>
          <button type="button" onClick={() => void onSignOut()} disabled={signingOut}
            className="mt-3 flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm text-neutral-200 hover:bg-white/10 disabled:opacity-50">
            <LogOut size={17} aria-hidden="true" /> {signingOut ? "Signing out..." : "Sign out"}
          </button>
          {authError && <p role="alert" className="mt-3 break-words text-xs text-red-300">{authError}</p>}
          <p className="mt-5 px-3 text-xs text-neutral-500">DashTracker v1.2 · Cloud</p>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain lg:hidden">
          <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-black/70"
            onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex min-h-full w-[min(82vw,300px)] flex-col border-r border-white/10 bg-[#171717] p-5 shadow-2xl">
            <div className="mb-5 flex shrink-0 items-center justify-between">
              <span className="font-bold">{APP_NAME}</span>
              <button type="button" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)}><X size={21} /></button>
            </div>
            <nav aria-label="Mobile menu" className="space-y-2 pb-3">
              {navigation.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" onClick={() => navigate(id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm ${
                    section === id ? "bg-white/10 text-white" : "text-neutral-300 hover:bg-white/5"
                  }`}>
                  <Icon size={18} />{label}
                </button>
              ))}
            </nav>
            <div className="mt-auto shrink-0 border-t border-white/10 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
              <p className="mb-3 break-all text-xs text-neutral-400">{accountEmail}</p>
              <button type="button" aria-label="Sign out from mobile menu"
                onClick={() => { setMobileMenuOpen(false); void onSignOut(); }}
                disabled={signingOut}
                className="relative z-10 flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium text-white hover:bg-white/15 active:bg-white/20 disabled:opacity-50">
                <LogOut size={17} aria-hidden="true" />{signingOut ? "Signing out..." : "Sign out"}
              </button>
              {authError && <p role="alert" className="mt-3 break-words text-xs text-red-300">{authError}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-[#090909]/95 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Open navigation" onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-neutral-300 hover:bg-white/10 lg:hidden"><Menu size={22} /></button>
            <div className="flex items-center gap-2 text-sm">
              <span className="hidden text-neutral-500 sm:inline">Workspace /</span>
              <span className="font-medium">{activeSection?.label ?? "Overview"}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
              <span className="hidden text-xs text-neutral-500 md:inline">
                {currentDate ? dateLabel(currentDate) : ""}
              </span>
              <span className="hidden max-w-48 truncate text-xs text-neutral-400 xl:inline" title={accountEmail}>
                {accountEmail}
              </span>
              <button type="button" onClick={() => void onSignOut()} disabled={signingOut}
                aria-label="Sign out of DashTracker" title="Sign out"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-neutral-200 hover:bg-white/20 disabled:opacity-50">
                <LogOut size={16} aria-hidden="true" />
              </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 pb-28 pt-8 sm:px-8 lg:pb-12">
          {authError && <p role="alert" className="mb-5 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-neutral-200">{authError}</p>}
          {section === "dashboard" ? (
            <>
              <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-neutral-300">
                    {currentDate ? dateLabel(currentDate) : ""}
                  </p>
                  <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    {currentDate ? greeting(currentDate) : "Welcome"} 👋
                  </h2>
                  <p className="mt-3 text-sm text-neutral-400">Your personal space to focus, plan, and make progress.</p>
                </div>
                <button type="button" onClick={() => navigate("tasks")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-100 px-5 py-3 text-sm font-semibold text-neutral-950 hover:bg-white">
                  <Plus size={18} /> Manage tasks
                </button>
              </div>

              <div className="mb-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
                <StatCard title="Total Tasks" value={loaded ? String(tasks.length) : "—"}
                  description="In your workspace" icon={ListTodo} />
                <StatCard title="Completed" value={loaded ? String(completedCount) : "—"}
                  description="All-time completed" icon={CheckCircle2} />
                <StatCard title="Due Today" value={loaded && today ? String(dueTodayCount) : "—"}
                  description="Unfinished, due today" icon={CalendarDays} />
                <StatCard title="Overdue" value={loaded && today ? String(overdueCount) : "—"}
                  description="Unfinished past deadlines" icon={Clock3} />
              </div>

              <div className="mb-7 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
                <div className={`${cardClass} p-5 sm:p-6`}>
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Task progress</h3>
                      <p className="mt-1 text-xs text-neutral-500">Completion across all your tasks</p>
                    </div>
                    <span className="text-2xl font-bold text-neutral-100">{loaded ? progress : "—"}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-neutral-400 to-white transition-all duration-500"
                      style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-4 flex justify-between text-xs text-neutral-500">
                    <span>{completedCount} completed</span><span>{pendingCount} remaining</span>
                  </div>
                </div>
                <div className="flex flex-col justify-between rounded-2xl border border-white/15 bg-gradient-to-br from-[#272727] via-[#171717] to-[#171717] p-5 sm:p-6">
                  <div className="flex items-center gap-2 text-neutral-200"><Target size={18} /><h3 className="font-semibold">Stay consistent</h3></div>
                  <p className="my-4 text-sm leading-6 text-neutral-300">
                    Set a deadline for important work, then use the due-date sort to plan what comes next.
                  </p>
                  <button type="button" onClick={() => navigate("tasks")}
                    className="flex items-center gap-2 text-sm font-semibold text-neutral-100 hover:text-white">
                    View your tasks <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="mb-8">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-neutral-300">DASHTRACKER WORKSPACE</p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{activeSection?.label}</h2>
              <p className="mt-3 text-sm text-neutral-400">
                {section === "tasks" ? "Organize everything you want to get done." : section === "calendar" ? "Plan events and track scheduled tasks." : section === "habits" ? "Create routines, record daily check-ins, and measure your goals." : section === "notes" ? "Capture ideas, keep important details, and find them quickly." : section === "projects" ? "Organize projects, milestones, and deadlines in one workspace." : section === "finance" ? "Record income and expenses, understand spending, and plan your budget." : "This module will be built in an upcoming milestone."}
              </p>
            </div>
          )}

          {showingTasks ? (
            <section className={`${cardClass} overflow-hidden`}>
              <div className="border-b border-white/10 p-5 sm:p-6">
                <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-lg font-semibold">{section === "dashboard" ? "Your tasks" : "Task manager"}</h3>
                    <p className="mt-1 text-xs text-neutral-500">{pendingCount} pending · {completedCount} completed</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-neutral-400">
                    <CheckCircle2 size={15} /> {taskBusy ? "Saving to cloud..." : "Saved in Supabase"}
                  </div>
                </div>

                <form onSubmit={addTask} className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input ref={taskInputRef} type="text" value={newTask.title}
                      onChange={(event) => { setNewTask((v) => ({ ...v, title: event.target.value })); setTaskMessage(""); }}
                      placeholder="What do you need to do?" maxLength={200} aria-label="New task title"
                      aria-describedby="task-form-message" className={`${fieldClass} flex-1`} />
                    <button type="submit" disabled={!loaded || taskBusy}
                      className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-neutral-100 px-5 text-sm font-semibold text-neutral-950 transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                      <Plus size={18} />Add Task
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="block text-xs text-neutral-400">Priority
                      <select value={newTask.priority} aria-label="Task priority"
                        onChange={(event) => setNewTask((v) => ({ ...v, priority: event.target.value as Priority }))}
                        className={`${fieldClass} mt-1`}>
                        {PRIORITIES.map((priority) => <option key={priority} value={priority}>{capitalize(priority)}</option>)}
                      </select>
                    </label>
                    <label className="block text-xs text-neutral-400">Due date (optional)
                      <input type="date" value={newTask.dueDate}
                        onChange={(event) => setNewTask((v) => ({ ...v, dueDate: event.target.value }))}
                        className={`${fieldClass} mt-1 scheme-dark`} />
                    </label>
                    <label className="block text-xs text-neutral-400">Category
                      <select value={newTask.category}
                        onChange={(event) => setNewTask((v) => ({ ...v, category: event.target.value as TaskCategory }))}
                        className={`${fieldClass} mt-1`}>
                        {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                      </select>
                    </label>
                  </div>
                </form>
                <p id="task-form-message" role="status" aria-live="polite" className="mt-3 min-h-5 text-xs text-neutral-400">
                  {taskMessage || "Choose a priority and category, optionally set a deadline, then add your task."}
                </p>
              </div>

              <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-1">
                    {(["all", "active", "done"] as const).map((value) => (
                      <button key={value} type="button" onClick={() => setFilter(value)}
                        aria-pressed={filter === value}
                        className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition ${
                          filter === value ? "bg-neutral-100 text-neutral-950" : "text-neutral-400 hover:bg-white/10"
                        }`}>
                        {value === "done" ? "Completed" : value}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks..."
                      aria-label="Search tasks" className={`${fieldClass} pl-9 sm:w-56`} />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="flex items-center gap-2 text-xs text-neutral-400">
                    <ArrowDownUp size={15} /> Sort
                    <select aria-label="Sort tasks" value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}
                      className={`${fieldClass} flex-1`}>
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                      <option value="due">Due date (soonest)</option>
                      <option value="priority">Priority (highest)</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-neutral-400">Category
                    <select aria-label="Filter by category" value={categoryFilter}
                      onChange={(event) => setCategoryFilter(event.target.value as "all" | TaskCategory)}
                      className={`${fieldClass} flex-1`}>
                      <option value="all">All categories</option>
                      {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                  </label>
                </div>
              </div>

              <div className="divide-y divide-white/5">
                {!loaded ? (
                  <p className="p-10 text-center text-sm text-neutral-500">Loading your saved tasks...</p>
                ) : visibleTasks.length === 0 ? (
                  <div className="flex flex-col items-center px-5 py-14 text-center">
                    <div className="mb-4 rounded-2xl bg-white/5 p-4 text-neutral-500"><ListTodo size={30} /></div>
                    <h4 className="font-semibold">{tasks.length ? "No matching tasks" : "Your task list is empty"}</h4>
                    <p className="mt-2 max-w-sm text-sm text-neutral-500">
                      {tasks.length ? "Try changing the search, status, or category filter." : "Add your first task above and start making progress."}
                    </p>
                  </div>
                ) : visibleTasks.map((task) => {
                  const isOverdue = Boolean(today && task.dueDate && task.dueDate < today && !task.completed);
                  const isDueToday = Boolean(today && task.dueDate === today && !task.completed);
                  return (
                    <div key={task.id} className="flex items-start gap-3 p-4 transition hover:bg-white/[0.025] sm:px-6">
                      <button type="button" disabled={!loaded || taskBusy} aria-label={task.completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
                        onClick={() => void toggleTask(task.id)}
                        className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
                          task.completed ? "border-white/40 bg-neutral-100 text-neutral-950" : "border-neutral-600 text-transparent hover:border-white"
                        }`}><Check size={14} /></button>
                      <div className="min-w-0 flex-1">
                        {editingId === task.id ? (
                          <form onSubmit={saveEdit} className="space-y-3">
                            <input autoFocus aria-label="Edit task title" value={editingFields.title} maxLength={200}
                              onChange={(event) => setEditingFields((v) => ({ ...v, title: event.target.value }))}
                              onKeyDown={(event) => { if (event.key === "Escape") cancelEdit(); }}
                              className={fieldClass} />
                            <div className="grid gap-2 sm:grid-cols-3">
                              <label className="text-xs text-neutral-400">Priority
                                <select value={editingFields.priority} onChange={(event) => setEditingFields((v) => ({ ...v, priority: event.target.value as Priority }))}
                                  className={`${fieldClass} mt-1`}>
                                  {PRIORITIES.map((priority) => <option key={priority} value={priority}>{capitalize(priority)}</option>)}
                                </select>
                              </label>
                              <label className="text-xs text-neutral-400">Due date
                                <input type="date" value={editingFields.dueDate} onChange={(event) => setEditingFields((v) => ({ ...v, dueDate: event.target.value }))}
                                  className={`${fieldClass} mt-1 scheme-dark`} />
                              </label>
                              <label className="text-xs text-neutral-400">Category
                                <select value={editingFields.category} onChange={(event) => setEditingFields((v) => ({ ...v, category: event.target.value as TaskCategory }))}
                                  className={`${fieldClass} mt-1`}>
                                  {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                                </select>
                              </label>
                            </div>
                            <div className="flex gap-2">
                              <button type="submit" disabled={taskBusy || !editingFields.title.trim()}
                                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black disabled:opacity-40">
                                <Check size={15} />Save
                              </button>
                              <button type="button" onClick={cancelEdit} className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs text-neutral-200">
                                <X size={15} />Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <p className={`break-words text-sm ${task.completed ? "text-neutral-500 line-through" : "text-neutral-100"}`}>
                              {task.title}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-neutral-400">
                              <span className="rounded-md border border-white/15 bg-white/5 px-2 py-1">{capitalize(task.priority)} priority</span>
                              <span className="rounded-md border border-white/15 bg-white/5 px-2 py-1">{task.category}</span>
                              {task.dueDate && (
                                <span className={`rounded-md border px-2 py-1 ${isOverdue ? "border-white/40 bg-white/15 font-semibold text-white" : "border-white/15 bg-white/5"}`}>
                                  <CalendarDays size={12} className="mr-1 inline" />
                                  {isOverdue ? "Overdue · " : isDueToday ? "Today · " : "Due · "}{readableDueDate(task.dueDate)}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                        <p className="mt-2 text-[11px] text-neutral-600">Added {formatCreatedAt(task.createdAt)}</p>
                      </div>
                      {editingId !== task.id && (
                        <div className="flex shrink-0 items-center">
                          <button type="button" onClick={() => beginEdit(task)} aria-label={`Edit ${task.title}`} title="Edit task"
                            className="rounded-lg p-2 text-neutral-500 transition hover:bg-white/10 hover:text-white"><Pencil size={16} /></button>
                          <button type="button" disabled={taskBusy} onClick={() => void deleteTask(task.id)} aria-label={`Delete ${task.title}`} title="Delete task"
                            className="rounded-lg p-2 text-neutral-500 transition hover:bg-white/10 hover:text-white"><Trash2 size={17} /></button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : section === "calendar" ? (
            <CalendarPanel
              tasks={tasks}
              events={events}
              loaded={loaded && eventsLoaded}
              selectedDate={selectedDate}
              viewMonth={viewMonth}
              today={today}
              eventFields={eventFields}
              editingEventId={editingEventId}
              eventMessage={eventMessage}
              eventBusy={eventBusy}
              onSelectDate={selectCalendarDate}
              onViewMonth={setViewMonth}
              onJumpToday={() => { if (today) selectCalendarDate(today); }}
              onEventFields={setEventFields}
              onSaveEvent={saveCalendarEvent}
              onEditEvent={editCalendarEvent}
              onDeleteEvent={deleteCalendarEvent}
              onCancelEventEdit={cancelCalendarEdit}
              onToggleTask={toggleTask}
              onGoToTasks={() => navigate("tasks")}
            />
          ) : section === "habits" ? (
            <HabitsPanel
              habits={habits} goals={goals} loaded={habitsLoaded} today={today}
              habitFields={habitFields} onHabitFields={setHabitFields}
              editingHabitId={editingHabitId} onEditHabit={(habit) => {
                setEditingHabitId(habit.id);
                setHabitFields({ name: habit.name, category: habit.category });
              }}
              onCancelHabit={() => { setEditingHabitId(null); setHabitFields(emptyHabit); }}
              onSaveHabit={saveHabit} onToggleHabit={toggleHabit}
               onDeleteHabit={(id) => { void deleteHabit(id); }}
              goalFields={goalFields} onGoalFields={setGoalFields}
              editingGoalId={editingGoalId} onEditGoal={(goal) => {
                setEditingGoalId(goal.id);
                setGoalFields({ title: goal.title, target: goal.target, unit: goal.unit });
              }}
              onCancelGoal={() => { setEditingGoalId(null); setGoalFields(emptyGoal); }}
              onSaveGoal={saveGoal} onChangeGoal={changeGoalProgress}
               onDeleteGoal={(id) => { void deleteGoal(id); }}
              message={habitMessage} busy={habitBusy}
            />
          ) : section === "notes" ? (
            <NotesPanel userId={accountUserId} />
          ) : section === "projects" ? (
            <ProjectsPanel today={today} userId={accountUserId} />
          ) : section === "finance" ? (
            <FinancePanel today={today} userId={accountUserId} />
          ) : (
            <div className={`${cardClass} p-10 text-center`}>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-neutral-100">
                {activeSection && <activeSection.icon size={26} />}
              </div>
              <h3 className="text-lg font-semibold">{activeSection?.label} is coming soon</h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-400">
                We&apos;re building DashTracker one working feature at a time. Your task manager is ready to use now.
              </p>
              <button type="button" onClick={() => navigate("dashboard")}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-neutral-100 px-5 py-3 text-sm font-semibold text-neutral-950 hover:bg-white">
                Back to dashboard <ArrowRight size={16} />
              </button>
            </div>
          )}
        </main>
      </div>

      <nav aria-label="Bottom navigation" className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-white/10 bg-[#151515]/95 px-2 py-2 backdrop-blur-xl lg:hidden">
        {([
          { id: "dashboard" as Section, label: "Home", icon: LayoutDashboard },
          { id: "tasks" as Section, label: "Tasks", icon: ListTodo },
          { id: "calendar" as Section, label: "Calendar", icon: CalendarDays },
          { id: "habits" as Section, label: "Habits", icon: Flame },
        ]).map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => navigate(id)}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg py-2 text-[10px] ${
              section === id ? "text-white" : "text-neutral-500 hover:text-neutral-300"
            }`}><Icon size={19} />{label}</button>
        ))}
      </nav>
    </div>
  );
}

type CalendarPanelProps = {
  tasks: Task[];
  events: CalendarEvent[];
  loaded: boolean;
  selectedDate: string;
  viewMonth: string;
  today: string;
  eventFields: EventFields;
  editingEventId: string | null;
  eventMessage: string;
  eventBusy: boolean;
  onSelectDate: (date: string) => void;
  onViewMonth: (month: string) => void;
  onJumpToday: () => void;
  onEventFields: (fields: EventFields) => void;
  onSaveEvent: (event: FormEvent<HTMLFormElement>) => void;
  onEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
  onCancelEventEdit: () => void;
  onToggleTask: (id: string) => void;
  onGoToTasks: () => void;
};

function CalendarPanel({ tasks, events, loaded, selectedDate, viewMonth, today,
  eventFields, editingEventId, eventMessage, eventBusy, onSelectDate, onViewMonth,
  onJumpToday, onEventFields, onSaveEvent, onEditEvent, onDeleteEvent,
  onCancelEventEdit, onToggleTask, onGoToTasks }: CalendarPanelProps) {
  const firstDay = viewMonth ? firstOfMonth(viewMonth) : null;
  const gridDates: { key: string; inMonth: boolean }[] = [];
  if (firstDay) {
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const start = new Date(firstDay);
    start.setDate(1 - mondayOffset);
    for (let i = 0; i < 42; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      gridDates.push({ key: localDateKey(day), inMonth: monthKey(day) === viewMonth });
    }
  }

  const tasksByDay = new Map<string, Task[]>();
  const eventsByDay = new Map<string, CalendarEvent[]>();
  for (const task of tasks) {
    if (!task.dueDate) continue;
    tasksByDay.set(task.dueDate, [...(tasksByDay.get(task.dueDate) || []), task]);
  }
  for (const event of events) {
    eventsByDay.set(event.date, [...(eventsByDay.get(event.date) || []), event]);
  }
  const dayTasks = tasksByDay.get(selectedDate) || [];
  const dayEvents = [...(eventsByDay.get(selectedDate) || [])]
    .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
  const selectedLabel = selectedDate
    ? new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      .format(new Date(`${selectedDate}T12:00:00`)) : "Select a day";
  const monthLabel = firstDay
    ? new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(firstDay)
    : "Loading calendar";

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,1fr)]">
      <section className={`${cardClass} min-w-0 p-3 sm:p-6`} aria-label="Monthly calendar">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">{monthLabel}</h3>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onJumpToday} disabled={!today}
              className="rounded-lg border border-white/15 px-3 py-2 text-xs text-neutral-200 hover:bg-white/10 disabled:opacity-40">Today</button>
            <button type="button" aria-label="Previous month" disabled={!viewMonth}
              onClick={() => onViewMonth(shiftMonth(viewMonth, -1))}
              className="rounded-lg border border-white/15 p-2 hover:bg-white/10 disabled:opacity-40"><ChevronLeft size={18} /></button>
            <button type="button" aria-label="Next month" disabled={!viewMonth}
              onClick={() => onViewMonth(shiftMonth(viewMonth, 1))}
              className="rounded-lg border border-white/15 p-2 hover:bg-white/10 disabled:opacity-40"><ChevronRight size={18} /></button>
          </div>
        </div>
        <div className="mb-2 grid grid-cols-7 gap-1 sm:gap-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
            <div key={label} className="py-2 text-center text-[10px] font-medium text-neutral-500 sm:text-xs">{label}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {gridDates.map(({ key, inMonth }) => {
            const taskCount = tasksByDay.get(key)?.length || 0;
            const eventCount = eventsByDay.get(key)?.length || 0;
            const isSelected = key === selectedDate;
            const isToday = key === today;
            return (
              <button key={key} type="button" onClick={() => onSelectDate(key)}
                aria-pressed={isSelected} aria-label={`${key}, ${taskCount} tasks, ${eventCount} events`}
                className={`flex min-h-14 flex-col items-center justify-start rounded-lg border px-1 py-2 text-center transition sm:min-h-20 sm:rounded-xl ${
                  isSelected ? "border-neutral-100 bg-neutral-100 text-neutral-950" :
                  isToday ? "border-neutral-400 bg-white/10 text-white" :
                  "border-white/5 bg-[#202020] text-neutral-200 hover:border-white/30 hover:bg-[#292929]"
                } ${inMonth ? "" : "opacity-45"}`}>
                <span className="text-xs font-semibold sm:text-sm">{Number(key.slice(8))}</span>
                <div className="mt-1 flex flex-wrap justify-center gap-1">
                  {taskCount > 0 && <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-black" : "bg-neutral-200"}`} />}
                  {eventCount > 0 && <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-neutral-500" : "bg-neutral-500"}`} />}
                </div>
                {(taskCount + eventCount) > 0 && <span className="mt-1 hidden text-[10px] sm:block">{taskCount + eventCount} item{taskCount + eventCount === 1 ? "" : "s"}</span>}
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap gap-4 text-xs text-neutral-400">
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-neutral-100" />Task deadline</span>
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-neutral-500" />Calendar event</span>
        </div>
        <p className="mt-3 text-xs text-neutral-500">Dates follow your device&apos;s local calendar. Choose a day to see its schedule.</p>
      </section>

      <div className="min-w-0 space-y-5">
        <section className={`${cardClass} p-5 sm:p-6`} aria-label="Selected day schedule">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-neutral-400">Selected date</p>
              <h3 className="mt-1 text-lg font-semibold">{selectedLabel}</h3>
            </div>
            <CalendarDays size={22} className="shrink-0 text-neutral-400" />
          </div>
          {!loaded ? <p className="text-sm text-neutral-500">Loading saved information...</p> :
            dayTasks.length === 0 && dayEvents.length === 0 ?
              <p className="rounded-xl bg-white/5 p-4 text-sm text-neutral-400">Nothing scheduled for this date yet.</p> : (
              <div className="space-y-4">
                {dayEvents.length > 0 && <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Events</p>
                  {dayEvents.map((item) => <div key={item.id} className="rounded-xl border border-white/10 bg-[#202020] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-medium">{item.title}</p>
                        {item.time && <p className="mt-1 text-xs text-neutral-400">{item.time}</p>}
                        {item.notes && <p className="mt-2 whitespace-pre-wrap break-words text-xs text-neutral-400">{item.notes}</p>}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button type="button" onClick={() => onEditEvent(item)} aria-label={`Edit ${item.title}`} className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white"><Pencil size={16} /></button>
                        <button type="button" onClick={() => onDeleteEvent(item.id)} aria-label={`Delete ${item.title}`} className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>)}
                </div>}
                {dayTasks.length > 0 && <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Task deadlines</p>
                  {dayTasks.map((task) => <div key={task.id} className="flex items-start gap-2 rounded-xl border border-white/10 bg-[#202020] p-3">
                    <button type="button" aria-label={task.completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
                      onClick={() => onToggleTask(task.id)} className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${task.completed ? "bg-neutral-100 text-neutral-950" : "border-neutral-500 text-transparent"}`}><Check size={12} /></button>
                    <div className="min-w-0 flex-1">
                      <p className={`break-words text-sm ${task.completed ? "text-neutral-500 line-through" : "text-neutral-100"}`}>{task.title}</p>
                      <p className="mt-1 text-xs text-neutral-500">{capitalize(task.priority)} priority · {task.category}</p>
                    </div>
                  </div>)}
                  <button type="button" onClick={onGoToTasks} className="text-xs font-medium text-neutral-200 underline underline-offset-4 hover:text-white">Manage tasks</button>
                </div>}
              </div>
            )}
        </section>

        <section className={`${cardClass} p-5 sm:p-6`} aria-label="Calendar event editor">
          <div className="mb-4 flex items-center gap-2">
            <CalendarPlus size={19} />
            <h3 className="font-semibold">{editingEventId ? "Edit event" : "Add event"}</h3>
          </div>
          <form onSubmit={onSaveEvent} className="space-y-3">
            <label className="block text-xs text-neutral-400">Event title
              <input required maxLength={200} value={eventFields.title}
                onChange={(e) => onEventFields({ ...eventFields, title: e.target.value })}
                placeholder="e.g. Study session" className={`${fieldClass} mt-1`} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs text-neutral-400">Date
                <input required type="date" value={eventFields.date || selectedDate}
                  onChange={(e) => onEventFields({ ...eventFields, date: e.target.value })}
                  className={`${fieldClass} mt-1 scheme-dark`} />
              </label>
              <label className="block text-xs text-neutral-400">Time (optional)
                <input type="time" value={eventFields.time}
                  onChange={(e) => onEventFields({ ...eventFields, time: e.target.value })}
                  className={`${fieldClass} mt-1 scheme-dark`} />
              </label>
            </div>
            <label className="block text-xs text-neutral-400">Notes (optional)
              <textarea maxLength={1000} rows={3} value={eventFields.notes}
                onChange={(e) => onEventFields({ ...eventFields, notes: e.target.value })}
                placeholder="Event details" className={`${fieldClass} mt-1 py-3`} />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={!loaded || !selectedDate || eventBusy}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-neutral-100 px-4 text-sm font-semibold text-neutral-950 hover:bg-white disabled:opacity-40"><Plus size={16} />{editingEventId ? "Save changes" : "Add event"}</button>
              {editingEventId && <button type="button" onClick={onCancelEventEdit}
                className="rounded-xl border border-white/20 px-4 text-sm text-neutral-200 hover:bg-white/10">Cancel edit</button>}
            </div>
            <p role="status" aria-live="polite" className="min-h-5 text-xs text-neutral-400">{eventMessage || "Events are saved in Supabase."}</p>
          </form>
        </section>
      </div>
    </div>
  );
}


type HabitsPanelProps = {
  habits: Habit[];
  goals: Goal[];
  loaded: boolean;
  today: string;
  habitFields: HabitFields;
  onHabitFields: (fields: HabitFields) => void;
  editingHabitId: string | null;
  onEditHabit: (habit: Habit) => void;
  onCancelHabit: () => void;
  onSaveHabit: (event: FormEvent<HTMLFormElement>) => void;
  onToggleHabit: (id: string, date: string) => void;
  onDeleteHabit: (id: string) => void;
  goalFields: GoalFields;
  onGoalFields: (fields: GoalFields) => void;
  editingGoalId: string | null;
  onEditGoal: (goal: Goal) => void;
  onCancelGoal: () => void;
  onSaveGoal: (event: FormEvent<HTMLFormElement>) => void;
  onChangeGoal: (id: string, amount: number) => void;
  onDeleteGoal: (id: string) => void;
  message: string;
  busy: boolean;
};

function HabitsPanel({ habits, goals, loaded, today, habitFields, onHabitFields,
  editingHabitId, onEditHabit, onCancelHabit, onSaveHabit, onToggleHabit, onDeleteHabit,
  goalFields, onGoalFields, editingGoalId, onEditGoal, onCancelGoal, onSaveGoal,
  onChangeGoal, onDeleteGoal, message, busy }: HabitsPanelProps) {
  const weekDays = today ? Array.from({ length: 7 }, (_, i) => previousDate(today, 6 - i)) : [];
  const doneToday = habits.filter((habit) => today && habit.checkIns.includes(today)).length;
  const percent = habits.length ? Math.round(doneToday / habits.length * 100) : 0;
  const finishedGoals = goals.filter((goal) => goal.current >= goal.target).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard title="Active Habits" value={loaded ? String(habits.length) : "—"}
          description="Routines you're tracking" icon={Flame} />
        <StatCard title="Done Today" value={loaded ? String(doneToday) : "—"}
          description="Today's check-ins" icon={CheckCircle2} />
        <StatCard title="Daily Completion" value={loaded && today ? `${percent}%` : "—"}
          description="Habits completed today" icon={Activity} />
        <StatCard title="Goals Reached" value={loaded ? `${finishedGoals}/${goals.length}` : "—"}
          description="Completed targets" icon={Target} />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
        <div className="space-y-5">
          <section className={`${cardClass} p-5 sm:p-6`} aria-label="Habit tracker">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div><h3 className="text-lg font-semibold">Daily habits</h3>
                <p className="mt-1 text-xs text-neutral-500">Check off today or any of the last seven days.</p>
              </div>
              <Flame size={20} className="text-neutral-300" />
            </div>
            {!loaded || !today ? (
              <p className="text-sm text-neutral-500">Loading habits...</p>
            ) : habits.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-neutral-400">
                No habits yet. Create your first daily habit using the form.
              </div>
            ) : (
              <div className="space-y-3">
                {habits.map((habit) => (
                  <div key={habit.id} className="rounded-xl border border-white/10 bg-[#202020] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold">{habit.name}</p>
                        <p className="mt-1 text-xs text-neutral-400">{habit.category} · {habitStreak(habit, today)} day streak</p>
                      </div>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => onEditHabit(habit)} aria-label={`Edit ${habit.name}`}
                          className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white"><Pencil size={16}/></button>
                        <button type="button" onClick={() => onDeleteHabit(habit.id)} aria-label={`Delete ${habit.name}`}
                          className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white"><Trash2 size={16}/></button>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-7 gap-1.5">
                      {weekDays.map((day) => {
                        const checked = habit.checkIns.includes(day);
                        const dayLabel = new Intl.DateTimeFormat("en-IN", { weekday: "short", timeZone: "UTC" })
                          .format(new Date(`${day}T12:00:00Z`));
                        return (
                          <button key={day} type="button" onClick={() => onToggleHabit(habit.id, day)}
                            aria-pressed={checked} aria-label={`${habit.name}, ${day}, ${checked ? "completed" : "not completed"}`}
                            title={day}
                            className={`flex min-w-0 flex-col items-center gap-2 rounded-lg border px-1 py-2 text-[10px] transition ${checked
                              ? "border-white bg-neutral-100 text-neutral-950" : "border-white/10 bg-[#111111] text-neutral-400 hover:border-white/40"}`}>
                            <span>{dayLabel}</span>{checked ? <Check size={16}/> : <span className="flex h-4 items-center">{Number(day.slice(8))}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={`${cardClass} p-5 sm:p-6`} aria-label="Goal tracker">
            <div className="mb-5 flex items-center gap-2"><Target size={20}/><h3 className="text-lg font-semibold">Goals</h3></div>
            {!loaded ? <p className="text-sm text-neutral-500">Loading goals...</p> : goals.length === 0 ? (
              <p className="rounded-xl bg-white/5 p-5 text-sm text-neutral-400">Create a measurable goal to track your progress.</p>
            ) : (
              <div className="space-y-3">
                {goals.map((goal) => {
                  const reached = goal.current >= goal.target;
                  const percentage = Math.min(100, Math.round(goal.current / goal.target * 100));
                  return (
                    <div key={goal.id} className="rounded-xl border border-white/10 bg-[#202020] p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-semibold">{goal.title}</p>
                          <p className="mt-1 text-xs text-neutral-400">{goal.current} / {goal.target} {goal.unit} {reached ? "· Goal reached" : ""}</p>
                        </div>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => onEditGoal(goal)} aria-label={`Edit goal ${goal.title}`}
                            className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white"><Pencil size={16}/></button>
                          <button type="button" onClick={() => onDeleteGoal(goal.id)} aria-label={`Delete goal ${goal.title}`}
                            className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white"><Trash2 size={16}/></button>
                        </div>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-neutral-100 transition-all" style={{ width: `${percentage}%` }}/>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-xs text-neutral-500">{percentage}% complete</span>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => onChangeGoal(goal.id, -1)} disabled={goal.current <= 0}
                            aria-label={`Decrease ${goal.title} progress`}
                            className="rounded-lg border border-white/20 px-3 py-1 text-sm hover:bg-white/10 disabled:opacity-40">−1</button>
                          <button type="button" onClick={() => onChangeGoal(goal.id, 1)} disabled={reached}
                            aria-label={`Increase ${goal.title} progress`}
                            className="rounded-lg border border-white/20 px-3 py-1 text-sm hover:bg-white/10 disabled:opacity-40">+1</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <section className={`${cardClass} p-5 sm:p-6`} aria-label="Create or edit habit">
            <div className="mb-4 flex items-center gap-2"><PlusCircle size={19}/><h3 className="font-semibold">{editingHabitId ? "Edit habit" : "New habit"}</h3></div>
            <form onSubmit={onSaveHabit} className="space-y-3">
              <label className="block text-xs text-neutral-400">Habit name
                <input required maxLength={120} value={habitFields.name} onChange={(event) => onHabitFields({ ...habitFields, name: event.target.value })}
                  placeholder="e.g. Read for 30 minutes" className={`${fieldClass} mt-1`}/>
              </label>
              <label className="block text-xs text-neutral-400">Category
                <select value={habitFields.category} onChange={(event) => onHabitFields({ ...habitFields, category: event.target.value as TaskCategory })}
                  className={`${fieldClass} mt-1`}>
                  {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={!loaded || busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-neutral-100 px-4 text-sm font-semibold text-neutral-950 hover:bg-white disabled:opacity-40">
                  <Plus size={16}/>{editingHabitId ? "Save habit" : "Add habit"}
                </button>
                {editingHabitId && <button type="button" onClick={onCancelHabit} className="rounded-xl border border-white/20 px-4 text-sm hover:bg-white/10">Cancel</button>}
              </div>
            </form>
          </section>
          <section className={`${cardClass} p-5 sm:p-6`} aria-label="Create or edit goal">
            <div className="mb-4 flex items-center gap-2"><TrendingUp size={19}/><h3 className="font-semibold">{editingGoalId ? "Edit goal" : "New goal"}</h3></div>
            <form onSubmit={onSaveGoal} className="space-y-3">
              <label className="block text-xs text-neutral-400">Goal name
                <input required maxLength={120} value={goalFields.title} onChange={(event) => onGoalFields({ ...goalFields, title: event.target.value })}
                  placeholder="e.g. Complete 20 study sessions" className={`${fieldClass} mt-1`}/>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs text-neutral-400">Target
                  <input required type="number" min={1} max={1000000} step={1} value={goalFields.target}
                    onChange={(event) => onGoalFields({ ...goalFields, target: Number(event.target.value) })}
                    className={`${fieldClass} mt-1`}/>
                </label>
                <label className="block text-xs text-neutral-400">Unit
                  <input maxLength={30} value={goalFields.unit} onChange={(event) => onGoalFields({ ...goalFields, unit: event.target.value })}
                    placeholder="sessions" className={`${fieldClass} mt-1`}/>
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={!loaded || busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-neutral-100 px-4 text-sm font-semibold text-neutral-950 hover:bg-white disabled:opacity-40">
                  <Plus size={16}/>{editingGoalId ? "Save goal" : "Add goal"}
                </button>
                {editingGoalId && <button type="button" onClick={onCancelGoal} className="rounded-xl border border-white/20 px-4 text-sm hover:bg-white/10">Cancel</button>}
              </div>
            </form>
          </section>
          <p role="status" aria-live="polite" className="px-1 text-xs text-neutral-400">{message || "Habits and goals are saved in Supabase."}</p>
        </div>
      </div>
    </div>
  );
}

function NotesPanel({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [fields, setFields] = useState<NoteFields>(EMPTY_NOTE);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const noteTitleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const rows = await readCloudRows(supabase, "notes", userId);
        if (active) { setNotes(rows.map(mapCloudNote)); setNotesLoaded(true); }
      } catch (error) {
        if (active) setMessage(`Unable to load cloud notes: ${cloudError(error)}. Refresh to retry.`);
      }
    })();
    return () => { active = false; };
  }, [supabase, userId]);

  async function runNoteMutation(action: () => Promise<void>) {
    if (!notesLoaded || busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    try { await action(); return true; }
    catch (error) { setMessage(`Cloud save failed: ${cloudError(error)}`); return false; }
    finally { busyRef.current = false; setBusy(false); }
  }

  const visibleNotes = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();
    return notes.filter((note) =>
      `${note.title} ${note.content}`.toLowerCase().includes(searchTerm)
    ).sort((a, b) =>
      Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt)
    );
  }, [notes, query]);

  function resetEditor() {
    setEditingNoteId(null);
    setFields(EMPTY_NOTE);
  }

  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!notesLoaded) return;
    const title = fields.title.trim();
    const content = fields.content.trim();
    if (!title) { setMessage("Enter a note title."); noteTitleRef.current?.focus(); return; }
    const current = notes.find(item => item.id === editingNoteId);
    if (editingNoteId && !current) return;
    const now = new Date().toISOString();
    const note: Note = current ? { ...current, title, content, updatedAt: now } : {
      id: crypto.randomUUID(), title, content, pinned: false, createdAt: now, updatedAt: now
    };
    const saved = await runNoteMutation(async () => {
      if (current) {
        const { data, error } = await supabase.from("notes").update({
          title: note.title, content: note.content, updated_at: now
        }).eq("id", note.id).eq("user_id", userId).select("id").single();
        if (error || !data) throw error ?? new Error("Note not found.");
        setNotes(items => items.map(item => item.id === note.id ? note : item));
      } else {
        const { error } = await supabase.from("notes").insert({
          id: note.id, user_id: userId, title: note.title, content: note.content,
          pinned: false, created_at: now, updated_at: now
        });
        if (error) throw error;
        setNotes(items => [note, ...items]);
      }
    });
    if (!saved) return;
    setMessage(current ? "Note updated in cloud." : "Note saved in cloud.");
    resetEditor(); setQuery("");
  }

  function beginEdit(note: Note) {
    setEditingNoteId(note.id);
    setFields({ title: note.title, content: note.content });
    setMessage("");
    // Give the conditional editor a chance to display before focusing it.
    window.setTimeout(() => noteTitleRef.current?.focus(), 0);
  }

  async function togglePin(id: string) {
    const note = notes.find(item => item.id === id);
    if (!note) return;
    const pinned = !note.pinned;
    await runNoteMutation(async () => {
      const { data, error } = await supabase.from("notes").update({ pinned })
        .eq("id", id).eq("user_id", userId).select("id").single();
      if (error || !data) throw error ?? new Error("Note not found.");
      setNotes(items => items.map(item => item.id === id ? { ...item, pinned } : item));
    });
  }

  async function deleteNote(id: string) {
    const saved = await runNoteMutation(async () => {
      const { data, error } = await supabase.from("notes").delete()
        .eq("id", id).eq("user_id", userId).select("id").single();
      if (error || !data) throw error ?? new Error("Note not found.");
      setNotes(items => items.filter(item => item.id !== id));
    });
    if (!saved) return;
    if (editingNoteId === id) resetEditor();
    setMessage("Note deleted from cloud.");
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard title="Total Notes" value={notesLoaded ? String(notes.length) : "—"}
          description="Saved in Supabase" icon={StickyNote} />
        <StatCard title="Pinned Notes" value={notesLoaded ? String(notes.filter((note) => note.pinned).length) : "—"}
          description="At the top of your list" icon={Pin} />
        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-white/10 bg-[#171717] p-4 sm:p-5">
          <p className="text-xs font-medium text-neutral-400">Quick access</p>
          <p className="mt-4 text-sm text-neutral-200">Find notes by title or content.</p>
          <p className="mt-2 text-xs text-neutral-500">Notes sync through Supabase on refresh.</p>
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(310px,1fr)]">
        <section className={`${cardClass} min-w-0 overflow-hidden`} aria-label="Saved notes">
          <div className="border-b border-white/10 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold">All notes</h3>
                <p className="mt-1 text-xs text-neutral-500">Pinned notes appear first.</p>
              </div>
              <label className="relative block min-w-0 sm:w-60">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <span className="sr-only">Search notes</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search notes..." className={`${fieldClass} pl-9`} />
              </label>
            </div>
          </div>
          <div className="divide-y divide-white/10">
            {!notesLoaded ? (
              <p className="p-8 text-sm text-neutral-400">Loading your notes...</p>
            ) : visibleNotes.length === 0 ? (
              <div className="p-10 text-center">
                <StickyNote size={28} className="mx-auto mb-3 text-neutral-500" />
                <p className="text-sm font-semibold">{notes.length ? "No matching notes" : "No notes yet"}</p>
                <p className="mt-2 text-xs text-neutral-500">{notes.length ? "Try a different search term." : "Use the editor to create your first note."}</p>
              </div>
            ) : visibleNotes.map((note) => (
              <article key={note.id} className="p-4 transition hover:bg-white/[0.025] sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="break-words text-sm font-semibold text-neutral-100">{note.title}</h4>
                      {note.pinned && <span className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] text-neutral-300">Pinned</span>}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-400">
                      {note.content || "No additional content"}
                    </p>
                    <p className="mt-3 text-[11px] text-neutral-600">Updated {formatCreatedAt(note.updatedAt)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button type="button" onClick={() => togglePin(note.id)}
                      aria-label={note.pinned ? `Unpin ${note.title}` : `Pin ${note.title}`}
                      title={note.pinned ? "Unpin note" : "Pin note"}
                      className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white">
                      {note.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                    </button>
                    <button type="button" onClick={() => beginEdit(note)}
                      aria-label={`Edit ${note.title}`} title="Edit note"
                      className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white"><Pencil size={16}/></button>
                    <button type="button" onClick={() => deleteNote(note.id)}
                      aria-label={`Delete ${note.title}`} title="Delete note"
                      className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white"><Trash2 size={16}/></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={`${cardClass} min-w-0 p-5 sm:p-6`} aria-label="Note editor">
          <div className="mb-5 flex items-center gap-2">
            <StickyNote size={19} />
            <h3 className="text-lg font-semibold">{editingNoteId ? "Edit note" : "New note"}</h3>
          </div>
          <form onSubmit={saveNote} className="space-y-4">
            <label className="block text-xs text-neutral-400">Title
              <input ref={noteTitleRef} required maxLength={150} value={fields.title}
                onChange={(event) => { setFields((v) => ({ ...v, title: event.target.value })); setMessage(""); }}
                placeholder="e.g. Project ideas" className={`${fieldClass} mt-1`} />
            </label>
            <label className="block text-xs text-neutral-400">Content
              <textarea rows={9} maxLength={20000} value={fields.content}
                onChange={(event) => setFields((v) => ({ ...v, content: event.target.value }))}
                placeholder="Write your thoughts, plans or reminders..."
                className={`${fieldClass} mt-1 resize-y py-3 leading-6`} />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={!notesLoaded || busy}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-neutral-100 px-4 text-sm font-semibold text-neutral-950 hover:bg-white disabled:opacity-40">
                <Plus size={16} />{editingNoteId ? "Save changes" : "Add note"}
              </button>
              {editingNoteId && <button type="button" onClick={() => { resetEditor(); setMessage(""); }}
                className="rounded-xl border border-white/20 px-4 text-sm text-neutral-200 hover:bg-white/10">Cancel edit</button>}
            </div>
            <p role="status" aria-live="polite" className="min-h-5 text-xs text-neutral-400">
              {message || "Notes are saved in Supabase."}
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}

function ProjectsPanel({ today, userId }: { today: string; userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [fields, setFields] = useState<ProjectFields>(EMPTY_PROJECT);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [searchProjects, setSearchProjects] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>("all");
  const [message, setMessage] = useState("");
  const [milestoneDrafts, setMilestoneDrafts] = useState<Record<string, string>>({});
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const projectTitleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const rows = await readCloudRows(supabase, "projects", userId);
        if (active) { setProjects(rows.map(mapCloudProject)); setProjectsLoaded(true); }
      } catch (error) {
        if (active) setMessage(`Unable to load cloud projects: ${cloudError(error)}. Refresh to retry.`);
      }
    })();
    return () => { active = false; };
  }, [supabase, userId]);

  async function runProjectMutation(action: () => Promise<void>) {
    if (!projectsLoaded || busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    try { await action(); return true; }
    catch (error) { setMessage(`Cloud save failed: ${cloudError(error)}`); return false; }
    finally { busyRef.current = false; setBusy(false); }
  }
  async function updateProject(project: Project) {
    return runProjectMutation(async () => {
      const { data, error } = await supabase.from("projects").update({
        title: project.title, description: project.description, status: project.status,
        due_date: project.dueDate || null, milestones: project.milestones,
        updated_at: project.updatedAt
      }).eq("id", project.id).eq("user_id", userId).select("id").single();
      if (error || !data) throw error ?? new Error("Project not found.");
      setProjects(items => items.map(item => item.id === project.id ? project : item));
    });
  }

  const visibleProjects = useMemo(() => {
    const term = searchProjects.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesStatus = statusFilter === "all" || project.status === statusFilter;
      const matchesText = `${project.title} ${project.description} ${project.milestones.map((item) => item.title).join(" ")}`
        .toLowerCase().includes(term);
      return matchesStatus && matchesText;
    }).sort((a, b) => {
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (b.status === "completed" && a.status !== "completed") return -1;
      return (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31") ||
        b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [projects, searchProjects, statusFilter]);

  function resetProjectEditor() {
    setEditingProjectId(null);
    setFields(EMPTY_PROJECT);
  }

  async function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectsLoaded) return;
    const title = fields.title.trim();
    if (!title) { setMessage("Enter a project name."); projectTitleRef.current?.focus(); return; }
    if (!isDateInput(fields.dueDate)) { setMessage("Invalid project date."); return; }
    const current = projects.find(item => item.id === editingProjectId);
    if (editingProjectId && !current) return;
    const now = new Date().toISOString();
    const project: Project = current ? {
      ...current, ...fields, title, description: fields.description.trim(), updatedAt: now
    } : {
      ...fields, id: crypto.randomUUID(), title, description: fields.description.trim(),
      milestones: [], createdAt: now, updatedAt: now
    };
    let saved: boolean;
    if (current) saved = await updateProject(project);
    else saved = await runProjectMutation(async () => {
      const { error } = await supabase.from("projects").insert({
        id: project.id, user_id: userId, title: project.title,
        description: project.description, status: project.status,
        due_date: project.dueDate || null, milestones: [],
        created_at: now, updated_at: now
      });
      if (error) throw error;
      setProjects(items => [project, ...items]);
    });
    if (!saved) return;
    setMessage(current ? "Project updated in cloud." : "Project saved in cloud.");
    resetProjectEditor(); setSearchProjects(""); setStatusFilter("all");
  }

  function editProject(project: Project) {
    setEditingProjectId(project.id);
    setFields({ title: project.title, description: project.description,
      dueDate: project.dueDate, status: project.status });
    setMessage("Editing project details. Milestones will be preserved.");
    window.setTimeout(() => projectTitleRef.current?.focus(), 0);
  }

  async function deleteProject(id: string) {
    if (!window.confirm("Delete this project and all its milestones?")) return;
    const saved = await runProjectMutation(async () => {
      const { data, error } = await supabase.from("projects").delete()
        .eq("id", id).eq("user_id", userId).select("id").single();
      if (error || !data) throw error ?? new Error("Project not found.");
      setProjects(items => items.filter(item => item.id !== id));
    });
    if (!saved) return;
    if (editingProjectId === id) resetProjectEditor();
    setEditingMilestoneId(null); setMessage("Project deleted from cloud.");
  }

  async function changeStatus(id: string, status: ProjectStatus) {
    const project = projects.find(item => item.id === id);
    if (!project) return;
    const saved = await updateProject({ ...project, status, updatedAt: new Date().toISOString() });
    if (saved) setMessage("Project status updated in cloud.");
  }

  async function addMilestone(event: FormEvent<HTMLFormElement>, projectId: string) {
    event.preventDefault();
    const project = projects.find(item => item.id === projectId);
    const title = (milestoneDrafts[projectId] || "").trim();
    if (!title || !project) return;
    const now = new Date().toISOString();
    const milestone: Milestone = { id: crypto.randomUUID(), title, done: false, createdAt: now };
    const saved = await updateProject({ ...project, updatedAt: now, milestones: [...project.milestones, milestone] });
    if (!saved) return;
    setMilestoneDrafts(items => ({ ...items, [projectId]: "" }));
    setMessage("Milestone saved in cloud.");
  }

  async function toggleMilestone(projectId: string, milestoneId: string) {
    const project = projects.find(item => item.id === projectId);
    if (!project) return;
    await updateProject({ ...project, updatedAt: new Date().toISOString(),
      milestones: project.milestones.map(m => m.id === milestoneId ? { ...m, done: !m.done } : m) });
  }

  async function saveMilestone(event: FormEvent<HTMLFormElement>, projectId: string) {
    event.preventDefault();
    const project = projects.find(item => item.id === projectId);
    const title = milestoneTitle.trim();
    if (!title || !project || !editingMilestoneId) return;
    const saved = await updateProject({ ...project, updatedAt: new Date().toISOString(),
      milestones: project.milestones.map(m => m.id === editingMilestoneId ? { ...m, title } : m) });
    if (!saved) return;
    setEditingMilestoneId(null); setMilestoneTitle("");
    setMessage("Milestone updated in cloud.");
  }

  async function deleteMilestone(projectId: string, milestoneId: string) {
    const project = projects.find(item => item.id === projectId);
    if (!project) return;
    const saved = await updateProject({ ...project, updatedAt: new Date().toISOString(),
      milestones: project.milestones.filter(m => m.id !== milestoneId) });
    if (!saved) return;
    if (editingMilestoneId === milestoneId) setEditingMilestoneId(null);
    setMessage("Milestone removed from cloud.");
  }

  const activeProjects = projects.filter((item) => item.status === "active").length;
  const finishedProjects = projects.filter((item) => item.status === "completed").length;
  const overdueProjects = today ? projects.filter((item) =>
    item.status !== "completed" && item.dueDate && item.dueDate < today).length : 0;
  const allMilestones = projects.flatMap((item) => item.milestones);
  const doneMilestones = allMilestones.filter((item) => item.done).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard title="Total Projects" value={projectsLoaded ? String(projects.length) : "—"}
          description="Projects in your workspace" icon={FolderKanban} />
        <StatCard title="In Progress" value={projectsLoaded ? String(activeProjects) : "—"}
          description="Active projects" icon={Activity} />
        <StatCard title="Completed" value={projectsLoaded ? String(finishedProjects) : "—"}
          description="Projects marked complete" icon={CheckCircle2} />
        <StatCard title="Overdue" value={projectsLoaded && today ? String(overdueProjects) : "—"}
          description="Open projects past deadline" icon={Clock3} />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
        <section aria-label="Project list" className={`${cardClass} min-w-0 overflow-hidden`}>
          <div className="border-b border-white/10 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Your projects</h3>
                <p className="mt-1 text-xs text-neutral-500">
                  {doneMilestones} of {allMilestones.length} milestones completed
                </p>
              </div>
              <ListChecks size={20} className="text-neutral-400" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
              <label className="relative block">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <span className="sr-only">Search projects</span>
                <input value={searchProjects} onChange={(event) => setSearchProjects(event.target.value)}
                  placeholder="Search projects or milestones..." className={`${fieldClass} pl-9`} />
              </label>
              <label>
                <span className="sr-only">Filter projects by status</span>
                <select value={statusFilter} onChange={(event) =>
                  setStatusFilter(event.target.value as "all" | ProjectStatus)} className={fieldClass}>
                  <option value="all">All statuses</option>
                  {PROJECT_STATUSES.map((status) => <option key={status} value={status}>{projectStatusLabel(status)}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="divide-y divide-white/10">
            {!projectsLoaded ? <p className="p-8 text-sm text-neutral-400">Loading projects...</p> :
              visibleProjects.length === 0 ? (
                <div className="p-10 text-center">
                  <FolderKanban size={30} className="mx-auto mb-3 text-neutral-500" />
                  <p className="text-sm font-semibold">{projects.length ? "No matching projects" : "No projects yet"}</p>
                  <p className="mt-2 text-xs text-neutral-500">
                    {projects.length ? "Adjust your search or status filter." : "Create a project using the form to get started."}
                  </p>
                </div>
              ) : visibleProjects.map((project) => {
                const finished = project.milestones.filter((item) => item.done).length;
                const total = project.milestones.length;
                const percentage = total ? Math.round(finished / total * 100) : 0;
                const overdue = Boolean(today && project.dueDate && project.dueDate < today && project.status !== "completed");
                return (
                  <article key={project.id} className="p-4 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="break-words font-semibold text-neutral-100">{project.title}</h4>
                        {project.description && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-400">{project.description}</p>}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button type="button" aria-label={`Edit ${project.title}`} title="Edit project"
                          onClick={() => editProject(project)}
                          className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white"><Pencil size={16} /></button>
                        <button type="button" aria-label={`Delete ${project.title}`} title="Delete project"
                          onClick={() => deleteProject(project.id)}
                          className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white"><Trash2 size={16} /></button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                      <label className="flex items-center gap-2">
                        <span className="sr-only">Status of {project.title}</span>
                        <select aria-label={`Status of ${project.title}`} value={project.status}
                          onChange={(event) => changeStatus(project.id, event.target.value as ProjectStatus)}
                          className="rounded-lg border border-white/15 bg-[#0c0c0c] px-2 py-2 text-xs text-neutral-200 outline-none focus:border-neutral-400">
                          {PROJECT_STATUSES.map((status) => <option key={status} value={status}>{projectStatusLabel(status)}</option>)}
                        </select>
                      </label>
                      {project.dueDate && <span className={`rounded-lg border px-2 py-2 ${overdue ? "border-white/40 bg-white/15 font-semibold text-white" : "border-white/15"}`}>
                        <CalendarDays size={13} className="mr-1 inline" />{overdue ? "Overdue · " : "Due · "}{readableDueDate(project.dueDate)}
                      </span>}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 text-xs text-neutral-400">
                      <span>Milestones</span><span>{finished}/{total} complete · {percentage}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-neutral-100 transition-all" style={{ width: `${percentage}%` }} />
                    </div>
                    <div className="mt-4 space-y-2">
                      {project.milestones.map((milestone) => (
                        <div key={milestone.id} className="flex min-w-0 items-start gap-2 rounded-lg border border-white/10 bg-[#202020] px-3 py-2">
                          <button type="button" aria-label={`${milestone.done ? "Mark incomplete" : "Complete"} ${milestone.title}`}
                            aria-pressed={milestone.done}
                            onClick={() => toggleMilestone(project.id, milestone.id)}
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${milestone.done ? "border-white bg-neutral-100 text-black" : "border-neutral-500 text-transparent"}`}>
                            <Check size={12} />
                          </button>
                          {editingMilestoneId === milestone.id ? (
                            <form onSubmit={(event) => saveMilestone(event, project.id)} className="flex min-w-0 flex-1 flex-wrap gap-2">
                              <input required maxLength={160} autoFocus value={milestoneTitle}
                                onChange={(event) => setMilestoneTitle(event.target.value)} className={`${fieldClass} flex-1`} aria-label="Edit milestone" />
                              <button type="submit" disabled={!milestoneTitle.trim()} aria-label="Save milestone"
                                className="rounded-lg bg-neutral-100 p-2 text-black disabled:opacity-40"><Check size={16} /></button>
                              <button type="button" onClick={() => setEditingMilestoneId(null)} aria-label="Cancel milestone editing"
                                className="rounded-lg border border-white/20 p-2"><X size={16} /></button>
                            </form>
                          ) : (
                            <>
                              <span className={`min-w-0 flex-1 break-words text-sm ${milestone.done ? "text-neutral-500 line-through" : "text-neutral-200"}`}>{milestone.title}</span>
                              <button type="button" aria-label={`Edit milestone ${milestone.title}`} title="Edit milestone"
                                onClick={() => { setEditingMilestoneId(milestone.id); setMilestoneTitle(milestone.title); }}
                                className="shrink-0 rounded-lg p-1 text-neutral-500 hover:text-white"><Pencil size={15} /></button>
                              <button type="button" aria-label={`Delete milestone ${milestone.title}`} title="Delete milestone"
                                onClick={() => deleteMilestone(project.id, milestone.id)}
                                className="shrink-0 rounded-lg p-1 text-neutral-500 hover:text-white"><Trash2 size={15} /></button>
                            </>
                          )}
                        </div>
                      ))}
                      <form onSubmit={(event) => addMilestone(event, project.id)} className="flex flex-wrap gap-2 pt-2">
                        <input maxLength={160} value={milestoneDrafts[project.id] || ""}
                          onChange={(event) => setMilestoneDrafts((items) => ({ ...items, [project.id]: event.target.value }))}
                          placeholder="Add a milestone..." aria-label={`New milestone for ${project.title}`}
                          className={`${fieldClass} flex-1`} />
                        <button type="submit" disabled={!projectsLoaded || !(milestoneDrafts[project.id] || "").trim()}
                          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-3 text-sm text-neutral-100 hover:bg-white/10 disabled:opacity-40">
                          <Plus size={16} /> Add
                        </button>
                      </form>
                    </div>
                  </article>
                );
              })}
          </div>
        </section>

        <section className={`${cardClass} min-w-0 p-5 sm:p-6`} aria-label="Project editor">
          <div className="mb-5 flex items-center gap-2">
            <FolderKanban size={20} />
            <h3 className="text-lg font-semibold">{editingProjectId ? "Edit project" : "New project"}</h3>
          </div>
          <form onSubmit={saveProject} className="space-y-4">
            <label className="block text-xs text-neutral-400">Project name
              <input ref={projectTitleRef} required maxLength={150} value={fields.title}
                onChange={(event) => { setFields((item) => ({ ...item, title: event.target.value })); setMessage(""); }}
                placeholder="e.g. Launch my portfolio" className={`${fieldClass} mt-1`} />
            </label>
            <label className="block text-xs text-neutral-400">Description (optional)
              <textarea value={fields.description} maxLength={3000} rows={4}
                onChange={(event) => setFields((item) => ({ ...item, description: event.target.value }))}
                placeholder="What is this project about?" className={`${fieldClass} mt-1 resize-y py-3`} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs text-neutral-400">Status
                <select value={fields.status} onChange={(event) => setFields((item) => ({ ...item, status: event.target.value as ProjectStatus }))}
                  className={`${fieldClass} mt-1`}>
                  {PROJECT_STATUSES.map((status) => <option key={status} value={status}>{projectStatusLabel(status)}</option>)}
                </select>
              </label>
              <label className="block text-xs text-neutral-400">Deadline (optional)
                <input type="date" value={fields.dueDate}
                  onChange={(event) => setFields((item) => ({ ...item, dueDate: event.target.value }))}
                  className={`${fieldClass} mt-1 scheme-dark`} />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={!projectsLoaded || busy}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-neutral-100 px-4 text-sm font-semibold text-neutral-950 hover:bg-white disabled:opacity-40">
                <Plus size={16} /> {editingProjectId ? "Save changes" : "Create project"}
              </button>
              {editingProjectId && <button type="button" onClick={() => { resetProjectEditor(); setMessage(""); }}
                className="rounded-xl border border-white/20 px-4 text-sm text-neutral-200 hover:bg-white/10">Cancel edit</button>}
            </div>
            <p role="status" aria-live="polite" className="min-h-5 text-xs text-neutral-400">
              {message || "Projects and milestones are saved in Supabase."}
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}

function FinancePanel({ today, userId }: { today: string; userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [financeLoaded, setFinanceLoaded] = useState(false);
  const [fields, setFields] = useState<TransactionFields>(EMPTY_TRANSACTION);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [searchTransactions, setSearchTransactions] = useState("");
  const [financeMessage, setFinanceMessage] = useState("");
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [rows, budgetRows] = await Promise.all([
          readCloudRows(supabase, "finance_transactions", userId),
          readCloudRows(supabase, "finance_budgets", userId, "month")
        ]);
        if (!active) return;
        setTransactions(rows.map(mapCloudTransaction));
        const values: Record<string, number> = {};
        budgetRows.forEach(row => { values[String(row.month)] = cloudNumber(row.amount); });
        setBudgets(values);
        setFinanceLoaded(true);
      } catch (error) {
        if (active) setFinanceMessage(`Unable to load cloud finance: ${cloudError(error)}. Refresh to retry.`);
      }
    })();
    return () => { active = false; };
  }, [supabase, userId]);

  async function runFinanceMutation(action: () => Promise<void>) {
    if (!financeLoaded || busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    try { await action(); return true; }
    catch (error) { setFinanceMessage(`Cloud save failed: ${cloudError(error)}`); return false; }
    finally { busyRef.current = false; setBusy(false); }
  }

  // If the user hasn't selected a month, the device's current month is shown.
  const activeMonth = selectedMonth || (today ? today.slice(0, 7) : "");
  const activeBudget = budgets[activeMonth] || 0;
  const monthTransactions = transactions.filter((item) => item.date.startsWith(activeMonth) && activeMonth !== "");
  const monthlyIncome = monthTransactions.filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Math.round(item.amount * 100), 0) / 100;
  const monthlyExpenses = monthTransactions.filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Math.round(item.amount * 100), 0) / 100;
  const lifetimeBalance = transactions.reduce((sum, item) =>
    sum + (item.type === "income" ? 1 : -1) * Math.round(item.amount * 100), 0) / 100;
  const budgetPercent = activeBudget > 0 ? Math.round(monthlyExpenses / activeBudget * 100) : 0;
  const spendByCategory = EXPENSE_CATEGORIES.map((category) => ({
    category,
    total: monthTransactions.filter((item) => item.type === "expense" && item.category === category)
      .reduce((sum, item) => sum + Math.round(item.amount * 100), 0) / 100,
  })).filter((item) => item.total > 0).sort((a, b) => b.total - a.total);

  const visibleTransactions = useMemo(() => {
    const query = searchTransactions.trim().toLowerCase();
    return transactions.filter((item) => (!activeMonth || item.date.startsWith(activeMonth)) &&
      (typeFilter === "all" || item.type === typeFilter) &&
      `${item.title} ${item.category} ${item.notes}`.toLowerCase().includes(query))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [transactions, activeMonth, typeFilter, searchTransactions]);

  function resetEditor() {
    setEditingTransactionId(null);
    setFields({ ...EMPTY_TRANSACTION, date: today });
  }

  async function saveTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!financeLoaded) return;
    const title = fields.title.trim();
    const date = fields.date || today;
    const amount = Math.round(fields.amount * 100) / 100;
    if (!title || !Number.isFinite(amount) || amount <= 0 || amount > 1000000000 ||
      !date || !isDateInput(date) || !financeCategories(fields.type).includes(fields.category)) {
      setFinanceMessage("Enter a title, valid positive amount, category and date."); return;
    }
    const current = transactions.find(item => item.id === editingTransactionId);
    if (editingTransactionId && !current) return;
    const now = new Date().toISOString();
    const transaction: Transaction = current ? {
      ...current, ...fields, title, amount, date, notes: fields.notes.trim()
    } : {
      ...fields, title, amount, date, notes: fields.notes.trim(),
      id: crypto.randomUUID(), createdAt: now
    };
    const saved = await runFinanceMutation(async () => {
      const record = {
        title: transaction.title, amount: transaction.amount, type: transaction.type,
        category: transaction.category, transaction_date: transaction.date,
        notes: transaction.notes
      };
      if (current) {
        const { data, error } = await supabase.from("finance_transactions")
          .update(record).eq("id", transaction.id).eq("user_id", userId).select("id").single();
        if (error || !data) throw error ?? new Error("Transaction not found.");
        setTransactions(items => items.map(item => item.id === transaction.id ? transaction : item));
      } else {
        const { error } = await supabase.from("finance_transactions").insert({
          ...record, id: transaction.id, user_id: userId, created_at: now
        });
        if (error) throw error;
        setTransactions(items => [transaction, ...items]);
      }
    });
    if (!saved) return;
    setFinanceMessage(current ? "Transaction updated in cloud." : "Transaction saved in cloud.");
    setSelectedMonth(date.slice(0, 7));
    setMonthlyBudget(0); setSearchTransactions(""); setTypeFilter("all");
    resetEditor();
  }

  function editTransaction(item: Transaction) {
    setEditingTransactionId(item.id);
    setFields({ title: item.title, amount: item.amount, type: item.type,
      category: item.category, date: item.date, notes: item.notes });
    setFinanceMessage("Editing transaction.");
    window.setTimeout(() => titleRef.current?.focus(), 0);
  }

  async function deleteTransaction(item: Transaction) {
    if (!window.confirm(`Delete the transaction "${item.title}"?`)) return;
    const saved = await runFinanceMutation(async () => {
      const { data, error } = await supabase.from("finance_transactions")
        .delete().eq("id", item.id).eq("user_id", userId).select("id").single();
      if (error || !data) throw error ?? new Error("Transaction not found.");
      setTransactions(items => items.filter(entry => entry.id !== item.id));
    });
    if (!saved) return;
    if (editingTransactionId === item.id) resetEditor();
    setFinanceMessage("Transaction deleted from cloud.");
  }

  async function saveBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeMonth || !Number.isFinite(monthlyBudget) || monthlyBudget < 0 || monthlyBudget > 1000000000) {
      setFinanceMessage("Enter a valid monthly budget."); return;
    }
    const amount = Math.round(monthlyBudget * 100) / 100;
    const saved = await runFinanceMutation(async () => {
      const { error } = await supabase.from("finance_budgets").upsert({
        user_id: userId, month: activeMonth, amount
      }, { onConflict: "user_id,month" });
      if (error) throw error;
      setBudgets(items => ({ ...items, [activeMonth]: amount }));
    });
    if (saved) { setMonthlyBudget(0); setFinanceMessage("Budget saved in cloud."); }
  }

  function exportTransactions() {
    if (!visibleTransactions.length) return;
    const headers = ["Date", "Type", "Title", "Category", "Amount (INR)", "Notes"];
    const escapeCSV = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const rows = visibleTransactions.map((item) =>
      [item.date, item.type, item.title, item.category, item.amount.toFixed(2), item.notes]
        .map(escapeCSV).join(","));
    const csv = "\uFEFF" + [headers.map(escapeCSV).join(","), ...rows].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `dashtracker-finance-${activeMonth || "all"}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setFinanceMessage("Filtered transactions exported to CSV.");
  }

  const moneyClass = "break-words text-xl font-semibold tracking-tight";
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-400">Understand how much comes in and goes out.</p>
          <p className="mt-1 text-xs text-neutral-500">Amounts are recorded manually in Indian rupees.</p>
        </div>
        <label className="text-xs text-neutral-400">Reporting month
          <input type="month" value={activeMonth} onChange={(event) => { setSelectedMonth(event.target.value); setMonthlyBudget(0); }}
            aria-label="Reporting month" className={`${fieldClass} mt-1 scheme-dark`} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard title="Monthly Income" value={financeLoaded ? formatINR(monthlyIncome) : "—"}
          description="Income for selected month" icon={TrendingUp} />
        <StatCard title="Monthly Expenses" value={financeLoaded ? formatINR(monthlyExpenses) : "—"}
          description="Spending for selected month" icon={ReceiptText} />
        <StatCard title="Monthly Net" value={financeLoaded ? formatINR(monthlyIncome - monthlyExpenses) : "—"}
          description="Income minus expenses" icon={Wallet} />
        <StatCard title="Overall Balance" value={financeLoaded ? formatINR(lifetimeBalance) : "—"}
          description="Across all recorded months" icon={Activity} />
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,1fr)]">
        <div className="space-y-5">
          <section className={`${cardClass} overflow-hidden`} aria-label="Transaction history">
            <div className="border-b border-white/10 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">Transactions</h3>
                  <p className="mt-1 text-xs text-neutral-500">{visibleTransactions.length} entries in this view</p>
                </div>
                <button type="button" onClick={exportTransactions} disabled={!visibleTransactions.length}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs hover:bg-white/10 disabled:opacity-40">
                  <Download size={15} />Export CSV
                </button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_145px]">
                <label className="relative block">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <span className="sr-only">Search transactions</span>
                  <input value={searchTransactions} onChange={(event) => setSearchTransactions(event.target.value)}
                    placeholder="Search transactions..." className={`${fieldClass} pl-9`} />
                </label>
                <label>
                  <span className="sr-only">Filter transaction type</span>
                  <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as "all" | TransactionType)} className={fieldClass}>
                    <option value="all">All types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expenses</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="divide-y divide-white/10">
              {!financeLoaded ? <p className="p-8 text-sm text-neutral-400">Loading transactions...</p> :
                visibleTransactions.length === 0 ? (
                  <div className="p-10 text-center">
                    <ReceiptText size={30} className="mx-auto mb-3 text-neutral-500" />
                    <p className="text-sm font-semibold">No transactions found</p>
                    <p className="mt-2 text-xs text-neutral-500">Add an entry or change the month and filters.</p>
                  </div>
                ) : visibleTransactions.map((item) => (
                  <article key={item.id} className="flex items-start gap-3 p-4 sm:p-5">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="break-words text-sm font-semibold">{item.title}</h4>
                        <span className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[10px] text-neutral-300">{item.category}</span>
                      </div>
                      <p className="text-xs text-neutral-500">{readableDueDate(item.date)} · {item.type === "income" ? "Income" : "Expense"}</p>
                      {item.notes && <p className="whitespace-pre-wrap break-words text-xs text-neutral-400">{item.notes}</p>}
                      <p className={`mt-1 text-sm font-semibold ${item.type === "income" ? "text-neutral-100" : "text-neutral-300"}`}>
                        {item.type === "income" ? "+" : "−"}{formatINR(item.amount)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button type="button" onClick={() => editTransaction(item)} aria-label={`Edit ${item.title}`}
                        className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white"><Pencil size={16}/></button>
                      <button type="button" onClick={() => deleteTransaction(item)} aria-label={`Delete ${item.title}`}
                        className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white"><Trash2 size={16}/></button>
                    </div>
                  </article>
                ))}
            </div>
          </section>
          <section className={`${cardClass} p-5 sm:p-6`} aria-label="Spending breakdown">
            <h3 className="text-lg font-semibold">Spending by category</h3>
            <p className="mt-1 text-xs text-neutral-500">Expenses for {activeMonth || "the selected month"}</p>
            {spendByCategory.length === 0 ? <p className="mt-4 text-sm text-neutral-500">No expenses recorded this month.</p> : (
              <div className="mt-5 space-y-4">
                {spendByCategory.map(({category, total}) => (
                  <div key={category}>
                    <div className="mb-2 flex justify-between gap-3 text-xs"><span>{category}</span><span>{formatINR(total)}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-neutral-100" style={{width: `${monthlyExpenses ? total / monthlyExpenses * 100 : 0}%`}} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        <div className="space-y-5">
          <section className={`${cardClass} p-5 sm:p-6`} aria-label="Transaction editor">
            <div className="mb-5 flex items-center gap-2"><Wallet size={20}/><h3 className="text-lg font-semibold">{editingTransactionId ? "Edit transaction" : "Add transaction"}</h3></div>
            <form onSubmit={saveTransaction} className="space-y-3">
              <label className="block text-xs text-neutral-400">Type
                <select value={fields.type} className={`${fieldClass} mt-1`}
                  onChange={(event) => { const type = event.target.value as TransactionType;
                    setFields((item) => ({...item, type, category: financeCategories(type)[0]})); }}>
                  <option value="expense">Expense</option><option value="income">Income</option>
                </select>
              </label>
              <label className="block text-xs text-neutral-400">Title
                <input ref={titleRef} required maxLength={150} value={fields.title}
                  onChange={(event) => setFields((item) => ({...item, title: event.target.value}))}
                  placeholder="e.g. Groceries or Salary" className={`${fieldClass} mt-1`}/>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs text-neutral-400">Amount (₹)
                  <input type="number" required min="0.01" max="1000000000" step="0.01" value={fields.amount || ""}
                    onChange={(event) => setFields((item) => ({...item, amount: Number(event.target.value)}))}
                    placeholder="0.00" className={`${fieldClass} mt-1`}/>
                </label>
                <label className="block text-xs text-neutral-400">Date
                  <input type="date" required value={fields.date || today} className={`${fieldClass} mt-1 scheme-dark`}
                    onChange={(event) => setFields((item) => ({...item, date: event.target.value}))}/>
                </label>
              </div>
              <label className="block text-xs text-neutral-400">Category
                <select value={fields.category} className={`${fieldClass} mt-1`}
                  onChange={(event) => setFields((item) => ({...item, category: event.target.value as FinanceCategory}))}>
                  {financeCategories(fields.type).map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </label>
              <label className="block text-xs text-neutral-400">Notes (optional)
                <textarea rows={3} maxLength={1000} value={fields.notes}
                  onChange={(event) => setFields((item) => ({...item, notes: event.target.value}))}
                  placeholder="Additional details..." className={`${fieldClass} mt-1 resize-y py-3`}/>
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={!financeLoaded || busy}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-neutral-100 px-4 text-sm font-semibold text-neutral-950 hover:bg-white disabled:opacity-40">
                  <Plus size={16}/>{editingTransactionId ? "Save changes" : "Add transaction"}
                </button>
                {editingTransactionId && <button type="button" onClick={() => { resetEditor(); setFinanceMessage(""); }}
                  className="rounded-xl border border-white/20 px-4 text-sm hover:bg-white/10">Cancel edit</button>}
              </div>
              <p role="status" aria-live="polite" className="min-h-5 text-xs text-neutral-400">{financeMessage || "Finance records are saved in Supabase."}</p>
            </form>
          </section>
          <section className={`${cardClass} p-5 sm:p-6`} aria-label="Monthly expense budget">
            <div className="mb-2 flex items-center gap-2"><Target size={19}/><h3 className="text-lg font-semibold">Monthly spending budget</h3></div>
            <p className="text-xs text-neutral-500">Set a spending limit for {activeMonth || "this month"}.</p>
            <form onSubmit={saveBudget} className="mt-4 flex flex-wrap gap-2">
              <label className="min-w-0 flex-1"><span className="sr-only">Monthly budget in rupees</span>
                <input type="number" min="0" max="1000000000" step="0.01" placeholder={activeBudget ? String(activeBudget) : "Budget (₹)"}
                  value={monthlyBudget || ""} onChange={(event) => setMonthlyBudget(Number(event.target.value))}
                  className={fieldClass}/>
              </label>
              <button type="submit" disabled={!financeLoaded || !activeMonth || busy}
                className="rounded-xl border border-white/20 px-4 text-sm hover:bg-white/10 disabled:opacity-40">Save</button>
            </form>
            <p className={`mt-4 ${moneyClass}`}>{activeBudget ? formatINR(monthlyExpenses) + " / " + formatINR(activeBudget) : "No budget set"}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-neutral-100" style={{width: `${Math.min(100, budgetPercent)}%`}}/>
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              {activeBudget ? budgetPercent > 100 ? `${formatINR(monthlyExpenses - activeBudget)} over budget` : `${formatINR(activeBudget - monthlyExpenses)} remaining` :
                "Enter a limit and save it to start tracking your spending."}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function projectStatusLabel(value: ProjectStatus) {
  switch (value) {
    case "planned": return "Planned";
    case "active": return "In progress";
    case "on-hold": return "On hold";
    case "completed": return "Completed";
  }
}

function capitalize(value: string) { return value[0].toUpperCase() + value.slice(1); }

function formatCreatedAt(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "unknown date";
  // Fixed UTC zone prevents different server/client markup before hydration.
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(parsed);
}

function StatCard({ title, value, description, icon: Icon }: {
  title: string; value: string; description: string; icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#171717] p-4 transition hover:border-white/25 sm:p-5">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-xs font-medium text-neutral-400">{title}</p>
        <div className="rounded-lg bg-white/10 p-2 text-neutral-100"><Icon size={17} /></div>
      </div>
      <p className="text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
      <p className="mt-2 text-[11px] text-neutral-500">{description}</p>
    </div>
  );
}
