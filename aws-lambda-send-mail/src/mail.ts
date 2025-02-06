import { google } from "googleapis";
import "../src/config/envs";
import fs from "fs";
import path from "path";
import handlebars from "handlebars";

const __dirname = path.resolve();

const oauth2Client = new google.auth.OAuth2(
  process.env.OAUTH_CLIENT_ID,
  process.env.OAUTH_CLIENT_SECRET,
  process.env.OAUTH_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.OAUTH_REFRESH_TOKEN,
});

const confirmationEmailTemplate: handlebars.TemplateDelegate = loadTemplate("message.html");

function loadTemplate(templateName: string): handlebars.TemplateDelegate {
  const templatesFolderPath = path.join(__dirname, "./src");
  const templatePath = path.join(templatesFolderPath, templateName);

  const templateSource = fs.readFileSync(templatePath, "utf8");
  return handlebars.compile(templateSource);
}

export const sendConfirmationEmail = async (event: any) => {
  try {
    const body = JSON.parse(event.body);
    const { userEmail, name, id } = body;

    if (!userEmail || !name || !id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Insufficient data to send the email" }),
      };
    }

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const html = confirmationEmailTemplate({
      name,
      receivedDate: new Date().toLocaleString("en-GB", { hour12: false }),
      id,
    });

    const emailsToSend = [userEmail];

    const rawEmail = [
      `From: "Flowper" <${process.env.MAIL_FROM}>`,
      `To: ${emailsToSend.join(", ")}`,
      "Subject: Hemos recibido tu mensaje",
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=utf-8",
      "",
      html,
    ].join("\n");

    const encodedEmail = Buffer.from(rawEmail)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedEmail,
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Mail sent correctly" }),
    };
  } catch (error: any) {
    console.error("Error sending email:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error sending email",
        error: error.message,
      }),
    };
  }
};
