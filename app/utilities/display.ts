export const formatCurrency = (money: number) =>
	money.toLocaleString("ja-JP", { style: "currency", currency: "JPY" }).replace("-￥", "¥ -").replace("￥", "¥ ")

export function formatDiffDate(date: Date, now = new Date()) {
	// 秒数
	const diff = ((now.getTime() - date.getTime()) / 1000) | 0
	if (diff < 60) return "たった今"
	if (diff < 60 * 60) return `${(diff / 60) | 0}分前`
	if (diff < 60 * 60 * 24) return `${(diff / 60 / 60) | 0}時間前`
	if (diff < 60 * 60 * 24 * 2) return "昨日"
	if (diff < 60 * 60 * 24 * 3) return "一昨日"
	// if (diff < 60 * 60 * 24 * 7) return `${(diff / 60 / 60 / 24) | 0}日前`
	return `${date.getMonth() + 1}/${date.getDate()}`
}

export function formatSimpleDate(date: Date) {
	const month = date.getMonth() + 1
	const day = date.getDate()
	return `${month} / ${day}`
}

export function displayPercentage(ratio: number) {
	if (ratio >= 1) return "100%"
	if (0 < ratio && ratio <= 0.01) return "1%"
	return `${(ratio * 100) | 0}%`
} // ファイル名として適切でない文字を置換する関数
export function sanitizeFilename(filename: string): string {
	return filename.replace(/[\\/:*?"<>|]/g, "_")
} // ファイル名用の日時フォーマット関数
export function formatDateTimeForFilename(date: Date): string {
	const year = date.getFullYear()
	const month = (date.getMonth() + 1).toString().padStart(2, "0")
	const day = date.getDate().toString().padStart(2, "0")
	const hours = date.getHours().toString().padStart(2, "0")
	const minutes = date.getMinutes().toString().padStart(2, "0")
	const seconds = date.getSeconds().toString().padStart(2, "0")
	return `${year}${month}${day}_${hours}${minutes}${seconds}`
}
