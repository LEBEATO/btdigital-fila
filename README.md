# BTDigital Fila

Sistema profissional de **gerenciamento de filas, emissão de senhas e painel de chamadas**, desenvolvido para funcionar em estabelecimentos com atendimento presencial.

O objetivo do projeto é oferecer uma solução moderna, rápida e confiável, com funcionamento **local/offline**, sem depender da internet para realizar o atendimento.

## Visão geral

O BTDigital Fila conecta os equipamentos do estabelecimento pela rede local:

```text
Tablet / Totem
      ↓
Servidor local (PC)
      ↓
Banco SQLite
      ↓
Atendente ── WebSocket ── Painel da TV
```

O cliente retira uma senha no tablet/totem. A senha é armazenada no servidor local e entra na fila de atendimento. O atendente chama a próxima senha e o painel da TV recebe a chamada em tempo real.

## Funcionalidades

- Emissão de senhas normais: `A-001`, `A-002`...
- Emissão de senhas preferenciais: `P-001`, `P-002`...
- Controle da fila de espera
- Chamada de senha por guichê
- Regra de prioridade no atendimento
- Início e finalização do atendimento
- Atualização do painel em tempo real com WebSocket
- Persistência local com SQLite
- Operação planejada para funcionar mesmo sem internet
- Painel preparado para exibição de vídeos e anúncios
- Estrutura preparada para tablet/totem, atendente e TV

## Regra atual de prioridade

Quando existem senhas normais e preferenciais aguardando, o sistema utiliza a seguinte sequência:

```text
2 preferenciais → 1 normal
```

Se existir apenas um tipo de senha aguardando, o atendimento continua normalmente com a fila disponível.

## Tecnologias

### Backend

- Node.js
- NestJS
- TypeScript
- Prisma ORM
- SQLite
- Socket.IO / WebSocket

### Painel

- React
- TypeScript
- Vite
- Socket.IO Client
- CSS responsivo

## Estrutura atual

```text
btdigital-fila/
└── apps/
    ├── server/   # API NestJS, Prisma, SQLite e WebSocket
    └── painel/   # Painel de chamadas React
```

A arquitetura foi planejada para evoluir para:

```text
btdigital-fila/
├── apps/
│   ├── server/
│   ├── desktop/
│   ├── totem/
│   └── painel/
├── packages/
│   ├── ui/
│   ├── shared/
│   └── types/
├── storage/
│   ├── database/
│   ├── videos/
│   ├── logos/
│   └── backups/
└── docs/
```

## Fluxo do sistema

1. O cliente seleciona o tipo de atendimento no tablet/totem.
2. O servidor gera a senha.
3. A senha é armazenada no SQLite.
4. O atendente visualiza a fila.
5. O atendente chama a próxima senha.
6. O servidor envia o evento em tempo real via WebSocket.
7. A TV exibe a senha e o guichê correspondente.
8. O atendimento pode ser iniciado e posteriormente finalizado.

## API atual

| Método | Rota | Função |
| --- | --- | --- |
| `POST` | `/tickets/normal` | Gerar senha normal |
| `POST` | `/tickets/priority` | Gerar senha preferencial |
| `GET` | `/tickets` | Listar senhas |
| `POST` | `/tickets/call-next/:counter` | Chamar próxima senha |
| `PATCH` | `/tickets/:id/start` | Iniciar atendimento |
| `PATCH` | `/tickets/:id/finish` | Finalizar atendimento |

### Evento WebSocket

```text
ticket-called
```

O evento informa ao painel qual senha foi chamada e para qual guichê o cliente deve se dirigir.

## Segurança e armazenamento

O projeto foi pensado para que tablets e painéis **não acessem o banco de dados diretamente**. Toda comunicação passa pelo servidor NestJS.

Arquivos locais sensíveis e dados de execução, como `.env`, banco SQLite e `node_modules`, não devem ser versionados no GitHub.

## Próximas etapas

- Painel profissional da TV
- Aviso sonoro e chamada por voz
- Reprodução de vídeos e anúncios
- Histórico das últimas chamadas
- Interface do atendente
- Totem/tablet para emissão de senhas
- Cadastro de guichês e serviços
- Autenticação local
- Configurações do estabelecimento
- Backup automático do banco
- Inicialização automática com Windows
- Empacotamento do aplicativo desktop

## Status

🚧 **Em desenvolvimento**

A primeira versão funcional do backend já possui emissão, chamada, início e finalização de senhas, persistência em SQLite e comunicação WebSocket.

## Autor

**Alexandre Beato — BTDigital**

Projeto desenvolvido como solução BTDigital para gerenciamento moderno de filas e atendimento presencial.
