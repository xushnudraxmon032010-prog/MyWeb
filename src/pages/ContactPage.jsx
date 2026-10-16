export default function ContactPage({
  profile,
  acquaintanceForm,
  setAcquaintanceForm,
  addAcquaintance,
  acquaintanceError,
  isMyRequestApproved,
  mySentRequest,
  reviewForm,
  setReviewForm,
  setShowAlert,
}) {
  return (
    <>
      <section id="contact" className="footer-contact">
        <div>
          <p className="section-label">05 / BOG’LANISH</p>
          <h2>Men bilan bog’laning</h2>
        </div>

        <div className="social-links">
          <a className="telegram-link" href={profile.socialLinks.telegram} target="_blank" rel="noreferrer">
            Telegram
          </a>
          <a href={profile.socialLinks.instagram} target="_blank" rel="noreferrer">
            Instagram
          </a>
          <a href={profile.socialLinks.youtube} target="_blank" rel="noreferrer">
            YouTube
          </a>
        </div>
      </section>

      <section id="contact" className="footer-contact">
        <div>
          <p className="section-label">05 / BOG’LANISH</p>
          <h2>Men bilan bog’laning</h2>
        </div>

        <div className="social-links">
          <a className="telegram-link" href={profile.socialLinks.telegram} target="_blank" rel="noreferrer">
            Telegram
          </a>
          <a href={profile.socialLinks.instagram} target="_blank" rel="noreferrer">
            Instagram
          </a>
          <a href={profile.socialLinks.youtube} target="_blank" rel="noreferrer">
            YouTube
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
