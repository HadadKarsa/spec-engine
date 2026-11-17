// Prompt templates for spec generation pipeline

export const SPEC_SYSTEM_PROMPT = `You are an elite software architect and technical writer. You produce production-grade technical specifications that AI coding agents (Cursor, Claude Code, Windsurf, Antigravity) can directly consume to build complete applications.

Your output is ALWAYS in clean Markdown format. Be thorough, specific, and opinionated about implementation details. Do not use vague language — provide concrete types, names, structures, and patterns.`;

export interface SpecContext {
  idea: string;
  interviewHistory: string;
  summary: string;
  previousSpecs?: Record<string, string>;
}

function buildContext(ctx: SpecContext): string {
  let base = `## Project Context

**Original Idea:** ${ctx.idea}

**Interview Transcript:**
${ctx.interviewHistory}

**Project Summary:** ${ctx.summary}`;

  if (ctx.previousSpecs) {
    base += '\n\n## Previously Generated Specs (for cross-reference)\n';
    for (const [name, content] of Object.entries(ctx.previousSpecs)) {
      base += `\n### ${name}\n${content.slice(0, 3000)}${content.length > 3000 ? '\n...(truncated)' : ''}\n`;
    }
  }

  return base;
}

export const SPEC_PROMPTS: Record<string, (ctx: SpecContext) => string> = {

  '01_PRD.md': (ctx) => `${buildContext(ctx)}

---

Generate a comprehensive Product Requirements Document (PRD) in Markdown with these sections:

# Product Requirements Document (PRD)

## 1. Overview
- Product name, tagline, one-paragraph description
- Problem statement and proposed solution

## 2. Goals & Success Metrics
- Primary goals (3-5)
- Key metrics / KPIs to measure success

## 3. User Personas
- 2-4 detailed personas with: Name, Role, Pain Points, Goals, Tech Savviness

## 4. User Stories & Use Cases
- Organized by persona
- Format: "As a [persona], I want to [action] so that [benefit]"
- Priority: Must-Have (MVP) / Should-Have / Nice-to-Have

## 5. Feature Specifications
### 5.1 MVP Features (Phase 1)
- Feature name, description, acceptance criteria for each

### 5.2 Phase 2 Features
- Planned future features

## 6. Non-Functional Requirements
- Performance targets
- Security requirements
- Accessibility requirements
- Browser/device support

## 7. Out of Scope
- Explicitly list what is NOT included

Be specific with real feature names, concrete acceptance criteria, and measurable targets.`,

  '02_ARCHITECTURE.md': (ctx) => `${buildContext(ctx)}

---

Generate a comprehensive Architecture Document in Markdown:

# Architecture Document

## 1. System Overview & Diagram
- High-level architecture pattern (monolith, microservices, serverless, modular monolith, etc.)
- **Interactive System Architecture Diagram:** Include a valid Mermaid diagram using \`\`\`mermaid flowchart TD or graph TD\`\`\` showing Client/Frontend, API Gateway/Backend, Database, Cache/Queue, and external services.

## 2. Tech Stack
- Frontend: framework, state management, styling, routing
- Backend: framework, runtime, API style (REST/GraphQL/tRPC)
- Database: type, specific technology, ORM
- Auth: strategy and provider
- Hosting/Deployment: platform, CI/CD
- Justify each choice briefly

## 3. Project Structure
\`\`\`
project-root/
├── (complete folder structure with explanations)
\`\`\`

## 4. Component Architecture & Data Flow
- Key frontend components and their relationships
- State management patterns
- **Core User Flow Diagram:** Include a valid Mermaid sequence diagram using \`\`\`mermaid sequenceDiagram\`\`\` showing the primary user flow (e.g. Auth/Action/Data transaction).

## 5. Backend Architecture
- API layer design
- Service layer patterns
- Middleware stack
- Error handling strategy

## 6. Authentication & Authorization
- Auth flow description
- Role-based access control (RBAC) design
- Session/token management

## 7. Infrastructure
- Environment setup (dev, staging, prod)
- Environment variables needed
- Third-party services and their roles

## 8. Performance Considerations
- Caching strategy
- Database indexing strategy
- CDN/asset optimization

Be opinionated — pick specific technologies and justify them.`,

  '03_DATABASE.md': (ctx) => `${buildContext(ctx)}

---

Generate a comprehensive Database Schema Document in Markdown:

# Database Schema

## 1. Overview
- Database type and justification
- ORM/query builder choice
- Naming conventions

## 2. Visual Entity Relationship Diagram (ERD)
- **Interactive ERD Diagram:** Include a complete, valid Mermaid ER diagram using \`\`\`mermaid erDiagram\`\`\` depicting all entities, their primary/foreign key attributes, and cardinality (e.g. \`USER ||--o{ POST : "creates"\`).

## 3. Schema Definitions

For EACH entity, provide:

### [EntityName]
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid/int | PK, auto | Primary key |
| ... | ... | ... | ... |

**Indexes:**
- List of indexes with justification

**Relationships:**
- Foreign keys and their targets

## 4. Enums & Constants
- All enum types used across the schema

## 5. Seed Data
- Essential seed data for development/testing

## 6. Migration Strategy
- Migration tool
- Versioning approach
- Rollback strategy

Include ALL fields with proper types, constraints (NOT NULL, UNIQUE, DEFAULT), and indexes.`,

  '04_API_SPECS.md': (ctx) => `${buildContext(ctx)}

---

Generate comprehensive API Specifications in Markdown:

# API Specifications

## 1. Overview
- API style (REST/GraphQL/tRPC)
- Base URL structure
- Versioning strategy
- Authentication method for API calls

## 2. Common Patterns
- Request/Response format
- Error response format with error codes
- Pagination format
- Rate limiting

## 3. Endpoints

For EACH endpoint, provide:

### [METHOD] /api/path
**Description:** What this endpoint does
**Auth:** Required/Public
**Role:** Which roles can access

**Request:**
\`\`\`json
{
  "field": "type — description"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "field": "type — description"
}
\`\`\`

**Error Responses:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | ... |
| 401 | UNAUTHORIZED | ... |

## 4. WebSocket Events (if applicable)
- Event names, payloads, and triggers

## 5. Webhook Endpoints (if applicable)
- Incoming webhook handlers

Cover ALL CRUD operations for every entity, plus auth endpoints, search, and any special operations.`,

  '05_TASKS_CHECKLIST.md': (ctx) => `${buildContext(ctx)}

---

Generate a step-by-step implementation checklist optimized for AI coding agents (Cursor, Claude Code, Windsurf, Antigravity). This should be a complete build roadmap that an AI agent can follow sequentially.

# Implementation Checklist

## Phase 0: Project Setup
- [ ] Initialize project with specified tech stack
- [ ] Configure environment variables
- [ ] Set up development tooling (linter, formatter, etc.)
- [ ] Create folder structure
- [ ] (List every specific setup step)

## Phase 1: Database & Models
- [ ] Set up database connection
- [ ] Create schema/models for each entity
- [ ] Set up migrations
- [ ] Create seed data
- [ ] (Each entity as a separate task)

## Phase 2: Authentication
- [ ] Set up auth provider/strategy
- [ ] Create login/register flows
- [ ] Implement middleware for protected routes
- [ ] Set up role-based access

## Phase 3: Core API
- [ ] (Each endpoint group as a separate section)
- [ ] Each endpoint as a separate checkbox
- [ ] Include validation, error handling for each

## Phase 4: Frontend - Layout & Navigation
- [ ] Set up routing
- [ ] Create layout components
- [ ] Build navigation
- [ ] Implement responsive design

## Phase 5: Frontend - Core Features
- [ ] (Each feature as a section with sub-tasks)
- [ ] Include state management for each feature
- [ ] Include API integration for each feature

## Phase 6: Testing
- [ ] Unit tests for critical business logic
- [ ] API endpoint tests
- [ ] Integration tests

## Phase 7: Polish & Deploy
- [ ] Error boundaries and fallbacks
- [ ] Loading states
- [ ] SEO/meta tags
- [ ] Deployment configuration

RULES:
- Each task should be specific enough for an AI agent to implement in one go
- Include the exact file paths where work should happen
- Order tasks so each builds on the previous
- Mark dependencies between tasks
- Estimate complexity: 🟢 Simple | 🟡 Medium | 🔴 Complex`,

  'PROJECT_MEMORY.md': (ctx) => `${buildContext(ctx)}

---

Generate a Project Memory / Context file that maintains continuity across coding sessions. This file will be read by AI coding agents at the start of each session to understand the project state.

# Project Memory

## Identity
- **Project:** [Name]
- **Description:** [One-liner]
- **Generated:** [Date]

## Architecture Snapshot
- **Stack:** [Frontend] + [Backend] + [Database]
- **Auth:** [Strategy]
- **Hosting:** [Platform]
- **Key Patterns:** [List architectural patterns used]

## Data Model Summary
| Entity | Key Fields | Relationships |
|--------|-----------|---------------|
| ... | ... | ... |

## API Surface
| Group | Endpoints | Auth |
|-------|-----------|------|
| ... | ... | ... |

## File Map
\`\`\`
src/
├── key directories and their purpose
\`\`\`

## Current State
- **Phase:** Setup / Development / Testing / Production
- **Completed:** [List completed features]
- **In Progress:** [Current work]
- **Blocked:** [Any blockers]

## Conventions
- Naming conventions (files, variables, components)
- Code style rules
- Git branch strategy
- Commit message format

## Environment Variables
| Variable | Purpose | Required |
|----------|---------|----------|
| ... | ... | ... |

## Known Issues & Decisions
- Decision log: key technical decisions and their rationale
- Known limitations or tech debt

## Quick Commands
\`\`\`bash
# Dev server
# Build
# Test
# Deploy
# Database
\`\`\`

This file should be a COMPLETE snapshot that lets any AI agent (or human developer) pick up the project cold and know exactly what's going on.`,

  '06_UI_WIREFRAMES.html': (ctx) => `${buildContext(ctx)}

---

Generate a complete, beautiful, interactive single-file UI Wireframe / Prototype in HTML with Tailwind CSS.
This prototype will be rendered directly in an interactive sandbox preview.

CRITICAL REQUIREMENTS:
- Produce a standalone, valid HTML5 file starting with <!DOCTYPE html>
- Include Tailwind CSS CDN: <script src="https://cdn.tailwindcss.com"></script>
- Use Google Font 'Inter': <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap">
- Clean, modern, high-contrast dark aesthetic (slate/zinc-900 background, vibrant accent colors like indigo/violet, crisp borders)
- Build an interactive tabbed multi-screen prototype containing:
  1. Top Navigation Bar or Sidebar (with App Brand, Nav links, Search input, and User Avatar)
  2. Tab/View Switcher to toggle between 3 core screens:
     - Screen 1: Dashboard / Main Overview (Metric summary KPI cards, chart placeholder or activity feed, quick action button)
     - Screen 2: Data List / Table / Feed (Search filter bar, status badges, pagination, action dropdown/buttons)
     - Screen 3: Detail / Creation Form Modal (A comprehensive form or detail view matching the app's core feature)
- Include clean inline vanilla JavaScript inside <script> tags to handle:
  - Tab switching between Screen 1, Screen 2, and Screen 3
  - Modal open/close toggle
  - Interactive toast/notification trigger on button click
- Populate with REALISTIC dummy domain data (e.g. realistic names, Indonesian or English contextual text, realistic numbers, dates, statuses)
- Output valid HTML code.`,
};

export const SPEC_ORDER = [
  '01_PRD.md',
  '02_ARCHITECTURE.md',
  '03_DATABASE.md',
  '04_API_SPECS.md',
  '05_TASKS_CHECKLIST.md',
  'PROJECT_MEMORY.md',
  '06_UI_WIREFRAMES.html',
];
