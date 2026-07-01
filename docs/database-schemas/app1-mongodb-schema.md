# Esquema de MongoDB — Colección `osint_raw_data`

En la base de datos `osint_db`, la colección `osint_raw_data` almacena las respuestas crudas e íntegras obtenidas de las 5 fuentes gubernamentales consultadas para cada solicitud. Esto actúa como un registro histórico de auditoría sin procesar.

## Estructura del Documento JSON/BSON

Cada documento se genera de forma dinámica con el siguiente formato:

```json
{
  "_id": {"$oid": "65e2b8c9d1a8f9a2c3b4e5f6"},
  "requestId": "909cc9c1-56b9-4e36-a7e6-43900e02edf2",
  "targetId": "1710034065",
  "extractedData": {
    "rc": {
      "fullName": "DIANA CEVALLOS ALBUJA",
      "birthDate": "1990-05-15",
      "civilStatus": "CASADO"
    },
    "ant": {
      "points": 25,
      "fines": 225.0
    },
    "sri": {
      "hasRuc": true,
      "taxStatus": "CON DEUDAS"
    },
    "iess": {
      "isAffiliated": true,
      "contributions": 150
    },
    "senescyt": [
      {
        "title": "ARQUITECTO",
        "university": "UNIVERSIDAD CENTRAL DEL ECUADOR"
      }
    ]
  },
  "timestamp": 1782839201.345
}
```

## Descripción de Campos

| Campo | Tipo BSON | Descripción |
| :--- | :--- | :--- |
| `_id` | ObjectId | Identificador único autogenerado por MongoDB. |
| `requestId` | String (UUID) | ID de la solicitud generado originalmente por la App 2 (Portal). Relaciona el documento con la base de datos relacional de solicitudes. |
| `targetId` | String | Número de cédula de ciudadanía consultada. |
| `timestamp` | Double/Float | Marca de tiempo Unix (epoch) del momento exacto de la inserción en milisegundos. |
| `extractedData` | Document (Object) | Contenedor principal de la información recolectada de APIs. |
| `extractedData.rc` | Document (Object) | Registro Civil: Datos básicos del ciudadano. |
| `extractedData.ant` | Document (Object) | Agencia Nacional de Tránsito: Puntos de la licencia y multas en dólares. |
| `extractedData.sri` | Document (Object) | Servicio de Rentas Internas: Estado del RUC y estado tributario. |
| `extractedData.iess` | Document (Object) | Instituto Ecuatoriano de Seguridad Social: Afiliación activa y aportaciones. |
| `extractedData.senescyt` | Array (Objects) | Títulos registrados oficialmente en la base nacional. |
