import { useEffect, useRef, useState } from 'react'
import './App.css'

type Ticket = {
  id: number
  code: string
  priority: 'NORMAL' | 'PRIORITY'
}

const API_URL = 'http://localhost:3000'

function App() {
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState<'NORMAL' | 'PRIORITY' | null>(null)
  const [connected, setConnected] = useState(true)
  const resetTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current)
    }
  }, [])

  async function createTicket(priority: 'NORMAL' | 'PRIORITY') {
    if (loading) return
    setLoading(priority)

    try {
      const endpoint = priority === 'PRIORITY' ? 'priority' : 'normal'
      const response = await fetch(`${API_URL}/tickets/${endpoint}`, { method: 'POST' })
      if (!response.ok) throw new Error()
      const created = (await response.json()) as Ticket
      setTicket(created)
      setConnected(true)

      if (resetTimer.current) window.clearTimeout(resetTimer.current)
      resetTimer.current = window.setTimeout(() => setTicket(null), 10000)
    } catch {
      setConnected(false)
    } finally {
      setLoading(null)
    }
  }

  function finish() {
    if (resetTimer.current) window.clearTimeout(resetTimer.current)
    setTicket(null)
  }

  return (
    <main className="totem">
      <header className="totem-header">
        <div className="brand">
          <div className="brand-mark">BT</div>
          <div>
            <strong>BTDigital</strong>
            <span>Fila inteligente</span>
          </div>
        </div>
        <div className={`status ${connected ? 'online' : 'offline'}`}>
          <i />
          {connected ? 'Sistema disponível' : 'Sem conexão'}
        </div>
      </header>

      {!ticket ? (
        <section className="welcome">
          <div className="intro">
            <span className="eyebrow">BEM-VINDO</span>
            <h1>Retire sua senha</h1>
            <p>Escolha abaixo o tipo de atendimento que você precisa.</p>
          </div>

          <div className="choices">
            <button
              className="choice normal"
              disabled={loading !== null}
              onClick={() => void createTicket('NORMAL')}
            >
              <div className="choice-icon">A</div>
              <div className="choice-copy">
                <small>ATENDIMENTO</small>
                <strong>Normal</strong>
                <span>Toque para retirar sua senha</span>
              </div>
              <div className="arrow">→</div>
            </button>

            <button
              className="choice priority"
              disabled={loading !== null}
              onClick={() => void createTicket('PRIORITY')}
            >
              <div className="choice-icon">P</div>
              <div className="choice-copy">
                <small>ATENDIMENTO</small>
                <strong>Preferencial</strong>
                <span>Idosos, gestantes e atendimento prioritário</span>
              </div>
              <div className="arrow">→</div>
            </button>
          </div>

          {!connected && (
            <div className="error-message">
              Não foi possível conectar ao servidor. Verifique o computador principal.
            </div>
          )}

          <footer>Toque em uma opção para gerar sua senha</footer>
        </section>
      ) : (
        <section className="ticket-screen" aria-live="polite">
          <div className="success-icon">✓</div>
          <span className="eyebrow">SENHA GERADA COM SUCESSO</span>
          <p className="your-ticket">Sua senha é</p>
          <strong className="ticket-code">{ticket.code}</strong>
          <div className="ticket-type">
            {ticket.priority === 'PRIORITY' ? 'Atendimento preferencial' : 'Atendimento normal'}
          </div>
          <div className="instruction">
            <strong>Aguarde sua chamada</strong>
            <span>Acompanhe sua senha no painel de atendimento.</span>
          </div>
          <button className="done-button" onClick={finish}>CONCLUIR</button>
          <small className="auto-return">Esta tela voltará automaticamente em alguns segundos.</small>
        </section>
      )}
    </main>
  )
}

export default App
