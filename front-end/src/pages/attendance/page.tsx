import { useState, useRef, useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '@/hooks/useAuth';
import { mockAttendance, type PunchRecord, getCheckIn, getCheckOut } from '@/mocks/attendance';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface GpsLocation {
  latitude: number;
  longitude: number;
}

export default function AttendancePage() {
  const { user } = useContext(AuthContext);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const currentTime = format(new Date(), 'HH:mm:ss');
  const currentDateFormatted = format(new Date(), 'EEEE, dd/MM/yyyy');

  const userAttendance = mockAttendance.filter((a) => a.userId === user?.id);
  const todayRecord = userAttendance.find((a) => a.date === todayStr);

  const [todayPunches, setTodayPunches] = useState<PunchRecord[]>(todayRecord?.punches || []);
  const [gpsLocation, setGpsLocation] = useState<GpsLocation | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [latestPhoto, setLatestPhoto] = useState<string | null>(null);

  const checkInTime = getCheckIn({ ...todayRecord, punches: todayPunches } as typeof todayRecord);
  const checkOutTime = getCheckOut({ ...todayRecord, punches: todayPunches } as typeof todayRecord);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

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

  const triggerPunch = useCallback(async () => {
    setIsCapturing(true);
    setGpsError(null);

    try {
      await getGpsLocation();
    } catch {
      // GPS fail vẫn cho chấm công
    }

    setTimeout(() => {
      fileInputRef.current?.click();
    }, 200);
  }, [getGpsLocation]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setIsCapturing(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const photoData = ev.target?.result as string;
      const now = format(new Date(), 'HH:mm');
      const hour = new Date().getHours();
      const minute = new Date().getMinutes();

      const newPunch: PunchRecord = { time: now, photo: photoData };
      const updatedPunches = [...todayPunches, newPunch];
      setTodayPunches(updatedPunches);
      setLatestPhoto(photoData);

      const isFirstPunch = todayPunches.length === 0;

      if (isFirstPunch) {
        const isLate = hour > 8 || (hour === 8 && minute > 0);
        if (!isLate) {
          showToast('success', `Check-in lúc ${now}. Chúc bạn một ngày làm việc hiệu quả!`);
        } else {
          showToast('error', `Check-in lúc ${now}. Bạn đã đi muộn!`);
        }
      } else {
        const newIndex = updatedPunches.length - 1;
        const label = newIndex % 2 === 0 ? 'Check-in' : 'Check-out';
        showToast('success', `${label} lúc ${now}`);
      }

      setIsCapturing(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const getPunchLabel = (index: number, _total: number): { label: string; icon: string; isIn: boolean } => {
    // Strict alternating: index 0 = check-in, 1 = check-out, 2 = check-in, 3 = check-out...
    return index % 2 === 0
      ? { label: 'Check-in', icon: 'ri-login-box-line', isIn: true }
      : { label: 'Check-out', icon: 'ri-logout-box-line', isIn: false };
  };

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Chào buổi sáng' : currentHour < 17 ? 'Chào buổi chiều' : 'Chào buổi tối';

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
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

      {/* Current time display */}
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

      {/* Single punch button */}
      <div className="mb-5">
        <button
          onClick={triggerPunch}
          disabled={isCapturing}
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

      {/* Capturing overlay */}
      {isCapturing && (
        <div className="mb-5 p-5 bg-primary-50 border-2 border-primary-300 border-dashed rounded-2xl text-center">
          <span className="w-14 h-14 mx-auto flex items-center justify-center mb-3">
            <i className="ri-camera-line text-4xl text-primary-500 animate-pulse"></i>
          </span>
          <p className="text-sm font-semibold text-primary-700 mb-1">Đang chụp ảnh chấm công</p>
          <p className="text-xs text-primary-500">
            Vui lòng chụp ảnh khuôn mặt để xác thực lần chấm công #{todayPunches.length + 1}
          </p>
          <p className="text-xs text-red-500 mt-2 font-medium">
            <i className="ri-error-warning-line mr-1"></i>
            Chỉ ảnh chụp mới hợp lệ. Nếu hủy, thao tác sẽ không được ghi nhận.
          </p>
        </div>
      )}

      {/* Today's punch timeline */}
      {todayPunches.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-heading font-semibold text-foreground-950 mb-3">
            Lịch sử chấm công hôm nay
          </h2>
          <div className="space-y-0">
            {todayPunches.map((punch, idx) => {
              const { label, icon, isIn } = getPunchLabel(idx, todayPunches.length);
              return (
                <div key={idx} className="relative flex items-start gap-3 pb-3">
                  {/* Timeline line */}
                  {idx < todayPunches.length - 1 && (
                    <div className="absolute left-[17px] top-9 w-0.5 h-[calc(100%_-_8px)] bg-background-200/70"></div>
                  )}
                  {/* Dot */}
                  <span
                    className={`relative z-10 w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0 ${
                      isIn ? 'bg-accent-100' : 'bg-secondary-100'
                    }`}
                  >
                    <i className={`${icon} ${isIn ? 'text-accent-600' : 'text-secondary-600'} text-sm`}></i>
                  </span>
                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-foreground-950">{punch.time}</span>
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

      {/* Latest photo preview */}
      {latestPhoto && !isCapturing && (
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-foreground-700 mb-2">Ảnh chấm công vừa chụp</h3>
          <div className="relative rounded-xl overflow-hidden">
            <img src={latestPhoto} alt="Ảnh chấm công mới nhất" className="w-full h-48 object-cover rounded-xl" />
          </div>
        </div>
      )}

      {/* GPS Status */}
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
                  : `${todayPunches.length} lần — lần đầu ${todayPunches[0].time}${todayPunches.length > 1 ? `, lần cuối ${todayPunches[todayPunches.length - 1].time}` : ''}`}
              </p>
            </div>
            <span className="w-9 h-9 rounded-lg bg-background-100 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-foreground-700">{todayPunches.length}</span>
            </span>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Toast notification */}
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
    </div>
  );
}