import { Lead } from './leadService';
import { Contrato } from './contratoService';

interface ContratoPlaceholders {
    '[CLIENTE_NOME]': string;
    '[CLIENTE_CPF_CNPJ]': string;
    '[CLIENTE_EMAIL]': string;
    '[CLIENTE_TELEFONE]': string;
    '[CLIENTE_ENDERECO]': string;
    '[CLIENTE_BAIRRO]': string;
    '[CLIENTE_CIDADE]': string;
    '[CLIENTE_ESTADO]': string;
    '[PLANO_NOME]': string;
    '[PLANO_VALOR]': string;
    '[PLANO_VELOCIDADE_DOWN]': string;
    '[PLANO_VELOCIDADE_UP]': string;
    '[CONTRATO_DATA]': string;
    '[EMPRESA_NOME]': string;
    '[EMPRESA_CNPJ]': string;
}

export const gerarContratoText = (
    template: string,
    lead: Partial<Lead>,
    contrato?: Partial<Contrato>,
    empresa?: { nome: string, cnpj: string }
): string => {
    const today = new Date();

    // Fallbacks para campos que podem estar vazios
    const dict: Record<string, string> = {
        '[CLIENTE_NOME]': lead.nomeCompleto || lead.nome_fantasia || 'Nome não informado',
        '[CLIENTE_CPF_CNPJ]': lead.cpfCnpj || lead.cnpj || 'Documento não informado',
        '[CLIENTE_EMAIL]': lead.email || 'Email não informado',
        '[CLIENTE_TELEFONE]': lead.telefonePrincipal || lead.celular || 'Telefone não informado',
        '[CLIENTE_ENDERECO]': lead.logradouro ? `${lead.logradouro}, ${lead.numero || 'SN'}` : 'Endereço não informado',
        '[CLIENTE_BAIRRO]': lead.bairro || 'Bairro não informado',
        '[CLIENTE_CIDADE]': lead.cidade || 'Cidade não informada',
        '[CLIENTE_ESTADO]': lead.estado || 'Estado não informado',

        '[PLANO_NOME]': contrato?.planoInternet || lead.interessePlano || 'Plano Padrão',
        '[PLANO_VALOR]': contrato?.valorMensal ? `R$ ${contrato.valorMensal.toFixed(2)}` : lead.valorPlano ? `R$ ${lead.valorPlano}` : 'Sem valor',
        '[PLANO_VELOCIDADE_DOWN]': contrato?.velocidadeDown ? `${contrato.velocidadeDown} Mega` : 'Não definido',
        '[PLANO_VELOCIDADE_UP]': contrato?.velocidadeUp ? `${contrato.velocidadeUp} Mega` : 'Não definido',

        '[CONTRATO_DATA]': today.toLocaleDateString('pt-BR'),
        '[EMPRESA_NOME]': empresa?.nome || 'Provedor de Internet LTDA',
        '[EMPRESA_CNPJ]': empresa?.cnpj || '00.000.000/0001-00'
    };

    let generated = template;

    Object.keys(dict).forEach(placeholder => {
        const value = dict[placeholder] || '';
        // Substituir globalmente o placeholder escapado
        const regex = new RegExp(placeholder.replace(/\[/g, '\\[').replace(/\]/g, '\\]'), 'g');
        generated = generated.replace(regex, value);
    });

    return generated;
};
