export interface StackPackDescriptor {
  readonly id: string;
  readonly packageRoots: readonly string[];
}

export const uxPack: StackPackDescriptor = {
  id: "stack.ux",
  packageRoots: ["code-editor", "terminal-client", "theme-studio", "voice-synthesis"],
};

export default uxPack;
