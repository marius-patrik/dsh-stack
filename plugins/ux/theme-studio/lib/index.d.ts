import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "theme-studio";
export declare const inject: string[];
export declare const optional: string[];
export interface ThemeDefinition {
    id: string;
    name: string;
    type: 'dark' | 'light' | 'oled';
    colors: Record<string, string>;
}
export declare class ThemeStudioService {
    private themes;
    private activeTheme;
    registerTheme(theme: ThemeDefinition): void;
    setTheme(id: string): void;
    getActiveTheme(): string;
}
export declare const Config: Schema<Schemastery.ObjectS<{}>, Schemastery.ObjectT<{}>>;
export declare function apply(ctx: Context): void;
