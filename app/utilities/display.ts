export const formatCurrency = (money: number) =>
	money
		.toLocaleString("ja-JP", { style: "currency", currency: "JPY" })
		.replace("-￥", "¥ -")
		.replace("￥", "¥ ")

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

export function displayPercentage(ratio: number) {
	if (ratio >= 1) return "100%"
	if (0 < ratio && ratio <= 0.01) return "1%"
	return `${(ratio * 100) | 0}%`
}
