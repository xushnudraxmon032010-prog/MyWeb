export default function ContactPage({
  profile,
  setShowAlert,
}) {
  return (
    <>
      <section id="contact" className="footer-contact">
        <div className="footer-contact-copy">
          <p className="section-label">05 / BOG’LANISH</p>
          <h2>Men bilan bog’laning</h2>
          <p className="footer-contact-description">
            Savolingiz yoki taklifingiz bormi? O‘zingizga qulay tarmoq orqali yozing.
          </p>
        </div>

        <div className="social-links" aria-label="Ijtimoiy tarmoqlar">
          <a className="telegram-link" href={profile.socialLinks.telegram} target="_blank" rel="noreferrer">
            Telegram <span aria-hidden="true">↗</span>
          </a>
          <a href={profile.socialLinks.instagram} target="_blank" rel="noreferrer">
            Instagram <span aria-hidden="true">↗</span>
          </a>
          <a href={profile.socialLinks.youtube} target="_blank" rel="noreferrer">
            YouTube <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      <section className="info-section form-section">
        <div className="section-title-wrap">
          <p className="section-label">MYWEB</p>
          <h2>Fikr qoldirish</h2>
        </div>

        <button type="button" className="primary-btn wide-btn" onClick={() => setShowAlert(true)}>
          Fikr yuborish
        </button>
      </section>
    </>
  );
}
