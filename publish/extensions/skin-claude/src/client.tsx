import icon from "thesvg/claude";

export interface SkinBrandProps {
  readonly size?: number;
}

/** ClaudeBrandMark implementation. */
export function ClaudeBrandMark({ size = 24 }: SkinBrandProps): JSX.Element {
  return (
    <span
      aria-label="Claude"
      role="img"
      style={{ width: size, height: size, display: "block", flex: "0 0 auto", color: "#D97757" }}
      dangerouslySetInnerHTML={{ __html: icon.svg }}
    />
  );
}

/** ClaudeBrandName implementation. */
export function ClaudeBrandName(): JSX.Element {
  return <span style={{ fontWeight: 650, letterSpacing: "-0.01em" }}>Claude</span>;
}
