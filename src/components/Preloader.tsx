interface PreloaderProps {
  progress: number;
  done: boolean;
}

export default function Preloader({ progress, done }: PreloaderProps) {
  const pct = Math.round(progress * 100);
  return (
    <div className="loader" data-done={done ? 'true' : 'false'} aria-hidden={done}>
      <div className="finder" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="loader__mark wordmark">
        CERAQO<span> / </span>Q-ARMOR
      </div>
      <div className="loader__bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="loader__bar-fill" style={{ transform: `scaleX(${progress})` }} />
      </div>
      <div className="loader__row">
        <span className="micro">Loading the dive</span>
        <span className="loader__pct">{String(pct).padStart(3, '0')}%</span>
      </div>
    </div>
  );
}
