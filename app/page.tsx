"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
	const [userid, setUserid] = useState<string | null>("");

	useEffect(() => {
		const user_id = localStorage.getItem("userid");
		setUserid(user_id);
	}, []);

	if (!userid) {
		return (
			<div className="flex justify-center items-center h-screen">
				<Link
					href={`/login`}
					className="border border-black pr-20 pl-20 pt-10 pb-10 m-3 text-4xl font-bold hover:bg-black hover:text-white"
				>
					Login
				</Link>
			</div>
		);
	}

	return (
		<div className="flex justify-center items-center h-screen">
			<Link
				href={`/dashboard/${userid}`}
				className="border border-black pr-20 pl-20 pt-10 pb-10 m-3 text-4xl font-bold hover:bg-black hover:text-white"
			>
				Dashboard
			</Link>
		</div>
	);
}
