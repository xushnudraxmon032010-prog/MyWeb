export default function ProjectsPage({ projects, profile }) {
  return (
    <>
      <section id="projects" className="info-section projects-section">
        <div className="section-title-wrap projects-heading">
          <div>
            <p className="section-label">02 / LOYIHALARIM</p>
            <h2>Qilgan ishlarim</h2>
          </div>
          <p>O‘rgangan bilimlarimni amaliy loyihalarda sinab, foydali va qulay mahsulotlar yarataman.</p>
        </div>

        <div className="project-grid">
          {projects.map((project) => (
            <article key={project.number} className={`project-card ${project.tone}`}>
              <div className="project-card-top">
                <span className="project-number">{project.number}</span>
                <span className="project-mark" aria-hidden="true">↗</span>
              </div>
              <div>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
              </div>
              <div className="project-tags">
                {project.technologies.map((technology) => (
                  <span key={technology}>{technology}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="donate" className="donate-section">
        <div className="donate-intro">
          <div>
            <p className="section-label">06 / DONATE XIZMATI</p>
            <h2>Sevimli o‘yiningizni yanada qiziqarli qiling.</h2>
          </div>
          <p>
            Sizga istalgan o‘yinga donate xizmati mavjud. Tez, qulay va ishonchli yordam kerak bo‘lsa,
            men bilan bog‘laning.
          </p>
        </div>

        <div className="donate-grid">
          <article className="donate-card donate-card-main">
            <span className="donate-number">01</span>
            <div>
              <span className="donate-icon" aria-hidden="true">✦</span>
              <h3>Istalgan o‘yinga</h3>
              <p>Sevimli o‘yiningiz uchun kerakli donate xizmatini topamiz.</p>
            </div>
          </article>
          <article className="donate-card donate-card-fast">
            <span className="donate-number">02</span>
            <div>
              <span className="donate-icon" aria-hidden="true">↗</span>
              <h3>Tezkor xizmat</h3>
              <p>Buyurtmangizni ortiqcha kutishlarsiz ko‘rib chiqamiz.</p>
            </div>
          </article>
          <article className="donate-card donate-card-trust">
            <span className="donate-number">03</span>
            <div>
              <span className="donate-icon" aria-hidden="true">♥</span>
              <h3>Sizning tanlovingiz</h3>
              <p>O‘yin, server va kerakli paketni ayting, mos variantni birga tanlaymiz.</p>
            </div>
          </article>
        </div>

        <div className="donate-details">
          <div>
            <span className="section-label">QANDAY BUYURTMA BERILADI?</span>
            <ol className="donate-steps">
              <li><strong>O‘yinni ayting</strong><span>O‘yin nomi va serveringizni yuboring.</span></li>
              <li><strong>Paketni tanlang</strong><span>Kerakli donate miqdorini birga aniqlaymiz.</span></li>
              <li><strong>Natijani kuting</strong><span>Buyurtma holati haqida Telegram’da xabar olasiz.</span></li>
            </ol>
          </div>
          <div className="donate-requirements">
            <span className="section-label">KERAK BO‘LADIGAN MA’LUMOTLAR</span>
            <p>O‘yin nomi, player ID, server va paket nomi kifoya. Hech qachon akkaunt parolingizni yubormang.</p>
          </div>
        </div>

        <a href="#contact" className="primary-btn donate-cta">
          Donate kerakmi? Men bilan bog‘laning <span aria-hidden="true">→</span>
        </a>
      </section>
    </>
  );
}
