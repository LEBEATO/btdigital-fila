import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import './App.css'

type CalledTicket = {
  id: number
  code: string
  counter: number | null
  priority: string
}

function App() {
  const [connected, setConnected] = useState(false)
  const [ticket, setTicket] = useState<CalledTicket | null>(null)
  const [recentTickets, setRecentTickets] = useState<CalledTicket[]>([])

  useEffect(() => {
    const socket = io('http://localhost:3000')

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('ticket-called', (calledTicket: CalledTicket) => {
      setTicket(calledTicket)
      setRecentTickets((current) => [
        calledTicket,
        ...current.filter((item) => item.id !== calledTicket.id),
      ].slice(0, 4))
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  return (
    <main className="panel">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">BT</div>
          <div>
            <strong>BTDigital</strong>
            <span>Fila inteligente</span>
          </div>
        </div>

        <div className={`status ${connected ? 'online' : 'offline'}`}>
          <span className="status-dot" />
          {connected ? 'Sistema conectado' : 'Servidor desconectado'}
        </div>
      </header>

      <section className="dashboard">
        <section className="media-card">
          <div className="media-overlay">
            <span className="media-badge">MÍDIA INSTITUCIONAL</span>
            <div className="media-logo">BTDigital</div>
            <p>Seus vídeos e anúncios serão exibidos neste espaço.</p>
          </div>
        </section>

        <aside className="call-column">
          <p className="section-label">
            {ticket ? 'CHAMADA ATUAL' : 'AGUARDANDO CHAMADA'}
          </p>

          <section className={`call-card ${ticket ? 'active' : ''}`}>
            {ticket ? (
              <>
                <span className="service-type">
                  {ticket.priority === 'PRIORITY'
                    ? 'ATENDIMENTO PREFERENCIAL'
                    : 'ATENDIMENTO NORMAL'}
                </span>
                <strong className="ticket-code">{ticket.code}</strong>
                <div className="divider" />
                <span className="go-to">Dirija-se ao</span>
                <strong className="counter-number">
                  GUICHÊ {ticket.counter ?? '-'}
                </strong>
              </>
            ) : (
              <>
                <span className="welcome">Bem-vindo</span>
                <strong className="idle-title">AGUARDE SUA SENHA</strong>
                <p className="idle-text">
                  A próxima chamada aparecerá automaticamente neste painel.
                </p>
              </>
            )}
          </section>

          <section className="recent-card">
            <div className="recent-header">
              <strong>Últimas chamadas</strong>
              <span>Senha / Guichê</span>
            </div>

            <div className="recent-list">
              {recentTickets.length === 0 ? (
                <p className="empty-recent">Nenhuma chamada realizada.</p>
              ) : (
                recentTickets.map((item) => (
                  <div className="recent-item" key={item.id}>
                    <strong>{item.code}</strong>
                    <span>Guichê {item.counter ?? '-'}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </section>

      <footer className="footer">
        <span>BTDigital Fila</span>
        <span>Atendimento inteligente • rápido • organizado</span>
      </footer>
    </main>
  )
}

export default App
