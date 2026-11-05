import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import {
    carregarConfiguracaoTemporaria,
    salvarConfiguracaoTemporaria,
} from "../armazenamento-configuracao.js";

const dadosArmazenados = new Map();

Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
        getItem(chave) {
            return dadosArmazenados.has(chave)
                ? dadosArmazenados.get(chave)
                : null;
        },
        setItem(chave, valor) {
            dadosArmazenados.set(chave, String(valor));
        },
        removeItem(chave) {
            dadosArmazenados.delete(chave);
        },
    },
});

beforeEach(() => {
    dadosArmazenados.clear();
});

test("carregarConfiguracaoTemporaria retorna null quando não há dados", () => {
    assert.equal(carregarConfiguracaoTemporaria(), null);
});

test("salvarConfiguracaoTemporaria grava dados que podem ser recuperados", () => {
    const configuracao = {
        minimo: 1,
        maximo: 100,
        faixasExcluidas: [{ de: 10, ate: 20 }],
    };

    salvarConfiguracaoTemporaria(configuracao);
    assert.deepEqual(carregarConfiguracaoTemporaria(), configuracao);
});

test("carregarConfiguracaoTemporaria ignora JSON malformado", () => {
    dadosArmazenados.set("configuracaoSorteio", "{json inválido");
    assert.equal(carregarConfiguracaoTemporaria(), null);
});

test("carregarConfiguracaoTemporaria rejeita estrutura inválida", () => {
    dadosArmazenados.set(
        "configuracaoSorteio",
        JSON.stringify({
            minimo: 10,
            maximo: 10,
            faixasExcluidas: [],
        }),
    );

    assert.equal(carregarConfiguracaoTemporaria(), null);
});

test("carregarConfiguracaoTemporaria rejeita faixas que não sejam um array", () => {
    dadosArmazenados.set(
        "configuracaoSorteio",
        JSON.stringify({
            minimo: 1,
            maximo: 10,
            faixasExcluidas: {},
        }),
    );

    assert.equal(carregarConfiguracaoTemporaria(), null);
});

test("carregarConfiguracaoTemporaria trata falhas de acesso ao armazenamento", () => {
    const armazenamentoOriginal = globalThis.sessionStorage;

    Object.defineProperty(globalThis, "sessionStorage", {
        configurable: true,
        value: {
            getItem() {
                throw new Error("Acesso negado");
            },
        },
    });

    assert.equal(carregarConfiguracaoTemporaria(), null);

    Object.defineProperty(globalThis, "sessionStorage", {
        configurable: true,
        value: armazenamentoOriginal,
    });
});
