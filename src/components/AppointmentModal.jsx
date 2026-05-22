// src/components/AppointmentModal.js
import React, { useState, useEffect } from 'react';
import { addAppointment } from '../firebase/firestore';
import PatientModal from './PatientModal';

export default function AppointmentModal({ date, procedures, dentists, rooms, onClose, onSaved, isWalkIn = false, prefillTime = '' }) {
  const [showPatient, setShowPatient] = useState(false);
  const [patient, setPatient] = useState(null);
  const [selectedDentist, setSelectedDentist] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedProcs, setSelectedProcs] = useState([]);
  const [customDurations, setCustomDurations] = useState({});
  const [time, setTime] = useState(prefillTime || '09:00');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const totalDuration = selectedProcs.reduce((sum, pName) => {
    const proc = procedures.find(p => p.name === pName);
    return sum + (customDurations[pName] ?? (proc?.duration || 30));
  }, 0);

  const toggleProc = (pName) => {
    setSelectedProcs(prev =>
      prev.includes(pName) ? prev.filter(x => x !== pName) : [...prev, pName]
    );
  };

  const handleSave = async () => {
    if (!patient) { setError('กรุณาเลือกคนไข้'); return; }
    if (!selectedDentist) { setError('กรุณาเลือกทันตแพทย์'); return; }
    if (selectedProcs.length === 0) { setError('กรุณาเลือกงานที่จะทำ'); return; }
    setSaving(true);
    try {
      const procDetails = selectedProcs.map(pName => ({
        name: pName,
        duration: customDurations[pName] ?? procedures.find(p => p.name === pName)?.duration ?? 30
      }));
      await addAppointment({
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientHN: patient.hn || '',
        patientPhone: patient.phone || '',
        dentistId: selectedDentist,
        dentistName: dentists.find(d => d.id === selectedDentist)?.name || selectedDentist,
        roomId: selectedRoom,
        roomName: rooms.find(r => r.id === selectedRoom)?.name || selectedRoom,
        procedures: procDetails,
        totalDuration,
        date,
        time,
        note,
        isWalkIn,
        nextVisitInfo: null,
      });
      onSaved?.();
      onClose();
    } catch {
      setError('บันทึกไม่สำเร็จ กรุณาลองใหม่');
    }
    setSaving(false);
  };

  const categories = [...new Set(procedures.map(p => p.category))];

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    border: '1.5px solid #e5e7eb', borderRadius: '8px',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit'
  };

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 999, padding: '16px'
      }}>
        <div style={{
          background: 'white', borderRadius: '20px', width: '100%', maxWidth: '540px',
          maxHeight: '92vh', overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
        }}>
          {/* Header */}
          <div style={{
            padding: '20px 24px', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid #f3f4f6', position: 'sticky', top: 0, background: 'white', zIndex: 1
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1a2e25' }}>
                {isWalkIn ? '🚶 แทรกคิว Walk-in' : '📅 นัดหมายใหม่'}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>
                วันที่ {date}
              </p>
            </div>
            <button onClick={onClose} style={{
              border: 'none', background: '#f3f4f6', borderRadius: '8px',
              width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px'
            }}>✕</button>
          </div>

          <div style={{ padding: '20px 24px' }}>
            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
                padding: '8px 12px', color: '#dc2626', fontSize: '13px', marginBottom: '14px'
              }}>{error}</div>
            )}

            {/* Patient */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                คนไข้ *
              </label>
              {patient ? (
                <div style={{
                  border: '1.5px solid #34a878', borderRadius: '10px', padding: '10px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#f0faf5'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1a2e25' }}>
                      {patient.firstName} {patient.lastName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      HN: {patient.hn || '-'} | 📞 {patient.phone || '-'}
                    </div>
                  </div>
                  <button onClick={() => setPatient(null)} style={{
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    color: '#6b7280', fontSize: '18px'
                  }}>✕</button>
                </div>
              ) : (
                <button onClick={() => setShowPatient(true)} style={{
                  width: '100%', padding: '11px',
                  border: '2px dashed #d1fae5', borderRadius: '10px',
                  background: '#f0faf5', color: '#34a878', fontWeight: '600',
                  cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit'
                }}>
                  + เลือกหรือเพิ่มคนไข้
                </button>
              )}
            </div>

            {/* Time / Dentist / Room */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                  เวลา *
                </label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                  ทันตแพทย์ *
                </label>
                <select value={selectedDentist} onChange={e => setSelectedDentist(e.target.value)} style={inputStyle}>
                  <option value="">เลือก...</option>
                  {dentists.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                  ห้อง
                </label>
                <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)} style={inputStyle}>
                  <option value="">เลือก...</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>

            {/* Procedures */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                งานที่จะทำ * (เลือกได้หลายอย่าง)
              </label>
              {categories.map(cat => (
                <div key={cat} style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '5px' }}>
                    {cat}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {procedures.filter(p => p.category === cat).map(p => {
                      const selected = selectedProcs.includes(p.name);
                      return (
                        <button
                          key={p.name}
                          onClick={() => toggleProc(p.name)}
                          style={{
                            padding: '5px 10px', border: '1.5px solid',
                            borderColor: selected ? '#34a878' : '#e5e7eb',
                            borderRadius: '20px', fontSize: '13px',
                            background: selected ? '#f0faf5' : 'white',
                            color: selected ? '#1a2e25' : '#6b7280',
                            cursor: 'pointer', fontFamily: 'inherit',
                            fontWeight: selected ? '600' : '400'
                          }}
                        >
                          {selected ? '✓ ' : ''}{p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Duration adjustment for selected procs */}
            {selectedProcs.length > 0 && (
              <div style={{
                border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 14px',
                marginBottom: '14px', background: '#fafafa'
              }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  ⏱ ปรับระยะเวลา (นาที)
                </div>
                {selectedProcs.map(pName => {
                  const proc = procedures.find(p => p.name === pName);
                  const dur = customDurations[pName] ?? proc?.duration ?? 30;
                  return (
                    <div key={pName} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ flex: 1, fontSize: '13px', color: '#374151' }}>{pName}</span>
                      <input
                        type="number" min="5" max="240" step="5"
                        value={dur}
                        onChange={e => setCustomDurations(prev => ({ ...prev, [pName]: Number(e.target.value) }))}
                        style={{ width: '70px', padding: '4px 8px', border: '1.5px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', textAlign: 'center', fontFamily: 'inherit' }}
                      />
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>นาที</span>
                    </div>
                  );
                })}
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#34a878' }}>
                    รวม: {totalDuration} นาที
                  </span>
                </div>
              </div>
            )}

            {/* Note */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                หมายเหตุ
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                placeholder="บันทึกเพิ่มเติม..."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            <button onClick={handleSave} disabled={saving} style={{
              width: '100%', padding: '13px',
              background: saving ? '#9ca3af' : isWalkIn ? '#f59e0b' : '#34a878',
              color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '15px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              boxShadow: `0 4px 12px ${isWalkIn ? 'rgba(245,158,11,0.3)' : 'rgba(52,168,120,0.3)'}`
            }}>
              {saving ? 'กำลังบันทึก...' : isWalkIn ? '🚶 แทรกคิว Walk-in' : '📅 บันทึกการนัด'}
            </button>
          </div>
        </div>
      </div>

      {showPatient && (
        <PatientModal
          onSelect={p => { setPatient(p); setShowPatient(false); }}
          onClose={() => setShowPatient(false)}
        />
      )}
    </>
  );
}
