# MemoraX - Purpose Reminder

## What it is
A personal AI assistant in the spirit of [memorae.ai](https://memorae.ai) — captures everything (notes, tasks, reminders, voice, images) across channels, understands intent, remembers it all in a semantic knowledge graph, and surfaces what matters at the right time.

## The twist: built for students
Not just a generic life-OS. The default mode assumes the user is a **student**. That means:

- **Capture** is tuned for class notes, lectures, reading lists, assignments, exam prep.
- **Briefings** adapt to academic rhythm — syllabus deadlines, class schedules, revision cycles, semester calendars.
- **Memory model** understands study entities: courses, subjects, chapters, problems, formulas, citations, sources.
- **Onboarding** asks for school/uni, subjects, year, exam timeline — not just "what do you want to remember?"

## Must-have feature: AI Tutor (integrated)
Not a bolt-on. Lives inside the same memory layer the assistant uses, so it knows what the student has learned, struggled with, and is currently studying.

Core tutor capabilities:
- **Explain** any concept pulled from their notes / sources in their own context.
- **Quiz me** — auto-generate questions from saved notes, spaced-repetition style.
- **Step-by-step problem solving** for math / CS / science, with worked examples.
- **Socratic mode** — asks guiding questions instead of giving answers.
- **Summarize** long readings, lectures (voice memos), or chapters.
- **Study plan** generator based on upcoming deadlines + weak areas detected in past sessions.
- **Citation-aware** — when answering, links back to the student's own saved sources (not just generic web).

## North-star sentence
> *MemoraX is the AI assistant that remembers your life — and for students, it doubles as a private tutor that actually knows what you've studied.*

## Must-have integration: Google Classroom
Students already live in Google Classroom. MemoraX should plug into it, not replace it. One-click OAuth connect during onboarding.

What gets synced (read):
- **Courses** → auto-create matching `Spaces` / subjects in the knowledge graph.
- **Assignments & due dates** → flow into the reminder system + briefing engine alongside other deadlines.
- **Class materials & attachments** (PDFs, Docs, Slides, links) → ingested as sources the tutor can cite, just like user-uploaded notes.
- **Announcements** → surfaced in daily briefing when relevant.
- **Roster & teacher posts** → optional context for the tutor (e.g. "what's Mr. X's teaching style on this topic").

What MemoraX writes back (optional, user-controlled):
- **Submission status** — mark an assignment as done from MemoraX; reflects in Classroom.
- **Notes attached to an assignment** — saved notes per coursework item, visible in the Classroom assignment view if teacher allows.

Key rules:
- OAuth scopes must be **minimal & explicit** — show the user exactly what's being read/written.
- Sync is **bidirectional but opt-in per feature**. Never silently write to Classroom.
- A student can use MemoraX **without** Classroom. It enhances, doesn't gate.
- Token refresh + revocation must be handled — and "disconnect Classroom" must wipe the synced cache.
- Classroom API rate limits need to be respected; sync via background job, not on every page load.

## Don't forget
- The student angle is the **differentiation**, not a separate product. Same memory, same UI shell, same channels — just student-aware by default.
- Tutor sessions must write back into the knowledge graph (weak topics, mastered topics, new entities) so the assistant gets smarter over time.
- Google Classroom is the **anchor integration** for the student experience — plan the data model so courses/assignments are first-class entities, not afterthoughts.
- Privacy matters more here — student data is sensitive. Defaults should be private-by-default, and Classroom data should be treated with the same care.
