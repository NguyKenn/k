/* ═══════════════════════════════
   CONSTANTS
═══════════════════════════════ */
const DAY_NAMES=["Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6","Thứ 7","CN"];
const DAY_KEYS=["mon","tue","wed","thu","fri","sat","sun"];
const VN_DAYS=["Chủ nhật","Thứ hai","Thứ ba","Thứ tư","Thứ năm","Thứ sáu","Thứ bảy"];
const VN_MONTHS=["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
const SHIFTS=[
  {id:"morning",label:"Sáng",time:"6:00–12:00",icon:"🌅",hours:6,color:"#c47c1a",bg:"rgba(196,124,26,.12)",border:"#e8b86a",tagBg:"rgba(196,124,26,.1)"},
  {id:"afternoon",label:"Chiều",time:"12:00–16:00",icon:"☀️",hours:4,color:"#2471a3",bg:"rgba(36,113,163,.12)",border:"#7fb3d3",tagBg:"rgba(36,113,163,.1)"},
  {id:"evening",label:"Tối",time:"16:00–22:00",icon:"🌙",hours:6,color:"#6c3483",bg:"rgba(108,52,131,.12)",border:"#bb8fce",tagBg:"rgba(108,52,131,.1)"}
];
const DEFAULT_TASKS={
  morning:["Mở cửa & kiểm tra an toàn","Kiểm tra hàng hóa / nguyên liệu","Vệ sinh khu vực làm việc","Chuẩn bị dụng cụ đầu ca","Bàn giao ca đêm hôm trước","Ghi nhận báo cáo đầu ngày"],
  afternoon:["Nhận bàn giao từ ca sáng","Kiểm tra tồn kho buổi trưa","Phục vụ khách / xử lý đơn hàng","Dọn dẹp & sắp xếp khu vực","Cập nhật sổ theo dõi","Chuẩn bị bàn giao ca tối"],
  evening:["Nhận bàn giao từ ca chiều","Phục vụ khách giờ cao điểm","Kiểm tra & bổ sung hàng hóa","Chốt doanh thu cuối ngày","Vệ sinh & dọn dẹp cuối ca","Đóng cửa & kiểm tra an ninh"]
};

/* ═══════════════════════════════
   WEEK DATES
═══════════════════════════════ */
function computeWeekDates(){
  const now=new Date(),day=now.getDay();
  const monday=new Date(now.getFullYear(),now.getMonth(),now.getDate()-(day===0?6:day-1));
  monday.setHours(0,0,0,0);
  return Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(monday.getDate()+i);return d});
}
const WEEK_DATES=computeWeekDates();
function makeWeekKey(mon){const y=mon.getFullYear(),j=new Date(y,0,1),wn=Math.ceil(((mon-j)/864e5+j.getDay()+1)/7);return`${y}-W${wn}`}
const weekKey=makeWeekKey(WEEK_DATES[0]);
function makeMeta(wd){const m=wd[0],s=wd[6],t=wd[3];return{mon:`${m.getDate()}/${m.getMonth()+1}`,sun:`${s.getDate()}/${s.getMonth()+1}/${s.getFullYear()}`,month:t.getMonth(),year:t.getFullYear(),wn:weekKey.split('-W')[1]}}

/* ═══════════════════════════════
   STATE
═══════════════════════════════ */
let registered=JSON.parse(localStorage.getItem(`sr-${weekKey}`)||'{}');
let checklist=JSON.parse(localStorage.getItem(`sc-${weekKey}`)||'{}');
let tasks=JSON.parse(localStorage.getItem('st')||'null')||JSON.parse(JSON.stringify(DEFAULT_TASKS));
let salary=JSON.parse(localStorage.getItem('salary')||'null')||{mode:'hourly',hourly:25000,perShift:{morning:150000,afternoon:100000,evening:150000}};
let activeCell=null,editingTask=null,addingTo=null,currentTab='schedule',histOpen={};

/* ═══════════════════════════════
   HELPERS
═══════════════════════════════ */
const fmt=n=>n.toLocaleString('vi-VN')+'đ';
const isReg=(d,id)=>!!registered?.[d]?.[id];
const countReg=()=>DAY_KEYS.reduce((a,d)=>a+SHIFTS.filter(s=>isReg(d,s.id)).length,0);
const getProgress=(day,id)=>{const t=tasks[id].length,done=Object.values(checklist?.[day]?.[id]||{}).filter(Boolean).length;return{done,total:t,pct:t?Math.round(done/t*100):0}};
const shiftPay=s=>salary.mode==='hourly'?s.hours*salary.hourly:(salary.perShift[s.id]||0);
function calcStats(reg){let s=0,h=0,p=0;DAY_KEYS.forEach(d=>SHIFTS.forEach(sh=>{if(reg?.[d]?.[sh.id]){s++;h+=sh.hours;p+=shiftPay(sh)}}));return{shifts:s,hours:h,pay:p}}
function save(){
  localStorage.setItem(`sr-${weekKey}`,JSON.stringify(registered));
  localStorage.setItem(`sc-${weekKey}`,JSON.stringify(checklist));
  localStorage.setItem('st',JSON.stringify(tasks));
  localStorage.setItem('salary',JSON.stringify(salary));
  if(!localStorage.getItem(`wmeta-${weekKey}`))localStorage.setItem(`wmeta-${weekKey}`,JSON.stringify(makeMeta(WEEK_DATES)));
}
function getAllWeekKeys(){const k=[];for(let i=0;i<localStorage.length;i++){const v=localStorage.key(i);if(v?.startsWith('sr-'))k.push(v.slice(3))}return k.sort().reverse()}

/* ═══════════════════════════════
   CLOCK
═══════════════════════════════ */
function updateClock(){
  const n=new Date(),h=String(n.getHours()).padStart(2,'0'),m=String(n.getMinutes()).padStart(2,'0'),s=String(n.getSeconds()).padStart(2,'0');
  const te=document.getElementById('clockTime'),de=document.getElementById('clockDate');
  if(te)te.textContent=`${h}:${m}:${s}`;
  if(de)de.textContent=`${VN_DAYS[n.getDay()]}, ${n.getDate()}/${n.getMonth()+1}/${n.getFullYear()}`;
}
setInterval(updateClock,1000);updateClock();

/* ═══════════════════════════════
   UI ACTIONS
═══════════════════════════════ */
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.style.display='block';setTimeout(()=>t.style.display='none',2100)}
function resetWeek(){
  if(!confirm('Lật sang trang mới?\nToàn bộ đăng ký ca tuần này sẽ bị xoá.'))return;
  registered={};checklist={};activeCell=null;
  localStorage.setItem(`sr-${weekKey}`,JSON.stringify({}));
  localStorage.setItem(`sc-${weekKey}`,JSON.stringify({}));
  render();showToast('📖 Đã reset — tuần mới bắt đầu!');
}
function switchTab(tab,btn){
  currentTab=tab;
  document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active-pane'));
  document.getElementById(`tab-${tab}`).classList.add('active-pane');
  render();
}
function toggleShift(day,id){
  if(!registered[day])registered[day]={};
  registered[day][id]=!registered[day][id];
  if(registered[day][id]){activeCell={day,shift:id};showToast('✏️ Đã ghi vào lịch!')}
  else if(activeCell?.day===day&&activeCell?.shift===id)activeCell=null;
  save();render();
}
function toggleCard(day,id){activeCell=(activeCell?.day===day&&activeCell?.shift===id)?null:{day,shift:id};renderSchedule()}
function toggleTask(day,id,i){
  if(!checklist[day])checklist[day]={};if(!checklist[day][id])checklist[day][id]={};
  checklist[day][id][i]=!checklist[day][id][i];save();renderSchedule();
}

/* ═══════════════════════════════
   RENDER
═══════════════════════════════ */
function render(){
  const m=WEEK_DATES[0],s=WEEK_DATES[6];
  document.getElementById('weekLabel').textContent=`Tuần ${weekKey.split('-W')[1]}  ·  ${m.getDate()}/${m.getMonth()+1} – ${s.getDate()}/${s.getMonth()+1}/${s.getFullYear()}`;
  document.getElementById('regCount').textContent=`${countReg()} ca đã ghi`;
  if(currentTab==='schedule')renderSchedule();
  else if(currentTab==='salary')renderSalary();
  else if(currentTab==='history')renderHistory();
  else renderTasks();
}

/* ═══════════════════════════════
   SCHEDULE
═══════════════════════════════ */
function renderSchedule(){
  const el=document.getElementById('tab-schedule');
  const tod=new Date().getDay(),ti=tod===0?6:tod-1;
  let h=`<div class="legend">`;
  SHIFTS.forEach(s=>{h+=`<div class="legend-item" style="color:${s.color};border-color:${s.border};background:${s.tagBg}">${s.icon} Ca ${s.label} · ${s.time}</div>`});
  h+=`</div><div class="grid-wrap"><div class="grid"><div></div>`;
  DAY_NAMES.forEach((d,i)=>{
    const wd=WEEK_DATES[i],lbl=`${wd.getDate()}/${wd.getMonth()+1}`,isTod=i===ti;
    h+=`<div class="day-hd ${isTod?'today':''}"><div class="day-name">${d}</div><div class="day-date">${lbl}</div>${isTod?'<div class="today-dot"></div>':''}</div>`;
  });
  SHIFTS.forEach(sh=>{
    h+=`<div class="shift-lbl"><span class="icon">${sh.icon}</span><span class="name">${sh.label}</span></div>`;
    DAY_KEYS.forEach(day=>{
      const a=isReg(day,sh.id);
      if(a){const{done,total,pct}=getProgress(day,sh.id);h+=`<div class="cell reg" style="border-color:${sh.border}" onclick="toggleShift('${day}','${sh.id}')"><span class="dchk" style="color:${sh.color}">✓</span><span class="cnt-txt" style="color:${sh.color}">${done}/${total}</span><div class="pbar"><div class="pfill" style="width:${pct}%;background:${sh.color}"></div></div></div>`}
      else{h+=`<div class="cell" onclick="toggleShift('${day}','${sh.id}')"><span class="plus">+</span></div>`}
    });
  });
  h+=`</div></div>`;
  if(countReg()>0){
    h+=`<div class="sec-title">📌 Ca đã đăng ký</div>`;
    DAY_KEYS.forEach((day,di)=>{
      SHIFTS.filter(s=>isReg(day,s.id)).forEach(sh=>{
        const{done,total,pct}=getProgress(day,sh.id);
        const open=activeCell?.day===day&&activeCell?.shift===sh.id;
        const g=pct===100;
        h+=`<div class="nb-card" style="${open?`border-color:${sh.border}`:''}"><div class="card-header" style="${open?`background:${sh.bg};border-left-color:${sh.color}`:`border-left-color:transparent`}" onclick="toggleCard('${day}','${sh.id}')"><div style="display:flex;align-items:center;gap:9px"><span style="font-size:20px">${sh.icon}</span><div><div class="card-day">${DAY_NAMES[di]} ${WEEK_DATES[di].getDate()}/${WEEK_DATES[di].getMonth()+1} — Ca ${sh.label}</div><div class="card-time">${sh.time}</div></div></div><div style="display:flex;align-items:center;gap:7px"><span class="prog-label" style="color:${g?'#2e7d4f':sh.color}">${done}/${total}${g?' ✓✓':''}</span><span class="chevron">${open?'▲':'▼'}</span></div></div><div class="pbar-full"><div class="pfill" style="width:${pct}%;background:${g?'#2e7d4f':sh.color}"></div></div>`;
        if(open){h+=`<div class="tasks-list">`;tasks[sh.id].forEach((t,i)=>{const c=checklist?.[day]?.[sh.id]?.[i]||false;h+=`<div class="task-row" onclick="toggleTask('${day}','${sh.id}',${i})"><div class="chkbox ${c?'done':''}">${c?'<span class="chkmark">✓</span>':''}</div><span class="task-text ${c?'done':''}">${t}</span></div>`});h+=`</div>`}
        h+=`</div>`;
      });
    });
  }
  el.innerHTML=h;
}

/* ═══════════════════════════════
   SALARY
═══════════════════════════════ */
function renderSalary(){
  const el=document.getElementById('tab-salary'),mode=salary.mode;
  let totalH=0,totalPay=0,totalS=0;const rows=[];
  DAY_KEYS.forEach((day,di)=>{SHIFTS.filter(s=>isReg(day,s.id)).forEach(sh=>{const pay=shiftPay(sh);totalH+=sh.hours;totalPay+=pay;totalS++;rows.push({day,di,sh,pay})})});
  let h=`<div class="sec-title">⚙️ Cài đặt đơn giá</div><div class="sbox"><div class="mode-toggle"><button class="mmode ${mode==='hourly'?'active':''}" onclick="setMode('hourly')">⏱ Theo giờ</button><button class="mmode ${mode==='perShift'?'active':''}" onclick="setMode('perShift')">📋 Theo ca</button></div>`;
  if(mode==='hourly'){
    h+=`<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span style="font-family:'Patrick Hand',cursive;font-size:15px">Đơn giá mỗi giờ:</span><input type="number" id="hRate" value="${salary.hourly}" min="0" step="1000" style="width:130px"/><span style="font-family:'Patrick Hand',cursive;font-size:13px;color:#9a7a68">đ / giờ</span><button class="btn-ink" onclick="applyHourly()">Ghi lại</button></div><div style="margin-top:10px">`;
    SHIFTS.forEach(s=>{h+=`<div class="prev-item" style="border-color:${s.border};color:${s.color}"><span>${s.icon} Ca ${s.label} · ${s.hours} giờ</span><strong style="font-family:'Kalam',cursive">${fmt(s.hours*salary.hourly)}</strong></div>`});
    h+=`</div>`;
  }else{
    h+=`<div style="font-family:'Patrick Hand',cursive;font-size:13px;color:#7a5c4a;margin-bottom:10px">Ghi tiền cố định cho mỗi loại ca:</div><div style="display:flex;flex-direction:column;gap:8px">`;
    SHIFTS.forEach(s=>{h+=`<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:${s.bg};border-radius:5px;border:1px dashed ${s.border}"><span style="font-size:18px">${s.icon}</span><span style="flex:1;font-family:'Patrick Hand',cursive;font-size:14px;color:${s.color}">Ca ${s.label} (${s.hours}h)</span><input type="number" id="ps_${s.id}" value="${salary.perShift[s.id]}" min="0" step="5000" style="width:110px"/><span style="font-family:'Patrick Hand',cursive;font-size:12px;color:${s.color}">đ</span></div>`});
    h+=`</div><div style="margin-top:10px;text-align:right"><button class="btn-ink" onclick="applyPerShift()">Ghi lại tất cả</button></div>`;
  }
  h+=`</div><div class="sec-title">📅 Tuần này</div>`;
  if(totalS===0){h+=`<div class="sbox"><div class="no-reg">📒 Chưa có ca nào được ghi<br><span style="font-size:12px">Hãy điền lịch ở tab Lịch ca trước nhé!</span></div></div>`}
  else{
    const meta=makeMeta(WEEK_DATES),avgH=totalH?Math.round(totalPay/totalH):0;
    h+=`<div class="total-banner"><div class="total-stamp">TUẦN ${meta.wn}</div><div class="total-lbl">Tổng lương dự kiến</div><div class="total-amt">${fmt(totalPay)}</div><div style="font-family:'Patrick Hand',cursive;font-size:12px;color:#9a7a68;margin-top:3px">${meta.mon} – ${meta.sun}</div></div>`;
    h+=`<div class="stat-row"><div class="stat-box"><div class="stat-v" style="color:#2471a3">${totalS}</div><div class="stat-l">Ca làm</div></div><div class="stat-box"><div class="stat-v" style="color:#c47c1a">${totalH}h</div><div class="stat-l">Tổng giờ</div></div><div class="stat-box"><div class="stat-v" style="color:#2e7d4f">${fmt(avgH)}</div><div class="stat-l">TB/giờ</div></div></div>`;
    h+=`<div class="stbl"><div class="tbl-hd"><div>Ngày · Ca</div><div style="text-align:center">Giờ</div><div style="text-align:center">Đơn giá</div><div style="text-align:right">Thành tiền</div></div>`;
    rows.forEach(r=>{const unit=mode==='hourly'?`${fmt(salary.hourly)}/h`:`${fmt(salary.perShift[r.sh.id])}/ca`;h+=`<div class="tbl-r"><div><div style="font-family:'Kalam',cursive;font-size:15px;font-weight:700">${DAY_NAMES[r.di]} ${WEEK_DATES[r.di].getDate()}/${WEEK_DATES[r.di].getMonth()+1}</div><div class="shift-tag" style="color:${r.sh.color};border-color:${r.sh.border};background:${r.sh.tagBg}">${r.sh.icon} ${r.sh.label}</div></div><div style="text-align:center;font-family:'Kalam',cursive;font-size:15px;font-weight:700;color:${r.sh.color}">${r.sh.hours}h</div><div style="text-align:center;font-family:'Patrick Hand',cursive;font-size:11px;color:#9a7a68">${unit}</div><div style="text-align:right;font-family:'Kalam',cursive;font-size:15px;font-weight:700;color:${r.sh.color}">${fmt(r.pay)}</div></div>`});
    h+=`<div class="tbl-tot"><div style="font-family:'Kalam',cursive;font-size:15px;font-weight:700">✏️ Tổng cộng</div><div style="text-align:center;font-family:'Kalam',cursive;font-size:15px;font-weight:700;color:#c47c1a">${totalH}h</div><div></div><div style="text-align:right;font-family:'Kalam',cursive;font-size:16px;font-weight:700;color:#2e7d4f">${fmt(totalPay)}</div></div></div>`;
  }
  // Monthly
  const curMonth=WEEK_DATES[3].getMonth(),curYear=WEEK_DATES[3].getFullYear(),allWks=getAllWeekKeys();
  const monthWks=allWks.filter(wk=>{const m=JSON.parse(localStorage.getItem(`wmeta-${wk}`)||'null');return m&&m.month===curMonth&&m.year===curYear});
  h+=`<div class="sec-title">📆 Tổng tháng ${curMonth+1}/${curYear}</div>`;
  if(!monthWks.length){h+=`<div class="sbox"><div class="no-reg" style="padding:16px">Chưa có dữ liệu cho tháng này.</div></div>`}
  else{
    let mS=0,mH=0,mP=0;
    h+=`<div class="month-banner"><div class="month-title">📅 ${VN_MONTHS[curMonth]} ${curYear}</div>`;
    monthWks.forEach(wk=>{const reg=JSON.parse(localStorage.getItem(`sr-${wk}`)||'{}'),meta=JSON.parse(localStorage.getItem(`wmeta-${wk}`)||'{}'),st=calcStats(reg);mS+=st.shifts;mH+=st.hours;mP+=st.pay;const ic=wk===weekKey;h+=`<div class="month-week-row"><span style="color:${ic?'#c0392b':'#2c1810'}">Tuần ${meta.wn||wk.split('-W')[1]} · ${meta.mon||'?'} – ${meta.sun||'?'}${ic?'<em style="font-size:11px;color:#c0392b"> (tuần này)</em>':''}</span><span style="display:flex;gap:12px;align-items:center"><span style="color:#7a5c4a">${st.shifts} ca · ${st.hours}h</span><strong style="font-family:Kalam,cursive;color:${ic?'#c0392b':'#2e7d4f'}">${fmt(st.pay)}</strong></span></div>`});
    h+=`<div class="month-total"><span class="month-total-lbl">🏆 Tổng tháng</span><span style="display:flex;gap:14px;align-items:center"><span style="font-family:'Patrick Hand',cursive;font-size:13px;color:#7a5c4a">${mS} ca · ${mH}h</span><span class="month-total-val">${fmt(mP)}</span></span></div></div>`;
  }
  el.innerHTML=h;
}
function setMode(m){salary.mode=m;save();renderSalary()}
function applyHourly(){salary.hourly=parseInt(document.getElementById('hRate')?.value)||0;save();showToast('✒️ Đã ghi đơn giá!');renderSalary()}
function applyPerShift(){SHIFTS.forEach(s=>{salary.perShift[s.id]=parseInt(document.getElementById(`ps_${s.id}`)?.value)||0});save();showToast('✒️ Đã ghi đơn giá!');renderSalary()}

/* ═══════════════════════════════
   HISTORY
═══════════════════════════════ */
function renderHistory(){
  const el=document.getElementById('tab-history'),all=getAllWeekKeys().filter(wk=>wk!==weekKey);
  let h=`<div class="hint">Lưu trữ lịch ca các tuần đã qua. Dữ liệu được giữ nguyên tự động.</div>`;
  if(!all.length){h+=`<div class="sbox"><div class="no-hist">📒 Chưa có dữ liệu lịch sử<br><span style="font-size:12px">Tuần sau quay lại đây sẽ thấy lịch tuần này!</span></div></div>`;el.innerHTML=h;return}
  const byMonth={};
  all.forEach(wk=>{const m=JSON.parse(localStorage.getItem(`wmeta-${wk}`)||'null'),month=m?`${VN_MONTHS[m.month]} ${m.year}`:'Không rõ';if(!byMonth[month])byMonth[month]=[];byMonth[month].push({wk,meta:m})});
  Object.entries(byMonth).forEach(([month,weeks])=>{
    h+=`<div class="sec-title">📅 ${month}</div>`;
    weeks.forEach(({wk,meta})=>{
      const reg=JSON.parse(localStorage.getItem(`sr-${wk}`)||'{}'),st=calcStats(reg),open=histOpen[wk],wn=meta?.wn||wk.split('-W')[1],dateRange=meta?`${meta.mon} – ${meta.sun}`:wk;
      h+=`<div class="hist-card"><div class="hist-header" onclick="toggleHist('${wk}')"><div><div class="hist-week">Tuần ${wn}</div><div class="hist-dates">${dateRange}</div></div><div style="display:flex;align-items:center;gap:10px"><div style="text-align:right"><div style="font-family:Kalam,cursive;font-size:16px;font-weight:700;color:#2e7d4f">${fmt(st.pay)}</div><div style="font-family:'Patrick Hand',cursive;font-size:11px;color:#9a7a68">${st.shifts} ca · ${st.hours}h</div></div><span class="chevron">${open?'▲':'▼'}</span></div></div>`;
      if(open){h+=`<div class="hist-body"><div class="hist-grid">`;DAY_KEYS.forEach((day,di)=>{SHIFTS.filter(s=>reg?.[day]?.[s.id]).forEach(sh=>{h+=`<div class="hist-chip" style="color:${sh.color};border-color:${sh.border};background:${sh.tagBg}">${sh.icon} ${DAY_NAMES[di]} · Ca ${sh.label}</div>`})});h+=`</div><div class="hist-stats"><span>🕐 <strong>${st.hours}h</strong> làm việc</span><span>📋 <strong>${st.shifts}</strong> ca</span><span>💰 <strong>${fmt(st.pay)}</strong></span></div></div>`}
      h+=`</div>`;
    });
  });
  el.innerHTML=h;
}
function toggleHist(wk){histOpen[wk]=!histOpen[wk];renderHistory()}

/* ═══════════════════════════════
   TASKS
═══════════════════════════════ */
function renderTasks(){
  const el=document.getElementById('tab-tasks');
  let h=`<div class="hint">Chỉnh sửa danh sách công việc cho từng ca làm.</div>`;
  SHIFTS.forEach(sh=>{
    h+=`<div class="mg-card"><div class="mg-hd" style="background:${sh.bg};border-bottom-color:${sh.border}"><span style="font-size:20px">${sh.icon}</span><div><div style="font-family:Kalam,cursive;font-size:16px;font-weight:700;color:${sh.color}">Ca ${sh.label} · ${sh.time}</div><div style="font-family:'Patrick Hand',cursive;font-size:11px;color:#9a7a68">${tasks[sh.id].length} công việc</div></div></div>`;
    tasks[sh.id].forEach((t,i)=>{
      if(editingTask?.shiftId===sh.id&&editingTask?.idx===i){h+=`<div class="edit-row"><input type="text" id="editInput" value="${t.replace(/"/g,'&quot;')}" onkeydown="handleEditKey(event,'${sh.id}',${i})"/><button class="btn-sm ok" onclick="saveEdit('${sh.id}',${i})">✓</button><button class="btn-sm cancel" onclick="cancelEdit()">✕</button></div>`}
      else{h+=`<div class="mg-row"><span>— ${t}</span><button class="btn-sm edit" onclick="startEdit('${sh.id}',${i})">Sửa</button><button class="btn-sm del" onclick="deleteTask('${sh.id}',${i})">Xoá</button></div>`}
    });
    if(addingTo===sh.id){h+=`<div class="edit-row"><input type="text" id="newInput" placeholder="Ghi công việc mới..." onkeydown="handleAddKey(event,'${sh.id}')"/><button class="btn-sm ok" onclick="addTask('${sh.id}')">✓</button><button class="btn-sm cancel" onclick="cancelAdd()">✕</button></div>`}
    h+=`<div class="add-row">`;if(addingTo!==sh.id)h+=`<button class="btn-add-new" onclick="startAdd('${sh.id}')">+ Thêm công việc vào ca ${sh.label}</button>`;
    h+=`</div></div>`;
  });
  el.innerHTML=h;
  setTimeout(()=>{const inp=document.getElementById('editInput')||document.getElementById('newInput');if(inp)inp.focus()},50);
}
function startEdit(s,i){editingTask={shiftId:s,idx:i};addingTo=null;renderTasks()}
function cancelEdit(){editingTask=null;renderTasks()}
function saveEdit(s,i){const v=document.getElementById('editInput')?.value?.trim();if(!v)return;tasks[s][i]=v;editingTask=null;save();showToast('✒️ Đã cập nhật!');renderTasks()}
function handleEditKey(e,s,i){if(e.key==='Enter')saveEdit(s,i);if(e.key==='Escape')cancelEdit()}
function startAdd(s){addingTo=s;editingTask=null;renderTasks()}
function cancelAdd(){addingTo=null;renderTasks()}
function addTask(s){const v=document.getElementById('newInput')?.value?.trim();if(!v)return;tasks[s].push(v);addingTo=null;save();showToast('✏️ Đã thêm!');renderTasks()}
function handleAddKey(e,s){if(e.key==='Enter')addTask(s);if(e.key==='Escape')cancelAdd()}
function deleteTask(s,i){tasks[s].splice(i,1);save();showToast('🗑 Đã xoá!');renderTasks()}

/* ═══════════════════════════════
   PWA INSTALL
═══════════════════════════════ */
let deferredPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;document.getElementById('installBanner').style.display='flex'});
function installApp(){if(deferredPrompt){deferredPrompt.prompt();deferredPrompt.userChoice.then(()=>{deferredPrompt=null;document.getElementById('installBanner').style.display='none'})}}
function dismissInstall(){document.getElementById('installBanner').style.display='none'}

/* ═══════════════════════════════
   SERVICE WORKER
═══════════════════════════════ */
if('serviceWorker'in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{})}

/* ═══════════════════════════════
   SPLASH & INIT
═══════════════════════════════ */
if(Object.keys(registered).length>0&&!localStorage.getItem(`wmeta-${weekKey}`)){localStorage.setItem(`wmeta-${weekKey}`,JSON.stringify(makeMeta(WEEK_DATES)))}
setTimeout(()=>{document.getElementById('splash')?.classList.add('hide');setTimeout(()=>document.getElementById('splash')?.remove(),600)},1400);
render();
