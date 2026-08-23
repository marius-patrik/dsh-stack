export interface StackPackDescriptor {
  readonly id: string;
  readonly packageRoots: readonly string[];
}

export const aiPack: StackPackDescriptor = {
  id: "stack.ai",
  packageRoots: ["protocol-dialects"],
};

export default aiPack;
