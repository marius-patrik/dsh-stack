export interface StackPackDescriptor {
  readonly id: string;
  readonly packageRoots: readonly string[];
}

export const corePack: StackPackDescriptor = {
  id: "stack.core",
  packageRoots: ["integrations-registry", "keybindings", "providers-registry", "settings-dialog"],
};

export default corePack;
