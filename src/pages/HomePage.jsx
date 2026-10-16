export default function HomePage({ profile, friends, approvedAcquaintances, parseAcquaintance, onOpenAcquaintanceForm }) {
  return (
    <>
      <section id="home" className="hero">
        <div className="hero-copy">
          <p className="eyebrow">SALOM, MEN {profile.name.toUpperCase()} </p>
          <h1>
            Men {profile.title}
            <span>.</span>
          </h1>
          <p className="lead">{profile.bio}</p>

          <div className="hero-actions">
            <a href="#about" className="primary-btn">
              Men haqimda
            </a>
            <a href="#contact" className="secondary-btn">
              Bog’lanish
            </a>
            <a
              href={profile.socialLinks.telegram}
              className="telegram-btn"
              target="_blank"
              rel="noreferrer"
            >
              Telegram orqali yozish <span aria-hidden="true">↗</span>
            </a>
            <a href="#contact" className="donate-btn">
              Donate <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="mini-meta">
            <span>{profile.city}</span>
            <span>{profile.course}</span>
          </div>
        </div>

        <div className="hero-card">
          <div className="avatar-box">{profile.name.charAt(0)}</div>
          <h3>
            {profile.name} {profile.surname}
          </h3>
          <p>{profile.title}</p>
        </div>
      </section>

      <section id="about" className="info-section">
        <div className="section-title-wrap">
          <p className="section-label">01 / MEN HAQIMDA</p>
          <h2>Men haqimda</h2>
        </div>

        <div className="content-grid about-grid">
          <p>{profile.about}</p>
          <div className="facts-box">
            <h4>Yutuqlar</h4>
            <ul>
              {profile.achievements?.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="interests" className="info-section light-section">
        <div className="section-title-wrap">
          <p className="section-label">02 / QIZIQISHLARIM</p>
          <h2>Qiziqishlarim</h2>
        </div>

        <div className="interest-grid">
          {profile.interests?.map((item, index) => (
            <article key={item} className={`interest-card tone-${index + 1}`}>
              <span>{index + 1}</span>
              <h3>{item}</h3>
            </article>
          ))}
        </div>
      </section>

    </>
  );
}
