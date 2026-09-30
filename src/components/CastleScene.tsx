export default function CastleScene() {
  return (
    <div className="castle-scene" aria-hidden="true">
      <div className="castle-moon" />
      <div className="moon-halo" />
      {Array.from({ length: 18 }, (_, i) => (
        <i
          className="magic-star"
          key={i}
          style={{
            left: `${(i * 37 + 11) % 100}%`,
            top: `${(i * 19 + 7) % 75}%`,
            animationDelay: `${i * 0.37}s`,
          }}
        />
      ))}
      <svg viewBox="0 0 600 320" className="castle" fill="none">
        <defs>
          <linearGradient id="stone" x2="0" y2="1">
            <stop stopColor="#374458" />
            <stop offset="1" stopColor="#151c2c" />
          </linearGradient>
        </defs>
        <path
          d="M0 320L0 295Q80 280 125 295L170 255L200 270L250 245L380 250L420 265L480 265L530 290L600 295V320Z"
          fill="#182233"
        />
        <g fill="url(#stone)" stroke="#6b7180" strokeWidth=".7">
          <path d="M162 282V159H192V282M157 159L177 107L197 159Z" />
          <path d="M214 270V124H254V270M207 124L234 56L261 124Z" />
          <path d="M270 275V171H335V275M263 171L303 126L342 171Z" />
          <path d="M346 270V99H379V270M340 99L363 23L385 99Z" />
          <path d="M398 280V143H430V280M390 143L414 87L438 143Z" />
          <path d="M190 280V201H215V280M254 280V220H270M335 280V198H346M379 280V210H398" />
          <path d="M443 286V197H468V286M437 197L456 149L474 197Z" />
        </g>
        <g fill="#d8b977" className="castle-windows">
          {[177, 234, 303, 363, 414, 456].map((x, i) => (
            <g key={x}>
              <rect
                x={x - 2}
                y={i === 3 ? 117 : i === 1 ? 143 : 200}
                width="4"
                height="9"
                rx="2"
              />
              <rect x={x - 2} y="239" width="4" height="9" rx="2" />
            </g>
          ))}
        </g>
        <path d="M363 24V7L383 12L363 17" stroke="#b9a076" fill="#b9a076" />
        <path d="M234 57V38L250 43L234 48" stroke="#b9a076" fill="#b9a076" />
      </svg>
      <div className="castle-mist" />
    </div>
  );
}
