import Schema from '@deepseek-ai/schemastery';
export const name = 'theme-studio';
export const inject = ['webServer', 'slots'];
export const optional = ['icons'];
export class ThemeStudioService {
    themes = new Map();
    activeTheme = 'dark';
    registerTheme(theme) {
        this.themes.set(theme.id, theme);
    }
    setTheme(id) {
        if (this.themes.has(id))
            this.activeTheme = id;
    }
    getActiveTheme() {
        return this.activeTheme;
    }
}
export const Config = Schema.object({});
export function apply(ctx) {
    ctx.themeStudio = new ThemeStudioService();
}
