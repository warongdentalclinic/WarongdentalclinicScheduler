// src/pages/SchedulerPage.js
import React, { useState, useEffect } from 'react';
import { subscribeToDate, subscribeToRecalls, markRecallNotified, getCollection } from '../firebase/firestore.js';
import { todayStr, formatDateThai, playNotification, DEFAULT_PROCEDURES } from '../utils/defaults.js';
import AppointmentCard from '../components/AppointmentCard.jsx';
import AppointmentModal from '../components/AppointmentModal.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function SchedulerPage() {
  const { userRole, userName, logout } = useAuth();
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [appointments, setAppointments] = useState([]);
  const [recalls, setRecalls] = useState([]);
  const [showNewAppt, setShowNewAppt] = useState(false);
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [procedures, setProcedures] = useState(DEFAULT_PROCEDURES);
  const [dentists, setDentists] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filterDentist, setFilterDentist] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [prevApptIds, setPrevApptIds] = useState(new Set());

  // Load settings
  useEffect(() => {
    getCollection('dentists').then(d => setDentists(d.sort((a, b) => a.name.localeCompare(b.name, 'th'))));
    getCollection('rooms').then(r => setRooms(r.sort((a, b) => a.name.localeCompare(b.name, 'th'))));
    getCollection('procedures').then(p => {
      if (p.length > 0) setProcedures(p);
    });
  }, []);

  // Subscribe to appointments
  useEffect(() => {
    const unsub = subscribeToDate(selectedDate, (appts) => {
      // Detect new status changes and play sounds
      appts.forEach(a => {
        if (prevApptIds.has(a.id)) {
          // status change notification is handled by the card component
        }
      });
      setPrevApptIds(new Set(appts.map(a => a.id)));
      setAppointments(appts);
    });
    return unsub;
  }, [selectedDate]);

  // Subscribe to recalls
  useEffect(() => {
    const unsub = subscribeToRecalls(setRecalls);
    return unsub;
  }, []);

  const filteredAppts = appointments.filter(a => {
    if (filterDentist !== 'all' && a.dentistId !== filterDentist) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    return true;
  });

  const countByStatus = (key) => appointments.filter(a => a.status === key).length;

  const navigateDate = (delta) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8faf9',
      fontFamily: "'Sarabun', sans-serif"
    }}>
      {/* Top nav */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>🦷</span>
          <div>
            <div style={{ fontWeight: '800', fontSize: '15px', color: '#1a2e25' }}>Warong Dental</div>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>{userName} · {userRole}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {recalls.length > 0 && (
            <div style={{
              background: '#fef3c7', border: '1px solid #fde68a',
              borderRadius: '8px', padding: '4px 10px',
              fontSize: '12px', color: '#d97706', fontWeight: '600',
              cursor: 'pointer'
            }} onClick={() => alert(recalls.map(r => `${r.patientName} (${r.patientPhone}) - Recall ${r.recallMonths} เดือน`).join('\n'))}>
              🔔 Recall {recalls.length}
            </div>
          )}
          {userRole === 'admin' && (
            <a href="/settings" style={{
              padding: '6px 12px', background: '#f3f4f6',
              borderRadius: '8px', fontSize: '13px', color: '#374151',
              textDecoration: 'none', fontWeight: '600'
            }}>⚙️</a>
          )}
          <button onClick={logout} style={{
            padding: '6px 12px', background: '#f3f4f6', border: 'none',
            borderRadius: '8px', fontSize: '13px', color: '#374151',
            cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600'
          }}>ออก</button>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px' }}>
        {/* Date navigator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          marginBottom: '16px', background: 'white',
          borderRadius: '12px', padding: '12px 16px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
        }}>
          <button onClick={() => navigateDate(-1)} style={{
            border: 'none', background: '#f3f4f6', borderRadius: '8px',
            width: '36px', height: '36px', cursor: 'pointer', fontSize: '16px'
          }}>‹</button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              style={{
                border: 'none', background: 'transparent',
                fontSize: '16px', fontWeight: '700', color: '#1a2e25',
                textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit'
              }}
            />
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
              {formatDateThai(selectedDate)}
              {selectedDate === todayStr() && <span style={{ color: '#34a878', marginLeft: '6px' }}>• วันนี้</span>}
            </div>
          </div>
          <button onClick={() => navigateDate(1)} style={{
            border: 'none', background: '#f3f4f6', borderRadius: '8px',
            width: '36px', height: '36px', cursor: 'pointer', fontSize: '16px'
          }}>›</button>
          <button onClick={() => setSelectedDate(todayStr())} style={{
            border: 'none', background: '#34a878', color: 'white',
            borderRadius: '8px', padding: '0 12px', height: '36px',
            cursor: 'pointer', fontSize: '12px', fontWeight: '700', fontFamily: 'inherit'
          }}>วันนี้</button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
          {[
            { label: 'นัดทั้งหมด', value: appointments.length, color: '#6b7280' },
            { label: 'รอวัด BP', value: countByStatus('arrived'), color: '#f59e0b' },
            { label: 'ในห้องรักษา', value: countByStatus('in_chair'), color: '#8b5cf6' },
            { label: 'เสร็จแล้ว', value: countByStatus('done'), color: '#10b981' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'white', borderRadius: '10px', padding: '10px 12px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center'
            }}>
              <div style={{ fontSize: '22px', fontWeight: '800', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters + action buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <select value={filterDentist} onChange={e => setFilterDentist(e.target.value)} style={{
            padding: '7px 10px', border: '1.5px solid #e5e7eb', borderRadius: '8px',
            fontSize: '13px', background: 'white', flex: '1', minWidth: '120px', fontFamily: 'inherit'
          }}>
            <option value="all">ทันตแพทย์ทั้งหมด</option>
            {dentists.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{
            padding: '7px 10px', border: '1.5px solid #e5e7eb', borderRadius: '8px',
            fontSize: '13px', background: 'white', flex: '1', minWidth: '110px', fontFamily: 'inherit'
          }}>
            <option value="all">ทุกสถานะ</option>
            <option value="scheduled">นัดหมาย</option>
            <option value="arrived">รอวัด BP</option>
            <option value="bp_done">วัด BP เสร็จ</option>
            <option value="in_chair">ในห้องรักษา</option>
            <option value="done">เสร็จแล้ว</option>
          </select>
        </div>

        {/* Appointment buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => { setIsWalkIn(false); setShowNewAppt(true); }} style={{
            flex: 1, padding: '11px',
            background: 'linear-gradient(135deg, #34a878, #2d9066)',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 12px rgba(52,168,120,0.3)'
          }}>
            + นัดหมายใหม่
          </button>
          <button onClick={() => { setIsWalkIn(true); setShowNewAppt(true); }} style={{
            flex: 1, padding: '11px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 12px rgba(245,158,11,0.3)'
          }}>
            🚶 Walk-in
          </button>
        </div>

        {/* Appointment list */}
        {filteredAppts.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 20px',
            background: 'white', borderRadius: '12px',
            color: '#9ca3af', fontSize: '14px'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div>
            ไม่มีการนัดหมายในวันนี้
          </div>
        ) : (
          filteredAppts.map(appt => (
            <AppointmentCard
              key={appt.id}
              appt={appt}
              procedures={procedures}
              userRole={userRole}
            />
          ))
        )}
      </div>

      {showNewAppt && (
        <AppointmentModal
          date={selectedDate}
          procedures={procedures}
          dentists={dentists}
          rooms={rooms}
          isWalkIn={isWalkIn}
          onClose={() => setShowNewAppt(false)}
          onSaved={() => {}}
        />
      )}
    </div>
  );
}
