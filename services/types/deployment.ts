export type EnvVar = {
	Key: string;
	Value: string;
};

export type Deployment = {
	Branch: string;
	CloneUrl: string;
	EnvVars: EnvVar[];
	ID: string;
	Port: number;
	ProjectPath: string;
	ProjectType: number;
	RepoName: string;
	SubDomain: string;
};
