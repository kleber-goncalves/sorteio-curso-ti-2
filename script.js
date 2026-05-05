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
    const dica = document.getElementById("dica");
    const cartaoResultado = document.querySelector(".cartao-resultado");
    const historico = document.querySelector("#historico");
    const rotuloResultado = document.querySelector(".resultado__rotulo");
    const seletorModo = document.querySelector(".modo__options");
    const modal = document.querySelector("#modal");
    const abriModal = document.querySelector("#abrirModal");
    const fecharModal = document.querySelector("#fecharModal");
    const limparHistorico = document.querySelector("#limparHistorico");

    const erroMinimo = document.getElementById("erroMinimo");
    const erroMaximo = document.getElementById("erroMaximo");

    const btnValidar = document.getElementById("btnValidar");

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
    function definirDica(mensagem, tipo = "") {
        dica.textContent = mensagem;
        dica.style.color = tipo === "erro" ? "red" : "green";
        if (tipo) dica.dataset.tipo = tipo;
        else delete dica.dataset.tipo;
    }

    function analisarEntrada(valor) {
        const texto = valor.trim();

        if (texto === "") {
            return { tipo: "vazio" };
        }

        const apenasInteiros = /^-?\d+$/;

        if (!apenasInteiros.test(texto)) {
            return { tipo: "invalido" };
        }

        return { tipo: "valido", numero: Number(texto) };
    }

    function parsearInteiro(valor) {
        const texto = valor.trim();
        if (valor.trim() === "") return null;
        if (texto === "") return null;

        const apenasInteiros = /^-?\d+$/;
        if (!apenasInteiros.test(texto)) return null;

        const numero = Number(texto);
        return Number.isFinite(numero) ? Math.trunc(numero) : null;
    }

    function lerIntervalo() {
        const min = analisarEntrada(inputMinimo.value);
        const max = analisarEntrada(inputMaximo.value);
        // Reset visual
        inputMinimo.style.border = "";
        inputMaximo.style.border = "";

        // Ambos vazios
        if (min.tipo === "vazio" && max.tipo === "vazio") {
            inputMinimo.style.border = "2px solid red";
            inputMaximo.style.border = "2px solid red";
            botaoComecar.style.cursor = "not-allowed";
            botaoComecar.classList.remove("button-bg-base");
            botaoComecar.classList.add("button-bg-erro");
            return {
                ok: false,
                mensagem: "MÍN e MÁX não possdem ser vazios.",
            };
        }

        // Mínimo vazio
        if (min.tipo === "vazio") {
            return {
                ok: false,
                mensagem: "MÍN não pode ser vazio.",
            };
        }

        // Mínimo inválido
        if (min.tipo === "invalido") {
            return {
                ok: false,
                mensagem: "MÍN deve ser um número inteiro válido.",
            };
        }

        // Máximo vazio
        if (max.tipo === "vazio") {
            botaoComecar.classList.remove("button-bg-base");
            botaoComecar.classList.add("button-bg-erro");
            botaoComecar.style.cursor = "not-allowed";
            inputMaximo.style.border = "2px solid red";
            return {
                ok: false,
                mensagem: "MÁX não pode ser vazio.",
            };
        }

        // Máximo inválido
        if (max.tipo === "invalido") {
            return {
                ok: false,
                mensagem: "MÁX deve ser um número inteiro válido.",
            };
        }

        const minimo = min.numero;
        const maximo = max.numero;

        // Iguais
        if (minimo === maximo) {
            inputMinimo.style.border = "2px solid red";
            inputMaximo.style.border = "2px solid red";
            botaoComecar.style.cursor = "not-allowed";
            botaoComecar.classList.remove("button-bg-base");
            botaoComecar.classList.add("button-bg-erro");
            return {
                ok: false,
                mensagem: "MÍN e MÁX não podem ser iguais.",
            };
        }

        // Intervalo inválido
        if (minimo > maximo) {
            return {
                ok: false,
                mensagem: "MÍN deve ser menor que MÁX.",
            };
        }

        // Tudo certo
        return {
            ok: true,
            minimo,
            maximo,
        };
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

    function setInputsBloqueados(bloquear) {
        inputMinimo.disabled = bloquear;
        inputMaximo.disabled = bloquear;
    }

    function definirRodando(proximoRodando) {
        estaRodando = proximoRodando;
        setInputsBloqueados(true);
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
                if (estaRodando) {
                    botaoComecar.classList.remove("button-bg-base");
                    botaoComecar.classList.add("button-bg-rodando-auto");
                    botaoComecar.style.cursor = "not-allowed";
                } else {
                    botaoComecar.classList.remove("button-bg-rodando-auto");
                    botaoComecar.classList.add("button-bg-base");
                }
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
        }, 60);
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
        
        definirRodando(false);

        setInputsBloqueados(false);

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


    }

    function resetar() {
        // LIMPAR HISTÓRICO
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
    if (limparHistorico) {
        limparHistorico.addEventListener("click", resetar);
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

    // valida em tempo real
    function validarEntradas() {
        if (estaRodando) return;

        const min = analisarEntrada(inputMinimo.value);
        const max = analisarEntrada(inputMaximo.value);

        // Reset visual
        inputMinimo.style.border = "";
        inputMaximo.style.border = "";

        // Ambos vazios
        if (min.tipo === "vazio" && max.tipo === "vazio") {
            definirDica("", "erro");
            return;
        }

        // Mínimo vazio
        if (min.tipo === "vazio") {
            definirDica("", "erro");
            return;
        }

        // Mínimo inválido
        if (min.tipo === "invalido") {
            inputMinimo.style.border = "2px solid red";
            botaoComecar.classList.remove("button-bg-base");
            botaoComecar.classList.add("button-bg-erro");
            botaoComecar.style.cursor = "not-allowed";
            definirDica("MÍN deve ser um número inteiro válido.", "erro");
            return;
        }

        //  Máximo vazio
        if (max.tipo === "vazio") {
            definirDica("", "ok");
            return;
        }

        //  Máximo inválido
        if (max.tipo === "invalido") {
            inputMaximo.style.border = "2px solid red";
            botaoComecar.classList.remove("button-bg-base");
            botaoComecar.classList.add("button-bg-erro");
            botaoComecar.style.cursor = "not-allowed";
            definirDica("MÁX deve ser um número inteiro válido.", "erro");
            return;
        }

        const minimo = min.numero;
        const maximo = max.numero;

        // Iguais
        if (minimo === maximo) {
            botaoComecar.classList.remove("button-bg-base");
            botaoComecar.classList.add("button-bg-erro");
            botaoComecar.style.cursor = "not-allowed";
            definirDica("", "erro");
            return;
        }

        // Intervalo inválido
        if (minimo > maximo) {
            inputMinimo.style.border = "2px solid red";
            botaoComecar.style.cursor = "not-allowed";
            botaoComecar.classList.remove("button-bg-base");
            botaoComecar.classList.add("button-bg-erro");
            definirDica("MÍN deve ser menor que MÁX.", "erro");
            return;
        }

        // Sucesso
        inputMinimo.style.border = "2px solid #d0ff4dac";
        inputMaximo.style.border = "2px solid #d0ff4dac";
        botaoComecar.classList.remove("button-bg-erro");
        botaoComecar.classList.add("button-bg-base");
        botaoComecar.style.cursor = "pointer";
        definirDica("", "ok");
    }

    inputMinimo.addEventListener("input", validarEntradas);
    inputMaximo.addEventListener("input", validarEntradas);

    inputMinimo.addEventListener("input", () => {
        inputMinimo.value = inputMinimo.value.replace(/[^\d-]/g, "");
    });

    inputMaximo.addEventListener("input", () => {
        inputMaximo.value = inputMaximo.value.replace(/[^\d-]/g, "");
    });

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
