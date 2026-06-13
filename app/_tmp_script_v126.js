
(function(){
'use strict';
const V124='v12.4';
function safeCall(fn, fallback){try{return fn()}catch(e){console.warn('v12.4',e);return fallback}}
function lastSegmentWidth(parent){let c=(S.accounts||[]).find(a=>a.parent===parent)?.code?.split('-').at(-1);return Math.max(3,(c||'001').length)}
function nextChildCodeSafe(parent){let width=lastSegmentWidth(parent), nums=(S.accounts||[]).filter(a=>a.parent===parent).map(a=>parseInt(String(a.code).split('-').at(-1),10)||0);return parent+'-'+String(Math.max(0,...nums)+1).padStart(width,'0')}
function parentOf(code){let p=String(code||'').split('-');return p.length>1?p.slice(0,-1).join('-'):''}
function ensureParentNonPosting(parent){let a=acc(parent); if(a){a.posting=false; a.active=true; return a} return null}
function ensureAccountObject(code,name,type,nature,parent,notes){let a=acc(code); if(a){a.name=name||a.name;a.type=type||a.type;a.nature=nature||a.nature;a.parent=parent||a.parent;a.level=String(a.code).split('-').length;a.posting=true;a.active=true;a.notes=notes||a.notes;return a} a={code,name,type,nature,parent,level:String(code).split('-').length,posting:true,active:true,notes:notes||''};S.accounts.push(a);S.accounts.sort(accountSort);return a}
function partyBaseParent(type){return type==='customer'?parentOf(AC.ar):parentOf(AC.ap)}
function partyAccountName(type,name){return (type==='customer'?'عميل - ':'مورد - ')+String(name||'').trim()}
function ensurePartyAccount(p){
  if(!p||!p.name)return '';
  let type=p.type||'customer', parent=partyBaseParent(type), acctType=type==='customer'?'أصل':'التزام', nature=type==='customer'?'مدين':'دائن';
  ensureParentNonPosting(parent);
  let linked=p.accountCode && acc(p.accountCode) ? acc(p.accountCode) : null;
  if(!linked){linked=(S.accounts||[]).find(a=>a.notes&&a.notes.includes('partyId:'+p.id))||null}
  if(!linked){linked=(S.accounts||[]).find(a=>a.parent===parent && norm(a.name)===norm(partyAccountName(type,p.name)))||null}
  let code=linked?.code || nextChildCodeSafe(parent);
  let a=ensureAccountObject(code,partyAccountName(type,p.name),acctType,nature,parent,'حساب آلي مرتبط بسجل العملاء/الموردين partyId:'+p.id);
  p.accountCode=a.code;
  p.accountName=a.name;
  p.accountParent=parent;
  return a.code;
}
window.ensurePartyAccount=ensurePartyAccount;
function syncPartiesWithAccounts(){let changed=false;(S.parties||[]).forEach(p=>{let before=p.accountCode;let code=ensurePartyAccount(p);if(code!==before)changed=true}); if(changed){S.accounts.sort(accountSort);save()} return changed}
window.syncPartiesWithAccounts=syncPartiesWithAccounts;
const oldUpsertParty=window.upsertParty;
window.upsertParty=function(type,name,vat,address,cr){
  if(!name)return null;
  let p=(S.parties||[]).find(x=>x.type===type&&norm(x.name)===norm(name));
  if(p){p.vat=vat||p.vat;p.address=address||p.address;p.cr=cr||p.cr}
  else{p={id:uid(),type,name,vat:vat||'',cr:cr||'',phone:'',email:'',address:address||''};S.parties.push(p)}
  ensurePartyAccount(p);save();return p;
};
function partyFormSubmitEnhanced(e){
  e.preventDefault();
  let id=partyId.value||uid();
  let p={id,type:partyType.value,name:partyName.value.trim(),vat:partyVat.value.trim(),cr:partyCR.value.trim(),phone:partyPhone.value.trim(),email:partyEmail.value.trim(),address:partyAddress.value.trim(),accountCode:''};
  if(!p.name)return toast('اسم العميل/المورد مطلوب');
  let old=(S.parties||[]).find(x=>x.id===id); if(old&&old.accountCode)p.accountCode=old.accountCode;
  ensurePartyAccount(p);
  let i=S.parties.findIndex(x=>x.id===id); i>=0?S.parties[i]=p:S.parties.push(p);
  S.accounts.sort(accountSort); save(); newParty(); renderAll(); toast('تم حفظ السجل وربطه تلقائيًا بدليل الحسابات والشجرة');
}
function bindPartyFormEnhanced(){if(window.partyForm&&!partyForm.dataset.v124){partyForm.dataset.v124='1';partyForm.onsubmit=partyFormSubmitEnhanced}}
window.partyExport=function(){syncPartiesWithAccounts();return (S.parties||[]).map(p=>({'النوع':p.type==='customer'?'عميل':'مورد','الاسم':p.name,'رقم حساب الدليل':p.accountCode||'','اسم حساب الدليل':accName(p.accountCode),'الرقم الضريبي':p.vat,'السجل التجاري':p.cr,'الجوال':p.phone,'البريد':p.email,'العنوان':p.address}))}
window.renderParties=function(){if(!window.partyTable)return;syncPartiesWithAccounts();let q=norm(partySearch?.value),f=partyFilter?.value;let rows=(S.parties||[]).filter(p=>(!f||p.type===f)&&(!q||norm(`${p.name} ${p.vat} ${p.phone} ${p.accountCode} ${accName(p.accountCode)}`).includes(q)));partyTable.innerHTML='<thead><tr><th>النوع</th><th>الاسم</th><th>حساب الدليل</th><th>الرقم الضريبي</th><th>الجوال</th><th>البريد</th><th>العنوان</th><th>إجراءات</th></tr></thead><tbody>'+rows.map(p=>`<tr><td>${p.type==='customer'?'عميل':'مورد'}</td><td>${esc(p.name)}</td><td><span class="linked-account-badge">${esc(p.accountCode||'')}</span><br><small>${esc(accName(p.accountCode))}</small></td><td class="num">${esc(p.vat)}</td><td>${esc(p.phone)}</td><td>${esc(p.email)}</td><td>${esc(p.address)}</td><td><button class="secondary icon" data-tip="تعديل" onclick="editParty('${p.id}')">📝</button><button class="danger icon" data-tip="سلة مهملات" onclick="trashParty('${p.id}')">🗑️</button></td></tr>`).join('')+'</tbody>'}
function partyAccountForDoc(d){let partyType=d.type==='sale'?'customer':'supplier';let p=(S.parties||[]).find(x=>x.type===partyType&&norm(x.name)===norm(d.party?.name));if(!p){p=window.upsertParty(partyType,d.party?.name||'',d.party?.vat||'',d.party?.address||'',d.party?.cr||'')} if(p) return ensurePartyAccount(p); return d.type==='sale'?AC.ar:AC.ap}
window.payAccount=function(pay,type,doc){if(pay==='نقدي')return AC.cash;if(pay==='الحساب البنكي'||pay==='تحويل بنكي'||pay==='شبكة')return AC.bank;if(pay==='جاري المالك')return AC.owner;return doc?partyAccountForDoc(doc):(type==='sale'?AC.ar:AC.ap)}
window.entryFromDoc=function(d){
  let debit=[],credit=[],t=d.totals||{},pa=payAccount(d.pay,d.type,d),net=n((t.taxable||0)+(t.exempt||0)),vat=n(t.vat||0),total=n(t.total||net+vat);
  let title=(d.docClass==='invoice'?'فاتورة':d.docClass==='credit'?'إشعار دائن':'إشعار مدين')+' '+(d.type==='sale'?'مبيعات':'مشتريات')+' '+d.no;
  let addD=(accountCode,amount,description)=>n(amount)&&debit.push({accountCode,description,debit:n(amount),credit:0});
  let addC=(accountCode,amount,description)=>n(amount)&&credit.push({accountCode,description,debit:0,credit:n(amount)});
  if(d.type==='sale'){
    if(d.docClass==='credit'){addD(AC.sales,net,'تخفيض مبيعات شامل المعفى '+d.no);addD(AC.vatOut,vat,'تخفيض ضريبة مخرجات '+d.no);addC(pa,total,'إشعار دائن '+(d.party?.name||''))}
    else{addD(pa,total,title);addC(AC.sales,net,'مبيعات '+d.no+(t.exempt?' / يشمل معفى '+money(t.exempt):''));addC(AC.vatOut,vat,'ضريبة مخرجات '+d.no)}
  }else{
    if(d.docClass==='credit'){addD(pa,total,'إشعار دائن مشتريات '+(d.party?.name||''));addC(AC.purch,net,'تخفيض مشتريات شامل المعفى '+d.no);addC(AC.vatIn,vat,'تخفيض ضريبة مدخلات '+d.no)}
    else{addD(AC.purch,net,title+(t.exempt?' / يشمل معفى '+money(t.exempt):''));addD(AC.vatIn,vat,'ضريبة مدخلات '+d.no);addC(pa,total,'مورد '+(d.party?.name||''))}
  }
  let lines=[...debit,...credit].filter(l=>n(l.debit)||n(l.credit));
  return{id:d.entryId,date:d.date,title,desc:`${d.party?.name||''} - ${d.no} | خاضع ${money(t.taxable||0)} | معفى ${money(t.exempt||0)} | VAT ${money(vat)}`,status:'نشط',source:'doc:'+d.id,lines};
}
function rebuildDocumentEntries(){let changed=false;(S.invoices||[]).forEach(d=>{if(!d.entryId)d.entryId=next('entry');let e=entryFromDoc(d);let old=S.entries.find(x=>x.id===e.id);if(JSON.stringify(old?.lines)!==JSON.stringify(e.lines)||old?.desc!==e.desc){saveEntryObject(e);changed=true}});if(changed)save();return changed}
function invoiceVatRows(){let from=taxFrom?.value||'',to=taxTo?.value||'';return (S.invoices||[]).filter(d=>dateIn(d.date,from,to)).map(d=>{let sign=d.docClass==='credit'?-1:1,t=d.totals||{};return {'التاريخ':d.date,'رقم الفاتورة/الإشعار':d.no,'النوع':d.type==='sale'?'مبيعات':'مشتريات','المستند':docClassName(d),'العميل/المورد':d.party?.name||'', 'حساب العميل/المورد':partyAccountForDoc(d)+' - '+accName(partyAccountForDoc(d)),'حساب الضريبة':d.type==='sale'?AC.vatOut+' - '+accName(AC.vatOut):AC.vatIn+' - '+accName(AC.vatIn),'المبلغ الخاضع':n(sign*(t.taxable||0)),'المبلغ المعفى':n(sign*(t.exempt||0)),'VAT من الفاتورة':n(sign*(t.vat||0)),'رقم القيد':d.entryId||''}})}
window.linkedTaxInvoiceRows=invoiceVatRows;
window.taxDetailsExport=function(){let from=taxFrom?.value||'',to=taxTo?.value||'';return allLines().filter(l=>dateIn(l.date,from,to)&&[AC.vatOut,AC.vatIn].includes(l.accountCode)).map(l=>({'التاريخ':l.date,'رقم القيد':l.entryId,'نوع الضريبة':l.accountCode===AC.vatOut?'ضريبة مخرجات':'ضريبة مدخلات','حساب الضريبة':l.accountCode+' - '+accName(l.accountCode),'البيان':l.description||l.desc,'مدين':n(l.debit),'دائن':n(l.credit),'أثر الضريبة':l.accountCode===AC.vatOut?n(l.credit-l.debit):n(l.debit-l.credit),'المصدر':l.source||''}))}
window.vatTotals=function(){let out=0,inn=0,outInv=0,inInv=0;invoiceVatRows().forEach(r=>{if(r['النوع']==='مبيعات')outInv+=n(r['VAT من الفاتورة']);else inInv+=n(r['VAT من الفاتورة'])});taxDetailsExport().forEach(r=>{if(r['نوع الضريبة']==='ضريبة مخرجات')out+=n(r['أثر الضريبة']);else inn+=n(r['أثر الضريبة'])});return{out:n(out),in:n(inn),net:n(out-inn),outInv:n(outInv),inInv:n(inInv),netInv:n(outInv-inInv),diffOut:n(out-outInv),diffIn:n(inn-inInv)}}
window.taxExport=function(){let v=vatTotals();return[
  {'المصدر':'الفواتير','البند':'ضريبة المخرجات من فواتير المبيعات','الحساب':AC.vatOut+' - '+accName(AC.vatOut),'المبلغ':v.outInv},
  {'المصدر':'القيود','البند':'ضريبة المخرجات المرحلة في القيود','الحساب':AC.vatOut+' - '+accName(AC.vatOut),'المبلغ':v.out},
  {'المصدر':'مطابقة','البند':'فرق ضريبة المخرجات','الحساب':AC.vatOut,'المبلغ':v.diffOut},
  {'المصدر':'الفواتير','البند':'ضريبة المدخلات من فواتير المشتريات','الحساب':AC.vatIn+' - '+accName(AC.vatIn),'المبلغ':v.inInv},
  {'المصدر':'القيود','البند':'ضريبة المدخلات المرحلة في القيود','الحساب':AC.vatIn+' - '+accName(AC.vatIn),'المبلغ':v.in},
  {'المصدر':'مطابقة','البند':'فرق ضريبة المدخلات','الحساب':AC.vatIn,'المبلغ':v.diffIn},
  {'المصدر':'صافي','البند':'صافي الضريبة حسب القيود','الحساب':'مخرجات - مدخلات','المبلغ':v.net},
  {'المصدر':'صافي','البند':'صافي الضريبة حسب الفواتير','الحساب':'مخرجات - مدخلات','المبلغ':v.netInv}
]}
window.renderTaxReports=function(){if(!window.taxSummaryBox)return;let v=vatTotals(), inv=invoiceVatRows(), ent=taxDetailsExport();let ok=(v.diffOut===0&&v.diffIn===0);taxSummaryBox.innerHTML=`<div class="tax-note">تقرير الضريبة مستقل ومربوط بالفواتير والقيود: فواتير المبيعات ترحل إلى ${AC.vatOut}، وفواتير المشتريات ترحل إلى ${AC.vatIn}. حالة المطابقة: <span class="${ok?'diff-ok':'diff-bad'}">${ok?'مطابق':'يوجد فرق يحتاج مراجعة'}</span></div><div class="tax-summary-grid"><div class="tax-card"><span>مخرجات القيود</span><b>${money(v.out)}</b></div><div class="tax-card"><span>مدخلات القيود</span><b>${money(v.in)}</b></div><div class="tax-card"><span>صافي الضريبة</span><b>${money(v.net)}</b></div><div class="tax-card"><span>فروقات المطابقة</span><b>${money(n(v.diffOut+v.diffIn))}</b></div></div>`;taxSummaryTable.innerHTML=tableFromRows(taxExport()).replace(/^<table>|<\/table>$/g,'');taxInvoiceTable.innerHTML=tableFromRows(inv).replace(/^<table>|<\/table>$/g,'');taxEntryTable.innerHTML=tableFromRows(ent).replace(/^<table>|<\/table>$/g,'')}
function sourceDocForLine(l){let sid=String(l.source||'');let id=sid.startsWith('doc:')?sid.slice(4):'';return (S.invoices||[]).find(d=>d.id===id||d.entryId===l.entryId)||null}
window.statementExport=function(){let code=selectedAccount(stAccSearch.value),from=stFrom.value||'',to=stTo.value||'';let ls=allLines().filter(l=>l.accountCode===code).sort((a,b)=>a.date.localeCompare(b.date)||a.entryId-b.entryId);let open=ls.filter(l=>from&&l.date<from).reduce((s,l)=>s+n(l.debit)-n(l.credit),0),run=open;let rows=ls.filter(l=>dateIn(l.date,from,to)).map(l=>{run=n(run+n(l.debit)-n(l.credit));let d=sourceDocForLine(l);return {'التاريخ':l.date,'رقم المستند':d?.no||l.docNo||'','رقم القيد':l.entryId,'رقم الحساب':l.accountCode,'اسم الحساب':accName(l.accountCode),'البيان':l.description||l.desc,'مدين':n(l.debit),'دائن':n(l.credit),'الرصيد':run}});rows.meta={accountCode:code,accountName:accName(code),from,to,opening:open,closing:run};return rows}
window.renderStatements=function(){if(!stTable)return;let rows=statementExport(),m=rows.meta||{};stSum.textContent=`الحساب: ${m.accountCode||''} - ${m.accountName||''} | الرصيد الافتتاحي: ${money(m.opening||0)} | الرصيد الختامي: ${money(m.closing||0)}`;stTable.innerHTML=tableFromRows(rows)}
function excelStyle(){return `<style>body{font-family:Tahoma,Arial,sans-serif;direction:rtl;background:#fff;color:#203225} .sheet{width:100%;} .title{font-size:22pt;font-weight:900;color:#173d2a;text-align:center;padding:12px;border-bottom:4px solid #31533d}.subtitle{text-align:center;color:#666;font-size:11pt;padding:6px}.meta{width:100%;border-collapse:collapse;margin:12px 0}.meta td{border:1px solid #cdd8cc;padding:8px;background:#f7faf7;font-weight:700}.meta .label{background:#31533d;color:#fff;text-align:center}.kpi{width:100%;border-collapse:collapse;margin:10px 0}.kpi td{border:1px solid #d8e4d7;padding:10px;text-align:center;background:#eef6ef}.kpi b{font-size:16pt;color:#31533d}.data{width:100%;border-collapse:collapse;margin-top:12px}.data th{background:#31533d;color:white;border:1px solid #254530;padding:9px;text-align:center;font-weight:900}.data td{border:1px solid #d8d8d8;padding:8px;text-align:right}.data tr:nth-child(even) td{background:#f6f8f5}.num{text-align:left;direction:ltr;mso-number-format:"#,##0.00"}.date{mso-number-format:"yyyy-mm-dd"}.foot{margin-top:16px;color:#66756a;font-size:10pt;text-align:center;border-top:2px solid #31533d;padding-top:8px}.zero{color:#999}.total-row td{background:#e9f4ec!important;font-weight:900}</style>`}
function rowsTableForExcel(rows,headers){headers=headers||Object.keys(rows[0]||{});let body=(rows.length?rows:[Object.fromEntries(headers.map(h=>[h,'']))]).map(r=>'<tr>'+headers.map(h=>{let v=r[h];let cls=typeof v==='number'?'num':(String(h).includes('التاريخ')?'date':'');return `<td class="${cls}">${typeof v==='number'?money(v):esc(v??'')}</td>`}).join('')+'</tr>').join('');return '<table class="data"><thead><tr>'+headers.map(h=>`<th>${esc(h)}</th>`).join('')+'</tr></thead><tbody>'+body+'</tbody></table>'}
function statementExcelHTML(title,rows){rows=rows||[];let m=rows.meta||{},headers=['التاريخ','رقم المستند','رقم القيد','رقم الحساب','اسم الحساب','البيان','مدين','دائن','الرصيد'];let td=rows.reduce((s,r)=>s+n(r['مدين']),0),tc=rows.reduce((s,r)=>s+n(r['دائن']),0);return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">${excelStyle()}</head><body><div class="sheet"><div class="title">كشف حساب</div><div class="subtitle">${esc(ORG)} - تاريخ التصدير ${new Date().toLocaleString('ar-SA')}</div><table class="meta"><tr><td class="label">رقم الحساب</td><td>${esc(m.accountCode||'')}</td><td class="label">اسم الحساب</td><td>${esc(m.accountName||'')}</td></tr><tr><td class="label">من تاريخ</td><td>${esc(m.from||'')}</td><td class="label">إلى تاريخ</td><td>${esc(m.to||'')}</td></tr></table><table class="kpi"><tr><td>الرصيد الافتتاحي<br><b>${money(m.opening||0)}</b></td><td>إجمالي المدين<br><b>${money(td)}</b></td><td>إجمالي الدائن<br><b>${money(tc)}</b></td><td>الرصيد الختامي<br><b>${money(m.closing||0)}</b></td></tr></table>${rowsTableForExcel(rows,headers)}<div class="foot">تم تصميم كشف الحساب ليحافظ على نفس التنسيق مهما تغير اسم الحساب أو رقمه أو المبالغ أو الرصيد أو التاريخ أو رقم المستند أو رقم القيد.</div></div></body></html>`}
window.reportHTML=function(title,rows){rows=rows||[];return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">${excelStyle()}</head><body><div class="sheet"><div class="title">${esc(title)}</div><div class="subtitle">${esc(ORG)} - ${new Date().toLocaleString('ar-SA')}</div>${rowsTableForExcel(rows)}<div class="foot">تم التصدير من النظام المحاسبي المحلي.</div><button onclick="print()">طباعة / حفظ PDF</button></div></body></html>`}
window.exportExcel=function(title,rows){rows=rows||[];let isStatement=String(title).includes('كشف'); if(!rows.length&&!isStatement)return toast('لا توجد بيانات');let html=isStatement?statementExcelHTML(title,rows):reportHTML(title,rows).replace('<button onclick="print()">طباعة / حفظ PDF</button>','');let blob=new Blob(['\ufeff'+html],{type:'application/vnd.ms-excel;charset=utf-8'});let a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(isStatement?'كشف_حساب':String(title).replace(/\s+/g,'_'))+'.xls';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function validateAccountingIntegrity(){syncPartiesWithAccounts();let issues=[];for(let e of activeEntries()){let d=(e.lines||[]).reduce((s,l)=>s+n(l.debit),0),c=(e.lines||[]).reduce((s,l)=>s+n(l.credit),0);if(n(d-c)!==0)issues.push('قيد غير متوازن رقم '+e.id);for(let l of e.lines||[]){let a=acc(l.accountCode);if(!a)issues.push('حساب غير موجود في القيد '+e.id+': '+l.accountCode);else if(!a.posting)issues.push('حساب غير قابل للترحيل مستخدم في القيد '+e.id+': '+l.accountCode)}}(S.parties||[]).forEach(p=>{if(!p.accountCode||!acc(p.accountCode))issues.push('عميل/مورد غير مربوط بحساب: '+p.name)});let v=vatTotals();if(v.diffOut!==0)issues.push('فرق ضريبة المخرجات بين الفواتير والقيود: '+money(v.diffOut));if(v.diffIn!==0)issues.push('فرق ضريبة المدخلات بين الفواتير والقيود: '+money(v.diffIn));return issues}
window.validateAccountingIntegrity=validateAccountingIntegrity;
function renderIntegrityPanel(){let home=document.getElementById('home');if(!home)return;let box=document.getElementById('integrityPanel');if(!box){box=document.createElement('div');box.id='integrityPanel';box.className='integrity-panel';home.appendChild(box)}let issues=validateAccountingIntegrity();let v=vatTotals();box.innerHTML=`<h2>🔎 فحص الترابط المحاسبي</h2><div class="excel-design-note">تم تحسين تصدير كشف الحساب إلى Excel بترويسة وملخص وأعمدة ثابتة: التاريخ، رقم المستند، رقم القيد، الحساب، البيان، المدين، الدائن، الرصيد.</div><div class="integrity-grid"><div class="integrity-card ${issues.length?'bad':'ok'}"><span>حالة الفحص</span><b>${issues.length?'يوجد ملاحظات':'سليم'}</b></div><div class="integrity-card"><span>ربط العملاء/الموردين</span><b>${S.parties.length}</b></div><div class="integrity-card"><span>صافي الضريبة</span><b>${money(v.net)}</b></div><div class="integrity-card"><span>فروقات VAT</span><b>${money(n(v.diffOut+v.diffIn))}</b></div></div>${issues.length?'<ul class="integrity-list">'+issues.slice(0,8).map(x=>`<li>${esc(x)}</li>`).join('')+(issues.length>8?`<li>+${issues.length-8} ملاحظات أخرى</li>`:'')+'</ul>':'<p class="mut">كل القيود متوازنة، وجميع العملاء والموردين مربوطون بحسابات في الدليل والشجرة، وضريبة الفواتير مطابقة لقيود الضريبة.</p>'}`}
const oldRenderAllV124=window.renderAll;
window.renderAll=function(){syncPartiesWithAccounts();rebuildDocumentEntries();oldRenderAllV124();renderIntegrityPanel()}
setTimeout(()=>{bindPartyFormEnhanced();syncPartiesWithAccounts();rebuildDocumentEntries();renderAll();},180);
})();


/* v12.6 core linkage fix: accounts tree <-> customers/suppliers <-> invoices */
(function(){
  const PARTY_PARENT={customer:'1-01-02-001-001',supplier:'2-01-01-001-001'};
  const PARTY_META={customer:{label:'عميل',prefix:'عميل - ',type:'أصل',nature:'مدين',fallback:AC.ar},supplier:{label:'مورد',prefix:'مورد - ',type:'التزام',nature:'دائن',fallback:AC.ap}};
  function cleanName(v){return String(v||'').replace(/\s+/g,' ').trim()}
  function segmentWidth(parent){let level=String(parent||'').split('-').filter(Boolean).length;return level>=3?3:2}
  function makeAccount(code,name,type,nature,posting=true,notes=''){
    let parts=String(code).split('-').filter(Boolean), parent=parts.length>1?parts.slice(0,-1).join('-'):'';
    let ex=acc(code);
    let obj={code,name,type,nature,level:parts.length,parent,posting,active:true,notes};
    if(ex){Object.assign(ex,obj)} else {S.accounts.push(obj)}
    return obj;
  }
  function ensureParentChain(code,type,nature,names){
    let parts=String(code).split('-').filter(Boolean);
    for(let i=1;i<=parts.length;i++){
      let c=parts.slice(0,i).join('-');
      if(!acc(c)){
        let parent=i>1?parts.slice(0,i-1).join('-'):'';
        let name=(names&&names[i-1])||('مستوى '+i+' '+c);
        S.accounts.push({code:c,name,type,nature,level:i,parent,posting:false,active:true,notes:'تم إنشاؤه تلقائيًا لدعم الربط'});
      }
    }
  }
  function ensurePartyParents(){
    ensureParentChain(PARTY_PARENT.customer,'أصل','مدين',['الأصول','الأصول المتداولة','الذمم المدينة','العملاء','حسابات العملاء']);
    ensureParentChain(PARTY_PARENT.supplier,'التزام','دائن',['الالتزامات','التزامات متداولة','الذمم الدائنة','الموردون','حسابات الموردين']);
    let ar=acc(AC.ar); if(ar){ar.posting=false; ar.name=ar.name||'العملاء العام'; ar.notes=(ar.notes||'')+' | حساب تجميعي لا يستخدم مباشرة عند وجود عميل مستقل';}
    let ap=acc(AC.ap); if(ap){ap.posting=false; ap.name=ap.name||'الموردون العام'; ap.notes=(ap.notes||'')+' | حساب تجميعي لا يستخدم مباشرة عند وجود مورد مستقل';}
    S.accounts.sort(accountSort);
  }
  function nextAccountCode(parent){
    ensurePartyParents();
    let width=segmentWidth(parent);
    let used=S.accounts.filter(a=>a.parent===parent).map(a=>Number(String(a.code).split('-').pop())||0);
    let nxt=Math.max(0,...used)+1;
    return parent+'-'+String(nxt).padStart(width,'0');
  }
  window.ensurePartyAccount=function(p){
    if(!p||!cleanName(p.name)) return '';
    ensurePartyParents();
    let type=p.type==='supplier'?'supplier':'customer', meta=PARTY_META[type], parent=PARTY_PARENT[type];
    if(p.accountCode && acc(p.accountCode)){
      let a=acc(p.accountCode); a.name=meta.prefix+cleanName(p.name); a.type=meta.type; a.nature=meta.nature; a.posting=true; a.active=true; a.notes='مرتبط تلقائيًا مع سجل '+meta.label+' باسم: '+cleanName(p.name);
      return p.accountCode;
    }
    let same=S.accounts.find(a=>a.parent===parent && norm(a.name)===norm(meta.prefix+cleanName(p.name)));
    if(same){p.accountCode=same.code; return same.code;}
    let code=nextAccountCode(parent);
    makeAccount(code,meta.prefix+cleanName(p.name),meta.type,meta.nature,true,'مرتبط تلقائيًا مع سجل '+meta.label+' باسم: '+cleanName(p.name));
    p.accountCode=code;
    return code;
  };
  window.syncPartiesWithAccounts=function(){
    S.parties=S.parties||[]; ensurePartyParents();
    for(let p of S.parties){ if(cleanName(p.name)) ensurePartyAccount(p); }
    S.accounts.sort(accountSort); save();
  };
  window.upsertParty=function(type,name,vat,address,cr){
    name=cleanName(name); if(!name) return null;
    S.parties=S.parties||[];
    let partyType=type==='supplier'?'supplier':'customer';
    let p=S.parties.find(x=>x.type===partyType&&norm(x.name)===norm(name));
    if(!p){p={id:uid(),type:partyType,name,vat:'',cr:'',phone:'',email:'',address:'',accountCode:''};S.parties.push(p)}
    p.name=name; if(vat)p.vat=vat; if(address)p.address=address; if(cr)p.cr=cr;
    ensurePartyAccount(p); save(); return p;
  };
  window.pickParty=function(name,type){
    let partyType=type==='supplier'?'supplier':'customer';
    let p=(S.parties||[]).find(x=>x.type===partyType&&norm(x.name)===norm(name));
    return p||{name:cleanName(name),type:partyType,vat:'',cr:'',address:'',accountCode:''};
  };
  window.partyAccountForDoc=function(d){
    let partyType=d.type==='sale'?'customer':'supplier';
    let p=upsertParty(partyType,d.party?.name||'',d.party?.vat||'',d.party?.address||'',d.party?.cr||'');
    if(p) return ensurePartyAccount(p);
    return partyType==='customer'?AC.ar:AC.ap;
  };
  window.payAccount=function(pay,type,doc){
    if(pay==='نقدي') return AC.cash;
    if(pay==='الحساب البنكي'||pay==='تحويل بنكي'||pay==='شبكة') return AC.bank;
    if(pay==='جاري المالك') return AC.owner;
    return doc?partyAccountForDoc(doc):(type==='sale'?AC.ar:AC.ap);
  };
  window.entryFromDoc=function(d){
    let debit=[],credit=[],t=d.totals||{},pa=payAccount(d.pay,d.type,d);
    let title=(d.docClass==='invoice'?'فاتورة':d.docClass==='credit'?'إشعار دائن':'إشعار مدين')+' '+(d.type==='sale'?'مبيعات':'مشتريات')+' '+d.no;
    let addD=(accountCode,amount,description)=>n(amount)&&debit.push({accountCode,description,debit:n(amount),credit:0});
    let addC=(accountCode,amount,description)=>n(amount)&&credit.push({accountCode,description,debit:0,credit:n(amount)});
    if(d.type==='sale'){
      if(d.docClass==='credit'){addD(AC.sales,t.taxable,'تخفيض مبيعات '+d.no);addD(AC.vatOut,t.vat,'تخفيض ضريبة مخرجات '+d.no);addC(pa,t.total,'إشعار دائن '+(d.party?.name||''));}
      else{addD(pa,t.total,title);addC(AC.sales,t.taxable,'مبيعات '+d.no);addC(AC.vatOut,t.vat,'ضريبة مخرجات '+d.no);}
    }else{
      if(d.docClass==='credit'){addD(pa,t.total,'إشعار دائن مشتريات '+(d.party?.name||''));addC(AC.purch,t.taxable,'تخفيض مشتريات '+d.no);addC(AC.vatIn,t.vat,'تخفيض ضريبة مدخلات '+d.no);}
      else{addD(AC.purch,t.taxable,title);addD(AC.vatIn,t.vat,'ضريبة مدخلات '+d.no);addC(pa,t.total,'مورد '+(d.party?.name||''));}
    }
    let lines=[...debit,...credit].filter(l=>n(l.debit)||n(l.credit));
    return{id:d.entryId,date:d.date,title,desc:d.desc||title,status:'نشط',source:'doc:'+d.id,lines};
  };
  // Update old existing invoices entries to linked party accounts
  window.rebuildInvoiceEntriesLinkage=function(){
    syncPartiesWithAccounts();
    for(let d of (S.invoices||[])){
      if(!d.entryId) d.entryId=next('entry');
      let e=entryFromDoc(d); saveEntryObject(e);
    }
    save(); renderAll(); toast('تم تحديث ربط الفواتير مع العملاء والموردين والحسابات');
  };
  window.partyFormSubmitLinked=function(e){
    e.preventDefault();
    let id=partyId.value||uid();
    let p={id,type:partyType.value,name:cleanName(partyName.value),vat:(partyVat.value||'').trim(),cr:(partyCR.value||'').trim(),phone:(partyPhone.value||'').trim(),email:(partyEmail.value||'').trim(),address:(partyAddress.value||'').trim(),accountCode:''};
    if(!p.name){partyName.classList.add('field-error'); partyName.focus(); return toast('أدخل اسم العميل أو المورد أولًا');}
    let old=S.parties.find(x=>x.id===id); if(old&&old.accountCode)p.accountCode=old.accountCode;
    let i=S.parties.findIndex(x=>x.id===id); i>=0?S.parties[i]=p:S.parties.push(p);
    ensurePartyAccount(p); save(); newParty(); renderAll(); toast('تم حفظ '+(p.type==='customer'?'العميل':'المورد')+' وربطه بدليل الحسابات والشجرة');
  };
  if(window.partyForm) partyForm.onsubmit=partyFormSubmitLinked;
  window.newParty=function(){partyForm.reset();partyId.value='';partyType.value='customer';if(partyName){partyName.classList.remove('field-error');setTimeout(()=>partyName.focus(),40)}};
  window.editParty=function(id){let p=(S.parties||[]).find(x=>x.id===id);if(!p)return;show('parties');partyId.value=p.id;partyType.value=p.type;partyName.value=p.name;partyVat.value=p.vat||'';partyCR.value=p.cr||'';partyPhone.value=p.phone||'';partyEmail.value=p.email||'';partyAddress.value=p.address||'';setTimeout(()=>partyName.focus(),60)};
  window.renderParties=function(){
    if(!window.partyTable)return; syncPartiesWithAccounts();
    let q=norm(partySearch?.value),f=partyFilter?.value;
    let rows=(S.parties||[]).filter(p=>(!f||p.type===f)&&(!q||norm(`${p.name} ${p.vat} ${p.phone} ${p.accountCode} ${accName(p.accountCode)}`).includes(q)));
    partyTable.innerHTML='<thead><tr><th>النوع</th><th>الاسم</th><th>حساب الدليل والشجرة</th><th>الرقم الضريبي</th><th>الجوال</th><th>البريد</th><th>العنوان</th><th>إجراءات</th></tr></thead><tbody>'+rows.map(p=>`<tr class="party-linked-row"><td>${p.type==='customer'?'عميل':'مورد'}</td><td><b>${esc(p.name)}</b><span class="account-link-note">مرتبط تلقائيًا بالحسابات</span></td><td><span class="linked-account-badge">${esc(p.accountCode||'')}</span><br><small>${esc(accName(p.accountCode))}</small></td><td class="num">${esc(p.vat||'')}</td><td>${esc(p.phone||'')}</td><td>${esc(p.email||'')}</td><td>${esc(p.address||'')}</td><td><button class="secondary icon" data-tip="تعديل" onclick="editParty('${p.id}')">📝</button><button class="danger icon" data-tip="سلة مهملات" onclick="trashParty('${p.id}')">🗑️</button></td></tr>`).join('')+'</tbody>';
  };
  window.partyExport=function(){syncPartiesWithAccounts();return (S.parties||[]).map(p=>({'النوع':p.type==='customer'?'عميل':'مورد','الاسم':p.name,'رقم حساب الدليل':p.accountCode||'','اسم حساب الدليل':accName(p.accountCode),'الرقم الضريبي':p.vat,'السجل التجاري':p.cr,'الجوال':p.phone,'البريد':p.email,'العنوان':p.address}))};
  window.renderAccounts=function(){
    if(!window.accTable)return; ensurePartyParents(); let q=norm(accSearch?.value);
    let rows=S.accounts.filter(a=>!q||norm(`${a.code} ${a.name} ${a.type} ${a.parent}`).includes(q)).sort(accountSort);
    accTable.innerHTML='<thead><tr><th>إجراءات</th><th>رقم الحساب</th><th>اسم الحساب</th><th>الأب</th><th>المستوى</th><th>النوع</th><th>الطبيعة</th><th>ترحيل</th><th>الربط</th></tr></thead><tbody>'+rows.map(a=>{let p=(S.parties||[]).find(x=>x.accountCode===a.code);return `<tr><td><button class="secondary icon" data-tip="تعديل" onclick="editAccount('${a.code}')">📝</button><button class="secondary icon" data-tip="إضافة فرعي" onclick="addChild('${a.code}')">＋</button><button class="danger icon" data-tip="سلة مهملات" onclick="trashAccount('${a.code}')">🗑️</button></td><td class="num">${a.code}</td><td><b>${esc(a.name)}</b></td><td class="num">${esc(a.parent||'-')}</td><td>${a.level}</td><td>${a.type}</td><td>${a.nature}</td><td>${a.posting?'نعم':'لا'}</td><td>${p?`<span class="linked-account-badge">${p.type==='customer'?'عميل':'مورد'}: ${esc(p.name)}</span>`:'-'}</td></tr>`}).join('')+'</tbody>';
  };
  window.renderTree=function(){
    if(!window.treeBox)return; ensurePartyParents();
    let ch={}; S.accounts.sort(accountSort).forEach(a=>(ch[a.parent||'root']??=[]).push(a));
    let branch=p=>`<ul>${(ch[p]||[]).sort(accountSort).map(a=>{let party=(S.parties||[]).find(x=>x.accountCode===a.code);let cls=(a.posting?'leaf ':'')+(party?'tree-party-node':'');return `<li class="${cls}"><span class="code">${a.code}</span> <b>${esc(a.name)}</b> <span class="badge">${a.type}</span> ${a.posting?'<span class="badge warn">ترحيل</span>':''} ${party?`<span class="party-mark">${party.type==='customer'?'عميل':'مورد'}</span>`:''} <button class="secondary icon" data-tip="تعديل" onclick="editAccount('${a.code}')">📝</button><button class="secondary icon" data-tip="إضافة فرعي" onclick="addChild('${a.code}')">＋</button>${branch(a.code)}</li>`}).join('')}</ul>`;
    treeBox.innerHTML=`<div class="linkage-panel"><h3>ربط العملاء والموردين مع الدليل والشجرة</h3><p>أي عميل أو مورد تحفظه يتم إنشاء حساب له تلقائيًا هنا. فواتير المبيعات والمشتريات تستخدم الحساب المرتبط مباشرة عند السداد الآجل.</p><div class="linkage-actions"><button class="primary" onclick="show('parties');partyType.value='customer';partyName.focus()">＋ إضافة عميل مرتبط</button><button class="secondary" onclick="show('parties');partyType.value='supplier';partyName.focus()">＋ إضافة مورد مرتبط</button><button class="excel" onclick="syncPartiesWithAccounts();renderAll();toast('تمت مزامنة الشجرة والدليل مع العملاء والموردين')">مزامنة الربط</button><button class="pdf" onclick="rebuildInvoiceEntriesLinkage()">تحديث قيود الفواتير</button></div></div>`+branch('root');
  };
  // better document linkage during saving in existing and new forms
  const _oldSaveDoc=window.saveDoc;
  window.saveDoc=function(e,type,docClass){
    if(e&&e.preventDefault)e.preventDefault();
    let f=e.target, partyEl=f.querySelector('#docParty');
    let name=cleanName(partyEl?.value); if(partyEl)partyEl.value=name;
    if(!name){partyEl&&partyEl.classList.add('field-error'); partyEl&&partyEl.focus(); return toast(type==='sale'?'أدخل اسم العميل أولًا':'أدخل اسم المورد أولًا');}
    let partyType=type==='sale'?'customer':'supplier';
    let party=upsertParty(partyType,name,normalizeVat(f.querySelector('#docPartyVat')?.value||''),(f.querySelector('#docPartyAddress')?.value||''),(f.querySelector('#docPartyCR')?.value||''));
    if(party){if(f.querySelector('#docPartyVat'))f.querySelector('#docPartyVat').value=party.vat||''; if(f.querySelector('#docPartyCR'))f.querySelector('#docPartyCR').value=party.cr||''; if(f.querySelector('#docPartyAddress'))f.querySelector('#docPartyAddress').value=party.address||'';}
    // run original/enhanced save now that account exists
    return _oldSaveDoc ? _oldSaveDoc(e,type,docClass) : undefined;
  };
  // initial sync on load
  try{syncPartiesWithAccounts();}catch(e){}
})();
