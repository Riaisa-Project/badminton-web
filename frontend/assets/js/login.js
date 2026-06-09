    function toggleForm(type) {
      const loginForm = document.getElementById('loginForm');
      const registerForm = document.getElementById('registerForm');
      const title = document.getElementById('formTitle');
      const subtitle = document.getElementById('formSubtitle');

      if (type === 'register') {
        loginForm.style.display = 'none';
        loginForm.classList.remove('fade-in');

        registerForm.style.display = 'block';
        void registerForm.offsetWidth; // trigger reflow
        registerForm.classList.add('fade-in');

        title.textContent = 'Daftar Akun Baru';
        subtitle.textContent = 'Lengkapi data diri untuk mulai booking';
      } else {
        registerForm.style.display = 'none';
        registerForm.classList.remove('fade-in');

        loginForm.style.display = 'block';
        void loginForm.offsetWidth; // trigger reflow
        loginForm.classList.add('fade-in');

        title.textContent = 'Selamat Datang';
        subtitle.textContent = 'Silakan masuk ke akun Anda';
      }
    }

    function togglePassword(inputId, btn) {
      const input = document.getElementById(inputId);
      if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
        btn.style.color = 'var(--blue)';
      } else {
        input.type = 'password';
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
        btn.style.color = 'var(--gray-mid)';
      }
    }

    async function handleLogin(e) {
      e.preventDefault();
      // Ambil input dari form
      const nameInput = document.querySelector('#loginForm input[type="text"]').value;
      const passInput = document.getElementById('loginPass').value;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: nameInput, password: passInput })
        });
        
        if (!res.ok) {
          const data = await res.json();
          alert(data.error || 'Login gagal!');
          return;
        }
        
        const user = await res.json();
        localStorage.setItem('userName', user.name);
        localStorage.setItem('userPhone', user.phone);
        localStorage.setItem('isAdmin', user.is_admin);
        
        window.location.href = 'booking_gor.html';
      } catch (err) {
        console.error(err);
        alert('Terjadi kesalahan pada server.');
      }
    }

    async function handleRegister(e) {
      e.preventDefault();
      const nameInput = document.querySelector('#registerForm input[type="text"]').value;
      const emailInput = document.querySelector('#registerForm input[type="email"]').value;
      const phoneInput = document.querySelector('#registerForm input[type="tel"]').value;
      const passInput = document.getElementById('regPass').value;
      
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: nameInput, email: emailInput, phone: phoneInput, password: passInput })
        });
        
        if (!res.ok) {
          const data = await res.json();
          alert(data.error || 'Pendaftaran gagal!');
          return;
        }
        
        alert('Akun berhasil dibuat! Silakan masuk dengan akun baru Anda.');
        toggleForm('login');
      } catch (err) {
        console.error(err);
        alert('Terjadi kesalahan pada server.');
      }
    }
  
