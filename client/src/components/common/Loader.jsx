/* 
  Three bold italic slash bars — all always visible at a short resting height.
  They take turns growing to full height one by one, then cycle repeats.
*/

const Loader = ({ size = 'md', fullScreen = false }) => {
  const sizes = { sm: 36, md: 56, lg: 80 };
  const px = sizes[size] || 56;

  // All bars stay visible (italic) at ~35% resting height.
  // Each bar grows to 100%, holds briefly, then returns — next bar takes its turn.
  // Total cycle: 1.5s. Stagger: 0.4s so bars fire one after another.
  const keyframes = `
    @keyframes slashGrow {
      0%   { transform: skewX(-16deg) scaleY(0.32); opacity: 0.45; }
      20%  { transform: skewX(-16deg) scaleY(1);    opacity: 1;    }
      48%  { transform: skewX(-16deg) scaleY(1);    opacity: 1;    }
      68%  { transform: skewX(-16deg) scaleY(0.32); opacity: 0.45; }
      100% { transform: skewX(-16deg) scaleY(0.32); opacity: 0.45; }
    }
  `;

  const totalDuration = 1.5;
  const stagger = 0.38;

  const barStyle = (i) => ({
    width: '21%',
    height: '100%',
    borderRadius: 4,
    background: 'linear-gradient(to top, #4f46e5, #a5b4fc)',
    transformOrigin: 'bottom center',
    // Start already at resting italic position via initial transform
    transform: 'skewX(-16deg) scaleY(0.32)',
    animation: `slashGrow ${totalDuration}s ease-in-out ${i * stagger}s infinite`,
  });

  const Bars = ({ h = px }) => (
    <div style={{ width: h, height: h }} className="flex items-end justify-center gap-[16%]">
      <style>{keyframes}</style>
      {[0, 1, 2].map((i) => (
        <div key={i} style={barStyle(i)} />
      ))}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-5 z-50">
        <Bars h={80} />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-500 animate-pulse">
          Loading…
        </p>
      </div>
    );
  }

  return <Bars h={px} />;
};

export default Loader;