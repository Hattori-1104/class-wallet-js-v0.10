import { Section, SectionTitle } from "~/components/common/container"
import { prisma } from "~/services/repository.server"
import { createErrorRedirect, requireSession, verifyStudent } from "~/services/session.server"
import type { Route } from "./+types/purchase-summary"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"

import { ArrowDownToLine } from "lucide-react"
import { useNavigate } from "react-router"
import { Aside, Distant } from "~/components/common/placement"
import { Button } from "~/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"

export const loader = async ({ request, params: { partId } }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	await verifyStudent(session)
	const errorRedirect = createErrorRedirect(session, `/app/student/part/${partId}`)
	const url = new URL(request.url)
	const displayPartId = url.searchParams.get("partId")
	if (!displayPartId || displayPartId === "all") {
		const wallet = await prisma.wallet
			.findFirstOrThrow({
				where: { parts: { some: { id: partId } } },
				select: {
					id: true,
					name: true,
					budget: true,
					parts: {
						select: {
							id: true,
							name: true,
							purchases: {
								select: {
									id: true,
									label: true,
									part: {
										select: {
											id: true,
											name: true,
										},
									},
									state: {
										select: {
											usageReport: {
												select: {
													at: true,
													id: true,
													actualUsage: true,
												},
											},
											receiptSubmission: {
												select: {
													at: true,
													id: true,
													receiptIndex: true,
												},
											},
										},
									},
								},
								where: {
									state: {
										receiptSubmission: { isNot: null },
										usageReport: { isNot: null },
									},
								},
							},
						},
						where: { isBazaar: false },
					},
				},
			})
			.catch(errorRedirect("購入情報の取得に失敗しました。").catch())

		const purchases = wallet.parts
			.flatMap((part) => part.purchases)
			.sort((a, b) => a.state.receiptSubmission!.receiptIndex - b.state.receiptSubmission!.receiptIndex)
		return {
			name: wallet.name,
			partId: displayPartId ?? partId,
			parts: wallet.parts.map((part) => ({ id: part.id, name: part.name })),
			budget: wallet.budget,
			purchases,
		}
	}
	const part = await prisma.part
		.findUniqueOrThrow({
			where: { id: displayPartId ?? partId },
			select: {
				id: true,
				name: true,
				budget: true,
				wallet: {
					select: {
						id: true,
						name: true,
						budget: true,
						parts: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
				purchases: {
					select: {
						id: true,
						label: true,
						part: {
							select: {
								id: true,
								name: true,
							},
						},
						state: {
							select: {
								usageReport: {
									select: {
										at: true,
										id: true,
										actualUsage: true,
									},
								},
								receiptSubmission: {
									select: {
										at: true,
										id: true,
										receiptIndex: true,
									},
								},
							},
						},
					},
					where: {
						state: {
							receiptSubmission: { isNot: null },
							usageReport: { isNot: null },
						},
					},
				},
			},
		})
		.catch(errorRedirect("購入情報の取得に失敗しました。").catch())
	return {
		name: part.name,
		partId: part.id,
		parts: part.wallet.parts.map((part) => ({ id: part.id, name: part.name })),
		budget: part.budget,
		purchases: part.purchases,
	}
}

export default ({ loaderData: { name, partId, parts, budget, purchases } }: Route.ComponentProps) => {
	const sums: number[] = []
	for (const purchase of purchases) {
		if (sums.length === 0) {
			sums.push(purchase.state.usageReport!.actualUsage)
			continue
		}
		sums.push(sums[sums.length - 1] + purchase.state.usageReport!.actualUsage)
	}
	const navigate = useNavigate()
	const handleDisplayChange = (value: string) => {
		navigate(`/app/student/part/${partId}/purchase/?partId=${value}`, { replace: true })
	}
	const handleDownload = () => {
		const csv = [
			["No.", "日付", "項目", "収入", "支出", "残高", "支出区分"].join(","),
			["", "", "", budget, "", budget, ""],
			...purchases.map(
				(purchase, index) =>
					`${purchase.state.receiptSubmission!.receiptIndex},${purchase.state.receiptSubmission!.at.toLocaleDateString(
						"ja-JP",
						{
							month: "numeric",
							day: "numeric",
						},
					)},${purchase.label},,${purchase.state.usageReport!.actualUsage},${budget - sums[index]},${purchase.part.name}`,
			),
		].join("\n")
		const blob = new Blob([csv], { type: "text/csv" })
		const url = URL.createObjectURL(blob)
		const a = document.createElement("a")
		a.href = url
		a.download = `出納簿_${new Date(Date.now())
			.toLocaleDateString("ja-JP", {
				year: "numeric",
				month: "numeric",
				day: "numeric",
				hour: "numeric",
				minute: "numeric",
			})
			.replaceAll("/", "-")}_${name}.csv`
		a.click()
		URL.revokeObjectURL(url)
	}
	return (
		<Section>
			<SectionTitle>
				<Distant>
					<Select onValueChange={handleDisplayChange} defaultValue="all">
						<SelectTrigger>
							<SelectValue placeholder="パートを選択" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">全て</SelectItem>
							{parts.map((part) => (
								<SelectItem key={part.id} value={part.id}>
									{part.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button variant="outline" onClick={handleDownload}>
						<ArrowDownToLine />
						CSVでダウンロード
					</Button>
				</Distant>
			</SectionTitle>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="text-center">No.</TableHead>
						<TableHead className="text-center">日付</TableHead>
						<TableHead className="text-center">項目</TableHead>
						<TableHead className="text-center">収入</TableHead>
						<TableHead className="text-center">支出</TableHead>
						<TableHead className="text-center">残高</TableHead>
						<TableHead className="text-center">支出区分</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow>
						<TableCell colSpan={3} />
						<TableCell className="text-right">{budget}</TableCell>
						<TableCell colSpan={1} />
						<TableCell className="text-right">{budget}</TableCell>
					</TableRow>
					{purchases.map((purchase, index) => (
						<TableRow key={purchase.id}>
							<TableCell className="text-center">{purchase.state.receiptSubmission!.receiptIndex}</TableCell>
							<TableCell className="text-center">
								{purchase.state.receiptSubmission!.at.toLocaleDateString("ja-JP", {
									month: "numeric",
									day: "numeric",
								})}
							</TableCell>
							<TableCell>{purchase.label}</TableCell>
							<TableCell className="text-right">{purchase.state.usageReport!.actualUsage}</TableCell>
							<TableCell className="text-right">{purchase.state.usageReport!.actualUsage}</TableCell>
							<TableCell className="text-right">{budget - sums[index]}</TableCell>
							<TableCell className="text-center">{purchase.part.name}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</Section>
	)
}
