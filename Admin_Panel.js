// =================================================================
// 1. CONFIGURAÇÃO E IMPORTAÇÕES DO FIREBASE
// =================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Configuração do Firebase (USE AS SUAS CHAVES REAIS!)
const firebaseConfig = {
    apiKey: "AIzaSyAc_HXPzSCLjrsHb24rLVVAwR7vZUQECEw",
    authDomain: "mocam-e2424.firebaseapp.com",
    projectId: "mocam-e2424",
    storageBucket: "mocam-e2424.appspot.com",
    messagingSenderId: "169837622214",
    appId: "1:169837622214:web:7058753277b652f751b8c7",
    measurementId: "G-QMBHB2CDV5"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Credenciais e Código SIMULADOS (Para login local)
const SIMULATED_EMAIL = "admin@mozonline.com";
const SIMULATED_PASSWORD = "12345";
const SIMULATED_CODE = "354826";

// Variável global para armazenar as denúncias do Firestore e o ID atual do modal
let allReports = [];
let currentReportId = null; 

// NOVO: Mapeamento de Status para Cores (para o painel e modal)
const STATUS_STYLES = {
    // Pendente (Amarelo)
    "Pendente": { cor: "bg-yellow-100 text-yellow-800", texto: "Pendente" },
    // Em Revisão (Azul)
    "Em Revisão": { cor: "bg-blue-100 text-blue-800", texto: "Em Revisão" },
    // Aprovado / Resolvido (Verde)
    "Resolvido": { cor: "bg-green-100 text-green-800", texto: "Resolvido" } 
};


document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM de Autenticação (Mantidos)
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
    
    // NOVO: Elementos DOM do Modal
    const modal = document.getElementById('report-details-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalTitle = document.getElementById('modal-title');
    const currentStatusDisplay = document.getElementById('current-status-display');
    const statusSelect = document.getElementById('status-select');
    const saveStatusBtn = document.getElementById('save-status-btn');
    const statusUpdateFeedback = document.getElementById('status-update-feedback');
    const modalEvidencesContainer = document.getElementById('modal-evidences-container');
    const modalLoading = document.getElementById('modal-loading');
    const noEvidencesMessage = document.getElementById('no-evidences-message');
    
    
    // --- Funções de UI (Mantidas) ---

    function clearStatusAfterDelay() {
        setTimeout(() => {
            updateAuthStatus('', false);
        }, 3000); 
    }

    function updateAuthStatus(message, isError = true) {
        authStatus.textContent = message;
        authStatus.classList.remove('text-red-500', 'text-green-500');
        authStatus.classList.add(isError ? 'text-red-500' : 'text-green-500');
        
        if (message) {
            clearStatusAfterDelay();
        }
    }

    function updatePublishStatus(message, isError = true) {
        publishStatus.textContent = message;
        publishStatus.classList.remove('text-red-500', 'text-green-500', 'hidden');
        publishStatus.classList.add(isError ? 'text-red-500' : 'text-green-500');

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

    // =================================================================
    // 2. FUNÇÕES DO FIRESTORE E RENDERIZAÇÃO
    // =================================================================

    /**
     * Busca todas as denúncias no Firestore, ordenadas pela mais recente.
     * Isso garante a ORDEM DE CHEGADA.
     */
    async function fetchReports() {
        loadingReports.classList.remove('hidden');
        reportsList.innerHTML = ''; 
        allReports = [];
        
        try {
            const reportsCol = collection(db, "reports");
            // ORDENAR POR ORDEM DE CHEGADA: timestamp (descendente = mais recente primeiro)
            const q = query(reportsCol, orderBy("timestamp", "desc"));
            const snapshot = await getDocs(q);
            
            snapshot.forEach(doc => {
                const data = doc.data();
                // O status padrão é "Pendente" se o campo 'status' não existir no Firestore
                const statusKey = data.status || "Pendente"; 
                const statusInfo = STATUS_STYLES[statusKey] || STATUS_STYLES["Pendente"];

                const report = {
                    id: doc.id,
                    ...data,
                    // Garante que o timestamp é formatado para exibição
                    timestampFormatted: data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleString('pt-MZ') : 'N/D',
                    statusKey: statusKey,
                    statusCor: statusInfo.cor,
                    statusTexto: statusInfo.texto
                };
                allReports.push(report);
            });
            
        } catch (error) {
            console.error("Erro ao buscar denúncias:", error);
            reportsList.innerHTML = `<div class="p-4 text-center text-red-500 bg-red-50 rounded-lg">Erro ao carregar dados: ${error.message}</div>`;
        } finally {
            loadingReports.classList.add('hidden');
        }
    }
    
    /**
     * Gera o HTML para um único cartão de denúncia no painel principal.
     */
    function renderReportCard(report) {
        return `
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
                 data-report-id="${report.id}" onclick="window.showReportDetails('${report.id}')">
                <div class="flex-1 min-w-0">
                    <p class="text-lg font-semibold text-gray-700 truncate">${report.reportType} - De: ${report.clientName}</p>
                    <p class="text-sm text-gray-400">ID: ${report.id.substring(0, 8)}... - Recebido em: ${report.timestampFormatted}</p>
                </div>
                <span class="mt-2 sm:mt-0 px-3 py-1 text-xs font-bold rounded-full ${report.statusCor}">
                    ${report.statusTexto}
                </span>
            </div>
        `;
    }

    /**
     * Carrega dados e preenche o Painel de Administração.
     */
    async function loadAdminData() {
        await fetchReports();

        // 1. Atualizar Estatísticas
        statTotal.textContent = allReports.length;
        const pendingCount = allReports.filter(r => r.statusKey === 'Pendente').length; 
        statPending.textContent = pendingCount;
        // Simulamos que resolvidas/aprovadas são as que não são Pendente nem Em Revisão
        const publishedCount = allReports.filter(r => r.statusKey === 'Resolvido').length;
        statPublished.textContent = publishedCount; 

        // 2. Renderizar Lista de Denúncias
        if (allReports.length === 0) {
            reportsList.innerHTML = '<div class="p-4 text-center text-gray-500">Nenhuma denúncia encontrada no banco de dados.</div>';
            return;
        }
        
        reportsList.innerHTML = allReports.map(renderReportCard).join('');
    }

    /**
     * Função Global para mostrar os detalhes da denúncia (Chamada pelo onclick no HTML).
     * Permite a VISUALIZAÇÃO DAS IMAGENS.
     */
    window.showReportDetails = async function(reportId) {
        currentReportId = reportId;
        modal.classList.remove('hidden');
        modalLoading.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Bloqueia scroll no body
        
        const report = allReports.find(r => r.id === reportId);
        if (!report) {
            alert("Erro: Detalhes da denúncia não encontrados.");
            modal.classList.add('hidden');
            document.body.style.overflow = '';
            return;
        }
        
        modalLoading.classList.add('hidden');
        
        // Preencher o Cabeçalho e Status
        modalTitle.textContent = `Detalhes da Denúncia #${report.id.substring(0, 8)}`;
        const statusInfo = STATUS_STYLES[report.statusKey] || STATUS_STYLES["Pendente"];
        currentStatusDisplay.textContent = statusInfo.texto;
        currentStatusDisplay.className = `px-3 py-1 text-sm font-bold rounded-full ${statusInfo.cor}`;
        statusSelect.value = report.statusKey;
        statusUpdateFeedback.classList.add('hidden');

        // Preencher Dados Principais
        document.getElementById('modal-report-mode').textContent = report.reportMode;
        document.getElementById('modal-report-type').textContent = report.reportType;
        document.getElementById('modal-client-name').textContent = report.clientName || 'Anônimo'; 
        document.getElementById('modal-client-phone').textContent = report.clientPhone || 'Anônimo';
        document.getElementById('modal-occurrence-date').textContent = report.occurrenceDate;
        document.getElementById('modal-occurrence-location').textContent = report.occurrenceLocation;
        document.getElementById('modal-report-description').textContent = report.reportDescription;
        
        // Exibir Evidências (Imagens Base64)
        modalEvidencesContainer.innerHTML = '';
        noEvidencesMessage.classList.add('hidden');

        let evidenceCount = 0;
        for (let i = 1; i <= 3; i++) {
            const evidenceKey = `evidence${i}`;
            const base64String = report[evidenceKey];
            
            // Verifica se a string Base64 existe e não é a mensagem de erro de limite
            if (base64String && base64String !== 'Nenhuma Prova Anexada' && base64String !== 'Arquivo Excedeu Limite (5MB)') {
                evidenceCount++;
                const imgContainer = document.createElement('div');
                imgContainer.className = 'p-2 border border-gray-200 rounded-lg bg-gray-50';
                imgContainer.innerHTML = `
                    <h4 class="text-xs font-medium text-gray-500 mb-1">Evidência ${evidenceCount}</h4>
                    <img src="${base64String}" alt="Evidência ${evidenceCount}" class="w-full h-auto object-cover rounded-md max-h-48 cursor-pointer" onclick="window.open('${base64String}', '_blank')">
                `;
                modalEvidencesContainer.appendChild(imgContainer);
            }
        }
        
        if (evidenceCount === 0) {
            noEvidencesMessage.classList.remove('hidden');
        }
    }
    
    /**
     * Salva a alteração de status no Firestore.
     * Permite ao ADMINISTRADOR mudar o status.
     */
    async function saveStatusUpdate() {
        if (!currentReportId) return;

        const newStatus = statusSelect.value;
        const reportRef = doc(db, "reports", currentReportId);

        // Exibir feedback de carregamento
        statusUpdateFeedback.classList.remove('hidden', 'text-green-500', 'text-red-500');
        statusUpdateFeedback.classList.add('text-gray-500');
        statusUpdateFeedback.textContent = 'A salvar alteração...';
        saveStatusBtn.disabled = true;

        try {
            await updateDoc(reportRef, {
                status: newStatus 
            });

            // Atualizar UI do modal
            const statusInfo = STATUS_STYLES[newStatus];
            currentStatusDisplay.textContent = statusInfo.texto;
            currentStatusDisplay.className = `px-3 py-1 text-sm font-bold rounded-full ${statusInfo.cor}`;

            // Atualizar feedback
            statusUpdateFeedback.classList.remove('text-gray-500');
            statusUpdateFeedback.classList.add('text-green-500');
            statusUpdateFeedback.textContent = `Status atualizado para "${statusInfo.texto}" com sucesso!`;
            
            // Recarregar os dados do painel para refletir a mudança
            loadAdminData(); 

        } catch (error) {
            console.error("Erro ao salvar status:", error);
            statusUpdateFeedback.classList.remove('text-gray-500');
            statusUpdateFeedback.classList.add('text-red-500');
            statusUpdateFeedback.textContent = `Erro: Não foi possível salvar o status.`;
        } finally {
            saveStatusBtn.disabled = false;
            setTimeout(() => {
                statusUpdateFeedback.classList.add('hidden');
            }, 3000);
        }
    }

    // --- LISTENERS DO MODAL ---
    
    // Fechar Modal
    closeModalBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    });
    
    // Fechar Modal ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    });

    // Salvar Status
    saveStatusBtn.addEventListener('click', saveStatusUpdate);

    
    // --- LISTENERS DE AUTENTICAÇÃO E PAINEL ---

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
            showSection(codeVerificationSection, loginSection);
            document.getElementById('login-password').value = ''; 
        } else {
            updateAuthStatus('Erro: Credenciais de login inválidas.', true);
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
        } else {
            updateAuthStatus('Erro: Código de verificação incorreto.', true);
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

        updateAuthStatus(`Registo de ${name} bem-sucedido! Volte para o Login.`, false);
        
        setTimeout(() => {
            flipCard(false); 
            registerForm.reset(); 
        }, 1500); 
    });

    // Logout
    logoutButton.addEventListener('click', () => {
        adminPanelContainer.classList.add('hidden');
        authWrapper.classList.remove('hidden');
        authContainer.classList.remove('is-flipped');
        showSection(loginSection, codeVerificationSection);
        updateAuthStatus('Sessão encerrada com sucesso.', false);
        
        reportsList.innerHTML = '<div id="loading-reports" class="text-center text-gray-500 hidden"><p>A carregar denúncias...</p></div>';
        loadingReports.classList.remove('hidden');
    });

    function showAdminPanel() {
        authWrapper.classList.add('hidden');
        adminPanelContainer.classList.remove('hidden');
        setTimeout(loadAdminData, 500); 
    }


    // --- LISTENERS DO PAINEL DE ADMINISTRAÇÃO (Mantidos) ---

    showPublishFormButton.addEventListener('click', () => {
        togglePublishForm(true);
    });

    hidePublishFormButton.addEventListener('click', () => {
        togglePublishForm(false);
        publishFraudForm.reset();
    });

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

    publishFraudForm.addEventListener('submit', (e) => {
        e.preventDefault();
        updatePublishStatus('', false);

        const title = document.getElementById('fraud-title').value;
        const description = document.getElementById('fraud-description').value;
        const category = document.getElementById('fraud-category').value;
        
        if (title.length < 10 || description.length < 20) {
            updatePublishStatus('Erro: O título e a descrição são muito curtos.', true);
            return;
        }

        updatePublishStatus(`Fraude "${title}" na categoria "${category}" publicada com sucesso!`, false);
        
        setTimeout(() => {
            publishFraudForm.reset();
        }, 3000); 
    });
});