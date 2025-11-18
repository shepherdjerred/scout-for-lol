export function PlayerNameAndLevel({ name, level, isTracked }: { name: string; level: number; isTracked: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
      <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: isTracked ? "#fbbf24" : "#e5e7eb" }}>
        {name}
      </div>
      <div style={{ display: "flex", fontSize: 24, opacity: 0.8 }}>Level {level}</div>
    </div>
  );
}
