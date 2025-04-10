const { getConnection } = require('../config/db-connection');

// Utilitário para mapear os resultados do Oracle
function mapResultToObject(result) {
    const columns = result.metaData.map(col => col.name);
    return result.rows.map(row =>
        Object.fromEntries(row.map((value, index) => [columns[index], value]))
    );
}

async function buscarMovimentacoes() {
    const connection = await getConnection();
    try {
        const result = await connection.execute(`SELECT * FROM LOG_MOV_INT_HUMS`);
        return mapResultToObject(result);
    } finally {
        await connection.close();
    }
}

async function buscarMovimentacaoPorId(id) {
    const connection = await getConnection();
    try {
        const result = await connection.execute(
            `SELECT * FROM LOG_MOV_INT_HUMS WHERE CD_ATENDIMENTO = :id`,
            [id]
        );
        return mapResultToObject(result);
    } finally {
        await connection.close();
    }
}

async function inserirMovimentacao(atendimento, idLogMovimentacao) {
    const connection = await getConnection();
    try {
        const dadosDaMovimentacao = await connection.execute(
            `SELECT CD_LEITO
             FROM DBAMV.LOG_MOV_INT_HUMS
             WHERE ID_LOG_MOV_INT = :idLogMovimentacao`,
            { idLogMovimentacao }
        );
        const cdLeito = dadosDaMovimentacao.rows[0][0];

        const leito = await connection.execute(
            `SELECT UNID_INT.CD_SETOR
             FROM DBAMV.LEITO
             INNER JOIN DBAMV.UNID_INT ON LEITO.CD_UNID_INT = UNID_INT.CD_UNID_INT
             WHERE CD_LEITO = :cdLeito`,
            { cdLeito }
        );
        const cdSetor = leito.rows[0][0];

        const paciente = await connection.execute(
            `SELECT CD_PACIENTE FROM DBAMV.ATENDIME WHERE CD_ATENDIMENTO = :atendimento`,
            { atendimento }
        );
        if (paciente.rows.length === 0) return { error: "Paciente não encontrado." };
        const cdPaciente = paciente.rows[0][0];

        const sequencia = await connection.execute(`SELECT SEQ_PT_MVTO_PACIENTE.NEXTVAL FROM DUAL`);
        const nextPaciente = sequencia.rows[0][0];

        await connection.execute(
            `BEGIN 
                DBAMV.SP_INSERT_PT_MVTO_PACIENTE(
                    :nextPaciente,
                    :cdPaciente,
                    :cdSetor,
                    1,
                    :atendimento,
                    ''
                );  
             END;`,
            { nextPaciente, cdPaciente, cdSetor, atendimento },
            { autoCommit: true }
        );

        await connection.execute(
            `UPDATE DBAMV.LOG_MOV_INT_HUMS
             SET SN_IMPORTADO = 'S'
             WHERE ID_LOG_MOV_INT = :idLogMovimentacao`,
            { idLogMovimentacao },
            { autoCommit: true }
        );

        return { message: 'Movimentação inserida com sucesso' };
    } catch (error) {
        return { message: 'Erro ao tentar inserir movimentação', error };
    } finally {
        await connection.close();
    }
}

async function atualizaMovimentacao(atendimento, idLogMovimentacao) {
    const connection = await getConnection();
    try {
        const leitoAtual = await connection.execute(
            `SELECT CD_LEITO
             FROM DBAMV.LOG_MOV_INT_HUMS
             WHERE ID_LOG_MOV_INT = :idLogMovimentacao`,
            { idLogMovimentacao }
        );
        if (leitoAtual.rows.length === 0) return { error: "Nenhum leito encontrado" };
        const cdLeito = leitoAtual.rows[0][0];

        const setorAtual = await connection.execute(
            `SELECT UNID_INT.CD_SETOR
             FROM DBAMV.LEITO
             INNER JOIN DBAMV.UNID_INT ON LEITO.CD_UNID_INT = UNID_INT.CD_UNID_INT
             WHERE CD_LEITO = :cdLeito`,
            { cdLeito }
        );
        if (setorAtual.rows.length === 0) return { error: "Nenhum setor encontrado" };
        const cdSetor = setorAtual.rows[0][0];

        await connection.execute(
            `UPDATE DBAMV.PT_MVTO_PACIENTE
             SET CD_SETOR = :cdSetor
             WHERE CD_ATENDIMENTO = :atendimento`,
            { cdSetor, atendimento },
            { autoCommit: true }
        );

        return { message: 'Movimentação atualizada com sucesso' };
    } catch (error) {
        return { message: 'Erro ao tentar atualizar movimentação', error };
    } finally {
        await connection.close();
    }
}

async function verificaRegistroDeMovimentoNaPortaria(atendimento, idLogMovimentacao, etapa) {
    const connection = await getConnection();
    try {
        const checagem = await connection.execute(
            `SELECT 1 FROM DBAMV.PT_MVTO_PACIENTE WHERE CD_ATENDIMENTO = :atendimento`,
            { atendimento }
        );

        if (checagem.rows[0] == 1 && etapa === 1) {
            return { message: 'Movimentação de internação já registrada' };
        } else if (checagem.rows[0] == 1 && etapa === 2) {
            return atualizaMovimentacao(atendimento, idLogMovimentacao);
        } else {
            return inserirMovimentacao(atendimento, idLogMovimentacao);
        }
    } catch (error) {
        return { message: 'Erro ao verificar movimentação', error };
    } finally {
        await connection.close();
    }
}

async function validaTipoDeMovimentacao(atendimento) {
    const connection = await getConnection();
    try {
        const result = await connection.execute(
            `SELECT TP_MOV, ID_LOG_MOV_INT
             FROM DBAMV.LOG_MOV_INT_HUMS
             WHERE ID_LOG_MOV_INT = (
                 SELECT MAX(ID_LOG_MOV_INT)
                 FROM DBAMV.LOG_MOV_INT_HUMS 
                 WHERE SN_IMPORTADO = 'N' AND CD_ATENDIMENTO = :atendimento
             )`,
            { atendimento }
        );

        if (result.rows.length === 0) return { error: "Nenhum atendimento encontrado." };

        const [tipoDeMovimentacao, idLogMovimentacao] = result.rows[0];
        const etapa = tipoDeMovimentacao === "I" ? 1 : 2;

        return verificaRegistroDeMovimentoNaPortaria(atendimento, idLogMovimentacao, etapa);
    } catch (error) {
        return { message: 'Erro ao validar tipo de movimentação', error };
    } finally {
        await connection.close();
    }
}

async function processarMovimentacoesAutomaticamente() {
    console.log('Processando movimentações automaticamente...');
    const connection = await getConnection();
    try {
        const result = await connection.execute(
            `SELECT CD_ATENDIMENTO
             FROM DBAMV.LOG_MOV_INT_HUMS
             WHERE SN_IMPORTADO = 'N'`
        );

        for (const row of result.rows) {
            const atendimento = row[0];
            await validaTipoDeMovimentacao(atendimento);
        }

        console.log('Movimentações processadas com sucesso!');
    } catch (error) {
        console.error('Erro ao processar movimentações', error);
    } finally {
        await connection.close();
    }
}

module.exports = {
    buscarMovimentacoes,
    buscarMovimentacaoPorId,
    inserirMovimentacao,
    verificaRegistroDeMovimentoNaPortaria,
    validaTipoDeMovimentacao,
    processarMovimentacoesAutomaticamente
};
