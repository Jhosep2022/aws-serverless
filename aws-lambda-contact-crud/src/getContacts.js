const AWS = require("aws-sdk");

const dynamoDB = new AWS.DynamoDB.DocumentClient();

const getContacts = async () => {
  try {
    const result = await dynamoDB
      .scan({
        TableName: "aws-lambda-contact-crud-contacts",
      })
      .promise();

    // 🔹 Asegurarnos de que cada contacto tenga `files` correctamente
    const contacts = result.Items.map((contact) => ({
      ...contact,
      files: contact.files ? contact.files : [], // Asegurar que siempre sea un array
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Lista de contactos obtenida con éxito",
        contacts,
      }),
    };
  } catch (error) {
    console.error("Error al obtener contactos:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error interno del servidor" }),
    };
  }
};

module.exports = { getContacts };
