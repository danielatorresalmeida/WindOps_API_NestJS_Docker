# WindOps API — NestJS + PostgreSQL + Docker

**Independent educational project** built to learn NestJS, TypeScript, REST APIs, PostgreSQL, Docker and GitHub Actions. It uses fictional wind turbine and maintenance data. **It is not an ANNEA or FloLabs project.**

> **Validation status (22 October 2026):** GitHub Actions successfully completed the unit tests, application build and Docker image build. Running the full stack locally with Docker Compose has not yet been confirmed. This project has not been deployed or validated in production.

## Features

- Create and retrieve wind turbines (name, location, capacity in kW and status).
- Update a turbine's status to `ACTIVE`, `MAINTENANCE` or `OFFLINE`.
- Record and retrieve maintenance events for a turbine.
- Validate requests with `class-validator` and return appropriate HTTP responses.
- Persist data in PostgreSQL via TypeORM, using an initial versioned migration instead of `synchronize: true`.
- Use a multi-stage Dockerfile, Docker Compose with health checks, and a GitHub Actions workflow for tests, application builds and Docker image builds.

## Prerequisites (Windows)

- Docker Desktop with Docker Compose (Linux containers / WSL 2).
- VS Code. To run the API outside Docker: Node.js 22 and npm.
- An internet connection for the first dependency installation and image download.

## Run with Docker Compose

In PowerShell, from the project directory:

```powershell
docker compose up --build -d
docker compose ps
Invoke-RestMethod http://localhost:3000/health
```

Expected response once the containers are healthy:

```json
{"status":"ok","service":"windops-api"}
```

Create your first turbine:

```powershell
$turbine = Invoke-RestMethod -Uri http://localhost:3000/turbines `
  -Method Post -ContentType 'application/json' `
  -Body '{"name":"T-01","location":"Cascais","capacityKw":2500}'
$turbine
```

List all turbines:

```powershell
Invoke-RestMethod http://localhost:3000/turbines
```

Change a turbine's status:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/turbines/$($turbine.id)/status" `
  -Method Patch -ContentType 'application/json' `
  -Body '{"status":"MAINTENANCE"}'
```

Add a maintenance event:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/turbines/$($turbine.id)/maintenance" `
  -Method Post -ContentType 'application/json' `
  -Body '{"notes":"Visual inspection completed"}'
```

List maintenance events:

```powershell
Invoke-RestMethod "http://localhost:3000/turbines/$($turbine.id)/maintenance"
```

Stop the containers without deleting stored data:

```powershell
docker compose down
```

**Important:** `docker compose down -v` also removes the PostgreSQL volume and its test data!

## Develop outside the API container

Start only the database container:

```powershell
docker compose up -d db
Copy-Item .env.example .env
npm install
npm run start:dev
```

The database is available locally at `localhost:5434`. Run the unit tests (which use mocked repositories and do not require PostgreSQL) and build the application:

```powershell
npm test
npm run build
```

The repository includes `package-lock.json`. Both the Dockerfile and GitHub Actions use `npm ci` when this lockfile is available.

## Endpoints

| Method | URL | Description |
|---|---|---|
| GET | `/health` | API health status |
| GET | `/turbines` | List turbines |
| POST | `/turbines` | Create turbine |
| GET | `/turbines/:id` | Retrieve turbine |
| PATCH | `/turbines/:id/status` | Update turbine status |
| GET | `/turbines/:id/maintenance` | List maintenance events |
| POST | `/turbines/:id/maintenance` | Add maintenance event |

Example POST request to `/turbines`:

```json
{"name":"T-01","location":"Cascais","capacityKw":2500}
```

## Concepts to discuss in an interview

1. **NestJS:** controllers handle HTTP requests, services implement business logic, DTOs validate input, and providers use dependency injection.
2. **PostgreSQL:** relational data, foreign keys and versioned migrations make the schema reproducible.
3. **Docker:** a multi-stage Dockerfile separates build and runtime dependencies; Compose connects the API and database; health checks report service readiness.
4. **CI:** GitHub Actions runs tests, builds the TypeScript application and validates the Docker image build; there is no automatic deployment.
5. **Limitations:** authentication, authorization, pagination, observability and database integration tests are not covered by the current implementation or CI workflow. **Do not expose this API publicly** before implementing appropriate security.

## Planned improvements

- Add PostgreSQL integration tests to the CI pipeline.
- Add simulated metrics and alerts (for example, hours since last maintenance).
- Build a Next.js frontend, keeping it separate from the NestJS backend.
- Implement authentication, authorization, secrets management and secure deployment.

## Git workflow

```powershell
git checkout -b feature/your-change
# Make changes, test them, and commit.
git add .
git commit -m "docs: describe your change"
git push -u origin feature/your-change
```

Use a dedicated feature branch for each improvement and open a pull request after testing. Keep documentation about Docker validation accurate: CI image builds are verified, but local Compose operation has not yet been confirmed.

## License

MIT (see `LICENSE`).
