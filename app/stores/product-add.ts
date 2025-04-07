import { create } from "zustand"
import { randomId } from "~/lib/utils"

type ProductInfoType = {
	name: string
	price: number
	description?: string
}

type PurchaseItemType = {
	info: ProductInfoType
	quantity: number
}

type Store = {
	items: Map<string, PurchaseItemType>
	isShared: Set<string>
}

type Action = {
	add: (info: ProductInfoType, isShared: boolean) => Store["items"]
	get: (id: string) => (PurchaseItemType & { isShared: boolean }) | undefined
	getAllAsObject: () => (PurchaseItemType & { id: string; isShared: boolean })[]
	find: (id: string) => boolean
	remove: (id: string) => Store["items"]
	setQuantity: (id: string, quantity: number) => Store["items"]
	increaseQuantity: (id: string) => Store["items"]
	decreaseQuantity: (id: string) => Store["items"]
	clear: () => Store["items"]
	addQuantity: (id: string, quantity: number) => Store["items"]
}

export const useProductAddStore = create<Store & Action>((set, get) => ({
	items: new Map(),
	isShared: new Set(),
	add(info, isShared) {
		const id = randomId()
		const newItems = get().items.set(id, { info, quantity: 1 })
		if (isShared) get().isShared.add(id)
		set({ items: newItems })
		return newItems
	},
	get(id) {
		const item = get().items.get(id)
		if (!item) return undefined
		return { ...item, isShared: get().isShared.has(id) }
	},
	getAllAsObject: () =>
		Array.from(get().items.entries()).map(([id, item]) => ({ ...item, id, isShared: get().isShared.has(id) })),
	find: (id) => get().items.has(id),
	remove(id) {
		const newItems = get().items
		newItems.delete(id)
		set({ items: newItems })
		return newItems
	},
	setQuantity(id, quantity) {
		const item = get().items.get(id)
		if (!item) return get().items
		const newItems = get().items
		const newQuantity = item.quantity + quantity
		if (newQuantity === 0) {
			return get().remove(id)
		}
		newItems.set(id, { ...item, quantity: newQuantity })
		set({ items: newItems })
		return newItems
	},
	addQuantity(id, quantity) {
		const item = get().items.get(id)
		if (!item) return get().items
		const newItems = get().items
		const newQuantity = item.quantity + quantity
		if (newQuantity === 0) {
			return get().remove(id)
		}
		newItems.set(id, { ...item, quantity: newQuantity })
		set({ items: newItems })
		return newItems
	},
	increaseQuantity(id) {
		const newItems = get().addQuantity(id, 1)
		set({ items: newItems })
		return newItems
	},
	decreaseQuantity(id) {
		const newItems = get().addQuantity(id, -1)
		set({ items: newItems })
		return newItems
	},
	clear() {
		const newItems = new Map()
		set({ items: newItems })
		return newItems
	},
}))
