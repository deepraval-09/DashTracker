
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Command,
  Flame,
  LayoutDashboard,
  ListTodo,
  Menu,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Target,
  Trash2,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};

type Section =
  | "dashboard"
  | "tasks"
  | "calendar"
  | "habits"
  | "projects"
  | "finance"
  | "notes"
  | "settings";

const STORAGE_KEY = "dashtracker_tasks_v1";

// Change the name, tagline, or icon here to customize the sidebar branding.
const APP_NAME = "DashTracker";
const APP_TAGLINE = "PERSONAL LIFE OS";
const BrandIcon = Activity;

const navigation: {
  id: Section;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "tasks", label: "My Tasks", icon: ListTodo },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "habits", label: "Habits", icon: Flame },
  { id: "projects", label: "Projects", icon: Target },
  { id: "finance", label: "Finances", icon: Wallet },
  { id: "notes", label: "Notes", icon: Command },
  { id: "settings", label: "Settings", icon: MoreHorizontal },
];

function formatTodayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getGreeting(date: Date) {
  const hour = date.getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [taskInput, setTaskInput] = useState("");
  const taskInputRef = useRef<HTMLInputElement>(null);
  const [taskMessage, setTaskMessage] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [section, setSection] = useState<Section>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  // Update the clock only in the browser, after hydration. Rendering the current
  // time on the server triggers the Next.js unstable-value warning.
  useEffect(() => {
    const updateClock = () => setCurrentDate(new Date());
    const initialUpdate = window.setTimeout(updateClock, 0);
    const refreshClock = window.setInterval(updateClock, 60_000);

    return () => {
      window.clearTimeout(initialUpdate);
      window.clearInterval(refreshClock);
    };
  }, []);

  // Read browser storage after the first render. This avoids synchronous
  // state updates inside the effect and keeps server/client output consistent.
  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);

        if (stored) {
          const parsed: unknown = JSON.parse(stored);

          if (Array.isArray(parsed)) {
            const validTasks = parsed.filter(
              (item): item is Task =>
                item !== null &&
                typeof item === "object" &&
                typeof item.id === "string" &&
                typeof item.title === "string" &&
                typeof item.completed === "boolean" &&
                typeof item.createdAt === "string"
            );

            setTasks(validTasks);
          }
        }
      } catch (error) {
        console.error("Could not load saved tasks:", error);
      } finally {
        setLoaded(true);
      }
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, []);

  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error("Could not save tasks:", error);
    }
  }, [tasks, loaded]);

  const completedCount = tasks.filter((task) => task.completed).length;
  const pendingCount = tasks.length - completedCount;

  const progress = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0;

  const visibleTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "active" && !task.completed) ||
        (filter === "done" && task.completed);

      const matchesSearch = task.title
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [tasks, filter, search]);

  function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = taskInput.trim();
    if (!title) {
      setTaskMessage("Please enter a task before adding it.");
      taskInputRef.current?.focus();
      return;
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setTasks((current) => [newTask, ...current]);
    setTaskInput("");
    setSearch("");
    setFilter("all");
    setTaskMessage("Task added successfully.");
    taskInputRef.current?.focus();
  }

  function toggleTask(id: string) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  }

  function deleteTask(id: string) {
    setTasks((current) => current.filter((task) => task.id !== id));
    if (editingId === id) cancelEdit();
  }

  function beginEdit(task: Task) {
    setEditingId(task.id);
    setEditingTitle(task.title);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingTitle("");
  }

  function saveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = editingTitle.trim();
    if (!title || !editingId) return;
    setTasks((current) =>
      current.map((task) =>
        task.id === editingId ? { ...task, title } : task
      )
    );
    cancelEdit();
  }

  function navigate(nextSection: Section) {
    setSection(nextSection);
    setMobileMenuOpen(false);
    setTaskMessage("");
    setSearch("");
    setFilter("all");
  }

  const activeSection = navigation.find((item) => item.id === section);
  const showingTasks = section === "dashboard" || section === "tasks";
  const formattedToday = currentDate ? formatTodayLabel(currentDate) : "";
  const currentGreeting = currentDate ? getGreeting(currentDate) : "Welcome";

  return (
    <div className="min-h-screen bg-[#090909] text-neutral-100">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 bg-[#101010] lg:flex">
        <div className="flex h-20 items-center gap-3 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f5f5] text-[#090909] shadow-sm shadow-black/30">
            <BrandIcon size={23} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">{APP_NAME}</h1>
            <p className="text-[11px] tracking-wider text-neutral-500">
              {APP_TAGLINE}
            </p>
          </div>
        </div>

        <div className="px-4 pt-5">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => navigate(id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
                  section === id
                    ? "bg-white/10 font-semibold text-[#f5f5f5]"
                    : "text-neutral-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Target size={16} className="text-[#f5f5f5]" />
              Your workspace
            </div>
            <p className="text-xs leading-5 text-neutral-400">
              Track your day, stay organized, and build better habits.
            </p>
          </div>
          <p className="mt-5 px-3 text-xs text-neutral-500">
            DashTracker v0.2
          </p>
        </div>
      </aside>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative h-full w-[min(82vw,300px)] border-r border-white/10 bg-[#171717] p-5 shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <span className="font-bold">{APP_NAME}</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X size={21} />
              </button>
            </div>

            <nav className="space-y-2">
              {navigation.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => navigate(id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm ${
                    section === id
                      ? "bg-white/10 text-[#f5f5f5]"
                      : "text-neutral-300 hover:bg-white/5"
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main workspace */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-[#090909]/95 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-neutral-300 hover:bg-white/10 lg:hidden"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="hidden text-neutral-500 sm:inline">Workspace</span>
              <span className="hidden text-neutral-500 sm:inline">/</span>
              <span className="font-medium">
                {activeSection?.label ?? "Overview"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-neutral-500 md:inline">
              {formattedToday}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-semibold text-neutral-200">
              DT
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 pb-28 pt-8 sm:px-8 lg:pb-12">
          {section === "dashboard" ? (
            <>
              <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-[#f5f5f5]">
                    {formattedToday}
                  </p>
                  <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    {currentGreeting} 👋
                  </h2>
                  <p className="mt-3 text-sm text-neutral-400">
                    Your personal space to focus, plan, and make progress.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("tasks")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f5f5f5] px-5 py-3 text-sm font-semibold text-[#090909] transition hover:bg-neutral-200"
                >
                  <Plus size={18} />
                  Manage tasks
                </button>
              </div>

              <div className="mb-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
                <StatCard
                  title="Total Tasks"
                  value={loaded ? String(tasks.length) : "—"}
                  description="Tasks in your workspace"
                  icon={ListTodo}
                />
                <StatCard
                  title="Completed"
                  value={loaded ? String(completedCount) : "—"}
                  description="Finished tasks"
                  icon={CheckCircle2}
                />
                <StatCard
                  title="Pending"
                  value={loaded ? String(pendingCount) : "—"}
                  description="Tasks to complete"
                  icon={Clock3}
                />
                <StatCard
                  title="Progress"
                  value={loaded ? `${progress}%` : "—"}
                  description="Task completion rate"
                  icon={Activity}
                />
              </div>

              <div className="mb-7 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
                <div className="rounded-2xl border border-white/10 bg-[#171717] p-5 sm:p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Task progress</h3>
                      <p className="mt-1 text-xs text-neutral-500">
                        Your overall completion rate
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-[#f5f5f5]">
                      {progress}%
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-neutral-300 to-white transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="mt-4 flex justify-between text-xs text-neutral-500">
                    <span>{completedCount} completed</span>
                    <span>{pendingCount} remaining</span>
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-2xl border border-white/15 bg-gradient-to-br from-[#272727] via-[#171717] to-[#171717] p-5 sm:p-6">
                  <div className="flex items-center gap-2 text-neutral-200">
                    <Target size={18} />
                    <h3 className="font-semibold">Stay consistent</h3>
                  </div>
                  <p className="my-4 text-sm leading-6 text-neutral-300">
                    Start small. Complete one important task and build momentum
                    throughout your day.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("tasks")}
                    className="flex items-center gap-2 text-sm font-semibold text-[#f5f5f5] hover:text-neutral-200"
                  >
                    View your tasks <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="mb-8">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-[#f5f5f5]">
                DASHTRACKER WORKSPACE
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {activeSection?.label}
              </h2>
              <p className="mt-3 text-sm text-neutral-400">
                {section === "tasks"
                  ? "Organize everything you want to get done."
                  : "This module will be built in an upcoming milestone."}
              </p>
            </div>
          )}

          {showingTasks ? (
            <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#171717]">
              <div className="border-b border-white/10 p-5 sm:p-6">
                <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {section === "dashboard" ? "Your tasks" : "Task manager"}
                    </h3>
                    <p className="mt-1 text-xs text-neutral-500">
                      {pendingCount} pending · {completedCount} completed
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-neutral-400">
                    <CheckCircle2 size={15} />
                    Saved in this browser
                  </div>
                </div>

                <form
                  onSubmit={addTask}
                  className="flex flex-col gap-3 sm:flex-row"
                >
                  <input
                    ref={taskInputRef}
                    type="text"
                    value={taskInput}
                    onChange={(event) => {
                      setTaskInput(event.target.value);
                      setTaskMessage("");
                    }}
                    placeholder="What do you need to do?"
                    maxLength={200}
                    aria-label="New task title"
                    aria-describedby="task-form-message"
                    className="h-12 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#090909] px-4 text-sm text-white outline-none transition placeholder:text-neutral-500 focus:border-white/40"
                  />
                  <button
                    type="submit"
                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#f5f5f5] px-5 text-sm font-semibold text-[#090909] transition hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <Plus size={18} />
                    Add Task
                  </button>
                </form>
                <p
                  id="task-form-message"
                  role="status"
                  aria-live="polite"
                  className="mt-2 min-h-5 text-xs text-neutral-400"
                >
                  {taskMessage || "Type a task and press Enter or click Add Task."}
                </p>
              </div>

              <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex gap-1">
                  {(["all", "active", "done"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilter(value)}
                      className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition ${
                        filter === value
                          ? "bg-[#f5f5f5] text-[#090909]"
                          : "text-neutral-400 hover:bg-white/10"
                      }`}
                    >
                      {value === "done" ? "Completed" : value}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                  />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search tasks..."
                    aria-label="Search tasks"
                    className="h-9 w-full rounded-lg border border-white/10 bg-[#090909] pl-9 pr-3 text-xs outline-none focus:border-white/40 sm:w-52"
                  />
                </div>
              </div>

              <div className="divide-y divide-white/5">
                {!loaded ? (
                  <p className="p-10 text-center text-sm text-neutral-500">
                    Loading your tasks...
                  </p>
                ) : visibleTasks.length === 0 ? (
                  <div className="flex flex-col items-center px-5 py-14 text-center">
                    <div className="mb-4 rounded-2xl bg-white/5 p-4 text-neutral-500">
                      <ListTodo size={30} />
                    </div>
                    <h4 className="font-semibold">
                      {tasks.length === 0
                        ? "Your task list is empty"
                        : "No matching tasks"}
                    </h4>
                    <p className="mt-2 max-w-sm text-sm text-neutral-500">
                      {tasks.length === 0
                        ? "Add your first task above and start making progress."
                        : "Try changing your filter or search."}
                    </p>
                  </div>
                ) : (
                  visibleTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-4 transition hover:bg-white/[0.025] sm:px-6"
                    >
                      <button
                        type="button"
                        aria-label={
                          task.completed
                            ? `Mark ${task.title} incomplete`
                            : `Complete ${task.title}`
                        }
                        onClick={() => toggleTask(task.id)}
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
                          task.completed
                            ? "border-white/40 bg-[#f5f5f5] text-[#090909]"
                            : "border-neutral-600 text-transparent hover:border-white"
                        }`}
                      >
                        <Check size={14} />
                      </button>

                      <div className="min-w-0 flex-1">
                        {editingId === task.id ? (
                          <form onSubmit={saveEdit} className="flex flex-wrap items-center gap-2">
                            <input
                              autoFocus
                              aria-label="Edit task title"
                              value={editingTitle}
                              maxLength={200}
                              onChange={(event) => setEditingTitle(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Escape") cancelEdit();
                              }}
                              className="h-9 min-w-0 flex-1 rounded-lg border border-neutral-600 bg-[#090909] px-3 text-sm text-white outline-none focus:border-neutral-300"
                            />
                            <button type="submit" disabled={!editingTitle.trim()} aria-label="Save task" className="rounded-lg bg-white p-2 text-black disabled:opacity-40"><Check size={16} /></button>
                            <button type="button" onClick={cancelEdit} aria-label="Cancel editing" className="rounded-lg border border-white/15 p-2 text-neutral-300"><X size={16} /></button>
                          </form>
                        ) : (
                          <p className={`break-words text-sm ${task.completed ? "text-neutral-500 line-through" : "text-neutral-200"}`}>
                            {task.title}
                          </p>
                        )}
                        <p className="mt-1 text-[11px] text-neutral-500">
                          Added{" "}
                          {new Date(task.createdAt).toLocaleDateString("en-IN")}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => beginEdit(task)}
                        aria-label={`Edit ${task.title}`}
                        title="Edit task"
                        className="rounded-lg p-2 text-neutral-500 transition hover:bg-white/10 hover:text-white"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTask(task.id)}
                        aria-label={`Delete ${task.title}`}
                        title="Delete task"
                        className="rounded-lg p-2 text-neutral-500 transition hover:bg-white/10 hover:text-white"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-[#171717] p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-[#f5f5f5]">
                {activeSection && <activeSection.icon size={26} />}
              </div>
              <h3 className="text-lg font-semibold">
                {activeSection?.label} is coming soon
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-400">
                We&apos;re building DashTracker one working feature at a time.
                The task manager is ready for you to use now.
              </p>
              <button
                type="button"
                onClick={() => navigate("dashboard")}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#f5f5f5] px-5 py-3 text-sm font-semibold text-[#090909] hover:bg-neutral-200"
              >
                Back to dashboard <ArrowRight size={16} />
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-white/10 bg-[#151515]/95 px-2 py-2 backdrop-blur-xl lg:hidden">
        {[
          { id: "dashboard" as Section, label: "Home", icon: LayoutDashboard },
          { id: "tasks" as Section, label: "Tasks", icon: ListTodo },
          { id: "calendar" as Section, label: "Calendar", icon: CalendarDays },
          { id: "habits" as Section, label: "Habits", icon: Flame },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => navigate(id)}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg py-2 text-[10px] ${
              section === id
                ? "text-[#f5f5f5]"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Icon size={19} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#171717] p-4 transition hover:border-white/25 sm:p-5">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-xs font-medium text-neutral-400">{title}</p>
        <div className="rounded-lg bg-white/10 p-2 text-[#f5f5f5]">
          <Icon size={17} />
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight sm:text-3xl">
        {value}
      </p>
      <p className="mt-2 text-[11px] text-neutral-500">{description}</p>
    </div>
  );
}
