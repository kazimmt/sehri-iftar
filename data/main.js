        let countdownInterval = null;
        let processedDataGlobal = null;

        // বাংলা সংখ্যাকে ইংরেজি সংখ্যায় রূপান্তর (হিসাব করার জন্য)
        function toEnglishNumber(n) {
            return String(n).replace(/[০-৯]/g, d => "0123456789"["০১২৩৪৫৬৭৮৯".indexOf(d)]);
        }

        // ইংরেজি সংখ্যাকে বাংলা সংখ্যায় রূপান্তর (দেখানোর জন্য)
        function toBengaliNumber(n) {
            return String(n).replace(/[0-9]/g, d => "০১২৩৪৫৬৭৮৯"[d]);
        }

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
                        dateStr: d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' }),
                        sahri: sahriList[i] || "---",
                        fajr: fajrList[i] || "---",
                        iftar: iftarList[i] || "---"
                    });
                }
                processed[key] = { name: district.name, timetable };
            });
            return processed;
        }

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
                        targetTime = firstDay; eventLabel = "রমজান শুরু"; displayTime = districtData.timetable[0].dateStr;
                    } else {
                        eventNameDisplay.textContent = "রমজান সমাপ্ত"; timerDisplay.textContent = "০০:০০:০০"; return;
                    }
                } else {
                    // প্রসেস করার আগে ইংরেজি সংখ্যায় নিয়ে আসা
                    const [sH, sM] = toEnglishNumber(todayRow.sahri).split(':').map(Number);
                    const [iH, iM] = toEnglishNumber(todayRow.iftar).split(':').map(Number);
                    const sahriTime = new Date(now); sahriTime.setHours(sH, sM, 0);
                    const iftarTime = new Date(now); iftarTime.setHours(iH + 12, iM, 0); 

                    if (now < sahriTime) {
                        targetTime = sahriTime; eventLabel = "সাহরী শেষ"; displayTime = todayRow.sahri + " AM";
                    } else if (now < iftarTime) {
                        targetTime = iftarTime; eventLabel = "ইফতার"; displayTime = todayRow.iftar + " PM";
                    } else {
                        const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
                        const tomRow = districtData.timetable.find(r => r.fullDate.toDateString() === tomorrow.toDateString());
                        if (tomRow) {
                            const [tsH, tsM] = toEnglishNumber(tomRow.sahri).split(':').map(Number);
                            targetTime = new Date(tomorrow); targetTime.setHours(tsH, tsM, 0);
                            eventLabel = "আগামী সাহরী"; displayTime = tomRow.sahri + " AM";
                        }
                    }
                }

                if (targetTime) {
                    const diff = targetTime - now;
                    const h = Math.floor(diff / 3600000);
                    const m = Math.floor((diff % 3600000) / 60000);
                    const s = Math.floor((diff % 60000) / 1000);
                    eventNameDisplay.textContent = eventLabel;
                    eventTimeDisplay.textContent = displayTime; // ডাটা এখন সরাসরি বাংলায় আছে
                    timerDisplay.textContent = toBengaliNumber(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
                }
            }
            update();
            countdownInterval = setInterval(update, 1000);
        }

        function renderTable(key, data) {
            const district = data[key];
            if(!district) return;
            document.getElementById('selected-district-name').textContent = district.name;
            document.getElementById('district-search').value = district.name;
            const tableBody = document.getElementById('timetable-body');
            tableBody.innerHTML = '';

            district.timetable.forEach((row, index) => {
                const tr = document.createElement('tr');
                tr.className = `${index % 2 === 0 ? 'bg-white' : 'bg-green-50/50'} fade-in border-b border-green-100`;
                tr.innerHTML = `
                    <td class="p-3 md:p-4 text-center font-bold text-green-700 border-r">${toBengaliNumber(row.day)}</td>
                    <td class="p-3 md:p-4 text-gray-700 border-r text-sm">${row.dateStr}</td>
                    <td class="p-3 md:p-4 text-center font-bold text-green-900 bg-green-100/30 border-r">${row.sahri}</td>
                    <td class="p-3 md:p-4 text-center text-gray-600 border-r hidden md:table-cell">${row.fajr}</td>
                    <td class="p-3 md:p-4 text-center">
                        <span class="font-bold text-orange-700">${row.iftar}</span>
                    </td>
                `;
                tableBody.appendChild(tr);
            });

            const now = new Date();
            const todayRow = district.timetable.find(r => r.fullDate.toDateString() === now.toDateString());
            if (todayRow) {
                document.getElementById('today-sahri').textContent = todayRow.sahri;
                document.getElementById('today-fajr').textContent = todayRow.fajr;
                document.getElementById('today-iftar').textContent = todayRow.iftar;
                document.getElementById('ramadan-day-status').textContent = `আজকের রোজা: ${toBengaliNumber(todayRow.day)} তম`;
            }

            document.querySelectorAll('#bd-map path').forEach(p => p.classList.remove('active'));
            const path = document.getElementById(key);
            if(path) path.classList.add('active');

            startCountdown(district);
        }

        function setupSelection(data) {
            const searchInput = document.getElementById('district-search');
            const searchResults = document.getElementById('search-results');

            function showAll() {
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

            searchInput.addEventListener('click', (e) => {
                e.stopPropagation();
                showAll();
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
            document.getElementById('header-date-en-raw').textContent = now.toDateString();
            document.getElementById('header-date-bn').textContent = now.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
            const startOfRamadan = new Date(2026, 1, 19);
            const diffDays = Math.floor((now - startOfRamadan) / (1000 * 60 * 60 * 24));
            let hijriText = "";
            if(diffDays < 0) hijriText = "শা'বান ১৪৪৭ হিজরী";
            else if (diffDays < 30) hijriText = `${toBengaliNumber(diffDays + 1)} রমজান ১৪৪৭ হিজরী`;
            else hijriText = "শাওয়াল ১৪৪৭ হিজরী";
            document.getElementById('header-date-hijri').textContent = hijriText;
        }
		
		// Map Tooltip
        function setupMapInteractions() {
            const tooltip = document.getElementById('map-tooltip');
            const paths = document.querySelectorAll('#bd-map path');

            paths.forEach(path => {
                path.addEventListener('mousemove', (e) => {
                    const name = path.getAttribute('data-name');
                    tooltip.textContent = name;
                    tooltip.style.display = 'block';
                    tooltip.style.left = (e.clientX + 10) + 'px';
                    tooltip.style.top = (e.clientY + 10) + 'px';
                });

                path.addEventListener('mouseleave', () => {
                    tooltip.style.display = 'none';
                });

                path.addEventListener('click', () => {
                    const id = path.getAttribute('id');
                    if(processedDataGlobal[id]) renderTable(id, processedDataGlobal);
                });
            });
        }
        document.addEventListener('DOMContentLoaded', () => {
            processedDataGlobal = getProcessedData();
            setupSelection(processedDataGlobal);
            updateHeaderDates();
            renderTable('dhaka', processedDataGlobal);
            setupMapInteractions();

        });