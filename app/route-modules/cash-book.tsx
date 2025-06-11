import type { Prisma } from "@prisma/client"
import { Download } from "lucide-react"
import type { ChangeEvent } from "react"
import { Form, useSubmit } from "react-router"
import { Distant } from "~/components/common/placement"
import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import { Label } from "~/components/ui/label"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table"
import { formatCurrency } from "~/utilities/display"

export const PurchaseRecordableWhereQuery: Prisma.PurchaseWhereInput = {
	completion: {
		isNot: null,
	},
	receiptSubmission: {
		isNot: null,
	},
}

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
}

export const PurchaseRecordableOrderByQuery: Prisma.PurchaseOrderByWithRelationInput =
	{
		receiptSubmission: {
			receiptIndex: "asc",
		},
	}

type PurchaseRecordable = Prisma.PurchaseGetPayload<{
	select: typeof PurchaseRecordableSelectQuery
}>

interface CashBookTabelProps {
	purchases: PurchaseRecordable[]
	filteredParts: { id: string; name: string; budget: number }[]
	wallet: { id: string; name: string } | null
}

interface CashBookFilterProps {
	parts: { id: string; name: string }[]
	filter: string[]
}

// 出納簿データの行の型定義（生データ）
interface CashBookRow {
	no: string | number | null
	date: Date | null
	item: string
	income: number | null
	expense: number | null
	category: string
	balance: number
}

// 日付をm/d形式でフォーマットする関数（ゼロフィルなし）
function formatDateSimple(date: Date): string {
	const month = date.getMonth() + 1
	const day = date.getDate()
	return `${month}/${day}`
}

// 日付をmm/dd形式でフォーマットする関数（表示用、ゼロフィル付き）
function formatDateDisplay(date: Date): string {
	const month = (date.getMonth() + 1).toString().padStart(2, "0")
	const day = date.getDate().toString().padStart(2, "0")
	return `${month}/${day}`
}

// 出納簿データを配列形式で生成する関数（生データ）
function createCashBookData(
	purchases: PurchaseRecordable[],
	filteredParts: { id: string; name: string; budget: number }[],
): CashBookRow[] {
	const totalBudget = filteredParts.reduce((sum, part) => sum + part.budget, 0)
	const data: CashBookRow[] = []
	let currentBalance = 0

	// 予算収入行を追加
	if (totalBudget > 0) {
		currentBalance += totalBudget
		data.push({
			no: null,
			date: null,
			item: "予算",
			income: totalBudget,
			expense: null,
			category: "",
			balance: currentBalance,
		})
	}

	// 購入記録行を追加
	for (const purchase of purchases) {
		const expense = purchase.completion?.actualUsage || 0
		currentBalance -= expense

		data.push({
			no: purchase.receiptSubmission?.receiptIndex || null,
			date: purchase.receiptSubmission?.at || null,
			item: purchase.label,
			income: null,
			expense: expense || null,
			category: purchase.part.name,
			balance: currentBalance,
		})
	}

	return data
}

// ファイル名用の日時フォーマット関数
function formatDateTimeForFilename(date: Date): string {
	const year = date.getFullYear()
	const month = (date.getMonth() + 1).toString().padStart(2, "0")
	const day = date.getDate().toString().padStart(2, "0")
	const hours = date.getHours().toString().padStart(2, "0")
	const minutes = date.getMinutes().toString().padStart(2, "0")
	const seconds = date.getSeconds().toString().padStart(2, "0")
	return `${year}${month}${day}_${hours}${minutes}${seconds}`
}

// ファイル名として適切でない文字を置換する関数
function sanitizeFilename(filename: string): string {
	return filename.replace(/[\\/:*?"<>|]/g, "_")
}

// 動的なファイル名を生成する関数
function generateCsvFilename(
	filteredParts: { id: string; name: string; budget: number }[],
	wallet: { id: string; name: string } | null,
): string {
	const now = new Date()
	const dateTimeStr = formatDateTimeForFilename(now)

	// ウォレット名とパート名を取得してファイル名に含める
	let baseFilename = "出納簿"

	// ウォレット名を追加
	if (wallet?.name) {
		baseFilename = `出納簿_${wallet.name}`
	}

	if (filteredParts.length > 0) {
		const partNames = filteredParts.map((part) => part.name).join("_")
		baseFilename = `${baseFilename}_${partNames}_${dateTimeStr}`
	} else {
		baseFilename = `${baseFilename}_${dateTimeStr}`
	}

	return sanitizeFilename(`${baseFilename}.csv`)
}

// CSV形式に変換する関数（生データ用）
function convertToCSV(data: CashBookRow[]): string {
	const headers = ["No.", "日付", "項目", "収入", "残高", "支出", "支出区分"]
	const csvContent = [
		headers.join(","),
		...data.map((row) =>
			[
				row.no ?? "",
				row.date ? formatDateSimple(row.date) : "",
				row.item,
				row.income ?? "",
				row.balance,
				row.expense ?? "",
				row.category,
			].join(","),
		),
	].join("\n")

	return csvContent
}

// CSVダウンロード機能
function downloadCSV(
	data: CashBookRow[],
	filteredParts: { id: string; name: string; budget: number }[],
	wallet: { id: string; name: string } | null,
): void {
	const csvContent = convertToCSV(data)
	const filename = generateCsvFilename(filteredParts, wallet)
	const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
	const link = document.createElement("a")
	const url = URL.createObjectURL(blob)

	link.setAttribute("href", url)
	link.setAttribute("download", filename)
	link.style.visibility = "hidden"
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
}

export function CashBookFilter({ parts, filter }: CashBookFilterProps) {
	const submit = useSubmit()

	const handleFilterChange = (event: ChangeEvent<HTMLFormElement>) => {
		const formData = new FormData(event.currentTarget)
		submit(formData, { method: "get" })
	}

	return (
		<Form onChange={handleFilterChange}>
			<Distant>
				<div className="flex flex-wrap gap-2">
					{parts.map((part) => (
						<div key={part.id} className="inline-flex items-center h-8">
							<Checkbox
								id={part.id}
								name="filter"
								value={part.id}
								defaultChecked={filter.includes(part.id)}
							/>
							<Label className="px-2" htmlFor={part.id}>
								{part.name}
							</Label>
						</div>
					))}
				</div>
			</Distant>
		</Form>
	)
}

export function CashBookTabel({
	purchases,
	filteredParts,
	wallet,
}: CashBookTabelProps) {
	// 生データの配列を作成
	const cashBookData = createCashBookData(purchases, filteredParts)

	const handleCSVDownload = () => {
		downloadCSV(cashBookData, filteredParts, wallet)
	}

	return (
		<div className="space-y-4">
			<Button onClick={handleCSVDownload} variant="outline">
				<Download className="h-4 w-4 mr-2" />
				CSV出力
			</Button>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="text-right">No.</TableHead>
						<TableHead>日付</TableHead>
						<TableHead>項目</TableHead>
						<TableHead className="text-right">収入</TableHead>
						<TableHead className="text-right">残高</TableHead>
						<TableHead className="text-right">支出</TableHead>
						<TableHead className="text-center">支出区分</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{cashBookData.map((row, index) => (
						<TableRow key={index}>
							<TableCell className="text-right">{row.no ?? "-"}</TableCell>
							<TableCell>
								{row.date ? formatDateDisplay(row.date) : "-"}
							</TableCell>
							<TableCell>{row.item}</TableCell>
							<TableCell className="text-right">
								{row.income ? formatCurrency(row.income) : "-"}
							</TableCell>
							<TableCell className="text-right">
								{formatCurrency(row.balance)}
							</TableCell>
							<TableCell className="text-right">
								{row.expense ? formatCurrency(row.expense) : "-"}
							</TableCell>
							<TableCell className="text-center">
								{row.category || "-"}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}
