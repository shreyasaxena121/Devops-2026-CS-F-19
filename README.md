# 🛒 CampusCart — College Marketplace Platform

CampusCart is a modern full-stack campus marketplace platform built for college communities to buy, sell, and trade items with peer-to-peer transparency, real-time activity updates, automated CI/CD pipelines, containerized deployment, and full observability.

---

## 🏗️ Architecture Overview

CampusCart follows a decoupled, resilient tiered architecture designed for containerized and cloud-native deployments:

```
                      ┌─────────────────────────────────────────┐
                      │              Web Client                 │
                      │   (React 19, Redux, Vite, Bootstrap)    │
                      └────────────────────┬────────────────────┘
                                           │
                        HTTP / REST & WS   │  (Port 5000 / 80)
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │              Backend API                │
                      │  (Node.js, Express, Native WebSockets)  │
                      └────┬───────────────┬────────────────┬───┘
                           │               │                │
            Mongoose / TCP │        Scrape │ (/metrics)     │
                           ▼               ▼                ▼
                 ┌──────────────┐   ┌─────────────┐   ┌─────────────┐
                 │   MongoDB    │   │ Prometheus  │   │ Cloudinary  │
                 │   Cluster    │   │  (Metrics)  │   │  (Storage)  │
                 └──────────────┘   └──────┬──────┘   └─────────────┘
                                           │
                                           ▼
                                    ┌─────────────┐
                                    │   Grafana   │
                                    │ (Dashboard) │
                                    └─────────────┘
```

---

## 🚀 Key Features

- **User Authentication & RBAC**: Secure JWT-based access and refresh token authentication with bcrypt password hashing and role-based permissions.
- **Product Marketplace**: Create, edit, search, and filter campus items across multiple categories with multi-image Cloudinary uploads.
- **Real-Time WebSocket Updates**: Live broadcast engine built on RFC 6455 WebSockets notifying active students instantly of newly posted listings and purchase requests.
- **Redux Centralized State Management**: Global store managing real-time notifications, connection states, and active items.
- **AI Description Generator**: Auto-generates clear and engaging product listings using intelligent summarization.
- **Metrics & Observability**: Native Prometheus instrumentation collecting Counters, Gauges, and Histograms with pre-configured Grafana dashboards.
- **Automated CI/CD**: End-to-end automated pipelines with GitHub Actions and Jenkins testing, linting, building, and validating infrastructure as code.
- **Containerization & Orchestration**: Production-ready multi-stage Dockerfiles, Docker Compose multi-service topology, and declarative Kubernetes (K8s) manifests.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Redux, React-Redux, React Router v7, Vite, Bootstrap 5 |
| **Backend** | Node.js (v20+), Express.js 5, Native WebSockets (RFC 6455) |
| **Database** | MongoDB Atlas & Local MongoDB (v7), Mongoose ODM |
| **State Management** | Redux Store (Actions, Reducers, CombineReducers) |
| **Observability** | Prometheus (Scraper, Alert Rules), Grafana 11 Dashboards |
| **Containerization** | Docker (Multi-stage builds), Docker Compose v2 |
| **Orchestration** | Kubernetes (Deployments, Services, ConfigMaps, Secrets, Ingress, Kustomize) |
| **CI / CD** | Jenkins Declarative Pipeline, GitHub Actions Workflow |

---

## 📁 Repository Structure

```
CampusCart/
├── client/                     # Frontend Application
│   ├── src/
│   │   ├── components/         # Reusable UI & Notification Components
│   │   ├── context/            # Auth Context & Session Management
│   │   ├── pages/              # Views (Marketplace, Products, Requests)
│   │   ├── store/              # Redux State (Actions, Reducers, Store)
│   │   └── utils/              # API clients & useSocket hook
│   ├── Dockerfile              # Multi-stage production Nginx container
│   └── vite.config.js
├── server/                     # Backend Application
│   ├── config/                 # DB & Cloudinary Configuration
│   ├── controllers/            # Request Handlers & Business Logic
│   ├── metrics/                # Prometheus Counter, Gauge & Histogram Registry
│   ├── models/                 # Mongoose Schemas (User, Product, Order, Review)
│   ├── routes/                 # Express API Endpoints
│   ├── sockets/                # WebSocket Server & Frame Codecs
│   └── tests/                  # Automated Test Suite (node:test)
├── k8s/                        # Kubernetes Infrastructure
│   ├── backend.yaml            # API Deployment & NodePort Service
│   ├── frontend.yaml           # Client Deployment & NodePort Service
│   ├── mongodb.yaml            # Stateful MongoDB & PVC
│   ├── monitoring.yaml         # Prometheus & Grafana Deployments
│   ├── ingress.yaml            # Path-based routing rules
│   └── kustomization.yaml      # Kustomize root manifest
├── prometheus/                 # Monitoring Configuration
│   ├── prometheus.yml          # Scrape target definition
│   └── alert.rules.yml         # Latency, Downtime & Error Alert Rules
├── grafana/                    # Observability Dashboards
│   ├── provisioning/           # Datasource & Dashboard auto-loaders
│   └── dashboards/             # CampusCart Overview JSON dashboard
├── .github/workflows/ci.yml    # GitHub Actions Continuous Integration
├── Jenkinsfile                 # Jenkins Declarative CI/CD Pipeline
├── docker-compose.yml          # Multi-container orchestration stack
├── Dockerfile                  # Production API container
└── package.json                # Monorepo workspaces & scripts
```

---

## 📊 Observability & Monitoring

The backend exposes a standard Prometheus exposition format endpoint at `/metrics`.

### Instrumented Metrics:
1. **Counters**:
   - `http_requests_total{method, route, status_code}` — Total HTTP requests observed by route and response code.
   - `campuscart_products_created_total` — Total listings created on the platform.
   - `campuscart_orders_created_total` — Total purchase requests generated.
2. **Gauges**:
   - `campuscart_active_connections` — Current connected WebSocket clients.
   - `campuscart_db_status` — MongoDB connectivity status (`1` = healthy, `0` = down).
   - `nodejs_heap_size_used_bytes` & `nodejs_heap_size_total_bytes` — Memory consumption.
   - `process_uptime_seconds` — Backend service uptime.
3. **Histograms**:
   - `http_request_duration_seconds` — Request execution latency buckets `[0.01s, 0.05s, 0.1s, 0.25s, 0.5s, 1s, 2.5s, 5s]`.

---

## 🐳 Docker Deployment

Run the complete multi-service environment (MongoDB + API + Frontend + Prometheus + Grafana):

```bash
# Start all services with volume persistence
docker compose up --build

# Access services:
# - Frontend:    http://localhost:5173
# - Backend API: http://localhost:5000
# - Metrics:     http://localhost:5000/metrics
# - Prometheus:  http://localhost:9090
# - Grafana:     http://localhost:3000 (admin / admin)
```

---

## ☸️ Kubernetes Deployment

Deploy all workloads to any local or cloud Kubernetes cluster using Kustomize:

```bash
# Validate manifests
kubectl kustomize k8s/

# Apply all manifests (Database, API, Client, Monitoring, Ingress)
kubectl apply -k k8s/

# Inspect status
kubectl get pods
kubectl get services
```

### Kubernetes Service Ports:
- **Frontend**: `http://localhost:30080`
- **Backend API**: `http://localhost:30050`
- **Prometheus**: `http://localhost:30090`
- **Grafana**: `http://localhost:30030`

---

## 🔄 CI / CD Automation

The repository includes dual continuous integration pipelines configured to trigger on pull requests and pushes to `main`:

### Automated Pipeline Stages:
1. **Dependency Installation**: Clean installation across root, backend, and client workspaces.
2. **Automated Unit & Integration Testing**: Executes API health, Prometheus metric collectors, authentication, WebSocket protocol encoding, and schema validation tests.
3. **Client Linting**: Static code analysis and ESLint code quality checks.
4. **Client Production Build**: Production Vite compilation and bundle optimization.
5. **Infrastructure Validation**: Automatic verification of Kubernetes Kustomize manifests and Docker Compose configuration.
6. **Artifact Archiving**: Test run logs (`test-results.log`) automatically published on pipeline completion.

---

## ⚡ Local Development Setup

### Prerequisites
- Node.js (v20+)
- MongoDB (local or Atlas URI)

### Quick Start
```bash
# Clone the repository
git clone https://github.com/shreyasaxena121/Devops-2026-CS-F-19.git
cd Devops-2026-CS-F-19

# Install dependencies
npm ci
npm ci --prefix server
npm ci --prefix client --legacy-peer-deps

# Configure environment variables
cp server/.env.example server/.env

# Run automated test suite
npm test

# Run backend development server
npm run dev:server

# Run frontend development server (separate terminal)
npm run dev:client
```

---

## 📝 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Service health status |
| `GET` | `/metrics` | Prometheus metrics scrape endpoint |
| `WS` | `/ws` | Real-time WebSocket connection |
| `POST` | `/api/auth/register` | Register new student account |
| `POST` | `/api/auth/login` | Authenticate and issue JWT tokens |
| `GET` | `/api/public/stats` | Aggregated marketplace stats |
| `GET` | `/api/products` | Query products with category & text search |
| `POST` | `/api/products` | Create a new product listing (Multipart / Cloudinary) |
| `GET` | `/api/products/:id` | Retrieve product details |
| `POST` | `/api/orders` | Submit a purchase request |
| `GET` | `/api/orders/my-orders` | Retrieve user orders |

---

## 👥 Authors

- **Shreya Saxena** ([@shreyasaxena121](https://github.com/shreyasaxena121))
- **Yuvraj Singh** ([@yuvrajsingh47471-blip](https://github.com/yuvrajsingh47471-blip))
- **Yug Yadav** ([@YugYadav07](https://github.com/YugYadav07))
