document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('adminLogoutBtn');
    const navItems = document.querySelectorAll('.nav-item');
    const sectionTitle = document.getElementById('sectionTitle');
    const sectionContent = document.getElementById('sectionContent');

    const sectionTitles = {
        'dashboard': 'لوحة القيادة',
        'all-assignments': 'جميع الواجبات',
        'students': 'الطلاب',
        'correct-answers': 'الإجابات الصحيحة',
        'incorrect-answers': 'الإجابات الخاطئة',
        'essay-grading': 'تصحيح المقالات',
        'cheating': 'الغش'
    };

    const checkAuth = async () => {
        try {
            await ApiClient.get('/admin/auth/verify-session');
            loadSection('dashboard');
        } catch (error) {
            window.location.href = '/login-admin';
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
                            <p style="font-size: 24px; font-weight: bold; color: var(--primary);">${data.data.totalStudents || 0}</p>
                        </div>
                        <div style="background: var(--bg-color); padding: 20px; border-radius: 8px; border: 1px solid var(--border);">
                            <h3 style="color: var(--text-muted); margin-bottom: 10px;">إجمالي الواجبات</h3>
                            <p style="font-size: 24px; font-weight: bold; color: var(--primary);">${data.data.totalAssignments || 0}</p>
                        </div>
                        <div style="background: var(--bg-color); padding: 20px; border-radius: 8px; border: 1px solid var(--border);">
                            <h3 style="color: var(--text-muted); margin-bottom: 10px;">التسليمات</h3>
                            <p style="font-size: 24px; font-weight: bold; color: var(--primary);">${data.data.totalSubmissions || 0}</p>
                        </div>
                        <div style="background: var(--bg-color); padding: 20px; border-radius: 8px; border: 1px solid var(--border);">
                            <h3 style="color: var(--text-muted); margin-bottom: 10px;">المقالات المعلقة</h3>
                            <p style="font-size: 24px; font-weight: bold; color: var(--warning);">${data.data.pendingEssays || 0}</p>
                        </div>
                    </div>
                `;
            } 
            
            else if (section === 'students') {
                const data = await ApiClient.get('/admin/students');
                let html = `
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>الاسم</th>
                                    <th>الكود</th>
                                    <th>الإيميل</th>
                                    <th>الهاتف</th>
                                    <th>تاريخ التسجيل</th>
                                    <th>إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                data.data.forEach(student => {
                    html += `
                        <tr>
                            <td>${student.fullName}</td>
                            <td>${student.studentCode}</td>
                            <td>${student.email}</td>
                            <td>${student.phone}</td>
                            <td>${new Date(student.createdAt).toLocaleDateString('ar-EG')}</td>
                            <td>
                                <button class="btn-sm btn-edit" onclick='openEditStudent(${JSON.stringify(student)})'>تعديل</button>
                                <button class="btn-sm btn-delete" onclick="deleteStudent('${student.uid}')">حذف</button>
                            </td>
                        </tr>
                    `;
                });
                html += `</tbody></table></div>`;
                sectionContent.innerHTML = html;
            }

            else if (section === 'correct-answers' || section === 'incorrect-answers') {
                const isCorrect = section === 'correct-answers';
                const url = isCorrect ? '/admin/correct-answers' : '/admin/incorrect-answers';
                const data = await ApiClient.get(url);
                
                let html = `
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>الطالب</th>
                                    <th>الواجب</th>
                                    <th>السؤال</th>
                                    <th>إجابته</th>
                                    <th>الإجابة الصحيحة</th>
                                    ${isCorrect ? '' : '<th>الدرجة المفقودة</th>'}
                                </tr>
                            </thead>
                            <tbody>
                `;
                if (data.data.length === 0) {
                    html += `<tr><td colspan="6" style="text-align: center;">لا توجد إجابات.</td></tr>`;
                } else {
                    data.data.forEach(item => {
                        html += `
                            <tr>
                                <td>${item.studentName} (${item.studentCode})</td>
                                <td>${item.assignmentTitle}</td>
                                <td>${item.questionText}</td>
                                <td>${item.selectedAnswer}</td>
                                <td>${item.correctAnswer}</td>
                                ${isCorrect ? '' : `<td>${item.marksLost}</td>`}
                            </tr>
                        `;
                    });
                }
                html += `</tbody></table></div>`;
                sectionContent.innerHTML = html;
            }

            else if (section === 'essay-grading') {
                const data = await ApiClient.get('/grading/pending-essays');
                let html = `
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>الطالب</th>
                                    <th>الواجب</th>
                                    <th>السؤال</th>
                                    <th>الدرجة القصوى</th>
                                    <th>إجراء</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                if (data.data.length === 0) {
                    html += `<tr><td colspan="5" style="text-align: center;">لا توجد مقالات معلقة.</td></tr>`;
                } else {
                    data.data.forEach(essay => {
                        html += `
                            <tr>
                                <td>${essay.studentName} (${essay.studentCode})</td>
                                <td>${essay.assignmentName}</td>
                                <td>${essay.questionText.substring(0, 30)}...</td>
                                <td>${essay.maxMarks}</td>
                                <td>
                                    <button class="btn-sm btn-grade" onclick='openGradeEssay(${JSON.stringify(essay)})'>تصحيح</button>
                                </td>
                            </tr>
                        `;
                    });
                }
                html += `</tbody></table></div>`;
                sectionContent.innerHTML = html;
            }

            else if (section === 'cheating') {
                const data = await ApiClient.get('/cheating/list');
                let html = `
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>الطالب</th>
                                    <th>الواجب</th>
                                    <th>نوع الحادثة</th>
                                    <th>الوقت</th>
                                    <th>الحالة</th>
                                    <th>إجراء</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                if (data.data.length === 0) {
                    html += `<tr><td colspan="6" style="text-align: center;">لا توجد حوادث غش.</td></tr>`;
                } else {
                    data.data.forEach(incident => {
                        const statusText = incident.status === 'resolved' ? 'محلولة' : 'غير محلولة';
                        html += `
                            <tr>
                                <td>${incident.studentName}</td>
                                <td>${incident.assignmentId}</td>
                                <td>${incident.incidentType}</td>
                                <td>${new Date(incident.timestamp).toLocaleString('ar-EG')}</td>
                                <td>${statusText}</td>
                                <td>
                                    ${incident.status === 'unresolved' ? `<button class="btn-sm btn-edit" onclick="resolveIncident('${incident.id}')">حل</button>` : ''}
                                </td>
                            </tr>
                        `;
                    });
                }
                html += `</tbody></table></div>`;
                sectionContent.innerHTML = html;
            }

            else if (section === 'all-assignments') {
                sectionContent.innerHTML = `<div class="empty-state"><p>قسم الواجبات تحت التطوير.</p></div>`;
            }

        } catch (error) {
            sectionContent.innerHTML = `
                <div class="empty-state" style="border-color: var(--error);">
                    <p style="color: var(--error);">${error.message}</p>
                </div>
            `;
        }
    };

    window.openEditStudent = (student) => {
        document.getElementById('editStudentId').value = student.uid;
        document.getElementById('editFullName').value = student.fullName;
        document.getElementById('editStudentCode').value = student.studentCode;
        document.getElementById('editEmail').value = student.email;
        document.getElementById('editPhone').value = student.phone;
        document.getElementById('editStudentModal').classList.add('active');
    };

    window.deleteStudent = async (uid) => {
        if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;
        try {
            await ApiClient.delete(`/admin/students?id=${uid}`);
            UI.showToast('تم حذف الطالب بنجاح', 'success');
            loadSection('students');
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    };

    window.openGradeEssay = (essay) => {
        document.getElementById('gradeAnswerId').value = essay.answerId;
        document.getElementById('essayTextPreview').textContent = essay.textAnswer || 'لا يوجد نص.';
        document.getElementById('maxMarksDisplay').textContent = essay.maxMarks;
        document.getElementById('essayScore').max = essay.maxMarks;
        document.getElementById('essayScore').value = '';
        document.getElementById('essayFeedback').value = '';
        document.getElementById('gradeEssayModal').classList.add('active');
    };

    window.resolveIncident = async (id) => {
        try {
            await ApiClient.put(`/cheating/${id}?id=${id}`, { status: 'resolved' });
            UI.showToast('تم تحديد الحادثة كمحلولة', 'success');
            loadSection('cheating');
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    };

    document.getElementById('editStudentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editStudentId').value;
        const data = {
            fullName: document.getElementById('editFullName').value,
            studentCode: document.getElementById('editStudentCode').value,
            email: document.getElementById('editEmail').value,
            phone: document.getElementById('editPhone').value
        };
        try {
            await ApiClient.put(`/admin/students?id=${id}`, data);
            UI.showToast('تم التحديث بنجاح', 'success');
            document.getElementById('editStudentModal').classList.remove('active');
            loadSection('students');
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    });

    document.getElementById('gradeEssayForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const answerId = document.getElementById('gradeAnswerId').value;
        const score = document.getElementById('essayScore').value;
        const feedback = document.getElementById('essayFeedback').value;
        try {
            await ApiClient.post('/grading/essay-submit', { answerId, score: Number(score), feedback });
            UI.showToast('تم حفظ الدرجة بنجاح', 'success');
            document.getElementById('gradeEssayModal').classList.remove('active');
            loadSection('essay-grading');
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    });

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
                await ApiClient.post('/admin/auth/admin-logout');
                window.location.href = '/login-admin';
            } catch (error) {
                UI.showToast('حدث خطأ أثناء تسجيل الخروج', 'error');
            }
        });
    }

    checkAuth();
});
