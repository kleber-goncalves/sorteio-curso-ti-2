import assert from "node:assert/strict";
import test from "node:test";

import {
    analisarInteiroSeguro,
    analisarListaNumerosIsolados,
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

test("analisarListaNumerosIsolados interpreta números separados por vírgulas", () => {
    assert.deepEqual(
        analisarListaNumerosIsolados("122, 124, 126, 128, 132, 134, 136, 138, 140"),
        [122, 124, 126, 128, 132, 134, 136, 138, 140],
    );
});

test("analisarListaNumerosIsolados aceita ponto e vírgula, espaços e quebras de linha", () => {
    assert.deepEqual(
        analisarListaNumerosIsolados("10; 20  30\\n40"),
        [10, 20, 30, 40],
    );
});

test("analisarListaNumerosIsolados rejeita lista vazia, valores inválidos e duplicatas", () => {
    assert.throws(() => analisarListaNumerosIsolados("  "), /ao menos um número/i);
    assert.throws(() => analisarListaNumerosIsolados("10, abc, 20"), /abc.*inteiro válido/i);
    assert.throws(() => analisarListaNumerosIsolados("10, 20, 10"), /números repetidos/i);
    assert.throws(
        () => analisarListaNumerosIsolados("9007199254740992"),
        /inteiro válido/i,
    );
});

test("normalizarFaixasExcluidas ordena e une apenas faixas sobrepostas", () => {
    const faixas = [
        { de: 8, ate: 10 },
        { de: 20, ate: 21 },
        { de: 1, ate: 2 },
        { de: 3, ate: 4 },
        { de: 10, ate: 12 },
    ];

    assert.deepEqual(normalizarFaixasExcluidas(faixas), [
        { de: 1, ate: 2 },
        { de: 3, ate: 4 },
        { de: 8, ate: 12 },
        { de: 20, ate: 21 },
    ]);
});

test("normalizarFaixasExcluidas preserva números isolados e os ordena", () => {
    assert.deepEqual(
        normalizarFaixasExcluidas([
            { de: 156, ate: 156 },
            { de: 123, ate: 123 },
            { de: 130, ate: 130 },
        ]),
        [
            { de: 123, ate: 123 },
            { de: 130, ate: 130 },
            { de: 156, ate: 156 },
        ],
    );
});

test("normalizarFaixasExcluidas une número isolado que já esteja dentro de uma faixa", () => {
    assert.deepEqual(
        normalizarFaixasExcluidas([
            { de: 123, ate: 123 },
            { de: 120, ate: 125 },
        ]),
        [{ de: 120, ate: 125 }],
    );
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

test("calcularIntervalosElegiveis exclui faixas e números isolados", () => {
    assert.deepEqual(
        calcularIntervalosElegiveis(
            [
                { de: 12, ate: 15 },
                { de: 123, ate: 123 },
                { de: 156, ate: 156 },
                { de: 130, ate: 130 },
            ],
            { minimo: 1, maximo: 200 },
        ),
        [
            { de: 1, ate: 11 },
            { de: 16, ate: 122 },
            { de: 124, ate: 129 },
            { de: 131, ate: 155 },
            { de: 157, ate: 200 },
        ],
    );
});

test("calcularIntervalosElegiveis não duplica exclusões sobrepostas", () => {
    assert.deepEqual(
        calcularIntervalosElegiveis(
            [
                { de: 10, ate: 15 },
                { de: 12, ate: 12 },
                { de: 13, ate: 13 },
            ],
            { minimo: 1, maximo: 20 },
        ),
        [
            { de: 1, ate: 9 },
            { de: 16, ate: 20 },
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

test("sortearNumeroElegivel nunca retorna números isolados excluídos", () => {
    const exclusoes = [
        { de: 123, ate: 123 },
        { de: 130, ate: 130 },
        { de: 156, ate: 156 },
    ];

    for (let tentativa = 0; tentativa < 300; tentativa += 1) {
        const numero = sortearNumeroElegivel(exclusoes, {
            minimo: 120,
            maximo: 160,
        });

        assert.ok(![123, 130, 156].includes(numero));
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
