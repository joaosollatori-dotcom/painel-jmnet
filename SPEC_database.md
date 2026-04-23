# Database Specification - TITÃ | ISP

## Technology Stack
- **Engine**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Extensions**: `pg_crypto` (for UUID generation), `pg_vector` (implied in background context, but not explicitly used in primary schema yet).

## Schema Overview

### Core Entities

#### Multi-Tenancy
- **Tenant**: Central entity for isolation.
  - Fields: `id`, `name`, `slug`, `plan`, `is_active`, `created_at`.
  - Relations: Owns almost all other entities.

#### Identity & Access
- **Profile**: Extended user data in `public` schema.
  - Fields: `id` (references auth.users), `tenant_id`, `full_name`, `email`, `role`, `is_active`.
  - Roles: `ADMIN`, `VENDEDOR`, `TECNICO`, `SUPER_ADMIN`.
- **User**: Read-only view or sync of base user data.
- **invitations**: Pending user invites.
  - Fields: `email`, `invite_token`, `role`, `tenant_id`, `expires_at`.

#### CRM & Sales
- **Lead**: Potential customers.
  - Fields: `nomeCompleto`, `cpfCnpj`, `email`, `telefonePrincipal`, `statusProposta` (`PENDENTE`, `ACEITO`, etc).
- **Appointment**: Scheduled events for leads.
- **ContratoAssinatura**: Digital contract tracking.

#### Customer Management (Assinantes)
- **Assinante**: Converted customers.
  - Fields: `nome`, `cpfCnpj`, `status` (`ATIVO`, `INATIVO`).
- **Endereco**: Multiple addresses per subscriber (e.g., COBRANCA, INSTALACAO).
- **Contato**: Phone/Email entries.
- **AssinanteSVA**: Added-value services (SVA).

#### Financial
- **Fatura**: Invoices linked to subscribers.
  - Fields: `valor`, `vencimento`, `status` (`PENDENTE`, `PAGO`).
- **Pagamento**: Transaction records.
- **NotaFiscal**: Linked to invoices.

#### Operations
- **OrdemServico (OS)**: Field service requests.
  - Fields: `tipo`, `status` (`ABERTA`, `FECHADA`), `prioridade`.
- **customer_occurrences**: Initial customer complaints/requests.

#### Network & Infrastructure
- **OLT**: Optical Line Terminals.
  - Fields: `nome`, `ip`, `modelo`, `comunidade` (SNMP).
- **ONU**: Optical Network Units.
  - Fields: `serial`, `ponPort`, `status`.

#### Communications & Audit
- **Conversation**: WhatsApp or internal chat threads.
- **Message**: Individual messages in a conversation.
- **AuditLog**: Detailed tracking of system actions.
  - Fields: `actor_id`, `action`, `resource`, `details` (JSON), `ip_address`.

## Security & Logic

### Row Level Security (RLS)
- **profiles**: Restricted to `auth.uid() = id`, or `SUPER_ADMIN` access.
- **tenants**: Isolated by `tenant_id` on all sub-entities (enforced via application logic and DB constraints).

### Database Triggers
- `handle_new_user_with_tenant`: Executes on `auth.users` insertion.
  - Logic: Checks for an existing invite; if found, links user to the invite's tenant and role. If not, creates a new Tenant and assigns the user as `ADMIN`.

### Prisma Conventions
- Use of `dbgenerated("gen_random_uuid()")` for IDs.
- Timestamps: `createdAt`, `updatedAt` using `@db.Timestamptz(6)`.
- Explicit mapping for some tables (e.g., `@@map("tenants")`).
