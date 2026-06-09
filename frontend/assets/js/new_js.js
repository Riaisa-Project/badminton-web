            // Generate Landscape Schedules
            const scheduleDateInput = document.getElementById('scheduleDateInput');
            if(!scheduleDateInput.value) {
              const today = new Date();
              scheduleDateInput.value = today.toISOString().split('T')[0];
            }
            
            // State variables
            let bookingState = {};
            let transactionState = [];
            
            function getSelectedDate() {
              return scheduleDateInput.value;
            }
            
            async function fetchState() {
              try {
                const res = await fetch('/api/transactions');
                if (!res.ok) throw new Error('Network response was not ok');
                const data = await res.json();
                transactionState = data;
                
                // Rebuild bookingState from transactions
                bookingState = {};
                transactionState.forEach(trx => {
                  if (trx.status === 'Pending' || trx.status === 'Lunas') {
                    if (!bookingState[trx.dateStr]) bookingState[trx.dateStr] = {};
                    if (!bookingState[trx.dateStr][trx.court]) bookingState[trx.dateStr][trx.court] = {};
                    
                    const sHour = parseInt(trx.startVal.split(':')[0]);
                    const eHour = parseInt(trx.endVal.split(':')[0]);
                    for (let i = sHour; i < eHour; i++) {
                      const hStr = (i < 10 ? '0' : '') + i + ':00';
                      bookingState[trx.dateStr][trx.court][hStr] = trx.status === 'Lunas' ? 'Terisi' : 'Pending';
                    }
                  }
                });
              } catch (err) {
                console.error('Error fetching state:', err);
              }
            }
            
            const container = document.getElementById('landscapeSchedulesContainer');
            const courts = [1, 2, 3];
            const hours = [];
            for (let i = 7; i <= 24; i++) {
              hours.push(i === 24 ? "00:00" : (i < 10 ? "0" + i + ":00" : i + ":00"));
            }
            
            function renderLandscapeGrid() {
              fetchState().then(() => {
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
                    card.querySelector('.time-status').innerHTML = '⏳ Pending';
                    card.style.pointerEvents = 'none';
                    card.style.borderColor = '#faad14';
                    card.style.background = '#fffbe6';
                  } else if (status === 'Terisi') {
                    card.className = 'time-card';
                    card.querySelector('.time-status').innerHTML = '🔒 Terisi';
                    card.style.pointerEvents = 'none';
                    card.style.borderColor = '#ddd';
                    card.style.background = '#f0f0f0';
                    card.style.color = '#999';
                    card.querySelector('.time-val').style.color = '#999';
                  } else {
                    card.addEventListener('click', () => {
                      document.querySelectorAll('.time-card:not(.pending):not([style*="pointer-events: none"])').forEach(c => {
                        c.classList.remove('selected');
                        c.querySelector('.time-status').innerHTML = 'Tersedia';
                      });
                      card.classList.add('selected');
                      card.querySelector('.time-status').innerHTML = '✓ Pilih';
                      
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
              const discount = isMember ? 10000 : 0; // Flat discount for member
              const total = subtotal - discount;
              // Update UI texts
              const courtName = courtSelect.value.split('—')[0].trim();
              priceSummaryRows[0].innerHTML = `<span>${courtName} · ${duration} jam</span><span>Rp ${subtotal.toLocaleString('id-ID')}</span>`;
              priceSummaryRows[1].innerHTML = `<span>Tarif/jam</span><span>Rp ${pricePerHour.toLocaleString('id-ID')}</span>`;
              if (isMember) {
                priceSummaryRows[2].style.display = 'flex';
                priceSummaryRows[2].innerHTML = `<span>Diskon Member</span><span style="color:var(--green-mid)">-Rp ${discount.toLocaleString('id-ID')}</span>`;
              } else {
                priceSummaryRows[2].style.display = 'none';
              }
              priceRowTotal.innerText = `Rp ${total.toLocaleString('id-ID')}`;
            }
            memberToggle.addEventListener('click', () => {
              isMember = !isMember;
              if (isMember) {
                toggleSwitch.classList.remove('off');
              } else {
                toggleSwitch.classList.add('off');
              }
              calculatePrice();
            });
            startTimeSelect.addEventListener('change', calculatePrice);
            endTimeSelect.addEventListener('change', calculatePrice);
            courtSelect.addEventListener('change', calculatePrice);
            // Initial calculation on load
            calculatePrice();
            // --- INTERAKTIVITAS TAMBAHAN ---
            // 1. Tombol Topbar "Booking Manual"
            const btnBookingManual = document.querySelector('.topbar-right .btn-primary');
            if (btnBookingManual) {
              btnBookingManual.addEventListener('click', () => {
                showSection('Booking Lapangan');
                const bookingPanel = document.querySelector('.booking-panel');
                if (bookingPanel) bookingPanel.scrollIntoView({ behavior: 'smooth' });
              });
            }
            // 2. Tombol Konfirmasi & Bayar
            const btnKonfirmasi = document.querySelector('.booking-panel .btn-primary');
            if (btnKonfirmasi) {
              btnKonfirmasi.addEventListener('click', () => {
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
                if (duration > 4) {
                  alert('Satu user hanya bisa booking maksimal 4 jam pada lapangan di hari yang sama!');
                  return;
                }
                
                const dateStr = getSelectedDate();
                
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
                const newTrx = {
                  id: trxId,
                  userName: userNameDisplay,
                  phone: localStorage.getItem('userPhone_' + userNameDisplay) || localStorage.getItem('userPhone') || '081234567890',
                  court: col,
                  dateStr: dateStr,
                  startVal: startVal,
                  endVal: endVal,
                  totalVal: totalVal,
                  status: 'Pending'
                };
                
                fetch('/api/transactions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newTrx)
                }).then(() => {
                  alert(`Booking berhasil untuk ${courtVal} jam ${startVal} - ${endVal}.\nTotal: ${totalVal}\nStatus: Pending (Menunggu Pembayaran).`);
                  closeBookingModal();
                  renderLandscapeGrid();
                  renderTransactions();
                }).catch(err => {
                  console.error(err);
                  alert('Gagal melakukan booking');
                });
              });
            }
            
            // 3. Fungsi Render Transaksi & Event (Konfirmasi / Tolak)
            function renderTransactions() {
              fetchState().then(() => {
                const tbody = document.getElementById('transactionTableBody');
                if(!tbody) return;
              tbody.innerHTML = '';
              transactionState.forEach(trx => {
                 const tr = document.createElement('tr');
                 tr.dataset.id = trx.id;
                 const badgeClass = trx.status === 'Lunas' ? 'badge-green' : (trx.status === 'Dibatalkan' ? 'badge-red' : 'badge-amber');
                 const actionHtml = trx.status === 'Pending' ? 
                   `<button class="btn btn-primary btn-sm btn-trx-confirm">Konfirmasi</button>
                    <button class="btn btn-outline btn-sm btn-trx-reject">Tolak</button>` : 
                   (trx.status === 'Lunas' ? `<button class="btn btn-outline btn-sm">E-Struk</button>` : `<button class="btn btn-outline btn-sm">Override</button>`);
                   
                 tr.innerHTML = `
                  <td>
                    <div style="font-weight:600">${trx.userName}</div>
                    <div style="font-size:11px;color:var(--gray-muted)">${trx.phone.includes('xxxx') ? (localStorage.getItem('userPhone_' + trx.userName) || localStorage.getItem('userPhone') || '081234567890') : trx.phone}</div>
                  </td>
                  <td>${trx.dateStr.includes('s/d') ? 'Membership Lap. ' + trx.court : 'Lap. ' + trx.court}</td>
                  <td>${trx.dateStr} · ${trx.startVal}–${trx.endVal}</td>
                  <td style="font-weight:600">${trx.totalVal}</td>
                  <td><span class="badge ${badgeClass}">${trx.status}</span></td>
                  <td>
                    <div class="action-btns">
                      ${actionHtml}
                    </div>
                  </td>
                 `;
                 tbody.appendChild(tr);
              });
              attachTransactionEvents();
            });
          }
            
            function attachTransactionEvents() {
              document.querySelectorAll('.btn-trx-confirm').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                  const tr = e.target.closest('tr');
                  const trxId = tr.dataset.id;
                  try {
                    await fetch(`/api/transactions/${trxId}/status`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'Lunas' })
                    });
                    renderTransactions();
                    renderLandscapeGrid(); // update grid just in case we are on the same date
                    alert('Pembayaran dikonfirmasi! Jadwal telah diperbarui menjadi Terisi.');
                  } catch (err) {
                    console.error(err);
                  }
                });
              });
              
              document.querySelectorAll('.btn-trx-reject').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                  const tr = e.target.closest('tr');
                  const trxId = tr.dataset.id;
                  try {
                    await fetch(`/api/transactions/${trxId}/status`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'Dibatalkan' })
                    });
                    renderTransactions();
                    renderLandscapeGrid();
                    alert('Pemesanan dibatalkan.');
                  } catch (err) {
                    console.error(err);
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
            renderLandscapeGrid();
            renderTransactions();
            showSection('Booking Lapangan');
