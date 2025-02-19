const { buscarMovimentacoes, buscarMovimentacaoPorId, inserirMovimentacao, verificaRegistroDeMovimentoNaPortaria, validaTipoDeMovimentacao } = require('../services/movimentacao-service');

const getMov = async (req, res) => {
    try {
        const data = await buscarMovimentacoes();
        res.status(200).json({ data });
    } catch (error) {
        res.status(500).json({ message: 'Error on getMov', error });
    }
};

const getMovId = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await buscarMovimentacaoPorId(id);
        res.status(200).json({ data });
    } catch (error) {
        res.status(500).json({ message: 'Error on getMovId', error });
    }
};

const postMovId = async (req, res) => {
    try {
        const { atendimento } = req.body;
        // const result = await inserirMovimentacao(atendimento);
        const result = await validaTipoDeMovimentacao(atendimento);

        if (result.error) {
            return res.status(404).json({ message: result.error });
        }

        res.status(200).json({ message: result.message });

    } catch (error) {
        res.status(500).json({ message: 'Erro ao processar movimentação', error });
    }
};

module.exports = { getMov, getMovId, postMovId };
