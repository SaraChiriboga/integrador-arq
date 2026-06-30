const puppeteer = require('puppeteer');

exports.handler = async (event) => {
    console.log("Iniciando generación de PDF con evento:", JSON.stringify(event));
    
    // Obtener los datos agregados
    const { requestId, data } = event;
    
    if (!requestId || !data) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Faltan datos requeridos (requestId o data)" })
        };
    }

    let browser;
    try {
        // Lanzar Puppeteer ( Chromium local o en la capa de AWS Lambda )
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        // Template HTML5 moderno
        const htmlTemplate = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Reporte OSINT Ecuador - ${requestId}</title>
                <style>
                    body { font-family: 'Helvetica', sans-serif; padding: 30px; color: #333; }
                    h1 { color: #0056b3; border-bottom: 2px solid #0056b3; padding-bottom: 10px; }
                    .section { margin-bottom: 20px; }
                    .title { font-weight: bold; }
                </style>
            </head>
            <body>
                <h1>REPORTE OSINT CONSOLIDADO (ECUADOR)</h1>
                <p><span class="title">ID Solicitud:</span> ${requestId}</p>
                <p><span class="title">Nombre Completo:</span> ${data.fullName}</p>
                <p><span class="title">Fecha de Nacimiento:</span> ${data.birthDate}</p>
                <p><span class="title">Estado Civil:</span> ${data.civilStatus}</p>
                
                <div class="section">
                    <h3>1. Multas de Tránsito (ANT)</h3>
                    <p>Puntos de Licencia: ${data.ant.points}/30</p>
                    <p>Multas Acumuladas: $${data.ant.fines}</p>
                </div>
                <div class="section">
                    <h3>2. SRI y Contribuciones</h3>
                    <p>Estado Tributario: ${data.sri.taxStatus}</p>
                </div>
            </body>
            </html>
        `;

        await page.setContent(htmlTemplate);
        
        // Renderizar el PDF en buffer
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true
        });

        // TODO: En producción subir este buffer a un bucket de AWS S3 (Localstack en dev)
        const mockS3Url = `https://s3.amazonaws.com/osint-bucket/reports/report-${requestId}.pdf`;

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "PDF generado con éxito",
                pdfUrl: mockS3Url
            })
        };
    } catch (error) {
        console.error("Error generando PDF:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};
