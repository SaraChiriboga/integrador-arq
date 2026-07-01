const puppeteer = require('puppeteer');
const { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand } = require("@aws-sdk/client-s3");

const S3_ENDPOINT = process.env.S3_ENDPOINT || "http://localhost:4566";
const BUCKET_NAME = process.env.S3_BUCKET_NAME || "osint-bucket";

// Cliente de S3 configurado para desarrollo local (LocalStack) o AWS S3
const s3Client = new S3Client({
    endpoint: S3_ENDPOINT,
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: "mock",
        secretAccessKey: "mock"
    },
    forcePathStyle: true // Obligatorio para LocalStack y MinIO
});

exports.handler = async (event) => {
    console.log("Iniciando generación de PDF con evento:", JSON.stringify(event));
    
    const { requestId, data } = event;
    const targetId = data.targetId || "ecuador";
    
    if (!requestId || !data) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Faltan datos requeridos (requestId o data)" })
        };
    }

    let browser;
    try {
        // Asegurar que el bucket exista en S3/Localstack
        try {
            await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
        } catch (err) {
            console.log(`El bucket '${BUCKET_NAME}' no existe. Creándolo...`);
            await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
        }

        // Lanzar Puppeteer
        browser = await puppeteer.launch({
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ],
            headless: "new"
        });
        const page = await browser.newPage();
        
        // Template HTML5 moderno y estilizado para el reporte
        const htmlTemplate = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="utf-8">
                <title>Reporte OSINT Ecuador - ${requestId}</title>
                <style>
                    body { font-family: 'Outfit', 'Helvetica', sans-serif; padding: 40px; color: #2D3748; background-color: #F7FAFC; line-height: 1.6; }
                    .header { background: linear-gradient(135deg, #1A365D 0%, #2A4365 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                    .header h1 { margin: 0; font-size: 26px; letter-spacing: 0.5px; }
                    .header p { margin: 5px 0 0 0; opacity: 0.8; font-size: 14px; }
                    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 15px; font-size: 14px; }
                    .section { background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #E2E8F0; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
                    .section h3 { margin-top: 0; color: #2B6CB0; border-bottom: 2px solid #E2E8F0; padding-bottom: 8px; font-size: 18px; }
                    .data-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #EDF2F7; }
                    .data-row:last-child { border-bottom: none; }
                    .label { font-weight: 600; color: #4A5568; }
                    .value { color: #1A202C; }
                    .badge { padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: bold; }
                    .badge-success { background-color: #C6F6D5; color: #22543D; }
                    .badge-warning { background-color: #FEFCBF; color: #744210; }
                    .badge-danger { background-color: #FED7D7; color: #742A2A; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>REPORTE OSINT CONSOLIDADO</h1>
                    <p>Plataforma de Inteligencia de Fuentes Abiertas - Ecuador</p>
                    <div class="meta-grid">
                        <div><strong>ID Reporte:</strong> ${requestId}</div>
                        <div><strong>Cédula Consultada:</strong> ${targetId}</div>
                    </div>
                </div>

                <div class="section">
                    <h3>1. Información de Identidad (Registro Civil)</h3>
                    <div class="data-row">
                        <span class="label">Nombres Completos:</span>
                        <span class="value">${data.fullName}</span>
                    </div>
                    <div class="data-row">
                        <span class="label">Fecha de Nacimiento:</span>
                        <span class="value">${data.birthDate}</span>
                    </div>
                    <div class="data-row">
                        <span class="label">Estado Civil:</span>
                        <span class="value">${data.civilStatus}</span>
                    </div>
                </div>

                <div class="section">
                    <h3>2. Registro de Tránsito (Agencia Nacional de Tránsito)</h3>
                    <div class="data-row">
                        <span class="label">Puntos en Licencia:</span>
                        <span class="value">${data.ant.points} / 30</span>
                    </div>
                    <div class="data-row">
                        <span class="label">Multas de Tránsito Pendientes:</span>
                        <span class="value">$${data.ant.fines}</span>
                    </div>
                </div>

                <div class="section">
                    <h3>3. Situación Tributaria (SRI)</h3>
                    <div class="data-row">
                        <span class="label">Posee RUC Activo:</span>
                        <span class="value">${data.sri.hasRuc ? "SÍ" : "NO"}</span>
                    </div>
                    <div class="data-row">
                        <span class="label">Estado de Obligaciones:</span>
                        <span class="value">
                            <span class="badge ${data.sri.taxStatus === "AL DIA" ? "badge-success" : "badge-danger"}">
                                ${data.sri.taxStatus}
                            </span>
                        </span>
                    </div>
                </div>

                <div class="section">
                    <h3>4. Afiliación de Seguridad Social (IESS)</h3>
                    <div class="data-row">
                        <span class="label">Estado de Afiliación:</span>
                        <span class="value">${data.iess.isAffiliated ? "AFILIADO ACTIVO" : "INACTIVO"}</span>
                    </div>
                    <div class="data-row">
                        <span class="label">Número de Aportaciones:</span>
                        <span class="value">${data.iess.contributions} aportes</span>
                    </div>
                </div>
            </body>
            </html>
        `;

        await page.setContent(htmlTemplate);
        
        // Renderizar el PDF en Buffer
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
        });

        // Subir el PDF a Localstack / S3
        const key = `reports/${requestId}-${targetId}.pdf`;
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: pdfBuffer,
            ContentType: "application/pdf"
        }));

        // Traducir el endpoint para el navegador web externo (el front corre en localhost, no en el host de la red docker)
        const clientS3Url = S3_ENDPOINT.replace("app4-localstack", "localhost")
        const publicPdfUrl = `${clientS3Url}/${BUCKET_NAME}/${key}`;
        
        console.log(`Reporte guardado en S3 exitosamente: ${publicPdfUrl}`);

        return {
            statusCode: 200,
            pdfUrl: publicPdfUrl
        };
    } catch (error) {
        console.error("Error crítico en generación PDF:", error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};
