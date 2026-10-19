import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseApi_fixed2';
import './LiveVideoRoom.css';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

const getVideoConstraints = ({ facingMode = 'user', deviceId = null, quality = 'hd' }) => {
  const isHD = quality === 'hd';
  const video = {
    width: isHD ? { ideal: 1280, max: 1920 } : { ideal: 640, max: 854 },
    height: isHD ? { ideal: 720, max: 1080 } : { ideal: 480, max: 480 },
    frameRate: { ideal: 30, max: 30 },
  };

  if (deviceId) {
    video.deviceId = { ideal: deviceId };
  } else if (facingMode) {
    video.facingMode = { ideal: facingMode };
  }

  return video;
};

async function acquireNewVideoTrack({ facingMode, deviceId, quality }) {
  const constraints = getVideoConstraints({ facingMode, deviceId, quality });

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: constraints,
    });
    return stream.getVideoTracks()[0] || null;
  } catch (err) {
    console.warn('Primary camera constraints failed, attempting relaxed fallback:', err);
    try {
      const fallbackStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: facingMode ? { facingMode: { ideal: facingMode } } : true,
      });
      return fallbackStream.getVideoTracks()[0] || null;
    } catch (fallbackErr) {
      console.warn('Relaxed camera constraints failed, attempting basic video:', fallbackErr);
      const basicStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true,
      });
      return basicStream.getVideoTracks()[0] || null;
    }
  }
}

function VideoTile({
  stream,
  label,
  muted = false,
  local = false,
  isCameraEnabled = true,
  isMicEnabled = true,
  isMirrored = false,
  fitMode = 'cover',
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream || null;
    }
  }, [stream]);

  const hasVideoTrack = stream?.getVideoTracks?.()?.some((t) => t.readyState === 'live');
  const showVideo = Boolean(stream && hasVideoTrack && (!local || isCameraEnabled));

  return (
    <div className={`live-video-tile${local ? ' is-local' : ''} fit-${fitMode}`}>
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`live-video-element${isMirrored ? ' is-mirrored' : ''}`}
        />
      ) : (
        <div className="live-video-placeholder-wrap">
          <div className="live-video-placeholder" aria-hidden="true">
            {label.replace(/^@/, '').charAt(0).toUpperCase() || '?'}
          </div>
          {local && !isCameraEnabled && (
            <span className="live-video-state-badge">
              📷 Kamera o‘chiq
            </span>
          )}
        </div>
      )}

      <div className="live-video-tile-footer">
        <span className="live-video-name">{label}{local ? ' (siz)' : ''}</span>
        {local && !isMicEnabled && (
          <span className="live-video-muted-pill" title="Mikrofon o‘chiq">
            🔇 O‘chiq
          </span>
        )}
      </div>
    </div>
  );
}

function getMediaErrorMessage(error) {
  if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
    return 'Kamera va mikrofon ruxsatini bering, so‘ng qayta urinib ko‘ring.';
  }
  if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
    return 'Kamera yoki mikrofon topilmadi. Qurilmalarni tekshirib, qayta urinib ko‘ring.';
  }
  if (error?.name === 'OverconstrainedError' || error?.name === 'ConstraintNotSatisfiedError') {
    return 'Tanlangan kamera sozlamasi qurilmangizda qo‘llab-quvvatlanmadi. Boshqa kamerani tanlab ko‘ring.';
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return 'Brauzer video qo‘ng‘iroqni qo‘llamaydi. Saytni HTTPS orqali oching yoki zamonaviy brauzerdan foydalaning.';
  }
  return 'Kamera yoki mikrofonni ishga tushirib bo‘lmadi. Qurilma ruxsatlarini tekshirib, qayta urinib ko‘ring.';
}

export default function LiveVideoRoom({ instagram }) {
  const [sessionId] = useState(() => (
    window.crypto?.randomUUID?.()
      || `video-${Date.now()}-${Math.random().toString(36).slice(2)}`
  ));
  const [localStream, setLocalStream] = useState(null);
  const [isInRoom, setIsInRoom] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [roomStatus, setRoomStatus] = useState('Kamerani yoqing');
  const [error, setError] = useState('');
  const [participants, setParticipants] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState([]);

  // Kamera va mikrofon sozlamalari
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [isMirrored, setIsMirrored] = useState(true);
  const [fitMode, setFitMode] = useState('cover');
  const [videoQuality, setVideoQuality] = useState('hd');
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const switchingCameraRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const enumerateCameras = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setAvailableCameras(videoInputs);
    } catch (err) {
      console.warn('Failed to enumerate cameras:', err);
    }
  }, []);

  const startCall = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(getMediaErrorMessage());
      return;
    }

    setError('');
    setIsStarting(true);
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: getVideoConstraints({ facingMode: 'user', quality: videoQuality }),
        });
      } catch (primaryErr) {
        console.warn('HD camera request failed, falling back to basic front camera:', primaryErr);
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { facingMode: { ideal: 'user' } },
        });
      }

      if (!isMountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsMicEnabled(true);
      setIsCameraEnabled(true);
      setFacingMode('user');
      setIsMirrored(true);
      setIsInRoom(true);
      setRoomStatus('Xonaga ulanmoqda...');

      void enumerateCameras();
    } catch (mediaError) {
      console.error('Live video media access failed:', mediaError);
      setError(getMediaErrorMessage(mediaError));
    } finally {
      setIsStarting(false);
    }
  };

  useEffect(() => {
    if (!isInRoom || !localStreamRef.current) return undefined;

    let isDisposed = false;
    const peerConnections = new Map();
    peerConnectionsRef.current = peerConnections;
    const pendingCandidates = new Map();
    const startedOffers = new Set();
    const channel = supabase.channel('myweb-live-video-room', {
      config: {
        presence: { key: sessionId },
        broadcast: { self: false },
      },
    });

    const reportSignalError = (signalError) => {
      if (!isDisposed) {
        console.error('Live video signaling failed:', signalError);
        setError('Video xonaga ulanishda muammo yuz berdi. Internet aloqasini tekshiring.');
      }
    };

    const sendSignal = async (payload) => {
      const result = await channel.send({
        type: 'broadcast',
        event: 'signal',
        payload: { ...payload, from: sessionId },
      });
      if (result !== 'ok') throw new Error(`Realtime signal failed: ${result}`);
    };

    const updateRemoteStream = (peerId, peerInstagram, stream) => {
      setRemoteStreams((current) => {
        const existing = current.find((peer) => peer.sessionId === peerId);
        if (existing) {
          return current.map((peer) => (
            peer.sessionId === peerId ? { ...peer, instagram: peerInstagram, stream } : peer
          ));
        }
        return [...current, { sessionId: peerId, instagram: peerInstagram, stream }];
      });
    };

    const removePeer = (peerId) => {
      const connection = peerConnections.get(peerId);
      if (connection) {
        connection.ontrack = null;
        connection.onicecandidate = null;
        connection.onconnectionstatechange = null;
        connection.close();
        peerConnections.delete(peerId);
      }
      pendingCandidates.delete(peerId);
      startedOffers.delete(peerId);
      setRemoteStreams((current) => current.filter((peer) => peer.sessionId !== peerId));
    };

    const createPeerConnection = (peerId, peerInstagram) => {
      const existing = peerConnections.get(peerId);
      if (existing) return existing;

      const connection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peerConnections.set(peerId, connection);
      const currentStream = localStreamRef.current;
      currentStream.getTracks().forEach((track) => connection.addTrack(track, currentStream));
      connection.ontrack = (event) => {
        updateRemoteStream(peerId, peerInstagram, event.streams[0] || new MediaStream([event.track]));
      };
      connection.onicecandidate = (event) => {
        if (event.candidate) {
          void sendSignal({
            to: peerId,
            instagram,
            type: 'candidate',
            candidate: event.candidate.toJSON(),
          }).catch(reportSignalError);
        }
      };
      connection.onconnectionstatechange = () => {
        if (connection.connectionState === 'failed' || connection.connectionState === 'closed') {
          removePeer(peerId);
        }
      };
      return connection;
    };

    const flushPendingCandidates = async (peerId, connection) => {
      const candidates = pendingCandidates.get(peerId) || [];
      pendingCandidates.delete(peerId);
      for (const candidate of candidates) {
        await connection.addIceCandidate(candidate);
      }
    };

    const handleSignal = async (payload) => {
      if (
        isDisposed
        || !payload
        || payload.to !== sessionId
        || payload.from === sessionId
        || typeof payload.from !== 'string'
      ) return;

      const peerId = payload.from;
      const peerInstagram = typeof payload.instagram === 'string' ? payload.instagram : 'foydalanuvchi';
      const connection = createPeerConnection(peerId, peerInstagram);

      if (payload.type === 'offer' && payload.description?.type === 'offer') {
        await connection.setRemoteDescription(payload.description);
        await flushPendingCandidates(peerId, connection);
        const answer = await connection.createAnswer();
        await connection.setLocalDescription(answer);
        await sendSignal({ to: peerId, instagram, type: 'answer', description: connection.localDescription });
      } else if (payload.type === 'answer' && payload.description?.type === 'answer') {
        if (connection.signalingState !== 'have-local-offer') return;
        await connection.setRemoteDescription(payload.description);
        await flushPendingCandidates(peerId, connection);
      } else if (payload.type === 'candidate' && payload.candidate) {
        if (connection.remoteDescription) {
          await connection.addIceCandidate(payload.candidate);
        } else {
          pendingCandidates.set(peerId, [...(pendingCandidates.get(peerId) || []), payload.candidate]);
        }
      }
    };

    const syncPeers = async () => {
      if (isDisposed) return;

      const peerById = new Map();
      Object.values(channel.presenceState()).flat().forEach((presence) => {
        if (presence.sessionId && presence.sessionId !== sessionId) {
          peerById.set(presence.sessionId, presence);
        }
      });

      const peers = [...peerById.values()];
      setParticipants(peers);

      for (const peerId of peerConnections.keys()) {
        if (!peerById.has(peerId)) removePeer(peerId);
      }

      for (const peer of peers) {
        if (sessionId.localeCompare(peer.sessionId) < 0 && !startedOffers.has(peer.sessionId)) {
          startedOffers.add(peer.sessionId);
          try {
            const connection = createPeerConnection(peer.sessionId, peer.instagram || 'foydalanuvchi');
            const offer = await connection.createOffer();
            await connection.setLocalDescription(offer);
            await sendSignal({
              to: peer.sessionId,
              instagram,
              type: 'offer',
              description: connection.localDescription,
            });
          } catch (signalError) {
            startedOffers.delete(peer.sessionId);
            reportSignalError(signalError);
          }
        }
      }
    };

    channel
      .on('broadcast', { event: 'signal' }, ({ payload }) => {
        void handleSignal(payload).catch(reportSignalError);
      })
      .on('presence', { event: 'sync' }, () => {
        void syncPeers().catch(reportSignalError);
      })
      .subscribe(async (status) => {
        if (isDisposed) return;
        if (status === 'SUBSCRIBED') {
          setRoomStatus('Video xonaga ulandi');
          try {
            await channel.track({
              sessionId,
              instagram,
              onlineAt: new Date().toISOString(),
            });
            await syncPeers();
          } catch (signalError) {
            reportSignalError(signalError);
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRoomStatus('Ulanish uzildi');
          reportSignalError(new Error(`Realtime channel status: ${status}`));
        }
      });

    return () => {
      isDisposed = true;
      peerConnections.forEach((connection) => {
        connection.ontrack = null;
        connection.onicecandidate = null;
        connection.onconnectionstatechange = null;
        connection.close();
      });
      peerConnections.clear();
      if (peerConnectionsRef.current === peerConnections) peerConnectionsRef.current = new Map();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [instagram, isInRoom, sessionId]);

  const toggleMic = useCallback(() => {
    const nextEnabled = !isMicEnabled;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = nextEnabled;
    });
    setIsMicEnabled(nextEnabled);
  }, [isMicEnabled]);

  const toggleCamera = useCallback(() => {
    const nextEnabled = !isCameraEnabled;
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = nextEnabled;
    });
    setIsCameraEnabled(nextEnabled);
  }, [isCameraEnabled]);

  const applyCameraSwitch = async ({ newFacingMode, newDeviceId, newQuality }) => {
    if (!localStreamRef.current || switchingCameraRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(getMediaErrorMessage());
      return;
    }

    switchingCameraRef.current = true;
    setIsSwitchingCamera(true);
    setError('');

    const targetFacing = newFacingMode !== undefined ? newFacingMode : facingMode;
    const targetDeviceId = newDeviceId !== undefined ? newDeviceId : selectedDeviceId;
    const targetQuality = newQuality !== undefined ? newQuality : videoQuality;

    let nextVideoTrack = null;
    const replacedSenders = [];
    const currentStream = localStreamRef.current;
    const currentVideoTrack = currentStream?.getVideoTracks()[0];

    try {
      nextVideoTrack = await acquireNewVideoTrack({
        facingMode: targetFacing,
        deviceId: targetDeviceId,
        quality: targetQuality,
      });

      if (!nextVideoTrack) {
        throw new Error('Yangi video oqimi topilmadi.');
      }

      nextVideoTrack.enabled = isCameraEnabled;

      for (const connection of peerConnectionsRef.current.values()) {
        const videoSender = connection.getSenders().find((sender) => sender.track?.kind === 'video');
        if (!videoSender) continue;
        await videoSender.replaceTrack(nextVideoTrack);
        replacedSenders.push(videoSender);
      }

      if (currentVideoTrack) {
        currentStream.removeTrack(currentVideoTrack);
        currentVideoTrack.stop();
      }

      const updatedStream = new MediaStream([...currentStream.getAudioTracks(), nextVideoTrack]);
      localStreamRef.current = updatedStream;
      setLocalStream(updatedStream);

      if (newFacingMode !== undefined) {
        setFacingMode(newFacingMode);
        setIsMirrored(newFacingMode === 'user');
      }
      if (newDeviceId !== undefined) setSelectedDeviceId(newDeviceId);
      if (newQuality !== undefined) setVideoQuality(newQuality);
    } catch (cameraError) {
      console.error('Camera switch failed:', cameraError);
      if (nextVideoTrack) {
        if (currentVideoTrack) {
          await Promise.allSettled(replacedSenders.map((sender) => sender.replaceTrack(currentVideoTrack)));
        }
        nextVideoTrack.stop();
      }
      setError('Kamerani almashtirib bo‘lmadi. Qurilma ruxsatlarini tekshiring.');
    } finally {
      switchingCameraRef.current = false;
      setIsSwitchingCamera(false);
    }
  };

  const quickFlipCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    void applyCameraSwitch({ newFacingMode: nextMode, newDeviceId: null });
  };

  const leaveRoom = () => {
    setRoomStatus('Xonadan chiqildi');
    setParticipants([]);
    setRemoteStreams([]);
    setIsInRoom(false);
    setIsSettingsOpen(false);
  };

  return (
    <section className="live-video-room" aria-label="Live video suhbati">
      <div className="live-video-room-heading">
        <div className="live-video-heading-text">
          <h3>Live video suhbat</h3>
          <p>{isInRoom ? roomStatus : 'Instagram nomingiz bilan boshqalar bilan yuzma-yuz gaplashing.'}</p>
        </div>
        {isInRoom && (
          <div className="live-video-heading-badges">
            <span className="live-video-count">
              {participants.length + 1} ishtirokchi
            </span>
          </div>
        )}
      </div>

      {error && <p className="live-video-error" role="alert">{error}</p>}

      {isInRoom ? (
        <>
          <div className={`live-video-grid grid-count-${Math.min(remoteStreams.length + 1, 4)}`}>
            <VideoTile
              stream={localStream}
              label={`@${instagram}`}
              muted
              local
              isCameraEnabled={isCameraEnabled}
              isMicEnabled={isMicEnabled}
              isMirrored={isMirrored}
              fitMode={fitMode}
            />
            {remoteStreams.map((peer) => (
              <VideoTile
                key={peer.sessionId}
                stream={peer.stream}
                label={`@${peer.instagram}`}
                fitMode={fitMode}
              />
            ))}
            {participants
              .filter((participant) => !remoteStreams.some((peer) => peer.sessionId === participant.sessionId))
              .map((participant) => (
                <VideoTile
                  key={participant.sessionId}
                  label={`@${participant.instagram || 'foydalanuvchi'}`}
                  fitMode={fitMode}
                />
              ))}
            {participants.length === 0 && (
              <div className="live-video-waiting">
                <span aria-hidden="true">⌛</span>
                <strong>Suhbatdosh kutilmoqda</strong>
                <p>Do‘stlaringiz ham “Live chat” orqali xonaga qo‘shilsin.</p>
              </div>
            )}
          </div>

          {/* Pastki qulay boshqaruv paneli (mobil va kompyuter uchun qulay) */}
          <div className="live-video-controls-bar">
            <button
              type="button"
              className={`live-ctrl-btn${isMicEnabled ? '' : ' is-muted'}`}
              onClick={toggleMic}
              aria-label={isMicEnabled ? 'Mikrofonni o‘chirish' : 'Mikrofonni yoqish'}
            >
              <span className="live-ctrl-icon">{isMicEnabled ? '🎙' : '🔇'}</span>
              <span className="live-ctrl-label">{isMicEnabled ? 'Mikrofon' : 'O‘chiq'}</span>
            </button>

            <button
              type="button"
              className={`live-ctrl-btn${isCameraEnabled ? '' : ' is-muted'}`}
              onClick={toggleCamera}
              aria-label={isCameraEnabled ? 'Kamerani o‘chirish' : 'Kamerani yoqish'}
            >
              <span className="live-ctrl-icon">{isCameraEnabled ? '📷' : '🚫'}</span>
              <span className="live-ctrl-label">{isCameraEnabled ? 'Kamera' : 'O‘chiq'}</span>
            </button>

            <button
              type="button"
              className="live-ctrl-btn"
              onClick={quickFlipCamera}
              disabled={isSwitchingCamera || !isCameraEnabled}
              aria-label="Kamerani almashtirish (Oldi / Orqa)"
            >
              <span className={`live-ctrl-icon${isSwitchingCamera ? ' is-spinning' : ''}`}>🔄</span>
              <span className="live-ctrl-label">
                {isSwitchingCamera ? 'Almash...' : facingMode === 'user' ? 'Oldi' : 'Orqa'}
              </span>
            </button>

            <button
              type="button"
              className={`live-ctrl-btn${isSettingsOpen ? ' is-active' : ''}`}
              onClick={() => setIsSettingsOpen((prev) => !prev)}
              aria-label="Kamera sozlamalari"
            >
              <span className="live-ctrl-icon">⚙️</span>
              <span className="live-ctrl-label">Sozlama</span>
            </button>

            <button
              type="button"
              className="live-ctrl-btn live-ctrl-leave"
              onClick={leaveRoom}
              aria-label="Suhbatni tugatish"
            >
              <span className="live-ctrl-icon">📞</span>
              <span className="live-ctrl-label">Chiqish</span>
            </button>
          </div>

          {/* Kamera sozlamalari oynasi (Sheet / Modal) */}
          {isSettingsOpen && (
            <div className="live-video-settings-overlay" onClick={() => setIsSettingsOpen(false)}>
              <div
                className="live-video-settings-panel"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Kamera sozlamalari"
              >
                <div className="live-settings-header">
                  <div className="live-settings-title-wrap">
                    <span className="live-settings-icon" aria-hidden="true">⚙️</span>
                    <h4>Kamera sozlamalari</h4>
                  </div>
                  <button
                    type="button"
                    className="live-settings-close-btn"
                    onClick={() => setIsSettingsOpen(false)}
                    aria-label="Yopish"
                  >
                    ×
                  </button>
                </div>

                <div className="live-settings-body">
                  {/* Kamera yo'nalishi */}
                  <div className="live-settings-group">
                    <label className="live-settings-label">Kamera yo‘nalishi:</label>
                    <div className="live-settings-segmented">
                      <button
                        type="button"
                        className={`segmented-opt${facingMode === 'user' ? ' is-selected' : ''}`}
                        onClick={() => void applyCameraSwitch({ newFacingMode: 'user', newDeviceId: null })}
                        disabled={isSwitchingCamera}
                      >
                        🤳 Old kamera (Selfie)
                      </button>
                      <button
                        type="button"
                        className={`segmented-opt${facingMode === 'environment' ? ' is-selected' : ''}`}
                        onClick={() => void applyCameraSwitch({ newFacingMode: 'environment', newDeviceId: null })}
                        disabled={isSwitchingCamera}
                      >
                        📷 Orqa kamera (Asosiy)
                      </button>
                    </div>
                  </div>

                  {/* Qurilmalar ro'yxati (agar bir nechta bo'lsa) */}
                  {availableCameras.length > 1 && (
                    <div className="live-settings-group">
                      <label className="live-settings-label" htmlFor="camera-device-select">
                        Aniq kamera qurilmasi:
                      </label>
                      <select
                        id="camera-device-select"
                        className="live-settings-select"
                        value={selectedDeviceId || ''}
                        onChange={(e) => void applyCameraSwitch({ newDeviceId: e.target.value || null })}
                        disabled={isSwitchingCamera}
                      >
                        <option value="">Avtomatik tanlash</option>
                        {availableCameras.map((cam, idx) => (
                          <option key={cam.deviceId || idx} value={cam.deviceId}>
                            {cam.label || `Kamera ${idx + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Kadr rejimi: To'liq qoplash vs Asl o'lcham */}
                  <div className="live-settings-group">
                    <label className="live-settings-label">Kadrni ko‘rsatish usuli:</label>
                    <div className="live-settings-segmented">
                      <button
                        type="button"
                        className={`segmented-opt${fitMode === 'cover' ? ' is-selected' : ''}`}
                        onClick={() => setFitMode('cover')}
                      >
                        📱 Ekranni to‘ldirish
                      </button>
                      <button
                        type="button"
                        className={`segmented-opt${fitMode === 'contain' ? ' is-selected' : ''}`}
                        onClick={() => setFitMode('contain')}
                      >
                        🔍 To‘liq kadr (kesilmasin)
                      </button>
                    </div>
                    <small className="live-settings-hint">
                      {fitMode === 'cover'
                        ? 'Tasvir ekranni to‘ldiradi (telefonlar uchun standart qulay rejim).'
                        : 'Kadr chetlari kesilmaydi, yuzingiz to‘liq sig‘adi.'}
                    </small>
                  </div>

                  {/* Oyna effekti */}
                  <div className="live-settings-group">
                    <label className="live-settings-toggle-row">
                      <div>
                        <span className="live-settings-label">Oyna effekti (Mirror)</span>
                        <small className="live-settings-hint">Old kamerada tasvirni o‘ng/chap akslantirish</small>
                      </div>
                      <input
                        type="checkbox"
                        className="live-settings-checkbox"
                        checked={isMirrored}
                        onChange={(e) => setIsMirrored(e.target.checked)}
                      />
                    </label>
                  </div>

                  {/* Video sifati */}
                  <div className="live-settings-group">
                    <label className="live-settings-label">Video sifati:</label>
                    <div className="live-settings-segmented">
                      <button
                        type="button"
                        className={`segmented-opt${videoQuality === 'hd' ? ' is-selected' : ''}`}
                        onClick={() => void applyCameraSwitch({ newQuality: 'hd' })}
                        disabled={isSwitchingCamera}
                      >
                        ✨ HD (Tiniq tasvir)
                      </button>
                      <button
                        type="button"
                        className={`segmented-opt${videoQuality === 'sd' ? ' is-selected' : ''}`}
                        onClick={() => void applyCameraSwitch({ newQuality: 'sd' })}
                        disabled={isSwitchingCamera}
                      >
                        ⚡ Standart (Tejamkor)
                      </button>
                    </div>
                    <small className="live-settings-hint">
                      Agar internet tezligi past bo‘lsa, Standart rejim qotmaslikka yordam beradi.
                    </small>
                  </div>
                </div>

                <div className="live-settings-footer">
                  <button
                    type="button"
                    className="live-settings-done-btn"
                    onClick={() => setIsSettingsOpen(false)}
                  >
                    Saqlash va yopish
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="live-video-start-panel">
          <div className="live-video-start-icon" aria-hidden="true">🎥</div>
          <strong>Kamerali suhbatga qo‘shiling</strong>
          <p>Kamera va mikrofon faqat tugmani bosganingizdan keyin ishga tushadi.</p>
          <button
            type="button"
            className="live-video-start-button"
            onClick={() => void startCall()}
            disabled={isStarting}
          >
            {isStarting ? 'Ulanmoqda...' : 'Live chatni boshlash'}
          </button>
        </div>
      )}
    </section>
  );
}
