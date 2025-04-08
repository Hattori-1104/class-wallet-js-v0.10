import type { StudentCertification, TeacherCertification } from "@prisma/client"
import { Check, Minus, Signature, X } from "lucide-react"

import { cn } from "~/lib/utils"
import { formatDiffDate } from "~/utilities/display"

type CertificationProps = {
	certification:
		| (Omit<StudentCertification | TeacherCertification, "signedById"> & {
				signedBy: { id: string; name: string }
		  })
		| null
	message: string
}

export const Certification = ({ certification, message }: CertificationProps) => {
	return certification ? (
		<div
			className={cn(
				"border-4 border rounded-md px-4 py-2",
				certification.approved ? "border-sky-500" : "border-destructive",
			)}
		>
			<div className="flex flex-row gap-4 items-center">
				{certification.approved ? <Check className="text-sky-500" /> : <X className="text-destructive" />}
				<div className="grow">
					<h1>
						<Signature size={16} className="inline" />
						<span className="ml-1">{certification.signedBy.name}</span>
					</h1>
					<p className="italic text-xs text-muted-foreground">{message}</p>
				</div>
				<span className="shrink-0 text-sm text-muted-foreground">
					{formatDiffDate(certification.createdAt, Date.now())}
				</span>
			</div>
		</div>
	) : (
		<div className="border rounded-md px-4 py-2">
			<div className="flex flex-row gap-4 items-center">
				<Minus className="text-muted-foreground" />
				<div>
					<span className="text-muted-foreground italic">未承認</span>
					<p className="italic text-xs text-muted-foreground">{message}</p>
				</div>
			</div>
		</div>
	)
}
