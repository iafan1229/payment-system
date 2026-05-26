const nextTasks = [
  { href: '/login', label: '로그인 화면 연결 예정' },
  { href: '/transactions', label: '거래 목록 화면 연결 예정' }
];

export default function HomePage() {
  return (
    <main className="landing-shell">
      <section className="landing-card">
        <p className="eyebrow">Task 2 Scaffold</p>
        <h1>결제 대시보드 프론트엔드 시작점</h1>
        <p className="lead">
          Next.js, TypeScript, Vitest 기본 골격만 준비된 상태입니다. 인증, 상태관리, 데이터
          조회는 다음 Task에서 연결합니다.
        </p>
        <div className="placeholder-grid">
          {nextTasks.map((task) => (
            <a key={task.href} href={task.href} className="placeholder-link">
              {task.label}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
