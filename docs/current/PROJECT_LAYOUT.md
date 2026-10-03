# 📁 Project Layout Documentation

This document provides a comprehensive overview of the Excelsior Deckbuilder project structure, describing each key file and directory and their purpose.

## 🏗️ **Root Directory Structure**

```
/Users/kyle/cursored/
├── 📁 .agentos/                    # Compact global AgentOS inheritance cache + provenance
├── 📁 business-operations/         # Append-only business metrics and operational statistics
├── 📄 README.md                    # Main project documentation
├── 📄 STYLE_GUIDE_V2.md            # v2 React SPA visual source of truth
├── 📁 frontend/                    # v2 React SPA (production UI)
├── 📄 docs/current/PROJECT_LAYOUT.md  # Project structure documentation
├── 📄 docs/current/FRONTEND_V2.md  # v2 architecture and dev workflow
├── 📄 docs/current/AGENTOS_INHERITANCE.md  # Cross-project rule inheritance contract
├── 📄 docs/current/TESTING_GUIDE.md        # How to run unit/integration tests
├── 📄 docs/current/API_DOCUMENTATION.md  # Legacy HTTP API
├── 📄 API_V1.md                    # /api/v1 contract
├── 📄 package.json                 # Node.js dependencies and scripts
├── 📄 tsconfig.json                # TypeScript configuration
├── 📁 tests/                       # Unit and integration tests
└── 📁 src/                         # Express backend
```

## 🎨 **Frontend Structure**

> **The production frontend is the v2 React SPA in `/frontend/`.** Express serves
> `frontend/dist/index.html` for app routes after `npm run build` in `frontend/`.
> Local development uses the Vite dev server on **:5173** — see
> [`docs/current/FRONTEND_V2.md`](FRONTEND_V2.md).

### **v2 React SPA (`/frontend/`)**
```
/frontend/
├── 📄 index.html                   # Vite entry HTML (built to frontend/dist/index.html)
├── 📄 vite.config.ts               # Vite config (base '/', host: true for LAN, /api proxy → :8085)
├── 📄 .cursorrules                 # v2 conventions (components, lib map, API client, layout/query patterns)
├── 📁 src/
│   ├── 📁 app/                     # Provider tree, router, ProtectedRoute, lazy routes
│   ├── 📁 features/                # Route-level pages: home, database, collection, community,
│   │                              #   deck-selection, deck-editor, login
│   ├── 📁 components/              # Reusable UI (AppShell, CardTile, DeckTile, CardDetailPanel, …)
│   │                              #   each: Component.tsx + .css + .md + index.ts
│   └── 📁 lib/                     # api/ (client + endpoints), catalog/, collection/, decks/,
│                                  #   layout/ (LayoutModeProvider, useHorizontalSwipe), images/
└── 📁 dist/                        # Production build output (gitignored; built in CI, copied into Docker image)
```
Full v2 reference: [`docs/current/FRONTEND_V2.md`](FRONTEND_V2.md). Visual source of truth: [`STYLE_GUIDE_V2.md`](../../STYLE_GUIDE_V2.md).

## 🔧 **Backend Structure (`/src/`)**

### **Main Application**
```
/src/
├── 📄 index.ts                     # Main server entry point
└── 📄 test-server.ts               # Test server barrel (re-exports from test-server/)
```

### **Test Server (`/src/test-server/`)**
Integration-test Express app; reuses `registerRoutes` from `src/routes/` with test deps (e.g. optional auth via session or `x-test-user-id`). Entry: [src/test-server.ts](src/test-server.ts).
```
/src/test-server/
├── 📄 bootstrap.ts                 # Builds app, test RouteDependencies, registerRoutes, test-only routes
├── 📄 lifecycle.ts                 # initializeTestServer(), closeTestServer()
├── 📄 testOnlyRoutes.ts            # GET /deck-editor/:deckId, lenient /users/:userId/decks
└── 📄 .cursorrules                 # Directory context
```

### **Configuration (`/src/config/`)**
```
/src/config/
└── 📄 DataSourceConfig.ts          # Database configuration and connection management
```

### **Database Layer (`/src/database/`)**
```
/src/database/
├── 📄 PostgreSQLCardRepository.ts  # Card data access layer
├── 📄 PostgreSQLDeckRepository.ts  # Deck data access layer
└── 📄 PostgreSQLUserRepository.ts  # User data access layer
```

### **Repository Interface (`/src/repository/`)**
```
/src/repository/
└── 📄 OverPowerRepository.ts       # Repository interface definition
```

### **Services (`/src/services/`)**
```
/src/services/
├── 📄 AuthenticationService.ts     # User authentication service
├── 📄 databaseInitialization.ts    # Database initialization service
├── 📄 deckPersistence.ts           # Deck persistence service
├── 📄 deckService.ts               # Deck business logic service
├── 📄 guestDeckPersistence.ts      # Guest deck persistence service
└── 📄 userPersistence.ts           # User persistence service
```

### **Types (`/src/types/`)**
```
/src/types/
└── 📄 index.ts                     # TypeScript type definitions
```

### **Utilities (`/src/utils/`)**
```
/src/utils/
├── 📄 passwordUtils.ts             # Password hashing utilities
└── 📄 testUtils.ts                 # Test utility functions
```

### **Scripts (`/src/scripts/`)**
```
/src/scripts/
├── 📄 flywayRunner.ts              # Database migration runner
├── 📄 generateSqlDataMigrations.ts # SQL migration generator
├── 📄 migrateCardData.ts           # Card data migration script
├── 📄 setupTestData.ts             # Test data setup script
└── 📄 test-db-connection.js        # Database connection test script
```

### **Resources (`/src/resources/`)**
```
/src/resources/
├── 📁 cards/                       # Card data and images
│   ├── 📁 images/                  # Card images (576 files)
│   └── 📁 data/                    # Card data files
└── 📁 rules/                       # Game rules and documentation
```

## 🧪 **Testing Structure (`/tests/`)**

### **Test Configuration**
```
/tests/
├── 📄 README.md                    # Testing documentation
├── 📄 setup.ts                     # Test setup configuration
├── 📄 setup-deckbuilding.ts        # Deckbuilding test setup
├── 📄 setup-integration.ts         # Integration test setup
└── 📄 teardown-integration.ts      # Integration test cleanup
```

### **Test Helpers**
```
/tests/helpers/
└── 📄 integrationTestUtils.ts      # Integration test utility functions
```

### **Test Mocks**
```
/tests/mocks/
└── 📄 testMocks.ts                 # Test mock objects and functions
```

### **Unit Tests (`/tests/unit/`)**
```
/tests/unit/
├── 📁 frontend-v2/                 # v2 SPA unit tests (import from frontend/src/)
├── 📄 *.test.ts                    # Backend and shared unit tests
```

### **Integration Tests (`/tests/integration/`)**
```
/tests/integration/
├── 📄 *.test.ts                    # 47 integration test files covering:
│   ├── API endpoints
│   ├── Database interactions
│   ├── User authentication flows
│   ├── Deck creation and editing
│   ├── Card management
│   └── End-to-end workflows
```

### **Test Fixtures**
```
/tests/fixtures/
└── 📁 */                           # Test data fixtures and sample files
```

## 🗄️ **Database Structure**

### **Migrations (`/migrations/`)**
```
/migrations/
├── 📄 V*.sql                       # 136 SQL migration files
└── 📄 README.md                    # Migration documentation
```

### **Data Files (`/data/`)**
```
/data/
├── 📄 decks.json                   # Deck data storage
├── 📄 id-mapping.json              # ID mapping for migrations
├── 📄 sessions.json                # Session data
└── 📄 users.json                   # User data storage
```

### **Sample Decks (`/decks/`)**
```
/decks/
└── 📄 deck_2.json                  # Sample deck file
```

## 🐳 **Docker Configuration**

### **Docker Files**
```
/docker/
├── 📄 docker-compose.yml           # Docker Compose configuration
└── 📄 README.md                    # Docker setup documentation
```

### **Dockerfile**
```
📄 Dockerfile                       # Container configuration
```

## ☁️ **Infrastructure (`/infra/`)**

### **Terraform Configuration**
```
/infra/
├── 📄 main.tf                      # Main Terraform configuration
├── 📄 variables.tf                 # Terraform variables
├── 📄 outputs.tf                   # Terraform outputs
├── 📄 ec2.tf                       # EC2 instance configuration
├── 📄 rds.tf                       # RDS database configuration
├── 📄 networking.tf                # VPC and networking configuration
├── 📄 nginx.tf                     # Nginx reverse proxy configuration
├── 📄 ssl.tf                       # SSL certificate configuration
├── 📄 ses.tf                       # AWS SES email configuration
├── 📄 ssm.tf                       # AWS Systems Manager configuration
├── 📄 ecr.tf                       # Elastic Container Registry configuration
├── 📄 dns.tf                       # DNS configuration
├── 📄 user_data.sh                 # EC2 user data script
├── 📄 email_forwarder.js           # Email forwarding service
├── 📄 email_forwarder.zip          # Email forwarder deployment package
├── 📄 terraform.tfstate            # Terraform state file
├── 📄 terraform.tfstate.backup     # Terraform state backup
├── 📄 plan.tfplan                 # Terraform plan output (gitignored; do not commit)
└── 📄 README.md                    # Infrastructure documentation
```

### **Infrastructure Scripts**
```
/infra/
├── 📄 deploy-domain.sh             # Domain deployment script
├── 📄 get-name-servers.sh          # DNS name server retrieval script
└── 📄 DOMAIN_SETUP.md              # Domain setup documentation
```

## 🚀 **Deployment Scripts (`/scripts/`)**

```
/scripts/
├── 📄 agentos-inheritance-status.mjs  # Read-only AgentOS freshness/provenance check
├── 📄 check-production-status.js   # Production status checker
├── 📄 cleanup-test-data.js         # Test data cleanup script
├── 📄 connect-to-production-db.sh  # Production database connection
├── 📄 deploy-fix.sh                # Quick fix deployment script
├── 📄 deploy-to-production.sh      # Full production deployment
├── 📄 fix-guest-password.sql       # Guest password fix SQL
├── 📄 fix-guest-user.js            # Guest user fix script
├── 📄 fix-production-auth.js       # Production authentication fix
├── 📄 fix-production-database.sql  # Production database fix SQL
├── 📄 fix-production-users.sql     # Production users fix SQL
├── 📄 setup-github-secrets.md      # GitHub secrets setup guide
├── 📄 setup-test-data.ts           # Test data setup script
├── 📄 start-server.sh              # Server startup script
├── 📄 test-db-connection.js        # Database connection test
└── 📄 test-guest-login.js          # Guest login test script
```

## 📊 **Build and Configuration Files**

### **Build Output (`/dist/`)**
```
/dist/
└── 📁 */                           # Compiled TypeScript output
```

### **Coverage Reports (`/coverage/`)**
```
/coverage/
├── 📄 index.html                   # Coverage report index
├── 📄 lcov.info                    # LCOV coverage data
└── 📁 */                           # Coverage report files
```

### **Configuration Files**
```
📄 flyway.conf                      # Flyway database migration configuration
📄 conf/flyway.conf                 # Alternative Flyway configuration
📄 jest.config.js                   # Main Jest configuration
📄 jest.deckbuilding.config.js      # Deckbuilding-specific Jest config
📄 jest.dom.config.js               # DOM testing Jest configuration
📄 jest.integration.config.js       # Integration testing Jest config
📄 jest.unit.config.js              # Unit testing Jest configuration
📄 run-integration-tests.sh         # Integration test runner script
```

## 📝 **Documentation Files**

### **Project Documentation**
```
📄 README.md                        # Main project documentation
📄 docs/current/PROJECT_LAYOUT.md   # Project structure guide
📄 docs/current/AGENTOS_INHERITANCE.md  # AgentOS cache, precedence, and recovery contract
📄 docs/current/API_DOCUMENTATION.md  # API endpoints and usage
📄 docs/current/DEPLOYMENT.md       # Deployment instructions
📄 docs/current/DEPLOYMENT_STRATEGY.md  # Detailed deployment strategy
📄 docs/current/SERVER_STARTUP.md       # Server startup guide
📄 docs/current/STYLE_GUIDE_V2.md       # v2 React SPA visual source of truth
📄 docs/current/GUEST_DECK_LESSONS_LEARNED.md  # Guest +Deck / session deck attempts and why we disabled +Deck for GUEST
```

### Documentation map and context files

**Feature `.md` files** under `frontend/src/features/` and component folders document v2 screens (e.g. `DeckEditorPage.md`, `DatabasePage.md`). Backend context: `.cursorrules` per directory under `src/`.

## 🎯 **Key Architectural Decisions**

1. **v2 React SPA**: Production UI in `frontend/` (React 19 + Vite + TypeScript)
2. **Service-Based Architecture**: Clean separation between frontend and backend services
3. **Comprehensive Testing**: Unit and integration tests for all major functionality
4. **Infrastructure as Code**: Terraform-managed AWS infrastructure
5. **Database Migrations**: Flyway-managed schema evolution
6. **Containerization**: Docker support for consistent deployments

## 🚀 **Getting Started**

1. **Development:** Run repo root `npm run dev` (API :8085) and `frontend/npm run dev` (SPA :5173)
2. **Testing:** Run `npm run test:unit` for unit tests or `npm run test:integration` for integration tests
3. **Building:** Run `npm run build` in `frontend/` for the SPA; repo root `npm run build` for backend
4. **Deployment:** Follow instructions in `docs/current/DEPLOYMENT.md`

---

*This documentation reflects the current project structure. For v2 frontend details, see [`FRONTEND_V2.md`](FRONTEND_V2.md).*
