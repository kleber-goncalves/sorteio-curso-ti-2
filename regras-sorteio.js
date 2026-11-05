/**
 * Regras centrais do sorteio.
 *
 * Este módulo não acessa o DOM nem mantém estado da página.
 * Recebe os dados por parâmetros e devolve resultados.
 */

export function analisarInteiroSeguro(valor) {
    const texto = String(valor).trim();

    if (texto === "" || !/^-?\d+$/.test(texto)) {
        return null;
    }

    const numero = Number(texto);
    return Number.isSafeInteger(numero) ? numero : null;
}

export function normalizarFaixasExcluidas(faixas, intervalo = null) {
    if (!Array.isArray(faixas)) {
        throw new Error("A configuração das faixas excluídas está inválida.");
    }

    const faixasOrdenadas = faixas
        .map((faixa) => {
            if (
                !Number.isSafeInteger(faixa?.de) ||
                !Number.isSafeInteger(faixa?.ate) ||
                faixa.de > faixa.ate
            ) {
                throw new Error("Existe uma faixa de exclusão inválida.");
            }

            if (
                intervalo &&
                (faixa.de < intervalo.minimo || faixa.ate > intervalo.maximo)
            ) {
                throw new Error(
                    "Uma faixa excluída está fora do intervalo atual. Revise a configuração.",
                );
            }

            return { de: faixa.de, ate: faixa.ate };
        })
        .sort((primeira, segunda) => primeira.de - segunda.de);

    const faixasNormalizadas = [];

    for (const faixa of faixasOrdenadas) {
        const ultimaFaixa = faixasNormalizadas[faixasNormalizadas.length - 1];
        const faixasConsecutivas =
            ultimaFaixa &&
            ultimaFaixa.ate < Number.MAX_SAFE_INTEGER &&
            faixa.de === ultimaFaixa.ate + 1;

        if (
            ultimaFaixa &&
            (faixa.de <= ultimaFaixa.ate || faixasConsecutivas)
        ) {
            ultimaFaixa.ate = Math.max(ultimaFaixa.ate, faixa.ate);
        } else {
            faixasNormalizadas.push({ ...faixa });
        }
    }

    return faixasNormalizadas;
}

export function calcularIntervalosElegiveis(faixasExcluidas, intervalo) {
    if (
        !intervalo ||
        !Number.isSafeInteger(intervalo.minimo) ||
        !Number.isSafeInteger(intervalo.maximo) ||
        intervalo.minimo > intervalo.maximo
    ) {
        throw new Error("O intervalo informado é inválido.");
    }

    const faixas = normalizarFaixasExcluidas(faixasExcluidas, intervalo);
    const intervalosElegiveis = [];
    let proximoNumero = intervalo.minimo;
    let terminouIntervalo = false;

    for (const faixa of faixas) {
        if (faixa.de > proximoNumero) {
            intervalosElegiveis.push({
                de: proximoNumero,
                ate: faixa.de - 1,
            });
        }

        if (faixa.ate >= intervalo.maximo) {
            terminouIntervalo = true;
            break;
        }

        proximoNumero = faixa.ate + 1;
    }

    if (!terminouIntervalo && proximoNumero <= intervalo.maximo) {
        intervalosElegiveis.push({
            de: proximoNumero,
            ate: intervalo.maximo,
        });
    }

    return intervalosElegiveis;
}

export function validarFaixasExcluidas(faixasExcluidas, intervalo) {
    try {
        const intervalosElegiveis = calcularIntervalosElegiveis(
            faixasExcluidas,
            intervalo,
        );
        const totalElegivel = intervalosElegiveis.reduce(
            (total, faixa) => total + (faixa.ate - faixa.de + 1),
            0,
        );

        if (totalElegivel === 0) {
            return {
                ok: false,
                mensagem:
                    "Todas as opções foram excluídas. Mantenha pelo menos um número elegível.",
            };
        }

        return { ok: true };
    } catch (erro) {
        return {
            ok: false,
            mensagem:
                erro.message ||
                "Não foi possível validar as faixas excluídas.",
        };
    }
}

export function inteiroAleatorioInclusivo(minimo, maximo) {
    const amplitude = maximo - minimo + 1;

    if (
        !Number.isSafeInteger(amplitude) ||
        amplitude <= 0 ||
        amplitude > 2 ** 32
    ) {
        throw new Error("Intervalo inválido ou maior que o limite suportado.");
    }

    const cripto = globalThis.crypto ?? globalThis.msCrypto;

    if (!cripto?.getRandomValues) {
        return minimo + Math.floor(Math.random() * amplitude);
    }

    const maxUint32MaisUm = 2 ** 32;
    const limite = Math.floor(maxUint32MaisUm / amplitude) * amplitude;
    const bufferUint32 = new Uint32Array(1);
    let valor = 0;

    do {
        cripto.getRandomValues(bufferUint32);
        valor = bufferUint32[0];
    } while (valor >= limite);

    return minimo + (valor % amplitude);
}

export function sortearNumeroElegivel(faixasExcluidas, intervalo) {
    const intervalosElegiveis = calcularIntervalosElegiveis(
        faixasExcluidas,
        intervalo,
    );
    const totalElegivel = intervalosElegiveis.reduce(
        (total, faixa) => total + (faixa.ate - faixa.de + 1),
        0,
    );

    if (totalElegivel <= 0) {
        throw new Error("Não existem números elegíveis para este sorteio.");
    }

    let indiceSorteado = inteiroAleatorioInclusivo(0, totalElegivel - 1);

    for (const faixa of intervalosElegiveis) {
        const quantidadeNaFaixa = faixa.ate - faixa.de + 1;

        if (indiceSorteado < quantidadeNaFaixa) {
            return faixa.de + indiceSorteado;
        }

        indiceSorteado -= quantidadeNaFaixa;
    }

    throw new Error("Não foi possível selecionar um número elegível.");
}
