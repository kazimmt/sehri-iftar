// ১. গ্লোবাল ভেরিয়েবল এবং হ্যান্ডলার
let countdownInterval = null;
let processedDataGlobal = null;

// মোবাইল অ্যাপ সেকশন ফাংশন - এটি অবশ্যই গ্লোবাল স্কোপে থাকতে হবে
function showSection(sectionId, element) {
    if (window.innerWidth > 768) return;

    const mainContent = document.querySelector('main'); 
    const body = document.body;
    
    // HTML এলিমেন্টগুলো খুঁজে বের করা
    const views = {
        'home': document.querySelector('.lg\\:col-span-4'),
        'timetable': document.querySelector('.lg\\:col-span-8'),
        'dua': document.getElementById('dua-content'), // আপনার দোয়ার গ্রিড আইডি
        'settings': document.getElementById('settings-section')
    };

    // সব সেকশন হাইড করা
    Object.values(views).forEach(v => {
        if (v) {
            v.style.setProperty('display', 'none', 'important');
            v.classList.add('hidden');
            v.classList.remove('fade-in-view');
        }
    });

    // লজিক: দুয়া বা সেটিংস সেকশনে <main> কন্টেন্ট হাইড করা
    if (sectionId === 'dua' || sectionId === 'settings') {
        if (mainContent) mainContent.style.display = 'none';
        
        // ডার্ক মোড অনুযায়ী ব্যাকগ্রাউন্ড অ্যাডজাস্টমেন্ট
        if (body.classList.contains('dark-mode')) {
            body.style.backgroundColor = (sectionId === 'dua') ? '#064e3b' : '#020617';
        } else {
            body.style.backgroundColor = (sectionId === 'dua') ? '#064e3b' : '#f8fafc';
        }
    } else {
        if (mainContent) mainContent.style.display = 'block';
        body.style.backgroundColor = ''; // ডিফল্ট ব্যাকগ্রাউন্ড
    }

    // নির্দিষ্ট সেকশন দেখানো
    const activeView = views[sectionId];
    if (activeView) {
        activeView.classList.remove('hidden');
        activeView.style.setProperty('display', 'block', 'important');
        setTimeout(() => {
            activeView.classList.add('fade-in-view');
        }, 10);
    }

    // নেভিগেশন বাটনের কালার পরিবর্তন
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        item.style.color = '#777'; 
    });
    
    if (element) {
        element.classList.add('active');
        element.style.color = '#15803d';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ২. সংখ্যা রূপান্তর ফাংশন
function toEnglishNumber(n) {
   return String(n).replace(/[০-৯]/g, d => "0123456789" ["০১২৩৪৫৬৭৮৯".indexOf(d)]);
}

function toBengaliNumber(n) {
   return String(n).replace(/[0-9]/g, d => "০১২৩৪৫৬৭৮৯" [d]);
}

// ৩. ডাটা প্রসেসিং
function getProcessedData() {
   const processed = {};
   const startDate = new Date(calendarSettings.startYear, calendarSettings.startMonth, calendarSettings.startDay);
   Object.keys(rawDistrictData).forEach(key => {
      const district = rawDistrictData[key];
      const sahriList = (district.sahriTimes || "").split(',').map(s => s.trim());
      const fajrList = (district.fajrTimes || "").split(',').map(s => s.trim());
      const iftarList = (district.iftarTimes || "").split(',').map(s => s.trim());
      const timetable = [];
      for (let i = 0; i < 30; i++) {
         const d = new Date(startDate);
         d.setDate(startDate.getDate() + i);
         timetable.push({
            day: i + 1,
            fullDate: d,
            dateStr: d.toLocaleDateString('bn-BD', {
               day: 'numeric',
               month: 'long'
            }),
            sahri: sahriList[i] || "---",
            fajr: fajrList[i] || "---",
            iftar: iftarList[i] || "---"
         });
      }
      processed[key] = {
         name: district.name,
         timetable
      };
   });
   return processed;
}

// ৪. কাউন্টডাউন লজিক
function startCountdown(districtData) {
   if (countdownInterval) clearInterval(countdownInterval);
   const timerDisplay = document.getElementById('countdown-timer');
   const eventNameDisplay = document.getElementById('next-event-name');
   const eventTimeDisplay = document.getElementById('next-event-time');

   function update() {
      const now = new Date();
      const todayRow = districtData.timetable.find(row => row.fullDate.toDateString() === now.toDateString());
      let targetTime = null;
      let eventLabel = "";
      let displayTime = "";

      if (!todayRow) {
         const firstDay = districtData.timetable[0].fullDate;
         if (now < firstDay) {
            targetTime = firstDay;
            eventLabel = "রমজান শুরু";
            displayTime = districtData.timetable[0].dateStr;
         } else {
            eventNameDisplay.textContent = "রমজান সমাপ্ত";
            timerDisplay.textContent = "০০:০০:০০";
            return;
         }
      } else {
         const [sH, sM] = toEnglishNumber(todayRow.sahri).split(':').map(Number);
         const [iH, iM] = toEnglishNumber(todayRow.iftar).split(':').map(Number);
         const sahriTime = new Date(now);
         sahriTime.setHours(sH, sM, 0);
         const iftarTime = new Date(now);
         iftarTime.setHours(iH + 12, iM, 0);

         if (now < sahriTime) {
            targetTime = sahriTime;
            eventLabel = "সাহরী শেষ";
            displayTime = "ভোর " + todayRow.sahri + " টা";
         } else if (now < iftarTime) {
            targetTime = iftarTime;
            eventLabel = "ইফতার";
            displayTime = "সন্ধ্যা " + todayRow.iftar + " টা";
         } else {
            const tomorrow = new Date(now);
            tomorrow.setDate(now.getDate() + 1);
            const tomRow = districtData.timetable.find(r => r.fullDate.toDateString() === tomorrow.toDateString());
            if (tomRow) {
               const [tsH, tsM] = toEnglishNumber(tomRow.sahri).split(':').map(Number);
               targetTime = new Date(tomorrow);
               targetTime.setHours(tsH, tsM, 0);
               eventLabel = "সাহরী শেষ";
               displayTime = "ভোর " + tomRow.sahri + " টা";
            }
         }
      }

      if (targetTime && timerDisplay) {
         const diff = targetTime - now;
         const h = Math.floor(diff / 3600000);
         const m = Math.floor((diff % 3600000) / 60000);
         const s = Math.floor((diff % 60000) / 1000);
         if(eventNameDisplay) eventNameDisplay.textContent = eventLabel;
         if(eventTimeDisplay) eventTimeDisplay.textContent = displayTime;
         timerDisplay.textContent = toBengaliNumber(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
   }
   update();
   countdownInterval = setInterval(update, 1000);
}

// ৫. টেবিল রেন্ডারিং
function renderTable(key, data) {
   localStorage.setItem('selectedDistrict', key);
   const district = data[key];
   if (!district) return;

   document.getElementById('selected-district-name').textContent = district.name;
   document.getElementById('district-search').value = district.name;
   const tableBody = document.getElementById('timetable-body');
   if(tableBody) {
       tableBody.innerHTML = '';
       const todayStr = new Date().toDateString();

       district.timetable.forEach((row, index) => {
          const tr = document.createElement('tr');
          const isToday = row.fullDate.toDateString() === todayStr;
          let rowClass = isToday ? 'highlight-today' : (index % 2 === 0 ? 'bg-white' : 'bg-green-50/50');

          tr.className = `${rowClass} fade-in border-b border-green-100`;
          tr.innerHTML = `
                <td class="p-3 md:p-4 text-center font-bold text-green-700 border-r">${toBengaliNumber(row.day)}</td>
                <td class="p-3 md:p-4 text-gray-700 border-r text-sm">${row.dateStr}</td>
                <td class="p-3 md:p-4 text-center font-bold text-green-900 bg-green-100/30 border-r">${row.sahri}</td>
                <td class="p-3 md:p-4 text-center text-gray-600 border-r hidden md:table-cell">${row.fajr}</td>
                <td class="p-3 md:p-4 text-center"><span class="font-bold text-orange-700">${row.iftar}</span></td>
            `;
          tableBody.appendChild(tr);
       });
   }

   const now = new Date();
   const todayRow = district.timetable.find(r => r.fullDate.toDateString() === now.toDateString());
   if (todayRow) {
      document.getElementById('today-sahri').textContent = todayRow.sahri;
      document.getElementById('today-fajr').textContent = todayRow.fajr;
      document.getElementById('today-iftar').textContent = todayRow.iftar;
      document.getElementById('ramadan-day-status').textContent = `আজকে ${toBengaliNumber(todayRow.day)} তম রোজা`;
   }

   document.querySelectorAll('#bd-map path').forEach(p => p.classList.remove('active'));
   const path = document.getElementById(key);
   if (path) path.classList.add('active');

   startCountdown(district);
}

// ৬. সিলেকশন এবং অন্যান্য সেটআপ
function setupSelection(data) {
   const searchInput = document.getElementById('district-search');
   const searchResults = document.getElementById('search-results');
   if(!searchInput || !searchResults) return;

   searchInput.addEventListener('click', (e) => {
      e.stopPropagation();
      if (searchResults.style.display === 'block') {
          searchResults.style.display = 'none';
      } else {
          searchResults.innerHTML = '';
          Object.keys(data).forEach(key => {
             const div = document.createElement('div');
             div.className = 'search-item';
             div.textContent = data[key].name;
             div.onclick = (e) => {
                e.stopPropagation();
                renderTable(key, data);
                searchResults.style.display = 'none';
             };
             searchResults.appendChild(div);
          });
          searchResults.style.display = 'block';
      }
   });

   document.addEventListener('click', () => {
      searchResults.style.display = 'none';
   });
}

function updateHeaderDates() {
   const now = new Date();
   const dateElem = document.getElementById('header-date-bn');
   if(dateElem) {
       dateElem.textContent = now.toLocaleDateString('bn-BD', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
       });
   }
   
   const startOfRamadan = new Date(2026, 1, 19);
   const diffDays = Math.floor((now - startOfRamadan) / (1000 * 60 * 60 * 24));
   let hijriText = "";
   if (diffDays < 0) hijriText = "শা'বান ১৪৪৭ হিজরী";
   else if (diffDays < 30) hijriText = `${toBengaliNumber(diffDays + 1)} রমজান ১৪৪৭ হিজরী`;
   else hijriText = "শাওয়াল ১৪৪৭ হিজরী";
   
   const hijriElem = document.getElementById('header-date-hijri');
   if (hijriElem) hijriElem.textContent = hijriText;
}

function setupMapInteractions() {
   const tooltip = document.getElementById('map-tooltip');
   document.querySelectorAll('#bd-map path').forEach(path => {
      path.addEventListener('mousemove', (e) => {
          if(tooltip) {
              tooltip.textContent = path.getAttribute('data-name');
              tooltip.style.display = 'block';
              tooltip.style.left = (e.clientX + 10) + 'px';
              tooltip.style.top = (e.clientY + 10) + 'px';
          }
      });
      path.addEventListener('mouseleave', () => {
          if(tooltip) tooltip.style.display = 'none';
      });
      path.addEventListener('click', () => {
          const id = path.getAttribute('id');
          if (processedDataGlobal[id]) renderTable(id, processedDataGlobal);
      });
   });
}

// ৭. ডার্ক মোড এবং মেইন ইনিশিয়ালাইজেশন
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('dark-mode-toggle'); 
    const settingsToggle = document.querySelector('#settings-section input[type="checkbox"]');
    const body = document.body;

    // কমন ফাংশন: ডার্ক মোড আপডেট করা
    const updateDarkMode = (isDark) => {
        if (isDark) {
            body.classList.add('dark-mode');
            localStorage.setItem('dark-mode', 'enabled');
            if (settingsToggle) settingsToggle.checked = true;
        } else {
            body.classList.remove('dark-mode');
            localStorage.setItem('dark-mode', 'disabled');
            if (settingsToggle) settingsToggle.checked = false;
        }
    };

    // ফ্লোটিং বাটনের জন্য
    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isDark = !body.classList.contains('dark-mode');
            updateDarkMode(isDark);
        });
    }

    // সেটিংস পেজের সুইচের জন্য
    if (settingsToggle) {
        settingsToggle.addEventListener('change', (e) => {
            updateDarkMode(e.target.checked);
        });
    }

    // আগের সেটিংস চেক করা
    if (localStorage.getItem('dark-mode') === 'enabled') {
        updateDarkMode(true);
    }

    // ১. ডাটা লোড ও সেটআপ
    processedDataGlobal = getProcessedData();
    setupSelection(processedDataGlobal);
    updateHeaderDates();
    setupMapInteractions();

    const savedDistrict = localStorage.getItem('selectedDistrict');
    renderTable((savedDistrict && processedDataGlobal[savedDistrict]) ? savedDistrict : 'dhaka', processedDataGlobal);

    // ২. মোবাইল ভিউ ইনিশিয়ালাইজ করা
    if (window.innerWidth <= 768) {
        const homeBtn = document.querySelector('.nav-item');
        showSection('home', homeBtn);
    }
});