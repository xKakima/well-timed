function BrandMark() {
  return (
    <svg
      aria-hidden="true"
      className="brand-mark"
      fill="none"
      viewBox="0 0 48 48"
    >
      <circle cx="23" cy="25" r="17.5" />
      <path d="M23 8v5M5.5 25H11" />
      <path d="m15 22 6.5 7 5.2-5.5 4.2 4.1 8.3-10.1" />
      <path d="M36.8 8.8A22 22 0 0 1 44 25M11.2 42.2A22 22 0 0 1 2 25" />
    </svg>
  );
}

function WatchIllustration() {
  return (
    <svg
      aria-label="Illustration of a classic silver watch with a dark leather strap"
      className="watch-illustration"
      role="img"
      viewBox="0 0 560 660"
    >
      <defs>
        <linearGradient id="case" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#f6f4ef" />
          <stop offset=".48" stopColor="#aaa9a2" />
          <stop offset=".7" stopColor="#e4e1d9" />
          <stop offset="1" stopColor="#777872" />
        </linearGradient>
        <linearGradient id="strap" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#554840" />
          <stop offset=".5" stopColor="#302a26" />
          <stop offset="1" stopColor="#66564b" />
        </linearGradient>
        <radialGradient id="dial" cx=".42" cy=".34" r=".72">
          <stop offset="0" stopColor="#f8f6f0" />
          <stop offset="1" stopColor="#d9d6cc" />
        </radialGradient>
        <filter id="shadow" height="150%" width="150%" x="-25%" y="-20%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="12" />
          <feOffset dy="18" />
          <feComponentTransfer>
            <feFuncA slope=".2" type="linear" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <ellipse cx="280" cy="570" fill="#4c453d" opacity=".1" rx="145" ry="22" />
      <g filter="url(#shadow)" transform="rotate(-9 280 325)">
        <path
          d="M222 31c2-15 16-25 31-25h54c15 0 29 10 31 25l16 117H205L222 31ZM205 502h149l-16 128c-2 15-16 25-31 25h-54c-15 0-29-10-31-25l-17-128Z"
          fill="url(#strap)"
        />
        <path d="M226 37h108M226 626h108" fill="none" opacity=".46" stroke="#b7a18b" strokeWidth="2" />
        <path d="M232 42 217 148M328 42l15 106M217 502l15 116M343 502l-15 116" fill="none" opacity=".28" stroke="#c3ad97" strokeWidth="1.5" />
        <rect fill="#b9b6ad" height="28" rx="10" width="27" x="405" y="303" />
        <rect fill="#898980" height="19" rx="7" width="30" x="410" y="308" />
        <rect fill="url(#case)" height="390" rx="85" width="260" x="150" y="130" />
        <rect fill="#868780" height="366" rx="76" width="237" x="161.5" y="142" />
        <rect fill="url(#case)" height="350" rx="70" width="225" x="167.5" y="150" />
        <circle cx="280" cy="325" fill="#494a45" r="150" />
        <circle cx="280" cy="325" fill="url(#dial)" r="139" />
        <circle cx="280" cy="325" fill="none" opacity=".48" r="125" stroke="#aaa79d" />
        <g fill="#44443e">
          <rect height="18" rx="2" width="3" x="278.5" y="202" />
          <rect height="18" rx="2" width="3" x="278.5" y="430" />
          <rect height="3" rx="2" width="18" x="158" y="323.5" />
          <rect height="3" rx="2" width="18" x="384" y="323.5" />
          <circle cx="222" cy="224" r="2.5" />
          <circle cx="338" cy="224" r="2.5" />
          <circle cx="222" cy="426" r="2.5" />
          <circle cx="338" cy="426" r="2.5" />
        </g>
        <text
          fill="#66655d"
          fontFamily="Georgia, serif"
          fontSize="13"
          letterSpacing="2"
          textAnchor="middle"
          x="280"
          y="278"
        >
          WELL TIMED COLLECTIVE
        </text>
        <path d="M280 325V248M280 325l57 36" fill="none" stroke="#343530" strokeLinecap="round" strokeWidth="5" />
        <circle cx="280" cy="325" fill="#77776f" r="7" />
        <circle cx="280" cy="325" fill="#343530" r="3" />
      </g>
    </svg>
  );
}

const principles = [
  {
    number: "01",
    title: "Chosen with care",
    description:
      "A more considered collection, where every timepiece has a story worth telling.",
  },
  {
    number: "02",
    title: "Confidence, built in",
    description:
      "Clear details and a thoughtful process make every next step feel well timed.",
  },
  {
    number: "03",
    title: "Made for the long run",
    description:
      "A modern home for watches made to be worn, collected, and passed on.",
  },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a aria-label="Well Timed Collective home" className="wordmark" href="#">
          <BrandMark />
          <span className="wordmark-name">
            <span>well timed</span>
            <span className="wordmark-collective">COLLECTIVE</span>
          </span>
        </a>
        <nav aria-label="Main navigation" className="main-nav">
          <a href="#approach">Our approach</a>
          <a className="nav-cta" href="#coming-soon">
            Discover the collective <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <section aria-labelledby="hero-title" className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span /> A more considered watch marketplace</p>
          <h1 id="hero-title">
            The right watch.
            <br />
            <em>Right on time.</em>
          </h1>
          <p className="hero-description">
            Exceptional timepieces deserve a better way to find their next
            chapter. We&apos;re making the watch market feel a little more
            personal, and a lot more considered.
          </p>
          <a className="text-link" href="#approach">
            Get to know us <span aria-hidden="true">↓</span>
          </a>
          <div className="hero-footnote">
            <span>INDEPENDENTLY MINDED</span>
            <span>ALWAYS WELL TIMED</span>
          </div>
        </div>

        <div className="hero-art">
          <div aria-hidden="true" className="art-index">
            <span>OBJECT STUDY</span>
            <span>WT — 001</span>
          </div>
          <div className="art-orbit art-orbit-outer" />
          <div className="art-orbit art-orbit-inner" />
          <WatchIllustration />
          <p className="art-caption">
            TIME, <span>WELL SPENT.</span>
          </p>
        </div>
      </section>

      <section aria-labelledby="approach-title" className="approach" id="approach">
        <div className="section-heading">
          <p className="eyebrow">A better kind of watch marketplace</p>
          <h2 id="approach-title">
            Good things take time.
            <br />
            <span>Finding them shouldn&apos;t.</span>
          </h2>
        </div>
        <div className="principles">
          {principles.map((principle) => (
            <article className="principle" key={principle.number}>
              <span className="principle-number">{principle.number}</span>
              <h3>{principle.title}</h3>
              <p>{principle.description}</p>
              <span aria-hidden="true" className="principle-mark">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="coming-soon-title" className="closing" id="coming-soon">
        <BrandMark />
        <p className="eyebrow">A new chapter is taking shape</p>
        <h2 id="coming-soon-title">
          The wait will
          <br />
          be <em>worth it.</em>
        </h2>
        <p>
          Well Timed Collective is on its way. We&apos;re taking the time to get it right.
        </p>
      </section>

      <footer className="site-footer">
        <a aria-label="Well Timed Collective home" className="wordmark footer-wordmark" href="#">
          <BrandMark />
          <span className="wordmark-name">
            <span>well timed</span>
            <span className="wordmark-collective">COLLECTIVE</span>
          </span>
        </a>
        <span>TIME, WELL CONSIDERED.</span>
        <span>© {new Date().getFullYear()} WELL TIMED COLLECTIVE</span>
      </footer>
    </main>
  );
}
