document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM de Autenticação
    const authContainer = document.getElementById('auth-container');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const codeVerificationForm = document.getElementById('code-verification-form');
    const showRegisterLink = document.getElementById('show-register-form');
    const showLoginLink = document.getElementById('show-login-form');
    const backToLoginLink = document.getElementById('back-to-login');
    const loginSection = document.getElementById('login-section');
    const codeVerificationSection = document.getElementById('code-verification-section');
    const authWrapper = document.getElementById('auth-wrapper');
    const adminPanelContainer = document.getElementById('admin-panel-container');
    const logoutButton = document.getElementById('logout-button');
    const authStatus = document.getElementById('auth-status');

    // Elementos DOM do Painel
    const reportsList = document.getElementById('reports-list');
    const loadingReports = document.getElementById('loading-reports');
    const statTotal = document.getElementById('stat-total');
    const statPending = document.getElementById('stat-pending');
    const statPublished = document.getElementById('stat-published');
    const reportsSection = document.getElementById('reports-section');
    const publishFormSection = document.getElementById('publish-form-section');
    const showPublishFormButton = document.getElementById('show-publish-form-button');
    const hidePublishFormButton = document.getElementById('hide-publish-form-button');
    const publishFraudForm = document.getElementById('publish-fraud-form');
    const publishStatus = document.getElementById('publish-status');


    // Credenciais SIMULADAS
    const SIMULATED_EMAIL = "admin@mozonline.com";
    const SIMULATED_PASSWORD = "12345";
    const SIMULATED_CODE = "354826"; 
    
    // Dados Simulados
    const simulatedReports = [
        { id: 101, titulo: "Venda Falsa de Telemóvel", data: "2025-09-25", status: "Pendente", cor: "bg-yellow-100 text-yellow-800" },
        { id: 102, titulo: "Publicidade Enganosa (Imóvel)", data: "2025-09-24", status: "Em Revisão", cor: "bg-blue-100 text-blue-800" },
        { id: 103, titulo: "Tentativa de Phishing", data: "2025-09-23", status: "Resolvido", cor: "bg-green-100 text-green-800" },
        { id: 104, titulo: "Transferência Não Autorizada", data: "2025-09-22", status: "Pendente", cor: "bg-yellow-100 text-yellow-800" },
    ];


    // --- Funções de UI ---

    // Função que garante que a mensagem desapareça após 3 segundos
    function clearStatusAfterDelay() {
        setTimeout(() => {
            updateAuthStatus('', false);
        }, 3000); // 3000 milissegundos = 3 segundos
    }

    function updateAuthStatus(message, isError = true) {
        authStatus.textContent = message;
        authStatus.classList.remove('text-red-500', 'text-green-500');
        authStatus.classList.add(isError ? 'text-red-500' : 'text-green-500');
        
        // Chamada para limpar a mensagem após a exibição
        if (message) {
            clearStatusAfterDelay();
        }
    }

    function updatePublishStatus(message, isError = true) {
        publishStatus.textContent = message;
        publishStatus.classList.remove('text-red-500', 'text-green-500', 'hidden');
        publishStatus.classList.add(isError ? 'text-red-500' : 'text-green-500');

        // Chamada para limpar a mensagem do formulário de publicação
        if (message) {
            setTimeout(() => {
                publishStatus.textContent = '';
                publishStatus.classList.add('hidden');
            }, 3000);
        }
    }

    function flipCard(isRegister) {
        authContainer.classList.toggle('is-flipped', isRegister);
        updateAuthStatus('', false); 
    }

    function showSection(sectionToShow, sectionToHide) {
        sectionToHide.classList.add('hidden');
        sectionToShow.classList.remove('hidden');
        updateAuthStatus('', false); 
    }

    // Função para carregar dados do Painel
    function loadAdminData() {
        // 1. Atualizar Estatísticas
        statTotal.textContent = simulatedReports.length;
        const pendingCount = simulatedReports.filter(r => r.status === 'Pendente').length;
        statPending.textContent = pendingCount;
        statPublished.textContent = 15; // Simulação de dados publicados

        // 2. Carregar Lista de Denúncias
        loadingReports.classList.add('hidden');
        
        reportsList.innerHTML = simulatedReports.map(report => `
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div class="flex-1 min-w-0">
                    <p class="text-lg font-semibold text-gray-700 truncate">${report.titulo}</p>
                    <p class="text-sm text-gray-400">ID: ${report.id} - Data: ${report.data}</p>
                </div>
                <span class="mt-2 sm:mt-0 px-3 py-1 text-xs font-bold rounded-full ${report.cor}">
                    ${report.status}
                </span>
            </div>
        `).join('');
    }

    function showAdminPanel() {
        authWrapper.classList.add('hidden');
        adminPanelContainer.classList.remove('hidden');
        setTimeout(loadAdminData, 500);
    }

    function togglePublishForm(show) {
        if (show) {
            reportsSection.classList.add('hidden');
            publishFormSection.classList.remove('hidden');
        } else {
            publishFormSection.classList.add('hidden');
            reportsSection.classList.remove('hidden');
            updatePublishStatus('', false);
        }
    }


    // --- LISTENERS DE AUTENTICAÇÃO (Atualizado com timer) ---

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        flipCard(true);
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        flipCard(false);
    });

    backToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(loginSection, codeVerificationSection);
    });
    
    // Login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        updateAuthStatus('', false); 
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (email === SIMULATED_EMAIL && password === SIMULATED_PASSWORD) {
            // Em caso de sucesso, a mensagem é limpa ao trocar de seção
            showSection(codeVerificationSection, loginSection);
            document.getElementById('login-password').value = ''; 
        } else {
            updateAuthStatus('Erro: Credenciais de login inválidas.', true);
            // O clearStatusAfterDelay() é chamado dentro de updateAuthStatus
        }
    });

    // Verificação de Código 
    codeVerificationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        updateAuthStatus('', false); 
        const code = document.getElementById('verification-code').value.trim();

        if (code === SIMULATED_CODE) { 
            updateAuthStatus('Código verificado! Acedendo ao painel...', false);
            setTimeout(showAdminPanel, 500);
            // A mensagem de sucesso desaparecerá após 3s
        } else {
            updateAuthStatus('Erro: Código de verificação incorreto.', true);
            // A mensagem de erro desaparecerá após 3s
        }
    });

    // Registo
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        updateAuthStatus('', false); 

        const name = document.getElementById('register-name').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (password !== confirmPassword) {
            updateAuthStatus('Erro: As senhas digitadas não coincidem!', true);
            return; 
        }
        
        if (password.length < 6) {
            updateAuthStatus('Erro: A senha deve ter pelo menos 6 caracteres.', true);
            return; 
        }

        // Sucesso
        updateAuthStatus(`Registo de ${name} bem-sucedido! Volte para o Login.`, false);
        // A mensagem de sucesso desaparecerá após 3s
        
        // Voltar para o Login após o atraso da mensagem
        setTimeout(() => {
            flipCard(false); 
            registerForm.reset(); 
        }, 1500); // Mantemos este atraso para que a mensagem de sucesso seja lida antes de virar
    });

    // Logout
    logoutButton.addEventListener('click', () => {
        adminPanelContainer.classList.add('hidden');
        authWrapper.classList.remove('hidden');
        authContainer.classList.remove('is-flipped');
        showSection(loginSection, codeVerificationSection);
        updateAuthStatus('Sessão encerrada com sucesso.', false);
        // A mensagem de logout desaparecerá após 3s
        
        // Limpar visualmente o painel
        reportsList.innerHTML = '<div id="loading-reports" class="text-center text-gray-500 hidden"><p>A carregar denúncias...</p></div>';
        loadingReports.classList.remove('hidden');
    });


    // --- LISTENERS DO PAINEL DE ADMINISTRAÇÃO ---

    // Mostrar Formulário de Publicação
    showPublishFormButton.addEventListener('click', () => {
        togglePublishForm(true);
    });

    // Esconder Formulário de Publicação
    hidePublishFormButton.addEventListener('click', () => {
        togglePublishForm(false);
        publishFraudForm.reset();
    });

    // Submissão do Formulário de Publicação
    publishFraudForm.addEventListener('submit', (e) => {
        e.preventDefault();
        updatePublishStatus('', false);

        const title = document.getElementById('fraud-title').value;
        const description = document.getElementById('fraud-description').value;
        const category = document.getElementById('fraud-category').value;
        
        // Simulação do envio 
        if (title.length < 10 || description.length < 20) {
            updatePublishStatus('Erro: O título e a descrição são muito curtos.', true);
            return;
        }

        updatePublishStatus(`Fraude "${title}" na categoria "${category}" publicada com sucesso!`, false);
        
        // O status de publicação também desaparecerá após 3s (implementado em updatePublishStatus)
        // Limpar formulário após o atraso
        setTimeout(() => {
            publishFraudForm.reset();
        }, 3000); 
    });
});