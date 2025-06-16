import type { Prisma } from "@prisma/client"
import { Pencil } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { formatCurrency, formatSimpleDate } from "~/utilities/display"

export const PurchaseRecordableWhereQuery = {
	completion: {
		isNot: null,
	},
	receiptSubmission: {
		isNot: null,
	},
} satisfies Prisma.PurchaseWhereInput

export const PurchaseRecordableSelectQuery: Prisma.PurchaseSelect = {
	id: true,
	label: true,
	description: true,
	plannedUsage: true,
	updatedAt: true,
	requestedAt: true,
	requestedById: true,
	canceled: true,
	partId: true,
	completion: {
		select: {
			actualUsage: true,
		},
	},
	receiptSubmission: {
		select: {
			receiptIndex: true,
			at: true,
		},
	},
	part: {
		select: {
			name: true,
			budget: true,
		},
	},
} satisfies Prisma.PurchaseSelect

export const PurchaseRecordableOrderByQuery = {
	receiptSubmission: {
		receiptIndex: "asc",
	},
} satisfies Prisma.PurchaseOrderByWithRelationInput

export type PurchaseRecordable = Prisma.PurchaseGetPayload<{
	select: typeof PurchaseRecordableSelectQuery
}>

type CashBookTableProps = {
	filteredPurchases: PurchaseRecordable[]
	budget: number
	reserved?: number
	onEdit?: (purchaseId: string | null) => void
}

// interface CashBookTabelProps {
// 	purchases: PurchaseRecordable[]
// 	filteredParts: { id: string; name: string; budget: number }[]
// 	wallet: { id: string; name: string } | null
// 	reserved?: number
// }

// interface CashBookFilterProps {
// 	parts: { id: string; name: string }[]
// 	filter: string[]
// }

// // 出納簿データの行の型定義（生データ）
// interface CashBookRow {
// 	no: string | number | null
// 	date: Date | null
// 	item: string
// 	income: number | null
// 	expense: number | null
// 	category: string
// 	balance: number
// }

type CashBookRow = {
	_purchaseId?: string
	receiptIndex?: number
	date?: Date
	label: string
	income?: number
	expense?: number
	balance: number
	part?: string
}

// // 出納簿データを配列形式で生成する関数（生データ）
// function _createCashBookData(
// 	purchases: PurchaseRecordable[],
// 	filteredParts: { id: string; name: string; budget: number }[],
// 	reserved = 0,
// ): CashBookRow[] {
// 	const totalBudget = filteredParts.reduce((sum, part) => sum + part.budget, 0) + reserved
// 	const data: CashBookRow[] = []
// 	let currentBalance = 0

// 	// 予算収入行を追加
// 	if (totalBudget > 0) {
// 		currentBalance += totalBudget
// 		data.push({
// 			no: null,
// 			date: null,
// 			item: reserved > 0 ? "予算（予備費込み）" : "予備費",
// 			income: totalBudget,
// 			expense: null,
// 			category: "",
// 			balance: currentBalance,
// 		})
// 	}

// 	// 購入記録行を追加

// 	for (const purchase of purchases.sort(
// 		(a, b) => (a.receiptSubmission?.receiptIndex ?? 0) - (b.receiptSubmission?.receiptIndex ?? 0),
// 	)) {
// 		const expense = purchase.completion?.actualUsage || 0
// 		currentBalance -= expense

// 		data.push({
// 			no: purchase.receiptSubmission?.receiptIndex || null,
// 			date: purchase.receiptSubmission?.at || null,
// 			item: purchase.label,
// 			income: null,
// 			expense: expense || null,
// 			category: purchase.part.name,
// 			balance: currentBalance,
// 		})
// 	}

// 	return data
// }

function createCashBookData(purchases: PurchaseRecordable[], budget: number, reserved = 0) {
	const data: CashBookRow[] = []
	let currentBalance = 0
	if (budget > 0) {
		currentBalance += budget + reserved
		data.push({
			label: reserved > 0 ? "予算（予備費込み）" : "予算",
			income: budget + reserved,
			balance: currentBalance,
		})
	}

	for (const purchase of purchases) {
		if (purchase.completion?.actualUsage === undefined || purchase.receiptSubmission?.receiptIndex === undefined)
			continue
		const expense = purchase.completion.actualUsage
		currentBalance -= expense
		data.push({
			_purchaseId: purchase.id,
			receiptIndex: purchase.receiptSubmission.receiptIndex,
			date: purchase.receiptSubmission.at,
			label: purchase.label,
			expense,
			balance: currentBalance,
			part: purchase.part.name,
		})
	}

	return data
}

// 動的なファイル名を生成する関数
// function generateCsvFilename(
// 	filteredParts: { id: string; name: string; budget: number }[],
// 	wallet: { id: string; name: string } | null,
// ): string {
// 	const now = new Date()
// 	const dateTimeStr = formatDateTimeForFilename(now)

// 	// ウォレット名とパート名を取得してファイル名に含める
// 	let baseFilename = "出納簿"

// 	// ウォレット名を追加
// 	if (wallet?.name) {
// 		baseFilename = `出納簿_${wallet.name}`
// 	}

// 	if (filteredParts.length > 0) {
// 		const partNames = filteredParts.map((part) => part.name).join("_")
// 		baseFilename = `${baseFilename}_${partNames}_${dateTimeStr}`
// 	} else {
// 		baseFilename = `${baseFilename}_${dateTimeStr}`
// 	}

// 	return sanitizeFilename(`${baseFilename}.csv`)
// }
// function convertToCSV(data: CashBookRow[]): string {
// 	const headers = ["No.", "日付", "項目", "収入", "支出", "残高", "支出区分"]
// 	const csvContent = [
// 		headers.join(","),
// 		...data.map((row) =>
// 			[
// 				row.receiptIndex ?? "",
// 				row.date ? formatSimpleDate(row.date) : "",
// 				row.label,
// 				row.income ?? "",
// 				row.expense ?? "",
// 				row.balance,
// 				row.part ?? "",
// 			].join(","),
// 		),
// 	].join("\n")

// 	return csvContent
// }

// CSVダウンロード機能
// function downloadCSV(
// 	data: CashBookRow[],
// 	filteredParts: { id: string; name: string; budget: number }[],
// 	wallet: { id: string; name: string } | null,
// ): void {
// 	const csvContent = convertToCSV(data)
// 	const filename = generateCsvFilename(filteredParts, wallet)
// 	const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
// 	const link = document.createElement("a")
// 	const url = URL.createObjectURL(blob)

// 	link.setAttribute("href", url)
// 	link.setAttribute("download", filename)
// 	link.style.visibility = "hidden"
// 	document.body.appendChild(link)
// 	link.click()
// 	document.body.removeChild(link)
// }

export function CashBookTable({ filteredPurchases, budget, reserved = 0, onEdit }: CashBookTableProps) {
	// 生データの配列を作成
	const cashBookData = createCashBookData(filteredPurchases, budget, reserved)

	return (
		<Table>
			<TableHeader>
				<TableRow>
					{onEdit && <TableHead colSpan={1} />}

					<TableHead className="text-right">No.</TableHead>
					<TableHead className="text-center">日付</TableHead>
					<TableHead className="text-left">項目</TableHead>
					<TableHead className="text-right">収入</TableHead>
					<TableHead className="text-right">支出</TableHead>
					<TableHead className="text-right">残高</TableHead>
					<TableHead className="text-center">支出区分</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{cashBookData.map((row, index) => (
					<TableRow key={index}>
						{onEdit && (
							<TableCell>
								<Button size="sm" variant="ghost" onClick={() => onEdit(row._purchaseId ?? null)}>
									<Pencil />
								</Button>
							</TableCell>
						)}

						<TableCell className="text-right">{row.receiptIndex ?? "-"}</TableCell>
						<TableCell className="text-center">{row.date ? formatSimpleDate(row.date) : "-"}</TableCell>
						<TableCell className="text-left">{row.label}</TableCell>
						<TableCell className="text-right">{row.income ? formatCurrency(row.income) : "-"}</TableCell>
						<TableCell className="text-right">{row.expense ? formatCurrency(row.expense) : "-"}</TableCell>
						<TableCell className="text-right">{formatCurrency(row.balance)}</TableCell>
						<TableCell className="text-center">{row.part ?? "-"}</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}
