const express = require('express');
const { handler } = require('./index');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Endpoint POST para invocar la lambda de forma local vía HTTP
app.post('/', async (req, res) => {
    try {
        console.log("Petición recibida en Lambda PDF Mock Server...");
        const result = await handler(req.body);
        if (result.statusCode && result.statusCode !== 200) {
            return res.status(result.statusCode).json(JSON.parse(result.body));
        }
        return res.status(200).json(result);
    } catch (error) {
        console.error("Error en Express Lambda PDF Mock:", error);
        return res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor local Lambda PDF escuchando en el puerto ${PORT}`);
});
