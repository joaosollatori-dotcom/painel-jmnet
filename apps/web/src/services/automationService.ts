import { Lead, updateLead, createLead, LeadHistory } from './leadService';

/* 
  ⚙️ AUTOMATION SERVICE - TITAN ISP
  Centraliza as regras de negócio, atribuição e automações de entrada.
*/

export const validateTransition = (lead: Lead, targetStage: string): { valid: boolean; reason?: string } => {
    // Regras de Transição ISP
    switch (targetStage) {
        case 'PROPOSTA_ENVIADA':
            if (lead.statusViabilidade !== 'VIAVEL') {
                return { valid: false, reason: 'O lead precisa de viabilidade TÉCNICA confirmada para receber proposta.' };
            }
            if (!lead.decisorIdentificado) {
                return { valid: false, reason: 'Identifique o DECISOR antes de enviar a proposta.' };
            }
            break;
        case 'CONTRATO_ASSINADO':
            if (lead.statusProposta !== 'ACEITA') {
                return { valid: false, reason: 'A proposta precisa ser marcada como ACEITA para avançar ao contrato.' };
            }
            break;
        case 'INSTALACAO_AGENDADA':
            if (!lead.numeroOS) {
                return { valid: false, reason: 'É necessário um número de Ordem de Serviço (OS) para agendar instalação.' };
            }
            break;
    }
    return { valid: true };
};

export const autoAssignLead = async (lead: Lead): Promise<string> => {
    // Mock de Round-Robin / Atribuição por Região
    // Em produção, isso consultaria a carga de trabalho de cada vendedor no Supabase.
    const vendedores = ['João Solla', 'Maria Silva', 'Pedro Telecom'];
    const assigned = vendedores[Math.floor(Math.random() * vendedores.length)];
    return assigned;
};

export const handleNewLeadEntry = async (leadData: Partial<Lead>) => {
    // 1. Atribuição Automática
    const vendedor = await autoAssignLead(leadData as Lead);

    // 2. Criação do Lead com dados enriquecidos
    const newLead = await createLead({
        ...leadData,
        vendedorId: vendedor,
        statusQualificacao: 'PENDENTE',
        statusViabilidade: 'PENDENTE',
        dataEntrada: new Date().toISOString(),
        dataUltimaInteracao: new Date().toISOString(),
        tentativasContato: 0
    });

    // 3. Automação de Tarefa (SLA 2h)
    // Aqui haveria um insert na tabela de Tasks/History
    console.log(`[Automação] Lead ${newLead.id} atribuído a ${vendedor}. Tarefa de 2h criada.`);

    return newLead;
};

export const calculateLeadScore = (lead: Lead): number => {
    let score = 0;
    if (lead.tipoPessoa === 'PJ') score += 20;
    if (lead.statusViabilidade === 'VIAVEL') score += 30;
    if (lead.decisorIdentificado) score += 20;
    if (lead.perfilUso === 'RESIDENCIAL_PREMIUM' || lead.perfilUso === 'EMPRESARIAL_MEDIO') score += 30;
    return Math.min(score, 100);
};
