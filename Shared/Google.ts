import "./Extensions";
import jwt from "jsonwebtoken";
import { OAuth2Client, TokenPayload } from "google-auth-library";

const CLIENT_ID =
  "378889662397-1ubh5092vfvgto0ru5ek5l8s4abfipcg.apps.googleusercontent.com";

const client = new OAuth2Client(CLIENT_ID);

class Google {
  static async verifyIdToken(token: string): Promise<TokenPayload> {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error("Invalid ID token.");
    }

    return payload;
  }
}

export { Google };
