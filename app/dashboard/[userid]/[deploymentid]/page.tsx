"use client";
import { Suspense, useEffect, useState } from "react";
import { Deployment, EnvVar } from "@/services/types/deployment";
import Loading from "./loading";

type ContainerStats = {
	cpuUsage: number;
	memoryUsage: number;
	memoryLimit: number;
	networkRx: number;
	networkTx: number;
	status: string;
};

export default function DeploymentPage({
	params,
}: {
	params: Promise<{ userid: string; deploymentid: string }>;
}) {
	const [deploymentid, setDeploymentId] = useState("");
	const [userid, setUserId] = useState("");
	const [deployment, setDeployment] = useState<Deployment | undefined>();
	const [stats, setStats] = useState<ContainerStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [showLogs, setShowLogs] = useState(false);
	const [logs, setLogs] = useState<string[]>([]);
	const [redeploying, setRedeploying] = useState(false);

	const [showEnvForm, setShowEnvForm] = useState(false);
	const [newEnvKey, setNewEnvKey] = useState("");
	const [newEnvValue, setNewEnvValue] = useState("");
	const [envList, setEnvList] = useState<EnvVar[]>([]);
	const [editingEnv, setEditingEnv] = useState<string | null>(null);
	const [editValue, setEditValue] = useState("");
	const [envError, setEnvError] = useState("");

	async function getDeployment() {
		try {
			const user_id = (await params).userid;
			const deployment_id = (await params).deploymentid;
			setUserId(user_id);
			setDeploymentId(deployment_id);
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/deployment/${deployment_id}`,
				{
					headers: {
						Authorization: localStorage.getItem("session")!,
					},
				},
			);

			if (!response.ok) {
				throw new Error("Failed to fetch deployment");
			}

			const data = await response.json();
			setDeployment(data.deployment);
			setEnvList(data.deployment.EnvVars || []);
			setLoading(false);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to load deployment",
			);
			setLoading(false);
		}
	}

	async function fetchContainerStats() {
		if (!deploymentid) return;

		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/deployment/${deploymentid}/stats`,
				{
					headers: {
						Authorization: localStorage.getItem("session")!,
					},
				},
			);

			if (!response.ok) {
				throw new Error("Failed to fetch container stats");
			}

			const data = await response.json();
			setStats(data.stats);
		} catch (err) {
			console.error("Error fetching container stats:", err);
		}
	}

	async function fetchLogs() {
		if (!deploymentid) return;

		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/deployment/${deploymentid}/logs`,
				{
					headers: {
						Authorization: localStorage.getItem("session")!,
					},
				},
			);

			if (!response.ok) {
				throw new Error("Failed to fetch logs");
			}

			const data = await response.json();
			setLogs(data.logs || []);
		} catch (err) {
			console.error("Error fetching logs:", err);
		}
	}

	async function restartDeployment() {
		if (!deploymentid) return;

		setRedeploying(true);

		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/redeploy/${deploymentid}`,
				{
					method: "PUT",
					headers: {
						Authorization: localStorage.getItem("session")!,
					},
				},
			);

			if (!response.ok) {
				throw new Error("Failed to restart deployment");
			}

			fetchContainerStats();
			getDeployment();

			alert("Deployment restarted successfully");
		} catch (err) {
			alert(
				err instanceof Error ? err.message : "Failed to restart deployment",
			);
		} finally {
			setRedeploying(false);
		}
	}

	async function addEnvVar(e: React.FormEvent) {
		e.preventDefault();

		if (!newEnvKey.trim()) {
			setEnvError("Environment variable key is required");
			return;
		}

		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/env/${deploymentid}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: localStorage.getItem("session")!,
					},
					body: JSON.stringify({
						envs: [{ key: newEnvKey, value: newEnvValue }],
					}),
				},
			);

			if (!response.ok) {
				throw new Error("Failed to add environment variable");
			}

			setEnvList([...envList, { Key: newEnvKey, Value: newEnvValue }]);
			setNewEnvKey("");
			setNewEnvValue("");
			setShowEnvForm(false);
			setEnvError("");

			await getDeployment();
		} catch (err) {
			setEnvError(
				err instanceof Error
					? err.message
					: "Failed to add environment variable",
			);
		}
	}

	async function updateEnvVar(key: string) {
		if (!editValue.trim() && editValue !== "") {
			setEnvError("Environment variable value cannot be empty");
			return;
		}

		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/env/${deploymentid}/${encodeURIComponent(key)}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: localStorage.getItem("session")!,
					},
					body: JSON.stringify({ value: editValue }),
				},
			);

			if (!response.ok) {
				throw new Error("Failed to update environment variable");
			}

			const updatedEnvList = envList.map((env) =>
				env.Key === key ? { ...env, Value: editValue } : env,
			);

			setEnvList(updatedEnvList);
			setEditingEnv(null);
			setEditValue("");
			setEnvError("");

			await getDeployment();
		} catch (err) {
			setEnvError(
				err instanceof Error
					? err.message
					: "Failed to update environment variable",
			);
		}
	}

	async function deleteEnvVar(key: string) {
		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/env/${deploymentid}/${key}`,
				{
					method: "DELETE",
					headers: {
						Authorization: localStorage.getItem("session")!,
					},
				},
			);

			if (!response.ok) {
				throw new Error("Failed to delete environment variable");
			}

			const updatedEnvList = envList.filter((env) => env.Key !== key);
			setEnvList(updatedEnvList);
			setEnvError("");

			await getDeployment();
		} catch (err) {
			setEnvError(
				err instanceof Error
					? err.message
					: "Failed to delete environment variable",
			);
		}
	}

	useEffect(() => {
		getDeployment();
	}, []);

	useEffect(() => {
		if (deploymentid) {
			fetchContainerStats();
			const statsInterval = setInterval(fetchContainerStats, 10000);
			return () => clearInterval(statsInterval);
		}
	}, [deploymentid]);

	useEffect(() => {
		if (showLogs && deploymentid) {
			fetchLogs();
			const logsInterval = setInterval(fetchLogs, 5000);
			return () => clearInterval(logsInterval);
		}
	}, [showLogs, deploymentid]);

	if (loading) {
		return <Loading />;
	}

	if (error) {
		return (
			<div className="flex justify-center items-center h-screen">
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
					{error}
				</div>
			</div>
		);
	}

	return (
		<Suspense fallback={<Loading />}>
			<div className="container mx-auto p-6">
				{/* Status Bar */}
				{stats && (
					<div className="bg-black text-white p-4 rounded-md mb-6">
						<h2 className="text-xl font-bold mb-3">Container Status</h2>
						<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
							<div className="border border-gray-700 p-3 rounded">
								<h3 className="text-gray-400 text-sm">STATUS</h3>
								<p
									className={`text-2xl font-mono ${stats.status === "running" ? "text-green-400" : "text-red-400"}`}
								>
									{stats.status}
								</p>
							</div>
							<div className="border border-gray-700 p-3 rounded">
								<h3 className="text-gray-400 text-sm">CPU USAGE</h3>
								<p className="text-2xl font-mono">
									{stats.cpuUsage.toFixed(2)}%
								</p>
							</div>
							<div className="border border-gray-700 p-3 rounded">
								<h3 className="text-gray-400 text-sm">MEMORY</h3>
								<p className="text-2xl font-mono">
									{(stats.memoryUsage / (1024 * 1024)).toFixed(2)} MB /{" "}
									{(stats.memoryLimit / (1024 * 1024)).toFixed(2)} MB
								</p>
							</div>
							<div className="border border-gray-700 p-3 rounded">
								<h3 className="text-gray-400 text-sm">NETWORK</h3>
								<p className="text-lg font-mono">
									↓ {(stats.networkRx / (1024 * 1024)).toFixed(2)} MB
									<br />↑ {(stats.networkTx / (1024 * 1024)).toFixed(2)} MB
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Deployment Details */}
				<div className="flex flex-col md:flex-row gap-6">
					{/* Left Column - Details */}
					<div className="w-full md:w-2/3">
						<div className="border border-black p-6 rounded-md">
							<h1 className="text-3xl font-bold mb-6 border-b border-gray-300 pb-3">
								{deployment?.RepoName}
							</h1>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
								<div>
									<h2 className="text-lg font-semibold mb-2">Repository</h2>
									<div className="border border-gray-200 p-3 rounded bg-gray-50">
										<p className="font-mono break-all">
											{deployment?.CloneUrl}
										</p>
									</div>
								</div>

								<div>
									<h2 className="text-lg font-semibold mb-2">Branch</h2>
									<div className="border border-gray-200 p-3 rounded bg-gray-50">
										<p className="font-mono">{deployment?.Branch}</p>
									</div>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
								<div>
									<h2 className="text-lg font-semibold mb-2">Port</h2>
									<div className="border border-gray-200 p-3 rounded bg-gray-50">
										<p className="font-mono">{deployment?.Port}</p>
									</div>
								</div>

								<div>
									<h2 className="text-lg font-semibold mb-2">Subdomain</h2>
									<div className="border border-gray-200 p-3 rounded bg-gray-50">
										<p className="font-mono">{deployment?.SubDomain}</p>
									</div>
								</div>

								<div>
									<h2 className="text-lg font-semibold mb-2">Project Type</h2>
									<div className="border border-gray-200 p-3 rounded bg-gray-50">
										<p className="font-mono">
											{deployment?.ProjectType === 0
												? "Static"
												: deployment?.ProjectType === 1
													? "Node.js"
													: deployment?.ProjectType === 2
														? "Go"
														: "Unknown"}
										</p>
									</div>
								</div>
							</div>

							<div>
								<div className="flex justify-between items-center mb-2">
									<h2 className="text-lg font-semibold">
										Environment Variables
									</h2>
									<button
										onClick={() => setShowEnvForm(!showEnvForm)}
										className="px-3 py-1 border border-black text-sm hover:bg-black hover:text-white transition-colors"
									>
										{showEnvForm ? "Cancel" : "Add Variable"}
									</button>
								</div>

								{envError && (
									<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
										{envError}
									</div>
								)}

								{showEnvForm && (
									<form
										onSubmit={addEnvVar}
										className="mb-4 border border-gray-200 p-4 rounded bg-gray-50"
									>
										<div className="flex flex-col md:flex-row gap-3">
											<div className="flex-1">
												<label
													htmlFor="envKey"
													className="block text-sm font-medium text-gray-700 mb-1"
												>
													Key
												</label>
												<input
													type="text"
													id="envKey"
													value={newEnvKey}
													onChange={(e) => setNewEnvKey(e.target.value)}
													className="w-full p-2 border border-gray-300 rounded"
													placeholder="VARIABLE_NAME"
													required
												/>
											</div>
											<div className="flex-1">
												<label
													htmlFor="envValue"
													className="block text-sm font-medium text-gray-700 mb-1"
												>
													Value
												</label>
												<input
													type="text"
													id="envValue"
													value={newEnvValue}
													onChange={(e) => setNewEnvValue(e.target.value)}
													className="w-full p-2 border border-gray-300 rounded"
													placeholder="value"
												/>
											</div>
											<div className="flex items-end">
												<button
													type="submit"
													className="px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
												>
													Add
												</button>
											</div>
										</div>
									</form>
								)}

								{envList && envList.length > 0 ? (
									<div className="border border-gray-200 p-4 rounded bg-gray-50">
										{envList.map((env, index) => (
											<div
												key={index}
												className="flex flex-wrap items-center mb-2 last:mb-0 w-full"
											>
												{editingEnv === env.Key ? (
													<>
														<span className="font-mono bg-gray-200 px-2 py-1 rounded mr-2">
															{env.Key}
														</span>
														<span className="mx-2">=</span>
														<input
															type="text"
															value={editValue}
															onChange={(e) => setEditValue(e.target.value)}
															className="flex-1 p-1 border border-gray-300 rounded mr-2 font-mono"
														/>
														<div className="flex mt-1 md:mt-0">
															<button
																onClick={() => updateEnvVar(env.Key)}
																className="px-2 py-1 bg-black text-white hover:bg-gray-800 transition-colors mr-1 text-sm"
															>
																Save
															</button>
															<button
																onClick={() => {
																	setEditingEnv(null);
																	setEditValue("");
																}}
																className="px-2 py-1 border border-black hover:bg-black hover:text-white transition-colors text-sm"
															>
																Cancel
															</button>
														</div>
													</>
												) : (
													<>
														<span className="font-mono bg-gray-200 px-2 py-1 rounded mr-2">
															{env.Key}
														</span>
														<span className="mx-2">=</span>
														<span className="font-mono bg-gray-200 px-2 py-1 rounded flex-1">
															{env.Value}
														</span>
														<div className="ml-2 flex">
															<button
																onClick={() => {
																	setEditingEnv(env.Key);
																	setEditValue(env.Value);
																}}
																className="px-2 py-1 border border-black hover:bg-black hover:text-white transition-colors mr-1 text-sm"
															>
																Edit
															</button>
															<button
																onClick={() => deleteEnvVar(env.Key)}
																className="px-2 py-1 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors text-sm"
															>
																Delete
															</button>
														</div>
													</>
												)}
											</div>
										))}
									</div>
								) : (
									<div className="text-gray-500 italic border border-gray-200 p-4 rounded bg-gray-50">
										No environment variables
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Right Column - Actions */}
					<div className="w-full md:w-1/3">
						<div className="border border-black p-6 rounded-md">
							<h2 className="text-xl font-bold mb-4">Actions</h2>

							<div className="space-y-4">
								<button
									onClick={restartDeployment}
									disabled={redeploying}
									className={`w-full p-3 bg-black text-white transition-colors font-bold relative ${
										redeploying
											? "opacity-90 cursor-not-allowed"
											: "hover:bg-gray-800"
									}`}
								>
									{redeploying ? (
										<>
											<span className="opacity-0">Restart Deployment</span>
											<div className="absolute inset-0 flex items-center justify-center">
												<div className="flex items-center">
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
													<span>Building and Deploying...</span>
												</div>
											</div>
										</>
									) : (
										"Restart Deployment"
									)}
								</button>

								<a
									href={`http://${deployment?.SubDomain}.${process.env.NEXT_PUBLIC_DOMAIN}`}
									target="_blank"
									rel="noopener noreferrer"
									className="w-full p-3 border border-black hover:bg-black hover:text-white transition-colors font-bold flex justify-center items-center"
								>
									Visit Site
								</a>

								<button
									onClick={() => {
										setShowLogs(!showLogs);
										if (!showLogs) fetchLogs();
									}}
									className="w-full p-3 border border-black hover:bg-black hover:text-white transition-colors font-bold"
								>
									{showLogs ? "Hide Logs" : "Show Logs"}
								</button>
							</div>
						</div>
					</div>
				</div>

				{redeploying && (
					<div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-md shadow-lg flex items-center">
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
							<p className="font-medium">Redeploying application</p>
						</div>
					</div>
				)}

				{showLogs && (
					<div className="mt-6 border border-black p-6 rounded-md">
						<h2 className="text-xl font-bold mb-4">Container Logs</h2>
						<div className="bg-black text-green-400 font-mono p-4 rounded h-64 overflow-y-auto">
							{logs.length > 0 ? (
								logs.map((log, index) => (
									<p key={index} className="whitespace-pre-wrap mb-1">
										{log}
									</p>
								))
							) : (
								<p className="text-gray-400">No logs available</p>
							)}
						</div>
					</div>
				)}
			</div>
		</Suspense>
	);
}
