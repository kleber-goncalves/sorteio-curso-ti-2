import {
    carregarConfiguracaoTemporaria,
    salvarConfiguracaoTemporaria,
} from "./armazenamento-configuracao.js";
import {
    analisarInteiroSeguro,
    analisarListaNumerosIsolados,
    normalizarFaixasExcluidas,
} from "./regras-sorteio.js";

(() => {
    const campoInicioFaixa = document.getElementById("inicioFaixa");
    const campoFimFaixa = document.getElementById("fimFaixa");
    const botaoAdicionarFaixa = document.getElementById("adicionarFaixa");
    const campoNumeroIsolado = document.getElementById("numeroIsolado");
    const botaoAdicionarNumero = document.getElementById("adicionarNumero");
    const camposNumeroIsolado = document.getElementById("camposNumeroIsolado");
    const campoListaNumerosIsolados = document.getElementById("listaNumerosIsolados");
    const botaoAdicionarNumerosEmLote = document.getElementById("adicionarNumerosEmLote");
    const camposNumerosEmLote = document.getElementById("camposNumerosEmLote");
    const botaoAplicarConfiguracao = document.getElementById("aplicarConfiguracao");
    const camposConfiguracao = document.getElementById("camposConfiguracao");
    const listaFaixasExcluidas = document.getElementById("listaFaixasExcluidas");
    const listaVazia = document.getElementById("listaVazia");
    const dicaConfiguracao = document.getElementById("dicaConfiguracao");
    const intervaloConfigurado = document.getElementById("intervaloConfigurado");
    const quantidadeExcluida = document.getElementById("quantidadeExcluida");
    const quantidadeElegivel = document.getElementById("quantidadeElegivel");
    const totalExclusoes = document.getElementById("totalExclusoes");

    function exibirDica(mensagem, tipo = "") {
        dicaConfiguracao.textContent = mensagem;
        dicaConfiguracao.dataset.tipo = tipo;
    }

    function verificarFaixasNoIntervalo(faixas) {
        return faixas.every(
            (faixa) =>
                faixa !== null &&
                typeof faixa === "object" &&
                Number.isSafeInteger(faixa.de) &&
                Number.isSafeInteger(faixa.ate) &&
                faixa.de <= faixa.ate &&
                faixa.de >= configuracaoSorteio.minimo &&
                faixa.ate <= configuracaoSorteio.maximo,
        );
    }

    function calcularResumo() {
        const totalDoIntervalo =
            configuracaoSorteio.maximo - configuracaoSorteio.minimo + 1;

        intervaloConfigurado.textContent =
            configuracaoSorteio.minimo + " até " + configuracaoSorteio.maximo;

        if (!verificarFaixasNoIntervalo(faixasExcluidas)) {
            quantidadeExcluida.textContent = "--";
            quantidadeElegivel.textContent = "--";
            botaoAplicarConfiguracao.disabled = true;
            exibirDica(
                "Há uma faixa fora do intervalo atual. Remova ou ajuste essa faixa antes de aplicar.",
                "erro",
            );
            return false;
        }

        const faixasNormalizadas = normalizarFaixasExcluidas(faixasExcluidas);
        const totalDeNumerosExcluidos = faixasNormalizadas.reduce(
            (total, faixa) => total + (faixa.ate - faixa.de + 1),
            0,
        );
        const totalDeNumerosElegiveis =
            totalDoIntervalo - totalDeNumerosExcluidos;

        quantidadeExcluida.textContent = String(totalDeNumerosExcluidos);
        quantidadeElegivel.textContent = String(totalDeNumerosElegiveis);

        if (totalDeNumerosElegiveis <= 0) {
            botaoAplicarConfiguracao.disabled = true;
            exibirDica(
                "Todas as opções foram excluídas. Mantenha pelo menos um número elegível.",
                "erro",
            );
            return false;
        }

        botaoAplicarConfiguracao.disabled = false;
        return true;
    }

    function salvarConfiguracaoAtual() {
        salvarConfiguracaoTemporaria({
            minimo: configuracaoSorteio.minimo,
            maximo: configuracaoSorteio.maximo,
            faixasExcluidas,
        });
    }

    function renderizarFaixasExcluidas() {
        listaFaixasExcluidas.replaceChildren();

        faixasExcluidas.forEach((faixa, indice) => {
            const faixaValida =
                faixa !== null &&
                typeof faixa === "object" &&
                Number.isSafeInteger(faixa.de) &&
                Number.isSafeInteger(faixa.ate) &&
                faixa.de <= faixa.ate &&
                faixa.de >= configuracaoSorteio.minimo &&
                faixa.ate <= configuracaoSorteio.maximo;

            const itemFaixa = document.createElement("li");
            itemFaixa.className = "faixa-excluida";
            if (!faixaValida) {
                itemFaixa.classList.add("faixa-excluida--invalida");
            }

            const textoFaixa = document.createElement("span");
            textoFaixa.textContent = faixaValida
                ? faixa.de === faixa.ate
                    ? "Número " + faixa.de
                    : "De " + faixa.de + " até " + faixa.ate
                : "Exclusão inválida";

            const botaoRemover = document.createElement("button");
            botaoRemover.className = "botao-remover-faixa";
            botaoRemover.type = "button";
            botaoRemover.dataset.indice = String(indice);
            botaoRemover.setAttribute(
                "aria-label",
                faixaValida
                    ? faixa.de === faixa.ate
                        ? "Remover número " + faixa.de
                        : "Remover faixa de " + faixa.de + " até " + faixa.ate
                    : "Remover exclusão inválida",
            );

            const iconeRemover = document.createElement("i");
            iconeRemover.className = "icon-trash-2";
            iconeRemover.setAttribute("aria-hidden", "true");

            const textoRemover = document.createTextNode(" Remover");
            botaoRemover.append(iconeRemover, textoRemover);
            itemFaixa.append(textoFaixa, botaoRemover);
            listaFaixasExcluidas.appendChild(itemFaixa);
        });

        listaVazia.hidden = faixasExcluidas.length > 0;
        totalExclusoes.textContent =
            faixasExcluidas.length +
            (faixasExcluidas.length === 1 ? " item" : " itens");

        calcularResumo();
    }

    function adicionarFaixaExcluida() {
        const de = analisarInteiroSeguro(campoInicioFaixa.value);
        const ate = analisarInteiroSeguro(campoFimFaixa.value);

        if (de === null || ate === null) {
            exibirDica("Informe números inteiros válidos nos dois campos.", "erro");
            return;
        }

        if (de > ate) {
            exibirDica("O campo De não pode ser maior que o campo Até.", "erro");
            return;
        }

        if (
            de < configuracaoSorteio.minimo ||
            ate > configuracaoSorteio.maximo
        ) {
            exibirDica(
                "A faixa precisa estar dentro do intervalo definido na página principal.",
                "erro",
            );
            return;
        }

        if (!verificarFaixasNoIntervalo(faixasExcluidas)) {
            exibirDica(
                "Remova ou ajuste primeiro as faixas que estão fora do intervalo atual.",
                "erro",
            );
            return;
        }

        faixasExcluidas = normalizarFaixasExcluidas([
            ...faixasExcluidas,
            { de, ate },
        ]);

        salvarConfiguracaoAtual();
        campoInicioFaixa.value = "";
        campoFimFaixa.value = "";
        exibirDica("Faixa adicionada à configuração.", "sucesso");
        renderizarFaixasExcluidas();
    }

    function adicionarNumeroIsolado() {
        const numero = analisarInteiroSeguro(campoNumeroIsolado.value);

        if (numero === null) {
            exibirDica("Informe um número inteiro válido.", "erro");
            return;
        }

        if (
            numero < configuracaoSorteio.minimo ||
            numero > configuracaoSorteio.maximo
        ) {
            exibirDica(
                "O número precisa estar dentro do intervalo definido na página principal.",
                "erro",
            );
            return;
        }

        if (!verificarFaixasNoIntervalo(faixasExcluidas)) {
            exibirDica(
                "Revise as exclusões existentes antes de adicionar outro número.",
                "erro",
            );
            return;
        }

        const numeroJaExcluido = faixasExcluidas.some(
            (faixa) => numero >= faixa.de && numero <= faixa.ate,
        );

        if (numeroJaExcluido) {
            exibirDica(
                "Esse número já está excluído, individualmente ou dentro de uma faixa.",
                "erro",
            );
            return;
        }

        faixasExcluidas = normalizarFaixasExcluidas(
            [...faixasExcluidas, { de: numero, ate: numero }],
            configuracaoSorteio,
        );

        salvarConfiguracaoAtual();
        campoNumeroIsolado.value = "";
        exibirDica("Número " + numero + " adicionado às exclusões.", "sucesso");
        renderizarFaixasExcluidas();
    }

    function adicionarNumerosEmLote() {
        let numeros;

        try {
            numeros = analisarListaNumerosIsolados(campoListaNumerosIsolados.value);
        } catch (erro) {
            exibirDica(erro.message, "erro");
            return;
        }

        if (!verificarFaixasNoIntervalo(faixasExcluidas)) {
            exibirDica(
                "Revise as exclusões existentes antes de adicionar outros números.",
                "erro",
            );
            return;
        }

        const numerosJaExcluidos = numeros.filter((numero) =>
            faixasExcluidas.some(
                (faixa) => numero >= faixa.de && numero <= faixa.ate,
            ),
        );

        if (numerosJaExcluidos.length > 0) {
            exibirDica(
                "Estes números já estão excluídos: " + numerosJaExcluidos.join(", ") + ". Nenhum número da lista foi adicionado.",
                "erro",
            );
            return;
        }

        const numerosForaDoIntervalo = numeros.filter(
            (numero) =>
                numero < configuracaoSorteio.minimo ||
                numero > configuracaoSorteio.maximo,
        );

        if (numerosForaDoIntervalo.length > 0) {
            exibirDica(
                "Estes números estão fora do intervalo do sorteio: " +
                    numerosForaDoIntervalo.join(", ") +
                    ". Nenhum número da lista foi adicionado.",
                "erro",
            );
            return;
        }

        const novasFaixas = numeros.map((numero) => ({
            de: numero,
            ate: numero,
        }));
        const faixasAtualizadas = normalizarFaixasExcluidas(
            [...faixasExcluidas, ...novasFaixas],
            configuracaoSorteio,
        );
        const totalExcluido = faixasAtualizadas.reduce(
            (total, faixa) => total + faixa.ate - faixa.de + 1,
            0,
        );
        const totalIntervalo =
            configuracaoSorteio.maximo - configuracaoSorteio.minimo + 1;

        if (totalIntervalo - totalExcluido < 1) {
            exibirDica(
                "A lista excluiria todas as opções. Mantenha pelo menos um número elegível. Nenhum número foi adicionado.",
                "erro",
            );
            return;
        }

        faixasExcluidas = faixasAtualizadas;
        salvarConfiguracaoAtual();
        campoListaNumerosIsolados.value = "";
        exibirDica(
            numeros.length +
                (numeros.length === 1
                    ? " número adicionado às exclusões."
                    : " números adicionados às exclusões."),
            "sucesso",
        );
        renderizarFaixasExcluidas();
    }

    function removerFaixaExcluida(indice) {
        faixasExcluidas = faixasExcluidas.filter(
            (_, posicao) => posicao !== indice,
        );

        salvarConfiguracaoAtual();
        exibirDica("Faixa removida.", "sucesso");
        renderizarFaixasExcluidas();
    }

    const configuracaoSorteio = carregarConfiguracaoTemporaria();
    let faixasExcluidas = configuracaoSorteio?.faixasExcluidas ?? [];

    if (!configuracaoSorteio) {
        camposConfiguracao.disabled = true;
        camposNumeroIsolado.disabled = true;
        camposNumerosEmLote.disabled = true;
        botaoAplicarConfiguracao.disabled = true;
        intervaloConfigurado.textContent = "Não definido";
        exibirDica(
            "Primeiro defina o intervalo mínimo e máximo na página principal.",
            "erro",
        );
    } else {
        renderizarFaixasExcluidas();
    }

    botaoAdicionarFaixa.addEventListener("click", adicionarFaixaExcluida);
    botaoAdicionarNumero.addEventListener("click", adicionarNumeroIsolado);
    botaoAdicionarNumerosEmLote.addEventListener("click", adicionarNumerosEmLote);

    campoListaNumerosIsolados.addEventListener("keydown", (evento) => {
        if (evento.key !== "Enter" || !evento.ctrlKey) return;

        evento.preventDefault();
        adicionarNumerosEmLote();
    });

    campoNumeroIsolado.addEventListener("keydown", (evento) => {
        if (evento.key !== "Enter") return;

        evento.preventDefault();
        adicionarNumeroIsolado();
    });

    listaFaixasExcluidas.addEventListener("click", (evento) => {
        const botaoRemover = evento.target.closest("[data-indice]");
        if (!botaoRemover) return;

        removerFaixaExcluida(Number(botaoRemover.dataset.indice));
    });

    botaoAplicarConfiguracao.addEventListener("click", () => {
        if (!configuracaoSorteio || !calcularResumo()) return;

        try {
            faixasExcluidas = normalizarFaixasExcluidas(faixasExcluidas);
            salvarConfiguracaoAtual();
            window.location.href = "./index.html";
        } catch {
            exibirDica("Não foi possível salvar a configuração.", "erro");
        }
    });
})();
