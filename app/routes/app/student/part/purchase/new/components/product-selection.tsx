import type { Product } from "@prisma/client"
import { Check } from "lucide-react"
import { useSearchParams } from "react-router"
import { Button } from "~/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { ScrollArea } from "~/components/ui/scroll-area"
import { cn } from "~/lib/utils"
import { useProductSelectStore } from "~/stores/product-select"

export const ProductSelection = ({ products }: { products: Pick<Product, "id" | "name" | "price">[] }) => {
	const productSelectStore = useProductSelectStore()
	const [searchParams, setSearchParams] = useSearchParams()
	const isOpen = Boolean(searchParams.get("form") === "select")
	const close = () => {
		setSearchParams((prev) => {
			prev.delete("form")
			return prev
		})
	}
	const onOpenChange = () => {
		setSearchParams((prev) => {
			if (prev.has("form")) prev.delete("form")
			else prev.set("form", "select")
			return prev
		})
	}
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>商品を選択</DialogTitle>
					<DialogDescription>登録・共有された商品から選択可能です。</DialogDescription>
				</DialogHeader>
				<Command className="w-full border">
					<CommandInput placeholder="商品を選択" className="h-9" autoFocus={false} />
					<ScrollArea>
						<CommandList>
							<CommandEmpty>商品が見つかりません</CommandEmpty>
							<CommandGroup>
								{products.map((product) => (
									<CommandItem
										key={product.id}
										value={product.id}
										onSelect={() => {
											if (productSelectStore.find(product.id)) {
												productSelectStore.remove(product.id)
											} else {
												productSelectStore.add(product, product.id)
											}
										}}
									>
										<div>
											<div className="text-base">{product.name}</div>
											<div className="text-sm text-muted-foreground leading-none">¥{product.price}</div>
										</div>
										<Check className={cn("ml-auto", productSelectStore.find(product.id) ? "opacity-100" : "opacity-0")} />
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</ScrollArea>
				</Command>
				<DialogClose asChild>
					<Button>閉じる</Button>
				</DialogClose>
			</DialogContent>
		</Dialog>
	)
}
