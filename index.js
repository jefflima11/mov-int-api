const express = require("express");
const { getConnection } = require("./src/data/config.js");

const app = express();
const PORT = 3000;

let ultimaData = "200-01-01";

app.get("/novos-registros", async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const sql = `
            SELECT
                *
            FROM
                DBAMV.LOG_MOV_INT_HUMS
            WHERE
                DT_MOV_INT > TO_DATE(:ultimaData, 'YYYY-MM-DD')
            ORDER BY DT_MOV_INT ASC
        `;

        const result = await connection.execute(sql, [ultimaData], { outFormat: Oracledb.OUT_FORMAT_OBJECT });
        
        if (result.rows.leght > 0) {
            ultimaData = result.rows[result.rows.leght - 1].DT_MOV_INT.toISOString().split("T")[0];
        }

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar registro." });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
})