const connectOracle = require('../config/db-connection');

async function buscarMovimentacoes() {
    const connection = await connectOracle();
    try {
        const result = await connection.execute(
            `SELECT * FROM LOG_MOV_INT_HUMS`
        );

        const columns = result.metaData.map(col => col.name);
        return result.rows.map(row => 
            Object.fromEntries(row.map((value, index) => [columns[index], value]))
        );
    } finally {
        await connection.close();
    }
}

async function buscarMovimentacaoPorId(id) {
    const connection = await connectOracle();
    try {
        const result = await connection.execute(
            `SELECT * FROM LOG_MOV_INT_HUMS WHERE CD_ATENDIMENTO = :id`,
            [id]
        );

        const columns = result.metaData.map(col => col.name);
        return result.rows.map(row => 
            Object.fromEntries(row.map((value, index) => [columns[index], value]))
        );
    } finally {
        await connection.close();
    }
}

async function inserirMovimentacao( atendimento,idLogMovimentacao) {
    const connection = await connectOracle();
    try {
        // Buscar dados da movimentação
        const dadosDaMovimentacao = await connection.execute(
            `SELECT CD_LEITO
            FROM DBAMV.LOG_MOV_INT_HUMS
            WHERE ID_LOG_MOV_INT = :idLogMovimentacao`
            , { idLogMovimentacao }
        );

        
        const cdLeito = dadosDaMovimentacao.rows[0][0];
        
        // Buscar código de setor do leito
        const leito = await connection.execute(
            `SELECT UNID_INT.CD_SETOR
            FROM DBAMV.LEITO
            INNER JOIN DBAMV.UNID_INT ON LEITO.CD_UNID_INT = UNID_INT.CD_UNID_INT
            WHERE CD_LEITO = :cdLeito`,
            { cdLeito }
        );

        const cdSetor = leito.rows[0][0];

        // Buscar código do paciente
        const paciente = await connection.execute(
            `SELECT CD_PACIENTE FROM DBAMV.ATENDIME WHERE CD_ATENDIMENTO = :atendimento`,
            { atendimento }
        );

        if (paciente.rows.length === 0) return { error: "Paciente não encontrado." };
        const cdPaciente = paciente.rows[0][0];

        // Gerar sequência para o paciente
        const sequencia = await connection.execute(`SELECT SEQ_PT_MVTO_PACIENTE.NEXTVAL FROM DUAL`);
        const nextPaciente = sequencia.rows[0][0];

        // Inserir movimentação no banco
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

        // Atualizar SN_IMPORTADO para 'S'
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

async function atualizaMovimentacao( atendimento, idLogMovimentacao) {
    const connection = await connectOracle();

    try {
        const retornaLeitoAtual = await connection.execute(
            `SELECT CD_LEITO
            FROM DBAMV.LOG_MOV_INT_HUMS
            WHERE ID_LOG_MOV_INT = :idLogMovimentacao`,
            { idLogMovimentacao }
        );

        if (retornaLeitoAtual.rows.length === 0) return { error: "Nenhum leito encontrado" };

        const cdLeito = retornaLeitoAtual.rows[0][0];

        const retornaSetorAtual = await connection.execute(
            `SELECT UNID_INT.CD_SETOR
            FROM DBAMV.LEITO
            INNER JOIN DBAMV.UNID_INT ON LEITO.CD_UNID_INT = UNID_INT.CD_UNID_INT
            WHERE CD_LEITO = :cdLeito`,
            { cdLeito }
        );

        if (retornaSetorAtual.rows.length === 0) return { error: "Nenhum setor encontrado" };

        const cdSetor = retornaSetorAtual.rows[0][0];

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
    const connection = await connectOracle();
    try {
        const checagem = await connection.execute(
            `SELECT 1 FROM DBAMV.PT_MVTO_PACIENTE WHERE CD_ATENDIMENTO = :atendimento`,
            { atendimento }
        );

        if (checagem.rows[0] == 1 && etapa == 1) {
            return { message: 'Movimentação de internação já registrada'} 
        } else if (checagem.rows[0] == 1 && etapa == 2){
            return atualizaMovimentacao(atendimento, idLogMovimentacao);
        } else {
            return inserirMovimentacao(atendimento, idLogMovimentacao);
        };

    } catch (error) {
        return { message: 'Erro ao verificar movimentação', error };
    } finally {
        await connection.close();
    }
};

async function validaTipoDeMovimentacao(atendimento) {
    const connection = await connectOracle();

    try {
        const dadosDaMovimentacao = await connection.execute(
            `SELECT TP_MOV, ID_LOG_MOV_INT
             FROM DBAMV.LOG_MOV_INT_HUMS
             WHERE ID_LOG_MOV_INT = (
                 SELECT MAX(ID_LOG_MOV_INT) 
                 FROM DBAMV.LOG_MOV_INT_HUMS 
                 WHERE SN_IMPORTADO = 'N' AND CD_ATENDIMENTO = :atendimento
             )`,
            { atendimento }
        );

        if (dadosDaMovimentacao.rows.length === 0) return { error: "Nenhum atendimento encontrado." };

        const [tipoDeMovimentacao, idLogMovimentacao] = dadosDaMovimentacao.rows[0];

        
        let etapa = 0;
        
        if (tipoDeMovimentacao == "I") {
            etapa = 1;

            return verificaRegistroDeMovimentoNaPortaria(atendimento, idLogMovimentacao, etapa);
        } else {
            etapa = 2;
            return verificaRegistroDeMovimentoNaPortaria(atendimento, idLogMovimentacao, etapa);
        }
    } catch (error) {

    } finally {
        await connection.close();
    };
}

async function processarMovimentacoesAutomaticamente() {
    console.log('Processando movimentações automaticamente...');

    const connection = await connectOracle();
    try {
        const movimentacoes = await connection.execute(
            `SELECT CD_ATENDIMENTO
            FROM DBAMV.LOG_MOV_INT_HUMS
            WHERE SN_IMPORTADO = 'N'`
        );

        for (let i = 0; i < movimentacoes.rows.length; i++) {
            const atendimento = movimentacoes.rows[i][0];
            await validaTipoDeMovimentacao(atendimento);
        }
        console.clear();
        console.log('Movimentações processadas com sucesso');
    } catch (error) {
        console.error('Erro ao processar movimentações', error);
    } finally {
        await connection.close();
    }
};

module.exports = { 
    buscarMovimentacoes, 
    buscarMovimentacaoPorId, 
    inserirMovimentacao, 
    verificaRegistroDeMovimentoNaPortaria, 
    validaTipoDeMovimentacao, 
    processarMovimentacoesAutomaticamente };
