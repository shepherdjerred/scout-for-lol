export function Damage({ value, percent, highlight }: { value: number; percent: number; highlight: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        minWidth: 120,
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 600, color: highlight ? "#fbbf24" : "#d1d5db" }}>
        {value.toLocaleString()} dmg
      </div>
      <span
        style={{
          width: 100,
          height: 12,
          backgroundColor: "#5B5A56",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <span
          style={{
            display: "flex",
            width: `${percent.toString()}%`,
            height: "100%",
            backgroundColor: highlight ? "#fbbf24" : "#d1d5db",
            borderRadius: 2,
          }}
        />
      </span>
    </div>
  );
}
