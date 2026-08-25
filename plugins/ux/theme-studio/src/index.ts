import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";

export const name = "theme-studio";
export const inject = ["webServer", "slots"];
export const optional = ["icons"];

export interface ThemeDefinition {
  id: string;
  name: string;
  type: "dark" | "light" | "oled";
  colors: Record<string, string>;
}

export class ThemeStudioService {
  private themes = new Map<string, ThemeDefinition>();
  private activeTheme = "dark";

    /** registerTheme implementation. */
registerTheme(theme: ThemeDefinition): void {
    this.themes.set(theme.id, theme);
  }

    /** setTheme implementation. */
setTheme(id: string): void {
    if (this.themes.has(id)) this.activeTheme = id;
  }

    /** getActiveTheme implementation. */
getActiveTheme(): string {
    return this.activeTheme;
  }
}

export const Config = Schema.object({});

/** apply implementation. */
export function apply(ctx: Context) {
  (ctx as any).themeStudio = new ThemeStudioService();
}
