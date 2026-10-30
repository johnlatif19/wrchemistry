document.addEventListener('DOMContentLoaded', () => {
    const userNameDisplay = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');
    const navItems = document.querySelectorAll('.nav-item');
    const assignmentsGrid = document.getElementById('assignmentsGrid');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const errorState = document.getElementById('errorState');
    const retryBtn = document.getElementById('retryBtn');

    let currentTab = 'available';

    const checkAuth = async () => {
        try {
            const user = await ApiClient.get('/students/me');
            userNameDisplay.textContent = user.fullName;
            loadAssignments(currentTab);
        } catch (error) {
            window.location.href = 'login-student.html';
        }
    };

    const loadAssignments = async (tab) => {
        loadingState.classList.remove('hidden');
        assignmentsGrid.classList.add('hidden');
        emptyState.classList.add('hidden');
        errorState.classList.add('hidden');

        try {
            const data = await ApiClient.get(`/assignments?status=${tab}`);
            
            loadingState.classList.add('hidden');

            if (!data.assignments || data.assignments.length === 0) {
                emptyState.classList.remove('hidden');
                return;
            }

            assignmentsGrid.innerHTML = '';
            data.assignments.forEach(assignment => {
                const card = document.createElement('div');
                card.className = 'assignment-card';
                card.innerHTML = `
                    <h3>${assignment.title}</h3>
                    <p>${assignment.description || 'لا يوجد وصف'}</p>
                    <div class="card-footer">
                        <span class="deadline">ينتهي: ${new Date(assignment.endDate).toLocaleDateString('ar-EG')}</span>
                        <button class="btn-secondary start-btn">ابدأ</button>
                    </div>
                `;
                
                card.querySelector('.start-btn').addEventListener('click', () => {
                    window.location.href = `exam.html?id=${assignment.id}`;
                });

                assignmentsGrid.appendChild(card);
            });
            
            assignmentsGrid.classList.remove('hidden');

        } catch (error) {
            loadingState.classList.add('hidden');
            errorState.classList.remove('hidden');
            document.getElementById('errorMessage').textContent = error.message;
        }
    };

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            navItems.forEach(nav => nav.classList.remove('active'));
            e.target.classList.add('active');
            currentTab = e.target.dataset.tab;
            loadAssignments(currentTab);
        });
    });

    retryBtn.addEventListener('click', () => loadAssignments(currentTab));

    logoutBtn.addEventListener('click', async () => {
        try {
            await ApiClient.post('/auth/student-logout');
            window.location.href = 'login-student.html';
        } catch (error) {
            UI.showToast('حدث خطأ أثناء تسجيل الخروج', 'error');
        }
    });

    checkAuth();
});