import { TeacherApproval } from "~/components/page/purchase/teacher-approval"
import { prisma } from "~/services/repository.server"
import { requireSession, verifyStudent } from "~/services/session.server"
import type { Route } from "./+types/teacher-approval"

const serverCommon = async ({ params: { partId, purchaseId }, request }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)
	const purchase = await prisma.purchase.findUniqueOrThrow({
		where: { id: purchaseId, part: { id: partId } },
		include: {
			state: {
				select: {
					teacherApproval: {
						select: {
							approved: true,
							at: true,
							by: {
								select: {
									id: true,
									name: true,
								},
							},
						},
					},
				},
			},
		},
	})
	return { session, student, purchase }
}

export const loader = async (loaderArgs: Route.LoaderArgs) => {
	const { purchase } = await serverCommon(loaderArgs)
	return { purchase }
}

export default ({ loaderData: { purchase } }: Route.ComponentProps) => {
	return <TeacherApproval purchase={purchase} isInCharge={false} />
}

export const action = ({}: Route.ActionArgs) => {
	return null
}
