import axios from "axios";
import "../src/config/envs";

export const verifyCaptcha = async (event: any) => {
  try {
    const body = JSON.parse(event.body);
    const { token } = body;

    if (!token) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Captcha token is required" }),
      };
    }

    const response = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      {},
      {
        params: {
          secret: process.env.recaptchaSecretKey,
          response: token,
        },
      }
    );

    if (!response.data.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid captcha",
          errors: response.data["error-codes"],
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(response.data),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error validating captcha",
        error: error.message,
      }),
    };
  }
};
