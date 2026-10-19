import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseApi_fixed2';
import './LiveVideoRoom.css';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

const VIDEO_CONSTRAINTS = {
  width: { ideal: 1920 },
  height: { ideal: 1080 },
  frameRate: { ideal: 30 },
};

function VideoTile({ stream, label, muted = false, local = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream || null;
  }, [stream]);

  return (
    <div className={`live-video-tile${local ? ' is-local' : ''}`}>
      {stream ? (
        <video ref={videoRef} autoPlay playsInline muted={muted} />
      ) : (
        <div className="live-video-placeholder" aria-hidden="true">
          {label.replace(/^@/, '').charAt(0).toUpperCase() || '?'}
        </div>
      )}
      <span className="live-video-name">{label}{local ? ' (siz)' : ''}</span>
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
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
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

  const startCall = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(getMediaErrorMessage());
      return;
    }

    setError('');
    setIsStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: VIDEO_CONSTRAINTS,
      });
      if (!isMountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsMicEnabled(true);
      setIsCameraEnabled(true);
      setFacingMode('user');
      setIsInRoom(true);
      setRoomStatus('Xonaga ulanmoqda...');
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

  const switchCamera = async () => {
    if (!localStreamRef.current || switchingCameraRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(getMediaErrorMessage());
      return;
    }

    switchingCameraRef.current = true;
    setIsSwitchingCamera(true);
    setError('');
    const nextFacingMode = facingMode === 'user' ? 'environment' : 'user';
    let nextVideoTrack;
    const replacedSenders = [];
    const currentStream = localStreamRef.current;
    const currentVideoTrack = currentStream?.getVideoTracks()[0];

    try {
      if (!currentVideoTrack) throw new Error('The current video track is unavailable.');

      const cameraStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { ...VIDEO_CONSTRAINTS, facingMode: { exact: nextFacingMode } },
      });
      nextVideoTrack = cameraStream.getVideoTracks()[0];
      if (!nextVideoTrack) throw new Error('The selected camera did not provide a video track.');
      nextVideoTrack.enabled = isCameraEnabled;

      for (const connection of peerConnectionsRef.current.values()) {
        const videoSender = connection.getSenders().find((sender) => sender.track?.kind === 'video');
        if (!videoSender) continue;
        await videoSender.replaceTrack(nextVideoTrack);
        replacedSenders.push(videoSender);
      }

      currentStream.removeTrack(currentVideoTrack);
      currentVideoTrack.stop();
      const updatedStream = new MediaStream([...currentStream.getAudioTracks(), nextVideoTrack]);
      localStreamRef.current = updatedStream;
      setLocalStream(updatedStream);
      setFacingMode(nextFacingMode);
    } catch (cameraError) {
      if (nextVideoTrack) {
        await Promise.allSettled(replacedSenders.map((sender) => sender.replaceTrack(currentVideoTrack)));
        nextVideoTrack.stop();
      }
      console.error('Live video camera switch failed:', cameraError);
      if (cameraError?.name === 'OverconstrainedError' || cameraError?.name === 'NotFoundError') {
        setError(nextFacingMode === 'environment'
          ? 'Orqa kamera topilmadi; qurilmangizdagi mavjud kameralarni tekshiring.'
          : 'Old kamera topilmadi; qurilmangizdagi mavjud kameralarni tekshiring.');
      } else {
        setError('Kamera almashtirilmadi. Brauzerda ikkinchi kameraga ruxsat borligini tekshiring.');
      }
    } finally {
      switchingCameraRef.current = false;
      setIsSwitchingCamera(false);
    }
  };

  const leaveRoom = () => {
    setRoomStatus('Xonadan chiqildi');
    setParticipants([]);
    setRemoteStreams([]);
    setIsInRoom(false);
  };

  return (
    <section className="live-video-room" aria-label="Live video suhbati">
      <div className="live-video-room-heading">
        <div>
          <h3>Live video suhbat</h3>
          <p>{isInRoom ? roomStatus : 'Instagram nomingiz bilan boshqalar bilan yuzma-yuz gaplashing.'}</p>
        </div>
        {isInRoom && (
          <span className="live-video-count">
            {participants.length + 1} ishtirokchi
          </span>
        )}
      </div>

      {error && <p className="live-video-error" role="alert">{error}</p>}

      {isInRoom ? (
        <>
          <div className="live-video-grid">
            <VideoTile stream={localStream} label={`@${instagram}`} muted local />
            {remoteStreams.map((peer) => (
              <VideoTile
                key={peer.sessionId}
                stream={peer.stream}
                label={`@${peer.instagram}`}
              />
            ))}
            {participants
              .filter((participant) => !remoteStreams.some((peer) => peer.sessionId === participant.sessionId))
              .map((participant) => (
                <VideoTile
                  key={participant.sessionId}
                  label={`@${participant.instagram || 'foydalanuvchi'}`}
                />
              ))}
            {participants.length === 0 && (
              <div className="live-video-waiting">
                <span aria-hidden="true">⌛</span>
                <strong>Suhbatdosh kutilmoqda</strong>
                <p>Do‘stlaringiz ham “Live chat” tugmasi orqali xonaga qo‘shilsin.</p>
              </div>
            )}
          </div>
          <div className="live-video-controls">
            <button type="button" className={isMicEnabled ? '' : 'is-muted'} onClick={toggleMic}>
              {isMicEnabled ? '🎙 Mikrofonni o‘chirish' : '🔇 Mikrofonni yoqish'}
            </button>
            <button type="button" className={isCameraEnabled ? '' : 'is-muted'} onClick={toggleCamera}>
              {isCameraEnabled ? '📷 Kamerani o‘chirish' : '📷 Kamerani yoqish'}
            </button>
            <button type="button" onClick={() => void switchCamera()} disabled={isSwitchingCamera}>
              {isSwitchingCamera ? '🔄 Almashtirilmoqda...' : '🔄 Kamerani almashtirish'}
            </button>
            <button type="button" className="live-video-leave" onClick={leaveRoom}>
              Suhbatni tugatish
            </button>
          </div>
        </>
      ) : (
        <div className="live-video-start-panel">
          <div className="live-video-start-icon" aria-hidden="true">🎥</div>
          <strong>Kamerali suhbatga qo‘shiling</strong>
          <p>Kamera va mikrofon faqat tugmani bosganingizdan keyin yoqiladi.</p>
          <button type="button" className="live-video-start-button" onClick={() => void startCall()} disabled={isStarting}>
            {isStarting ? 'Ulanmoqda...' : 'Live chatni boshlash'}
          </button>
        </div>
      )}
    </section>
  );
}
