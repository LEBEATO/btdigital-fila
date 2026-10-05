import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

type TicketStatus = 'WAITING' | 'CALLED' | 'SERVING' | 'FINISHED' | 'CANCELLED'
type TicketPriority = 'NORMAL' | 'PRIORITY'

type Ticket = {
  id: number
  number: number
  code: string
  status: TicketStatus
  priority: TicketPriority
  counter: number | null
  createdAt: string
  calledAt: string | null
  startedAt: string | null
  finishedAt: string | null
}

const API_URL = 'http://localhost:3000'

function App() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [counter, setCounter] = useState(1)
  const [busy, setBusy] = useState(false)
  const [connected, setConnected] = useState(false)
  const [message, setMessage] = useState('Pronto para atender')

  const loadTickets = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/tickets`, { cache: 'no-store' })
      if (!response.ok) throw new Error('Falha ao carregar a fila')
      setTickets((await response.json()) as Ticket[])
      setConnected(true)
    } catch {
      setConnected(false)
      setMessage('Servidor indisponível')
    }
  }, [])

  useEffect(() => {
    void loadTickets()
    const timer = window.setInterval(() => void loadTickets(), 1000)
    const refresh = () => void loadTickets()
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [loadTickets])

  useEffect(() => {
    void loadTickets()
    setMessage(`Guichê ${counter} selecionado`)
  }, [counter, loadTickets])

  const waiting = useMemo(
    () => tickets.filter((ticket) => ticket.status === 'WAITING'),
    [tickets],
  )

  const current = useMemo(() => {
    const active = tickets.filter(
      (ticket) =>
        ticket.counter === counter &&
        (ticket.status === 'CALLED' || ticket.status === 'SERVING'),
    )

    return (
      active.sort((a, b) => {
        const aTime = new Date(a.calledAt ?? a.createdAt).getTime()
        const bTime = new Date(b.calledAt ?? b.createdAt).getTime()
        return bTime - aTime
      })[0] ?? null
    )
  }, [tickets, counter])

  async function request(path: string, method: 'POST' | 'PATCH') {
    setBusy(true)
    try {
      const response = await fetch(`${API_URL}${path}`, { method })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.message ?? 'Erro na operação')
      if (data?.message && !data?.code) setMessage(data.message)
      await loadTickets()
      return data as Ticket | { message: string }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro na operação')
      return null
    } finally {
      setBusy(false)
    }
  }

  async function callNext() {
    if (current) {
      setMessage(`Finalize a senha ${current.code} antes de chamar outra.`)
      return
    }
    const result = await request(`/tickets/call-next/${counter}`, 'POST')
    if (result && 'code' in result) setMessage(`Senha ${result.code} chamada no guichê ${counter}`)
  }

  async function startService() {
    if (!current) return
    const result = await request(`/tickets/${current.id}/start`, 'PATCH')
    if (result && 'code' in result) setMessage(`Atendimento ${result.code} iniciado`)
  }

  async function finishService() {
    if (!current) return
    const result = await request(`/tickets/${current.id}/finish`, 'PATCH')
    if (result && 'code' in result) setMessage(`Atendimento ${result.code} finalizado. Guichê livre.`)
  }

  const normalCount = waiting.filter((ticket) => ticket.priority === 'NORMAL').length
  const priorityCount = waiting.filter((ticket) => ticket.priority === 'PRIORITY').length

  const currentDescription = current
    ? current.status === 'SERVING'
      ? current.priority === 'PRIORITY'
        ? 'Preferencial • em atendimento'
        : 'Normal • em atendimento'
      : current.priority === 'PRIORITY'
        ? 'Preferencial • aguardando início'
        : 'Normal • aguardando início'
    : 'Chame a próxima senha para começar'

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">BT</div>
          <div>
            <strong>BTDigital Fila</strong>
            <span>Central do atendente</span>
          </div>
        </div>
        <div className={`connection ${connected ? 'online' : 'offline'}`}>
          <i />
          {connected ? 'Sistema conectado' : 'Servidor desconectado'}
        </div>
      </header>

      <section className="content">
        <div className="page-heading">
          <div>
            <span className="eyebrow">ATENDIMENTO</span>
            <h1>Controle de fila</h1>
            <p>Chame e acompanhe as senhas do seu guichê.</p>
          </div>

          <label className="counter-select">
            <span>Guichê</span>
            <select value={counter} onChange={(event) => setCounter(Number(event.target.value))}>
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="stats">
          <article><span>Na fila</span><strong>{waiting.length}</strong></article>
          <article><span>Preferenciais</span><strong>{priorityCount}</strong></article>
          <article><span>Normais</span><strong>{normalCount}</strong></article>
        </div>

        <div className="workspace">
          <section className="service-card">
            <div className="card-title">
              <span>SENHA ATUAL</span>
              <em>{current?.status === 'SERVING' ? 'Em atendimento' : current ? 'Chamada' : 'Guichê livre'}</em>
            </div>

            <div className={`current-ticket ${current ? '' : 'empty'}`}>
              <small>{current ? `GUICHÊ ${counter}` : `GUICHÊ ${counter} • LIVRE`}</small>
              <strong>{current?.code ?? '---'}</strong>
              <p>{currentDescription}</p>
            </div>

            <button className="primary-button" disabled={busy || !!current || !connected} onClick={() => void callNext()}>
              <span className="bell">⌁</span>
              CHAMAR PRÓXIMO
            </button>

            <div className="secondary-actions">
              <button disabled={busy || !current || current.status !== 'CALLED'} onClick={() => void startService()}>
                Iniciar atendimento
              </button>
              <button className="finish" disabled={busy || !current || current.status !== 'SERVING'} onClick={() => void finishService()}>
                Finalizar atendimento
              </button>
            </div>

            <div className="status-message">{message}</div>
          </section>

          <section className="queue-card">
            <div className="queue-header">
              <div><span>FILA AGUARDANDO</span><h2>Próximas senhas</h2></div>
              <b>{waiting.length}</b>
            </div>

            <div className="queue-list">
              {waiting.length === 0 ? (
                <div className="empty-queue">
                  <strong>Fila vazia</strong>
                  <span>Novas senhas aparecerão aqui automaticamente.</span>
                </div>
              ) : (
                waiting.map((ticket, index) => (
                  <article key={ticket.id} className={ticket.priority === 'PRIORITY' ? 'priority' : ''}>
                    <div className="position">{String(index + 1).padStart(2, '0')}</div>
                    <div className="ticket-info">
                      <strong>{ticket.code}</strong>
                      <span>{ticket.priority === 'PRIORITY' ? 'Preferencial' : 'Normal'}</span>
                    </div>
                    <span className="badge">{ticket.priority === 'PRIORITY' ? 'P' : 'N'}</span>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

export default App
