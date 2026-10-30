document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.getElementById('adminLoginForm');
    const submitBtn = document.getElementById('submitBtn');
    const togglePasswordBtn = document.getElementById('togglePassword');

    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            UI.togglePasswordVisibility('password', togglePasswordBtn);
        });
    }

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            if (!username || !password) {
                UI.showToast('يرجى إدخال اسم المستخدم وكلمة المرور', 'error');
                return;
            }

            UI.setLoading(submitBtn, true);

            try {
                const response = await ApiClient.post('/admin/auth/admin-login', { username, password });
                
                if (response.data && response.data.token) {
                    sessionStorage.setItem('admin_token', response.data.token);
                }

                UI.showToast('تم الدخول بنجاح', 'success');
                setTimeout(() => {
                    window.location.href = '/dashboard-admin';
                }, 1000);

            } catch (error) {
                UI.showToast(error.message, 'error');
                UI.setLoading(submitBtn, false);
            }
        });
    }
});
