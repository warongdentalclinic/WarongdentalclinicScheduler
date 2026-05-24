// src/pages/SettingsPage.js
import React, { useState, useEffect } from 'react';
import {
  getCollection, addToCollection, updateInCollection, deleteFromCollection
} from '../firebase/firestore.js';
import { DEFAULT_PROCEDURES } from '../utils/defaults.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase/config.js';
import { doc, setDoc } from 'firebase/firestore';

const TABS = ['ทันตแพทย์', 'ห้องฟัน', 'รายการงาน', 'ผู้ใช้งาน'];

export default function SettingsPage() {
  const [tab, setTab] = useState(0);
  const [dentists, setDentists] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [users, setUsers] = useState([]);

  // Form states
  const [newDentist, setNewDentist] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [newProc, setNewProc] = useState({ name: '', duration: 30, category: '' });
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'counter' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const showMsg = (text, error = false) => {
    setMsg({ text, error });
    setTimeout(() => setMsg(''), 3000);
  };

  useEffect(() => {
    getCollection('dentists').then(setDentists);
    getCollection('rooms').then(setRooms);
    getCollection('procedures').then(p => {
      if (p.length === 0) {
        // seed defaults
        Promise.all(DEFAULT_PROCEDURES.map(proc => addToCollection('procedures', proc)))
          .then(() => getCollection('procedures').then(setProcedures));
      } else {
        setProcedures(p);
      }
    });
    getCollection('users').then(setUsers);
  }, []);

  const inputStyle = {
    padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px',
    fontSize: '14px', outline: 'none', fontFamily: 'inherit'
  };
  const btnStyle = (color = '#34a878') => ({
    padding: '8px 16px', background: color, color: 'white', border: 'none',
    borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit'
  });

  // ─── DENTISTS ────────────────────────────────────────────────
  const addDentist = async () => {
    if (!newDentist.trim()) return;
    setSaving(true);
    await addToCollection('dentists', { name: newDentist.trim() });
    const d = await getCollection('dentists');
    setDentists(d);
    setNewDentist('');
    showMsg('เพิ่มทันตแพทย์แล้ว');
    setSaving(false);
  };
  const deleteDentist = async (id) => {
    await deleteFromCollection('dentists', id);
    setDentists(prev => prev.filter(d => d.id !== id));
  };

  // ─── ROOMS ───────────────────────────────────────────────────
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

  // ─── PROCEDURES ──────────────────────────────────────────────
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
  const deleteProc = async (id) => {
    await deleteFromCollection('procedures', id);
    setProcedures(prev => prev.filter(p => p.id !== id));
  };
  const updateProcDuration = async (id, duration) => {
    await updateInCollection('procedures', id, { duration: Number(duration) });
    setProcedures(prev => prev.map(p => p.id === id ? { ...p, duration: Number(duration) } : p));
  };

  // ─── USERS ───────────────────────────────────────────────────
  const addUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.name) {
      showMsg('กรุณากรอกข้อมูลให้ครบ', true);
      return;
    }
    setSaving(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      });
      const u = await getCollection('users');
      setUsers(u);
      setNewUser({ name: '', email: '', password: '', role: 'counter' });
      showMsg('เพิ่มผู้ใช้งานแล้ว');
    } catch (e) {
      showMsg('เกิดข้อผิดพลาด: ' + e.message, true);
    }
    setSaving(false);
  };

  const categories = [...new Set(procedures.map(p => p.category).filter(Boolean))];

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf9', fontFamily: "'Sarabun', sans-serif" }}>
      {/* Header */}
      <div style={{
        background: 'white', borderBottom: '1px solid #e5e7eb',
        padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        <a href="/" style={{ fontSize: '20px', textDecoration: 'none' }}>‹</a>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1a2e25' }}>
          ⚙️ ตั้งค่าระบบ
        </h1>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '16px' }}>
        {msg && (
          <div style={{
            background: msg.error ? '#fef2f2' : '#f0faf5',
            border: `1px solid ${msg.error ? '#fecaca' : '#d1fae5'}`,
            borderRadius: '8px', padding: '10px 14px',
            color: msg.error ? '#dc2626' : '#065f46',
            fontSize: '13px', marginBottom: '14px'
          }}>{msg.text}</div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'white', borderRadius: '10px', padding: '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{
              flex: 1, padding: '8px 4px', border: 'none', borderRadius: '7px',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
              background: tab === i ? '#34a878' : 'transparent',
              color: tab === i ? 'white' : '#6b7280'
            }}>{t}</button>
          ))}
        </div>

        {/* ─── DENTISTS ─── */}
        {tab === 0 && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '15px', color: '#1a2e25' }}>ทันตแพทย์</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                value={newDentist}
                onChange={e => setNewDentist(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addDentist()}
                placeholder="ชื่อทันตแพทย์ เช่น ทพ.สมชาย ใจดี"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button onClick={addDentist} disabled={saving} style={btnStyle()}>+ เพิ่ม</button>
            </div>
            {dentists.map(d => (
              <div key={d.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 12px', border: '1px solid #f3f4f6', borderRadius: '8px', marginBottom: '6px'
              }}>
                <span style={{ fontSize: '14px' }}>👨‍⚕️ {d.name}</span>
                <button onClick={() => deleteDentist(d.id)} style={{
                  border: 'none', background: '#fef2f2', color: '#dc2626',
                  borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit'
                }}>ลบ</button>
              </div>
            ))}
          </div>
        )}

        {/* ─── ROOMS ─── */}
        {tab === 1 && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '15px', color: '#1a2e25' }}>ห้องฟัน</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                value={newRoom}
                onChange={e => setNewRoom(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addRoom()}
                placeholder="ชื่อห้อง เช่น ห้อง 1, ห้องศัลยกรรม"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button onClick={addRoom} disabled={saving} style={btnStyle()}>+ เพิ่ม</button>
            </div>
            {rooms.map(r => (
              <div key={r.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 12px', border: '1px solid #f3f4f6', borderRadius: '8px', marginBottom: '6px'
              }}>
                <span style={{ fontSize: '14px' }}>🚪 {r.name}</span>
                <button onClick={() => deleteRoom(r.id)} style={{
                  border: 'none', background: '#fef2f2', color: '#dc2626',
                  borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit'
                }}>ลบ</button>
              </div>
            ))}
          </div>
        )}

        {/* ─── PROCEDURES ─── */}
        {tab === 2 && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '15px', color: '#1a2e25' }}>รายการงานทันตกรรม</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
              <input
                value={newProc.name}
                onChange={e => setNewProc(p => ({ ...p, name: e.target.value }))}
                placeholder="ชื่อรายการ"
                style={inputStyle}
              />
              <input
                type="number" min="5" max="240" step="5"
                value={newProc.duration}
                onChange={e => setNewProc(p => ({ ...p, duration: e.target.value }))}
                style={{ ...inputStyle, width: '70px', textAlign: 'center' }}
              />
              <input
                value={newProc.category}
                onChange={e => setNewProc(p => ({ ...p, category: e.target.value }))}
                placeholder="หมวด"
                list="cats"
                style={{ ...inputStyle, width: '90px' }}
              />
              <datalist id="cats">{categories.map(c => <option key={c} value={c} />)}</datalist>
              <button onClick={addProc} disabled={saving} style={btnStyle()}>+ เพิ่ม</button>
            </div>

            {categories.map(cat => (
              <div key={cat} style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', marginBottom: '6px', textTransform: 'uppercase' }}>{cat}</div>
                {procedures.filter(p => p.category === cat).map(p => (
                  <div key={p.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', border: '1px solid #f3f4f6', borderRadius: '8px', marginBottom: '4px'
                  }}>
                    <span style={{ fontSize: '13px', flex: 1 }}>{p.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number" min="5" max="240" step="5"
                        value={p.duration}
                        onChange={e => updateProcDuration(p.id, e.target.value)}
                        style={{ width: '60px', padding: '4px 6px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', textAlign: 'center', fontFamily: 'inherit' }}
                      />
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>นาที</span>
                      <button onClick={() => deleteProc(p.id)} style={{
                        border: 'none', background: '#fef2f2', color: '#dc2626',
                        borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit'
                      }}>ลบ</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ─── USERS ─── */}
        {tab === 3 && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '15px', color: '#1a2e25' }}>ผู้ใช้งานระบบ</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input value={newUser.name} onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))} placeholder="ชื่อ" style={inputStyle} />
                <input value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} placeholder="อีเมล" type="email" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px' }}>
                <input value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} placeholder="รหัสผ่าน" type="password" style={inputStyle} />
                <select value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))} style={inputStyle}>
                  <option value="admin">Admin</option>
                  <option value="counter">เคาท์เตอร์</option>
                  <option value="room">ห้องฟัน</option>
                </select>
                <button onClick={addUser} disabled={saving} style={btnStyle()}>+ เพิ่ม</button>
              </div>
            </div>

            {users.map(u => (
              <div key={u.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 12px', border: '1px solid #f3f4f6', borderRadius: '8px', marginBottom: '6px'
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>{u.name}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>{u.email}</div>
                </div>
                <span style={{
                  background: u.role === 'admin' ? '#fef3c7' : u.role === 'counter' ? '#eff6ff' : '#f0faf5',
                  color: u.role === 'admin' ? '#d97706' : u.role === 'counter' ? '#3b82f6' : '#34a878',
                  padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600'
                }}>{u.role}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
