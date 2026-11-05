(() => {
    const CHAVE_CONFIGURACAO = "configuracaoSorteio";

    const campoInicioFaixa = document.getElementById("inicioFaixa");
    const campoFimFaixa = document.getElementById("fimFaixa");
    const botaoAdicionarFaixa = document.getElementById("adicionarFaixa");
    const botaoAplicarConfiguracao = document.getElementById("aplicarConfiguracao");
    const camposConfiguracao = document.getElementById("camposConfiguracao");
    const listaFaixasExcluidas = document.getElementById("listaFaixasExcluidas");
    const listaVazia = document.getElementById("listaVazia");
    const dicaConfiguracao = document.getElementById("dicaConfiguracao");
    const intervaloConfigurado = document.getElementById("intervaloConfigurado");
    const quantidadeExcluida = document.getElementById("quantidadeExcluida");
    const quantidadeElegivel = document.getElementById("quantidadeElegivel");
    const totalFaixas = document.getElementById("totalFaixas");

    function carregarConfiguracaoTemporaria() {
        try {
            const dadosArmazenados = sessionStorage.getItem(CHAVE_CONFIGURACAO);
            if (!dadosArmazenados) return null;

            const dados = JSON.parse(dadosArmazenados);

            if (
                !Number.isSafeInteger(dados.minimo) ||
                !Number.isSafeInteger(dados.maximo) ||
                dados.minimo >= dados.maximo ||
                dados.maximo - dados.minimo + 1 > 2 ** 32 ||
                !Array.isArray(dados.faixasExcluidas)
            ) {
                return null;
            }

            return dados;
        } catch {
            return null;
        }
    }

    function analisarInteiro(valor) {
        const texto = valor.trim();

        if (texto === "" || !/^-?\d+$/.test(texto)) {
            return null;
        }

        const numero = Number(texto);
        return Number.isSafeInteger(numero) ? numero : null;
    }

    function normalizarFaixasExcluidas(faixas) {
        const faixasOrdenadas = faixas
            .map((faixa) => ({ de: faixa.de, ate: faixa.ate }))
            .sort((primeira, segunda) => primeira.de - segunda.de);

        const faixasNormalizadas = [];

        for (const faixa of faixasOrdenadas) {
            const ultimaFaixa = faixasNormalizadas[faixasNormalizadas.length - 1];

            if (
                ultimaFaixa &&
                (faixa.de <= ultimaFaixa.ate ||
                    (ultimaFaixa.ate < Number.MAX_SAFE_INTEGER &&
                        faixa.de === ultimaFaixa.ate + 1))
            ) {
                ultimaFaixa.ate = Math.max(ultimaFaixa.ate, faixa.ate);
            } else {
                faixasNormalizadas.push({ ...faixa });
            }
        }

        return faixasNormalizadas;
    }

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

    function salvarConfiguracaoTemporaria() {
        sessionStorage.setItem(
            CHAVE_CONFIGURACAO,
            JSON.stringify({
                minimo: configuracaoSorteio.minimo,
                maximo: configuracaoSorteio.maximo,
                faixasExcluidas,
            }),
        );
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
                ? "De " + faixa.de + " até " + faixa.ate
                : "Faixa inválida";

            const botaoRemover = document.createElement("button");
            botaoRemover.className = "botao-remover-faixa";
            botaoRemover.type = "button";
            botaoRemover.dataset.indice = String(indice);
            botaoRemover.setAttribute(
                "aria-label",
                faixaValida
                    ? "Remover faixa de " + faixa.de + " até " + faixa.ate
                    : "Remover faixa inválida",
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
        totalFaixas.textContent =
            faixasExcluidas.length +
            (faixasExcluidas.length === 1 ? " faixa" : " faixas");

        calcularResumo();
    }

    function adicionarFaixaExcluida() {
        const de = analisarInteiro(campoInicioFaixa.value);
        const ate = analisarInteiro(campoFimFaixa.value);

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

        salvarConfiguracaoTemporaria();
        campoInicioFaixa.value = "";
        campoFimFaixa.value = "";
        exibirDica("Faixa adicionada à configuração.", "sucesso");
        renderizarFaixasExcluidas();
    }

    function removerFaixaExcluida(indice) {
        faixasExcluidas = faixasExcluidas.filter(
            (_, posicao) => posicao !== indice,
        );

        salvarConfiguracaoTemporaria();
        exibirDica("Faixa removida.", "sucesso");
        renderizarFaixasExcluidas();
    }

    const configuracaoSorteio = carregarConfiguracaoTemporaria();
    let faixasExcluidas = configuracaoSorteio?.faixasExcluidas ?? [];

    if (!configuracaoSorteio) {
        camposConfiguracao.disabled = true;
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

    listaFaixasExcluidas.addEventListener("click", (evento) => {
        const botaoRemover = evento.target.closest("[data-indice]");
        if (!botaoRemover) return;

        removerFaixaExcluida(Number(botaoRemover.dataset.indice));
    });

    botaoAplicarConfiguracao.addEventListener("click", () => {
        if (!configuracaoSorteio || !calcularResumo()) return;

        try {
            faixasExcluidas = normalizarFaixasExcluidas(faixasExcluidas);
            salvarConfiguracaoTemporaria();
            window.location.href = "./index.html";
        } catch {
            exibirDica("Não foi possível salvar a configuração.", "erro");
        }
    });
})();
