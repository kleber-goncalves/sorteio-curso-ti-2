(() => {
    const conteiner = document.querySelector(".container");
    const resultado = document.getElementById("resultado");
    const inputMinimo = document.getElementById("minimo");
    const inputMaximo = document.getElementById("maximo");
    const inputModoToggle = document.getElementById("modoToggle");
    const ajudaModo = document.getElementById("ajudaModo");
    const botaoComecar = document.getElementById("comecar");
    const botaoParar = document.getElementById("parar");
    const botaoResetar = document.getElementById("resetar");
    const botaoAbrirCriador = document.getElementById("abrirCriador");
    const overlayCriador = document.getElementById("overlayCriador");
    const botaoFecharCriador = document.getElementById("fecharCriador");
    const dica = document.getElementById("dica");
    const cartaoResultado = document.querySelector(".cartao-resultado");

    const mediaMovimentoReduzido = window.matchMedia?.(
        "(prefers-reduced-motion: reduce)",
    );

    let idIntervalo = null;
    let idAnimacao = null;
    let estaRodando = false;
    let modoSorteio = "manual";

    function definirModoSorteio(novoModo) {
        modoSorteio = novoModo === "automatico" ? "automatico" : "manual";

        if (ajudaModo) {
            ajudaModo.textContent =
                modoSorteio === "automatico"
                    ? "O sistema gira e para sozinho com desaceleração suave."
                    : "Você controla quando parar. clique em Parar para mostrar o número sorteado.";
        }

        if (estaRodando) {
            limparGiro();
            definirRodando(false);
        } else {
            // O botao Parar fique "desligado" ao trocar para manual.
            botaoParar.disabled = true;
        }
    }

    // não esta sendo usado
    function definirDica(mensagem = "", tipo = "") {
        dica.textContent = mensagem;
        if (tipo) dica.dataset.tipo = tipo;
        else delete dica.dataset.tipo;
    }

    function parsearInteiro(valor) {
        const numero = Number(valor);
        if (!Number.isFinite(numero)) return null;
        return Math.trunc(numero);
    }

    function lerIntervalo() {
        const valorMinimo = parsearInteiro(inputMinimo.value);
        const valorMaximo = parsearInteiro(inputMaximo.value);

        if (valorMinimo === null || valorMaximo === null) {
            return {
                ok: false,
                mensagem: "Preencha MÍN e MÁX com números inteiros.",
            };
        }

        if (valorMinimo > valorMaximo) {
            return {
                ok: false,
                mensagem: "MÍN precisa ser menor ou igual a MÁX.",
            };
        }

        if (valorMinimo === valorMaximo) {
            return { ok: false, mensagem: "MÍN e MÁX não podem ser iguais." };
        }

        return { ok: true, minimo: valorMinimo, maximo: valorMaximo };
    }

    function inteiroAleatorioInclusivo(minimo, maximo) {
        const amplitude = maximo - minimo + 1;
        if (amplitude <= 0) throw new Error("Intervalo inválido");

        const cripto = window.crypto ?? window.msCrypto;
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

    function definirRodando(proximoRodando) {
        estaRodando = proximoRodando;
        conteiner.classList.toggle("esta-rodando", estaRodando);
        botaoComecar.disabled = estaRodando;
        botaoParar.disabled = !estaRodando || modoSorteio === "automatico";
    }

    // resetar o giro
    function limparGiro() {
        if (idIntervalo !== null) {
            window.clearInterval(idIntervalo);
            idIntervalo = null;
        }
        if (idAnimacao !== null) {
            window.cancelAnimationFrame(idAnimacao);
            idAnimacao = null;
        }
        resultado.classList.remove("esta-rolando");
    }

    // lipar o numero do cartao
    function destacarCartao() {
        cartaoResultado.classList.remove("esta-pop");
        void cartaoResultado.offsetHeight;
        cartaoResultado.classList.add("esta-pop");
    }

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function comecarManual() {
        const intervalo = lerIntervalo();
        if (!intervalo.ok) {
            definirDica(intervalo.mensagem, "erro");
            return;
        }

        definirDica("");

        if (mediaMovimentoReduzido?.matches) {
            const numeroFinal = inteiroAleatorioInclusivo(
                intervalo.minimo,
                intervalo.maximo,
            );
            resultado.textContent = String(numeroFinal);
            destacarCartao();
            definirDica(`Resultado: ${numeroFinal}`);
            return;
        }

        limparGiro();
        definirRodando(true);
        resultado.classList.add("esta-rolando");

        idIntervalo = window.setInterval(() => {
            const intervaloAtual = lerIntervalo();
            if (!intervaloAtual.ok) return;
            resultado.textContent = String(
                inteiroAleatorioInclusivo(
                    intervaloAtual.minimo,
                    intervaloAtual.maximo,
                ),
            );
        }, 55);
    }

    function comecarAutomatico() {
        const intervalo = lerIntervalo();
        if (!intervalo.ok) {
            definirDica(intervalo.mensagem, "erro");
            return;
        }

        definirDica("");

        if (mediaMovimentoReduzido?.matches) {
            const numeroFinal = inteiroAleatorioInclusivo(
                intervalo.minimo,
                intervalo.maximo,
            );
            resultado.textContent = String(numeroFinal);
            destacarCartao();
            definirDica(`Resultado: ${numeroFinal}`);
            return;
        }

        limparGiro();
        definirRodando(true);
        resultado.classList.add("esta-rolando");

        const duracaoMs = 2600;
        const intervaloRapidoMs = 38;
        const intervaloLentoMs = 180;

        const inicio = performance.now();
        let proximaAtualizacaoEm = inicio;

        const animar = (agora) => {
            if (!estaRodando) return;

            const progresso = Math.min((agora - inicio) / duracaoMs, 1);
            const ease = easeOutCubic(progresso);
            const intervaloMs =
                intervaloRapidoMs +
                (intervaloLentoMs - intervaloRapidoMs) * ease;

            if (agora >= proximaAtualizacaoEm) {
                const intervaloAtual = lerIntervalo();
                if (intervaloAtual.ok) {
                    resultado.textContent = String(
                        inteiroAleatorioInclusivo(
                            intervaloAtual.minimo,
                            intervaloAtual.maximo,
                        ),
                    );
                }
                proximaAtualizacaoEm = agora + intervaloMs;
            }

            if (progresso >= 1) {
                parar(true);
                return;
            }

            idAnimacao = window.requestAnimationFrame(animar);
        };

        idAnimacao = window.requestAnimationFrame(animar);
    }

    function comecar() {
        if (modoSorteio === "automatico") comecarAutomatico();
        else comecarManual();
    }

    function parar(automatico = false) {
        if (!estaRodando) return;

        const intervalo = lerIntervalo();
        if (!intervalo.ok) {
            limparGiro();
            definirRodando(false);
            definirDica(intervalo.mensagem, "erro");
            return;
        }

        limparGiro();
        let numeroFinal = inteiroAleatorioInclusivo(
            intervalo.minimo,
            intervalo.maximo,
        );
        if (automatico) {
            const candidato = Number.parseInt(resultado.textContent, 10);
            if (
                Number.isFinite(candidato) &&
                candidato >= intervalo.minimo &&
                candidato <= intervalo.maximo
            ) {
                numeroFinal = candidato;
            }
        }
        resultado.textContent = String(numeroFinal);
        definirRodando(false);
        destacarCartao();
        if (!automatico) definirDica(`Resultado: ${numeroFinal}`);
    }

    function resetar() {
        limparGiro();
        definirRodando(false);
        inputMinimo.value = "1";
        inputMaximo.value = "100";
        resultado.textContent = "?";
        definirDica("");
    }

    function abrirModalCriador() {
        if (!overlayCriador || !botaoAbrirCriador) return;
        overlayCriador.hidden = false;
        botaoAbrirCriador.setAttribute("aria-expanded", "true");
    }

    function fecharModalCriador() {
        if (!overlayCriador || !botaoAbrirCriador) return;
        overlayCriador.hidden = true;
        botaoAbrirCriador.setAttribute("aria-expanded", "false");
    }

    botaoComecar.addEventListener("click", comecar);
    botaoParar.addEventListener("click", parar);
    botaoResetar.addEventListener("click", resetar);

    if (botaoAbrirCriador) {
        botaoAbrirCriador.addEventListener("click", abrirModalCriador);
    }

    if (botaoFecharCriador) {
        botaoFecharCriador.addEventListener("click", fecharModalCriador);
    }

    if (overlayCriador) {
        overlayCriador.addEventListener("click", (evento) => {
            if (evento.target === overlayCriador) fecharModalCriador();
        });
    }

    if (inputModoToggle) {
        inputModoToggle.addEventListener("change", () => {
            definirModoSorteio(
                inputModoToggle.checked ? "automatico" : "manual",
            );
        });
    }

    // vai começar como (padrao: manual, toggle desligado)
    definirModoSorteio("manual");

    function validarEntradas() {
        if (estaRodando) return;
        const intervalo = lerIntervalo();
        if (!intervalo.ok) definirDica(intervalo.mensagem, "erro");
        else definirDica("");
    }

    inputMinimo.addEventListener("input", validarEntradas);
    inputMaximo.addEventListener("input", validarEntradas);

    window.addEventListener("keydown", (evento) => {
        if (evento.key === "Enter" && !evento.repeat) {
            if (estaRodando) parar();
            else comecar();
        }
        if (evento.key === "Escape") {
            if (!overlayCriador?.hidden) fecharModalCriador();
            else resetar();
        }
    });

    document.addEventListener("visibilitychange", () => {
        if (document.hidden && estaRodando) parar();
    });
})();
