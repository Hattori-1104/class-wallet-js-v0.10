import type { ReactNode } from "react"
import { Distant } from "../common/placement"

export const UserItem = ({ name, children }: { name: string; children?: ReactNode }) => {
	return (
		<Distant>
			<span>{name}</span>
			{children && <div className="flex flex-row gap-2">{children}</div>}
		</Distant>
	)
}
