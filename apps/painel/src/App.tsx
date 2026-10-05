import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import './App.css'

type CalledTicket = {
  id: number
  code: string
  counter: number | null
  priority: string
}

function playCallSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext

    if (!AudioContextClass) return

    const context = new AudioContextClass()
    const now = context.currentTime
    const gain = context.createGain()
    gain.connect(context.destination)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85)

    ;[0, 0.28].forEach((delay) => {
      const oscillator = context.createOscillator()
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, now + delay)
      oscillator.connect(gain)
      oscillator.start(now + delay)
      oscillator.stop(now + delay + 0.18)
    })

    window.setTimeout(() => void context.close(), 1200)
  } catch {
    // Alguns navegadores/TVs bloqueiam áudio até a primeira interação.
  }
}

function speakTicket(ticket: CalledTicket) {
  if (!('speechSynthesis' in window)) return

  window.speechSynthesis.cancel()

  const readableCode = ticket.code.replace('-', ' ')
  const message =
    ticket.counter !== null
      ? `Senha ${readableCode}. Dirija-se ao guichê ${ticket.counter}.`
      : `Senha ${readableCode}.`

  const utterance = new SpeechSynthesisUtterance(message)
  utterance.lang = 'pt-BR'
  utterance.rate = 0.92
  utterance.pitch = 1
  utterance.volume = 1

  const voices = window.speechSynthesis.getVoices()
  const portugueseVoice = voices.find((voice) =>
    voice.lang.toLowerCase().startsWith('pt-br'),
  )

  if (portugueseVoice) utterance.voice = portugueseVoice

  window.speechSynthesis.speak(utterance)
}

function App() {
  const [connected, setConnected] = useState(false)
  const [ticket, setTicket] = useState<CalledTicket | null>(null)
  const [recentTickets, setRecentTickets] = useState<CalledTicket[]>([])
  const [calling, setCalling] = useState(false)
  const highlightTimer = useRef<number | null>(null)
  const speechTimer = useRef<number | null>(null)

  useEffect(() => {
    const socket = io('http://localhost:3000')

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('ticket-called', (calledTicket: CalledTicket) => {
      setTicket(calledTicket)
      setCalling(true)
      setRecentTickets((current) =>
        [
          calledTicket,
          ...current.filter((item) => item.id !== calledTicket.id),
        ].slice(0, 4),
      )

      if (highlightTimer.current) window.clearTimeout(highlightTimer.current)
      if (speechTimer.current) window.clearTimeout(speechTimer.current)

      playCallSound()

      speechTimer.current = window.setTimeout(() => {
        speakTicket(calledTicket)
      }, 950)

      highlightTimer.current = window.setTimeout(() => {
        setCalling(false)
      }, 8000)
    })

    return () => {
      if (highlightTimer.current) window.clearTimeout(highlightTimer.current)
      if (speechTimer.current) window.clearTimeout(speechTimer.current)
      window.speechSynthesis?.cancel()
      socket.disconnect()
    }
  }, [])

  return (
    <main className={`panel ${calling ? 'is-calling' : ''}`}>
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
            <img
              className="advertisement"
              src="/anuncio-lanchonete.png"
              alt="Anúncio da lanchonete"
            />
          </div>

          {calling && ticket && (
            <div className="call-overlay" aria-live="assertive">
              <span>ATENÇÃO • NOVA CHAMADA</span>
              <strong>{ticket.code}</strong>
              <p>Guichê {ticket.counter ?? '-'}</p>
            </div>
          )}
        </section>

        <aside className="call-column">
          <p className="section-label">
            {ticket ? 'CHAMADA ATUAL' : 'AGUARDANDO CHAMADA'}
          </p>

          <section className={`call-card ${ticket ? 'active' : ''} ${calling ? 'calling' : ''}`}>
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
