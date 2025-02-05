const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

const uploadFiles = async (event) => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No se ha enviado ningún archivo" }),
      };
    }

    // Extraer el `contactId` de los parámetros
    const contentType = event.headers["content-type"] || event.headers["Content-Type"];
    if (!contentType.startsWith("multipart/form-data")) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "El Content-Type debe ser multipart/form-data" }),
      };
    }

    const boundary = contentType.split("boundary=")[1];
    if (!boundary) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No se encontró un boundary en el Content-Type" }),
      };
    }

    const bodyBuffer = Buffer.from(event.body, "base64");
    const parts = bodyBuffer.toString("utf-8").split(`--${boundary}`);

    let contactId = null;
    let uploadedFiles = [];

    for (const part of parts) {
      if (part.includes("Content-Disposition")) {
        if (part.includes('name="contactId"')) {
          contactId = part.split("\r\n\r\n")[1]?.trim();
        } else if (part.includes('name="files"')) {
          const fileStartIndex = part.indexOf("\r\n\r\n") + 4;
          const fileBuffer = Buffer.from(part.substring(fileStartIndex).trim(), "utf-8");

          const fileKey = `${contactId}/${uuidv4()}.png`;

          const uploadParams = {
            Bucket: "contacts-uploads-bucket",
            Key: fileKey,
            Body: fileBuffer,
            ContentType: "image/png",
          };

          await s3.upload(uploadParams).promise();
          uploadedFiles.push(`https://${uploadParams.Bucket}.s3.amazonaws.com/${fileKey}`);
        }
      }
    }

    if (!contactId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "El campo contactId es obligatorio" }),
      };
    }

    // 🔹 **Actualizar DynamoDB con los archivos subidos**
    await dynamoDB
      .update({
        TableName: "aws-lambda-contact-crud-contacts",
        Key: { id: contactId },
        UpdateExpression: "SET files = list_append(if_not_exists(files, :empty_list), :files)",
        ExpressionAttributeValues: {
          ":files": uploadedFiles,
          ":empty_list": [],
        },
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Archivos subidos con éxito",
        files: uploadedFiles,
      }),
    };
  } catch (error) {
    console.error("Error al subir archivos:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error interno del servidor" }),
    };
  }
};

module.exports = { uploadFiles };
