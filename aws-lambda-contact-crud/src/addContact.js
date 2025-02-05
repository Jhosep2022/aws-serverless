const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

const dynamoDB = new AWS.DynamoDB.DocumentClient();

const addContact = async (event) => {
  try {
    const requestBody = JSON.parse(event.body);
    const { nombre, email, empresa, telefono, mensaje, files } = requestBody;

    if (!nombre || !email || !mensaje) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Nombre, email y mensaje son obligatorios" }),
      };
    }

    const id = uuidv4();
    const fileUrls = files && Array.isArray(files) ? files.slice(0, 3) : [];

    const contactData = {
      id,
      nombre,
      email,
      empresa: empresa || null,
      telefono: telefono || null,
      mensaje,
      files: fileUrls,
      createdAt: new Date().toISOString(),
    };

    await dynamoDB
      .put({
        TableName: "aws-lambda-contact-crud-contacts",
        Item: contactData,
      })
      .promise();

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Contacto agregado exitosamente",
        contact: contactData,
      }),
    };
  } catch (error) {
    console.error("Error al agregar contacto:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error interno del servidor" }),
    };
  }
};

module.exports = { addContact };
// headers = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Headers': '*',
//   'Access-Control-Allow-Methods': 'POST'
// }