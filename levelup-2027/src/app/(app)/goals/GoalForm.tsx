"use client";
import { useState } from "react";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { useDialog } from "@/ui/dialog";
import { useRouter } from "next/navigation";
import { saveGoalAction } from "./actions";

export const CATEGORY_LABEL: Record<string, string> = {
  FINANCE: "Finance", FITNESS: "Fitness", FAITH: "Faith", RELATIONSHIP: "Relationship", EDUCATION: "Education", CAREER: "Career",
  COMMUNICATION: "Communication", READING: "Reading", LEARNING: "Learning", DISCIPLINE: "Discipline", TIME_MANAGEMENT: "Time management",
  PROJECT: "Personal project", PERSONAL: "Personal",
};
const SOURCE_LABEL: Record<string, string> = {
  MANUAL: "I'll update it myself", MILESTONES: "Completed milestones", TASKS: "Completed linked tasks", HABIT: "Habit check-ins",
  CHALLENGE: "A financial challenge (confirmed transfers)", WORKOUTS: "Logged workouts", ACTIVITY: "Logged practice/study minutes",
};

export interface GoalFormValues {
  id?: string; title?: string; description?: string | null; category?: string; horizon?: string; priority?: string; startDate?: string;
  targetDate?: string | null; unit?: string | null; target?: number | null; source?: string; challengeId?: string | null; habitId?: string | null;
  activityKind?: string | null; notes?: string | null;
}

export function GoalForm({ v, today, challenges, habits }: { v?: GoalFormValues; today: string; challenges: { id: string; name: string; status: string }[]; habits: { id: string; name: string }[] }) {
  const [source, setSource] = useState(v?.source ?? "MILESTONES");
  const router = useRouter();
  const dialog = useDialog();
  return (
    <ActionForm action={saveGoalAction} className="space-y-4" onSuccess={() => { router.refresh(); dialog.close(); }}>
      {v?.id && <input type="hidden" name="id" value={v.id} />}
      <Field label="Goal"><input className="input" name="title" defaultValue={v?.title} required maxLength={120} placeholder="e.g. Build a 3x/week training habit" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Area"><select className="input" name="category" defaultValue={v?.category ?? "PERSONAL"}>{Object.entries(CATEGORY_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        <Field label="Timeframe"><select className="input" name="horizon" defaultValue={v?.horizon ?? "QUARTER"}><option value="YEAR">Year</option><option value="QUARTER">Quarter</option><option value="MONTH">Month</option><option value="WEEK">Week</option></select></Field>
        <Field label="Start"><input className="input" type="date" name="startDate" defaultValue={v?.startDate ?? today} required /></Field>
        <Field label="Target date"><input className="input" type="date" name="targetDate" defaultValue={v?.targetDate ?? ""} /></Field>
        <Field label="Priority"><select className="input" name="priority" defaultValue={v?.priority ?? "MEDIUM"}><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option></select></Field>
      </div>
      <Field label="Progress comes from">
        <select className="input" name="source" value={source} onChange={(e) => setSource(e.target.value)}>{Object.entries(SOURCE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      </Field>
      {source === "CHALLENGE" && (
        <Field label="Financial challenge" hint="Reads confirmed Phase 2 transfers — no money is duplicated.">
          <select className="input" name="challengeId" defaultValue={v?.challengeId ?? ""} required><option value="" disabled>Choose…</option>{challenges.map((c) => <option key={c.id} value={c.id} disabled={c.status === "SETUP_REQUIRED"}>{c.name}{c.status === "SETUP_REQUIRED" ? " (setup required)" : ""}</option>)}</select>
        </Field>
      )}
      {source === "HABIT" && <Field label="Habit"><select className="input" name="habitId" defaultValue={v?.habitId ?? ""} required><option value="" disabled>Choose…</option>{habits.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select></Field>}
      {source === "ACTIVITY" && <Field label="Which logged time counts"><select className="input" name="activityKind" defaultValue={v?.activityKind ?? "READING"}>{["STUDY", "SPEAKING", "READING", "LEARNING", "PROJECT", "DISCIPLINE", "CAREER_PREP", "OTHER"].map((k) => <option key={k} value={k}>{k.replace("_", " ").toLowerCase()}</option>)}</select></Field>}
      {["MANUAL", "HABIT", "CHALLENGE", "WORKOUTS", "ACTIVITY"].includes(source) && (
        <div className="grid grid-cols-2 gap-3">
          <Field label={source === "CHALLENGE" ? "Target ($)" : source === "ACTIVITY" ? "Target (minutes)" : "Target"}><input className="input" name="target" inputMode="decimal" defaultValue={v?.target ?? ""} required={source !== "MANUAL"} /></Field>
          {source === "MANUAL" && <Field label="Unit"><input className="input" name="unit" defaultValue={v?.unit ?? ""} placeholder="e.g. lb, books" maxLength={20} /></Field>}
        </div>
      )}
      {!v?.id && source === "MILESTONES" && <Field label="Milestones (one per line)"><textarea className="input min-h-[96px] py-2" name="milestones" placeholder={"Step 1\nStep 2"} /></Field>}
      <Field label="Why it matters (optional)"><input className="input" name="description" defaultValue={v?.description ?? ""} maxLength={300} /></Field>
      <Field label="Private notes (encrypted)"><textarea className="input min-h-[64px] py-2" name="notes" defaultValue={v?.notes ?? ""} maxLength={2000} /></Field>
      <SubmitButton className="btn-primary w-full">{v?.id ? "Save goal" : "Create goal"}</SubmitButton>
    </ActionForm>
  );
}
