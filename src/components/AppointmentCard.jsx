// src/components/AppointmentCard.js
import React, { useState } from 'react';
import { updateAppointment } from '../firebase/firestore.js';
import { STATUS_FLOW, STATUS_NEXT, playNotification } from '../utils/defaults.js';
import NextVisitModal from './NextVisitModal.jsx';

export default function AppointmentCard({ appt, procedures, userRole }) {
  const [showNextVisit, setShowNextVisit] = useState(false);

  const currentStatus = STATUS_FLOW.find(s => s.key === appt.status) || STATUS_FLOW[0];
  const nextStatusKey = STATUS_NEXT[appt.status];
  const nextStatus = STATUS_FLOW.find(s => s.key === nextStatusKey);

  const handleAdvanceStatus = async () => {
    if (!nextStatusKey) return;
    if (nextStatusKey === 'done') {
      setShowNextVisit(true);
      return;
    }
    await updateAppointment(appt.id, { status: nextStatusKey });
    playNotification(nextStatusKey);
  };

  const statusIdx = STATUS_FLOW.findIndex(s => s.key === appt.status);

  return (
    <>
      <div style={{
        background: 'white',
        border: `2px solid ${currentStatus.color}22`,
        borderLeft: `4px solid ${currentStatus.color}`,
        borderRadius: '12px',
        padding: '14px 16px',
        marginBottom: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        transition: 'all 0.2s'
      }}>
        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: '700', fontSize: '15px', color: '#1a2e25' }}>
                {appt.patientName}
              </span>
              {appt.isWalkIn && (
                <span style={{
                  background: '#fef3c7', color: '#d97706', padding: '2px 7px',
                  borderRadius: '20px', fontSize: '11px', fontWeight: '700'
                }}>WALK-IN</span>
              )}
              <span style={{
                background: currentStatus.bg, color: currentStatus.color,
                padding: '2px 8px', borderRadius: '20px',
                fontSize: '11px', fontWeight: '700'
              }}>
                {currentStatus.label}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '3px' }}>
              HN: {appt.patientHN || '-'} &nbsp;|&nbsp; 📞 {appt.patientPhone || '-'}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#1a2e25' }}>
              {appt.time}
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>
              {appt.totalDuration} นาที
            </div>
          </div>
        </div>

        {/* Procedures */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
          {(appt.procedures || []).map((p, i) => (
            <span key={i} style={{
              background: '#f0faf5', color: '#2d9066', padding: '3px 8px',
              borderRadius: '6px', fontSize: '12px', fontWeight: '600'
            }}>{p.name}</span>
          ))}
        </div>

        {/* Dentist / Room */}
        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>
          <span>👨‍⚕️ {appt.dentistName || '-'}</span>
          <span>🚪 {appt.roomName || '-'}</span>
        </div>

        {/* Status progress bar */}
        <div style={{ display: 'flex', gap: '3px', marginBottom: '10px' }}>
          {STATUS_FLOW.map((s, i) => (
            <div key={s.key} style={{
              flex: 1, height: '4px', borderRadius: '2px',
              background: i <= statusIdx ? s.color : '#e5e7eb',
              transition: 'background 0.3s'
            }} />
          ))}
        </div>

        {/* Next Visit Info (if done, show what counter needs to book) */}
        {appt.status === 'done' && appt.nextVisitInfo && appt.nextVisitInfo.type === 'next' && appt.nextVisitInfo.status === 'pending_booking' && (
          <div style={{
            background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px',
            padding: '8px 12px', marginBottom: '8px'
          }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#d97706', marginBottom: '3px' }}>
              📋 รอนัดครั้งถัดไป
            </div>
            <div style={{ fontSize: '12px', color: '#92400e' }}>
              งาน: {appt.nextVisitInfo.procedures?.map(p => p.name).join(', ')}
            </div>
            <div style={{ fontSize: '12px', color: '#92400e' }}>
              เวลาที่ต้องการ: {appt.nextVisitInfo.totalDuration} นาที
              {appt.nextVisitInfo.urgency && ` · ${appt.nextVisitInfo.urgency}`}
            </div>
            {appt.nextVisitInfo.note && (
              <div style={{ fontSize: '12px', color: '#92400e' }}>หมายเหตุ: {appt.nextVisitInfo.note}</div>
            )}
          </div>
        )}

        {appt.status === 'done' && appt.nextVisitInfo?.type === 'recall' && (
          <div style={{
            background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px',
            padding: '8px 12px', marginBottom: '8px', fontSize: '12px', color: '#1d4ed8'
          }}>
            🔔 Recall {appt.nextVisitInfo.recallMonths} เดือน ({appt.nextVisitInfo.recallDate})
          </div>
        )}

        {appt.note && (
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
            📝 {appt.note}
          </div>
        )}

        {/* Action button */}
        {appt.status !== 'done' && nextStatus && (
          <button onClick={handleAdvanceStatus} style={{
            width: '100%', padding: '9px',
            background: `linear-gradient(135deg, ${nextStatus.color}, ${nextStatus.color}cc)`,
            color: 'white', border: 'none', borderRadius: '8px',
            fontSize: '13px', fontWeight: '700', cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: `0 3px 8px ${nextStatus.color}40`
          }}>
            → {nextStatus.label}
          </button>
        )}
      </div>

      {showNextVisit && (
        <NextVisitModal
          appointment={appt}
          procedures={procedures}
          onClose={() => setShowNextVisit(false)}
          onSaved={() => playNotification('done')}
        />
      )}
    </>
  );
}
