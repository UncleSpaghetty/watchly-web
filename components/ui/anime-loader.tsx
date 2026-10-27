export function AnimeLoader() {
  return (
    <main className="app-loading-shell" role="status" aria-live="polite" aria-label="Caricamento in corso">
      <div className="anime-loader">
        <div className="anime-loader-frame" aria-hidden="true">
          <svg viewBox="0 0 240 184" focusable="false">
            <defs>
              <linearGradient id="loader-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#101916" />
                <stop offset="1" stopColor="#234033" />
              </linearGradient>
              <linearGradient id="loader-glow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#6fbf92" stopOpacity="0" />
                <stop offset="0.5" stopColor="#6fbf92" stopOpacity="0.7" />
                <stop offset="1" stopColor="#6fbf92" stopOpacity="0" />
              </linearGradient>
            </defs>

            <rect width="240" height="184" rx="28" fill="url(#loader-sky)" />
            <circle className="anime-loader-moon" cx="184" cy="44" r="18" fill="#c9f2d9" />
            <circle cx="192" cy="38" r="18" fill="#15221d" />

            <g className="anime-loader-stars" fill="#d9f8e5">
              <circle cx="36" cy="36" r="1.5" />
              <circle cx="68" cy="58" r="1" />
              <circle cx="113" cy="30" r="1.2" />
              <circle cx="147" cy="69" r="1" />
            </g>

            <g className="anime-loader-cloud anime-loader-cloud-back" fill="#385546" fillOpacity="0.56">
              <ellipse cx="34" cy="76" rx="31" ry="8" />
              <ellipse cx="60" cy="74" rx="25" ry="10" />
            </g>
            <g className="anime-loader-cloud anime-loader-cloud-front" fill="#527361" fillOpacity="0.5">
              <ellipse cx="175" cy="88" rx="32" ry="8" />
              <ellipse cx="205" cy="85" rx="29" ry="11" />
            </g>

            <path d="M0 119 29 99l23 13 27-28 32 28 22-17 31 21 25-18 51 25v61H0Z" fill="#15231d" />
            <path d="M0 139c35-9 69-8 102 2s78 10 138-5v48H0Z" fill="#0f1713" />
            <path d="M0 145h240" stroke="#476455" strokeWidth="2" />
            <path d="M0 151h240" stroke="#283a31" strokeWidth="3" />

            <g className="anime-loader-train">
              <rect x="-112" y="119" width="104" height="27" rx="8" fill="#24372e" stroke="#6fbf92" strokeWidth="1.5" />
              <path d="M-19 119h11v27h-11c6-9 6-18 0-27Z" fill="#314b3e" />
              <g fill="#e7a079">
                <rect x="-98" y="125" width="16" height="9" rx="2" />
                <rect x="-73" y="125" width="16" height="9" rx="2" />
                <rect x="-48" y="125" width="16" height="9" rx="2" />
              </g>
              <circle cx="-85" cy="147" r="4" fill="#0b110e" />
              <circle cx="-34" cy="147" r="4" fill="#0b110e" />
            </g>

            <rect className="anime-loader-track-glow" y="149" width="240" height="2" fill="url(#loader-glow)" />
          </svg>
        </div>

        <p className="anime-loader-label">
          Il prossimo episodio sta arrivando
          <span className="anime-loader-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </p>
      </div>
    </main>
  );
}
