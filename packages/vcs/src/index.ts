export interface StackPackDescriptor {
  readonly id: string;
  readonly packageRoots: readonly string[];
}

export const vcsPack: StackPackDescriptor = {
  id: "stack.vcs",
  packageRoots: [
    "forgejo-forge",
    "git-driver",
    "github-forge",
    "gitlab-forge",
    "sapling-driver",
    "workbench-core",
  ],
};

export default vcsPack;
