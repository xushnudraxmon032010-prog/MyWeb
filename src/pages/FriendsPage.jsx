export default function FriendsPage({
  friends,
  approvedAcquaintances,
  parseAcquaintance,
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
      <section id="friends" className="info-section">
        <div className="section-title-wrap">
          <p className="section-label">03 / DOSTLARIM</p>
          <h2>Dostlarim</h2>
        </div>

        <div className="card-grid">
          {friends.length === 0 ? (
            <p className="empty-message">Hozircha dostlar yo‘q.</p>
          ) : (
            friends.map((friend) => (
              <article key={friend.id} className="person-card">
                <div className="person-avatar">{friend.name.charAt(0)}</div>
                <div>
                  <h3>{friend.name}</h3>
                  <p className="role-tag">{friend.relation}</p>
                  <small>{friend.note}</small>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section id="acquaintances" className="info-section">
        <div className="section-title-wrap">
          <p className="section-label">04 / TANISHLARIM</p>
          <h2>Tanishlarim</h2>
        </div>

        <div className="card-grid">
          {approvedAcquaintances.length === 0 ? (
            <p className="empty-message">Hozircha tanishlar yo‘q.</p>
          ) : (
            approvedAcquaintances.map((item) => {
              const parsed = parseAcquaintance(item);
              return (
                <article key={item.id} className="person-card">
                  <div className="person-avatar">{item.firstName.charAt(0)}</div>
                  <div>
                    <h3>
                      {item.firstName} {item.lastName}
                    </h3>
                    <p className="role-tag">Tanish</p>
                    <small>
                      {item.age ? `${item.age} yosh` : 'Yosh noma’lum'} • Aloqa tasdiqlangan
                      {parsed.instagram && (
                        <>
                          {' '}•{' '}
                          <a
                            href={`https://instagram.com/${parsed.instagram}`}
                            target="_blank"
                            rel="noreferrer"
                            className="person-ig-link"
                          >
                            @{parsed.instagram}
                          </a>
                        </>
                      )}
                    </small>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>  
      <section id="acquaintance-form-section" className="info-section form-section">
        <div className="section-title-wrap">
          <p className="section-label">05 / BOG‘LANISH VA TANISHUV</p>
          <h2>Tanish bo‘lish uchun so‘rov</h2>
        </div>
        {isMyRequestApproved && (
          <div className="request-status-banner status-approved">
            <span className="status-banner-icon" aria-hidden="true">🎉</span>
            <div>
              <strong>Sizning tanish bo‘lish so‘rovingiz tasdiqlangan!</strong>
              <p>Endi o‘zingizni Tanishlar bo‘limida ko‘rishingiz mumkin.</p>
            </div>
          </div>
        )}

        {!isMyRequestApproved && mySentRequest && (
          <div className="request-status-banner status-pending">
            <span className="status-banner-icon" aria-hidden="true">⏳</span>
            <div>
              <strong>Sizning tanish bo‘lish so‘rovingiz adminga yuborilgan</strong>
              <p>Admin tomonidan ko‘rib chiqilmoqda. Tasdiqlangach, saytga kirganingizdan 2 soniya keyin xabar chiqadi.</p>
            </div>
          </div>
        )}

        <form className="acquaintance-form" onSubmit={addAcquaintance}>
          <div className="field-row two-cols">
            <label>
              Ism
              <input
                type="text"
                value={acquaintanceForm.firstName}
                onChange={(event) => {
                  const val = event.target.value;
                  setAcquaintanceForm((prev) => ({ ...prev, firstName: val }));
                  localStorage.setItem('myweb-user-firstname', val);
                }}
                placeholder="Ismingiz"
                required
              />
            </label>
            <label>
              Familya
              <input
                type="text"
                value={acquaintanceForm.lastName}
                onChange={(event) => {
                  const val = event.target.value;
                  setAcquaintanceForm((prev) => ({ ...prev, lastName: val }));
                  localStorage.setItem('myweb-user-lastname', val);
                }}
                placeholder="Familyangiz"
                required
              />
            </label>
          </div>

          <div className="field-row two-cols">
            <label>
              Yosh
              <input
                type="number"
                min="1"
                value={acquaintanceForm.age}
                onChange={(event) => {
                  const val = event.target.value;
                  setAcquaintanceForm((prev) => ({ ...prev, age: val }));
                  localStorage.setItem('myweb-user-age', val);
                }}
                placeholder="Yoshingiz"
              />
            </label>
            <label>
              Instagram profili (avtomatik olinadi)
              <div className="input-with-prefix">
                <span className="input-prefix" aria-hidden="true">@</span>
                <input
                  type="text"
                  value={acquaintanceForm.instagram}
                  onChange={(event) => {
                    const clean = event.target.value.replace(/^@/, '').trim();
                    setAcquaintanceForm((prev) => ({ ...prev, instagram: clean }));
                    localStorage.setItem('myweb-user-instagram', clean);
                    setReviewForm((prev) => ({ ...prev, instagram: clean }));
                  }}
                  placeholder="username"
                />
              </div>
            </label>
          </div>

          <label>
            Telefon raqami
            <input
              type="tel"
              value={acquaintanceForm.phone}
              onChange={(event) => {
                const val = event.target.value;
                setAcquaintanceForm((prev) => ({ ...prev, phone: val }));
                localStorage.setItem('myweb-user-phone', val);
              }}
              placeholder="+998..."
              required
            />
          </label>

          <button type="submit" className="primary-btn wide-btn">
            Yuborish
          </button>
          {acquaintanceError && <p className="login-error">Xato: {acquaintanceError}</p>}
        </form>
      </section>
    </>
  );
}
