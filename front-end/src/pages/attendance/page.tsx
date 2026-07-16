import { useState, useRef, useContext, useCallback, useEffect } from 'react';
import { AuthContext } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface GpsLocation {
  latitude: number;
  longitude: number;
}

interface PunchRecord {
  sequence: number;
  time: string;
  photo: string | null;
}

interface AttendanceRecordApi {
  id: string;
  userId: string;
  date: string;
  punches: PunchRecord[];
  status: 'on_time' | 'late' | 'early_leave' | 'absent';
  statusLabel: string;
  ipAddress: string | null;
}

function toDisplayTime(time: string): string {
  return time.length >= 5 ? time.slice(0, 5) : time;
}

function getCheckIn(punches: PunchRecord[]): string | null {
  return punches.length > 0 ? toDisplayTime(punches[0].time) : null;
}

function getCheckOut(punches: PunchRecord[]): string | null {
  if (punches.length === 0) {
    return null;
  }

  if (punches.length % 2 === 0) {
    return toDisplayTime(punches[punches.length - 1].time);
  }

  return punches.length >= 2 ? toDisplayTime(punches[punches.length - 2].time) : null;
}

function getAuthHeaders(withJson = false): HeadersInit {
  const token = localStorage.getItem('hrm_auth_token');

  return {
    Accept: 'application/json',
    ...(withJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function AttendancePage() {
  const { user } = useContext(AuthContext);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [currentTime, setCurrentTime] = useState(format(new Date(), 'HH:mm:ss'));
  const [currentDateFormatted, setCurrentDateFormatted] = useState(format(new Date(), 'EEEE, dd/MM/yyyy'));

  const [todayRecord, setTodayRecord] = useState<AttendanceRecordApi | null>(null);
  const [todayPunches, setTodayPunches] = useState<PunchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [gpsLocation, setGpsLocation] = useState<GpsLocation | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [latestPhoto, setLatestPhoto] = useState<string | null>(null);

  const checkInTime = getCheckIn(todayPunches);
  const checkOutTime = getCheckOut(todayPunches);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadTodayAttendance = useCallback(async () => {
    if (!localStorage.getItem('hrm_auth_token')) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/back-end/public/api/attendance/today', {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as { data: AttendanceRecordApi | null };
      setTodayRecord(payload.data);
      setTodayPunches(payload.data?.punches ?? []);
    } catch {
      showToast('error', 'Không thể tải dữ liệu chấm công hôm nay');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTodayAttendance();
  }, [loadTodayAttendance]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(format(now, 'HH:mm:ss'));
      setCurrentDateFormatted(format(now, 'EEEE, dd/MM/yyyy'));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getGpsLocation = useCallback((): Promise<GpsLocation> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Thiết bị không hỗ trợ định vị GPS'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: GpsLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setGpsLocation(loc);
          setGpsError(null);
          resolve(loc);
        },
        (error) => {
          let msg = 'Không thể lấy vị trí GPS';
          if (error.code === error.PERMISSION_DENIED) msg = 'Bạn chưa cấp quyền truy cập vị trí';
          else if (error.code === error.TIMEOUT) msg = 'Lấy vị trí GPS quá thời gian chờ';
          setGpsError(msg);
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, []);

  const stopCameraStream = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
  }, []);

  const submitPunch = useCallback(
    async (photoData: string) => {
      try {
        const response = await fetch('/back-end/public/api/attendance/punches', {
          method: 'POST',
          headers: getAuthHeaders(true),
          body: JSON.stringify({
            photo: photoData,
            gps_latitude: gpsLocation?.latitude ?? null,
            gps_longitude: gpsLocation?.longitude ?? null,
          }),
        });

        const payload = (await response.json()) as { message?: string; data?: AttendanceRecordApi };

        if (!response.ok || !payload.data) {
          throw new Error(payload.message ?? 'Không thể lưu chấm công');
        }

        const updatedRecord = payload.data;
        const updatedPunches = updatedRecord.punches ?? [];

        setTodayRecord(updatedRecord);
        setTodayPunches(updatedPunches);
        setLatestPhoto(photoData);

        const nowDisplay = toDisplayTime(updatedPunches[updatedPunches.length - 1].time);
        const isFirstPunch = updatedPunches.length === 1;

        if (isFirstPunch && updatedRecord.status === 'late') {
          showToast('error', `Check-in lúc ${nowDisplay}. Bạn đã đi muộn!`);
        } else if (isFirstPunch) {
          showToast('success', `Check-in lúc ${nowDisplay}. Chúc bạn một ngày làm việc hiệu quả!`);
        } else {
          const label = updatedPunches.length % 2 === 0 ? 'Check-out' : 'Check-in';
          showToast('success', `${label} lúc ${nowDisplay}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Không thể chấm công';
        showToast('error', message);
      } finally {
        stopCameraStream();
        setIsCapturing(false);
      }
    },
    [gpsLocation?.latitude, gpsLocation?.longitude, stopCameraStream]
  );

  const startCamera = useCallback(async () => {
    if (!window.isSecureContext) {
      showToast('error', 'Camera chi hoat dong tren HTTPS hoac localhost. Vui long mo bang localhost/https.');
      setIsCapturing(false);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      showToast('error', 'Thiết bị không hỗ trợ camera để chấm công');
      setIsCapturing(false);
      return;
    }

    try {
      let stream: MediaStream;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'user' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        // Laptop browsers may ignore facingMode; fallback to any available camera.
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraReady(true);
    } catch (error) {
      const name = error instanceof DOMException ? error.name : '';

      if (name === 'NotAllowedError') {
        showToast('error', 'Trinh duyet dang chan camera. Hay cho phep camera roi thu lai.');
      } else if (name === 'NotFoundError') {
        showToast('error', 'Khong tim thay camera tren laptop.');
      } else if (name === 'NotReadableError') {
        showToast('error', 'Camera dang duoc ung dung khac su dung.');
      } else {
        showToast('error', 'Khong the mo camera. Vui long cap quyen va thu lai.');
      }

      stopCameraStream();
      setIsCapturing(false);
    }
  }, [stopCameraStream]);

  const triggerPunch = useCallback(async () => {
    setIsCapturing(true);
    setIsCameraReady(false);
    setGpsError(null);

    try {
      await getGpsLocation();
    } catch {
      // GPS fail vẫn cho chấm công
    }

    await startCamera();
  }, [getGpsLocation, startCamera]);

  const captureAndPunch = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      showToast('error', 'Camera chưa sẵn sàng. Vui lòng thử lại');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      showToast('error', 'Không thể xử lý ảnh từ camera');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoData = canvas.toDataURL('image/jpeg', 0.9);
    await submitPunch(photoData);
  }, [submitPunch]);

  const cancelCapture = useCallback(() => {
    stopCameraStream();
    setIsCapturing(false);
  }, [stopCameraStream]);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  const getPunchLabel = (index: number): { label: string; icon: string; isIn: boolean } => {
    return index % 2 === 0
      ? { label: 'Check-in', icon: 'ri-login-box-line', isIn: true }
      : { label: 'Check-out', icon: 'ri-logout-box-line', isIn: false };
  };

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Chào buổi sáng' : currentHour < 17 ? 'Chào buổi chiều' : 'Chào buổi tối';

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-heading font-bold text-foreground-950">Chấm công</h1>
          <p className="text-xs text-foreground-500 mt-0.5">
            {greeting}, {user?.name?.split(' ').pop()}
          </p>
        </div>
        <button
          onClick={() => navigate('/attendance/history')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-background-100 border border-background-200/70 text-xs font-medium text-foreground-600 hover:text-foreground-800 hover:bg-background-200 transition-colors duration-150 cursor-pointer whitespace-nowrap"
        >
          <span className="w-4 h-4 flex items-center justify-center">
            <i className="ri-history-line text-sm"></i>
          </span>
          Lịch sử
        </button>
      </div>

      <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white text-center mb-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/4"></div>
        <div className="relative z-10">
          <p className="text-xs text-white/70 mb-1">{currentDateFormatted}</p>
          <p className="text-5xl font-heading font-bold mb-3 tracking-wider">{currentTime}</p>
          <div className="flex items-center justify-center gap-5">
            <div className="text-center">
              <p className="text-[11px] text-white/60">Check-in</p>
              <p className="text-lg font-semibold">{checkInTime || '---'}</p>
            </div>
            <div className="w-px h-10 bg-white/20"></div>
            <div className="text-center">
              <p className="text-[11px] text-white/60">Check-out</p>
              <p className="text-lg font-semibold">{checkOutTime || '---'}</p>
            </div>
            <div className="w-px h-10 bg-white/20"></div>
            <div className="text-center">
              <p className="text-[11px] text-white/60">Số lần chấm</p>
              <p className="text-lg font-semibold">{todayPunches.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5">
        <button
          onClick={triggerPunch}
          disabled={isCapturing || isLoading}
          className="w-full py-4 rounded-2xl font-semibold text-base transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer whitespace-nowrap bg-accent-500 text-white hover:bg-accent-600 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isCapturing ? (
            <>
              <span className="w-6 h-6 flex items-center justify-center">
                <i className="ri-camera-line text-lg animate-pulse"></i>
              </span>
              Đang chụp ảnh...
            </>
          ) : (
            <>
              <span className="w-6 h-6 flex items-center justify-center">
                <i className="ri-fingerprint-line text-xl"></i>
              </span>
              CHẤM CÔNG
            </>
          )}
        </button>
        <p className="text-[11px] text-foreground-400 text-center mt-2">
          {todayPunches.length === 0
            ? 'Chạm để chấm công lần đầu trong ngày'
            : `Đã chấm ${todayPunches.length} lần hôm nay — chạm để tiếp tục`}
        </p>
      </div>

      {isCapturing && (
        <div className="mb-5 p-5 bg-primary-50 border-2 border-primary-300 border-dashed rounded-2xl text-center">
          <p className="text-sm font-semibold text-primary-700 mb-3">Chụp ảnh xác thực chấm công</p>
          <div className="rounded-xl overflow-hidden bg-background-900 aspect-[3/4] mb-3">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
          {!isCameraReady && <p className="text-xs text-primary-500 mb-3">Đang khởi động camera...</p>}
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                void captureAndPunch();
              }}
              disabled={!isCameraReady}
              className="px-4 py-2 rounded-lg bg-accent-500 text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <i className="ri-camera-line mr-1"></i>
              Chụp và chấm công
            </button>
            <button
              type="button"
              onClick={cancelCapture}
              className="px-4 py-2 rounded-lg bg-background-100 text-foreground-700 text-sm font-semibold border border-background-300"
            >
              Hủy
            </button>
          </div>
          <p className="text-xs text-red-500 mt-3 font-medium">
            <i className="ri-error-warning-line mr-1"></i>
            Chỉ hỗ trợ chụp trực tiếp từ camera, không cho tải ảnh từ thư viện.
          </p>
        </div>
      )}

      {todayPunches.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-heading font-semibold text-foreground-950 mb-3">
            Lịch sử chấm công hôm nay
          </h2>
          <div className="space-y-0">
            {todayPunches.map((punch, idx) => {
              const { label, icon, isIn } = getPunchLabel(idx);
              return (
                <div key={punch.sequence} className="relative flex items-start gap-3 pb-3">
                  {idx < todayPunches.length - 1 && (
                    <div className="absolute left-[17px] top-9 w-0.5 h-[calc(100%_-_8px)] bg-background-200/70"></div>
                  )}
                  <span
                    className={`relative z-10 w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0 ${
                      isIn ? 'bg-accent-100' : 'bg-secondary-100'
                    }`}
                  >
                    <i className={`${icon} ${isIn ? 'text-accent-600' : 'text-secondary-600'} text-sm`}></i>
                  </span>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-foreground-950">{toDisplayTime(punch.time)}</span>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          isIn ? 'bg-accent-100 text-accent-700' : 'bg-secondary-100 text-secondary-700'
                        }`}
                      >
                        {label}
                      </span>
                      <span className="text-[11px] text-foreground-400">#{idx + 1}</span>
                    </div>
                    {punch.photo && (
                      <div className="mt-1.5 rounded-lg overflow-hidden w-24 h-16">
                        <img src={punch.photo} alt={`Chấm công lần ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {latestPhoto && !isCapturing && (
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-foreground-700 mb-2">Ảnh chấm công vừa chụp</h3>
          <div className="relative rounded-xl overflow-hidden">
            <img src={latestPhoto} alt="Ảnh chấm công mới nhất" className="w-full h-48 object-cover rounded-xl" />
          </div>
        </div>
      )}

      <div className="mb-5">
        <h2 className="text-sm font-heading font-semibold text-foreground-950 mb-3">Thông tin chấm công</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3.5 bg-background-50 border border-background-200/70 rounded-xl">
            <span className="w-9 h-9 bg-secondary-100 rounded-lg flex items-center justify-center shrink-0">
              <i className="ri-map-pin-line text-lg text-secondary-600"></i>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground-950">Vị trí GPS</p>
              {gpsLocation ? (
                <p className="text-xs text-foreground-500 truncate">
                  {gpsLocation.latitude.toFixed(6)}, {gpsLocation.longitude.toFixed(6)}
                </p>
              ) : gpsError ? (
                <p className="text-xs text-red-500 truncate">{gpsError}</p>
              ) : (
                <p className="text-xs text-foreground-400 truncate">Chưa có dữ liệu vị trí</p>
              )}
            </div>
            {gpsLocation ? (
              <span className="w-5 h-5 flex items-center justify-center">
                <i className="ri-checkbox-circle-fill text-lg text-accent-500"></i>
              </span>
            ) : (
              <span className="w-5 h-5 flex items-center justify-center">
                <i className={`${gpsError ? 'ri-error-warning-fill text-red-400' : 'ri-time-line text-foreground-300'} text-sm`}></i>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 p-3.5 bg-background-50 border border-background-200/70 rounded-xl">
            <span className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
              <i className="ri-camera-line text-lg text-primary-600"></i>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground-950">Tổng số lần chấm hôm nay</p>
              <p className="text-xs text-foreground-500">
                {todayPunches.length === 0
                  ? 'Chưa có lần chấm công nào'
                  : `${todayPunches.length} lần — lần đầu ${toDisplayTime(todayPunches[0].time)}${todayPunches.length > 1 ? `, lần cuối ${toDisplayTime(todayPunches[todayPunches.length - 1].time)}` : ''}`}
              </p>
            </div>
            <span className="w-9 h-9 rounded-lg bg-background-100 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-foreground-700">{todayPunches.length}</span>
            </span>
          </div>

          {todayRecord && (
            <div className="flex items-center gap-3 p-3.5 bg-background-50 border border-background-200/70 rounded-xl">
              <span className="w-9 h-9 bg-accent-100 rounded-lg flex items-center justify-center shrink-0">
                <i className="ri-shield-check-line text-lg text-accent-600"></i>
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground-950">Trạng thái hôm nay</p>
                <p className="text-xs text-foreground-500 truncate">{todayRecord.statusLabel}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-[fadeInUp_0.3s_ease-out] max-w-[390px] w-[calc(100%-32px)]">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg ${
            toast.type === 'success'
              ? 'bg-accent-500 text-white'
              : 'bg-red-500 text-white'
          }`}>
            <span className="w-5 h-5 flex items-center justify-center shrink-0">
              <i className={`${toast.type === 'success' ? 'ri-check-line' : 'ri-error-warning-line'} text-sm`}></i>
            </span>
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-background-50/70 backdrop-blur-[1px] flex items-center justify-center z-40">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
      )}

      {!user?.id && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          Không tìm thấy thông tin người dùng hợp lệ để chấm công.
        </div>
      )}

      {todayRecord?.date !== todayStr && todayRecord !== null && (
        <div className="mt-3 rounded-xl border border-secondary-200 bg-secondary-50 p-3 text-xs text-secondary-700">
          Bản ghi hiện tại không thuộc ngày hôm nay. Vui lòng làm mới trang.
        </div>
      )}
    </div>
  );
}
