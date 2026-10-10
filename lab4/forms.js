// Lab 4: общие функции для форм на Bootstrap (вывод ошибок, показ пароля, кнопка с загрузкой).

const Forms = (() => {
    /** Показывает ошибку под полем (классы Bootstrap is-invalid / is-valid). */
    function setError(form, name, message, markValid = true) {
        const input = form.elements[name];
        const feedback = form.querySelector(`.invalid-feedback[data-for="${name}"]`);
        input.classList.toggle('is-invalid', message !== '');
        input.classList.toggle('is-valid', message === '' && markValid);
        if (feedback) {
            feedback.textContent = message;
            feedback.classList.toggle('d-block', message !== '');
        }
    }

    function showErrors(form, errors, names, markValid = true) {
        for (const name of names) setError(form, name, errors[name] ?? '', markValid);
        const firstInvalid = names.find((name) => errors[name]);
        if (firstInvalid) form.elements[firstInvalid].focus();
    }

    /** Общее сообщение над формой (alert Bootstrap). */
    function alert(box, type, message) {
        box.className = `alert alert-${type}`;
        box.textContent = message;
        box.hidden = message === '';
    }

    /** Кнопки «показать пароль» рядом с полями пароля. */
    function bindPasswordToggles(root = document) {
        root.querySelectorAll('[data-toggle-password]').forEach((button) => {
            button.addEventListener('click', () => {
                const input = document.getElementById(button.dataset.togglePassword);
                const show = input.type === 'password';
                input.type = show ? 'text' : 'password';
                button.innerHTML = show ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
                button.setAttribute('aria-label', show ? 'Скрыть пароль' : 'Показать пароль');
            });
        });
    }

    /** Блокирует кнопку и показывает спиннер, пока идёт запрос к базе. */
    function busy(button, isBusy) {
        button.disabled = isBusy;
        button.querySelector('.spinner-border')?.classList.toggle('d-none', !isBusy);
    }

    return { setError, showErrors, alert, bindPasswordToggles, busy };
})();
