// ১. গ্লোবাল ভেরিয়েবল এবং হ্যান্ডলার
let countdownInterval = null;
let processedDataGlobal = null;

function handlePrint() {
   try {
      const siteUrl = window.location.hostname || "kazimmt.github.io/sehri-iftar";
      const placeholder = document.getElementById('site-url-placeholder');
      if (placeholder) placeholder.textContent = siteUrl;
      window.focus();
      window.print();
   } catch (error) {
      console.error("প্রিন্ট করতে সমস্যা হচ্ছে:", error);
   }
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
            displayTime = "ভোর " + todayRow.sahri + " AM";
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

      if (targetTime) {
         const diff = targetTime - now;
         const h = Math.floor(diff / 3600000);
         const m = Math.floor((diff % 3600000) / 60000);
         const s = Math.floor((diff % 60000) / 1000);
         eventNameDisplay.textContent = eventLabel;
         eventTimeDisplay.textContent = displayTime;
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

   searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim().toLowerCase();
      searchResults.innerHTML = '';
      const filtered = Object.keys(data).filter(key =>
         data[key].name.toLowerCase().includes(query) || key.includes(query)
      );

      if (filtered.length > 0) {
         filtered.forEach(key => {
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
      } else {
         searchResults.style.display = 'none';
      }
   });

   document.addEventListener('click', () => {
      searchResults.style.display = 'none';
   });
}

function updateHeaderDates() {
   const now = new Date();
   document.getElementById('header-date-bn').textContent = now.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
   });
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
         tooltip.textContent = path.getAttribute('data-name');
         tooltip.style.display = 'block';
         tooltip.style.left = (e.clientX + 10) + 'px';
         tooltip.style.top = (e.clientY + 10) + 'px';
      });
      path.addEventListener('mouseleave', () => {
         tooltip.style.display = 'none';
      });
      path.addEventListener('click', () => {
         const id = path.getAttribute('id');
         if (processedDataGlobal[id]) renderTable(id, processedDataGlobal);
      });
   });
}

// ৭. ডার্ক মোড এবং ইনিশিয়ালাইজেশন
document.addEventListener('DOMContentLoaded', () => {
   // ডার্ক মোড হ্যান্ডলার
   const toggleBtn = document.getElementById('dark-mode-toggle');
   if (localStorage.getItem('dark-mode') === 'enabled') {
      document.body.classList.add('dark-mode');
   }

   if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
         document.body.classList.toggle('dark-mode');
         localStorage.setItem('dark-mode', document.body.classList.contains('dark-mode') ? 'enabled' : 'disabled');
      });
   }

   // ডাটা লোড
   processedDataGlobal = getProcessedData();
   setupSelection(processedDataGlobal);
   updateHeaderDates();
   setupMapInteractions();

   const savedDistrict = localStorage.getItem('selectedDistrict');
   renderTable((savedDistrict && processedDataGlobal[savedDistrict]) ? savedDistrict : 'dhaka', processedDataGlobal);
});