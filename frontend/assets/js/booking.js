
          document.addEventListener('DOMContentLoaded', () => {
            // Ambil data user yang login dari localStorage
            const userName = localStorage.getItem('userName');
            const isAdmin = localStorage.getItem('isAdmin') === 'true';
            if (userName) {
              document.querySelector('.user-name').textContent = userName;
              // Buat inisial dari nama
              const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
              document.querySelector('.user-avatar').textContent = initials;
              document.querySelector('.user-role').textContent = isAdmin ? 'Admin' : 'Pengguna';
            }
            if (isAdmin) {
              const adminMenu = document.getElementById('adminSidebarMenu');
              if (adminMenu) adminMenu.style.display = 'block';
              const labelMenuUtama = document.getElementById('labelMenuUtama');
              if (labelMenuUtama) labelMenuUtama.style.display = 'none';
            } else {
              document.querySelectorAll('[data-section="analitik"], [data-section="pembayaran"], [data-section="member"], [data-section="laporan"]').forEach(sec => sec.style.display = 'none');
            }
            
            if (!isAdmin) {
               const thDeleteCol = document.getElementById('thDeleteCol');
               if (thDeleteCol) thDeleteCol.style.display = 'none';
               
               const cardTitle = document.querySelector('[data-section="pembayaran"] .card-title');
               const cardSub = document.querySelector('[data-section="pembayaran"] .card-subtitle');
               if (cardTitle) cardTitle.innerText = "Riwayat Pemesanan";
               if (cardSub) cardSub.innerText = "Daftar pemesanan lapangan Anda";
            }
            
            // Sembunyikan menu navigasi
            document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
              if (isAdmin && (item.innerText.includes('Riwayat') || item.innerText.includes('Booking Lapangan'))) {
                 item.style.display = 'none';
              }
              if (!isAdmin && item.innerText.includes('Pembayaran')) {
                item.style.display = 'none';
              }
            });
            function updateTime() {
              const dateElement = document.querySelector('.topbar-date');
              const now = new Date();
              const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' };
              dateElement.textContent = now.toLocaleDateString('id-ID', options).replace(/\./g, ':');
            }
            // Update time immediately and then every second
            updateTime();
            setInterval(updateTime, 1000);
            function showSection(tabName) {
              const allSections = document.querySelectorAll('[data-section]');
              if (tabName === 'Overview' || tabName === 'Dashboard') {
                allSections.forEach(sec => {
                  if (sec.dataset.section === 'booking-lapangan') {
                    sec.style.display = 'none';
                  } else if (!isAdmin && (sec.dataset.section === 'analitik' || sec.dataset.section === 'pembayaran' || sec.dataset.section === 'member' || sec.dataset.section === 'laporan')) {
                    sec.style.display = 'none';
                  } else {
                    sec.style.display = '';
                  }
                });
                const bottomGrid = document.querySelector('.bottom-grid');
                if (bottomGrid) {
                  const hasVisibleBottom = Array.from(bottomGrid.querySelectorAll('[data-section]')).some(c => c.style.display !== 'none');
                  bottomGrid.style.display = hasVisibleBottom ? 'grid' : 'none';
                }
                const dashboardNav = Array.from(document.querySelectorAll('.sidebar-nav .nav-item')).find(t => t.innerText.includes('Dashboard'));
                if (dashboardNav) dashboardNav.classList.add('active');
              } else {
                allSections.forEach(sec => sec.style.display = 'none');
                let targetSections = [];
                if (tabName.includes('Booking Lapangan')) targetSections = ['booking-lapangan'];
                else if (tabName.includes('Pembayaran') || tabName.includes('Riwayat')) targetSections = ['pembayaran'];
                else if (tabName.includes('Log Aktivitas')) { targetSections = ['riwayat']; fetchAndRenderHistory(); }
                else if (tabName.includes('Member') || tabName.includes('Membership') || tabName.includes('Data Lapangan')) targetSections = ['member'];
                else if (tabName.includes('Laporan Kondisi')) targetSections = ['laporan'];
                else if (tabName.includes('Analitik')) targetSections = ['analitik'];
                
                targetSections.forEach(ts => {
                  document.querySelectorAll(`[data-section="${ts}"]`).forEach(sec => sec.style.display = '');
                });
                
                // For contentGrid, let CSS flex apply if it's shown
                const contentGrid = document.querySelector('.content-grid');
                if(contentGrid && contentGrid.style.display !== 'none') {
                  contentGrid.style.display = 'flex';
                }
                
                const bottomGrid = document.querySelector('.bottom-grid');
                if(bottomGrid) {
                  const hasVisibleBottom = Array.from(bottomGrid.querySelectorAll('[data-section]')).some(c => c.style.display !== 'none');
                  bottomGrid.style.display = hasVisibleBottom ? 'grid' : 'none';
                }
              }
            }
            // 1. Sidebar Navigation Toggle
            const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
            navItems.forEach(item => {
              item.addEventListener('click', (e) => {
                e.preventDefault();
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                const text = item.innerText.trim();
                showSection(text);
              });
            });
            // 4. Booking Calculation
            const startTimeSelect = document.querySelectorAll('.time-row select')[0];
            const endTimeSelect = document.querySelectorAll('.time-row select')[1];
            const courtSelect = document.querySelector('.booking-panel select');
            const priceSummaryRows = document.querySelectorAll('.price-row');
            const priceRowTotal = document.querySelector('.price-total-val');
            
            // Generate Landscape Schedules
            const scheduleDateInput = document.getElementById('scheduleDateInput');
            if(!scheduleDateInput.value) {
              const today = new Date();
              scheduleDateInput.value = today.toISOString().split('T')[0];
            }
            
            // State variables
            let bookingState = {};
            let transactionState = [];

            async function fetchAndRenderHistory() {
              try {
                const res = await fetch('/api/history');
                if(!res.ok) return;
                const historyData = await res.json();
                const tbody = document.getElementById('historyTableBody');
                if(!tbody) return;
                let html = '';
                historyData.forEach(h => {
                  const d = new Date(h.created_at);
                  const timeStr = d.toLocaleDateString('id-ID') + ' ' + d.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'});
                  html += `
                    <tr>
                      <td style="font-size:13px; color:var(--gray-muted)">${timeStr}</td>
                      <td style="font-weight:600">${h.user_name}</td>
                      <td style="font-weight:600; color:var(--blue)">${h.action}</td>
                      <td style="font-size:13px">${h.description}</td>
                    </tr>
                  `;
                });
                if(historyData.length === 0) {
                  html = `<tr><td colspan="4" style="text-align:center;color:var(--gray-muted)">Belum ada riwayat aktivitas.</td></tr>`;
                }
                tbody.innerHTML = html;
              } catch(e) { console.error('Fetch history error', e); }
            }

            async function fetchState() {
              try {
                const res = await fetch('/api/transactions');
                if (res.ok) {
                  transactionState = await res.json();
                  bookingState = {};
                  transactionState.forEach(trx => {
                    if (trx.status === 'Pending' || trx.status === 'Lunas') {
                      const sHour = parseInt(trx.startVal.split(':')[0]);
                      const eHour = parseInt(trx.endVal.split(':')[0]);
                      const mark = trx.status === 'Lunas' ? (trx.dateStr.includes('s/d') ? 'Member' : 'Terisi') : 'Pending';
                      
                      if (trx.dateStr.includes('s/d')) {
                        const startDateStr = trx.dateStr.split(' s/d ')[0];
                        let [y, m, dNum] = startDateStr.split('-');
                        let d = new Date(y, m-1, dNum);
                        for (let j=0; j<4; j++) {
                          const offset = d.getTimezoneOffset();
                          const dateLocal = new Date(d.getTime() - (offset*60*1000));
                          const curDateStr = dateLocal.toISOString().split('T')[0];
                          if (!bookingState[curDateStr]) bookingState[curDateStr] = {};
                          if (!bookingState[curDateStr][trx.court]) bookingState[curDateStr][trx.court] = {};
                          for (let i = sHour; i < eHour; i++) {
                            const hStr = (i < 10 ? '0' : '') + i + ':00';
                            bookingState[curDateStr][trx.court][hStr] = mark;
                          }
                          d.setDate(d.getDate() + 7);
                        }
                      } else {
                        if (!bookingState[trx.dateStr]) bookingState[trx.dateStr] = {};
                        if (!bookingState[trx.dateStr][trx.court]) bookingState[trx.dateStr][trx.court] = {};
                        for (let i = sHour; i < eHour; i++) {
                          const hStr = (i < 10 ? '0' : '') + i + ':00';
                          bookingState[trx.dateStr][trx.court][hStr] = mark;
                        }
                      }
                    }
                  });
                }
              } catch (e) {}
            }
            
            function getSelectedDate() {
              return scheduleDateInput.value;
            }
            

            
            const container = document.getElementById('landscapeSchedulesContainer');
            const courts = [1, 2, 3];
            const hours = [];
            for (let i = 8; i <= 21; i++) {
              hours.push(i < 10 ? "0" + i + ":00" : i + ":00");
            }
            
            function renderLandscapeGrid() {
              const dateStr = getSelectedDate();
              if(!bookingState[dateStr]) bookingState[dateStr] = {};
              
              container.innerHTML = ''; // clear old grid
              
              courts.forEach(courtId => {
                const scheduleWrap = document.createElement('div');
                scheduleWrap.className = 'landscape-grid';
                scheduleWrap.id = 'court-schedule-' + courtId;
                
                // Show court based on active tab
                const activeTab = document.querySelector('.court-tab.active');
                const activeCourtId = activeTab ? activeTab.dataset.court : "1";
                scheduleWrap.style.display = (courtId.toString() === activeCourtId) ? 'grid' : 'none';
                
                if(!bookingState[dateStr][courtId]) bookingState[dateStr][courtId] = {};
                
                hours.forEach(hour => {
                  const card = document.createElement('div');
                  card.className = 'time-card';
                  card.dataset.time = hour;
                  card.dataset.court = courtId;
                  
                  const status = bookingState[dateStr][courtId][hour] || 'Tersedia';
                  card.innerHTML = `<div class="time-val">${hour}</div><div class="time-status">${status}</div>`;
                  
                  if (status === 'Pending') {
                    card.className = 'time-card pending';
                    card.querySelector('.time-status').innerHTML = 'Pending';
                    card.style.pointerEvents = 'none';
                    card.style.borderColor = '#faad14';
                    card.style.background = '#fffbe6';
                  } else if (status === 'Terisi') {
                    card.className = 'time-card';
                    card.querySelector('.time-status').innerHTML = 'Terisi';
                    card.style.pointerEvents = 'none';
                    card.style.borderColor = '#ddd';
                    card.style.background = '#f0f0f0';
                    card.style.color = '#999';
                    card.querySelector('.time-val').style.color = '#999';
                  } else if (status === 'Member') {
                    card.className = 'time-card member';
                    card.querySelector('.time-status').innerHTML = 'Member';
                    card.style.pointerEvents = 'none';
                    card.style.borderColor = 'var(--blue-mid)';
                    card.style.background = 'var(--blue-pale)';
                    card.style.color = 'var(--blue-dim)';
                    card.querySelector('.time-val').style.color = 'var(--blue-dim)';
                  } else {
                    card.addEventListener('click', () => {
                      document.querySelectorAll('.time-card:not(.pending):not([style*="pointer-events: none"])').forEach(c => {
                        c.classList.remove('selected');
                        c.querySelector('.time-status').innerHTML = 'Tersedia';
                      });
                      card.classList.add('selected');
                      card.querySelector('.time-status').innerHTML = 'Pilih';
                      
                      const courtName = `Lapangan ${courtId}`;
                      Array.from(courtSelect.options).forEach(opt => {
                        if (opt.text.includes(courtName)) opt.selected = true;
                      });
                      Array.from(startTimeSelect.options).forEach(opt => {
                        if (opt.value === hour) opt.selected = true;
                      });
                      
                      let endHourNum = parseInt(hour.split(':')[0]) + 2;
                      if (endHourNum >= 24) endHourNum = endHourNum % 24;
                      let endTimeStr = (endHourNum < 10 ? '0' : '') + endHourNum + ':00';
                      let foundEnd = false;
                      Array.from(endTimeSelect.options).forEach(opt => {
                        if (opt.value === endTimeStr) { opt.selected = true; foundEnd = true; }
                      });
                      if (!foundEnd) endTimeSelect.selectedIndex = endTimeSelect.options.length - 1;
                      
                      const bookingPanel = document.getElementById('bookingPanel');
                      const backdrop = document.getElementById('bookingBackdrop');
                      if (bookingPanel && backdrop) {
                        backdrop.style.display = 'block';
                        bookingPanel.style.display = 'block';
                        calculatePrice();
                        bookingPanel.style.transform = 'translate(-50%, -50%) scale(1.02)';
                        bookingPanel.style.transition = 'transform 0.2s';
                        setTimeout(() => { bookingPanel.style.transform = 'translate(-50%, -50%) scale(1)'; }, 200);
                      }
                    });
                  }
                  scheduleWrap.appendChild(card);
                });
                container.appendChild(scheduleWrap);
              });
            }
            
            scheduleDateInput.addEventListener('change', () => {
              renderLandscapeGrid();
            });

            // Close Booking Modal
            const closeBookingModal = () => {
              const bookingPanel = document.getElementById('bookingPanel');
              const backdrop = document.getElementById('bookingBackdrop');
              if (bookingPanel && backdrop) {
                bookingPanel.style.display = 'none';
                backdrop.style.display = 'none';
              }
              renderLandscapeGrid(); // re-render to remove selection
            };

            const closeBtn = document.getElementById('closeBookingBtn');
            const backdrop = document.getElementById('bookingBackdrop');
            if (closeBtn) closeBtn.addEventListener('click', closeBookingModal);
            if (backdrop) backdrop.addEventListener('click', closeBookingModal);

            // 3. Court Tabs Toggle
            const courtTabs = document.querySelectorAll('.court-tab');
            courtTabs.forEach(tab => {
              tab.addEventListener('click', () => {
                courtTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const selectedCourt = tab.dataset.court;
                courts.forEach(courtId => {
                  const el = document.getElementById('court-schedule-' + courtId);
                  if (el) {
                    el.style.display = (courtId.toString() === selectedCourt) ? 'grid' : 'none';
                  }
                });
                
                const courtName = `Lapangan ${selectedCourt}`;
                Array.from(courtSelect.options).forEach(opt => {
                  if (opt.text.includes(courtName)) opt.selected = true;
                });
                courtSelect.dispatchEvent(new Event('change'));
              });
            });
            function calculatePrice() {
              // Parse hours
              const startHour = parseInt(startTimeSelect.value.split(':')[0]);
              let endHour = parseInt(endTimeSelect.value.split(':')[0]);
              // Ensure end time is after start time
              if (endHour <= startHour) {
                endHour = startHour + 2; // Default to 2 hours
                // Update select UI if the option exists
                Array.from(endTimeSelect.options).forEach(opt => {
                  if (parseInt(opt.value.split(':')[0]) === endHour) {
                    opt.selected = true;
                  }
                });
                // If the option didn't exist and we couldn't select it, just fallback the duration calculation
                if (parseInt(endTimeSelect.value.split(':')[0]) !== endHour) {
                  endHour = parseInt(endTimeSelect.options[endTimeSelect.options.length - 1].value.split(':')[0]);
                  endTimeSelect.options[endTimeSelect.options.length - 1].selected = true;
                }
              }
              let duration = endHour - startHour;
              if (duration < 1) duration = 1;
              const pricePerHour = 50000;
              const subtotal = duration * pricePerHour;
              const total = subtotal;
              // Update UI texts
              const courtName = courtSelect.value.split('â€”')[0].trim();
              priceSummaryRows[0].innerHTML = `<span>${courtName} · ${duration} jam</span><span>Rp ${subtotal.toLocaleString('id-ID')}</span>`;
              priceSummaryRows[1].innerHTML = `<span>Tarif/jam</span><span>Rp ${pricePerHour.toLocaleString('id-ID')}</span>`;
              priceRowTotal.innerText = `Rp ${total.toLocaleString('id-ID')}`;
            }
            startTimeSelect.addEventListener('change', calculatePrice);
            endTimeSelect.addEventListener('change', calculatePrice);
            courtSelect.addEventListener('change', calculatePrice);
            // Initial calculation on load
            calculatePrice();
            // --- INTERAKTIVITAS TAMBAHAN ---
            // 1. Tombol Topbar "Booking Manual"
            const btnBookingManual = document.querySelector('.topbar-right .btn-primary');
            if (btnBookingManual) {
              if (isAdmin) btnBookingManual.style.display = 'none';
              btnBookingManual.addEventListener('click', () => {
                showSection('Booking Lapangan');
                const bookingPanel = document.querySelector('.booking-panel');
                if (bookingPanel) bookingPanel.scrollIntoView({ behavior: 'smooth' });
              });
            }
            // 2. Tombol Konfirmasi & Bayar
            const btnKonfirmasi = document.querySelector('.booking-panel .btn-primary');
            if (btnKonfirmasi) {
              btnKonfirmasi.addEventListener('click', async () => {
                const courtVal = courtSelect.value;
                const startVal = startTimeSelect.value;
                const endVal = endTimeSelect.value;
                const totalVal = priceRowTotal.textContent;
                const courtMatch = courtVal.match(/Lapangan (\d+)/);
                const col = courtMatch ? parseInt(courtMatch[1]) : 1;
                const startHour = parseInt(startVal.split(':')[0]);
                const endHour = parseInt(endVal.split(':')[0]);
                if (endHour <= startHour) {
                  alert('Jam Selesai harus lebih besar dari Jam Mulai!');
                  return;
                }
                
                let duration = endHour - startHour;
                
                const dateStr = getSelectedDate();
                const currentUser = localStorage.getItem('userName') || 'Tamu';
                
                let existingDuration = 0;
                transactionState.forEach(trx => {
                  if (trx.userName === currentUser && trx.dateStr === dateStr && trx.status !== 'Ditolak') {
                    const tStart = parseInt(trx.startVal.split(':')[0]);
                    const tEnd = parseInt(trx.endVal.split(':')[0]);
                    if (!isNaN(tStart) && !isNaN(tEnd)) {
                      existingDuration += (tEnd - tStart);
                    }
                  }
                });

                if (existingDuration + duration > 4) {
                  alert(`Maaf, Anda sudah booking ${existingDuration} jam untuk hari ini. Batas maksimal kuota booking adalah 4 jam per hari.`);
                  return;
                }
                
                // Cek apakah jam bertabrakan (overlap)
                let isOverlap = false;
                for (let i = 0; i < duration; i++) {
                  const currentHourNum = startHour + i;
                  const currentHourStr = (currentHourNum < 10 ? '0' : '') + currentHourNum + ':00';
                  if (bookingState[dateStr] && bookingState[dateStr][col] && (bookingState[dateStr][col][currentHourStr] === 'Pending' || bookingState[dateStr][col][currentHourStr] === 'Terisi')) {
                    isOverlap = true;
                  }
                }
                
                if (isOverlap) {
                  alert('Maaf, salah satu jam yang dipilih sudah tidak tersedia.');
                  return;
                }
                
                // Update State Booking
                if(!bookingState[dateStr]) bookingState[dateStr] = {};
                if(!bookingState[dateStr][col]) bookingState[dateStr][col] = {};
                for (let i = 0; i < duration; i++) {
                  const currentHourNum = startHour + i;
                  const currentHourStr = (currentHourNum < 10 ? '0' : '') + currentHourNum + ':00';
                  bookingState[dateStr][col][currentHourStr] = 'Pending';
                }
                
                // Update State Transaksi
                const trxId = Date.now().toString();
                const userNameDisplay = localStorage.getItem('userName') || 'Tamu';
                const paymentMethodInput = document.getElementById('paymentMethodSelect');
                const paymentMethod = paymentMethodInput ? paymentMethodInput.value : 'QRIS';

                let paymentProofBase64 = null;
                if (!paymentMethod.includes('Tunai')) {
                  const proofInput = document.querySelector('#paymentMethodSelect').parentNode.querySelector('input[type="file"]');
                  if (!proofInput || !proofInput.files || proofInput.files.length === 0) {
                    alert('Kirimkan bukti pembayarannya terlebih dahulu sebelum menekan konfirmasi!');
                    return;
                  }
                  const file = proofInput.files[0];
                  paymentProofBase64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                  });
                }

                const newTrx = {
                  id: trxId,
                  userName: userNameDisplay,
                  phone: localStorage.getItem('userPhone_' + userNameDisplay) || localStorage.getItem('userPhone') || '081234567890',
                  court: col,
                  dateStr: dateStr,
                  startVal: startVal,
                  endVal: endVal,
                  totalVal: totalVal,
                  paymentMethod: paymentMethod,
                  paymentProof: paymentProofBase64,
                  status: 'Pending'
                };
                
                fetch('/api/transactions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newTrx)
                }).then(async (res) => {
                  if (!res.ok) throw new Error("Server Error");
                  alert(`Booking berhasil untuk ${courtVal} jam ${startVal} - ${endVal}.\nTotal: ${totalVal}\nStatus: Pending (Menunggu Pembayaran).`);
                  closeBookingModal();
                  await fetchState();
                  renderTransactions();
                  renderLandscapeGrid();
                }).catch(err => {
                  console.error(err);
                  alert('Gagal melakukan booking. Pastikan server berjalan dengan baik.');
                });
              });
            }
            
            // 3. Fungsi Render Transaksi & Event (Konfirmasi / Tolak)
            let showAllTransactions = false;
            async function renderTransactions() {
              await fetchState();
              const tbody = document.getElementById('transactionTableBody');
              if(!tbody) return;
              tbody.innerHTML = '';
              const currentUser = localStorage.getItem('userName') || 'Tamu';
              let filteredTransactions = isAdmin ? transactionState : transactionState.filter(trx => trx.userName === currentUser);
              
              if (!showAllTransactions) {
                filteredTransactions = filteredTransactions.slice(0, 3);
              }
              
              filteredTransactions.forEach(trx => {
                 const tr = document.createElement('tr');
                 tr.dataset.id = trx.id;
                 const badgeClass = trx.status === 'Lunas' ? 'badge-blue' : (trx.status === 'Dibatalkan' ? 'badge-red' : 'badge-amber');
                 
                 let actionHtml = '';
                 const proofBtnHtml = (isAdmin && trx.paymentProof) ? 
                     `<button class="btn btn-outline btn-sm btn-trx-proof" style="padding: 4px 8px; border-color: var(--blue-mid); color: var(--blue-mid);" title="Lihat Bukti Pembayaran">Bukti</button>` : '';

                 if (trx.status === 'Pending') {
                   actionHtml = isAdmin ? 
                     `<button class="btn btn-primary btn-sm btn-trx-confirm">Konfirmasi</button>
                      <button class="btn btn-outline btn-sm btn-trx-reject">Tolak</button>
                      ${proofBtnHtml}` : 
                     `<button class="btn btn-outline btn-sm" disabled>Menunggu Verifikasi</button>`;
                 } else if (trx.status === 'Lunas') {
                   actionHtml = `<button class="btn btn-outline btn-sm btn-trx-estruk">E-Struk</button> ${proofBtnHtml}`;
                 } else {
                   actionHtml = `<button class="btn btn-outline btn-sm" disabled>Dibatalkan</button> ${proofBtnHtml}`;
                 }
                 
                 tr.innerHTML = `
                  <td style="text-align: center; ${!isAdmin ? 'display:none;' : ''}">
                    <button class="btn-row-delete" data-id="${trx.id}" style="display:none; color: #ef4444; background: none; border: none; font-weight: bold; font-size: 16px; cursor: pointer;" title="Hapus Permanen">🗑</button>
                  </td>
                  <td>
                    <div style="font-weight:600">${trx.userName}</div>
                    <div style="font-size:11px;color:var(--gray-muted)">${trx.phone.includes('xxxx') ? (localStorage.getItem('userPhone_' + trx.userName) || localStorage.getItem('userPhone') || '081234567890') : trx.phone}</div>
                  </td>
                  <td>${trx.dateStr.includes('s/d') ? 'Membership Lap. ' + trx.court : 'Lap. ' + trx.court}</td>
                  <td>${trx.dateStr} · ${trx.startVal} - ${trx.endVal}</td>
                  <td style="font-weight:600">Rp ${Number(trx.totalVal).toLocaleString('id-ID')}</td>
                  <td><span class="badge ${badgeClass}">${trx.status}</span></td>
                  <td>
                    <div class="action-btns">
                      ${actionHtml}
                    </div>
                  </td>
                 `;
                 tbody.appendChild(tr);
              });
              
              
              updateAnalytics();
              attachTransactionEvents();
              attachModernDeleteEvents();
              
              const btnLihatSemuaTransaksi = document.getElementById('btnLihatSemuaTransaksi');
              if (btnLihatSemuaTransaksi) {
                btnLihatSemuaTransaksi.innerText = showAllTransactions ? 'Lihat Lebih Sedikit' : 'Lihat Semua';
                const newBtn = btnLihatSemuaTransaksi.cloneNode(true);
                btnLihatSemuaTransaksi.parentNode.replaceChild(newBtn, btnLihatSemuaTransaksi);
                newBtn.addEventListener('click', () => {
                  showAllTransactions = !showAllTransactions;
                  renderTransactions();
                });
              }
            }
            
            function updateAnalytics() {
              const todayStr = getSelectedDate() || new Date().toISOString().split('T')[0];
              
              const todayObj = new Date(todayStr);
              const yesterdayObj = new Date(todayObj.getTime() - 86400000);
              const yesterdayStr = yesterdayObj.toISOString().split('T')[0];
              const currentMonthStr = todayStr.substring(0, 7);
              
              let bookingToday = 0;
              let revenueToday = 0;
              let bookingYesterday = 0;
              let revenueYesterday = 0;
              let revenueMonthly = 0;
              
              let activeMembers = 0;
              let pendingPayments = 0;
              
              const uniqueMembers = new Set();
              let membersThisMonth = 0;
              
              transactionState.forEach(trx => {
                if (trx.status === 'Pending') pendingPayments++;
                
                const isMembership = trx.dateStr.includes('s/d');

                if (isMembership && trx.status === 'Lunas') {
                  uniqueMembers.add(trx.userName);
                  if (trx.dateStr.startsWith(currentMonthStr)) {
                    membersThisMonth++;
                  }
                }
                
                if (trx.status === 'Lunas' && trx.dateStr.startsWith(currentMonthStr)) {
                  const nominal = Number(trx.totalVal) || 0;
                  revenueMonthly += nominal;
                }
                
                if ((trx.dateStr === todayStr || (isMembership && trx.dateStr.startsWith(todayStr))) && trx.status !== 'Dibatalkan') {
                  if (!isMembership) {
                    bookingToday++;
                    if (trx.status === 'Lunas') {
                      const nominal = Number(trx.totalVal) || 0;
                      revenueToday += nominal;
                    }
                  }
                }
                
                if ((trx.dateStr === yesterdayStr || (isMembership && trx.dateStr.startsWith(yesterdayStr))) && trx.status !== 'Dibatalkan') {
                  if (!isMembership) {
                    bookingYesterday++;
                    if (trx.status === 'Lunas') {
                      const nominal = Number(trx.totalVal) || 0;
                      revenueYesterday += nominal;
                    }
                  }
                }
              });
              
              activeMembers = uniqueMembers.size;
              
              let revenueText = `Rp 0`;
              if (revenueToday > 0) {
                if (revenueToday >= 1000000) {
                  revenueText = `Rp ${(revenueToday / 1000000).toLocaleString('id-ID', {minimumFractionDigits: 1, maximumFractionDigits: 1})}jt`;
                } else {
                  revenueText = `Rp ${revenueToday.toLocaleString('id-ID')}`;
                }
              }

              let revenueMonthlyText = `Rp 0`;
              if (revenueMonthly > 0) {
                if (revenueMonthly >= 1000000) {
                  revenueMonthlyText = `Rp ${(revenueMonthly / 1000000).toLocaleString('id-ID', {minimumFractionDigits: 1, maximumFractionDigits: 1})}jt`;
                } else {
                  revenueMonthlyText = `Rp ${revenueMonthly.toLocaleString('id-ID')}`;
                }
              }
              
              const statBooking = document.getElementById('stat-booking');
              const statRevenue = document.getElementById('stat-revenue');
              const statRevenueMonthly = document.getElementById('stat-revenue-monthly');
              const statMember = document.getElementById('stat-member');
              const statPending = document.getElementById('stat-pending');
              const paymentNavBadge = document.getElementById('paymentNavBadge');
              
              if (statBooking) statBooking.innerText = bookingToday;
              if (statRevenue) statRevenue.innerText = revenueText;
              if (statRevenueMonthly) statRevenueMonthly.innerText = revenueMonthlyText;
              if (statMember) statMember.innerText = activeMembers;
              if (statPending) statPending.innerText = pendingPayments;
              
              if (paymentNavBadge) {
                if (pendingPayments > 0) {
                  paymentNavBadge.style.display = 'inline-block';
                  paymentNavBadge.innerText = pendingPayments;
                } else {
                  paymentNavBadge.style.display = 'none';
                }
              }
              
              const getPercentageHtml = (todayVal, yesterdayVal) => {
                if (yesterdayVal === 0) {
                  return todayVal > 0 ? `<span class="stat-change up">+100%</span> vs kemarin` : `<span style="color:var(--gray-muted)">Tidak ada data kemarin</span>`;
                }
                const diff = todayVal - yesterdayVal;
                const perc = Math.round((diff / yesterdayVal) * 100);
                if (perc > 0) return `<span class="stat-change up">+${perc}%</span> vs kemarin`;
                if (perc < 0) return `<span class="stat-change" style="color:var(--red);background:var(--red-pale)">${perc}%</span> vs kemarin`;
                return `<span style="color:var(--gray-muted)">Sama dgn kemarin</span>`;
              };
              
              const statBookingSub = document.getElementById('stat-booking-sub');
              const statRevenueSub = document.getElementById('stat-revenue-sub');
              const statMemberSub = document.getElementById('stat-member-sub');
              
              if (statBookingSub) statBookingSub.innerHTML = getPercentageHtml(bookingToday, bookingYesterday);
              if (statRevenueSub) statRevenueSub.innerHTML = getPercentageHtml(revenueToday, revenueYesterday);
              if (statMemberSub) statMemberSub.innerHTML = `<span class="stat-change up">${membersThisMonth}</span> bulan ini`;
              
              updatePeakHours(todayStr);
              updateActiveMembers();
              updateRegularBookings(todayStr);
            }
            
            function updatePeakHours(todayStr) {
              const peakChartWrap = document.getElementById('peakChartWrap');
              const peakChartLabel = document.getElementById('peakChartLabel');
              if (!peakChartWrap || !peakChartLabel) return;
              
              const intervals = ['08', '10', '12', '14', '16', '18', '20', '22'];
              const capacities = {};
              intervals.forEach(inv => capacities[inv] = 0);
              
              if (bookingState[todayStr]) {
                 for (let court in bookingState[todayStr]) {
                    for (let hourStr in bookingState[todayStr][court]) {
                       const status = bookingState[todayStr][court][hourStr];
                       if (status === 'Terisi' || status === 'Pending' || status === 'Member') {
                          const hourNum = parseInt(hourStr.split(':')[0]);
                          let inv = hourNum % 2 === 0 ? hourNum : hourNum - 1;
                          if (inv < 8) inv = 8;
                          if (inv > 22) inv = 22;
                          const invStr = (inv < 10 ? '0' : '') + inv;
                          if (capacities[invStr] !== undefined) {
                             capacities[invStr]++;
                          }
                       }
                    }
                 }
              }
              
              let maxCapacity = 0;
              intervals.forEach(inv => {
                 if (capacities[inv] > maxCapacity) maxCapacity = capacities[inv];
              });
              
              let html = '';
              let peakIntervals = [];
              
              intervals.forEach(inv => {
                 const cap = capacities[inv];
                 const percentage = cap === 0 ? 5 : Math.round((cap / 6) * 100);
                 const isPeak = maxCapacity > 0 && cap === maxCapacity;
                 if (isPeak) peakIntervals.push(inv);
                 
                 const barClass = isPeak ? 'bar peak' : (cap > 0 ? 'bar active' : 'bar');
                 html += `
                  <div class="bar-col">
                    <div class="${barClass}" style="height:${percentage}%"></div>
                    <div class="bar-label">${inv}</div>
                  </div>
                 `;
              });
              
              peakChartWrap.innerHTML = html;
              
              if (maxCapacity > 0) {
                 const peakStart = peakIntervals[0];
                 const peakEnd = parseInt(peakIntervals[peakIntervals.length - 1]) + 2;
                 const peakEndStr = (peakEnd < 10 ? '0' : '') + peakEnd;
                 peakChartLabel.innerHTML = `Puncak: <strong style="color:var(--blue)">${peakStart}:00 - ${peakEndStr}:00</strong> &middot; ${maxCapacity} lapangan terisi`;
              } else {
                 peakChartLabel.innerHTML = `Belum ada jadwal terisi hari ini`;
              }
            }
            
            function updateActiveMembers() {
               const container = document.getElementById('activeMemberList');
               if (!container) return;
               
               let activeTrxs = transactionState.filter(trx => trx.dateStr.includes('s/d') && trx.status === 'Lunas');
               let uniqueMembers = [];
               let seen = new Set();
               for (let trx of activeTrxs) {
                  if (!seen.has(trx.userName)) {
                     seen.add(trx.userName);
                     uniqueMembers.push(trx);
                  }
               }
               
               if (uniqueMembers.length === 0) {
                 container.innerHTML = `<div style="padding:20px;text-align:center;color:var(--gray-muted)">Belum ada member aktif.</div>`;
                 return;
               }
               
               let html = '';
               const colors = ['var(--blue)', '#4a9de8', 'var(--amber)', 'var(--red)'];
               
               uniqueMembers.forEach((trx, i) => {
                  const initials = trx.userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                  const bgColor = colors[i % colors.length];
                  
                  let expiryStr = trx.dateStr;
                  let expiryColorStr = '';
                  let actionBtn = `<button class="btn btn-outline btn-sm btn-nonaktif-member" data-id="${trx.id}" style="color:var(--red);border-color:var(--red)">Nonaktif</button>`;
                  
                  if (trx.dateStr.includes('s/d')) {
                     const parts = trx.dateStr.split(' s/d ');
                     if (parts.length > 1) {
                        const expiryDate = new Date(parts[1]);
                        expiryStr = expiryDate.toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'});
                        const today = new Date();
                        const diffTime = expiryDate - today;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays <= 7 && diffDays > 0) {
                           expiryColorStr = `style="color:var(--red)"`;
                           actionBtn = `<button class="btn btn-outline btn-sm btn-perpanjang-member" data-id="${trx.id}">Perpanjang</button>`;
                        } else if (diffDays <= 0) {
                           expiryColorStr = `style="color:var(--gray-muted)"`;
                           actionBtn = `<button class="btn btn-outline btn-sm" disabled>Kedaluwarsa</button>`;
                        }
                     }
                  }
                  
                  html += `
                  <div class="member-card">
                    <div class="member-avatar" style="background:${bgColor}">${initials}</div>
                    <div>
                      <div class="member-name">${trx.userName}</div>
                      <div class="member-pkg">Member ${trx.court ? '(Lap ' + trx.court + ')' : ''}</div>
                      <div class="member-expiry" ${expiryColorStr}>Habis: ${expiryStr}</div>
                    </div>
                    <div class="member-actions">
                      ${actionBtn}
                    </div>
                  </div>
                  `;
               });
               
               container.innerHTML = html;

               // Attach event listeners for Nonaktif
               container.querySelectorAll('.btn-nonaktif-member').forEach(btn => {
                  btn.addEventListener('click', (e) => {
                     const trxId = e.target.dataset.id;
                     const trx = transactionState.find(t => t.id === trxId);
                     if (trx) {
                        if (confirm(`Apakah Anda yakin ingin menonaktifkan member ${trx.userName}? Jadwal booking untuk member ini akan kembali tersedia.`)) {
                           fetch('/api/transactions/' + trxId + '/status', {
                             method: 'PUT',
                             headers: { 'Content-Type': 'application/json' },
                             body: JSON.stringify({ status: 'Dibatalkan' })
                           }).then(async res => {
                             if(!res.ok) throw new Error("Server error");
                             alert(`Member ${trx.userName} telah dinonaktifkan.`);
                             await fetchState();
                             renderTransactions();
                             renderLandscapeGrid();
                           }).catch(e => {
                             console.error(e);
                             alert('Gagal menonaktifkan member.');
                           });
                        }
                     }
                  });
               });
            }

            function updateRegularBookings(todayStr) {
               const container = document.getElementById('regularBookingList');
               if (!container) return;
               
               let regTrxs = transactionState.filter(trx => !trx.dateStr.includes('s/d') && trx.status === 'Lunas' && trx.dateStr >= todayStr);
               
               if (regTrxs.length === 0) {
                 container.innerHTML = `<div style="padding:20px;text-align:center;color:var(--gray-muted)">Belum ada booking reguler aktif.</div>`;
                 return;
               }
               
               let html = '';
               const colors = ['var(--blue)', '#4a9de8', 'var(--amber)', 'var(--red)', '#2ecc71', '#9b59b6'];
               
               regTrxs.forEach((trx, i) => {
                  const initials = trx.userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                  const bgColor = colors[i % colors.length];
                  
                  html += `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding: 12px 16px; border-bottom: 1px solid var(--gray-border);">
                      <div style="display:flex; align-items:center; gap: 12px;">
                        <div style="width:36px;height:36px;border-radius:50%;background:${bgColor};color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">${initials}</div>
                        <div>
                          <div style="font-weight:600;font-size:14px;color:var(--gray-dark);">${trx.userName}</div>
                          <div style="font-size:12px;color:var(--gray-muted);">Lap. ${trx.court} | ${trx.dateStr}</div>
                        </div>
                      </div>
                      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
                        <span style="font-size: 13px; font-weight: 600; color: var(--blue-mid);">${trx.startVal} - ${trx.endVal}</span>
                        <span style="font-size: 11px; background: rgba(43,90,228,0.1); color: var(--blue); padding: 2px 8px; border-radius: 12px;">Reguler</span>
                      </div>
                    </div>
                  `;
               });
               
               container.innerHTML = html;
            }

            let deleteModeActive = false;
            function attachModernDeleteEvents() {
              const btnToggle = document.getElementById('btnToggleDeleteMode');
              const deleteBtns = document.querySelectorAll('.btn-row-delete');
              
              if (btnToggle) {
                const newBtn = btnToggle.cloneNode(true);
                btnToggle.parentNode.replaceChild(newBtn, btnToggle);
                newBtn.addEventListener('click', () => {
                  deleteModeActive = !deleteModeActive;
                  newBtn.style.color = deleteModeActive ? '#ef4444' : 'var(--gray-muted)';
                  const currentDeleteBtns = document.querySelectorAll('.btn-row-delete');
                  currentDeleteBtns.forEach(btn => {
                    btn.style.display = deleteModeActive ? 'inline-block' : 'none';
                  });
                });
              }
              
              deleteBtns.forEach(btn => {
                btn.addEventListener('click', async (e) => {
                  const trxId = e.target.dataset.id;
                  if (confirm('Apakah Anda yakin ingin menghapus data ini secara permanen dari sistem?')) {
                    try {
                      const res = await fetch('/api/transactions', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids: [trxId] })
                      });
                      if (!res.ok) throw new Error('Delete failed');
                      alert('Data berhasil dihapus.');
                      await fetchState();
                      renderTransactions();
                      renderLandscapeGrid();
                    } catch (err) {
                      console.error(err);
                      alert('Gagal menghapus data. Pastikan server sudah direstart agar sistem baru aktif.');
                    }
                  }
                });
              });
              
              // Apply current state
              if (deleteModeActive) {
                const updatedToggle = document.getElementById('btnToggleDeleteMode');
                if(updatedToggle) updatedToggle.style.color = '#ef4444';
                deleteBtns.forEach(b => b.style.display = 'inline-block');
              }
            }

            function attachTransactionEvents() {
              document.querySelectorAll('.btn-trx-proof').forEach(btn => {
                btn.addEventListener('click', (e) => {
                  const tr = e.target.closest('tr');
                  const trxId = tr.dataset.id;
                  const trx = transactionState.find(t => t.id === trxId);
                  if (trx && trx.paymentProof) {
                     const w = window.open("");
                     w.document.write(`<body style="margin:0;display:flex;justify-content:center;align-items:center;background:#222;"><img src="${trx.paymentProof}" style="max-width:100%;max-height:100vh;"/></body>`);
                  }
                });
              });

              document.querySelectorAll('.btn-trx-confirm').forEach(btn => {
                btn.addEventListener('click', (e) => {
                  const tr = e.target.closest('tr');
                  const trxId = tr.dataset.id;
                  const trx = transactionState.find(t => t.id === trxId);
                  if(trx) {
                    trx.status = 'Lunas';
                    
                    const sHour = parseInt(trx.startVal.split(':')[0]);
                    const eHour = parseInt(trx.endVal.split(':')[0]);
                    fetch('/api/transactions/' + trxId + '/status', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'Lunas' })
                    }).then(async res => {
                      if(!res.ok) throw new Error("Server error");
                      alert('Pembayaran terkonfirmasi!');
                      await fetchState();
                      renderTransactions();
                      renderLandscapeGrid();
                    }).catch(e => {
                      console.error(e);
                      alert('Gagal mengkonfirmasi pembayaran.');
                    });
                  }
                });
              });
              
              document.querySelectorAll('.btn-trx-reject').forEach(btn => {
                btn.addEventListener('click', (e) => {
                  const tr = e.target.closest('tr');
                  const trxId = tr.dataset.id;
                  const trx = transactionState.find(t => t.id === trxId);
                  if(trx) {
                    fetch('/api/transactions/' + trxId + '/status', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'Dibatalkan' })
                    }).then(async res => {
                      if(!res.ok) throw new Error("Server error");
                      alert('Pemesanan dibatalkan.');
                      await fetchState();
                      renderTransactions();
                      renderLandscapeGrid();
                    }).catch(e => {
                      console.error(e);
                      alert('Gagal membatalkan pemesanan.');
                    });
                  }
                });
              });
              
              document.querySelectorAll('.btn-trx-estruk').forEach(btn => {
                btn.addEventListener('click', (e) => {
                  const tr = e.target.closest('tr');
                  const trxId = tr.dataset.id;
                  const trx = transactionState.find(t => t.id === trxId);
                  if(trx) {
                    const shortId = trx.id.toString().substring(trx.id.length - 4);
                    document.querySelector('.receipt-id').innerHTML = '#BKG-2025-' + shortId;
                    
                    let formattedDate = '';
                    let titleLap = `Lapangan ${trx.court} Badminton`;
                    
                    if (trx.dateStr.includes('s/d')) {
                      titleLap = `Membership Lap. ${trx.court}`;
                      // Gunakan Member Hari Booking atau Member Hari (Nama Hari)
                      const startDateStr = trx.dateStr.split(' s/d ')[0];
                      const dayName = new Date(startDateStr).toLocaleDateString('id-ID', { weekday: 'long' });
                      formattedDate = `Member Hari ${dayName}`;
                    } else {
                      formattedDate = new Date(trx.dateStr).toLocaleDateString('id-ID', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                      });
                    }
                    
                    const receiptPaymentMethod = trx.paymentMethod || 'QRIS';
                    document.getElementById('receiptDetails').innerHTML = 
                      `${titleLap}<br>
                      ${formattedDate}<br>
                      ${trx.startVal} - ${trx.endVal} WIB<br>
                      ${receiptPaymentMethod} &middot; Rp ${Number(trx.totalVal).toLocaleString('id-ID')}`;
                      
                    document.getElementById('receiptId').innerHTML = '#BKG-2025-' + shortId;
                      
                    // Show receipt modal
                    const receiptModal = document.getElementById('receiptModal');
                    const receiptBackdrop = document.getElementById('receiptBackdrop');
                    if (receiptModal && receiptBackdrop) {
                      receiptBackdrop.style.display = 'block';
                      receiptModal.style.display = 'block';
                      receiptModal.style.transform = 'translate(-50%, -50%) scale(1.02)';
                      receiptModal.style.transition = 'transform 0.2s';
                      setTimeout(() => { receiptModal.style.transform = 'translate(-50%, -50%) scale(1)'; }, 200);
                    }
                  }
                });
              });
            }
            
            // 4. Sinkronisasi tab lapangan di jadwal dengan form booking
            courtTabs.forEach((tab, idx) => {
              tab.addEventListener('click', () => {
                const courtName = `Lapangan ${idx + 1}`;
                Array.from(courtSelect.options).forEach(opt => {
                  if (opt.text.includes(courtName)) opt.selected = true;
                });
                courtSelect.dispatchEvent(new Event('change'));
              });
            });
            
            // Initial view
            fetchState().then(() => {
              renderLandscapeGrid();
              renderTransactions();
              if (isAdmin) {
                // Cari tab analitik dan aktifkan
                const navs = document.querySelectorAll('.sidebar-nav .nav-item');
                navs.forEach(nav => nav.classList.remove('active'));
                navs.forEach(nav => {
                  if(nav.innerText.includes('Analitik')) {
                    nav.classList.add('active');
                    showSection('Analitik');
                  }
                });
              } else {
                showSection('Booking Lapangan');
              }
            });


            // 5. Membership Logic
            const btnBuyMember = document.querySelector('.btn-buy-member');
            const memberPanel = document.getElementById('memberPanel');
            const memberBackdrop = document.getElementById('memberBackdrop');
            const closeMemberBtn = document.getElementById('closeMemberBtn');

            if (btnBuyMember) {
              btnBuyMember.addEventListener('click', () => {
                if (memberPanel && memberBackdrop) {
                  memberBackdrop.style.display = 'block';
                  memberPanel.style.display = 'block';
                  memberPanel.style.transform = 'translate(-50%, -50%) scale(1.02)';
                  memberPanel.style.transition = 'transform 0.2s';
                  setTimeout(() => { memberPanel.style.transform = 'translate(-50%, -50%) scale(1)'; }, 200);
                }
              });
            }

            if (closeMemberBtn) {
              closeMemberBtn.addEventListener('click', () => {
                memberPanel.style.display = 'none';
                memberBackdrop.style.display = 'none';
              });
            }
            if (memberBackdrop) {
              memberBackdrop.addEventListener('click', () => {
                memberPanel.style.display = 'none';
                memberBackdrop.style.display = 'none';
              });
            }

            const receiptModal = document.getElementById('receiptModal');
            const receiptBackdrop = document.getElementById('receiptBackdrop');
            const btnCloseReceipt = document.getElementById('btnCloseReceipt');
            if (btnCloseReceipt) {
              btnCloseReceipt.addEventListener('click', () => {
                receiptModal.style.display = 'none';
                receiptBackdrop.style.display = 'none';
              });
            }
            if (receiptBackdrop) {
              receiptBackdrop.addEventListener('click', () => {
                receiptModal.style.display = 'none';
                receiptBackdrop.style.display = 'none';
              });
            }

            const btnConfirmMember = document.getElementById('btnConfirmMember');
            
            const memberDateInput = document.getElementById('memberDateInput');
            const memberDurationSelect = document.getElementById('memberDurationSelect');
            const memberStartTimeSelect = document.getElementById('memberStartTimeSelect');
            const memberEndTimeInput = document.getElementById('memberEndTimeInput');
            const memberPriceLabel = document.getElementById('memberPriceLabel');
            const memberPriceVal = document.getElementById('memberPriceVal');
            const memberDiscountVal = document.getElementById('memberDiscountVal');
            const memberPriceTotal = document.getElementById('memberPriceTotal');

            function updateMemberPriceAndEndTime() {
              if (!memberDurationSelect || !memberStartTimeSelect || !memberEndTimeInput) return;
              const duration = parseInt(memberDurationSelect.value) || 1;
              const startHour = parseInt(memberStartTimeSelect.value.split(':')[0]) || 18;
              let endHour = startHour + duration;
              if (endHour >= 24) endHour = endHour % 24;
              const endHourStr = (endHour < 10 ? '0' : '') + endHour + ':00';
              memberEndTimeInput.value = endHourStr;
              
              const price = duration * 200000;
              const discount = price * 0.05;
              const finalPrice = price - discount;
              
              const priceStr = 'Rp ' + price.toLocaleString('id-ID');
              const discountStr = '-Rp ' + discount.toLocaleString('id-ID');
              const finalPriceStr = 'Rp ' + finalPrice.toLocaleString('id-ID');
              
              if (memberPriceLabel) memberPriceLabel.innerText = `Paket Membership 1 Bulan (${duration} Jam/mgg)`;
              if (memberPriceVal) memberPriceVal.innerText = priceStr;
              if (memberDiscountVal) memberDiscountVal.innerText = discountStr;
              if (memberPriceTotal) memberPriceTotal.innerText = finalPriceStr;
            }

            if (memberDurationSelect) memberDurationSelect.addEventListener('change', updateMemberPriceAndEndTime);
            if (memberStartTimeSelect) memberStartTimeSelect.addEventListener('change', updateMemberPriceAndEndTime);
            
            // Call once initially to set the right defaults based on current selections
            updateMemberPriceAndEndTime();

            if (btnConfirmMember) {
              btnConfirmMember.addEventListener('click', async () => {
                const courtSelect = document.getElementById('memberCourtSelect');
                const dateVal = memberDateInput ? memberDateInput.value : '';
                
                if (!dateVal) {
                  alert('Pilih tanggal mulai terlebih dahulu!');
                  return;
                }
                
                const courtVal = courtSelect.value;
                const courtMatch = courtVal.match(/Lapangan (\d+)/);
                const col = courtMatch ? parseInt(courtMatch[1]) : 1;
                const duration = parseInt(memberDurationSelect.value);
                const startHour = parseInt(memberStartTimeSelect.value.split(':')[0]);
                const endHourStr = memberEndTimeInput.value;

                // Hitung 4 tanggal ke depan
                let targetDates = [];
                let [y, m, dNum] = dateVal.split('-');
                let d = new Date(y, m-1, dNum);
                
                for (let i = 0; i < 4; i++) {
                    const offset = d.getTimezoneOffset();
                    const dateLocal = new Date(d.getTime() - (offset*60*1000));
                    targetDates.push(dateLocal.toISOString().split('T')[0]);
                    d.setDate(d.getDate() + 7);
                }

                // Cek bentrok jadwal (Overlap) pada 4 tanggal tsb
                let isOverlap = false;
                for (let j = 0; j < targetDates.length; j++) {
                    let dateStr = targetDates[j];
                    for (let i = 0; i < duration; i++) {
                      const currentHourNum = startHour + i;
                      if (currentHourNum >= 24) continue;
                      const currentHourStr = (currentHourNum < 10 ? '0' : '') + currentHourNum + ':00';
                      if (bookingState[dateStr] && bookingState[dateStr][col] && 
                         (bookingState[dateStr][col][currentHourStr] === 'Pending' || bookingState[dateStr][col][currentHourStr] === 'Terisi' || bookingState[dateStr][col][currentHourStr] === 'Member')) {
                        isOverlap = true;
                      }
                    }
                }

                if (isOverlap) {
                  alert('Maaf, ada jadwal yang sudah terisi di rentang waktu 4 minggu tersebut. Silakan pilih tanggal atau jam lain.');
                  return;
                }

                // Tambahkan booking
                for (let j = 0; j < targetDates.length; j++) {
                    let dateStr = targetDates[j];
                    if(!bookingState[dateStr]) bookingState[dateStr] = {};
                    if(!bookingState[dateStr][col]) bookingState[dateStr][col] = {};
                    
                    for (let i = 0; i < duration; i++) {
                      const currentHourNum = startHour + i;
                      if (currentHourNum >= 24) continue;
                      const currentHourStr = (currentHourNum < 10 ? '0' : '') + currentHourNum + ':00';
                      bookingState[dateStr][col][currentHourStr] = 'Pending';
                    }
                }

                // Tambahkan entri transaksi
                const trxId = Date.now().toString();
                const userNameDisplay = localStorage.getItem('userName') || 'Tamu';
                const totalPriceStr = memberPriceTotal.innerText;
                const memberPaymentMethodInput = document.getElementById('memberPaymentMethodSelect');
                const paymentMethod = memberPaymentMethodInput ? memberPaymentMethodInput.value : 'QRIS';

                let paymentProofBase64 = null;
                if (!paymentMethod.includes('Tunai')) {
                  const proofInput = document.querySelector('#memberPaymentMethodSelect').parentNode.querySelector('input[type="file"]');
                  if (!proofInput || !proofInput.files || proofInput.files.length === 0) {
                    alert('Sistem memberitahu agar mengirimkan bukti pembayarannya terlebih dahulu sebelum menekan konfirmasi!');
                    return;
                  }
                  const file = proofInput.files[0];
                  paymentProofBase64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                  });
                }

                const newTrx = {
                  id: trxId,
                  userName: userNameDisplay,
                  phone: localStorage.getItem('userPhone_' + userNameDisplay) || localStorage.getItem('userPhone') || '081234567890',
                  court: col,
                  dateStr: targetDates[0] + ' s/d ' + targetDates[3],
                  startVal: memberStartTimeSelect.value,
                  endVal: endHourStr,
                  totalVal: totalPriceStr,
                  paymentMethod: paymentMethod,
                  paymentProof: paymentProofBase64,
                  status: 'Pending'
                };
                fetch('/api/transactions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newTrx)
                }).then(async (res) => {
                  if (!res.ok) throw new Error("Server Error");
                  alert(`Paket Membership berhasil dipesan!\nJadwal: ${memberStartTimeSelect.value} - ${endHourStr} WIB setiap minggu selama 1 bulan.\nTotal: ${totalPriceStr}\nMetode: ${paymentMethod}\nStatus: Pending (Menunggu Pembayaran)`);
                  memberPanel.style.display = 'none';
                  memberBackdrop.style.display = 'none';
                  await fetchState();
                  renderTransactions();
                  renderLandscapeGrid();
                }).catch(err => {
                  console.error(err);
                  alert('Gagal melakukan booking. Pastikan server berjalan dengan baik.');
                });
              });
            }



            // Mobile Sidebar Toggle
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            const appSidebar = document.getElementById('appSidebar');
            const sidebarBackdrop = document.getElementById('sidebarBackdrop');

            if (mobileMenuBtn && appSidebar && sidebarBackdrop) {
              function toggleSidebar() {
                appSidebar.classList.toggle('open');
                if (appSidebar.classList.contains('open')) {
                  sidebarBackdrop.style.display = 'block';
                  setTimeout(() => sidebarBackdrop.classList.add('show'), 10);
                } else {
                  sidebarBackdrop.classList.remove('show');
                  setTimeout(() => sidebarBackdrop.style.display = 'none', 300);
                }
              }

              mobileMenuBtn.addEventListener('click', toggleSidebar);
              sidebarBackdrop.addEventListener('click', toggleSidebar);
              
              // Auto-close sidebar on nav item click (mobile)
              document.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', () => {
                  if (window.innerWidth <= 768) {
                    toggleSidebar();
                  }
                });
              });
            }

            // Payment method details update
            document.querySelectorAll('#paymentMethodSelect, #memberPaymentMethodSelect').forEach(sel => {
               const updateDetails = (e) => {
                  const targetSel = e.target || sel;
                  const val = targetSel.value;
                  let detailsHtml = '';
                  let needsProof = true;
                  if(val.includes('BRI')) detailsHtml = 'No. Rekening: <b>004101027909538</b> a.n. Rizqi';
                  else if(val.includes('SeaBank')) detailsHtml = 'No. Rekening: <b>901650835809</b> a.n. Rifqi';
                  else if(val.includes('QRIS')) detailsHtml = 'Scan barcode QRIS di kasir atau pada lampiran E-Struk.';
                  else if(val.includes('Tunai')) { detailsHtml = 'Bayar langsung ke kasir GOR sebelum bermain.'; needsProof = false; }
                  else detailsHtml = 'Silakan lakukan pembayaran sesuai metode yang dipilih.';
                  
                  let wrapperDiv = targetSel.parentNode.querySelector('.payment-wrapper');
                  if(!wrapperDiv) {
                     wrapperDiv = document.createElement('div');
                     wrapperDiv.className = 'payment-wrapper';
                     wrapperDiv.style.display = 'flex';
                     wrapperDiv.style.flexDirection = 'column';
                     wrapperDiv.style.gap = '10px';
                     wrapperDiv.style.marginTop = '8px';
                     wrapperDiv.style.padding = '12px';
                     wrapperDiv.style.backgroundColor = 'var(--blue-pale)';
                     wrapperDiv.style.borderRadius = '6px';
                     targetSel.parentNode.appendChild(wrapperDiv);

                     let detailsDiv = document.createElement('div');
                     detailsDiv.className = 'payment-details';
                     detailsDiv.style.fontSize = '13px';
                     detailsDiv.style.color = 'var(--blue)';
                     wrapperDiv.appendChild(detailsDiv);

                     let proofDiv = document.createElement('div');
                     proofDiv.className = 'payment-proof';
                     proofDiv.innerHTML = `
                        <label style="font-size:12px; font-weight:600; margin-bottom:4px; display:block; color:var(--gray-mid)">Bukti pembayaran <span style="color:red">*</span></label>
                        <input type="file" class="form-control" style="padding: 6px; font-size:12px; height:auto; background: var(--white);" accept="image/*">
                        <div class="file-size-info" style="font-size: 11px; margin-top: 4px; color: var(--gray-muted);">Maksimal ukuran file yang disarankan adalah 5 MB.</div>
                     `;
                     wrapperDiv.appendChild(proofDiv);
                     
                     const fileInput = proofDiv.querySelector('input[type="file"]');
                     const sizeInfo = proofDiv.querySelector('.file-size-info');
                     fileInput.addEventListener('change', function() {
                        if (this.files && this.files[0]) {
                           const sizeInMB = (this.files[0].size / (1024 * 1024)).toFixed(2);
                           if (sizeInMB > 5) {
                              sizeInfo.innerHTML = `<span style="color: var(--red); font-weight: 600;">Ukuran file: ${sizeInMB} MB. Terlalu besar! Maksimal 5 MB.</span>`;
                              this.value = ''; // Reset input
                           } else {
                              sizeInfo.innerHTML = `<span style="color: green; font-weight: 600;">Ukuran file: ${sizeInMB} MB (Aman)</span>`;
                           }
                        } else {
                           sizeInfo.innerHTML = 'Maksimal ukuran file yang disarankan adalah 5 MB.';
                        }
                     });
                  }
                  
                  let detailsDiv = wrapperDiv.querySelector('.payment-details');
                  let proofDiv = wrapperDiv.querySelector('.payment-proof');
                  
                  detailsDiv.innerHTML = detailsHtml;
                  proofDiv.style.display = needsProof ? 'block' : 'none';
               };
               sel.addEventListener('change', updateDetails);
               updateDetails({target: sel}); // initial trigger
            });

            // Logout Logic
            const btnLogout = document.getElementById('btnLogout');
            if (btnLogout) {
               btnLogout.addEventListener('click', () => {
                  if(confirm('Apakah Anda yakin ingin keluar?')) {
                     localStorage.removeItem('currentUser');
                     localStorage.removeItem('userPhone');
                     window.location.href = 'login.html';
                  }
               });
            }

          });
        
