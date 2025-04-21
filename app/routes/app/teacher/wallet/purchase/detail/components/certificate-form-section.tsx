import { Form, useSearchParams } from "react-router"
import { Section } from "~/components/common/container"
import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog"

export const CertificateFormSection = () => {
	const [searchParams, setSearchParams] = useSearchParams()
	const formMode = searchParams.get("certificate-form")
	const onOpenChange = () => {
		setSearchParams(
			(prev) => {
				if (prev.has("certificate-form")) prev.delete("certificate-form")
				return prev
			},
			{ replace: true },
		)
	}
	const close = () => {
		setSearchParams(
			(prev) => {
				prev.delete("certificate-form")
				return prev
			},
			{ replace: true },
		)
	}
	return (
		<Section>
			<Form className="flex flex-row gap-4 w-full" replace>
				<Button variant={"destructive"} className="grow" name="certificate-form" value="refuse">
					拒否する
				</Button>
				<Button variant={"default"} className="grow" name="certificate-form" value="approve">
					承認する
				</Button>
			</Form>
			<Dialog open={formMode === "refuse"} onOpenChange={onOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>本当に拒否しますか？</DialogTitle>
						<DialogDescription>証明書が発行されます。</DialogDescription>
					</DialogHeader>
					<Form method={"POST"} className="w-full flex flex-row gap-4" replace>
						<Button variant={"outline"} className="grow" type="button" onClick={() => close()}>
							キャンセル
						</Button>
						<Button variant={"destructive"} className="grow" name="action" value="refuse">
							拒否する
						</Button>
					</Form>
				</DialogContent>
			</Dialog>
			<Dialog open={formMode === "approve"} onOpenChange={onOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>本当に承認しますか？</DialogTitle>
						<DialogDescription>証明書が発行されます。</DialogDescription>
					</DialogHeader>
					<Form method={"POST"} className="w-full flex flex-row gap-4">
						<Button variant={"outline"} className="grow" type="button" onClick={() => close()}>
							キャンセル
						</Button>
						<Button variant={"default"} className="grow" name="action" value="approve">
							承認する
						</Button>
					</Form>
				</DialogContent>
			</Dialog>
		</Section>
	)
}
