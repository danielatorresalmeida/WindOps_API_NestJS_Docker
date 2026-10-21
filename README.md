# WindOps API — NestJS + PostgreSQL + Docker

Projeto **educativo e independente**, criado para aprender NestJS, TypeScript, APIs REST, PostgreSQL, Docker e GitHub Actions. Utiliza dados fictícios de turbinas eólicas e intervenções de manutenção. **Não é um projeto da ANNEA nem da FloLabs.**

> **Estado validado em 21/10/2026:** API executada localmente com Docker Desktop (WSL 2), PostgreSQL e NestJS. Foram concluídos testes manuais à API, testes Jest, compilação TypeScript e builds Docker locais e em GitHub Actions. **Sem deployment público ou em produção.**

## Funcionalidades

- Criar e consultar turbinas (nome, localização, capacidade em kW, estado).
- Atualizar o estado para `ACTIVE`, `MAINTENANCE` ou `OFFLINE`.
- Registar e consultar eventos de manutenção associados a uma turbina.
- Validação dos pedidos com `class-validator` e respostas HTTP apropriadas.
- Persistência real em PostgreSQL via TypeORM, **sem `synchronize: true`**; a aplicação executa migração inicial versionada.
- Dockerfile em duas etapas, Docker Compose com healthchecks e workflow GitHub Actions para testes, build e construção de imagem.

## Validações realizadas (21/10/2026)

| Verificação | Resultado |
|---|---|
| NestJS: `GET /health` | Resposta `status: ok` |
| API REST: criar, listar e atualizar turbina | Testado com `Invoke-RestMethod` |
| Manutenção: registar e consultar intervenção | Testado com `Invoke-RestMethod` |
| Persistência PostgreSQL após `docker compose down` / `up -d` | Dados preservados no volume nomeado |
| Testes unitários Jest | 5/5 aprovados, distribuídos por 2 suites |
| `npm run build` | Compilação concluída |
| `docker compose up --build -d` | Imagem construída, API acessível |
| `npm audit --omit=dev` | 0 vulnerabilidades reportadas na data da verificação |
| GitHub Actions — `main` e `develop` | `validate` aprovado: testes, build e Docker build |

A auditoria completa `npm audit` ainda reportava **20 avisos moderados** nas dependências de desenvolvimento/testes, associados à cadeia do Jest. Não foi aplicada uma correção forçada incompatível; verificar novamente em futuras atualizações. Estes resultados não substituem uma auditoria de segurança da aplicação.

## Requisitos (Windows)

- Docker Desktop com Docker Compose (Linux containers / WSL 2).
- VS Code. Para executar fora do Docker: Node.js 22 e npm.
- Ligação à internet na primeira instalação de dependências/imagens.

## Arrancar — via Docker Compose

No PowerShell, dentro da pasta do projeto:

```powershell
docker compose up --build -d
docker compose ps
Invoke-RestMethod http://localhost:3000/health
```

Resposta esperada (após containers estarem saudáveis):

```json
{"status":"ok","service":"windops-api"}
```

Criar a primeira turbina:

```powershell
$turbine = Invoke-RestMethod -Uri http://localhost:3000/turbines `
  -Method Post -ContentType 'application/json' `
  -Body '{"name":"T-01","location":"Cascais","capacityKw":2500}'
$turbine
```

Consultar todas:

```powershell
Invoke-RestMethod http://localhost:3000/turbines
```

Mudar estado:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/turbines/$($turbine.id)/status" `
  -Method Patch -ContentType 'application/json' `
  -Body '{"status":"MAINTENANCE"}'
```

Registar manutenção:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/turbines/$($turbine.id)/maintenance" `
  -Method Post -ContentType 'application/json' `
  -Body '{"notes":"Inspecao visual realizada"}'
```

Listar intervenções:

```powershell
Invoke-RestMethod "http://localhost:3000/turbines/$($turbine.id)/maintenance"
```

Parar sem apagar dados:

```powershell
docker compose down
```

**Atenção:** `docker compose down -v` também apaga o volume PostgreSQL e os dados de teste!

## Desenvolver fora do container da API

Arranca apenas a base de dados:

```powershell
docker compose up -d db
Copy-Item .env.example .env
npm install
npm run start:dev
```

A ligação é local: `localhost:5434`. Executar testes (não exige PostgreSQL, pois os repositórios são simulados):

```powershell
npm test
npm run build
```

O ficheiro **`package-lock.json` já está versionado**. Para instalações reproduzíveis, utilizar `npm ci` em CI e nas construções Docker. Ao alterar dependências, atualizar e rever também o lockfile.

## Endpoints

| Método | URL | Descrição |
|---|---|---|
| GET | `/health` | Estado da API |
| GET | `/turbines` | Listar turbinas |
| POST | `/turbines` | Criar turbina |
| GET | `/turbines/:id` | Consultar turbina |
| PATCH | `/turbines/:id/status` | Alterar estado |
| GET | `/turbines/:id/maintenance` | Listar manutenções |
| POST | `/turbines/:id/maintenance` | Criar manutenção |

Exemplo de POST `/turbines`:

```json
{"name":"T-01","location":"Cascais","capacityKw":2500}
```

## Arquitetura e funcionamento do Docker

- O **Dockerfile multi-stage** utiliza uma fase `build` para instalar as dependências de desenvolvimento e compilar TypeScript e uma fase `runtime` para instalar apenas dependências de produção e iniciar `dist/main.js`.
- A imagem final executa a API como utilizador não privilegiado (`USER node`).
- O **Docker Compose** cria dois serviços: `api` (NestJS, `127.0.0.1:3000`) e `db` (PostgreSQL 16, `127.0.0.1:5434` no anfitrião e porta 5432 entre containers).
- A API comunica com a base de dados através do nome do serviço `db`, na rede privada criada pelo Compose. O `depends_on` aguarda que a base de dados passe no *healthcheck*.
- O volume nomeado `postgres_data` mantém os dados após remover e recriar os containers. **Não utilizar `down -v`** se pretenderes preservar os dados.
- A configuração de exemplo contém uma palavra-passe **exclusivamente local e fictícia**. Não reutilizar estas credenciais num ambiente remoto; configurar segredos e restringir acessos antes de qualquer publicação.

## Integração contínua (CI)

O workflow `.github/workflows/ci.yml` executa-se em `push` e `pull_request`. O job `validate` instala dependências com `npm ci`, executa os testes Jest, compila o NestJS e verifica `docker build`. **Não publica imagens nem executa deployment.**

## O que aprender e explicar numa entrevista

1. **NestJS:** Controllers recebem pedidos; Services aplicam regras; DTOs validam o input; Providers são injetados pelo Nest.
2. **PostgreSQL:** dados relacionais, chave estrangeira e migração versionada para tornar o esquema reproduzível.
3. **Docker:** Dockerfile multi-stage isola dependências de build; Compose liga API e base de dados; healthchecks indicam disponibilidade.
4. **CI:** GitHub Actions executa os testes, o build TypeScript e valida a construção da imagem; sem deployment automático.
5. **Limitações:** ainda não há autenticação, autorização, paginação, observabilidade nem testes de integração com BD real. **Não expor esta API publicamente** antes de implementar segurança.

## Próximas melhorias reais

- Adicionar testes de integração com PostgreSQL numa pipeline de CI.
- Criar métricas e alertas simulados (p. ex. horas desde última manutenção).
- Criar uma interface de consulta com Next.js, mantendo-a separada do backend NestJS.
- Implementar autenticação, autorização, gestão de segredos e deployment seguro.

## Git: fluxo de desenvolvimento

O repositório já está criado em [GitHub](https://github.com/danielatorresalmeida/WindOps_API_NestJS_Docker).

- `main`: versão estável do projeto.
- `develop`: integração das funcionalidades em desenvolvimento.
- `feature/*`: alterações isoladas, criadas a partir de `develop`.

O ruleset **`protected-branches`** aplica-se a `main` e `develop`: exige pull requests e o status check `validate` e bloqueia force pushes e eliminação das branches. O projeto tem uma única colaboradora e não exige aprovações humanas adicionais.

Para uma nova funcionalidade:

```powershell
git switch develop
git pull --ff-only origin develop
git switch -c feature/nome-da-funcionalidade
# Implementar, rever e testar as alterações.
git add .
git diff --cached --check
git commit -m "feat: describe the change"
git push -u origin feature/nome-da-funcionalidade
```

Depois, criar no GitHub um **pull request de `feature/*` para `develop`**. Integrar apenas após a CI terminar com sucesso. Promover `develop` para `main` através de outro pull request quando a versão estiver pronta.

Este projeto é **um exercício técnico independente**, não software desenvolvido para ANNEA ou FloLabs. As validações atuais são locais e de CI; não demonstram experiência de deployment de um backend NestJS em produção.

## Licença

MIT (ver LICENSE).
