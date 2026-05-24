// src/utils/defaults.js

export const DEFAULT_PROCEDURES = [
  { name: 'ตรวจฟัน', duration: 15, category: 'ตรวจ' },
  { name: 'ขูดหินปูน', duration: 30, category: 'ทำความสะอาด' },
  { name: 'ขูดหินปูน + ฟอกสีฟัน', duration: 60, category: 'ทำความสะอาด' },
  { name: 'อุดฟัน (ซี่เดียว)', duration: 30, category: 'อุด' },
  { name: 'อุดฟัน (หลายซี่)', duration: 60, category: 'อุด' },
  { name: 'รักษาคลองรากฟัน', duration: 60, category: 'รักษารากฟัน' },
  { name: 'รักษาคลองรากฟัน (ต่อเนื่อง)', duration: 45, category: 'รักษารากฟัน' },
  { name: 'ถอนฟัน', duration: 15, category: 'ศัลยกรรม' },
  { name: 'ถอนฟันน้ำนม', duration: 15, category: 'ศัลยกรรม' },
  { name: 'ผ่าฟันคุด', duration: 60, category: 'ศัลยกรรม' },
  { name: 'ใส่ฟันปลอมถอดได้', duration: 30, category: 'ฟันปลอม' },
  { name: 'ครอบฟัน', duration: 60, category: 'ฟันปลอม' },
  { name: 'ฟอกสีฟัน', duration: 60, category: 'ความงาม' },
  { name: 'เคลือบหลุมร่องฟัน', duration: 30, category: 'ป้องกัน' },
  { name: 'เคลือบฟลูออไรด์', duration: 15, category: 'ป้องกัน' },
  { name: 'ทำฟันเด็ก', duration: 30, category: 'เด็ก' },
  { name: 'ฉีดยาชา', duration: 10, category: 'อื่นๆ' },
  { name: 'อื่นๆ (ระบุเพิ่มเติม)', duration: 30, category: 'อื่นๆ' },
];

export const STATUS_FLOW = [
  { key: 'scheduled',    label: 'นัดหมาย',           color: '#94a3b8', bg: '#f1f5f9' },
  { key: 'arrived',      label: 'มาถึง / รอวัด BP',   color: '#f59e0b', bg: '#fffbeb' },
  { key: 'bp_done',      label: 'วัด BP เสร็จ',       color: '#3b82f6', bg: '#eff6ff' },
  { key: 'in_chair',     label: 'อยู่ในห้องรักษา',    color: '#8b5cf6', bg: '#f5f3ff' },
  { key: 'done',         label: 'รักษาเสร็จ',         color: '#10b981', bg: '#ecfdf5' },
];

export const STATUS_NEXT = {
  scheduled: 'arrived',
  arrived:   'bp_done',
  bp_done:   'in_chair',
  in_chair:  'done',
};

export const STATUS_SOUND = {
  arrived:  { freq: 520, pattern: [200] },
  bp_done:  { freq: 660, pattern: [150, 100, 150] },
  in_chair: { freq: 440, pattern: [100, 80, 100, 80, 200] },
  done:     { freq: 784, pattern: [300, 100, 300] },
};

// ─── SOUND ENGINE ────────────────────────────────────────────
export const playNotification = (statusKey) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const config = STATUS_SOUND[statusKey];
    if (!config) return;

    let t = ctx.currentTime;
    config.pattern.forEach((dur, i) => {
      if (i % 2 === 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = config.freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur / 1000);
        osc.start(t);
        osc.stop(t + dur / 1000);
        t += dur / 1000;
      } else {
        t += dur / 1000;
      }
    });
  } catch (e) {
    console.warn('Audio not available:', e);
  }
};

export const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  return `${h}:${m}`;
};

export const addMinutes = (timeStr, minutes) => {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
};

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const formatDateThai = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return `${parseInt(d)} ${months[parseInt(m)-1]} ${parseInt(y)+543}`;
};
