const connectOracle = require('../config/db-connection');

const getMov = async (req, res) => {
    try {
        const connection = await connectOracle();
        const result = await connection.execute('SELECT * FROM SNAKE_TRASH_HUMS WHERE ROWNUM <= 2 ORDER BY CD_TRASH DESC');
        await connection.close();
        res.status(200).json({data: result.rows});
    } catch (error) {
        res.status(500).json({ message: 'Error on getMov', error });
    }
};

const getMovId = async (req, res) => {
    try {
        const connection = await connectOracle();
        const { id } = req.params;
        const result = await connection.execute('SELECT * FROM LOG_MOV_INT_HUMS WHERE CD_ATENDIMENTO = :id', [id]);
        const columns = result.metaData.map(col => col.name);
        const data = result.rows.map((row) => 
            Object.fromEntries(row.map((value, index) => [columns[index], value]))
        );
        await connection.close();
        res.status(200).json({
            data});
    } catch (error) {
        res.status(500).json({ message: 'Error on getRepasseId', error });
    }
};

const postMovId = async (req, res) => {
    let connection;

    try {
        connection = await connectOracle();

        const atendimento = req.body.atendimento;

        // Obter o cdAtendimento e cdLeito
        const dadosDaMovimentacao = await connection.execute(
            `SELECT CD_ATENDIMENTO, CD_LEITO
             FROM DBAMV.LOG_MOV_INT_HUMS
             WHERE ID_LOG_MOV_INT = (
                 SELECT MAX(ID_LOG_MOV_INT) 
                 FROM DBAMV.LOG_MOV_INT_HUMS 
                 WHERE SN_IMPORTADO = 'N' AND CD_ATENDIMENTO =  :atendimento
             )`,{ atendimento }
        );

        if (dadosDaMovimentacao.rows.length === 0) {
            return res.status(404).json({ message: "Nenhum atendimento encontrado." });
        }

        const [cdAtendimento, cdLeito] = dadosDaMovimentacao.rows[0];

        // Obter o cdPaciente
        const dadosDoPaciente = await connection.execute(
            `SELECT CD_PACIENTE FROM DBAMV.ATENDIME WHERE CD_ATENDIMENTO = :cdAtendimento`,
            { cdAtendimento }
        );

        if (dadosDoPaciente.rows.length === 0) {
            return res.status(404).json({ message: "Paciente não encontrado." });
        }

        const cdPaciente = dadosDoPaciente.rows[0][0];

        // Obter o cdSetor
        const dadosDoLeito = await connection.execute(
            `SELECT UNID_INT.CD_SETOR
             FROM DBAMV.LEITO
             INNER JOIN DBAMV.UNID_INT ON LEITO.CD_UNID_INT = UNID_INT.CD_UNID_INT
             WHERE CD_LEITO = :cdLeito`,
            { cdLeito }
        );

        if (dadosDoLeito.rows.length === 0) {
            return res.status(404).json({ message: "Leito não encontrado." });
        }

        const cdSetor = dadosDoLeito.rows[0][0];

        const pegaSequenciaDoPaciente = await connection.execute(
           `SELECT SEQ_PT_MVTO_PACIENTE.NEXTVAL FROM DUAL`
          );

        const nextPaciente = pegaSequenciaDoPaciente.rows[0][0];

        await connection.execute(
            `BEGIN 
                DBAMV.SP_INSERT_PT_MVTO_PACIENTE(
                    :nextPaciente,
                    :cdPaciente,
                    :cdSetor,
                    1,
                    :cdAtendimento,
                    'Teste 02'
            );  
            END;`,
            { nextPaciente, cdPaciente, cdSetor, cdAtendimento },
            { autoCommit: true }
        );

        res.status(200).json({ message: 'Movimentação inserida com sucesso' });

    } catch (error) {
        console.error("Erro no postMovId:", error);
        res.status(500).json({ message: 'Erro ao buscar os dados', error });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
};



module.exports = { getMov, getMovId, postMovId};