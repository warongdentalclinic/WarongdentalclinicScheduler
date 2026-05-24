// src/components/NextVisitModal.js
import React, { useState } from 'react';
import { updateAppointment, addRecall } from '../firebase/firestore.js';

export default function NextVisitModal({ appointment, procedures, onClose, onSaved }) {
  const [mode, setMode] = useState('next'); // next | recall | none
  const [selectedProcs, setSelectedProcs] = useState([]);
  const [customDurations, setCustomDurations] = useState({});
  const [urgency, setUrgency] = useState(''); // within X weeks/months
  const [recallMonths, setRecallMonths] = useState(6);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
    try {
      let nextVisitInfo = null;

      if (mode === 'next' && selectedProcs.length > 0) {
        const procDetails = selectedProcs.map(pName => ({
          name: pName,
          duration: customDurations[pName] ?? procedures.find(p => p.name === pName)?.duration ?? 30
        }));
        nextVisitInfo = {
          type: 'next',
          procedures: procDetails,
          totalDuration,
          urgency,
          note,
          status: 'pending_booking' // counter needs to book
        };
      } else if (mode === 'recall') {
        const recallDate = new Date();
        recallDate.setMonth(recallDate.getMonth() + recallMonths);
        nextVisitInfo = {
          type: 'recall',
          recallMonths,
          recallDate: recallDate.toISOString().split('T')[0],
          note,
          status: 'recall'
        };
        // Save recall reminder
        await addRecall({
          patientId: appointment.patientId,
          patientName: appointment.patientName,
          patientPhone: appointment.patientPhone,
          patientHN: appointment.patientHN,
          recallDate: recallDate,
          recallMonths,
          fromAppointmentId: appointment.id,
        });
      } else if (mode === 'none') {
        nextVisitInfo = { type: 'none', note };
      }

      await updateAppointment(appointment.id, {
        status: 'done',
        nextVisitInfo,
        completedAt: new Date().toISOString()
      });

      onSaved?.();
      onClose();
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const categories = [...new Set(procedures.map(p => p.category))];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1010, padding: '16px'
    }}>
      <div style={{
        background: 'white', borderRadius: '20px', width: '100%', maxWidth: '500px',
        maxHeight: '90vh', overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)'
      }}>
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #f3f4f6',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: 'white', zIndex: 1
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1a2e25' }}>
              ✅ บันทึกผลการรักษา
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>
              {appointment.patientName} (HN: {appointment.patientHN || '-'})
            </p>
          </div>
          <button onClick={onClose} style={{
            border: 'none', background: '#f3f4f6', borderRadius: '8px',
            width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px'
          }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* Mode selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              การนัดครั้งถัดไป
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { key: 'next', label: '📅 นัดต่อ', color: '#34a878' },
                { key: 'recall', label: '🔔 Recall', color: '#3b82f6' },
                { key: 'none', label: '✓ ไม่ต้องนัด', color: '#6b7280' },
              ].map(m => (
                <button key={m.key} onClick={() => setMode(m.key)} style={{
                  flex: 1, padding: '10px 6px',
                  border: `2px solid ${mode === m.key ? m.color : '#e5e7eb'}`,
                  borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                  background: mode === m.key ? m.color : 'white',
                  color: mode === m.key ? 'white' : '#6b7280',
                  cursor: 'pointer', fontFamily: 'inherit'
                }}>{m.label}</button>
              ))}
            </div>
          </div>

          {/* Next visit: select procedures */}
          {mode === 'next' && (
            <>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  งานที่จะทำครั้งถัดไป
                </label>
                {categories.map(cat => (
                  <div key={cat} style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', marginBottom: '4px' }}>{cat}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {procedures.filter(p => p.category === cat).map(p => {
                        const sel = selectedProcs.includes(p.name);
                        return (
                          <button key={p.name} onClick={() => toggleProc(p.name)} style={{
                            padding: '4px 10px', border: `1.5px solid ${sel ? '#34a878' : '#e5e7eb'}`,
                            borderRadius: '20px', fontSize: '12px',
                            background: sel ? '#f0faf5' : 'white',
                            color: sel ? '#1a2e25' : '#6b7280',
                            cursor: 'pointer', fontFamily: 'inherit', fontWeight: sel ? '600' : '400'
                          }}>
                            {sel ? '✓ ' : ''}{p.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {selectedProcs.length > 0 && (
                <div style={{
                  border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px',
                  marginBottom: '14px', background: '#fafafa'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    ⏱ ระยะเวลาที่ต้องการ
                  </div>
                  {selectedProcs.map(pName => {
                    const proc = procedures.find(p => p.name === pName);
                    const dur = customDurations[pName] ?? proc?.duration ?? 30;
                    return (
                      <div key={pName} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ flex: 1, fontSize: '13px' }}>{pName}</span>
                        <input type="number" min="5" max="240" step="5" value={dur}
                          onChange={e => setCustomDurations(prev => ({ ...prev, [pName]: Number(e.target.value) }))}
                          style={{ width: '60px', padding: '4px 6px', border: '1.5px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', textAlign: 'center', fontFamily: 'inherit' }}
                        />
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>นาที</span>
                      </div>
                    );
                  })}
                  <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#34a878' }}>รวม: {totalDuration} นาที</span>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                  ควรนัดภายใน (ไม่บังคับ)
                </label>
                <input
                  value={urgency}
                  onChange={e => setUrgency(e.target.value)}
                  placeholder="เช่น ภายใน 2 สัปดาห์, 1 เดือน"
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: '1.5px solid #e5e7eb', borderRadius: '8px',
                    fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit'
                  }}
                />
              </div>
            </>
          )}

          {/* Recall */}
          {mode === 'recall' && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                Recall หลังจาก
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[3, 6, 12].map(m => (
                  <button key={m} onClick={() => setRecallMonths(m)} style={{
                    flex: 1, padding: '10px',
                    border: `2px solid ${recallMonths === m ? '#3b82f6' : '#e5e7eb'}`,
                    borderRadius: '10px', fontSize: '14px', fontWeight: '600',
                    background: recallMonths === m ? '#eff6ff' : 'white',
                    color: recallMonths === m ? '#3b82f6' : '#6b7280',
                    cursor: 'pointer', fontFamily: 'inherit'
                  }}>{m} เดือน</button>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
              หมายเหตุถึงเคาท์เตอร์
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="คำแนะนำเพิ่มเติม..."
              style={{
                width: '100%', padding: '9px 12px',
                border: '1.5px solid #e5e7eb', borderRadius: '8px',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                resize: 'vertical', fontFamily: 'inherit'
              }}
            />
          </div>

          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', padding: '13px',
            background: saving ? '#9ca3af' : '#10b981',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '15px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
          }}>
            {saving ? 'กำลังบันทึก...' : '✅ บันทึกเสร็จสิ้น'}
          </button>
        </div>
      </div>
    </div>
  );
}
