import { parseWithZod } from "@conform-to/zod"
import type { Prisma } from "@prisma/client"
import { Form } from "react-router"
import { z } from "zod"
import { Section, SectionTitle } from "~/components/common/container"
import { Aside, Distant } from "~/components/common/placement"
import { NoData, Note, Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible"
import { formatMoney } from "~/utilities/display"
import { formatDiffDate } from "~/utilities/display"

type Purchase = Prisma.PurchaseGetPayload<{
	select: {
		plannedUsage: true
		state: {
			select: {
				request: {
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
export const Request = ({ purchase, isRequester }: { purchase: Purchase; isRequester: boolean }) => {
	return (
		<>
			<Section>
				<SectionTitle>
					<Title>購入リクエスト</Title>
				</SectionTitle>
				{purchase.state.request ? (
					<Distant>
						<div>
							<p>{purchase.state.request.by.name}がリクエスト</p>
							<p className="italic">{formatMoney(purchase.plannedUsage)}</p>
						</div>
						<Note>{formatDiffDate(purchase.state.request.at, Date.now())}</Note>
					</Distant>
				) : (
					<NoData>購入リクエストがありません。</NoData>
				)}
			</Section>
			{isRequester && (
				<Section>
					<Collapsible>
						<SectionTitle>
							<CollapsibleTrigger asChild>
								<Button variant="outline" className="w-full">
									購入リクエストの操作
								</Button>
							</CollapsibleTrigger>
						</SectionTitle>
						<CollapsibleContent>
							<Form method="post">
								<Aside>
									<Button variant="destructive" name="action" value="cancel" className="grow">
										取り消し
									</Button>
									<Button name="action" value="request" className="grow">
										リクエスト
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

const ActionSchema = z.object({ action: z.enum(["cancel", "request"]) })
export const parseRequestAction = (formData: FormData) => parseWithZod(formData, { schema: ActionSchema })
