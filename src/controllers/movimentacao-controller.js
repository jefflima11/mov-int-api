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
    try {
        const connection = await connectOracle();

        const consulta = await connection.execute(
            `SELECT * FROM DBAMV.LOG_MOV_INT_HUMS WHERE SN_IMPORTADO = 'N' AND ROWNUM <= 2`
        );
        
        await connection.close();
        
        res.status(200).json({ message: `Movimentação inserida com sucesso `, data: consulta.metaData.map(col => col.name)});

        // const { setor, empresa, atendimento, msg } = req.body;

        // const result = await connection.execute(
        //     `SELECT SEQ_PT_MVTO_PACIENTE.NEXTVAL FROM DUAL`
        //   );

        // const nextPaciente = result.rows[0][0]; 

        // await connection.execute(
        //     `
        //     BEGIN
        //         DBAMV.SP_INSERT_PT_MVTO_PACIENTE(
        //             :nextPaciente,
        //             :nextPaciente,
        //             :setor,
        //             :empresa,
        //             :atendimento,
        //             :msg                    
        //         );
        //     END;
        //     `
        //     , 
        //     { nextPaciente, setor, empresa, atendimento, msg},
        //     { autoCommit: true }
        //     );
        
        // await connection.commit();
    } catch (error) {
        res.status(500).json({ message: 'Error on postMovId', error });
    }
}

module.exports = { getMov, getMovId, postMovId};