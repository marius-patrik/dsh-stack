import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "voice-synthesis";
export declare const inject: string[];
export declare const optional: string[];
export declare class VoiceSynthesisService {
    speak(text: string): boolean;
}
export declare const Config: Schema<Schemastery.ObjectS<{
    enabled: Schema<boolean, boolean>;
    voice: Schema<string, string>;
}>, Schemastery.ObjectT<{
    enabled: Schema<boolean, boolean>;
    voice: Schema<string, string>;
}>>;
export declare function apply(ctx: Context): void;
