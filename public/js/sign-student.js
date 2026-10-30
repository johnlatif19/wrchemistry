document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const submitBtn = document.getElementById('submitBtn');
    const togglePasswordBtn = document.getElementById('togglePassword');

    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            UI.togglePasswordVisibility('password', togglePasswordBtn);
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const fullName = document.getElementById('fullName').value.trim();
            const studentCode = document.getElementById('studentCode').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                UI.showToast('كلمتا المرور غير متطابقتين', 'error');
                return;
            }

            if (password.length < 8) {
                UI.showToast('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'error');
                return;
            }

            UI.setLoading(submitBtn, true);

            try {
                await ApiClient.post('/auth/student-register', {
                    fullName,
                    studentCode,
                    email,
                    phone,
                    password
                });

                UI.showToast('تم إنشاء الحساب بنجاح، جاري تحويلك...', 'success');
                setTimeout(() => {
                    window.location.href = 'homework.html';
                }, 1500);

            } catch (error) {
                UI.showToast(error.message, 'error');
                UI.setLoading(submitBtn, false);
            }
        });
    }
});