// static/main_app.js

// # Precision File Search
// # Copyright (c) 2025 Ali Kazemi
// # Licensed under MPL 2.0
// # This file is part of a derivative work and must retain this notice.

// 1. SHARED EXPORTS & SELECTORS #################################################################################
export let currentTranslations = {};
export const finishSound = new Audio('/static/finish.mp3');
export function escapeHTML(str) { const p = document.createElement('p'); p.textContent = str; return p.innerHTML; }

export const includeDotFoldersCheckbox = document.getElementById('include_dot_folders');

export const aiSearchForm = document.getElementById('aiSearchForm');
export const aiQueryInput = document.getElementById('ai_query');
export const aiSearchButton = document.getElementById('aiSearchButton');
export const aiResultsSection = document.getElementById('ai-results-section');
export const aiResultsDiv = document.getElementById('ai-results');
export const aiTemperatureSlider = document.getElementById('ai_temperature');
export const aiTemperatureValue = document.getElementById('ai_temperature_value');
export const aiMaxTokensSlider = document.getElementById('ai_max_tokens');
export const aiMaxTokensValue = document.getElementById('ai_max_tokens_value');

export const startIndexingButton = document.getElementById('startIndexingButton');
export const semanticPathInput = document.getElementById('semantic_path');
export const semanticSearchSection = document.getElementById('semantic-search-section');
export const semanticSearchForm = document.getElementById('semanticSearchForm');
export const semanticQueryInput = document.getElementById('semantic_query');
export const semanticResultsSection = document.getElementById('semantic-results-section');
export const semanticResultsDiv = document.getElementById('semantic-results');
export const enableRerankerToggle = document.getElementById('enable_reranker_toggle');
export const rerankerOptionsDiv = document.getElementById('reranker-options');

export const quickKFetch = document.getElementById('quick_k_fetch_initial');
export const quickVectorScoreThreshold = document.getElementById('quick_vector_score_threshold');
export const quickVectorTopN = document.getElementById('quick_vector_top_n');
export const quickScoreThreshold = document.getElementById('quick_rerank_score_threshold');
export const quickTopN = document.getElementById('quick_rerank_top_n');

export const startClassificationButton = document.getElementById('startClassificationButton');
export const classifierPathInput = document.getElementById('classifier_path');
export const progressSection = document.getElementById('classifier-progress-section');
export const progressBar = document.getElementById('classifier-progress-bar');
export const statusText = document.getElementById('classifier-status-text');
export const resultsSectionClassifier = document.getElementById('classifier-results-section');
export const resultsAccordion = document.getElementById('classifier-results-accordion');
export const organizeAllButton = document.getElementById('organizeAllButton');

export const enableRerankerSetting = document.getElementById('enable_reranker_setting');
export const vectorScoreThresholdInput = document.getElementById('vector_score_threshold');
export const vectorTopNInput = document.getElementById('vector_top_n');
export const llmApiKeyInput = document.getElementById('llm_api_key');
export const llmModelNameInput = document.getElementById('llm_model_name');
export const llmBaseUrlInput = document.getElementById('llm_base_url');
export const embeddingModelNameInput = document.getElementById('embedding_model_name');
export const rerankerModelNameInput = document.getElementById('reranker_model_name');

export const startTrainingButton = document.getElementById('startTrainingButton');
export const trainingDataPathInput = document.getElementById('training_data_path');
export const testSizeSlider = document.getElementById('test_size_split');
export const testSizeValueSpan = document.getElementById('test_size_value');
export const nEstimatorsInput = document.getElementById('n_estimators');
export const trainerStatusSection = document.getElementById('trainer-status-section');
export const trainerLog = document.getElementById('trainer-log');
export const trainerResult = document.getElementById('trainer-result');

export const modalOverlay = document.getElementById('file-op-modal-overlay');
export const modalTitle = document.getElementById('modal-title');
export const modalText = document.getElementById('modal-text');
export const modalInput = document.getElementById('modal-destination-path');
export const modalConfirmBtn = document.getElementById('modal-confirm-btn');
export const modalCancelBtn = document.getElementById('modal-cancel-btn');
export const modalCloseBtn = document.getElementById('modal-close-btn');
export const modalErrorText = document.getElementById('modal-error-text');

// 2. UI HANDLER IMPORTS #########################################################################################
import {
    initializeAISearchUI,
    performAISearch,
    initializeSemanticUI,
    startIndexing,
    updateIndexingProgress,
    performSemanticSearch,
    handleSemanticResultsClick,
    handleAIResultsClick,
    startClassification,
    renderClassificationResults,
    handleClassifierAccordionClick,
    handleOrganizeAll,
    startTraining
} from './ui_handlers.js';

// 3. INTERNATIONALIZATION (I18N) ################################################################################
const languageSwitcher = document.getElementById('language-switcher');
const rtlLangs = ['fa', 'ar', 'he', 'ur'];

const languages = {
    "en": "English", "ar": "العربية", "ch": "中文", "de": "Deutsch",
    "es": "Español", "fa": "فارسی", "fr": "Français", "hi": "हिन्दी",
    "hy": "Հայերեն", "it": "Italiano", "jp": "日本語", "ka": "ქართული",
    "kr": "한국어", "ro": "Română", "ru": "Русский", "tr": "Türkçe",
    "uk": "Українська", "ur": "اردو"
};

function populateLanguageSwitcher() {
    languageSwitcher.innerHTML = '';
    for (const [code, name] of Object.entries(languages)) {
        const option = document.createElement('option');
        option.value = code; option.textContent = name;
        languageSwitcher.appendChild(option);
    }
}

async function translatePage(lang) {
    try {
        const response = await fetch(`/static/lang/${lang}.json`);
        if (!response.ok) {
            console.error(`Could not load language file: ${lang}.json`);
            if (lang !== 'en') await translatePage('en');
            return;
        }
        const translations = await response.json();
        currentTranslations = translations;
        document.documentElement.dir = rtlLangs.includes(lang) ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
        document.querySelectorAll('[data-i18n-key]').forEach(el => {
            const key = el.dataset.i18nKey;
            if (translations[key]) el.textContent = translations[key];
        });
        document.querySelectorAll('[data-i18n-placeholder-key]').forEach(el => {
            const key = el.dataset.i18nPlaceholderKey;
            if (translations[key]) el.placeholder = translations[key];
        });
        document.querySelectorAll('[data-i18n-title-key]').forEach(el => {
            const key = el.dataset.i18nTitleKey;
            if (translations[key]) el.title = translations[key];
        });
        document.querySelectorAll('[data-i18n-aria-label-key]').forEach(el => {
            const key = el.dataset.i18nAriaLabelKey;
            if (translations[key]) el.setAttribute('aria-label', translations[key]);
        });
        if(resultsDiv.textContent.includes('AWAITING DATA') || resultsDiv.textContent.includes('در انتظار داده')) {
            resultsDiv.textContent = translations['awaitingData'] || '> AWAITING DATA...';
        }
         document.querySelectorAll('input[title]').forEach(el => {
             const key = el.id + 'Title';
             if (translations[key]) el.title = translations[key];
        });
    } catch (error) {
        console.error('Translation error:', error);
    }
}

function setLanguage(lang) {
    localStorage.setItem('preferredLanguage', lang);
    languageSwitcher.value = lang; translatePage(lang);
}
languageSwitcher.addEventListener('change', () => setLanguage(languageSwitcher.value));
function getInitialLanguage() { return localStorage.getItem('preferredLanguage') || (navigator.language.startsWith('fa') ? 'fa' : 'en'); }

// 4. CORE APP STRUCTURE & VIEW MGMT #############################################################################
const aboutView = document.getElementById('about-view');
const settingsView = document.getElementById('settings-view');
const saveSettingsButton = document.getElementById('saveSettingsButton');
const resetSettingsButton = document.getElementById('resetSettingsButton');

const searchViewBtn = document.getElementById('search-view-btn');
const aiSearchViewBtn = document.getElementById('ai-search-view-btn');
const semanticViewBtn = document.getElementById('semantic-view-btn');
const classifierViewBtn = document.getElementById('classifier-view-btn');
const settingsViewBtn = document.getElementById('settings-view-btn');
const aboutViewBtn = document.getElementById('about-view-btn');
const searchView = document.getElementById('search-view');
const aiSearchView = document.getElementById('ai-search-view');
const semanticView = document.getElementById('semantic-view');
const classifierView = document.getElementById('classifier-view');

const searchForm = document.getElementById('searchForm');
const scanControlsContainer = document.getElementById('scan-controls-container');
const stopButton = document.getElementById('stopButton');
const newSearchButton = document.getElementById('newSearchButton');
const logDiv = document.getElementById('log');
const resultsDiv = document.getElementById('results');
const statusSection = document.getElementById('statusSection');
const resultsSection = document.getElementById('resultsSection');
const exportButton = document.getElementById('exportButton');
const searchTypeRadios = document.querySelectorAll('input[name="search_type"]');
const categorySelectorContainer = document.getElementById('category_selector_container');
const fileCategorySelect = document.getElementById('file_category');
const sizeFilterContainer = document.getElementById('size-filter-container');
let ws; let logProgressElement = null; let searchResults = [];

const saveSearchButton = document.getElementById('saveSearchButton');
const savedSearchesContainer = document.getElementById('saved-searches-container');
const savedSearchesSelect = document.getElementById('savedSearchesSelect');
const loadSearchButton = document.getElementById('loadSearchButton');
const deleteSearchButton = document.getElementById('deleteSearchButton');
const searchHistoryContainer = document.getElementById('search-history-container');
const searchHistoryList = document.getElementById('search-history-list');
const MAX_HISTORY = 15;

const allViews = {
    search: { view: searchView, button: searchViewBtn },
    ai_search: { view: aiSearchView, button: aiSearchViewBtn },
    semantic: { view: semanticView, button: semanticViewBtn },
    classifier: { view: classifierView, button: classifierViewBtn },
    settings: { view: settingsView, button: settingsViewBtn },
    about: { view: aboutView, button: aboutViewBtn }
};

function switchView(viewToShow) {
    Object.values(allViews).forEach(({ view, button }) => {
        view.classList.add('hidden');
        button.classList.remove('header-icon-active');
    });
    allViews[viewToShow].view.classList.remove('hidden');
    allViews[viewToShow].button.classList.add('header-icon-active');
}

// 5. VISUAL EFFECTS #############################################################################################
function createParticles() {
    const background = document.getElementById('sci-fi-background');
    if (!background) return;
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 3 + 1;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDuration = `${Math.random() * 5 + 5}s`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        background.appendChild(particle);
    }
}

// 6. INITIALIZATION #############################################################################################
async function initialLoad() {
    populateLanguageSwitcher();
    const initialLang = getInitialLanguage();
    languageSwitcher.value = initialLang;
    await translatePage(initialLang);

    const tempWs = new WebSocket(`ws://${window.location.host}/ws/search`);
    tempWs.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'config') {
            handleWebSocketMessage(data);
            loadAndApplySettings(data.defaults);
            initializeSemanticUI(data.defaults);
            initializeAISearchUI(data.defaults);
            tempWs.close();
        }
        createParticles();
    };

    loadSavedSearches();
    loadSearchHistory();
    renderClassificationResults();
    updateIndexingProgress(true);
}

// 7. CLASSIC SEARCH LOGIC #######################################################################################
function startSearch() {
    finishSound.play().catch(() => {}); finishSound.pause(); finishSound.currentTime = 0;
    const payload = buildSearchPayload();
    addSearchToHistory(payload);
    ws = new WebSocket(`ws://${window.location.host}/ws/search`);
    ws.onopen = () => {
        resetUIBeforeSearch();

        const initialLogMessage = `> SEARCHING FOR: "${payload.keywords.join(', ')}"`;
        appendLog(initialLogMessage, true);

        appendLog(`> TARGET PATH: ${payload.search_path}`);
        ws.send(JSON.stringify({ type: "start_search", payload }));
    };
    ws.onmessage = (event) => handleWebSocketMessage(JSON.parse(event.data));
    ws.onerror = () => appendLog(`<span class="status-error">> WEBSOCKET ERROR: Connection failed.</span>`);
    ws.onclose = () => {
        if (!scanControlsContainer.classList.contains('hidden')) {
            stopButton.classList.add('hidden'); newSearchButton.classList.remove('hidden');
        }
        logProgressElement = null;
    };
}


function convertSizeToBytes(value, unit) {
    if (!value || value <= 0) return null;
    const multipliers = { 'KB': 1024, 'MB': 1024**2, 'GB': 1024**3 };
    return value * multipliers[unit];
}

function buildSearchPayload() {
    const minSizeValue = parseInt(document.getElementById('min_size_value').value, 10);
    const maxSizeValue = parseInt(document.getElementById('max_size_value').value, 10);
    return {
        search_path: document.getElementById('search_path').value,
        keywords: document.getElementById('keywords').value.split(',').map(k => k.trim()).filter(Boolean),
        search_type: document.querySelector('input[name="search_type"]:checked').value,
        excluded_folders: document.getElementById('excluded_folders').value.split(',').map(f => f.trim()).filter(Boolean),
        file_extensions: document.getElementById('file_extensions').value.split(',').map(e => e.trim()).filter(Boolean),
        include_dot_folders: includeDotFoldersCheckbox.checked,
        case_sensitive: document.getElementById('case_sensitive').checked,
        use_regex: document.getElementById('use_regex').checked,
        file_category: document.getElementById('file_category').value,
        min_size: convertSizeToBytes(minSizeValue, document.getElementById('min_size_unit').value),
        max_size: convertSizeToBytes(maxSizeValue, document.getElementById('max_size_unit').value)
    };
}

function handleWebSocketMessage(data) {
    if (data.type === 'config') {
        if (data.file_categories && data.file_categories.length > 0) {
            fileCategorySelect.innerHTML = data.file_categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        }
        return;
    }
    if (data.type === 'error') {
        appendLog(`<span class="status-error">> ERROR: ${data.message}</span>`);
        if(ws && ws.readyState === WebSocket.OPEN) ws.close();
    } else if (data.type === 'scan_start') { appendLog(`> TASK ID ${data.task_id} INITIATED.`);
    } else if (data.type === 'item_found') { appendSingleResult(data.path);
    } else if (data.type === 'scan_progress') { updateScanProgress(data);
    } else if (data.type === 'scan_complete') {
        logProgressElement = null; appendLog(`<span class="status-complete">> ${data.summary}</span>`);
        searchResults = data.results; renderResults(searchResults);
        finishSound.play().catch(error => console.error("Audio playback failed:", error));
    }
}

function resetUIBeforeSearch() {
    searchResults = []; resultsSection.classList.remove('hidden');
    resultsDiv.innerHTML = currentTranslations['awaitingData'] || '> AWAITING DATA...';
    statusSection.classList.remove('hidden'); exportButton.classList.add('hidden');
    searchForm.classList.add('hidden'); scanControlsContainer.classList.remove('hidden');
    stopButton.classList.remove('hidden'); stopButton.disabled = false;
    const stopButtonSpan = stopButton.querySelector('span');
    if(stopButtonSpan) stopButtonSpan.textContent = currentTranslations['terminateScan'] || 'TERMINATE SCAN';
    newSearchButton.classList.add('hidden');
}

function resetUIForNewSearch() {
    searchForm.classList.remove('hidden'); scanControlsContainer.classList.add('hidden');
    statusSection.classList.add('hidden'); resultsSection.classList.add('hidden');
    exportButton.classList.add('hidden'); logDiv.innerHTML = ''; resultsDiv.innerHTML = '';
    logProgressElement = null;
}

function appendSingleResult(path) {
    if (resultsDiv.textContent.startsWith('>')) { resultsDiv.innerHTML = ''; }
    const item = document.createElement('div');
    item.className = 'result-item';
    item.innerHTML = `
        <span class="result-path">${escapeHTML(path)}</span>
        <div class="result-actions">
            <i class="fas fa-folder-open action-btn" data-path="${escapeHTML(path)}" data-action="folder" title="Open Containing Folder"></i>
            <i class="fas fa-file-alt action-btn" data-path="${escapeHTML(path)}" data-action="file" title="Open File"></i>
        </div>`;
    resultsDiv.appendChild(item); resultsDiv.scrollTop = resultsDiv.scrollHeight;
}

function renderResults(results) {
    resultsDiv.innerHTML = '';
    if (results && results.length > 0) {
        results.forEach(path => { appendSingleResult(path); });
        exportButton.classList.remove('hidden');
    } else {
         if (resultsDiv.textContent.startsWith('>')) { resultsDiv.textContent = '> NO MATCHING ITEMS FOUND.'; }
    }
}

function appendLog(html, clear = false) {
    if (clear) { logDiv.innerHTML = ''; logProgressElement = null; }
    const logItem = document.createElement('div');
    logItem.innerHTML = html; logDiv.appendChild(logItem); logDiv.scrollTop = logDiv.scrollHeight;
}

function updateScanProgress(data) {
    if (!logProgressElement) { logProgressElement = document.createElement('div'); logDiv.appendChild(logProgressElement); }
    logProgressElement.innerHTML = `<div>> SCANNING... [ITEMS: ${data.progress.scanned} | MATCHES: ${data.progress.found}]</div>`;
}

function stopSearch() {
    if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    appendLog('<span class="status-error">> SCAN MANUALLY TERMINATED.</span>');
    stopButton.disabled = true; const stopButtonSpan = stopButton.querySelector('span');
    if(stopButtonSpan) stopButtonSpan.textContent = 'TERMINATED';
    finishSound.play().catch(error => console.error("Audio playback failed:", error));
}

function exportToHTML() {
    const now = new Date(); const reportDate = now.toLocaleString();
    let htmlContent = `<!DOCTYPE html><html><head><title>Search Report</title></head><body><h1>Report</h1><p>Generated: ${reportDate}</p><ul>${searchResults.map(file => `<li>${escapeHTML(file)}</li>`).join('')}</ul></body></html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Precision File Search-report-${now.getTime()}.html`;
    a.click(); URL.revokeObjectURL(url);
}

function populateForm(data) {
    if (!data) return;
    document.getElementById('search_path').value = data.search_path || '';
    document.getElementById('keywords').value = (data.keywords || []).join(', ');
    document.querySelector(`input[name="search_type"][value="${data.search_type || 'file_content'}"]`).checked = true;
    document.getElementById('case_sensitive').checked = data.case_sensitive || false;
    document.getElementById('use_regex').checked = data.use_regex || false;
    includeDotFoldersCheckbox.checked = data.include_dot_folders || false;
    document.getElementById('file_category').value = data.file_category || '';
    const sizeFields = { min: data.min_size, max: data.max_size };
    for (const [prefix, bytes] of Object.entries(sizeFields)) {
        const valueEl = document.getElementById(`${prefix}_size_value`);
        const unitEl = document.getElementById(`${prefix}_size_unit`);
        if (bytes) {
            if (bytes >= 1024**3) { valueEl.value = bytes / 1024**3; unitEl.value = 'GB'; }
            else if (bytes >= 1024**2) { valueEl.value = bytes / 1024**2; unitEl.value = 'MB'; }
            else { valueEl.value = bytes / 1024; unitEl.value = 'KB'; }
        } else { valueEl.value = ''; }
    }
    document.querySelector('input[name="search_type"]:checked').dispatchEvent(new Event('change'));
}

function loadSavedSearches() {
    const searches = JSON.parse(localStorage.getItem('savedSearches') || '{}');
    const names = Object.keys(searches); savedSearchesContainer.style.display = 'block';
    if (names.length > 0) {
        savedSearchesSelect.innerHTML = names.map(name => `<option value="${name}">${escapeHTML(name)}</option>`).join('');
        loadSearchButton.disabled = false; deleteSearchButton.disabled = false; savedSearchesSelect.disabled = false;
    } else {
        const option = `<option value="" disabled selected>${currentTranslations['noSavedSearches'] || 'No saved searches'}</option>`;
        savedSearchesSelect.innerHTML = option; loadSearchButton.disabled = true;
        deleteSearchButton.disabled = true; savedSearchesSelect.disabled = true;
    }
}

function saveCurrentSearch() {
    const name = prompt("Enter a name for this search:"); if (!name) return;
    const searches = JSON.parse(localStorage.getItem('savedSearches') || '{}');
    searches[name] = buildSearchPayload(); localStorage.setItem('savedSearches', JSON.stringify(searches));
    loadSavedSearches();
}

function loadSelectedSearch() {
    const searches = JSON.parse(localStorage.getItem('savedSearches') || '{}');
    const search = searches[savedSearchesSelect.value]; populateForm(search);
}

function deleteSelectedSearch() {
    const name = savedSearchesSelect.value;
    if (!name || !confirm(`Are you sure you want to delete "${name}"?`)) return;
    const searches = JSON.parse(localStorage.getItem('savedSearches') || '{}');
    delete searches[name]; localStorage.setItem('savedSearches', JSON.stringify(searches));
    loadSavedSearches();
}

function loadSearchHistory() {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    searchHistoryList.innerHTML = '';
    if (history.length > 0) {
        searchHistoryContainer.style.display = 'block';
        history.forEach((item, index) => {
            const div = document.createElement('div'); div.className = 'history-item';
            div.dataset.historyIndex = index; const textSpan = document.createElement('span');
            textSpan.className = 'history-item-text';
            textSpan.textContent = `${item.keywords.join(', ')} in ${item.search_path.substring(item.search_path.lastIndexOf('\\') + 1)}`;
            textSpan.title = `Search for "${item.keywords.join(', ')}" in "${item.search_path}"`;
            const deleteBtn = document.createElement('i');
            deleteBtn.className = 'fas fa-times-circle history-delete-btn';
            deleteBtn.title = 'Delete this history item';
            div.appendChild(textSpan); div.appendChild(deleteBtn);
            searchHistoryList.appendChild(div);
        });
    } else { searchHistoryContainer.style.display = 'none'; }
}

function addSearchToHistory(payload) {
    let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    history.unshift(payload); history = history.slice(0, MAX_HISTORY);
    localStorage.setItem('searchHistory', JSON.stringify(history)); loadSearchHistory();
}

// 8. SETTINGS MANAGEMENT ########################################################################################
function loadAndApplySettings(defaults) {
    document.getElementById('excluded_folders').value = (defaults?.excluded_folders || []).join(', ');
    document.getElementById('file_extensions').value = (defaults?.file_extensions || []).join(', ');

    const llmConfig = defaults?.llm_config || {};
    llmApiKeyInput.value = llmConfig.api_key || '';
    llmModelNameInput.value = llmConfig.model_name || '';
    llmBaseUrlInput.value = llmConfig.base_url || '';

    const qdrantConfig = defaults?.vectordb?.qdrant || {};
    document.getElementById('qds_path').value = qdrantConfig.storage_path || 'qds';
    document.getElementById('qdrant_collection_name').value = qdrantConfig.collection_name || 'precision_search_kb';

    // --- UPDATED: Set UI-level default model names ---
    embeddingModelNameInput.value = defaults?.embedding_model?.model_name || 'sentence-transformers/all-MiniLM-L6-v2';
    rerankerModelNameInput.value = defaults?.reranker_model?.model_name || '';
    // --- END OF UPDATE ---

    const retrievalParams = defaults?.retrieval_params || {};
    const kFetch = localStorage.getItem('k_fetch_initial') || retrievalParams.k_fetch_initial || '50';
    const vecScore = localStorage.getItem('vector_score_threshold') || retrievalParams.vector_score_threshold || '0.3';
    const vecTopN = localStorage.getItem('vector_top_n') || retrievalParams.vector_top_n || '10';
    const rerankTopN = localStorage.getItem('rerank_top_n') || retrievalParams.rerank_top_n || '10';
    const rerankScore = localStorage.getItem('rerank_score_threshold') || retrievalParams.rerank_score_threshold || '0.5';

    document.getElementById('k_fetch_initial').value = kFetch;
    vectorScoreThresholdInput.value = vecScore;
    vectorTopNInput.value = vecTopN;
    document.getElementById('rerank_top_n').value = rerankTopN;
    document.getElementById('rerank_score_threshold').value = rerankScore;

    const quickKFetchValue = document.getElementById('quick_k_fetch_initial_value');
    const quickVectorScoreThresholdValue = document.getElementById('quick_vector_score_threshold_value');
    const quickVectorTopNValue = document.getElementById('quick_vector_top_n_value');
    const quickTopNValue = document.getElementById('quick_rerank_top_n_value');
    const quickScoreThresholdValue = document.getElementById('quick_rerank_score_threshold_value');

    quickKFetch.value = kFetch; quickKFetchValue.textContent = kFetch;
    quickVectorScoreThreshold.value = vecScore; quickVectorScoreThresholdValue.textContent = vecScore;
    quickVectorTopN.value = vecTopN; quickVectorTopNValue.textContent = vecTopN;
    quickTopN.value = rerankTopN; quickTopNValue.textContent = rerankTopN;
    quickScoreThreshold.value = rerankScore; quickScoreThresholdValue.textContent = rerankScore;
}

async function saveSettings() {
    saveSettingsButton.disabled = true;
    saveSettingsButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SAVING...';

    localStorage.setItem('k_fetch_initial', document.getElementById('k_fetch_initial').value);
    localStorage.setItem('vector_score_threshold', vectorScoreThresholdInput.value);
    localStorage.setItem('vector_top_n', vectorTopNInput.value);
    localStorage.setItem('rerank_top_n', document.getElementById('rerank_top_n').value);
    localStorage.setItem('rerank_score_threshold', document.getElementById('rerank_score_threshold').value);
    localStorage.setItem('enableReranker', enableRerankerSetting.checked);

    const excludedFolders = document.getElementById('excluded_folders').value.split(',').map(f => f.trim()).filter(Boolean);
    const fileExtensions = document.getElementById('file_extensions').value.split(',').map(e => e.trim()).filter(Boolean);
    const enableReranker = enableRerankerSetting.checked;
    const llmConfig = { api_key: llmApiKeyInput.value, model_name: llmModelNameInput.value, base_url: llmBaseUrlInput.value };
    const embeddingModel = { model_name: embeddingModelNameInput.value.trim() };
    const rerankerModel = { model_name: rerankerModelNameInput.value.trim() };

    try {
        const response = await fetch('/api/config', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                excluded_folders: excludedFolders, file_extensions: fileExtensions, enable_reranker: enableReranker,
                llm_config: llmConfig, embedding_model: embeddingModel, reranker_model: rerankerModel
            })
        });
        if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
        const result = await response.json();
        if (result.status === 'success') {
            saveSettingsButton.innerHTML = '<i class="fas fa-check"></i> SAVED!';
            alert("Settings saved! Note: Changes to Models, DB paths, or the default Reranker state require an application restart to take effect.");
        } else { throw new Error(result.message || 'Failed to save.'); }
    } catch (error) {
        console.error('Error saving settings:', error);
        saveSettingsButton.innerHTML = '<i class="fas fa-times"></i> ERROR';
    } finally {
        setTimeout(() => {
            const saveBtnSpan = saveSettingsButton.querySelector('span');
            const btnText = currentTranslations.settingsSaveButton || 'SAVE ALL SETTINGS';
            saveSettingsButton.innerHTML = `<i class="fas fa-save"></i> <span>${btnText}</span>`;
            saveSettingsButton.disabled = false;
        }, 3000);
    }
}

async function resetSettings() {
    const confirmationText = currentTranslations.resetSettingsConfirmation || "Are you sure you want to reset all settings to their default values? This action cannot be undone.";
    if (!confirm(confirmationText)) return;
    try {
        const response = await fetch('/api/config/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        if (!response.ok) { const error = await response.json(); throw new Error(error.detail || 'Failed to reset settings.'); }
        const result = await response.json();
        if (result.status === 'success') {
            alert(currentTranslations.resetSuccessAlert || "Settings have been reset to default. Please restart the application for all changes to take effect.");
            window.location.reload();
        } else { throw new Error(result.message || 'An unknown error occurred.'); }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// 9. EVENT LISTENERS ############################################################################################
searchViewBtn.addEventListener('click', () => switchView('search'));
aiSearchViewBtn.addEventListener('click', () => switchView('ai_search'));
semanticViewBtn.addEventListener('click', () => switchView('semantic'));
classifierViewBtn.addEventListener('click', () => switchView('classifier'));
settingsViewBtn.addEventListener('click', () => switchView('settings'));
aboutViewBtn.addEventListener('click', () => switchView('about'));
saveSettingsButton.addEventListener('click', saveSettings);
resetSettingsButton.addEventListener('click', resetSettings);
searchForm.addEventListener('submit', (event) => { event.preventDefault(); startSearch(); });
stopButton.addEventListener('click', stopSearch);
newSearchButton.addEventListener('click', resetUIForNewSearch);
searchTypeRadios.forEach(radio => radio.addEventListener('change', (e) => {
    const isFolderSearch = e.target.value === 'folder_name';
    categorySelectorContainer.classList.toggle('hidden', e.target.value !== 'file_category');
    sizeFilterContainer.querySelectorAll('input, select').forEach(el => el.disabled = isFolderSearch);
    sizeFilterContainer.classList.toggle('disabled', isFolderSearch);
}));
resultsDiv.addEventListener('click', async (event) => {
    const button = event.target.closest('.action-btn');
    if (!button) return;
    await fetch('/api/open', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: button.dataset.path, action: button.dataset.action })
    });
});
saveSearchButton.addEventListener('click', saveCurrentSearch);
loadSearchButton.addEventListener('click', loadSelectedSearch);
deleteSearchButton.addEventListener('click', deleteSelectedSearch);
searchHistoryList.addEventListener('click', (event) => {
    const historyItem = event.target.closest('.history-item');
    if (!historyItem) return;
    const deleteBtn = event.target.closest('.history-delete-btn');
    if (deleteBtn) {
        event.stopPropagation(); const index = historyItem.dataset.historyIndex;
        let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        history.splice(index, 1);
        localStorage.setItem('searchHistory', JSON.stringify(history)); loadSearchHistory();
    } else {
        const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        const searchData = history[historyItem.dataset.historyIndex];
        populateForm(searchData);
    }
});
exportButton.addEventListener('click', exportToHTML);

startClassificationButton.addEventListener('click', startClassification);
organizeAllButton.addEventListener('click', handleOrganizeAll);
resultsAccordion.addEventListener('click', handleClassifierAccordionClick);
aiSearchForm.addEventListener('submit', performAISearch);
startIndexingButton.addEventListener('click', startIndexing);
semanticSearchForm.addEventListener('submit', performSemanticSearch);
semanticResultsDiv.addEventListener('click', handleSemanticResultsClick);
aiResultsDiv.addEventListener('click', handleAIResultsClick);
startTrainingButton.addEventListener('click', startTraining);
testSizeSlider.addEventListener('input', () => {
    testSizeValueSpan.textContent = `${Math.round(testSizeSlider.value * 100)}%`;
});

// 10. UI SYNCHRONIZATION LOGIC ##################################################################################
function setupSliderSync(sliderEl, valueEl, settingsInputEl, storageKey) {
    sliderEl.addEventListener('input', () => {
        const value = sliderEl.value;
        valueEl.textContent = value;
        settingsInputEl.value = value;
        localStorage.setItem(storageKey, value);
    });
    settingsInputEl.addEventListener('change', () => {
        const value = settingsInputEl.value;
        sliderEl.value = value;
        valueEl.textContent = value;
        localStorage.setItem(storageKey, value);
    });
}

const quickKFetchValue = document.getElementById('quick_k_fetch_initial_value');
const quickVectorScoreThresholdValue = document.getElementById('quick_vector_score_threshold_value');
const quickVectorTopNValue = document.getElementById('quick_vector_top_n_value');
const quickScoreThresholdValue = document.getElementById('quick_rerank_score_threshold_value');
const quickTopNValue = document.getElementById('quick_rerank_top_n_value');

setupSliderSync(quickKFetch, quickKFetchValue, document.getElementById('k_fetch_initial'), 'k_fetch_initial');
setupSliderSync(quickVectorScoreThreshold, quickVectorScoreThresholdValue, vectorScoreThresholdInput, 'vector_score_threshold');
setupSliderSync(quickVectorTopN, quickVectorTopNValue, vectorTopNInput, 'vector_top_n');
setupSliderSync(quickScoreThreshold, quickScoreThresholdValue, document.getElementById('rerank_score_threshold'), 'rerank_score_threshold');
setupSliderSync(quickTopN, quickTopNValue, document.getElementById('rerank_top_n'), 'rerank_top_n');

aiTemperatureSlider.addEventListener('input', () => {
    aiTemperatureValue.textContent = aiTemperatureSlider.value;
    localStorage.setItem('ai_temperature', aiTemperatureSlider.value);
});
aiMaxTokensSlider.addEventListener('input', () => {
    aiMaxTokensValue.textContent = aiMaxTokensSlider.value;
    localStorage.setItem('ai_max_tokens', aiMaxTokensSlider.value);
});

function syncRerankerToggles(source) {
    const isEnabled = source.checked;
    enableRerankerToggle.checked = isEnabled;
    enableRerankerSetting.checked = isEnabled;
    rerankerOptionsDiv.classList.toggle('disabled', !isEnabled);
    localStorage.setItem('enableReranker', isEnabled);
}

enableRerankerToggle.addEventListener('change', (e) => syncRerankerToggles(e.target));
enableRerankerSetting.addEventListener('change', (e) => syncRerankerToggles(e.target));

// 11. APP START #################################################################################################
initialLoad();
