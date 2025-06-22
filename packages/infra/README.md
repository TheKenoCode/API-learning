# Redline Infrastructure 🐳

Local development infrastructure using Docker Compose.

## Services

### PostgreSQL Database

- **Image**: `postgres:16-alpine`
- **Port**: `5432`
- **Database**: `redline`
- **Credentials**: `postgres` / `postgres`

### pgAdmin (Database Admin)

- **Image**: `dpage/pgadmin4`
- **Port**: `5050`
- **URL**: http://localhost:5050
- **Credentials**: `admin@redline.com` / `admin`

### MinIO (S3-Compatible Storage)

- **Image**: `minio/minio`
- **API Port**: `9000`
- **Console Port**: `9001`
- **Console URL**: http://localhost:9001
- **Credentials**: `minioadmin` / `minioadmin123`

## Quick Start

### Start All Services

```bash
# From project root
docker compose -f packages/infra/docker-compose.yml up -d

# Or from infra directory
cd packages/infra
docker compose up -d
```

### Stop All Services

```bash
docker compose -f packages/infra/docker-compose.yml down
```

### Reset Data (Delete Volumes)

```bash
docker compose -f packages/infra/docker-compose.yml down -v
```

## Service Health Checks

### Check Service Status

```bash
docker compose -f packages/infra/docker-compose.yml ps
```

### View Service Logs

```bash
# All services
docker compose -f packages/infra/docker-compose.yml logs

# Specific service
docker compose -f packages/infra/docker-compose.yml logs postgres
```

## Database Setup

After starting services, set up the database:

```bash
# From project root
cd packages/db
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

## MinIO Buckets

The following buckets are automatically created:

- `redline-images` - Car photos and thumbnails
- `redline-models` - 3D car models (.glb files)
- `redline-documents` - PDFs and documents

## pgAdmin Setup

1. Open http://localhost:5050
2. Login with `admin@redline.com` / `admin`
3. Add new server:
   - **Name**: Redline Local
   - **Host**: `postgres` (container name)
   - **Port**: `5432`
   - **Database**: `redline`
   - **Username**: `postgres`
   - **Password**: `postgres`

## Troubleshooting

### Port Conflicts

If ports are already in use, modify the `docker-compose.yml` file:

```yaml
ports:
  - "5433:5432" # Changed from 5432:5432
```

### Reset Everything

```bash
# Stop and remove containers, volumes, networks
docker compose -f packages/infra/docker-compose.yml down -v --remove-orphans

# Remove dangling images
docker image prune -f

# Start fresh
docker compose -f packages/infra/docker-compose.yml up -d
```

### View Container Resources

```bash
# Container stats
docker stats

# Container inspect
docker compose -f packages/infra/docker-compose.yml exec postgres env
```

## Production Notes

⚠️ **This setup is for local development only**

For production:

- Use managed database services (AWS RDS, Google Cloud SQL)
- Use cloud storage (AWS S3, Google Cloud Storage)
- Implement proper backup strategies
- Use secrets management
- Enable SSL/TLS
- Configure monitoring and alerts
