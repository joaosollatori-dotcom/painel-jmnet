import { LeadHistory, updateLead, Lead } from './leadService';

/*
  🚀 ACTION SERVICE - TITAN ISP
  Orquestra interações vitais: Abertura WA, Ligações, Emails e Registro no Timeline
*/

export const logInteraction = async (leadId: string, type: string, action: string, message: string = '') => {
    console.log(`[SYS Action Log Event] Lead: ${leadId} | Type: ${type} | Action: ${action}`, message);
    // TODO: In a real database scenario, insert a new record into `LeadHistory` table targeting `leadId`.

    // Simulate updating the `last_interaction` date in Lead row so SLA counts correctly.
    try {
        await updateLead(leadId, { dataUltimaInteracao: new Date().toISOString() });
    } catch (e) {
        console.warn('Failed to update lead interaction date internally', e);
    }
};

export const dispatchWhatsApp = async (phone: string, textTemplate: string, leadId?: string) => {
    // Tratativa do texto e número
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedText = encodeURIComponent(textTemplate);
    const link = `https://wa.me/55${cleanPhone}?text=${encodedText}`;

    // Dispara log pro banco
    if (leadId) {
        await logInteraction(leadId, 'WA', 'Mensagem WA Enviada', 'Template ou mensagem avulsa acionada e link aberto.');
    }

    // Navega em nova guia para abrir Web.App
    window.open(link, '_blank');
};

export const dispatchCall = async (phone: string, leadId?: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const link = `tel:+55${cleanPhone}`;

    if (leadId) {
        await logInteraction(leadId, 'CALL', 'Ligação Telefônica', 'Botão ou gatilho de ligar acionado no sistema.');
    }

    // Dispara handler do SO
    window.location.href = link;
};

export const dispatchNote = async (leadId: string, noteContent: string) => {
    if (!noteContent.trim()) return false;
    await logInteraction(leadId, 'SYS', 'Nova Nota Inserida', noteContent);
    return true;
};
