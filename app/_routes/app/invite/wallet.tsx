import { redirect } from "react-router"
import {
	_userNotFoundRedirect,
	requireSession,
} from "~/services/session.server"
import { verifyUser } from "~/services/session.server"
import type { Route } from "./+types/wallet"

export const loader = async ({
	request,
	params: { walletId },
}: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const user = await verifyUser(session)
	if (user.type === "student")
		return redirect(`/app/invite/wallet/${walletId}/accountant`)
	if (user.type === "teacher")
		return redirect(`/app/invite/wallet/${walletId}/teacher`)
	return _userNotFoundRedirect(session)
}
