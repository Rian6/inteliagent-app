# Inteliagent App

Todo o código de execução em `src` usa TypeScript (`.ts`/`.tsx`). `npm run typecheck` valida o projeto com `strict`; `noImplicitAny` permanece desativado para permitir a migração gradual dos componentes antigos, enquanto contratos explícitos protegem banco, sessão e sincronização. Os arquivos CommonJS de configuração e os testes Node continuam com as extensões exigidas pelas respectivas ferramentas.

As entidades SQLite estão em `src/db/entities.ts`. `npm run db:generate` atualiza as migrações versionadas em `drizzle/`. Um banco novo usa essa migração gerada; um banco legado é preservado, recebe os ajustes necessários e é registrado no diário de migrações sem apagar a outbox. O teste com SQLite real verifica tabelas, índices e UUID gerado.

Aplicativo Expo SDK 58 / React Native 0.88, com componentes Material 3, SecureStore e SQLite offline.

```powershell
npm ci
npm run test:offline
npm run typecheck
npm run check:dependencies
npm run db:generate
npm start
npm run export:android
```

Use Node LTS 26 e os módulos nativos compatíveis indicados por `expo install --check`. Configure `.env` a partir de `.env.example`. No desenvolvimento via USB, use `adb reverse` para as portas dos serviços e do Metro; consulte o README do workspace.

O app e o load-server usam o contrato de sincronização v3. O envio de SQL arbitrário foi removido. Escrita local e pendência da outbox são atômicas, uploads usam operações imutáveis identificadas por UUID, repetição idempotente e versões de concorrência, e downloads incrementais só são confirmados após a gravação local. Mudanças de outra conta não substituem dados offline silenciosamente.

`scripts/harden-deepmerge.cjs` aplica e verifica uma correção local para GHSA-gcqx-w48m-w2h4 durante `postinstall`. Não use `npm ci --ignore-scripts`: isso omitiria o backport. `npm audit` ainda sinaliza a versão upstream; consulte `../docs/VALIDACAO.md`.

O primeiro acesso requer login e download dos planejamentos com conexão. Nos próximos acessos, a conta pode abrir sem rede por até sete dias desde o último login validado. Cada conta e sede usa seu próprio arquivo SQLite; sair não apaga a fila nem os rascunhos. O token de acesso expira em 30 minutos: é necessário entrar novamente para transmitir dados, sem perder o trabalho local.

Rascunhos são gravados no SQLite durante o preenchimento. Finalizar uma visita grava todo o agregado e a outbox numa transação. A tela “Rascunhos, conflitos e envio” permite retomar formulários e escolher a versão local ou do servidor em conflitos. A sincronização automática ocorre com o app aberto, ao recuperar rede e ao retornar ao primeiro plano; há retries persistentes com backoff.

O build Android usa caminhos CMake curtos em `../.cxx` para suportar o Ninja no Windows. Execute `scripts/build-android.ps1` para gerar um APK de desenvolvimento arm64. O plugin `plugins/withWindowsCmake.cjs` preserva essa configuração nos próximos prebuilds.

Os testes usam arquivos SQLite reais e simulam perda de confirmação, reinício, concorrência, bloqueio de registros, migração legada e isolamento de contas. A integração com o Java/MySQL real está em `../tests/test_offline_protocol.py`. Veja o protocolo completo em `../docs/SINCRONIZACAO.md`.
