import icon from "thesvg/codex-openai";

export interface SkinBrandProps {
  readonly size?: number;
}

export function CodexBrandMark({ size = 24 }: SkinBrandProps): JSX.Element {
  return (
    <span
      aria-label="Codex"
      role="img"
      style={{ width: size, height: size, display: "block", flex: "0 0 auto" }}
      dangerouslySetInnerHTML={{ __html: icon.svg }}
    />
  );
}

export function CodexBrandName(): JSX.Element {
  return <span style={{ fontWeight: 650, letterSpacing: "-0.01em" }}>Codex</span>;
}
