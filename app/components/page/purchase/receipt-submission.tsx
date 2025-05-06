import type { Prisma } from "@prisma/client"
import { Form } from "react-router"
import { Section, SectionTitle } from "~/components/common/container"
import { NoData, Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible"

type Purchase = Prisma.PurchaseGetPayload<{
	select: {
		state: {
			select: {
				receiptSubmission: {
					select: {
						receiptIndex: true
						at: true
					}
				}
			}
		}
	}
}>

export const ReceiptSubmission = ({ isRequester, purchase }: { isRequester: boolean; purchase: Purchase }) => {
	const receiptIndex = purchase.state.receiptSubmission?.receiptIndex ?? null
	return (
		<>
			<Section>
				<SectionTitle>
					<Title>レシート提出</Title>
				</SectionTitle>
				{receiptIndex ? (
					<div className="flex flex-col justify-center items-center gap-2">
						<div>レシート番号</div>
						<h1 className="block text-4xl font-bold">{receiptIndex}</h1>
					</div>
				) : (
					<NoData>提出が完了していません。</NoData>
				)}
			</Section>
			{isRequester && receiptIndex === null && (
				<Section>
					<Collapsible>
						<SectionTitle>
							<CollapsibleTrigger asChild>
								<Button variant="outline" className="w-full">
									レシート提出
								</Button>
							</CollapsibleTrigger>
						</SectionTitle>
						<CollapsibleContent>
							<Form method="post">
								<Button type="submit" className="w-full" name="submit" value="submit">
									提出
								</Button>
							</Form>
						</CollapsibleContent>
					</Collapsible>
				</Section>
			)}
		</>
	)
}
