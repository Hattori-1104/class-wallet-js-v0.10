import { parseWithZod } from "@conform-to/zod"
import type { Prisma } from "@prisma/client"
import { Form } from "react-router"
import { z } from "zod"
import { Section, SectionTitle } from "~/components/common/container"
import { Aside, Distant } from "~/components/common/placement"
import { NoData, Note, Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible"
import { formatDiffDate } from "~/utilities/display"

type Purchase = Prisma.PurchaseGetPayload<{
	select: {
		state: {
			select: {
				teacherApproval: {
					select: {
						approved: true
						at: true
						by: {
							select: {
								name: true
							}
						}
					}
				}
			}
		}
	}
}>
export const TeacherApproval = ({ purchase, isInCharge }: { purchase: Purchase; isInCharge: boolean }) => {
	return (
		<>
			<Section>
				<SectionTitle>
					<Title>教師による承認</Title>
				</SectionTitle>
				{purchase.state.teacherApproval ? (
					<Distant>
						<div>{purchase.state.teacherApproval.by.name}が承認</div>
						<Note>{formatDiffDate(purchase.state.teacherApproval.at, Date.now())}</Note>
					</Distant>
				) : (
					<NoData>承認されていません。</NoData>
				)}
			</Section>
			{isInCharge && (
				<Section>
					<Collapsible>
						<SectionTitle>
							<CollapsibleTrigger asChild>
								<Button variant="outline" className="w-full">
									教師承認
								</Button>
							</CollapsibleTrigger>
						</SectionTitle>
						<CollapsibleContent>
							<Form method="post">
								<Aside>
									<Button variant="destructive" name="action" value="reject" className="grow">
										拒否
									</Button>
									<Button name="action" value="approve" className="grow">
										承認
									</Button>
								</Aside>
							</Form>
						</CollapsibleContent>
					</Collapsible>
				</Section>
			)}
		</>
	)
}

const ActionSchema = z.object({ action: z.enum(["reject", "approve"]) })
export const parseTeacherApprovalAction = (formData: FormData) => parseWithZod(formData, { schema: ActionSchema })
