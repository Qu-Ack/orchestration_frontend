"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		if (!username || !password) {
			setError("Username and password are required");
			return;
		}

		setError("");
		setIsLoading(true);

		try {
			const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					username,
					password,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Login failed");
			}

			const data = await response.json();
			console.log(data);
			localStorage.setItem("session", data.sesid);
			router.push(`/dashboard/${data.userid}`);
		} catch (err: any) {
			setError(err.error || "Failed to login. Please try again.");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="h-screen w-screen flex justify-center items-center">
			<form
				className="flex flex-col p-3 m-3 border border-black"
				onSubmit={handleLogin}
			>
				{error && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
						{error}
					</div>
				)}

				<input
					type="text"
					name="username"
					id="username"
					placeholder="Username"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					className="p-3 m-3 border border-black"
					disabled={isLoading}
				/>

				<input
					type={showPassword ? "text" : "password"}
					name="password"
					id="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="*********"
					className="p-3 m-3 border border-black"
					disabled={isLoading}
				/>

				<div className="flex items-center justify-start m-3">
					<label htmlFor="showpassword" className="mr-2">
						Show Password
					</label>
					<input
						type="checkbox"
						id="showpassword"
						name="showpassword"
						onChange={() => setShowPassword(!showPassword)}
						disabled={isLoading}
					/>
				</div>

				<button
					type="submit"
					className={`p-3 mt-3 ml-3 mr-3 font-bold ${
						isLoading
							? "bg-gray-300 cursor-not-allowed"
							: "hover:bg-black hover:text-white hover:cursor-pointer"
					}`}
					disabled={isLoading}
				>
					{isLoading ? "Logging in..." : "Login"}
				</button>

				<Link
					href="/register"
					className="p-3 text-blue-900 hover:text-blue-600"
				>
					Register
				</Link>
			</form>
		</div>
	);
}
