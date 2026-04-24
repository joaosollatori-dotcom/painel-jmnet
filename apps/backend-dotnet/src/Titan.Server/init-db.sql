-- Titan Server - Script de Inicialização da Base de Dados (Seed)
-- Este script configura as roles, permissões e o ambiente inicial.

-- 1. Criação das Roles (Papéis) com TenantId
INSERT INTO "AspNetRoles" ("Id", "Name", "NormalizedName", "ConcurrencyStamp", "TenantId")
VALUES 
    ('operador', 'Operador', 'OPERADOR', gen_random_uuid()::text, 'master'),
    ('supervisor', 'Supervisor', 'SUPERVISOR', gen_random_uuid()::text, 'master'),
    ('admin', 'Admin', 'ADMIN', gen_random_uuid()::text, 'master'),
    ('auditor', 'Auditor', 'AUDITOR', gen_random_uuid()::text, 'master')
ON CONFLICT ("Id") DO NOTHING;

-- 2. Definição de Permissões (Claims de Role) com TenantId
DO $$
DECLARE
    role_admin_id TEXT := 'admin';
    role_sub_id TEXT := 'supervisor';
    role_op_id TEXT := 'operador';
    role_aud_id TEXT := 'auditor';
    tenant_id TEXT := 'master';
BEGIN
    -- Permissões para Admin (Tudo)
    INSERT INTO "AspNetRoleClaims" ("RoleId", "ClaimType", "ClaimValue", "TenantId")
    VALUES 
        (role_admin_id, 'permission', 'tenant.create', tenant_id),
        (role_admin_id, 'permission', 'member.invite', tenant_id),
        (role_admin_id, 'permission', 'chat.reply', tenant_id),
        (role_admin_id, 'permission', 'crm.edit', tenant_id),
        (role_admin_id, 'permission', 'device.remote_access', tenant_id),
        (role_admin_id, 'permission', 'device.restart', tenant_id),
        (role_admin_id, 'permission', 'billing.view', tenant_id),
        (role_admin_id, 'permission', 'audit.view', tenant_id);

    -- Permissões para Supervisor
    INSERT INTO "AspNetRoleClaims" ("RoleId", "ClaimType", "ClaimValue", "TenantId")
    VALUES 
        (role_sub_id, 'permission', 'member.invite', tenant_id),
        (role_sub_id, 'permission', 'chat.reply', tenant_id),
        (role_sub_id, 'permission', 'crm.edit', tenant_id),
        (role_sub_id, 'permission', 'device.remote_access', tenant_id),
        (role_sub_id, 'permission', 'device.restart', tenant_id),
        (role_sub_id, 'permission', 'billing.view', tenant_id);

    -- Permissões para Operador
    INSERT INTO "AspNetRoleClaims" ("RoleId", "ClaimType", "ClaimValue", "TenantId")
    VALUES 
        (role_op_id, 'permission', 'chat.reply', tenant_id),
        (role_op_id, 'permission', 'crm.edit', tenant_id),
        (role_op_id, 'permission', 'device.remote_access', tenant_id);

    -- Permissões para Auditor
    INSERT INTO "AspNetRoleClaims" ("RoleId", "ClaimType", "ClaimValue", "TenantId")
    VALUES 
        (role_aud_id, 'permission', 'billing.view', tenant_id),
        (role_aud_id, 'permission', 'audit.view', tenant_id);
END $$;

-- 3. Criação do Tenant Inicial (Tenant Mestre)
-- Nota: A tabela foi criada automaticamente pelas migrações do EF Core.

INSERT INTO "TenantInfo" ("Id", "Identifier", "Name", "AdminEmail", "IsActive")
VALUES ('master', 'titan', 'TITÃ ISP - Admin Central', 'admin@titan.com.br', TRUE)
ON CONFLICT ("Id") DO NOTHING;

-- 4. Criação do Usuário Mestre (Exemplo)
-- Nota: A senha deve ser gerada pelo Identity no primeiro run ou via CLI.
-- Este é apenas um placeholder estrutural.
