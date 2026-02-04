# 📁 Project Layout Documentation

This document provides a comprehensive overview of the Excelsior Deckbuilder project structure, describing each key file and directory and their purpose.

## 🏗️ **Root Directory Structure**

```
/Users/kyle/cursored/
├── 📄 README.md                    # Main project documentation
├── 📄 docs/current/PROJECT_LAYOUT.md  # Project structure documentation
├── 📄 docs/current/API_DOCUMENTATION.md  # API endpoints and usage documentation
├── 📄 docs/current/DEPLOYMENT.md   # Deployment instructions and strategies
├── 📄 docs/current/DEPLOYMENT_STRATEGY.md  # Detailed deployment strategy
├── 📄 docs/history/REFACTORING_SUMMARY.md  # Database refactoring summary
├── 📄 docs/current/SERVER_STARTUP.md       # Server startup and configuration guide
├── 📄 docs/current/STYLE_GUIDE.md          # Code style and formatting guidelines
├── 📄 docs/current/TESTING_GUIDE.md        # How to run unit/integration tests
├── 📄 package.json                 # Node.js dependencies and scripts
├── 📄 tsconfig.json                # TypeScript configuration
├── 📄 jest.config.js               # Jest testing configuration
└── 📄 jest.*.config.js             # Specific Jest configurations for different test types
```

## 🎨 **Frontend Structure (`/public/`)**

### **Main Application Files**
```
/public/
├── 📄 index.html                   # Main application entry point (9,255 lines after refactoring)
├── 📄 deck-builder.html            # Deck builder interface
├── 📄 database.html                # Database view interface
├── 📄 database-view.html           # Database view page
└── 📄 test-payload.json            # Test data payload
```

### **CSS Styles (`/public/css/`)**
```
/public/css/
└── 📄 index.css                    # All application styles (extracted from index.html in Phase 1)
```

### **JavaScript Modules (`/public/js/`)**
```
/public/js/
├── 📄 utilities.js                 # Phase 2: Core utility functions and app initialization
├── 📄 card-display.js              # Phase 3: All card rendering and display functions
├── 📄 deck-editor-simple.js        # Phase 4: Basic deck editor functionality
├── 📄 auth-service.js              # Phase 5: User authentication and session management
├── 📄 data-loading.js              # Phase 6: API data loading and management
├── 📄 search-filter.js             # Phase 7: Search and filtering functionality
├── 📄 layout-manager.js            # Phase 7: Centralized layout management
├── 📄 deck-management.js           # Phase 8: Deck creation, editing, and management
├── 📄 ui-utility-functions.js      # Phase 9: UI interactions and utility functions
├── 📄 layout-drag-drop-functions.js # Phase 10A: Drag-and-drop functionality
├── 📄 validation-calculation-functions.js # Phase 10B: Deck validation and calculations
├── 📄 remaining-utility-functions.js # Phase 10C: Remaining utility functions
├── 📄 template-loader.js           # Phase 11B: HTML template loading and injection
├── 📄 event-binder.js              # Phase 11B: Centralized event binding for data attributes
└── 📄 filter-functions.js          # Phase 11C & 12: Filter-related functions and utilities
```

### **HTML Templates (`/public/templates/`)**
```
/public/templates/
├── 📄 deck-editor-template.html    # Phase 11A: Deck editor modal HTML structure
├── 📄 modal-templates.html         # Phase 11A: Various modal HTML structures
└── 📄 database-view-template.html  # Phase 11A: Database view HTML structure
```

### **Components (`/public/components/`)**
```
/public/components/
├── 📄 globalNav.html               # Global navigation component
├── 📄 globalNav.js                 # Global navigation JavaScript
└── 📄 globalNav.css                # Global navigation styles
```

### **Resources (`/public/resources/`)**
```
/public/resources/
└── 📄 logo.png                     # Application logo
```

## 🔧 **Backend Structure (`/src/`)**

### **Main Application**
```
/src/
├── 📄 index.ts                     # Main server entry point
├── 📄 test-server.ts               # Test server configuration
└── 📄 index.ts.backup              # Backup of original index.ts
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
├── 📄 FrontendAuthService.ts       # Frontend authentication service
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

### **Public Assets (`/src/public/`)**
```
/src/public/
├── 📄 components/                  # Frontend components
├── 📄 database-view.html           # Database view page
├── 📄 deck-builder.html            # Deck builder page
├── 📄 deck-editor.html             # Deck editor page
├── 📄 deckbuilder.html             # Main deckbuilder page
├── 📄 index.html                   # Main index page
├── 📄 js/                          # JavaScript files
├── 📄 resources/                   # Static resources
└── 📄 styles/                      # CSS stylesheets
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
├── 📄 *.test.ts                    # 68 unit test files covering:
│   ├── Authentication functionality
│   ├── Deck management
│   ├── Card display and validation
│   ├── UI components
│   ├── Database operations
│   ├── Utility functions
│   └── Business logic
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
├── 📄 tfplan                       # Terraform plan file
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
├── 📄 check-production-status.js   # Production status checker
├── 📄 cleanup-test-data.js         # Test data cleanup script
├── 📄 connect-to-production-db.sh  # Production database connection
├── 📄 deploy-fix.sh                # Quick fix deployment script
├── 📄 deploy-to-production.sh      # Full production deployment
├── 📄 fix-flyway-migrations.js     # Flyway migration fixer
├── 📄 fix-guest-password.sql       # Guest password fix SQL
├── 📄 fix-guest-user.js            # Guest user fix script
├── 📄 fix-production-auth.js       # Production authentication fix
├── 📄 fix-production-database.sql  # Production database fix SQL
├── 📄 fix-production-now.js        # Immediate production fix
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
📄 docs/current/API_DOCUMENTATION.md  # API endpoints and usage
📄 docs/current/DEPLOYMENT.md       # Deployment instructions
📄 docs/current/DEPLOYMENT_STRATEGY.md  # Detailed deployment strategy
📄 docs/history/REFACTORING_SUMMARY.md  # Database refactoring summary
📄 docs/current/SERVER_STARTUP.md       # Server startup guide
📄 docs/current/STYLE_GUIDE.md          # Code style guidelines
```

## 🔄 **12-Phase Refactoring History**

This project underwent a comprehensive 12-phase refactoring to transform a monolithic `index.html` file into a well-organized, modular codebase:

- **Phase 1**: CSS Extraction → `public/css/index.css`
- **Phase 2**: JavaScript Extraction → `public/js/utilities.js`
- **Phase 3**: Card Display Functions → `public/js/card-display.js`
- **Phase 4**: Deck Editor Functions → `public/js/deck-editor-simple.js`
- **Phase 5**: Authentication Functions → `public/js/auth-service.js`
- **Phase 6**: Data Loading Functions → `public/js/data-loading.js`
- **Phase 7**: Search and Filter Functions → `public/js/search-filter.js` + `public/js/layout-manager.js`
- **Phase 8**: Deck Management Functions → `public/js/deck-management.js`
- **Phase 9**: UI Utility Functions → `public/js/ui-utility-functions.js`
- **Phase 10**: Layout and Drag-Drop Functions → Multiple specialized files
- **Phase 11**: HTML Structure Optimization → Template system
- **Phase 12**: Final Cleanup and Optimization → Complete refactoring

## 🎯 **Key Architectural Decisions**

1. **Modular Frontend**: Separated concerns into focused JavaScript modules
2. **Template System**: Extracted HTML templates for better maintainability
3. **Service-Based Architecture**: Clean separation between frontend and backend services
4. **Comprehensive Testing**: Unit and integration tests for all major functionality
5. **Infrastructure as Code**: Terraform-managed AWS infrastructure
6. **Database Migrations**: Flyway-managed schema evolution
7. **Containerization**: Docker support for consistent deployments

## 🚀 **Getting Started**

1. **Development**: Run `npm run dev` to start the development server
2. **Testing**: Run `npm run test:unit` for unit tests or `npm run test:integration` for integration tests
3. **Building**: Run `npm run build` to compile TypeScript
4. **Deployment**: Follow instructions in `docs/current/DEPLOYMENT.md`

---

*This documentation reflects the current state of the project after the 12-phase refactoring. For specific implementation details, refer to the individual file documentation and inline comments.*
