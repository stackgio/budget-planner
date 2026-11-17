"use client";
import Link from "next/link";
import { useActionState, useRef } from "react";
import { Send } from "lucide-react";
import { useKeepValuesSubmit, PendingProvider, SubmitButton } from "@/ui/form";
import { askAction, type AskState } from "./actions";

export function AskBox({ suggestions }: { suggestions: string[] }) {
  const [state, action, pending] = useActionState<AskState, FormData>(askAction, null);
  const onSubmit = useKeepValuesSubmit(action);
  const input = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const ask = (q: string) => { if (input.current) input.current.value = q; formRef.current?.requestSubmit(); };
  return (
    <div className="space-y-4">
      <form ref={formRef} onSubmit={onSubmit} className="flex gap-2">
        <PendingProvider pending={pending}>
          <input ref={input} className="input" name="question" placeholder="Ask about your schedule, goals, money…" maxLength={300} aria-label="Question" autoComplete="off" />
          <SubmitButton className="btn-primary px-3" pendingText="…"><Send size={16} aria-label="Ask" /></SubmitButton>
        </PendingProvider>
      </form>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {suggestions.map((s) => <button key={s} type="button" onClick={() => ask(s)} className="shrink-0 rounded-full border border-ink-700 px-3 py-1.5 text-xs text-mute-300 hover:border-go/60 hover:text-white">{s}</button>)}
      </div>
      {state?.error && <p role="alert" className="text-sm text-bad">{state.error}</p>}
      {state?.answer && (
        <section className="card" aria-live="polite" aria-label="Answer">
          <p className="text-xs text-mute-400">You asked: “{state.question}”</p>
          <h2 className="mt-1 font-display text-lg font-bold">{state.answer.title}</h2>
          <ul className="mt-2 space-y-1.5 text-sm">{state.answer.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
          {state.answer.notes.map((n, i) => <p key={i} className="mt-2 text-xs text-mute-400">{n}</p>)}
          {state.answer.links.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{state.answer.links.map((l, i) => <Link key={i} href={l.href} className="btn-secondary btn-sm">{l.label}</Link>)}</div>}
        </section>
      )}
      <p className="text-xs text-mute-400">Answers come only from your saved LEVEL UP records. No AI service, no internet, nothing stored, and nothing is changed for you.</p>
    </div>
  );
}
