export default function ServicesPage({ services, reviews, openReviewModal }) {
  return (
    <>
      <section id="services" className="info-section services-section">
        <div className="section-title-wrap services-heading">
          <div>
            <p className="section-label">03 / XIZMATLARIM</p>
            <h2>Nima qila olaman?</h2>
          </div>
          <a
            href={"https://t.me/+998200101026"}
            className="primary-btn"
            target="_blank"
            rel="noreferrer"
          >
            Buyurtma berish <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="service-grid">
          {services.map((service) => (
            <article key={service.number} className={`service-card ${service.tone}`}>
              <span className="service-number">{service.number}</span>
              <div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
              <a href="https://t.me/+998200101026" target="_blank" rel="noreferrer">
                Batafsil yozish <span aria-hidden="true">→</span>
              </a>
            </article>
          ))}
        </div>
      </section>

    </>
  );
}
