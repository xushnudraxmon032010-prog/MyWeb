export default function AdminPage({
  visitorStats,
  addFriend,
  friendForm,
  setFriendForm,
  pendingAcquaintances,
  approveOneAcquaintance,
  addAcquaintanceAsFriend,
  removeAcquaintance,
  reviews,
  removeReview,
  approvedAcquaintances,
  parseAcquaintance,
  editingAcquaintanceId,
  setEditingAcquaintanceId,
  acquaintanceDraft,
  setAcquaintanceDraft,
  saveAcquaintanceEdit,
  startEditingAcquaintance,
  editingFriendId,
  setEditingFriendId,
  friendDraft,
  setFriendDraft,
  saveFriendEdit,
  startEditingFriend,
  removeFriend,
  friends,
  setShowSmsModal,
  logoutAdmin,
  setRole,
  setIsAdminLoggedIn,
  setShowLogin,
}) {
  return (
    <main className="admin-panel">
      <section className="admin-header">
        <div>
          <p className="section-label">SUPER ADMIN</p>
          <h2>Admin panel</h2>
        </div>
        <div className="admin-header-actions">
          <button
            type="button"
            className="sms-toggle-btn admin-sms-btn"
            onClick={() => setShowSmsModal(true)}
          >
            <span className="sms-icon" aria-hidden="true">💬</span>
            <span>SMS Xabarlar</span>
            {pendingAcquaintances.length > 0 && (
              <span className="sms-badge-count">{pendingAcquaintances.length}</span>
            )}
          </button>
          <button
            type="button"
            className="role-toggle dull"
            onClick={() => {
              logoutAdmin();
              setRole('people');
              setIsAdminLoggedIn(false);
              setShowLogin(false);
            }}
          >
            Chiqish
          </button>
        </div>
      </section>

      <section className="admin-card analytics-card">
        <div className="analytics-heading">
          <div>
            <p className="section-label">TASHRIFLAR STATISTIKASI</p>
            <h3>Oylik tashrifchilar</h3>
          </div>
          <span className="analytics-note">Anonim noyob brauzerlar</span>
        </div>
        {visitorStats.length === 0 ? (
          <p className="empty-message">Hali statistika yig‘ilmadi yoki jadval sozlanmagan.</p>
        ) : (
          <div className="analytics-list">
            {visitorStats.map((stat) => {
              const maximum = Math.max(...visitorStats.map((item) => Number(item.unique_visitors) || 0), 1);
              const visitors = Number(stat.unique_visitors) || 0;
              const monthLabel = new Date(`${stat.month}T00:00:00`).toLocaleDateString('uz-UZ', {
                month: 'long',
                year: 'numeric',
              });

              return (
                <div key={stat.month} className="analytics-row">
                  <span className="analytics-month">{monthLabel}</span>
                  <div className="analytics-bar-track" aria-hidden="true">
                    <span className="analytics-bar" style={{ width: `${Math.max((visitors / maximum) * 100, 3)}%` }} />
                  </div>
                  <strong>{visitors}</strong>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="admin-grid">
        <section className="admin-card">
          <h3>Dost qo’shish</h3>
          <form onSubmit={addFriend} className="admin-form">
            <label>
              Ism
              <input
                type="text"
                value={friendForm.name}
                onChange={(event) => setFriendForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Do’stning ismi"
                required
              />
            </label>

            <label>
              Aloqa turi
              <select
                value={friendForm.relation}
                onChange={(event) => setFriendForm((prev) => ({ ...prev, relation: event.target.value }))}
              >
                <option value="Do’st">Do’st</option>
                <option value="Tanish">Tanish</option>
                <option value="Yaqin do’st">Yaqin do’st</option>
              </select>
            </label>

            <label>
              Izoh
              <textarea
                value={friendForm.note}
                onChange={(event) => setFriendForm((prev) => ({ ...prev, note: event.target.value }))}
                placeholder="Qisqa izoh..."
              />
            </label>

            <button type="submit" className="primary-btn wide-btn">
              Qo’shish
            </button>
          </form>
        </section>

        <section className="admin-card">
          <h3>Tanishlar ro’yxati (SMS so‘rovlar)</h3>

          {pendingAcquaintances.length === 0 ? (
            <p className="empty-message">Hozircha yangi tanishlar yo’q.</p>
          ) : (
            pendingAcquaintances.map((item) => {
              const parsed = parseAcquaintance(item);
              return (
                <div key={item.id} className="request-card">
                  <div>
                    <strong>
                      {item.firstName} {item.lastName}
                    </strong>
                    <p>
                      {item.age || 'Yosh nomalum'} yosh • 📞 <a href={`tel:${parsed.cleanPhone}`}>{parsed.cleanPhone}</a>
                      {parsed.instagram && (
                        <>
                          {' '}•{' '}
                          <a
                            href={`https://instagram.com/${parsed.instagram}`}
                            target="_blank"
                            rel="noreferrer"
                            className="admin-ig-tag"
                          >
                            📸 @{parsed.instagram}
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="request-actions">
                    <button type="button" onClick={() => approveOneAcquaintance(item.id)}>
                      Tasdiqlash ✓
                    </button>
                    <button type="button" onClick={() => addAcquaintanceAsFriend(item)}>
                      Do’stga qo’shish
                    </button>
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => removeAcquaintance(item.id)}
                    >
                      Bekor qilish
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>

      <section className="admin-card approved-card">
        <h3>Baholar va izohlar</h3>
        {reviews.length === 0 ? (
          <p className="empty-message">Hozircha izohlar yo‘q.</p>
        ) : (
          <div className="review-list">
            {reviews.map((review) => (
              <article key={review.id} className="review-card">
                <div>
                  <strong>{review.name || 'Noma’lum'}</strong>
                  <div className="review-stars" aria-label={`${review.rating} yulduz`}>{'★'.repeat(review.rating)}</div>
                  <p>{review.comment}</p>
                  <small>{new Date(review.created_at).toLocaleString('uz-UZ')}</small>
                </div>
                <button type="button" className="danger-btn" onClick={() => removeReview(review.id)}>
                  Delete
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="admin-card approved-card">
        <h3>Approved tanishlar</h3>
        <div className="card-grid admin-card-grid">
          {approvedAcquaintances.length === 0 ? (
            <p className="empty-message">Hozircha hech kim yo‘q.</p>
          ) : (
            approvedAcquaintances.map((item) => {
              const parsed = parseAcquaintance(item);
              return (
                <article key={item.id} className="person-card admin-person-card">
                  {editingAcquaintanceId === item.id ? (
                    <div className="inline-edit-form">
                      <input
                        type="text"
                        value={acquaintanceDraft.firstName}
                        onChange={(event) =>
                          setAcquaintanceDraft((prev) => ({ ...prev, firstName: event.target.value }))
                        }
                        placeholder="Ism"
                      />
                      <input
                        type="text"
                        value={acquaintanceDraft.lastName}
                        onChange={(event) =>
                          setAcquaintanceDraft((prev) => ({ ...prev, lastName: event.target.value }))
                        }
                        placeholder="Familya"
                      />
                      <input
                        type="number"
                        value={acquaintanceDraft.age}
                        onChange={(event) =>
                          setAcquaintanceDraft((prev) => ({ ...prev, age: event.target.value }))
                        }
                        placeholder="Yosh"
                      />
                      <input
                        type="text"
                        value={acquaintanceDraft.instagram}
                        onChange={(event) =>
                          setAcquaintanceDraft((prev) => ({ ...prev, instagram: event.target.value }))
                        }
                        placeholder="Instagram (username)"
                      />
                      <input
                        type="tel"
                        value={acquaintanceDraft.phone}
                        onChange={(event) =>
                          setAcquaintanceDraft((prev) => ({ ...prev, phone: event.target.value }))
                        }
                        placeholder="Telefon"
                      />
                      <div className="inline-actions">
                        <button type="button" onClick={() => saveAcquaintanceEdit(item.id)}>
                          Saqlash
                        </button>
                        <button type="button" className="danger-btn" onClick={() => setEditingAcquaintanceId(null)}>
                          Bekor qilish
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="person-avatar">{item.firstName.charAt(0)}</div>
                      <div>
                        <h3>
                          {item.firstName} {item.lastName}
                        </h3>
                        <p className="role-tag">Approved</p>
                        <small>
                          {item.age ? `${item.age} yosh` : ''} • 📞 {parsed.cleanPhone}
                          {parsed.instagram && (
                            <>
                              {' '}•{' '}
                              <a
                                href={`https://instagram.com/${parsed.instagram}`}
                                target="_blank"
                                rel="noreferrer"
                                className="admin-ig-tag"
                              >
                                📸 @{parsed.instagram}
                              </a>
                            </>
                          )}
                        </small>
                      </div>
                      <div className="card-actions">
                        <button type="button" onClick={() => startEditingAcquaintance(item)}>
                          Edit
                        </button>
                        <button type="button" className="danger-btn" onClick={() => removeAcquaintance(item.id)}>
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="admin-card approved-card">
        <h3>Dostlar ro’yxati</h3>
        <div className="card-grid admin-card-grid">
          {friends.length === 0 ? (
            <p className="empty-message">Hozircha hech kim yo‘q.</p>
          ) : (
            friends.map((friend) => (
              <article key={friend.id} className="person-card admin-person-card">
                {editingFriendId === friend.id ? (
                  <div className="inline-edit-form">
                    <input
                      type="text"
                      value={friendDraft.name}
                      onChange={(event) => setFriendDraft((prev) => ({ ...prev, name: event.target.value }))}
                    />
                    <select
                      value={friendDraft.relation}
                      onChange={(event) =>
                        setFriendDraft((prev) => ({ ...prev, relation: event.target.value }))
                      }
                    >
                      <option value="Do’st">Do’st</option>
                      <option value="Tanish">Tanish</option>
                      <option value="Yaqin do’st">Yaqin do’st</option>
                    </select>
                    <textarea
                      value={friendDraft.note}
                      onChange={(event) => setFriendDraft((prev) => ({ ...prev, note: event.target.value }))}
                    />
                    <div className="inline-actions">
                      <button type="button" onClick={() => saveFriendEdit(friend.id)}>
                        Saqlash
                      </button>
                      <button type="button" className="danger-btn" onClick={() => setEditingFriendId(null)}>
                        Bekor qilish
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="person-avatar">{friend.name.charAt(0)}</div>
                    <div>
                      <h3>{friend.name}</h3>
                      <p className="role-tag">{friend.relation}</p>
                      <small>{friend.note}</small>
                    </div>
                    <div className="card-actions">
                      <button type="button" onClick={() => startEditingFriend(friend)}>
                        Edit
                      </button>
                      <button type="button" className="danger-btn" onClick={() => removeFriend(friend.id)}>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
