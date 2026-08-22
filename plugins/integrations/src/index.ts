export interface StackPackDescriptor {
  readonly id: string
  readonly packageRoots: readonly string[]
}

export const integrationsPack: StackPackDescriptor = {
  id: 'stack.integrations',
  packageRoots: [
    'code-formatters',
    'code-server',
    'docker-sandbox',
    'lsp-client',
    'mesh-hosts',
    'package-managers',
    'providers',
    'tmux-terminal',
  ],
}

export default integrationsPack
