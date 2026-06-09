# Requirements: MemoraX Student Edition

## Context

MemoraX today is a multi-channel memory assistant (WhatsApp, Telegram, Slack) that captures content, runs AI pipeline (intent + entities + embeddings), and surfaces reminders + serendipitous memories. Architecture: Express backend + Next.js 14 dashboard + PostgreSQL with Drizzle + Gemini/OpenAI.

**MemoraX must become:** A student AI tutor + reminder assistant where students ask homework questions, get explanations, capture assignments, get reminded of due dates, and parents can link to monitor progress. Google Classroom syncs assignments automatically.

---

## 1. Product Vision

**MemoraX Student Edition** transforms the existing memory assistant into a **student-focused AI tutor** that:

1. **Captures schoolwork automatically** — assignments, due dates, and study materials flow in via WhatsApp (the channel students already use)
2. **Answers homework questions with explanations** — AI tutor provides subject-agnostic explanations, not just answers
3. **Reminds students before deadlines** — proactive notifications via WhatsApp before assignments are due
4. **Keeps parents informed** — family linking allows parents to view progress without micromanaging
5. **Syncs with Google Classroom** — assignments from teachers appear automatically in MemoraX

**Core principle:** Students interact via WhatsApp (familiar, always available). Parents use the dashboard (detailed view). AI tutor operates silently in the background.

---

## 2. User Stories

### 2.1 Student (Primary User)

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| S-01 | As a student, I can ask an AI homework question via WhatsApp and receive an explanation | Message sent to WhatsApp ? AI tutor responds with explanation within 30 seconds |
| S-02 | As a student, I can capture a homework assignment by saying \"assignment: math homework, due Friday\" | Assignment created with subject, title, due date, and status = pending |
| S-03 | As a student, I can view my upcoming assignments via WhatsApp command \"show assignments\" | List of assignments returned with subject, title, due date, and status |
| S-04 | As a student, I receive WhatsApp reminders 24h and 1h before assignment deadlines | Two reminder notifications sent at configured intervals |
| S-05 | As a student, I can get a daily study briefing each morning | Briefing generated at 7am local time with upcoming assignments and suggested study topics |
| S-06 | As a student, I can capture voice notes about homework and have them transcribed | Voice message ? transcription ? assignment extraction |
| S-07 | As a student, I can see my assignments on the dashboard | Full assignment list with filtering by subject, status, due date |
| S-08 | As a student, I can mark assignments as complete | Status changes from pending ? completed |
| S-09 | As a student, I can ask follow-up questions to get deeper explanations | Thread-based conversation preserves context |

### 2.2 Parent (Secondary User)

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| P-01 | As a parent, I can create a family link code and share it with my child | Unique 8-character code generated, valid for 24h |
| P-02 | As a parent, I can link to my child's account using their student code | Parent account ? child account link established with consent |
| P-03 | As a parent, I can view my child's pending assignments | Dashboard shows child's assignments with subject, title, due date |
| P-04 | As a parent, I receive notifications when my child's deadlines are approaching | Parent gets WhatsApp notification when child has assignment due within 24h |
| P-05 | As a parent, I can see my child's AI tutoring activity (optional, with consent) | Activity log shows recent questions and AI responses |
| P-06 | As a parent, I can unlink from my child's account at any time | Family link removed, no further data shared |

### 2.3 AI Tutor (System)

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| A-01 | Answer student questions with explanations, not just answers | Response includes step-by-step explanation or concept breakdown |
| A-02 | Extract homework details from messages (what, due date, subject) | Entity extraction identifies: title, subject, due date, description |
| A-03 | Generate daily study briefings | Briefing includes: upcoming deadlines, suggested review topics, study tips |
| A-04 | Suggest review topics based on upcoming tests | Analysis of assignments with same subject suggests study priorities |
| A-05 | Classify incoming messages as: question, assignment, reminder request, or casual | Intent classification with confidence score > 0.8 |

### 2.4 Google Classroom Integration

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| G-01 | As a student, I can connect my Google Classroom account via OAuth | OAuth flow completes, courses imported |
| G-02 | As a student, assignments from Google Classroom sync automatically | Assignments appear in MemoraX within 5 minutes of sync |
| G-03 | As a student, I can manually trigger a Classroom sync | Button triggers immediate sync, assignments updated |
| G-04 | As a student, Google Classroom assignments create MemoraX reminders | Reminder created automatically with due date from Classroom |

---

## 3. Feature Priorities

### Phase 1: MVP (Weeks 1-4)

**Must-have for initial release:**

1. **WhatsApp AI Tutoring** — Student sends question ? AI tutor responds with explanation
2. **Assignment Capture** — Parse \"assignment: [title], due [date]\" from WhatsApp messages
3. **Assignment Reminders** — Cron job sends WhatsApp reminders before deadlines
4. **Student Dashboard** — View, add, complete assignments
5. **Basic Family Linking** — Parent generates code ? links to child account

**Out of scope for Phase 1:**
- Google Classroom integration
- Voice note transcription for assignments
- Daily study briefings
- Parent notification preferences

### Phase 2: Enhanced (Weeks 5-8)

1. **Google Classroom OAuth + Sync** — Connect account, import courses/assignments
2. **Daily Study Briefings** — AI-generated morning digest
3. **Voice Assignment Capture** — Transcribe voice notes ? extract assignment
4. **Parent Notification Preferences** — Configurable alert thresholds

### Phase 3: Polish (Weeks 9-12)

1. **Thread-based Follow-up Questions** — Conversation context preservation
2. **Study Topic Suggestions** — ML-based review recommendations
3. **Activity Log for Parents** — AI tutoring history view
4. **Reminder Snooze & Reschedule** — Student can adjust reminders

---

## 4. Success Metrics

### Engagement Metrics

| Metric | Target (Month 1) | Target (Month 3) |
|--------|-----------------|-----------------|
| Daily active students | 50 | 200 |
| WhatsApp messages processed | 500/day | 2000/day |
| Assignments created per student (avg) | 3/week | 5/week |
| AI tutoring questions per student (avg) | 2/day | 5/day |
| Reminder delivery rate | 95% | 98% |
| Family links established | 20 | 100 |

### Quality Metrics

| Metric | Target |
|--------|--------|
| AI tutor response time (p95) | < 30 seconds |
| AI tutor accuracy (factual questions) | > 85% |
| Assignment extraction accuracy | > 90% |
| Reminder accuracy (sent before deadline) | 100% |
| Google Classroom sync reliability | > 99% |

### Business Metrics

| Metric | Target |
|--------|--------|
| Student retention (30-day) | > 60% |
| Parent activation rate (from family links) | > 70% |
| Net Promoter Score (student) | > 40 |
| Support tickets per 100 students | < 5 |

---

## 5. Data Handling Principles

1. **Student owns their data** — All memories, assignments, and AI conversations belong to the student
2. **Family linking is opt-in** — Student must explicitly share a code to link with parent
3. **Parent sees limited data** — Only assignments and (optionally) AI tutoring activity
4. **No AI training on student data** — All AI processing is inference-only
5. **Data retention** — Student can delete all data at any time
6. **Google Classroom data** — Only used for assignment sync, not stored beyond sync duration

---

## 6. Constraints

1. **WhatsApp is primary interface** — Students interact via WhatsApp, not just dashboard
2. **Don't break existing functionality** — Memory capture, reminders, and briefing must continue working
3. **Extend existing AI pipeline** — Add tutoring intent, don't replace classification
4. **Privacy-respecting family links** — Student controls what parent sees
5. **Use existing infrastructure** — PostgreSQL/Drizzle, Express, Next.js 14
