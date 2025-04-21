import type { ReactNode } from "react"
import { useSearchParams } from "react-router"
import { Form } from "react-router"
import { Section } from "~/components/common/container"
import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { ScrollArea } from "~/components/ui/scroll-area"

export const CertificationSection = ({ children }: { children: ReactNode }) => {
	const [searchParams, setSearchParams] = useSearchParams()
	const isOpen = Boolean(searchParams.has("certification-dialog"))
	const onOpenChange = () => {
		setSearchParams(
			(prev) => {
				if (prev.has("certification-dialog")) prev.delete("certification-dialog")
				else prev.set("certification-dialog", "true")
				return prev
			},
			{ replace: true },
		)
	}
	return (
		<Section>
			<Form className="w-full" replace>
				<Button name={"certification-dialog"} value="true" variant={"secondary"} className="w-full text-center">
					証明書を確認する
				</Button>
			</Form>
			<Dialog open={isOpen} onOpenChange={onOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>証明書</DialogTitle>
						<DialogDescription>購入を完了するにはすべての証明書が必要です。</DialogDescription>
					</DialogHeader>
					<ScrollArea>{children}</ScrollArea>
				</DialogContent>
			</Dialog>
		</Section>
	)
}
