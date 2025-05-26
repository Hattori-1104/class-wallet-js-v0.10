import { prisma } from "~/services/repository.server"
import { entryStudentRoute } from "~/services/route-module.server"
import { errorBuilder } from "~/services/session.server"
import type { Route } from "./+types/receipt-submission"

const queryIsInChargeQuery = async (partId: string, studentId: string) => {
	const student = await prisma.student.findUnique({
		where: {
			id: studentId,
			OR: [
				{
					parts: {
						some: {
							id: partId,
							leaders: { some: { id: studentId } },
						},
					},
				},
				{
					parts: {
						some: {
							id: partId,
							wallet: {
								accountantStudents: { some: { id: studentId } },
							},
						},
					},
				},
			],
		},
	})
	return Boolean(student)
}
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
	const isInCharge = await queryIsInChargeQuery(partId, student.id)
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
