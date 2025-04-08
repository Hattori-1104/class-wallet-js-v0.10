export const formatMoney = (money: number) =>
	money.toLocaleString("ja-JP", { style: "currency", currency: "JPY" }).replace("￥", "¥ ")

export const formatDiffDate = (date: Date, now: ReturnType<typeof Date.now>) => {
	const diff = ((now - date.getTime()) / 1000) | 0
	if (diff < 60) return "たった今"
	if (diff < 60 * 60) return `${(diff / 60) | 0}分前`
	if (diff < 60 * 60 * 24) return `${(diff / 60 / 60) | 0}時間前`
	if (diff < 60 * 60 * 24 * 2) return "昨日"
	if (diff < 60 * 60 * 24 * 3) return "一昨日"
	if (diff < 60 * 60 * 24 * 7) return `${(diff / 60 / 60 / 24) | 0}日前`
	return `${date.getMonth}/${date.getDate}`
}

export const displayPercent = (numerator: number, denominator: number) => {
	if (denominator === 0) return "0%"
	if (denominator === numerator) return "100%"
	return `${Math.floor((numerator / denominator) * 100)}%`
}
