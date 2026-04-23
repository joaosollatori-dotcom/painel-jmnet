# Backend Specification - TITÃ | ISP

## Technology Stack
- **Runtime**: Node.js
- **Framework**: [Fastify](https://www.fastify.io/)
- **Language**: TypeScript
- **Validation**: [Zod](https://zod.dev/) with `fastify-type-provider-zod`
- **Database Client**: [Prisma](https://www.prisma.io/)
- **Background Jobs**: [BullMQ](https://docs.bullmq.io/) with Redis
- **Security**: JWT (`@fastify/jwt`), CORS (`@fastify/cors`)

## Architecture

### Project Structure (`apps/api/src`)
- `modules/`: Feature-based decomposition.
  - Each module typically contains:
    - `*.routes.ts`: Endpoint definitions and Zod schema mapping.
    - `*.schema.ts`: Input/Output validation schemas using Zod.
    - `*.service.ts`: Business logic and Database interactions via Prisma.
- `plugins/`: Fastify plugins for shared resources (Prisma, Redis, BullMQ, Audit).
- `jobs/`: Background worker definitions.
- `lib/`: Shared utilities.
- `server.ts`: Entry point and plugin registration.

### Core Patterns
- **Multi-Tenancy**: Most services expect a `tenantId` (often extracted from the request or user profile) to filter Prisma queries.
- **Auditing**: An `auditPlugin` automatically logs sensitive actions to the `AuditLog` table.
- **Type Safety**: Endpoints use `withTypeProvider<ZodTypeProvider>()` for end-to-end type safety from schema to handler.

### Background Processing
- Uses Redis as the message broker.
- BullMQ manages queues for tasks like:
  - Contract generation.
  - Network monitoring (OLT/ONU).
  - External API sync (GenieACS, WhatsApp).

### Security Components
- **IP Shield**: Backend checks user IP against `AllowedIP` table for restricted actions.
- **KRA/CVA Validation**: Logic to validate field technician access codes.
- **Tenant Enforcement**: Middleware/Logic patterns to ensure users can only access data belonging to their `tenant_id`.

## Service Modules
1. **Assinantes**: CRUD for subscribers, addresses, and contacts.
2. **Financeiro**: Invoices, payments, and financial dashboards.
3. **Rede**: OLT/ONU management, SNMP monitoring.
4. **GenieACS**: Integration with TR-069 ACS for CPE management.
5. **OS**: Service order lifecycle (Open -> Assigned -> Closed).
6. **WhatsApp**: Webhook handlers and outbound messaging.
7. **Audit**: System-wide log retrieval and dashboarding.
8. **Invitation**: Management of employee invites.
9. **Telefonia**: Integration with VoIP/PBX platforms.
10. **Assinatura**: Digital certificate and contract signing workflow.
