
(function(){
  function safeToast(msg){
    var t=document.getElementById('toast');
    if(t){ t.textContent=msg; t.classList.add('show'); setTimeout(function(){t.classList.remove('show')},2800); }
  }
  window.enterApp=function(){
    var coverEl=document.getElementById('cover');
    var appEl=document.getElementById('app');
    if(coverEl){ coverEl.classList.add('hidden'); coverEl.style.display='none'; }
    if(appEl){ appEl.classList.remove('hidden'); appEl.style.display='grid'; }
    try{ if(typeof renderAll==='function') renderAll(); }
    catch(err){ console.error(err); safeToast('تم فتح التطبيق، لكن يوجد تنبيه في تحديث بعض البيانات.'); }
  };
  document.addEventListener('DOMContentLoaded',function(){
    var btn=document.querySelector('#cover button.primary, #cover button');
    if(btn){ btn.removeAttribute('onclick'); btn.addEventListener('click',function(e){ e.preventDefault(); window.enterApp(); }); }
  });
})();


/* v13.0.2 login/home behavior */
function forgotPassword(){
  const user = (document.getElementById('loginUser')?.value || '').trim() || 'المستخدم';
  alert('استعادة كلمة السر\n\nلأمان البيانات، يتم استعادة كلمة السر من مدير النظام.\nاسم المستخدم: '+user+'\n\nفي النسخة السحابية الكاملة يمكن ربطها بالإيميل لاحقًا لإرسال رابط استعادة تلقائي.');
}
(function(){
  const navIcons={home:'🏠',settings:'⚙️',accounts:'📘',tree:'🌳',parties:'👥',saleInv:'🧾',purchaseInv:'🛒',notes:'↩️',invoiceReg:'📑',entry:'➕',journal:'📝',daybook:'📒',ledger:'📚',statements:'📄',vouchers:'💵',payroll:'👷',trial:'⚖️',financials:'📈',taxReports:'📊',data:'💾'};
  function decorateNav(){
    document.querySelectorAll('#nav button[data-page]').forEach(btn=>{
      if(btn.dataset.decorated) return;
      const txt=btn.textContent.trim(); const ico=navIcons[btn.dataset.page]||'•';
      btn.innerHTML='<span class="nav-label">'+txt+'</span><span class="nav-ico">'+ico+'</span>';
      btn.dataset.decorated='1';
    });
    document.querySelectorAll('#reportsPane button').forEach(btn=>{
      if(btn.dataset.decorated) return;
      const txt=btn.textContent.trim();
      const m=txt.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\uD83C-\uDBFF][\uDC00-\uDFFF])\s*(.*)$/);
      const ico=m?m[1]:'📌'; const label=m?(m[2]||txt):txt;
      btn.innerHTML='<span class="r-label">'+label+'</span><span class="r-ico">'+ico+'</span>';
      btn.dataset.decorated='1';
    });
  }
  function updateClock(){
    const c=document.getElementById('homeClock'), d=document.getElementById('homeDate');
    if(!c&&!d) return;
    const now=new Date();
    if(c) c.textContent=now.toLocaleTimeString('ar-SA',{hour:'2-digit',minute:'2-digit'});
    if(d) d.textContent=now.toLocaleDateString('ar-SA',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  }
  const oldEnter=window.enterApp;
  window.enterApp=function(){
    if(typeof oldEnter==='function') oldEnter(); else {document.getElementById('cover')?.classList.add('hidden');document.getElementById('app')?.classList.remove('hidden');if(typeof renderAll==='function')renderAll();}
    decorateNav(); updateClock(); setInterval(updateClock,30000);
  };
  document.addEventListener('DOMContentLoaded',()=>{decorateNav();updateClock();});
  setTimeout(()=>{decorateNav();updateClock();},100);
})();
