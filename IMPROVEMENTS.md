# Dashboard Improvements — commit `d5476b9`

Local-runnable guide to what changed in `apps/web/src/app/(dashboard)/dashboard/page.tsx` (and a related fix in `…/memories/page.tsx`).

> Run locally: `pnpm dev` from `apps/web`, then visit `/dashboard`.

---

## 1. Stats grid — before vs after

The list call returns `{ data, total }` where `data` is **sliced to 5** for the dashboard. The previous code showed `memories.length` for two cards, so they were always `5` (or whatever made it into the slice).

### Before

```
+--------------------+  +--------------------+  +--------------------+
|  Brain             |  |  TrendingUp        |  |  Sparkles          |
|                    |  |                    |  |                    |
|        5           |  |        5           |  |  (not shown)       |
|  Total Memories    |  |  This Week         |  |                    |
+--------------------+  +--------------------+  +--------------------+
       ^buggy                  ^buggy                ^didn't exist
```

### After

```
+--------------------+  +--------------------+  +--------------------+
|  Brain             |  |  TrendingUp        |  |  Sparkles          |
|                    |  |                    |  |                    |
|       42           |  |        7           |  |        5           |
|  Total Memories    |  |  This Week         |  |  Recent (Dashboard)|
+--------------------+  +--------------------+  +--------------------+
       ^from API            ^last-7d filter         ^list length
       `response.total`     on `memories[]`         on `memories[]`
```

### How each card is computed now

`apps/web/src/app/(dashboard)/dashboard/page.tsx:43-51`

```tsx
const oneWeekAgo = new Date();
oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
const thisWeekCount = memories.filter(m => new Date(m.createdAt) >= oneWeekAgo).length;

const stats = [
  { label: 'Total Memories',     value: String(totalCount),    icon: Brain,      color: 'primary'   },
  { label: 'This Week',          value: String(thisWeekCount),  icon: TrendingUp, color: 'secondary' },
  { label: 'Recent (Dashboard)', value: String(memories.length),icon: Sparkles,   color: 'accent'    },
];
```

`totalCount` is fed from the server response, not the slice — `apps/web/src/app/(dashboard)/dashboard/page.tsx:26-37`:

```tsx
const fetchMemories = useCallback(async () => {
  try {
    const response = await api.memories.list();
    setMemories(response.data.slice(0, 5));
    setTotalCount(response.total); // <-- real count, not 5
  } catch (error) {
    addToast('error', 'Failed to load memories. Please try again.');
  } finally { setLoading(false); }
}, [addToast]);
```

---

## 2. Action handlers — `onRemind`, `onArchive`, `onDelete`

All three previously just `console.log`'d. They now do real work and surface feedback via the existing `useToast()` hook.

### `onRemind` → opens "Set Reminder" modal, calls API

`page.tsx:53-77`

```tsx
const handleRemind = (memory: Memory) => {
  const defaultDate = new Date(Date.now() + 60 * 60 * 1000); // +1h
  setRemindModal({ memory, remindAt: toLocalDatetimeInputValue(defaultDate) });
};

const submitRemind = async () => {
  if (!remindModal) return;
  const { memory, remindAt } = remindModal;
  setSubmittingRemind(true);
  try {
    const isoRemindAt = new Date(remindAt).toISOString();
    const reminder: Reminder = await api.reminders.create({
      memoryId: memory.id,
      remindAt: isoRemindAt,
    });
    addToast('success', `Reminder set for "${memory.content.slice(0, 30)}..."`);
    setRemindModal(null);
  } catch (error) {
    addToast('error', 'Failed to set reminder. Please try again.');
  } finally { setSubmittingRemind(false); }
};
```

### `onArchive` → "coming soon" toast (backend not ready yet)

`page.tsx:79-85`

```tsx
const handleArchive = async (memory: Memory) => {
  addToast('info', `Archive coming soon for "${memory.content.slice(0, 30)}..."`);
};
```

### `onDelete` → confirm → API → optimistic UI update

`page.tsx:87-98`

```tsx
const handleDelete = async (memory: Memory) => {
  if (!confirm(`Delete this memory?\n\n"${memory.content.slice(0, 80)}"`)) return;
  try {
    await api.memories.delete(memory.id);
    setMemories(prev => prev.filter(m => m.id !== memory.id));
    setTotalCount(prev => Math.max(0, prev - 1));
    addToast('success', 'Memory deleted.');
  } catch (error) {
    addToast('error', 'Failed to delete memory. Please try again.');
  }
};
```

Note: optimistic update on both `memories` (remove the row) **and** `totalCount` (decrement, clamped to 0). The card animates out via `AnimatePresence` because `MemoryCard` is keyed by `memory.id`.

---

## 3. "Set Reminder" modal

Same dark glass-morphism language as the rest of the app: blurred backdrop, `rounded-3xl` surface card, gradient icon badge, `AnimatePresence` enter/exit (`scale: 0.95` → `1`).

`page.tsx:248-317`

```
+----------------------------------------------------------+
|  (click-outside or X to close; disabled while submitting)|
|   +--------------------------------------------------+   |
|   |  [Bell]  Set Reminder                       [X]  |   |
|   |         "<memory content line-clamped to 1 line>" |   |
|   |--------------------------------------------------|   |
|   |  When to remind you                                |   |
|   |  [ 2026-06-01T13:45        ]  (datetime-local)    |   |
|   |--------------------------------------------------|   |
|   |  [ Cancel ]            [   Set Reminder   ]       |   |
|   +--------------------------------------------------+   |
+----------------------------------------------------------+
```

Key UX details:
- Default value = `now + 1h`, formatted for `<input type="datetime-local">` via the `toLocalDatetimeInputValue()` helper at `page.tsx:13-16`.
- Backdrop click is ignored while `submittingRemind === true` so an in-flight request can't be cancelled mid-write.
- "Set Reminder" submit is disabled when `remindAt` is empty or a request is in flight.
- Memory content line is clamped (`line-clamp-1`) so long memories don't blow up the header.

---

## 4. Toast system used for all feedback

`useToast()` from `apps/web/src/components/ui/Toast.tsx`. Stacked bottom-right, 4s default, with type-specific icon + tinted background:

| Type    | Icon           | Tint                          |
|---------|----------------|-------------------------------|
| success | `CheckCircle`  | `bg-secondary-500/10` (green) |
| error   | `AlertCircle`  | `bg-destructive-500/10` (red) |
| info    | `Info`         | `bg-primary-500/10` (indigo)  |
| warning | `AlertTriangle`| `bg-accent-500/10` (amber)    |

The new code emits these messages:

- `success` — "Memory deleted." / `Reminder set for "<first 30 chars>..."`
- `error` — "Failed to load memories. Please try again." / "Failed to set reminder. Please try again." / "Failed to delete memory. Please try again."
- `info` — `Archive coming soon for "<first 30 chars>..."`

---

## 5. Stale-closure fix in `memories/page.tsx`

`apps/web/src/app/(dashboard)/dashboard/memories/page.tsx:52-61` — `addToast` was being read inside the callback but missing from the `useCallback` dep array, which means an old `addToast` reference could be captured (and the `eslint-plugin-react-hooks` `exhaustive-deps` rule would flag it).

```diff
- const fetchMemories = useCallback(async () => {
+ const fetchMemories = useCallback(async () => {
    try {
      const response = await api.memories.list();
      setMemories(response.data);
    } catch (error) {
      addToast('error', 'Failed to load memories. Please try again.');
    } finally { setLoading(false); }
-  }, []);
+  }, [addToast]);
```

---

## What to look for when you run it locally

1. **Stats look right** — `Total Memories` should equal what `/memories` page shows; `This Week` should be ≤ Total; `Recent` should be ≤ 5 (it's the dashboard slice).
2. **Bell icon on a memory row** opens the "Set Reminder" modal; pick a time and submit → green success toast in the bottom-right.
3. **Trash icon** → native `confirm()` with the first 80 chars of content → on OK, the card animates out, `Total` decrements by 1, green toast.
4. **Archive icon** → indigo info toast ("Archive coming soon…") — no API call, no state change.
5. **Network failures** show a red toast and the dashboard state stays consistent (no decrement on failed delete).
6. **Modal safety** — backdrop click during submission is a no-op; `X` and Cancel are disabled while `submittingRemind`.
