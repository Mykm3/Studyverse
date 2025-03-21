import StudyDashboard from "../components/StudyDashboard";

export default function Dashboard() {
  return (
    <div
      className="flex flex-col h-screen"
      style={{ backgroundColor: "var(--background-color)", color: "var(--foreground-color)" }}
    >
      <main className="flex-1 overflow-auto">
        <StudyDashboard />
      </main>
    </div>
  );
}
