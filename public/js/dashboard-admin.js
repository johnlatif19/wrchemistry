document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('adminLogoutBtn');
    const navItems = document.querySelectorAll('.nav-item');
    const sectionTitle = document.getElementById('sectionTitle');
    const sectionContent = document.getElementById('sectionContent');

    const sectionTitles = {
        'dashboard': 'لوحة القيادة',
        'create-assignment': 'إنشاء واجب',
        'all-assignments': 'جميع الواجبات',
        'students': 'الطلاب',
        'correct-answers': 'الإجابات الصحيحة',
        'incorrect-answers': 'الإجابات الخاطئة',
        'essay-grading': 'تصحيح المقالات',
        'cheating': 'الغش',
        'statistics': 'الإحصائيات',
        'settings': 'الإعدادات'
    };

    const checkAuth = async () => {
        try {
            await ApiClient.get('/auth/verify-session');
            loadSection('dashboard');
        } catch (error) {
            window.location.href = 'login-admin.html';
        }
    };

    const loadSection = async (section) => {
        sectionContent.innerHTML = `
            <div class="loading-state">
                <span class="spinner"></span>
                <p>جاري التحميل...</p>
            </div>
        `;

        try {
            if (section === 'dashboard') {
                const data = await ApiClient.get('/admin/stats');
                sectionContent.innerHTML = `
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                        <div style="background: var(--bg-color); padding: 20px; border-radius: 8px; border: 1px solid var(--border);">
                            <h3 style="color: var(--text-muted); margin-bottom: 10px;">إجمالي الطلاب</h3>
                            <p style="font-size: 24px; font-weight: bold; color: var(--primary);">${data.totalStudents || 0}</p>
                        </div>
                        <div style="background: var(--bg-color); padding: 20px; border-radius: 8px; border: 1px solid var(--border);">
                            <h3 style="color: var(--text-muted); margin-bottom: 10px;">إجمالي الواجبات</h3>
                            <p style="font-size: 24px; font-weight: bold; color: var(--primary);">${data.totalAssignments || 0}</p>
                        </div>
                        <div style="background: var(--bg-color); padding: 20px; border-radius: 8px; border: 1px solid var(--border);">
                            <h3 style="color: var(--text-muted); margin-bottom: 10px;">التسليمات</h3>
                            <p style="font-size: 24px; font-weight: bold; color: var(--primary);">${data.totalSubmissions || 0}</p>
                        </div>
                        <div style="background: var(--bg-color); padding: 20px; border-radius: 8px; border: 1px solid var(--border);">
                            <h3 style="color: var(--text-muted); margin-bottom: 10px;">المقالات المعلقة</h3>
                            <p style="font-size: 24px; font-weight: bold; color: var(--warning);">${data.pendingEssays || 0}</p>
                        </div>
                    </div>
                `;
            } else {
                sectionContent.innerHTML = `
                    <div class="empty-state">
                        <p>قسم ${sectionTitles[section]} تحت التطوير حالياً.</p>
                    </div>
                `;
            }
        } catch (error) {
            sectionContent.innerHTML = `
                <div class="empty-state" style="border-color: var(--error);">
                    <p style="color: var(--error);">${error.message}</p>
                </div>
            `;
        }
    };

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            navItems.forEach(nav => nav.classList.remove('active'));
            e.target.classList.add('active');
            
            const section = e.target.dataset.section;
            sectionTitle.textContent = sectionTitles[section];
            loadSection(section);
        });
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await ApiClient.post('/auth/admin-logout');
                window.location.href = 'login-admin.html';
            } catch (error) {
                UI.showToast('حدث خطأ أثناء تسجيل الخروج', 'error');
            }
        });
    }

    checkAuth();
});