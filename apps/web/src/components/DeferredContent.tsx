import { useEffect, useRef, useState, type ReactNode } from "react";

/** Render costly secondary content when viewed or keyboard-focused. */
export default function DeferredContent({
  label,
  height,
  render,
}: {
  label: string;
  height: number;
  render: () => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (ready) return;
    if (!("IntersectionObserver" in window)) {
      setReady(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setReady(true);
        observer.disconnect();
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ready]);
  return (
    <div
      ref={ref}
      style={ready ? undefined : { minHeight: height }}
      tabIndex={ready ? undefined : 0}
      aria-label={ready ? undefined : label}
      onFocus={() => setReady(true)}
    >
      {ready ? (
        render()
      ) : (
        <p className="provenance-text">{label} loads when viewed or focused.</p>
      )}
    </div>
  );
}
