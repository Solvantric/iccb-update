"use client";
import { useState } from "react";
import { CheckCircle, Circle, Plus, Trash, Flag, CalendarBlank, User } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";

type Priority = "high" | "medium" | "low";
type Category = "setup" | "catering" | "logistics" | "av" | "admin" | "follow-up";

interface Task {
  id: string;
  title: string;
  done: boolean;
  priority: Priority;
  category: Category;
  assignee: string;
  dueDate: string;
  booking?: string;
}

const INITIAL_TASKS: Task[] = [
  { id: "t1", title: "Confirm stage dimensions with decoration team", done: false, priority: "high", category: "setup", assignee: "Rafi Ahmed", dueDate: "2026-11-12", booking: "ICCB-2026-001" },
  { id: "t2", title: "Send final menu to catering for Hall A wedding", done: false, priority: "high", category: "catering", assignee: "Nasreen Islam", dueDate: "2026-11-11", booking: "ICCB-2026-001" },
  { id: "t3", title: "Arrange shuttle bus for expo guests (Day 1)", done: true, priority: "medium", category: "logistics", assignee: "Farhan Khan", dueDate: "2026-11-15", booking: "ICCB-2026-003" },
  { id: "t4", title: "Test LED wall and PA system in Meghna Hall", done: false, priority: "high", category: "av", assignee: "Tanvir Hossain", dueDate: "2026-11-13", booking: "ICCB-2026-002" },
  { id: "t5", title: "Follow up with BGMEA on sponsorship contract", done: false, priority: "medium", category: "follow-up", assignee: "Rafi Ahmed", dueDate: "2026-11-14" },
  { id: "t6", title: "Send invoice to Bangladesh Tech Expo organiser", done: true, priority: "low", category: "admin", assignee: "Nasreen Islam", dueDate: "2026-11-10", booking: "ICCB-2026-003" },
  { id: "t7", title: "Confirm parking arrangement for 500 cars", done: false, priority: "medium", category: "logistics", assignee: "Farhan Khan", dueDate: "2026-11-16" },
  { id: "t8", title: "Prepare post-event feedback forms", done: false, priority: "low", category: "admin", assignee: "Nasreen Islam", dueDate: "2026-11-18" },
  { id: "t9", title: "Brief security team on guest entry flow", done: false, priority: "high", category: "setup", assignee: "Tanvir Hossain", dueDate: "2026-11-12" },
  { id: "t10", title: "Order fresh floral arrangements for heritage hall", done: true, priority: "medium", category: "setup", assignee: "Rafi Ahmed", dueDate: "2026-11-11" },
];

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string }> = {
  high: { label: "High", color: "text-red-600 dark:text-red-400 bg-red-500/10", dot: "bg-red-500" },
  medium: { label: "Medium", color: "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10", dot: "bg-yellow-500" },
  low: { label: "Low", color: "text-green-600 dark:text-green-400 bg-green-500/10", dot: "bg-green-500" },
};

const CATEGORY_LABELS: Record<Category, string> = {
  setup: "Setup", catering: "Catering", logistics: "Logistics",
  av: "AV & Tech", admin: "Admin", "follow-up": "Follow-up",
};

const CATEGORIES: Category[] = ["setup", "catering", "logistics", "av", "admin", "follow-up"];

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const [catFilter, setCatFilter] = useState<Category | "all">("all");
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");

  const toggle = (id: string) => setTasks((ts) => ts.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  const remove = (id: string) => setTasks((ts) => ts.filter((t) => t.id !== id));

  const addTask = () => {
    if (!newTitle.trim()) return;
    const task: Task = {
      id: `t${Date.now()}`,
      title: newTitle.trim(),
      done: false,
      priority: newPriority,
      category: "admin",
      assignee: "Unassigned",
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    };
    setTasks((ts) => [task, ...ts]);
    setNewTitle("");
  };

  const filtered = tasks.filter((t) => {
    const matchStatus = filter === "all" || (filter === "done" ? t.done : !t.done);
    const matchCat = catFilter === "all" || t.category === catFilter;
    return matchStatus && matchCat;
  });

  const doneCount = tasks.filter((t) => t.done).length;
  const pendingCount = tasks.length - doneCount;
  const highCount = tasks.filter((t) => t.priority === "high" && !t.done).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl text-[var(--ink)] font-light uppercase">Task Manager</h1>
        <p className="text-[var(--ink-muted)] text-[13px] mt-0.5">Event preparation and follow-up tasks</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pending", value: pendingCount, color: "text-yellow-600 dark:text-yellow-400" },
          { label: "Completed", value: doneCount, color: "text-green-600 dark:text-green-400" },
          { label: "High Priority", value: highCount, color: "text-red-600 dark:text-red-400" },
        ].map((s) => (
          <div key={s.label} className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4 text-center">
            <p className={cn("font-display text-3xl font-light", s.color)}>{s.value}</p>
            <p className="text-[var(--ink-muted)] text-[11px] mt-1 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Add task */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Add a new task…"
            className="flex-1 bg-[var(--bg-soft)] border border-[var(--line)] rounded-lg px-3 py-2 text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
          />
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as Priority)}
            className="bg-[var(--bg-soft)] border border-[var(--line)] rounded-lg px-3 py-2 text-[13px] text-[var(--ink)] focus:outline-none"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button
            onClick={addTask}
            className="flex items-center gap-2 bg-[var(--accent)] text-white rounded-lg px-4 py-2 text-[12px] font-medium hover:bg-[var(--accent-hover)] transition-colors"
          >
            <Plus size={14} weight="bold" />
            Add
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-1.5 rounded-full text-[12px] font-medium capitalize transition-colors",
              filter === f ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-soft)] border border-[var(--line)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
            )}
          >
            {f}
          </button>
        ))}
        <div className="w-px bg-[var(--line)] mx-1 self-stretch" />
        <button
          onClick={() => setCatFilter("all")}
          className={cn(
            "px-4 py-1.5 rounded-full text-[12px] font-medium transition-colors",
            catFilter === "all" ? "bg-[var(--ink)] text-[var(--bg)]" : "bg-[var(--bg-soft)] border border-[var(--line)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
          )}
        >
          All categories
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCatFilter(catFilter === cat ? "all" : cat)}
            className={cn(
              "px-4 py-1.5 rounded-full text-[12px] font-medium transition-colors",
              catFilter === cat ? "bg-[var(--ink)] text-[var(--bg)]" : "bg-[var(--bg-soft)] border border-[var(--line)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
            )}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center text-[var(--ink-muted)] text-[13px] py-10">No tasks match the current filter.</p>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {filtered.map((task) => (
              <div
                key={task.id}
                className={cn("flex items-start gap-3 px-5 py-4 hover:bg-[var(--bg-soft)] transition-colors", task.done && "opacity-60")}
              >
                <button onClick={() => toggle(task.id)} className="mt-0.5 flex-shrink-0 text-[var(--ink-muted)] hover:text-[var(--accent)] transition-colors">
                  {task.done
                    ? <CheckCircle size={20} weight="fill" className="text-green-500" />
                    : <Circle size={20} weight="regular" />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-[13px] text-[var(--ink)]", task.done && "line-through")}>{task.title}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <span className={cn("text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full", PRIORITY_CONFIG[task.priority].color)}>
                      <Flag size={8} weight="fill" className="inline me-1" />
                      {PRIORITY_CONFIG[task.priority].label}
                    </span>
                    <span className="text-[11px] text-[var(--ink-muted)] bg-[var(--bg-soft)] border border-[var(--line)] px-2 py-0.5 rounded-full">
                      {CATEGORY_LABELS[task.category]}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-[var(--ink-muted)]">
                      <User size={11} />
                      {task.assignee}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-[var(--ink-muted)]">
                      <CalendarBlank size={11} />
                      {task.dueDate}
                    </span>
                    {task.booking && (
                      <span className="text-[10px] text-[var(--accent-text)] font-medium">{task.booking}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => remove(task.id)}
                  className="mt-0.5 flex-shrink-0 text-[var(--ink-muted)] hover:text-red-500 transition-colors"
                >
                  <Trash size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
