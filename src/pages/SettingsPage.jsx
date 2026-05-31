// src/pages/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { getCollection, addToCollection, updateInCollection, deleteFromCollection } from '../firebase/firestore.js';
import { DEFAULT_PROCEDURES, DEFAULT_DENTISTS, DEFAULT_ROOMS, DENTIST_COLORS, CLINIC_HOURS } from '../utils/defaults.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase/config.js';
import { doc, setDoc } from 'firebase/firestore';

const TABS = ['ทันตแพทย์', 'ห้องฟัน', 'รายการงาน', 'ผู้ใช้งาน'];
const DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const DAYS_FULL = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์'];

export default function SettingsPage() {
  const [tab, setTab] = useState(0);
  const [dentists, setDentists] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [editDentist, setEditDentist] = useState(null);

  // New dentist form
  const [newDentist, setNewDentist] = useState({ name: '', fullName: '', nickname: '', color: DENTIST_COLORS[0], schedule: {} });
  const [newRoom, setNewRoom] = useState('');
  const [newProc, setNewProc] = useState({ name: '', duration: 30, category: '' });
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '1234', role: 'counter' });

  const showMsg = (text, error = false) => { setMsg({ text, error }); setTimeout(() => setMsg(''), 3000); };

  useEffect(() => {
    getCollection('dentists').then(d => {
      if (d.length === 0) {
        Promise.all(DEFAULT_DENTISTS.map(x => addToCollection('dentists', x)))
          .then(() => getCollection('dentists').then(setDentists));
      } else setDentists(d);
    });
    getCollection('rooms').then(r => {
      if (r.length === 0) {
        Promise.all(DEFAULT_ROOMS.map(x => addToCollection('rooms', x)))
          .then(() => getCollection('rooms').then(setRooms));
      } else setRooms(r);
    });
    getCollection('procedures').then(p => {
      if (p.length === 0) {
        Promise.all(DEFAULT_PROCEDURES.map(x => addToCollection('procedures', x)))
          .then(() => getCollection('procedures').then(setProcedures));
      } else setProcedures(p);
    });
  }, []);

  const inp = { padding:'8px 12px', border:'1.5px solid #e5e7eb', borderRadius:'8px', fontSize:'14px', outline:'none', fontFamily:'inherit', width:'100%', boxSizing:'border-box' };
  const categories = [...new Set(procedures.map(p => p.category).filter(Boolean))];

  // ─── DENTIST SCHEDULE ───────────────────────────────────────
  const toggleDaySchedule = (dentistId, dow) => {
    const d = dentists.find(x => x.id === dentistId);
    if (!d) return;
    const sched = d.schedule || {};
    const newSched = { ...sched };
    if (newSched[dow] === false) {
      delete newSched[dow]; // re-enable
    } else if (newSched[dow]) {
      newSched[dow] = false; // disable
    } else {
      newSched[dow] = { start: CLINIC_HOURS[dow]?.open || '09:00', end: CLINIC_HOURS[dow]?.close || '19:00' };
    }
    updateInCollection('dentists', dentistId, { schedule: newSched });
    setDentists(prev => prev.map(x => x.id === dentistId ? { ...x, schedule: newSched } : x));
  };

  const updateDentistScheduleTime = (dentistId, dow, field, val) => {
    const d = dentists.find(x => x.id === dentistId);
    if (!d) return;
    const sched = { ...(d.schedule || {}) };
    sched[dow] = { ...(sched[dow] || {}), [field]: val };
    updateInCollection('dentists', dentistId, { schedule: sched });
    setDentists(prev => prev.map(x => x.id === dentistId ? { ...x, schedule: sched } : x));
  };

  // ─── DENTIST CRUD ───────────────────────────────────────────
  const addDentist = async () => {
    if (!newDentist.name.trim()) return;
    setSaving(true);
    await addToCollection('dentists', { ...newDentist, schedule: {} });
    const d = await getCollection('dentists');
    setDentists(d);
    setNewDentist({ name: '', fullName: '', nickname: '', color: DENTIST_COLORS[0], schedule: {} });
    showMsg('เพิ่มทันตแพทย์แล้ว');
    setSaving(false);
  };

  const updateDentist = async (id, data) => {
    await updateInCollection('dentists', id, data);
    setDentists(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
    setEditDentist(null);
    showMsg('แก้ไขแล้ว');
  };

  const deleteDentist = async (id) => {
    if (!confirm('ลบทันตแพทย์นี้?')) return;
    await deleteFromCollection('dentists', id);
    setDentists(prev => prev.filter(d => d.id !== id));
  };

  // ─── ROOM CRUD ──────────────────────────────────────────────
  const addRoom = async () => {
    if (!newRoom.trim()) return;
    setSaving(true);
    await addToCollection('rooms', { name: newRoom.trim() });
    const r = await getCollection('rooms');
    setRooms(r);
    setNewRoom('');
    showMsg('เพิ่มห้องแล้ว');
    setSaving(false);
  };

  const deleteRoom = async (id) => {
    await deleteFromCollection('rooms', id);
    setRooms(prev => prev.filter(r => r.id !== id));
  };

  // ─── PROCEDURE CRUD ─────────────────────────────────────────
  const addProc = async () => {
    if (!newProc.name.trim()) return;
    setSaving(true);
    await addToCollection('procedures', { ...newProc, duration: Number(newProc.duration) });
    const p = await getCollection('procedures');
    setProcedures(p);
    setNewProc({ name: '', duration: 30, category: '' });
    showMsg('เพิ่มรายการแล้ว');
    setSaving(false);
  };

  const updateProcDuration = async (id, duration) => {
    await updateInCollection('procedures', id, { duration: Number(duration) });
    setProcedures(prev => prev.map(p => p.id === id ? { ...p, duration: Number(duration) } : p));
  };

  const deleteProc = async (id) => {
    await deleteFromCollection('procedures', id);
    setProcedures(prev => prev.filter(p => p.id !== id));
  };

  // ─── USER ───────────────────────────────────────────────────
  const addUser = async () => {
    if (!newUser.email || !newUser.name) { showMsg('กรุณากรอกข้อมูลให้ครบ', true); return; }
    setSaving(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
      await setDoc(doc(db, 'users', cred.user.uid), { name: newUser.name, email: newUser.email, role: newUser.role });
      setNewUser({ name: '', email: '', password: '1234', role: 'counter' });
      showMsg('เพิ่มผู้ใช้งานแล้ว');
    } catch (e) { showMsg('เกิดข้อผิดพลาด: ' + e.message, true); }
    setSaving(false);
  };

  return (
    <div style={{ minHeight:'100vh', background:'#f8faf9', fontFamily:"'Sarabun', sans-serif" }}>
      <div style={{ background:'white', borderBottom:'1px solid #e5e7eb', padding:'14px 20px', display:'flex', alignItems:'center', gap:'12px' }}>
        <a href="/" style={{ fontSize:'20px', textDecoration:'none' }}>‹</a>
        <h1 style={{ margin:0, fontSize:'18px', fontWeight:'700', color:'#1a2e25' }}>⚙️ ตั้งค่าระบบ</h1>
      </div>

      <div style={{ maxWidth:'700px', margin:'0 auto', padding:'16px' }}>
        {msg && <div style={{ background:msg.error?'#fef2f2':'#f0faf5', border:`1px solid ${msg.error?'#fecaca':'#d1fae5'}`, borderRadius:'8px', padding:'10px 14px', color:msg.error?'#dc2626':'#065f46', fontSize:'13px', marginBottom:'14px' }}>{msg.text}</div>}

        <div style={{ display:'flex', gap:'4px', marginBottom:'20px', background:'white', borderRadius:'10px', padding:'4px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ flex:1, padding:'8px 4px', border:'none', borderRadius:'7px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', background:tab===i?'#34a878':'transparent', color:tab===i?'white':'#6b7280' }}>{t}</button>
          ))}
        </div>

        {/* ─── DENTISTS ─── */}
        {tab === 0 && (
          <div style={{ background:'white', borderRadius:'12px', padding:'20px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin:'0 0 14px', fontSize:'15px', color:'#1a2e25' }}>ทันตแพทย์</h3>

            {/* Add form */}
            <div style={{ border:'1px dashed #d1fae5', borderRadius:'10px', padding:'14px', marginBottom:'16px', background:'#f9fffe' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'8px' }}>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:'600', color:'#6b7280' }}>ชื่อแสดง (ชื่อเล่น)</label>
                  <input value={newDentist.nickname} onChange={e => setNewDentist(p => ({ ...p, nickname: e.target.value, name: e.target.value }))} placeholder="หมอเบนซ์" style={inp} />
                </div>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:'600', color:'#6b7280' }}>ชื่อ-นามสกุลเต็ม</label>
                  <input value={newDentist.fullName} onChange={e => setNewDentist(p => ({ ...p, fullName: e.target.value }))} placeholder="ทพญ.ชื่อ นามสกุล" style={inp} />
                </div>
              </div>
              <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:'12px', fontWeight:'600', color:'#6b7280' }}>สี</label>
                  <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginTop:'4px' }}>
                    {DENTIST_COLORS.map(c => (
                      <div key={c} onClick={() => setNewDentist(p => ({ ...p, color: c }))} style={{ width:'24px', height:'24px', borderRadius:'50%', background:c, cursor:'pointer', border:newDentist.color===c?'3px solid #1a2e25':'2px solid transparent', flexShrink:0 }} />
                    ))}
                  </div>
                </div>
                <button onClick={addDentist} disabled={saving} style={{ padding:'8px 20px', background:'#34a878', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontFamily:'inherit', fontWeight:'600', fontSize:'14px', alignSelf:'flex-end' }}>+ เพิ่ม</button>
              </div>
            </div>

            {dentists.map(d => (
              <div key={d.id} style={{ border:'1px solid #e5e7eb', borderRadius:'10px', marginBottom:'12px', overflow:'hidden' }}>
                {/* Dentist header */}
                <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 14px', background:'white' }}>
                  <div style={{ width:'12px', height:'12px', borderRadius:'50%', background:d.color||'#34a878', flexShrink:0 }} />
                  {editDentist === d.id ? (
                    <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
                      <input defaultValue={d.nickname||d.name} id={`nick-${d.id}`} placeholder="ชื่อเล่น" style={{ ...inp, padding:'5px 8px', fontSize:'13px' }} />
                      <input defaultValue={d.fullName||''} id={`full-${d.id}`} placeholder="ชื่อเต็ม" style={{ ...inp, padding:'5px 8px', fontSize:'13px' }} />
                    </div>
                  ) : (
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:'700', fontSize:'14px', color:'#1a2e25' }}>{d.nickname || d.name}</div>
                      {d.fullName && <div style={{ fontSize:'12px', color:'#6b7280' }}>{d.fullName}</div>}
                    </div>
                  )}
                  <div style={{ display:'flex', gap:'6px' }}>
                    {editDentist === d.id ? (
                      <>
                        <button onClick={() => updateDentist(d.id, { nickname: document.getElementById(`nick-${d.id}`).value, name: document.getElementById(`nick-${d.id}`).value, fullName: document.getElementById(`full-${d.id}`).value })} style={{ border:'none', background:'#34a878', color:'white', borderRadius:'6px', padding:'4px 10px', cursor:'pointer', fontSize:'12px', fontFamily:'inherit' }}>บันทึก</button>
                        <button onClick={() => setEditDentist(null)} style={{ border:'none', background:'#f3f4f6', color:'#6b7280', borderRadius:'6px', padding:'4px 10px', cursor:'pointer', fontSize:'12px', fontFamily:'inherit' }}>ยกเลิก</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setEditDentist(d.id)} style={{ border:'none', background:'#eff6ff', color:'#3b82f6', borderRadius:'6px', padding:'4px 10px', cursor:'pointer', fontSize:'12px', fontFamily:'inherit' }}>แก้ไข</button>
                        <button onClick={() => deleteDentist(d.id)} style={{ border:'none', background:'#fef2f2', color:'#dc2626', borderRadius:'6px', padding:'4px 10px', cursor:'pointer', fontSize:'12px', fontFamily:'inherit' }}>ลบ</button>
                      </>
                    )}
                  </div>
                </div>

                {/* Schedule */}
                <div style={{ background:'#f9fffe', borderTop:'1px solid #f0f9f5', padding:'10px 14px' }}>
                  <div style={{ fontSize:'11px', fontWeight:'700', color:'#9ca3af', marginBottom:'8px' }}>ตารางทำงาน</div>
                  <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                    {[1,2,3,4,5,6,0].map(dow => {
                      const sched = d.schedule?.[dow];
                      const clinicDay = CLINIC_HOURS[dow];
                      const isOff = sched === false;
                      const hasCustom = sched && typeof sched === 'object';
                      const isClinicClosed = !clinicDay;
                      return (
                        <div key={dow} style={{ textAlign:'center' }}>
                          <button onClick={() => !isClinicClosed && toggleDaySchedule(d.id, dow)} style={{
                            width:'36px', height:'36px', borderRadius:'8px', border:'none',
                            background: isClinicClosed ? '#f3f4f6' : isOff ? '#fee2e2' : hasCustom ? d.color || '#34a878' : sched ? '#d1fae5' : '#e5e7eb',
                            color: isClinicClosed ? '#d1d5db' : isOff ? '#dc2626' : hasCustom || sched ? 'white' : '#6b7280',
                            cursor: isClinicClosed ? 'not-allowed' : 'pointer',
                            fontSize:'12px', fontWeight:'700', fontFamily:'inherit',
                            textDecoration: isOff ? 'line-through' : 'none'
                          }}>
                            {DAYS[dow]}
                          </button>
                          {hasCustom && !isOff && (
                            <div style={{ marginTop:'4px', display:'flex', flexDirection:'column', gap:'2px' }}>
                              <input type="time" value={sched.start || ''} onChange={e => updateDentistScheduleTime(d.id, dow, 'start', e.target.value)}
                                style={{ width:'70px', padding:'2px 4px', border:'1px solid #d1fae5', borderRadius:'4px', fontSize:'10px', fontFamily:'inherit' }} />
                              <input type="time" value={sched.end || ''} onChange={e => updateDentistScheduleTime(d.id, dow, 'end', e.target.value)}
                                style={{ width:'70px', padding:'2px 4px', border:'1px solid #d1fae5', borderRadius:'4px', fontSize:'10px', fontFamily:'inherit' }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p style={{ fontSize:'10px', color:'#9ca3af', margin:'6px 0 0' }}>
                    กดครั้งแรก = กำหนดเวลาเอง | กดซ้ำ = หยุด | สีเขียวอ่อน = ลงตามเวลาคลินิก
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── ROOMS ─── */}
        {tab === 1 && (
          <div style={{ background:'white', borderRadius:'12px', padding:'20px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin:'0 0 14px', fontSize:'15px', color:'#1a2e25' }}>ห้องฟัน</h3>
            <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
              <input value={newRoom} onChange={e => setNewRoom(e.target.value)} onKeyDown={e => e.key==='Enter'&&addRoom()} placeholder="ชื่อห้อง เช่น ห้องฟัน 5" style={inp} />
              <button onClick={addRoom} disabled={saving} style={{ padding:'8px 20px', background:'#34a878', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontFamily:'inherit', fontWeight:'600', whiteSpace:'nowrap' }}>+ เพิ่ม</button>
            </div>
            {rooms.map(r => (
              <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', border:'1px solid #f3f4f6', borderRadius:'8px', marginBottom:'6px' }}>
                <span style={{ fontSize:'14px' }}>🚪 {r.name}</span>
                <button onClick={() => deleteRoom(r.id)} style={{ border:'none', background:'#fef2f2', color:'#dc2626', borderRadius:'6px', padding:'4px 10px', cursor:'pointer', fontSize:'12px', fontFamily:'inherit' }}>ลบ</button>
              </div>
            ))}
          </div>
        )}

        {/* ─── PROCEDURES ─── */}
        {tab === 2 && (
          <div style={{ background:'white', borderRadius:'12px', padding:'20px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin:'0 0 14px', fontSize:'15px', color:'#1a2e25' }}>รายการงานทันตกรรม</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto', gap:'8px', marginBottom:'16px', alignItems:'center' }}>
              <input value={newProc.name} onChange={e => setNewProc(p => ({ ...p, name: e.target.value }))} placeholder="ชื่อรายการ" style={inp} />
              <input type="number" min="5" max="240" step="5" value={newProc.duration} onChange={e => setNewProc(p => ({ ...p, duration: e.target.value }))} style={{ ...inp, width:'70px', textAlign:'center' }} />
              <input value={newProc.category} onChange={e => setNewProc(p => ({ ...p, category: e.target.value }))} placeholder="หมวด" list="cats" style={{ ...inp, width:'90px' }} />
              <datalist id="cats">{categories.map(c => <option key={c} value={c} />)}</datalist>
              <button onClick={addProc} disabled={saving} style={{ padding:'8px 16px', background:'#34a878', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontFamily:'inherit', fontWeight:'600' }}>+ เพิ่ม</button>
            </div>
            {categories.map(cat => (
              <div key={cat} style={{ marginBottom:'14px' }}>
                <div style={{ fontSize:'11px', fontWeight:'700', color:'#9ca3af', marginBottom:'6px', textTransform:'uppercase' }}>{cat}</div>
                {procedures.filter(p => p.category === cat).map(p => (
                  <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', border:'1px solid #f3f4f6', borderRadius:'8px', marginBottom:'4px' }}>
                    <span style={{ fontSize:'13px', flex:1 }}>{p.name}</span>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <input type="number" min="5" max="240" step="5" value={p.duration} onChange={e => updateProcDuration(p.id, e.target.value)}
                        style={{ width:'60px', padding:'4px 6px', border:'1px solid #e5e7eb', borderRadius:'6px', fontSize:'12px', textAlign:'center', fontFamily:'inherit' }} />
                      <span style={{ fontSize:'11px', color:'#9ca3af' }}>นาที</span>
                      <button onClick={() => deleteProc(p.id)} style={{ border:'none', background:'#fef2f2', color:'#dc2626', borderRadius:'6px', padding:'3px 8px', cursor:'pointer', fontSize:'11px', fontFamily:'inherit' }}>ลบ</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ─── USERS ─── */}
        {tab === 3 && (
          <div style={{ background:'white', borderRadius:'12px', padding:'20px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin:'0 0 6px', fontSize:'15px', color:'#1a2e25' }}>ผู้ใช้งานระบบ</h3>
            <p style={{ fontSize:'12px', color:'#9ca3af', marginBottom:'14px' }}>รหัสเริ่มต้น: 1234 (ให้ผู้ใช้เปลี่ยนเองหลัง login)</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'16px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                <input value={newUser.name} onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))} placeholder="ชื่อ" style={inp} />
                <input value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} placeholder="อีเมล" type="email" style={inp} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:'8px' }}>
                <input value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} placeholder="รหัสผ่าน (default: 1234)" type="password" style={inp} />
                <select value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))} style={inp}>
                  <option value="admin">Admin</option>
                  <option value="counter">เคาท์เตอร์</option>
                  <option value="dentist">ทันตแพทย์</option>
                </select>
                <button onClick={addUser} disabled={saving} style={{ padding:'8px 16px', background:'#34a878', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontFamily:'inherit', fontWeight:'600' }}>+ เพิ่ม</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
