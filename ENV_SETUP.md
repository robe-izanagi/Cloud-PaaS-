# Environment Setup

Create or edit the project-root `.env`. Never commit it. `.env.example` shows the required names.

| Variable | Required | Purpose and format |
|---|---:|---|
| `TIDB_HOST` | Yes | TiDB Cloud public endpoint hostname, for example `gateway01.us-west-2.prod.aws.tidbcloud.com`. |
| `TIDB_PORT` | Yes | SQL port from the TiDB Connect dialog. Use `4000` unless TiDB shows another value. |
| `TIDB_USER` | Yes | TiDB database username, often containing the cluster tenant prefix. |
| `TIDB_PASSWORD` | Yes | Password generated for the TiDB SQL user. Store it only in `.env` or Render environment settings. |
| `TIDB_DATABASE` | Yes | Database/schema name to create or select. |
| `TIDB_ENABLE_SSL` | Yes | Set `true` for public TiDB Cloud endpoints. The app uses TLS 1.2 minimum and certificate verification. |
| `TIDB_CA_PATH` | No | Optional absolute or readable path to a custom CA PEM file. Leave blank to use Node.js trusted certificates. |
| `ADMIN_ACCESS_CODE` | Yes | Your private administrator code. Choose a strong unique value; it is verified only by the backend. |
| `JWT_SECRET` | Yes | Strong random signing secret, at least 32 bytes. Generate with `openssl rand -base64 48`. |
| `JWT_EXPIRES_IN` | No | Signed-session duration. Default: `30m`. |
| `NODE_ENV` | Yes | `development` locally or `production` on Render. |
| `PORT` | Yes | Local backend port: `5000`. Render supplies this automatically. |
| `CLIENT_ORIGIN` | Yes | Local Vite origin: `http://localhost:5173`. Set the deployed frontend origin in production. |

## TiDB Cloud setup

1. Sign in to TiDB Cloud and open or create a cluster. Serverless or dedicated clusters both expose a MySQL-compatible SQL endpoint.
2. Create a database/schema in SQL or through the TiDB console.
3. Open **Connect** for the cluster and select the Node.js/MySQL option.
4. Copy the hostname to `TIDB_HOST`.
5. Copy the displayed port to `TIDB_PORT` and verify it; the default is often 4000.
6. Copy the SQL username to `TIDB_USER`.
7. Generate or reset a SQL password, copy it once, and paste it into `TIDB_PASSWORD`.
8. Enter the database/schema name in `TIDB_DATABASE`.
9. Add access for the IP address used by your local machine. TiDB Serverless may require public-network access configuration.
10. Keep `TIDB_ENABLE_SSL=true`. Use `TIDB_CA_PATH` only when TiDB documentation requires a specific CA file for your plan.

Test locally from the project root:

```powershell
npm run dev
```

The backend exits with a clear configuration/database error if required values are missing or the pool cannot connect. The app does not silently disable certificate verification.

## Render setup

Add `TIDB_HOST`, `TIDB_PORT`, `TIDB_USER`, `TIDB_PASSWORD`, `TIDB_DATABASE`, `TIDB_ENABLE_SSL`, `TIDB_CA_PATH`, `ADMIN_ACCESS_CODE`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV=production`, and `CLIENT_ORIGIN` as service environment variables. Do not add `.env` to the Render dashboard as a file.

Set `CLIENT_ORIGIN` to the exact Render HTTPS URL. Check TiDB public-network access and Render outbound-IP restrictions. If TiDB restricts IP ranges, configure the cluster allowlist or private network/plan capabilities rather than disabling TLS or certificate verification.
