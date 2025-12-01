import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Settings, BarChart2, Download, Trash2, X, Clock, Plus, Timer, ClipboardList, Bell, RotateCcw } from 'lucide-react';
import { isSameDay, format, differenceInMinutes, setHours, setMinutes } from 'date-fns';

// --- 默认配置 ---
const DEFAULT_CATEGORIES = [
  { id: 'coding', label: '编程开发', icon: '💻', color: 'bg-blue-100 text-blue-600' },
  { id: 'study', label: '学习阅读', icon: '📚', color: 'bg-green-100 text-green-600' },
  { id: 'meeting', label: '会议沟通', icon: '🗣️', color: 'bg-yellow-100 text-yellow-600' },
  { id: 'writing', label: '写作文档', icon: '✍️', color: 'bg-purple-100 text-purple-600' },
  { id: 'email', label: '邮件杂务', icon: '📧', color: 'bg-orange-100 text-orange-600' },
  { id: 'break', label: '休息摸鱼', icon: '☕', color: 'bg-gray-100 text-gray-600' },
  { id: 'fitness', label: '运动健身', icon: '🏃', color: 'bg-red-100 text-red-600' },
  { id: 'design', label: '创意设计', icon: '🎨', color: 'bg-pink-100 text-pink-600' },
];

// --- UI Sub-components ---

const RingProgress = ({ radius, stroke, progress, children }) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      {/* 软阴影背景圆环 (凹槽) */}
      <div
        className="absolute rounded-full soft-shadow-in"
        style={{ width: radius * 2, height: radius * 2 }}
      ></div>

      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90 transition-all duration-500 ease-in-out relative z-10"
      >
        {/* 进度条：带有渐变和内发光效果 */}
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" /> {/* Sky-400 */}
            <stop offset="100%" stopColor="#3b82f6" /> {/* Blue-500 */}
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        <circle
          stroke="url(#progressGradient)"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          filter="url(#glow)"
          className="transition-all duration-1000 ease-out drop-shadow-md opacity-90"
        />
      </svg>
      
      {/* 内层内容区域 */}
      <div className="absolute inset-0 flex items-center justify-center z-20">{children}</div>
    </div>
  );
};

const LogModal = ({ note, setNote, saveLog, setShowLogModal, initialStartTime, initialEndTime, isManual }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [customLabel, setCustomLabel] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  
  // Manual Time Entry State
  const [startTimeStr, setStartTimeStr] = useState(initialStartTime ? format(initialStartTime, 'HH:mm') : format(new Date(), 'HH:mm'));
  const [endTimeStr, setEndTimeStr] = useState(initialEndTime ? format(initialEndTime, 'HH:mm') : format(new Date(), 'HH:mm'));

  const calculateDuration = () => {
    const now = new Date();
    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);
    
    const start = setMinutes(setHours(now, startH), startM);
    const end = setMinutes(setHours(now, endH), endM);
    
    let diff = differenceInMinutes(end, start);
    if (diff < 0) diff += 24 * 60; // Handle day crossing roughly
    return diff;
  };

  const handleSave = () => {
    let manualDuration = null;
    if (isManual) {
        manualDuration = calculateDuration();
        if (manualDuration <= 0) {
            alert("结束时间必须晚于开始时间");
            return;
        }
    }

    if (isCustom && customLabel.trim()) {
      saveLog({
        id: `custom-${Date.now()}`,
        label: customLabel,
        icon: '✨',
        color: 'bg-slate-100 text-slate-800',
      }, manualDuration);
    } else if (selectedCategory) {
      saveLog(selectedCategory, manualDuration);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-md flex items-center justify-center z-50 fade-in">
      <div className="bg-[#eef2f6] p-8 rounded-3xl shadow-2xl w-full max-w-md mx-4 scale-in border border-white/50 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 text-center tracking-tight">
          {isManual ? '补录时间' : '记录你的时间'}
        </h2>

        {isManual && (
            <div className="flex items-center justify-center gap-4 mb-6 bg-white/50 p-4 rounded-2xl soft-shadow-in">
                <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">开始</label>
                    <input 
                        type="time" 
                        value={startTimeStr}
                        onChange={(e) => setStartTimeStr(e.target.value)}
                        className="bg-transparent font-bold text-slate-700 outline-none text-xl"
                    />
                </div>
                <div className="text-slate-300 font-bold">-</div>
                <div className="flex flex-col text-right">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">结束</label>
                    <input 
                        type="time" 
                        value={endTimeStr}
                        onChange={(e) => setEndTimeStr(e.target.value)}
                        className="bg-transparent font-bold text-slate-700 outline-none text-xl text-right"
                    />
                </div>
            </div>
        )}
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          {DEFAULT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                setIsCustom(false);
              }}
              className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
                !isCustom && selectedCategory?.id === cat.id
                  ? 'soft-shadow-pressed text-sky-500 transform scale-95 ring-1 ring-sky-200'
                  : 'soft-shadow-out text-slate-500 hover:transform hover:-translate-y-1'
              }`}
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-xs font-semibold tracking-wide">{cat.label}</span>
            </button>
          ))}
          {/* 自定义按钮 */}
          <button
            type="button"
            onClick={() => {
              setIsCustom(true);
              setSelectedCategory(null);
            }}
            className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
              isCustom
                ? 'soft-shadow-pressed text-sky-500 transform scale-95 ring-1 ring-sky-200'
                : 'soft-shadow-out text-slate-400 hover:transform hover:-translate-y-1'
            }`}
          >
            <span className="text-2xl"><Plus size={24} /></span>
            <span className="text-xs font-semibold tracking-wide">自定义</span>
          </button>
        </div>

        {/* 动态输入区 */}
        <div className="space-y-4 mb-8">
           {isCustom && (
             <div className="animate-fadeIn">
               <input
                 type="text"
                 placeholder="输入新的分类名称..."
                 value={customLabel}
                 onChange={(e) => setCustomLabel(e.target.value)}
                 autoFocus
                 className="w-full soft-shadow-in border-none p-4 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 transition-all"
               />
             </div>
           )}
           <textarea
             rows={2}
             placeholder="添加备注细节 (可选)..."
             value={note}
             onChange={(e) => setNote(e.target.value)}
             className="w-full soft-shadow-in border-none p-4 rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 transition-all resize-none"
           />
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setShowLogModal(false)}
            className="flex-1 py-4 text-slate-500 hover:text-slate-700 font-bold rounded-xl transition-colors soft-shadow-out active:soft-shadow-pressed"
          >
            放弃
          </button>
          <button
            type="button"
            disabled={(!selectedCategory && !isCustom) || (isCustom && !customLabel.trim())}
            onClick={handleSave}
            className={`flex-[2] py-4 rounded-xl font-bold transition-all tracking-wide text-white shadow-lg transform active:scale-95 ${
              (selectedCategory || (isCustom && customLabel.trim()))
                ? 'bg-gradient-to-br from-sky-400 to-blue-500 hover:shadow-sky-300/50'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            保存记录
          </button>
        </div>
      </div>
    </div>
  );
};

const StatsModal = ({ todayStats, exportData, resetData, setShowStats }) => (
  <div className="fixed inset-0 bg-slate-100/80 backdrop-blur-xl z-40 overflow-y-auto fade-in">
    <div className="max-w-2xl mx-auto p-6 pt-12">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">数据统计</h2>
        <button
          type="button"
          onClick={() => setShowStats(false)}
          className="p-3 rounded-full transition-colors text-slate-500 soft-shadow-out active:soft-shadow-pressed"
        >
          <X size={24} />
        </button>
      </div>

      <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl mb-10 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-3">
            今日专注时长
          </h3>
          <p className="text-6xl font-bold tracking-tighter">
            {Math.floor(todayStats.totalMinutes / 60)}
            <span className="text-2xl text-slate-500 font-medium ml-1">h</span>{' '}
            {todayStats.totalMinutes % 60}
            <span className="text-2xl text-slate-500 font-medium ml-1">m</span>
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-5 transform translate-x-1/4 translate-y-1/4 rotate-12">
          <BarChart2 size={240} />
        </div>
      </div>

      <h3 className="font-bold text-lg mb-6 text-slate-800 flex items-center gap-3">
        <span className="w-2 h-2 bg-sky-500 rounded-full shadow-lg shadow-sky-500/50"></span>
        分类分布
      </h3>
      <div className="space-y-4 mb-12">
        {todayStats.breakdown.length === 0 ? (
          <div className="text-center py-12 soft-shadow-in rounded-3xl text-slate-400">
            今天还没有记录，快开始专注吧！
          </div>
        ) : null}
        {todayStats.breakdown.map((item, idx) => (
          <div key={idx} className="flex items-center group soft-shadow-out p-4 rounded-2xl">
            <div className="w-32 font-semibold text-slate-700 truncate pl-2">{item.label}</div>
            <div className="flex-1 soft-shadow-in rounded-full h-3 overflow-hidden mx-4 bg-slate-200">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out bg-sky-500"
                style={{
                  width: `${
                    todayStats.totalMinutes > 0
                      ? (item.minutes / todayStats.totalMinutes) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <div className="w-20 text-right text-sm font-mono text-slate-500 font-medium pr-2">
              {item.minutes}m
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-6">
        <button
          type="button"
          onClick={exportData}
          className="flex-1 flex justify-center items-center gap-2 px-6 py-4 rounded-2xl font-bold text-slate-700 soft-shadow-out active:soft-shadow-pressed transition-all"
        >
          <Download size={18} />
          导出数据
        </button>
        <button
          type="button"
          onClick={resetData}
          className="px-6 py-4 text-red-500 rounded-2xl font-bold soft-shadow-out active:soft-shadow-pressed transition-all"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  </div>
);

const SettingsModal = ({ 
  intervalTime, setIntervalTime, setTimeLeft, setIsRunning, setShowSettings,
  dayStartHour, setDayStartHour, dayEndHour, setDayEndHour,
  recordInterval, setRecordInterval
}) => (
  <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 fade-in">
    <div className="bg-[#eef2f6] p-8 rounded-3xl shadow-2xl w-full max-w-sm mx-4 scale-in border border-white/50 overflow-y-auto max-h-[90vh]">
      <h2 className="text-2xl font-bold mb-8 text-slate-900 text-center">设置</h2>
      
      <div className="mb-8">
        <label className="block text-slate-400 text-xs font-bold mb-4 uppercase tracking-widest text-center">
          倒计时/记录提醒间隔
        </label>
        <div className="flex gap-4">
          {[15, 30, 60].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => {
                setIntervalTime(val);
                setRecordInterval(val);
                setTimeLeft(val * 60);
                setIsRunning(false);
              }}
              className={`flex-1 py-4 rounded-2xl font-bold text-lg transition-all duration-200 ${
                (intervalTime === val || recordInterval === val)
                  ? 'soft-shadow-pressed text-sky-600 ring-1 ring-sky-200'
                  : 'soft-shadow-out text-slate-400 hover:transform hover:-translate-y-1'
              }`}
            >
              {val}
            </button>
          ))}
        </div>
        <div className="text-center mt-2 text-xs text-slate-400">
            当前: 专注 {intervalTime}m / 记录提醒 {recordInterval}m
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-slate-400 text-xs font-bold mb-4 uppercase tracking-widest text-center">
          每日作息时间
        </label>
        {/* ... existing ... */}
        <div className="flex gap-4 items-center justify-center">
           <div className="flex-1">
             <select 
               value={dayStartHour} 
               onChange={(e) => setDayStartHour(Number(e.target.value))}
               className="w-full p-3 rounded-xl soft-shadow-out text-center text-slate-700 font-bold outline-none focus:ring-2 focus:ring-sky-200 appearance-none bg-transparent"
             >
               {Array.from({length: 24}, (_, i) => (
                 <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
               ))}
             </select>
           </div>
           <span className="text-slate-400 font-bold">-</span>
           <div className="flex-1">
             <select 
               value={dayEndHour} 
               onChange={(e) => setDayEndHour(Number(e.target.value))}
               className="w-full p-3 rounded-xl soft-shadow-out text-center text-slate-700 font-bold outline-none focus:ring-2 focus:ring-sky-200 appearance-none bg-transparent"
             >
               {Array.from({length: 24}, (_, i) => (
                 <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
               ))}
             </select>
           </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowSettings(false)}
        className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 transition-colors shadow-xl transform active:scale-95"
      >
        完成设置
      </button>
    </div>
  </div>
);

const TimeTracker = () => {
  // --- State ---
  const [mode, setMode] = useState('record'); // 'record' | 'focus' | 'countup'
  const [intervalTime, setIntervalTime] = useState(30); // 分钟 (Focus mode)
  const [recordInterval, setRecordInterval] = useState(30); // 分钟 (Record mode)
  const [timeLeft, setTimeLeft] = useState(intervalTime * 60);
  const [countUpTime, setCountUpTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentBlockDuration, setCurrentBlockDuration] = useState(intervalTime);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPressed, setIsPressed] = useState(false); // 按钮按下状态

  // Record Mode State
  const [manualRecordData, setManualRecordData] = useState(null); // { startTime, endTime }
  const [lastLogTime, setLastLogTime] = useState(() => {
      if (typeof localStorage !== 'undefined') {
          const savedLogs = localStorage.getItem('time_logs');
          if (savedLogs) {
              const parsed = JSON.parse(savedLogs);
              if (parsed.length > 0) return parsed[0].timestamp; // latest log timestamp
          }
      }
      return Date.now();
  });
  
  // 自定义作息时间
  const [dayStartHour, setDayStartHour] = useState(() => parseInt(localStorage.getItem('dayStartHour') || 9));
  const [dayEndHour, setDayEndHour] = useState(() => parseInt(localStorage.getItem('dayEndHour') || 18));

  // 数据存储
  const [logs, setLogs] = useState([]);
  const [note, setNote] = useState('');

  // Timer Reference
  const timerRef = useRef(null);

  // --- 初始化加载 ---
  useEffect(() => {
    const savedLogs = localStorage.getItem('time_logs');
    if (savedLogs) setLogs(JSON.parse(savedLogs));

    // 请求通知权限
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
    }

    // 实时时钟更新
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(clockInterval);
  }, []);

  // 保存设置
  useEffect(() => {
    localStorage.setItem('dayStartHour', dayStartHour);
    localStorage.setItem('dayEndHour', dayEndHour);
  }, [dayStartHour, dayEndHour]);

  // --- 计时器逻辑 ---
  useEffect(() => {
    if (isRunning) {
      if (mode === 'focus' && timeLeft > 0) {
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => prev - 1);
        }, 1000);
      } else if (mode === 'focus' && timeLeft === 0) {
        handleTimerComplete();
      } else if (mode === 'countup') {
        timerRef.current = setInterval(() => {
          setCountUpTime((prev) => prev + 1);
        }, 1000);
      }
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, timeLeft, mode]);

  const [reminderAnchor, setReminderAnchor] = useState(null); // Anchor for relative reminder

  // --- 记录模式逻辑 (基于时钟 + 相对偏移) ---
  useEffect(() => {
    if (mode === 'record') {
      const now = new Date();
      const seconds = now.getSeconds();
      
      let shouldRemind = false;

      if (reminderAnchor) {
          // Relative mode: Check diff from anchor
          const diffSeconds = Math.floor((now - reminderAnchor) / 1000);
          const intervalSeconds = recordInterval * 60;
          // Remind when diff is multiple of interval (and not 0)
          if (diffSeconds > 0 && diffSeconds % intervalSeconds === 0) {
              shouldRemind = true;
          }
      } else {
          // Absolute mode: Clock aligned
          const minutes = now.getMinutes();
          if (minutes % recordInterval === 0 && seconds === 0) {
              shouldRemind = true;
          }
      }
      
      if (shouldRemind) {
        // 触发弹窗
         if (typeof window !== 'undefined' && 'Notification' in window) {
            // eslint-disable-next-line no-new
            new Notification('时间记录', { body: '现在在做什么？' });
         }
         
         if (!showLogModal) {
           // 计算距离上次记录的时间
           const nowTs = Date.now();
           const diffMinutes = Math.max(1, Math.round((nowTs - lastLogTime) / 60000));
           
           setCurrentBlockDuration(diffMinutes);
           // Pass manual data to imply start time
           setManualRecordData({ startTime: lastLogTime, endTime: nowTs });
           setShowLogModal(true);
         }
      }
    }
  }, [currentTime, mode, recordInterval, lastLogTime, showLogModal, reminderAnchor]); // 依赖 currentTime 每秒触发


  // --- 功能函数 ---
  const handleTimerComplete = () => {
    setIsRunning(false);
    clearInterval(timerRef.current);
    // 自然结束时，按完整时间块记录
    setCurrentBlockDuration(intervalTime);

    if (typeof window !== 'undefined' && 'Notification' in window) {
      // 浏览器通知
      // eslint-disable-next-line no-new
      new Notification('时间到！', { body: '该记录一下刚才的工作了。' });
    }

    setShowLogModal(true);
  };

  const handleStartStop = () => {
    setIsRunning((prev) => !prev);
  };

  const handleManualEnd = () => {
    // Countup allows ending even if paused, Focus requires running for manual end usually? 
    // Actually existing logic said if (!isRunning) return; for focus.
    // Let's allow ending anytime if there is data.
    
    clearInterval(timerRef.current);
    setIsRunning(false);

    let duration = 0;
    if (mode === 'focus') {
        const totalSeconds = intervalTime * 60;
        const elapsedSeconds = totalSeconds - timeLeft;
        duration = Math.max(1, Math.round(elapsedSeconds / 60));
    } else if (mode === 'countup') {
        duration = Math.max(1, Math.round(countUpTime / 60));
    } else {
        duration = recordInterval;
    }

    setCurrentBlockDuration(duration);
    setShowLogModal(true);
  };

  const handleManualAdd = () => {
     setManualRecordData({
         startTime: lastLogTime, // 默认从上次结束开始
         endTime: Date.now(),
         isManual: true // Explicitly manual mode
     });
     setShowLogModal(true);
  };

  const saveLog = (category, manualDuration = null) => {
    // Determine duration
    let finalDuration = currentBlockDuration;
    if (manualDuration !== null) {
        finalDuration = manualDuration;
    }

    const newLog = {
      id: Date.now(),
      timestamp: Date.now(),
      duration: finalDuration,
      categoryId: category.id,
      categoryLabel: category.label || category.categoryLabel, // 兼容自定义
      note,
    };

    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem('time_logs', JSON.stringify(updatedLogs));

    // Update Last Log Time to now
    setLastLogTime(Date.now());

    // 重置状态
    setNote('');
    setShowLogModal(false);
    setManualRecordData(null);
    
    if (mode === 'focus') {
        setTimeLeft(intervalTime * 60);
        setCurrentBlockDuration(intervalTime);
    } else if (mode === 'countup') {
        setCountUpTime(0);
        setCurrentBlockDuration(0);
    }
  };

  const exportData = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', 'time_logs.json');
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const resetData = () => {
    // eslint-disable-next-line no-alert
    if (confirm('确定要清空所有记录吗？')) {
      setLogs([]);
      localStorage.removeItem('time_logs');
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- 统计计算 ---
  const getTodayStats = () => {
    const todayLogs = logs.filter((log) => isSameDay(log.timestamp, new Date()));
    const totalMinutes = todayLogs.reduce((acc, curr) => acc + curr.duration, 0);

    const breakdown = {};
    todayLogs.forEach((log) => {
      // 兼容 ID 或 Label 作为 Key
      const key = log.categoryId || log.categoryLabel;
      if (!breakdown[key]) {
        breakdown[key] = { label: log.categoryLabel, minutes: 0, count: 0 };
      }
      breakdown[key].minutes += log.duration;
      breakdown[key].count += 1;
    });

    return { totalMinutes, breakdown: Object.values(breakdown) };
  };

  const todayStats = getTodayStats();
  const progress = ((intervalTime * 60 - timeLeft) / (intervalTime * 60)) * 100;

  // 计算今日自定义时间段进度
  const calculateDayProgress = () => {
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    
    // 简单的跨天逻辑处理 (如果结束时间小于开始时间，假设跨天，这里简化为当天逻辑)
    // 如果 currentHour < startHour -> 0%
    // 如果 currentHour > endHour -> 100%
    
    if (currentHour < dayStartHour) return 0;
    if (currentHour > dayEndHour) return 100;
    
    const totalHours = dayEndHour - dayStartHour;
    if (totalHours <= 0) return 100; // 防止除以0
    
    const elapsed = currentHour - dayStartHour;
    return (elapsed / totalHours) * 100;
  };

  const dayProgress = calculateDayProgress();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden selection:bg-transparent cursor-default select-none">
      {/* 顶部栏 */}
      <div className="absolute top-0 w-full p-8 flex justify-between items-center max-w-2xl z-20">
        <div className="font-bold text-2xl text-slate-800 tracking-tighter">TimeChunk</div>
        <div className="flex gap-6">
          <button
            type="button"
            onClick={() => setShowStats(true)}
            className="p-4 rounded-2xl transition-all text-slate-500 soft-shadow-out active:soft-shadow-pressed hover:text-sky-600"
          >
            <BarChart2 size={22} />
          </button>
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="p-4 rounded-2xl transition-all text-slate-500 soft-shadow-out active:soft-shadow-pressed hover:text-sky-600"
          >
            <Settings size={22} />
          </button>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="relative z-20 mt-36 mb-8 bg-white/50 p-1 rounded-2xl flex soft-shadow-in mx-auto max-w-xs w-full">
        {[
          { id: 'record', label: '记录', icon: <ClipboardList size={16} /> },
          { id: 'focus', label: '倒计时', icon: <Timer size={16} /> },
          { id: 'countup', label: '正计时', icon: <Play size={16} /> },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => {
                setMode(m.id);
                setIsRunning(false);
            }}
            className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              mode === m.id
                ? 'bg-white soft-shadow-out text-sky-500 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="text-center relative z-10 flex-1 flex flex-col items-center w-full max-w-md pt-12">
        
        {/* Focus Mode */}
        {mode === 'focus' && (
          <div className="flex flex-col items-center w-full h-full">
            <div className="mb-10 relative inline-block">
              <RingProgress radius={160} stroke={12} progress={isRunning ? 100 - progress : 0}>
                 <div className="text-center transform translate-y-[5%]">
                  <div className="text-7xl font-bold tabular-nums tracking-tighter text-slate-800" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.05), -1px -1px 1px rgba(255,255,255,0.9)' }}>
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-slate-400 font-bold mt-4 uppercase tracking-[0.2em] text-xs">
                    {isRunning ? '倒计时中' : '准备就绪'}
                  </div>
                </div>
              </RingProgress>
            </div>
            {/* Controls */}
            <div className="flex flex-col items-center gap-6 mt-auto mb-20">
              <button
                type="button"
                onMouseDown={() => setIsPressed(true)}
                onMouseUp={() => setIsPressed(false)}
                onMouseLeave={() => setIsPressed(false)}
                onClick={handleStartStop}
                className={`rounded-full p-8 transition-all duration-200 flex items-center justify-center transform ${
                  isPressed ? 'soft-shadow-pressed scale-95' : 'soft-shadow-out hover:scale-105'
                } ${isRunning ? 'text-sky-500' : 'text-slate-400'}`}
              >
                {isRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
              </button>
               <div className="h-8">
                {isRunning ? (
                  <button onClick={handleManualEnd} className="text-xs font-bold text-slate-400 hover:text-red-500 tracking-widest transition-colors px-6 py-2 rounded-full hover:bg-red-50">
                    提前结束并记录
                  </button>
                ) : <p className="text-slate-300 text-xs font-bold tracking-widest uppercase">点击开始倒计时</p>}
              </div>
            </div>
          </div>
        )}

        {/* Count Up Mode */}
        {mode === 'countup' && (
           <div className="flex flex-col items-center w-full h-full">
            <div className="mb-10 relative inline-block">
              <RingProgress radius={160} stroke={12} progress={isRunning ? (countUpTime % 3600) / 36 : 0}>
                 <div className="text-center transform translate-y-[5%]">
                  <div className="text-7xl font-bold tabular-nums tracking-tighter text-slate-800" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.05), -1px -1px 1px rgba(255,255,255,0.9)' }}>
                    {formatTime(countUpTime)}
                  </div>
                  <div className="text-slate-400 font-bold mt-4 uppercase tracking-[0.2em] text-xs">
                    {isRunning ? '记录中' : '正计时'}
                  </div>
                </div>
              </RingProgress>
            </div>
             <div className="flex flex-col items-center gap-6 mt-auto mb-20">
              <button
                type="button"
                onMouseDown={() => setIsPressed(true)}
                onMouseUp={() => setIsPressed(false)}
                onMouseLeave={() => setIsPressed(false)}
                onClick={handleStartStop}
                className={`rounded-full p-8 transition-all duration-200 flex items-center justify-center transform ${
                  isPressed ? 'soft-shadow-pressed scale-95' : 'soft-shadow-out hover:scale-105'
                } ${isRunning ? 'text-sky-500' : 'text-slate-400'}`}
              >
                {isRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
              </button>
               <div className="h-8">
                   <button onClick={handleManualEnd} className="text-xs font-bold text-slate-400 hover:text-sky-500 tracking-widest transition-colors px-6 py-2 rounded-full hover:bg-sky-50">
                    完成并保存
                  </button>
              </div>
            </div>
           </div>
        )}

        {/* Record Mode */}
        {mode === 'record' && (
           <div className="flex flex-col items-center w-full h-full px-6 gap-8">
             {/* Card */}
             <div className="bg-white/50 p-6 rounded-[2.5rem] soft-shadow-out w-full max-w-xs mx-auto mt-12 mb-auto backdrop-blur-sm border border-white/60 relative overflow-hidden">
                
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-200">
                    <div 
                        className="h-full bg-sky-400 transition-all duration-1000"
                        style={{ 
                            width: `${(() => {
                                const totalSeconds = recordInterval * 60;
                                let elapsed = 0;
                                if (reminderAnchor) {
                                    const diff = Math.floor((currentTime - reminderAnchor) / 1000);
                                    elapsed = diff % totalSeconds;
                                } else {
                                    elapsed = (currentTime.getMinutes() % recordInterval) * 60 + currentTime.getSeconds();
                                }
                                return ((totalSeconds - elapsed) / totalSeconds) * 100;
                            })()}%` 
                        }}
                    ></div>
                </div>

                <div className="text-center mt-4 mb-8">
                    <div className="text-6xl font-bold tabular-nums tracking-tighter text-slate-800">
                        {format(currentTime, 'HH:mm')}
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-2 w-full">
                        <button 
                            onClick={() => setShowSettings(true)}
                            className="flex items-center justify-center gap-2 text-slate-400 bg-slate-100/50 hover:bg-white hover:text-sky-500 transition-colors rounded-full py-1 px-3 cursor-pointer"
                        >
                            <Bell size={12} className="animate-pulse" />
                            <span className="text-xs font-bold tabular-nums tracking-wide">
                                {(() => {
                                    const totalSeconds = recordInterval * 60-1;
                                    let remaining = 0;
                                    if (reminderAnchor) {
                                        const diff = Math.floor((currentTime - reminderAnchor) / 1000);
                                        const elapsed = diff % totalSeconds;
                                        remaining = totalSeconds - elapsed;
                                    } else {
                                        const elapsed = (currentTime.getMinutes() % recordInterval) * 60 + currentTime.getSeconds();
                                        remaining = totalSeconds - elapsed;
                                    }
                                    return formatTime(remaining);
                                })()} 后提醒
                            </span>
                        </button>
                        <button
                            onClick={() => {
                                setReminderAnchor(new Date());
                            }}
                            className="p-1.5 rounded-full text-slate-400 hover:text-sky-500 hover:bg-white transition-all cursor-pointer"
                            title="重置倒计时"
                        >
                            <RotateCcw size={12} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-200/50 pt-6">
                   <div className="flex flex-col items-center">
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">上次记录</div>
                       <div className="font-bold text-slate-600 text-lg">{format(lastLogTime, 'HH:mm')}</div>
                   </div>
                   <div className="flex flex-col items-center border-l border-slate-200/50">
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">未记录</div>
                       <div className="font-bold text-sky-500 text-lg tabular-nums">
                           {Math.max(0, Math.floor((currentTime - lastLogTime) / 60000))}m
                       </div>
                   </div>
                </div>
             </div>

             <div className="flex flex-col gap-4 w-full max-w-[240px] mt-auto mb-20">
                <button 
                  onClick={() => {
                       const diff = Math.max(1, Math.round((Date.now() - lastLogTime) / 60000));
                       setCurrentBlockDuration(diff);
                       setManualRecordData({ startTime: lastLogTime, endTime: Date.now(), isManual: true });
                       setShowLogModal(true);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 text-white font-bold shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm tracking-wide"
                >
                    <ClipboardList size={18} />
                    <span>记录这段时间</span>
                </button>
                
                <button 
                  onClick={handleManualAdd}
                  className="w-full py-2 rounded-xl text-slate-400 font-bold hover:text-sky-600 hover:bg-white/50 transition-all flex items-center justify-center gap-2 text-[10px] tracking-widest uppercase"
                >
                    <Plus size={14} />
                    <span>手动补录</span>
                </button>
             </div>
           </div>
        )}

      </div>

      {/* 底部栏：时间和进度 */}
      <div className="absolute bottom-0 w-full p-10 flex flex-col gap-4 items-center">
         {/* 进度条容器 */}
         <div className="w-full max-w-md relative">
            <div className="flex justify-between text-[10px] text-slate-400 mb-4 font-bold tracking-[0.15em] uppercase">
                <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <span>{format(currentTime, 'HH:mm')}</span>
                </div>
                <span>今日进度 {Math.round(dayProgress)}%</span>
            </div>
            {/* 凹槽进度条 */}
            <div className="h-4 w-full rounded-full soft-shadow-in overflow-hidden p-[3px]">
                <div
                   className="h-full rounded-full animate-shimmer transition-all duration-1000 shadow-inner"
                   style={{ width: `${dayProgress}%`, background: 'linear-gradient(90deg, #38bdf8 0%, #3b82f6 100%)' }}
                ></div>
            </div>
            {/* 右下角自定义时间段显示 */}
            <div className="absolute right-0 -bottom-6 text-[10px] text-slate-300 font-bold tracking-widest">
              {String(dayStartHour).padStart(2, '0')}:00 - {String(dayEndHour).padStart(2, '0')}:00
            </div>
         </div>
      </div>

      {/* 模态框渲染 */}
      {showLogModal && (
        <LogModal
          note={note}
          setNote={setNote}
          saveLog={saveLog}
          setShowLogModal={setShowLogModal}
          initialStartTime={manualRecordData?.startTime}
          initialEndTime={manualRecordData?.endTime}
          isManual={manualRecordData?.isManual}
        />
      )}
      {showStats && (
        <StatsModal
          todayStats={todayStats}
          exportData={exportData}
          resetData={resetData}
          setShowStats={setShowStats}
        />
      )}
      {showSettings && (
        <SettingsModal
          intervalTime={intervalTime}
          setIntervalTime={setIntervalTime}
          setTimeLeft={setTimeLeft}
          setIsRunning={setIsRunning}
          setShowSettings={setShowSettings}
          dayStartHour={dayStartHour}
          setDayStartHour={setDayStartHour}
          dayEndHour={dayEndHour}
          setDayEndHour={setDayEndHour}
          recordInterval={recordInterval}
          setRecordInterval={setRecordInterval}
        />
      )}
    </div>
  );
};

export default TimeTracker;
