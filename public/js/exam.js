document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const assignmentId = urlParams.get('id');

    if (!assignmentId) {
        window.location.href = '/homework';
        return;
    }

    const examTitle = document.getElementById('examTitle');
    const studentName = document.getElementById('studentName');
    const timerEl = document.getElementById('timer');
    const startExamBtn = document.getElementById('startExamBtn');
    const examInstruction = document.getElementById('examInstruction');
    const examContent = document.getElementById('examContent');
    const questionsContainer = document.getElementById('questionsContainer');
    const submitExamBtn = document.getElementById('submitExamBtn');
    const loadingState = document.getElementById('loadingState');

    let questionsData = [];
    let answers = {};
    let timerInterval;
    let timeLeft = 0;
    let attemptId = null;

    const isMonitoring = true;
    let warningCount = 0;
    const maxWarnings = 3;

    const fetchExamData = async () => {
        try {
            const me = await ApiClient.get('/students/me');
            studentName.textContent = me.data.fullName;

            const startRes = await ApiClient.post(`/assignments/${assignmentId}-start`);
            attemptId = startRes.data.attemptId;
            timeLeft = startRes.data.duration * 60;
            
            const questionsRes = await ApiClient.get(`/assignments/${assignmentId}-questions`);
            questionsData = questionsRes.data;
            
            examTitle.textContent = 'الامتحان جاهز';
        } catch (error) {
            UI.showToast(error.message, 'error');
            setTimeout(() => window.location.href = '/homework', 3000);
        }
    };

    const renderQuestions = () => {
        questionsContainer.innerHTML = '';
        questionsData.forEach((q, index) => {
            const qCard = document.createElement('div');
            qCard.className = 'question-card';
            
            let contentHtml = `
                <div class="question-header">
                    <span>السؤال ${index + 1}</span>
                    <span>${q.marks} درجات</span>
                </div>
            `;

            if (q.source === 'image' && q.imageUrl) {
                contentHtml += `<img src="${q.imageUrl}" alt="Question Image" class="question-image">`;
            } else {
                contentHtml += `<div class="question-text">${q.text}</div>`;
            }

            if (q.type === 'mcq') {
                contentHtml += `<div class="choices-container">`;
                q.choices.forEach((choice, cIndex) => {
                    contentHtml += `
                        <label class="choice-label" id="label-${q.id}-${cIndex}">
                            <input type="radio" name="q_${q.id}" value="${choice}" data-qid="${q.id}">
                            <span>${choice}</span>
                        </label>
                    `;
                });
                contentHtml += `</div>`;
            } else {
                contentHtml += `
                    <textarea class="essay-input" data-qid="${q.id}" placeholder="اكتب إجابتك هنا..."></textarea>
                `;
            }

            qCard.innerHTML = contentHtml;
            questionsContainer.appendChild(qCard);
        });

        questionsContainer.addEventListener('change', (e) => {
            if (e.target.type === 'radio') {
                const qid = e.target.dataset.qid;
                answers[qid] = e.target.value;
                
                document.querySelectorAll(`input[name="q_${qid}"]`).forEach(input => {
                    input.closest('.choice-label').classList.remove('selected');
                });
                e.target.closest('.choice-label').classList.add('selected');
            }
        });

        questionsContainer.addEventListener('input', (e) => {
            if (e.target.tagName === 'TEXTAREA') {
                answers[e.target.dataset.qid] = e.target.value;
            }
        });
    };

    const startTimer = () => {
        timerInterval = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                UI.showToast('انتهى الوقت! جاري تسليم الامتحان تلقائياً.', 'error');
                submitExam(true);
                return;
            }
            
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            if (timeLeft < 300) {
                timerEl.style.color = '#ef4444';
            }
        }, 1000);
    };

    const logCheating = async (type) => {
        if (!isMonitoring || !attemptId) return;
        try {
            await ApiClient.post('/cheating/log-incident', {
                assignmentId,
                attemptId,
                incidentType: type
            });
        } catch (error) {
            console.error('Failed to log incident', error);
        }
    };

    const handleVisibilityChange = () => {
        if (document.hidden) {
            warningCount++;
            logCheating('TAB_SWITCH');
            
            if (warningCount <= maxWarnings) {
                UI.showToast(`تحذير ${warningCount}: لا تغادر صفحة الامتحان!`, 'error');
            } else {
                UI.showToast('تم قفل الامتحان بسبب كثرة الخروج من الصفحة.', 'error');
                submitExam(true);
            }
        }
    };

    const preventCopyPaste = (e) => {
        e.preventDefault();
        if (e.type === 'paste') logCheating('PASTE_ATTEMPT');
        else if (e.type === 'copy') logCheating('COPY_ATTEMPT');
        else if (e.type === 'contextmenu') logCheating('CONTEXT_MENU');
        UI.showToast('هذا الإجراء غير مسموح به أثناء الامتحان.', 'error');
    };

    const enableMonitoring = () => {
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('copy', preventCopyPaste);
        document.addEventListener('paste', preventCopyPaste);
        document.addEventListener('contextmenu', preventCopyPaste);
        document.addEventListener('cut', preventCopyPaste);
    };

    const disableMonitoring = () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.removeEventListener('copy', preventCopyPaste);
        document.removeEventListener('paste', preventCopyPaste);
        document.removeEventListener('contextmenu', preventCopyPaste);
        document.removeEventListener('cut', preventCopyPaste);
    };

    const submitExam = async (isAuto = false) => {
        if (!isAuto) {
            const confirmSubmit = confirm('هل أنت متأكد من تسليم الامتحان؟ لن تتمكن من التعديل بعد ذلك.');
            if (!confirmSubmit) return;
        }

        submitExamBtn.disabled = true;
        submitExamBtn.textContent = 'جاري التسليم...';
        clearInterval(timerInterval);
        disableMonitoring();

        const formattedAnswers = questionsData.map(q => ({
            questionId: q.id,
            selectedChoice: q.type === 'mcq' ? answers[q.id] : null,
            textAnswer: q.type === 'essay' ? answers[q.id] : null
        }));

        try {
            await ApiClient.post('/submissions', {
                assignmentId,
                attemptId,
                answers: formattedAnswers
            });
            
            UI.showToast('تم تسليم الامتحان بنجاح.', 'success');
            setTimeout(() => window.location.href = '/homework', 2000);
        } catch (error) {
            UI.showToast(error.message, 'error');
            submitExamBtn.disabled = false;
            submitExamBtn.textContent = 'تسليم الامتحان';
        }
    };

    startExamBtn.addEventListener('click', () => {
        examInstruction.classList.add('hidden');
        loadingState.classList.remove('hidden');

        setTimeout(() => {
            loadingState.classList.add('hidden');
            examContent.classList.remove('hidden');
            renderQuestions();
            startTimer();
            enableMonitoring();
        }, 1000);
    });

    submitExamBtn.addEventListener('click', () => submitExam(false));

    fetchExamData();
});
