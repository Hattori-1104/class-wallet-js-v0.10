import { prisma } from "~/services/repository.server"
import { entryStudentRoute } from "~/services/route-module.server"
import { errorBuilder } from "~/services/session.server"
import { queryIsInCharge } from "~/super-modules/purchase/common"
import type { Route } from "./+types/receipt-submission"

const queryIsRequester = async (purchaseId: string, studentId: string) => {
	const purchase = await prisma.purchase.findUnique({
		where: {
			id: purchaseId,
			requestedBy: { id: studentId },
			part: { students: { some: { id: studentId } } },
		},
	})
	return Boolean(purchase)
}

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const { partId, student, session } = await entryStudentRoute(
		request,
		params.partId,
	)
	const isInCharge = await queryIsInCharge({
		type: "student",
		partId,
		studentId: student.id,
	})
	const isRequester = await queryIsRequester(params.purchaseId, student.id)
	const errorRedirect = errorBuilder(`/app/student/part/${partId}`, session)
	const purchase = await prisma.purchase.findUniqueOrThrow({
		where: {
			id: params.purchaseId,
			part: { id: partId, students: { some: { id: student.id } } },
		},
		select: {
			label: true,
			canceled: true,
			plannedUsage: true,
			completion: {
				select: {
					actualUsage: true,
				},
			},
		},
	})
}

export default () => {}
