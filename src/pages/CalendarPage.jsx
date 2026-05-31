// src/pages/CalendarPage.jsx
import React, { useState, useEffect } from 'react';
import { getCollection } from '../firebase/firestore.js';
import { CLINIC_HOURS, formatDateThai } from '../utils/defaults.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config.js';

const DAYS_TH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export default function CalendarPage() {
  const [dentists, setDentists] = useState([]);
  const [appointments, setAppointments] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [closedDays, setClosedDays] = useState(new Set());

  useEffect(() => {
    getCollection('dentists').then(setDentists);
    loadMonthAppointments();
  }, [currentMonth]);

  const loadMonthAppointments = async () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = `${year}-${String(month+1).padStart(2,'0')}-01`;
    const lastDay = `${year}-${String(month+1).padStart(2,'0')}-${new Date(year, month+1, 0).getDate()}`;
    const q = query(collection(db, 'appointments'), where('date', '>=', firstDay), where('date', '<=', lastDay));
    const snap = await getDocs(q);
    const map = {};
    snap.docs.forEach(d => {
      const a = d.data();
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    setAppointments(map);
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < first.getDay(); i++) days.push(null);
    for (let i = 1; i <= last.getDate(); i++) days.push(new Date(year, month, i));
    return days;
  };

  const toggleClosedDay = (dateStr) => {
    setClosedDays(prev => {
      const n = new Set(prev);
      if (n.has(dateStr)) n.delete(dateStr); else n.add(dateStr);
      return n;
    });
  };

  const getDentistsForDay = (date) => {
    const dow = date.getDay();
    return dentists.filter(d => {
      const sched = d.schedule?.[dow];
      if (sched === false) return false;
      if (sched === undefined) return !!CLINIC_HOURS[dow]; // default clinic hours
      return true;
    });
  };

  const getDateStr = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  };

  const days = getDaysInMonth();
  const monthNames = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const today = new Date();
  const todayStr = getDateStr(today);

  return (
    <div style={{ minHeight:'100vh', background:'#f8faf9', fontFamily:"'Sarabun', sans-serif" }}>
      <div style={{ background:'white', borderBottom:'1px solid #e5e7eb', padding:'12px 16px', display:'flex', alignItems:'center', gap:'12px', position:'sticky', top:0, zIndex:10 }}>
        <a href="/" style={{ fontSize:'20px', textDecoration:'none' }}>‹</a>
        <h1 style={{ margin:0, fontSize:'18px', fontWeight:'700', color:'#1a2e25' }}>📅 ปฏิทินตารางแพทย์</h1>
      </div>

      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'16px' }}>
        {/* Legend */}
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'14px' }}>
          {dentists.map(d => (
            <div key={d.id} style={{ display:'flex', alignItems:'center', gap:'5px', background:'white', padding:'4px 10px', borderRadius:'20px', border:'1px solid #e5e7eb', fontSize:'12px' }}>
              <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:d.color||'#34a878' }} />
              {d.nickname || d.name}
            </div>
          ))}
          <div style={{ display:'flex', alignItems:'center', gap:'5px', background:'#fee2e2', padding:'4px 10px', borderRadius:'20px', border:'1px solid #fecaca', fontSize:'12px', color:'#dc2626' }}>
            ⛔ คลินิกปิด
          </div>
        </div>

        {/* Month navigation */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px', background:'white', borderRadius:'12px', padding:'12px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth()-1))} style={{ border:'none', background:'#f3f4f6', borderRadius:'8px', width:'36px', height:'36px', cursor:'pointer', fontSize:'16px' }}>‹</button>
          <div style={{ flex:1, textAlign:'center', fontWeight:'700', fontSize:'16px', color:'#1a2e25' }}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()+543}
          </div>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth()+1))} style={{ border:'none', background:'#f3f4f6', borderRadius:'8px', width:'36px', height:'36px', cursor:'pointer', fontSize:'16px' }}>›</button>
          <button onClick={() => setCurrentMonth(new Date())} style={{ border:'none', background:'#34a878', color:'white', borderRadius:'8px', padding:'0 12px', height:'36px', cursor:'pointer', fontSize:'12px', fontWeight:'700', fontFamily:'inherit' }}>วันนี้</button>
        </div>

        {/* Calendar grid */}
        <div style={{ background:'white', borderRadius:'12px', padding:'16px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          {/* Day headers */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'4px', marginBottom:'8px' }}>
            {DAYS_TH.map((d, i) => (
              <div key={d} style={{ textAlign:'center', fontSize:'12px', fontWeight:'700', color: i===0?'#ef4444':i===6?'#3b82f6':'#6b7280', padding:'4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Days */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'4px' }}>
            {days.map((date, i) => {
              if (!date) return <div key={i} />;
              const dateStr = getDateStr(date);
              const dow = date.getDay();
              const isClosed = closedDays.has(dateStr) || !CLINIC_HOURS[dow];
              const isToday = dateStr === todayStr;
              const activeDentists = isClosed ? [] : getDentistsForDay(date);
              const apptCount = appointments[dateStr]?.length || 0;

              return (
                <div key={dateStr} style={{
                  minHeight:'80px', border:`1px solid ${isToday?'#34a878':isClosed?'#fecaca':'#f3f4f6'}`,
                  borderRadius:'8px', padding:'4px', cursor:'pointer',
                  background: isClosed ? '#fef2f2' : isToday ? '#f0faf5' : 'white',
                  position:'relative', overflow:'hidden'
                }} onClick={() => toggleClosedDay(dateStr)}>
                  {/* Date number */}
                  <div style={{
                    fontSize:'13px', fontWeight: isToday?'800':'600',
                    color: isClosed?'#dc2626': dow===0?'#ef4444':dow===6?'#3b82f6':'#1a2e25',
                    marginBottom:'3px',
                    textDecoration: isClosed?'line-through':'none'
                  }}>
                    {date.getDate()}
                    {isClosed && <span style={{ fontSize:'10px', marginLeft:'2px' }}>⛔</span>}
                  </div>

                  {/* Dentist dots */}
                  {!isClosed && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'2px', marginBottom:'2px' }}>
                      {activeDentists.map(d => (
                        <div key={d.id} title={d.nickname||d.name} style={{
                          width:'8px', height:'8px', borderRadius:'50%',
                          background: d.color || '#34a878', flexShrink:0
                        }} />
                      ))}
                    </div>
                  )}

                  {/* Appointment count */}
                  {apptCount > 0 && !isClosed && (
                    <div style={{
                      fontSize:'10px', background:'#34a878', color:'white',
                      borderRadius:'4px', padding:'1px 4px', display:'inline-block', fontWeight:'700'
                    }}>
                      {apptCount} นัด
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <p style={{ fontSize:'11px', color:'#9ca3af', textAlign:'center', marginTop:'8px' }}>
          กดที่วันใดก็ได้เพื่อมาร์คว่าคลินิกปิด (ขีดฆ่า) กดอีกครั้งเพื่อยกเลิก
        </p>
      </div>
    </div>
  );
}
