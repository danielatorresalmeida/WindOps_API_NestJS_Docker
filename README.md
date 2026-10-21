# WindOps API — NestJS + PostgreSQL + Docker

Projeto **educativo e independente**, criado para aprender NestJS, TypeScript, APIs REST, PostgreSQL, Docker e GitHub Actions. Utiliza dados fictícios de turbinas eólicas e intervenções de manutenção. **Não é um projeto da ANNEA nem da FloLabs.**

> **Estado inicial:** os ficheiros foram preparados e revistos estaticamente. Ainda é necessário instalar dependências e executar os testes e o Docker no teu computador. Não afirmar que foi testado em produção.

## Funcionalidades

- Criar e consultar turbinas (nome, localização, capacidade em kW, estado).
- Atualizar o estado para `ACTIVE`, `MAINTENANCE` ou `OFFLINE`.
- Registar e consultar eventos de manutenção associados a uma turbina.
- Validação dos pedidos com `class-validator` e respostas HTTP apropriadas.
- Persistência real em PostgreSQL via TypeORM, **sem `synchronize: true`**; a aplicação executa migração inicial versionada.
- Dockerfile em duas etapas, Docker Compose com healthchecks e workflow GitHub Actions para testes, build e construção de imagem.

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

Depois do primeiro `npm install`, adiciona **package-lock.json ao repositório**. O Dockerfile e a CI utilizam `npm ci` quando o lockfile existe, e `npm install` enquanto não tiver sido criado.

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

## Git: workflow recomendado

```powershell
git init
git checkout -b develop
git add .
git commit -m "feat: scaffold WindOps API with NestJS and Docker"
```

Criar no GitHub um **novo repositório**, sem alterar o DevFlow Hub. Abrir uma feature branch para cada melhoria e integrar em `develop` após testes. Não afirmar experiência Docker comprovada até executar os comandos localmente, analisar os logs e perceber como a imagem foi construída.

## Licença

MIT (ver LICENSE).
