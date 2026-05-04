(() => {
    const conteiner = document.querySelector(".container");
    const resultado = document.getElementById("resultado");
    const inputMinimo = document.getElementById("minimo");
    const inputMaximo = document.getElementById("maximo");
    const inputModoAutomatico = document.getElementById("automatico");
    const inputModoManual = document.getElementById("manual");
    const ajudaModo = document.getElementById("ajudaModo");
    const botaoComecar = document.getElementById("comecar");
    const botaoParar = document.getElementById("parar");
    const botaoResetar = document.getElementById("resetar");
    const dica = document.getElementById("dica");
    const cartaoResultado = document.querySelector(".cartao-resultado");
    const historico = document.querySelector("#historico");
    const rotuloResultado = document.querySelector(".resultado__rotulo");
    const seletorModo = document.querySelector(".modo__options");
    const modal = document.querySelector("#modal");
    const abriModal = document.querySelector("#abrirModal");
    const fecharModal = document.querySelector("#fecharModal");
   

    const mediaMovimentoReduzido = window.matchMedia?.(
        "(prefers-reduced-motion: reduce)",
    );

    let idIntervalo = null;
    let idAnimacao = null;
    let estaRodando = false;
    let modoSorteio = "manual";

    let listaHistorico = [];
    // Limita o tamanho do histórico ex: 10 numeros
    const LIMITE_HISTORICO = 10;

    function atualizarHistorico() {
        if (!historico) return;

        // Pega os 10 primeiros
        const ultimos = listaHistorico.slice(0, LIMITE_HISTORICO);

        historico.innerHTML = ultimos
            .map((n, index) => {
                // IMPORTAN AQUI: Se o index for 0 (o primeiro da esquerda), adicione a classe "ultimo-sorteado".
                const classeNumSorteado = index === 0 ? "ultimo-sorteado" : "";
                return `<span class="item-historico ${classeNumSorteado}">${n}</span>`;
            })
            .join("");
    }

    function definirModoSorteio(novoModo) {
        modoSorteio = novoModo === "automatico" ? "automatico" : "manual";

        if (estaRodando) {
            limparGiro();
            definirRodando(false);
        } else if (botaoParar) {
            // O botao Parar fique "desligado" ao trocar para manual.
            botaoParar.disabled = true;
        }

        if (inputModoAutomatico) {
            inputModoAutomatico.checked = modoSorteio === "automatico";
        }
        if (inputModoManual) {
            inputModoManual.checked = modoSorteio !== "automatico";
        }

        // Atualizar texto do botão baseado no modo
        if (botaoComecar) {
            if (modoSorteio === "manual") {
                botaoComecar.innerHTML = estaRodando
                    ? `<img src="./img/erro.png" alt="" width="29" height="29"> <span class="span-sortear">Erro do texto do button do modo manual</span>`
                    : `<i class="icon-sparkles"></i> <span class="span-sortear">Iniciar roleta</span>`;
            } else {
                botaoComecar.innerHTML = estaRodando
                    ? `<img src="./img/error.png" alt="" width="29" height="29"> <span class="span-sortear">Erro do texto do button do modo automatico</span>`
                    : `<i class="icon-sparkles"></i> <span class="span-sortear">Sortear numero</span>`;
            }
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

        if (botaoComecar) {
            botaoComecar.disabled = estaRodando && modoSorteio === "automatico";

            if (seletorModo) {
                seletorModo.style.opacity = estaRodando ? 0.5 : 1;
            }

            if (rotuloResultado) {
                rotuloResultado.textContent = estaRodando
                    ? "Sorteando..."
                    : "NÚMERO SORTEADO";
            }

            if (modoSorteio === "manual") {
                if (estaRodando) {
                    botaoComecar.innerHTML = `<i class="icon-square"></i> <span class="span-sortear">Parar</span>`;
                    botaoComecar.classList.remove("button-bg-base");
                    botaoComecar.classList.add("button-bg-manual__parar");
                } else {
                    botaoComecar.innerHTML = `<i class="icon-sparkles"></i> <span class="span-sortear">Iniciar roleta</span>`;
                    botaoComecar.classList.remove("button-bg-manual__parar");
                    botaoComecar.classList.add("button-bg-base");
                }
            } else {
                // MODO AUTOMÁTICO
                botaoComecar.classList.remove("button-bg-manual__parar");
                botaoComecar.classList.add("button-bg-base");

                botaoComecar.innerHTML = estaRodando
                    ? `<i class="icon-sparkles"></i> <span class="span-sortear">Sorteando...</span>`
                    : `<i class="icon-sparkles"></i> <span class="span-sortear">Sortear novamente</span>`;
            }
        }
        if (botaoParar)
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
            resultado.setAttribute("data-antigo", resultado.textContent);
            resultado.textContent = String(
                inteiroAleatorioInclusivo(
                    intervaloAtual.minimo,
                    intervaloAtual.maximo,
                ),
            );
        },60);
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

        const duracaoMs = 3600;
        const intervaloRapidoMs = 18;
        const intervaloLentoMs = 90;

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
                    resultado.setAttribute(
                        "data-antigo",
                                    resultado.textContent,
                    );

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

    function parar() {
        if (!estaRodando) return;

        const intervalo = lerIntervalo();
        if (!intervalo.ok) return;

        limparGiro();

        resultado.parentElement.classList.remove("esta-rolando");

        resultado.classList.remove("numero-final-animado");
        void resultado.offsetWidth; 
        const numeroFinal = inteiroAleatorioInclusivo(
            intervalo.minimo,
            intervalo.maximo,
        );

        resultado.textContent = numeroFinal;
        resultado.classList.add("numero-final-animado");

        // SALVAR NO HISTÓRICO
        listaHistorico.unshift(numeroFinal);
        atualizarHistorico();

       

        definirRodando(false);
        destacarCartao();
    }

    function resetar() {
        limparGiro();
        definirRodando(false);

        inputMinimo.value = "1";
        inputMaximo.value = "100";
        resultado.textContent = "?";

        // 🧠 LIMPAR HISTÓRICO
        listaHistorico = [];
        atualizarHistorico();
    }

    if (botaoComecar) {
        botaoComecar.addEventListener("click", () => {
            if (modoSorteio === "manual" && estaRodando) {
                parar();
            } else {
                comecar();
            }
        });
    }
    if (botaoParar) {
        botaoParar.addEventListener("click", parar);
    }
    if (botaoResetar) {
        botaoResetar.addEventListener("click", resetar);
    }

    // abriModal
    if (abriModal) {
        abriModal.addEventListener("click", () => {
            modal.showModal();
        });
    }
    // fecharModal
    if (fecharModal) {
        fecharModal.addEventListener("click", () => {
            modal.close();
        });
    }


    if (inputModoAutomatico) {
        inputModoAutomatico.addEventListener("change", () => {
            if (inputModoAutomatico.checked) definirModoSorteio("automatico");
        });
    }

    if (inputModoManual) {
        inputModoManual.addEventListener("change", () => {
            if (inputModoManual.checked) definirModoSorteio("manual");
        });
    }

    // vai começar como (padrao: manual)
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
