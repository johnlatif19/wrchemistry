document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const submitBtn = document.getElementById('submitBtn');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const forgotPasswordLink = document.getElementById('forgotPassword');

    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            UI.togglePasswordVisibility('password', togglePasswordBtn);
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            if (!email || !password) {
                UI.showToast('يرجى إدخال البريد الإلكتروني وكلمة المرور', 'error');
                return;
            }

            UI.setLoading(submitBtn, true);

            try {
                const response = await ApiClient.post('/auth/student-login', { email, password });
                
                UI.showToast('تم تسجيل الدخول بنجاح', 'success');
                setTimeout(() => {
                    window.location.href = 'homework.html';
                }, 1000);

            } catch (error) {
                UI.showToast(error.message, 'error');
                UI.setLoading(submitBtn, false);
            }
        });
    }

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            
            if (!email) {
                UI.showToast('أدخل بريدك الإلكتروني أولاً لإرسال رابط الاستعادة', 'error');
                return;
            }

            try {
                await ApiClient.post('/auth/forgot-password', { email });
                UI.showToast('تم إرسال رابط إعادة تعيين كلمة المرور لبريدك', 'success');
            } catch (error) {
                UI.showToast(error.message, 'error');
            }
        });
    }
});