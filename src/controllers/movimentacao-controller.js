const connectOracle = require('../config/db-connection');

const getMov = async (req, res) => {
    try {
        const connection = await connectOracle();
        const result = await connection.execute('SELECT * FROM LOG_MOV_INT_HUMS WHERE ROWNUM <= 10');
        const columns = result.metaData.map(column => column.name);
        await connection.close();
        res.status(200).json({columns, data: result.rows});
    } catch (error) {
        res.status(500).json({ message: 'Error on getMov', error });
    }
};

const getMovId = async (req, res) => {
    try {
        const connection = await connectOracle();
        const { id } = req.params;
        const result = await connection.execute('SELECT CD_REPASSE,CD_PRESTADOR,VL_REPASSE,CD_PRESTADOR_REPASSE FROM REPASSE_PRESTADOR WHERE CD_REPASSE = :id', [id]);
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

module.exports = { getMov, getMovId };