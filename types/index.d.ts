export type Picture = { seed: string; color: string; cells: boolean[][] }

declare module 'claude-code' {
  interface PluginState {
    identicon: { picture: Picture | null }
  }
}
