type AppHeaderProps = {
  title: string;
};

export function AppHeader({ title }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div>
        <p className="app-header__eyebrow">taskapi</p>
        <h1>{title}</h1>
      </div>
      <div className="app-header__status" aria-label="Bootstrap phase status">
        Bootstrap
      </div>
    </header>
  );
}
