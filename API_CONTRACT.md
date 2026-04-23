# API Contract - TITÃ | ISP

Base URL: `http://localhost:3001/v1` (Dev) / `https://api.titan-isp.com/v1` (Prod)
Protocol: HTTP/1.1
Content-Type: `application/json`

## Common Responses

### Success
```json
{
  "success": true,
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "message": "Detailed error message"
}
```

---

## 1. Assinantes (Subscribers)
Prefix: `/assinantes`

### List All
- **Method**: `GET`
- **Route**: `/`
- **Output**: Array of `Assinante` objects.

### Get by ID
- **Method**: `GET`
- **Route**: `/:id`
- **Output**: Single `Assinante` object.

### Create Assinante
- **Method**: `POST`
- **Route**: `/`
- **Payload**:
```typescript
{
  nome: string;
  cpfCnpj: string;
  status: 'ATIVO' | 'BLOQUEADO' | 'CANCELADO';
  contatos?: Array<{ tipo: string; valor: string }>;
  enderecos?: Array<{
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    tipo?: string; // Default: 'INSTALACAO'
  }>;
}
```

---

## 2. Financeiro (Financial)
Prefix: `/financeiro`

### List Faturas
- **Method**: `GET`
- **Route**: `/faturas`
- **Query Params**: `assinanteId?`, `status?`

### Get Dashboard Data
- **Method**: `GET`
- **Route**: `/dashboard`
- **Output**: `{ totalRecebido: number, totalPendente: number, inadimplencia: number }`

---

## 3. OS (Service Orders)
Prefix: `/os`

### List OS
- **Method**: `GET`
- **Route**: `/`

### Create OS
- **Method**: `POST`
- **Route**: `/`
- **Payload**:
```typescript
{
  assinanteId: string;
  tecnicoId?: string;
  tipo: string;
  descricao: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  dataAgendamento?: string; // ISO Date
}
```

---

## 4. Rede (Network)
Prefix: `/rede`

### List OLTs
- **Method**: `GET`
- **Route**: `/olts`

### Get ONU Status
- **Method**: `GET`
- **Route**: `/onus/:serial/status`
- **Output**: `{ status: 'ONLINE' | 'OFFLINE', power: string, distance: number }`

---

## 5. Audit (Auditing)
Prefix: `/audit`

### List Logs
- **Method**: `GET`
- **Route**: `/`
- **Query Params**: `tenantId?`, `actorId?`, `resource?`

---

## 6. Invitations
Prefix: `/invitations`

### Create Invitation
- **Method**: `POST`
- **Route**: `/`
- **Payload**: `{ email: string, role: string, tenantId: string }`
- **Output**: `{ success: true, inviteLink: string }`

---

## 7. WhatsApp
Prefix: `/whatsapp`

### Send Message
- **Method**: `POST`
- **Route**: `/send`
- **Payload**: `{ phone: string, message: string, mediaUrl?: string }`
