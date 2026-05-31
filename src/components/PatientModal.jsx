// src/components/PatientModal.jsx
import React, { useState, useRef } from 'react';
import { addPatient, searchPatients, getPatientByHN } from '../firebase/firestore.js';

const GEMINI_KEY_STORAGE = 'dental_gemini_key';

export default function PatientModal({ onSelect, onClose }) {
  const [tab, setTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('hn');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [imgPreview, setImgPreview] = useState(null);
  const [imgBase64, setImgBase64] = useState(null);
  const [aiReading, setAiReading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [apiKey, setApiKey] = useState(localStorage.getItem(GEMINI_KEY_STORAGE) || '');
  const [newPatient, setNewPatient] = useState({ hn: '', firstName: '', lastName: '', phone: '', dob: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true); setError('');
    try {
      let res = [];
      if (searchField === 'hn') {
        const p = await getPatientByHN(searchQuery.trim());
        res = p ? [p] : [];
      } else {
        res = await searchPatients(searchField, searchQuery.trim());
      }
      setResults(res);
      if (res.length === 0) setError('ไม่พบข้อมูลคนไข้');
    } catch { setError('เกิดข้อผิดพลาด'); }
    setSearching(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImgBase64(ev.target.result.split(',')[1]);
      setImgPreview(ev.target.result);
      setExtractedData(null);
    };
    reader.readAsDataURL(file);
  };

  const handleReadScreenshot = async () => {
    if (!imgBase64) return;
    if (!apiKey) { setError('กรุณากรอก Gemini API Key ก่อน'); return; }
    localStorage.setItem(GEMINI_KEY_STORAGE, apiKey);
    setAiReading(true); setError('');
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: imgBase64
                  }
                },
                {
                  text: `นี่คือภาพหน้าจอจากโปรแกรมเวชระเบียนทันตกรรม กรุณาอ่านและดึงข้อมูลคนไข้ออกมาในรูปแบบ JSON เท่านั้น ไม่ต้องมีข้อความอื่น:
{"hn":"รหัส HN","firstName":"ชื่อ","lastName":"นามสกุล","phone":"เบอร์โทร","dob":"วันเกิด YYYY-MM-DD"}
ถ้าไม่พบข้อมูลใดให้ใส่ค่าว่าง ตอบ JSON อย่างเดียวเท่านั้น`
                }
              ]
            }]
          })
        }
      );
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.candidates[0].content.parts[0].text.trim();
      const clean = text.replace(/```json|```/g, '').trim();
      setExtractedData(JSON.parse(clean));
    } catch (e) {
      setError('อ่านข้อมูลไม่สำเร็จ: ' + e.message);
    }
    setAiReading(false);
  };

  const handleSaveExtracted = async () => {
    if (!extractedData) return;
    setSaving(true);
    try {
      if (extractedData.hn) {
        const existing = await getPatientByHN(extractedData.hn);
        if (existing) { onSelect(existing); return; }
      }
      const ref = await addPatient(extractedData);
      onSelect({ id: ref.id, ...extractedData });
    } catch { setError('บันทึกไม่สำเร็จ'); }
    setSaving(false);
  };

  const handleSaveNew = async () => {
    if (!newPatient.firstName || !newPatient.lastName) { setError('กรุณากรอกชื่อ-นามสกุล'); return; }
    setSaving(true);
    try {
      if (newPatient.hn) {
        const existing = await getPatientByHN(newPatient.hn);
        if (existing) { onSelect(existing); return; }
      }
      const ref = await addPatient(newPatient);
      onSelect({ id: ref.id, ...newPatient });
    } catch { setError('บันทึกไม่สำเร็จ'); }
    setSaving(false);
  };

  const inp = { width:'100%', padding:'9px 12px', border:'1.5px solid #e5e7eb', borderRadius:'8px', fontSize:'14px', outline:'none', boxSizing:'border-box', fontFamily:'inherit' };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'16px' }}>
      <div style={{ background:'white', borderRadius:'20px', width:'100%', maxWidth:'500px', maxHeight:'90vh', overflow:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding:'20px 24px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ margin:0, fontSize:'18px', fontWeight:'700', color:'#1a2e25' }}>เพิ่ม/ค้นหาคนไข้</h2>
          <button onClick={onClose} style={{ border:'none', background:'#f3f4f6', borderRadius:'8px', width:'32px', height:'32px', cursor:'pointer', fontSize:'16px' }}>✕</button>
        </div>

        <div style={{ display:'flex', gap:'4px', padding:'16px 24px 0' }}>
          {[{key:'search',label:'🔍 ค้นหา'},{key:'screenshot',label:'📸 Screenshot'},{key:'new',label:'➕ เพิ่มใหม่'}].map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setError(''); }} style={{ flex:1, padding:'8px 4px', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', background:tab===t.key?'#34a878':'#f3f4f6', color:tab===t.key?'white':'#6b7280' }}>{t.label}</button>
          ))}
        </div>

        <div style={{ padding:'20px 24px 24px' }}>
          {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px', padding:'8px 12px', color:'#dc2626', fontSize:'13px', marginBottom:'12px' }}>{error}</div>}

          {tab === 'search' && (
            <div>
              <div style={{ display:'flex', gap:'8px', marginBottom:'12px' }}>
                <select value={searchField} onChange={e => setSearchField(e.target.value)} style={{ ...inp, width:'auto', flex:'0 0 auto' }}>
                  <option value="hn">HN</option>
                  <option value="firstName">ชื่อ</option>
                  <option value="lastName">นามสกุล</option>
                  <option value="phone">เบอร์โทร</option>
                </select>
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key==='Enter'&&handleSearch()} placeholder="พิมพ์เพื่อค้นหา..." style={inp} />
                <button onClick={handleSearch} style={{ padding:'9px 16px', background:'#34a878', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'14px', fontWeight:'600', fontFamily:'inherit', whiteSpace:'nowrap' }}>{searching?'...':'ค้นหา'}</button>
              </div>
              {results.map(p => (
                <div key={p.id} onClick={() => onSelect(p)} style={{ border:'1.5px solid #e5e7eb', borderRadius:'10px', padding:'12px 14px', cursor:'pointer', marginBottom:'8px' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='#34a878'; e.currentTarget.style.background='#f0faf5'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='#e5e7eb'; e.currentTarget.style.background='white'; }}>
                  <div style={{ fontWeight:'600', color:'#1a2e25' }}>{p.firstName} {p.lastName}</div>
                  <div style={{ fontSize:'13px', color:'#6b7280', marginTop:'2px' }}>HN: {p.hn||'-'} | 📞 {p.phone||'-'}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'screenshot' && (
            <div>
              <div style={{ marginBottom:'14px' }}>
                <label style={{ display:'block', fontSize:'13px', fontWeight:'600', color:'#374151', marginBottom:'6px' }}>Gemini API Key (ฟรี)</label>
                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="AIza..." style={inp} />
                <p style={{ fontSize:'11px', color:'#9ca3af', margin:'4px 0 0' }}>
                  ขอฟรีได้ที่ aistudio.google.com → Get API key
                </p>
              </div>
              <input type="file" accept="image/*" ref={fileRef} onChange={handleFileChange} style={{ display:'none' }} />
              <button onClick={() => fileRef.current.click()} style={{ width:'100%', padding:'32px', border:'2px dashed #d1fae5', borderRadius:'12px', background:'#f0faf5', cursor:'pointer', fontSize:'14px', color:'#34a878', fontWeight:'600', fontFamily:'inherit', marginBottom:'12px' }}>
                📸 แตะเพื่อเลือก Screenshot จาก FD 9net
              </button>
              {imgPreview && (
                <>
                  <img src={imgPreview} alt="preview" style={{ width:'100%', borderRadius:'8px', marginBottom:'12px', border:'1px solid #e5e7eb' }} />
                  <button onClick={handleReadScreenshot} disabled={aiReading} style={{ width:'100%', padding:'11px', background:aiReading?'#9ca3af':'#34a878', color:'white', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'600', cursor:aiReading?'not-allowed':'pointer', fontFamily:'inherit', marginBottom:'12px' }}>
                    {aiReading?'🤖 AI กำลังอ่านข้อมูล...':'🤖 ให้ AI อ่านข้อมูล'}
                  </button>
                </>
              )}
              {extractedData && (
                <div style={{ border:'1.5px solid #d1fae5', borderRadius:'12px', padding:'14px', background:'#f0faf5' }}>
                  <p style={{ fontSize:'13px', fontWeight:'700', color:'#1a2e25', margin:'0 0 10px' }}>✅ ตรวจสอบก่อนบันทึก</p>
                  {['hn','firstName','lastName','phone','dob'].map(f => (
                    <div key={f} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                      <label style={{ fontSize:'12px', color:'#6b7280', width:'70px', flexShrink:0 }}>{f==='hn'?'HN':f==='firstName'?'ชื่อ':f==='lastName'?'นามสกุล':f==='phone'?'เบอร์โทร':'วันเกิด'}</label>
                      <input value={extractedData[f]||''} onChange={e => setExtractedData({...extractedData,[f]:e.target.value})} style={{ ...inp, flex:1 }} />
                    </div>
                  ))}
                  <button onClick={handleSaveExtracted} disabled={saving} style={{ width:'100%', padding:'10px', background:'#34a878', color:'white', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', marginTop:'4px' }}>
                    {saving?'กำลังบันทึก...':'✓ ยืนยันและใช้ข้อมูลนี้'}
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'new' && (
            <div>
              {[{key:'hn',label:'HN (ไม่บังคับ)'},{key:'firstName',label:'ชื่อ *'},{key:'lastName',label:'นามสกุล *'},{key:'phone',label:'เบอร์โทร'},{key:'dob',label:'วันเกิด',type:'date'}].map(f => (
                <div key={f.key} style={{ marginBottom:'12px' }}>
                  <label style={{ display:'block', fontSize:'13px', fontWeight:'600', color:'#374151', marginBottom:'4px' }}>{f.label}</label>
                  <input type={f.type||'text'} value={newPatient[f.key]} onChange={e => setNewPatient({...newPatient,[f.key]:e.target.value})} style={inp} />
                </div>
              ))}
              <button onClick={handleSaveNew} disabled={saving} style={{ width:'100%', padding:'11px', background:'#34a878', color:'white', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', marginTop:'4px' }}>
                {saving?'กำลังบันทึก...':'➕ เพิ่มคนไข้ใหม่'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
