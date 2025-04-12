"use client";
import { useEffect, useState } from "react";
import { Deployment, EnvVar } from "@/services/types/deployment";
import Link from "next/link";

export default function DashboardPage({
	params,
}: {
	params: Promise<{ userid: string }>;
}) {
	const [userid, setUserid] = useState("");
	const [cloneurl, setCloneurl] = useState("");
	const [port, setPort] = useState(0);
	const [branch, setBranch] = useState("");
	const [repoName, setRepoName] = useState("");
	const [subdomain, setSubDomain] = useState("");
	const [envVars, setEnvVars] = useState<EnvVar[]>([]);
	const [newEnvKey, setNewEnvKey] = useState("");
	const [newEnvValue, setNewEnvValue] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [deploying, setDeploying] = useState(false);
	const [error, setError] = useState("");
	const [deployments, setDeployments] = useState<Deployment[]>([]);

	useEffect(() => {
		async function getDeployments() {
			const user_id = (await params).userid;
			setUserid(user_id);

			try {
				const response = await fetch(
					`${process.env.NEXT_PUBLIC_API_URL}/deployments/${user_id}`,
					{
						headers: {
							Authorization: localStorage.getItem("session")!,
						},
					},
				);

				const data = await response.json();
				setDeployments(data.deployments);
				console.log(data);
			} catch (err) {
				console.log(err);
			}
		}
		getDeployments();
	}, []);

	const addEnvVar = () => {
		if (!newEnvKey.trim()) {
			setError("Environment variable key cannot be empty");
			return;
		}

		setEnvVars([...envVars, { Key: newEnvKey, Value: newEnvValue }]);
		setNewEnvKey("");
		setNewEnvValue("");
		setError("");
	};

	const removeEnvVar = (index: number) => {
		const updatedEnvVars = [...envVars];
		updatedEnvVars.splice(index, 1);
		setEnvVars(updatedEnvVars);
	};

	async function handleDeploy(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setIsLoading(true);
		setError("");
		setDeploying(true);

		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/deploy`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: localStorage.getItem("session")!,
					},
					body: JSON.stringify({
						clone_url: cloneurl,
						repo_name: repoName,
						branch: branch,
						subdomain: subdomain,
						port: port,
						envs: envVars,
					}),
				},
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || "Deployment failed");
			}

			const user_id = userid;
			const deployResponse = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/deployments/${user_id}`,
				{
					headers: {
						Authorization: localStorage.getItem("session")!,
					},
				},
			);

			const deployData = await deployResponse.json();
			setDeployments(deployData);
			setDeploying(false);
			setCloneurl("");
			setPort(0);
			setBranch("");
			setRepoName("");
			setSubDomain("");
			setEnvVars([]);
		} catch (err) {
			if (err instanceof Error) {
				setError(err.message);
			} else {
				setError("Failed to create deployment");
			}
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="min-h-screen bg-white text-black">
			<div className="p-6 max-w-7xl mx-auto">
				<h1 className="text-4xl font-bold mb-8 border-b border-black pb-2">
					{userid}'s Dashboard
				</h1>

				<div className="flex justify-center mb-12">
					<form
						className="p-6 w-full max-w-3xl border border-black rounded shadow-md bg-white"
						onSubmit={handleDeploy}
					>
						<h2 className="text-3xl font-bold mb-8 text-center">
							New Deployment
						</h2>

						{error && (
							<div className="bg-white border-2 border-black text-black px-4 py-3 rounded mb-6 w-full">
								<p className="font-bold">Error:</p> {error}
							</div>
						)}

						<div className="flex flex-col md:flex-row w-full gap-4 mb-4">
							<input
								type="text"
								name="cloneurl"
								id="cloneurl"
								placeholder="Clone URL"
								value={cloneurl}
								onChange={(e) => setCloneurl(e.target.value)}
								className="p-3 border-2 border-black rounded w-full md:w-2/3 focus:outline-none focus:ring-2 focus:ring-black"
								disabled={isLoading}
							/>
							<input
								type="number"
								name="port"
								id="port"
								placeholder="Port Number"
								value={port || ""}
								onChange={(e) => setPort(Number(e.target.value))}
								className="p-3 border-2 border-black rounded w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-black"
								disabled={isLoading}
							/>
						</div>

						<div className="flex flex-col md:flex-row w-full gap-4 mb-8">
							<input
								type="text"
								name="branch"
								id="branch"
								className="p-3 border-2 border-black rounded w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-black"
								value={branch}
								onChange={(e) => setBranch(e.target.value)}
								placeholder="refs/head/main"
								disabled={isLoading}
							/>
							<input
								type="text"
								name="repo_name"
								id="repo_name"
								className="p-3 border-2 border-black rounded w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-black"
								value={repoName}
								onChange={(e) => setRepoName(e.target.value)}
								placeholder="Qu-Ack/Reponame"
								disabled={isLoading}
							/>
							<input
								type="text"
								name="subdomain"
								value={subdomain}
								onChange={(e) => setSubDomain(e.target.value)}
								id="subdomain"
								className="p-3 border-2 border-black rounded w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-black"
								placeholder="subdomain.example.com"
								disabled={isLoading}
							/>
						</div>

						<div className="w-full mb-6">
							<h3 className="text-xl font-semibold mb-4 border-b border-gray-200 pb-2">
								Environment Variables
							</h3>

							{envVars.length > 0 && (
								<div className="border-2 border-black rounded p-4 mb-4 max-h-60 overflow-y-auto">
									{envVars.map((env, index) => (
										<div
											key={index}
											className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100"
										>
											<div className="flex items-center">
												<span className="font-mono bg-gray-100 px-2 py-1 rounded">
													{env.Key}
												</span>
												<span className="mx-2">=</span>
												<span className="font-mono bg-gray-100 px-2 py-1 rounded">
													{env.Value}
												</span>
											</div>
											<button
												type="button"
												onClick={() => removeEnvVar(index)}
												className="border-2 border-black text-black px-3 py-1 rounded hover:bg-black hover:text-white transition-colors"
												disabled={isLoading}
											>
												Remove
											</button>
										</div>
									))}
								</div>
							)}

							<div className="flex flex-wrap md:flex-nowrap gap-2 mb-2">
								<input
									type="text"
									placeholder="ENV_KEY"
									value={newEnvKey}
									onChange={(e) => setNewEnvKey(e.target.value)}
									className="p-3 border-2 border-black rounded w-full md:w-2/5 font-mono focus:outline-none focus:ring-2 focus:ring-black"
									disabled={isLoading}
								/>
								<input
									type="text"
									placeholder="value"
									value={newEnvValue}
									onChange={(e) => setNewEnvValue(e.target.value)}
									className="p-3 border-2 border-black rounded w-full md:w-2/5 font-mono focus:outline-none focus:ring-2 focus:ring-black"
									disabled={isLoading}
								/>
								<button
									type="button"
									onClick={addEnvVar}
									className="border-2 border-black text-black px-4 py-2 rounded hover:bg-black hover:text-white transition-colors w-full md:w-1/5"
									disabled={isLoading}
								>
									Add
								</button>
							</div>
						</div>

						<div className="flex justify-center">
							<button
								type="submit"
								className={`py-3 px-8 border-2 border-black rounded font-bold text-lg w-full md:w-2/3 transition-colors ${
									isLoading
										? "bg-gray-200 text-gray-500 cursor-not-allowed"
										: "hover:bg-black hover:text-white"
								}`}
								disabled={isLoading}
							>
								{isLoading ? "Creating Deployment..." : "Create Deployment"}
							</button>
						</div>
					</form>
				</div>

				<div className="mt-12">
					<h2 className="text-3xl font-bold mb-6 text-center">
						Your Deployments
					</h2>

					{deployments.length === 0 ? (
						<div className="text-center p-8 border-2 border-dashed border-black rounded">
							<p className="text-xl">No deployments found</p>
							<p className="text-gray-600 mt-2">
								Create your first deployment above
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{deployments.map((deployment) => (
								<Link
									href={`/dashboard/${userid}/${deployment.ID}`}
									key={deployment.ID}
									className="border-2 border-black rounded p-6 hover:shadow-lg hover:bg-black hover:text-white transition-shadow bg-white"
								>
									<h3 className="text-xl font-bold mb-2 truncate">
										{deployment.RepoName}
									</h3>
									<p className="text-gray-700 mb-4 p-3">
										<span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-sm p-3">
											{deployment.SubDomain}
										</span>
									</p>
									<div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
										<span className="text-sm font-medium">
											Branch: {deployment.Branch}
										</span>
									</div>
								</Link>
							))}
						</div>
					)}
				</div>
			</div>

			{deploying && (
				<div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded shadow-lg flex items-center">
					<svg
						className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						></circle>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<div>
						<p className="font-medium">deploying application</p>
					</div>
				</div>
			)}
		</div>
	);
}
