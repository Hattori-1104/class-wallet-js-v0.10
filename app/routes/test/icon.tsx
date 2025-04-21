import { Wallet } from "lucide-react"

export default () => {
	return (
		<div className="p-12 space-y-12 bg-red-500">
			<div className="size-64 rounded-4xl bg-radial-[at_140%_-20%] from-[#002DB3] form-[40%] via-[#00C7EB] via-30% via-[#00FFAE] via-60% to-[#FFCF4A] to-90% flex items-center justify-center">
				<Wallet className="size-48 text-white drop-shadow-xl" strokeWidth={2.5} />
			</div>
			<div className="size-64 bg-[radial-gradient(circle,rgba(0,45,179,1)0%,rgba(0,199,235,1)25%,rgba(0,255,174,1)50%,rgba(110,255,102,1)75%,rgba(255,207,74,1)100%)] flex items-center justify-center"></div>
		</div>
	)
}
