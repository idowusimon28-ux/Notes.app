import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

export default function Notes({ user }) {
  const [notes, setNotes] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const active = notes.find((n) => n.id === activeId) ?? null
  const dirty = !!active && (active.title !== title || active.body !== body)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('notes')
      .select('id, title, body, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setError(error.message)
        else setNotes(data)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  function open(note) {
    if (dirty && !window.confirm('Discard unsaved changes?')) return
    setActiveId(note.id)
    setTitle(note.title)
    setBody(note.body)
  }

  async function createNote() {
    if (dirty && !window.confirm('Discard unsaved changes?')) return
    setBusy(true)
    setError('')
    // user_id is filled in by the database (default auth.uid()), never by the client.
    const { data, error } = await supabase
      .from('notes')
      .insert({ title: 'Untitled', body: '' })
      .select('id, title, body, created_at')
      .single()
    if (error) setError(error.message)
    else {
      setNotes((prev) => [data, ...prev])
      setActiveId(data.id)
      setTitle(data.title)
      setBody(data.body)
    }
    setBusy(false)
  }

  async function saveNote() {
    setBusy(true)
    setError('')
    const { data, error } = await supabase
      .from('notes')
      .update({ title, body })
      .eq('id', activeId)
      .select('id, title, body, created_at')
      .single()
    if (error) setError(error.message)
    else setNotes((prev) => prev.map((n) => (n.id === data.id ? data : n)))
    setBusy(false)
  }

  async function deleteNote() {
    if (!window.confirm('Delete this note? This cannot be undone.')) return
    setBusy(true)
    setError('')
    const { error } = await supabase.from('notes').delete().eq('id', activeId)
    if (error) setError(error.message)
    else {
      setNotes((prev) => prev.filter((n) => n.id !== activeId))
      setActiveId(null)
      setTitle('')
      setBody('')
    }
    setBusy(false)
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[320px_1fr]">
      <aside className="flex flex-col border-b border-line bg-white md:h-screen md:border-b-0 md:border-r">
        <header className="flex items-center justify-between gap-2 p-4">
          <h1 className="font-display text-2xl font-bold tracking-tight">Notes</h1>
          <button
            onClick={createNote}
            disabled={busy}
            className="rounded-md bg-ink px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            New note
          </button>
        </header>

        <ul className="max-h-64 flex-1 overflow-y-auto md:max-h-none">
          {loading && <li className="px-4 py-3 text-sm text-muted">Loading…</li>}
          {!loading && notes.length === 0 && (
            <li className="px-4 py-3 text-sm text-muted">No notes yet. Select New note to write your first.</li>
          )}
          {notes.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => open(n)}
                aria-current={n.id === activeId}
                className={`w-full border-t border-line px-4 py-3 text-left ${
                  n.id === activeId ? 'bg-mark' : 'hover:bg-paper'
                }`}
              >
                <span className="block truncate font-semibold">{n.title || 'Untitled'}</span>
                <span className="block text-xs text-muted">{formatDate(n.created_at)}</span>
              </button>
            </li>
          ))}
        </ul>

        <footer className="flex items-center justify-between gap-2 border-t border-line p-4 text-sm">
          <span className="truncate text-muted">{user.email}</span>
          <button onClick={() => supabase.auth.signOut()} className="underline underline-offset-4">
            Sign out
          </button>
        </footer>
      </aside>

      <main className="p-4 md:p-10">
        {error && <p role="alert" className="mb-4 text-sm text-danger">{error}</p>}

        {!active ? (
          <p className="text-muted">Select a note or create a new one.</p>
        ) : (
          <div className="mx-auto max-w-2xl">
            <input
              aria-label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full bg-transparent font-display text-4xl font-bold tracking-tight outline-none placeholder:text-muted/50"
            />
            <p className="mt-1 text-sm text-muted">Created {formatDate(active.created_at)}</p>
            <textarea
              aria-label="Note body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Start writing…"
              rows={16}
              className="mt-6 w-full resize-y rounded-md border border-line bg-white p-4 leading-relaxed"
            />
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={saveNote}
                disabled={!dirty || busy}
                className="rounded-md bg-ink px-4 py-2 font-semibold text-white disabled:opacity-40"
              >
                Save changes
              </button>
              <button onClick={deleteNote} disabled={busy} className="px-2 py-2 text-danger underline underline-offset-4">
                Delete note
              </button>
              {dirty && <span className="text-sm text-muted">Unsaved changes</span>}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
