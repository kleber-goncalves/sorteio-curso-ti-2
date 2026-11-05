import assert from "node:assert/strict";
import test from "node:test";

import {
    analisarInteiroSeguro,
    calcularIntervalosElegiveis,
    inteiroAleatorioInclusivo,
    normalizarFaixasExcluidas,
    sortearNumeroElegivel,
    validarFaixasExcluidas,
} from "../js/regras-sorteio.js";

test("analisarInteiroSeguro aceita inteiros seguros", () => {
    assert.equal(analisarInteiroSeguro("42"), 42);
    assert.equal(analisarInteiroSeguro(" -17 "), -17);
    assert.equal(analisarInteiroSeguro("0"), 0);
});

test("analisarInteiroSeguro rejeita valores vazios, decimais e fora do limite seguro", () => {
    assert.equal(analisarInteiroSeguro(""), null);
    assert.equal(analisarInteiroSeguro("   "), null);
    assert.equal(analisarInteiroSeguro("2.5"), null);
    assert.equal(analisarInteiroSeguro("abc"), null);
    assert.equal(analisarInteiroSeguro("9007199254740992"), null);
});

test("normalizarFaixasExcluidas ordena e une faixas sobrepostas ou consecutivas", () => {
    const faixas = [
        { de: 8, ate: 10 },
        { de: 20, ate: 21 },
        { de: 1, ate: 2 },
        { de: 3, ate: 4 },
        { de: 10, ate: 12 },
    ];

    assert.deepEqual(normalizarFaixasExcluidas(faixas), [
        { de: 1, ate: 4 },
        { de: 8, ate: 12 },
        { de: 20, ate: 21 },
    ]);
});

test("normalizarFaixasExcluidas rejeita faixas inválidas", () => {
    assert.throws(
        () => normalizarFaixasExcluidas([{ de: 5, ate: 2 }]),
        /faixa de exclusão inválida/i,
    );
    assert.throws(
        () => normalizarFaixasExcluidas([{ de: 1.5, ate: 3 }]),
        /faixa de exclusão inválida/i,
    );
});

test("normalizarFaixasExcluidas rejeita faixas fora do intervalo informado", () => {
    assert.throws(
        () =>
            normalizarFaixasExcluidas(
                [{ de: 0, ate: 2 }],
                { minimo: 1, maximo: 10 },
            ),
        /fora do intervalo/i,
    );
});

test("calcularIntervalosElegiveis retorna todo o intervalo quando não há exclusões", () => {
    assert.deepEqual(
        calcularIntervalosElegiveis([], { minimo: 1, maximo: 5 }),
        [{ de: 1, ate: 5 }],
    );
});

test("calcularIntervalosElegiveis divide corretamente o intervalo pelas exclusões", () => {
    assert.deepEqual(
        calcularIntervalosElegiveis(
            [
                { de: 7, ate: 8 },
                { de: 3, ate: 4 },
            ],
            { minimo: 1, maximo: 10 },
        ),
        [
            { de: 1, ate: 2 },
            { de: 5, ate: 6 },
            { de: 9, ate: 10 },
        ],
    );
});

test("calcularIntervalosElegiveis retorna lista vazia quando tudo foi excluído", () => {
    assert.deepEqual(
        calcularIntervalosElegiveis(
            [{ de: 1, ate: 5 }],
            { minimo: 1, maximo: 5 },
        ),
        [],
    );
});

test("validarFaixasExcluidas identifica intervalo sem números elegíveis", () => {
    const resultado = validarFaixasExcluidas(
        [{ de: 1, ate: 5 }],
        { minimo: 1, maximo: 5 },
    );

    assert.equal(resultado.ok, false);
    assert.match(resultado.mensagem, /pelo menos um número elegível/i);
});

test("validarFaixasExcluidas aceita quando existe ao menos um número elegível", () => {
    assert.deepEqual(
        validarFaixasExcluidas(
            [{ de: 2, ate: 4 }],
            { minimo: 1, maximo: 5 },
        ),
        { ok: true },
    );
});

test("sortearNumeroElegivel nunca retorna número excluído", () => {
    const intervalo = { minimo: 1, maximo: 10 };
    const faixasExcluidas = [{ de: 2, ate: 9 }];

    for (let tentativa = 0; tentativa < 100; tentativa += 1) {
        const numero = sortearNumeroElegivel(faixasExcluidas, intervalo);
        assert.ok(numero === 1 || numero === 10);
    }
});

test("sortearNumeroElegivel lança erro quando não há números elegíveis", () => {
    assert.throws(
        () =>
            sortearNumeroElegivel(
                [{ de: 1, ate: 5 }],
                { minimo: 1, maximo: 5 },
            ),
        /não existem números elegíveis/i,
    );
});

test("inteiroAleatorioInclusivo respeita os limites informados", () => {
    for (let tentativa = 0; tentativa < 100; tentativa += 1) {
        const numero = inteiroAleatorioInclusivo(-3, 4);
        assert.ok(Number.isInteger(numero));
        assert.ok(numero >= -3 && numero <= 4);
    }
});

test("inteiroAleatorioInclusivo rejeita intervalos inválidos", () => {
    assert.throws(
        () => inteiroAleatorioInclusivo(5, 4),
        /intervalo inválido/i,
    );
});
