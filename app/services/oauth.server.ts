import { google } from "googleapis"
import { z } from "zod"
import { getSession } from "./session.server"

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI

const oauth2Client = new google.auth.OAuth2(
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	GOOGLE_REDIRECT_URI,
)

const GoogleUserSchema = z.object({
	id: z.string(),
	email: z.string().email(),
	name: z.string(),
	verified_email: z.boolean(),
	picture: z.string().url(),
})

export async function getGoogleUser(code: string) {
	const { tokens } = await oauth2Client.getToken(code)
	oauth2Client.setCredentials(tokens)

	const oauth2 = google.oauth2("v2")
	const { data } = await oauth2.userinfo.get({ auth: oauth2Client })

	return GoogleUserSchema.parse(data)
}

export const getGoogleAuthUrl = (state: string) =>
	oauth2Client.generateAuthUrl({
		access_type: "offline",
		scope: [
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		],
		state,
	})

export async function setOauthState(request: Request) {
	const session = await getSession(request.headers.get("Cookie"))
	const state = crypto.randomUUID()
	session.set("oauthState", state)
	return {
		state,
		session,
	}
}

export async function verifyOauthState(request: Request, state: string) {
	const session = await getSession(request.headers.get("Cookie"))
	const savedState = session.get("oauthState")
	return savedState === state
}
