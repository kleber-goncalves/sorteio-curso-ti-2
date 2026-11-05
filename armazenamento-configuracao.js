/**
 * Persistência temporária das configurações do sorteio.
 *
 * Este módulo centraliza o acesso ao sessionStorage compartilhado
 * entre a página principal e a página de configuração.
 */

const CHAVE_CONFIGURACAO = "configuracaoSorteio";

function validarEstruturaConfiguracao(dados) {
    return (
        dados !== null &&
        typeof dados === "object" &&
        Number.isSafeInteger(dados.minimo) &&
        Number.isSafeInteger(dados.maximo) &&
        dados.minimo < dados.maximo &&
        dados.maximo - dados.minimo + 1 <= 2 ** 32 &&
        Array.isArray(dados.faixasExcluidas)
    );
}

export function carregarConfiguracaoTemporaria() {
    try {
        const dadosArmazenados = sessionStorage.getItem(CHAVE_CONFIGURACAO);
        if (!dadosArmazenados) return null;

        const dados = JSON.parse(dadosArmazenados);
        return validarEstruturaConfiguracao(dados) ? dados : null;
    } catch {
        return null;
    }
}

export function salvarConfiguracaoTemporaria(configuracao) {
    sessionStorage.setItem(
        CHAVE_CONFIGURACAO,
        JSON.stringify(configuracao),
    );
}
