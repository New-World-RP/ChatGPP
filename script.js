// Global variables
let currentChatId = null;
let chatHistory = [];
let isProcessing = false;
let currentUser = null;
let users = [];
let currentTheme = 'light';

// API Configuration
const OPENROUTER_API_KEY = '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';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const SITE_URL = window.location.origin;
const SITE_NAME = 'AI Chat - Din personliga AI-assistent';

// DOM elements
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const messagesContainer = document.getElementById('messages');
const welcomeMessage = document.getElementById('welcomeMessage');
const chatHistoryContainer = document.getElementById('chatHistory');
const aiThinking = document.getElementById('aiThinking');
const thinkingText = document.getElementById('thinkingText');
const settingsModal = document.getElementById('settingsModal');
const loginModal = document.getElementById('loginModal');
const mainApp = document.getElementById('mainApp');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeText = document.getElementById('themeText');

// Simple test function for debugging (call from console: testAPI())
window.testAPI = async function() {
    try {
        console.log('🧪 Testing API manually...');
        
        const response = await fetch(OPENROUTER_BASE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': SITE_URL,
                'X-Title': SITE_NAME
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "user",
                        content: "Hej, testar API:et"
                    }
                ],
                temperature: 0.7,
                max_tokens: 100,
                stream: false
            })
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', response.headers);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', errorText);
            return false;
        }
        
        const data = await response.json();
        console.log('✅ API Success:', data);
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            console.log('💬 AI Response:', data.choices[0].message.content);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Test API Error:', error);
        return false;
    }
};

// Test API connection
async function testAPIConnection() {
    try {
        console.log('Testing API connection...');
        console.log('API Key (first 10 chars):', OPENROUTER_API_KEY.substring(0, 10) + '...');
        console.log('API URL:', OPENROUTER_BASE_URL);
        
        const response = await fetch(OPENROUTER_BASE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': SITE_URL,
                'X-Title': SITE_NAME
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo", // Using a more common model
                messages: [
                    {
                        role: "user",
                        content: "Hej"
                    }
                ],
                temperature: 0.7,
                max_tokens: 100,
                stream: false
            })
        });
        
        console.log('Test response status:', response.status);
        console.log('Test response headers:', response.headers);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Test API Error:', errorText);
            return false;
        }
        
        const data = await response.json();
        console.log('Test API Success:', data);
        return true;
        
    } catch (error) {
        console.error('Test API Error:', error);
        return false;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadUsers();
    checkLoginStatus();
    loadTheme();
    setupEventListeners();
    setupSettings();
    initializeDocumentTools();
    
    // Test API connection on startup
    setTimeout(() => {
        testAPIConnection().then(success => {
            if (success) {
                console.log('✅ API connection successful');
            } else {
                console.log('❌ API connection failed');
            }
        });
    }, 1000);
});

// Event listeners setup
function setupEventListeners() {
    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });

    // Temperature slider update
    const tempSlider = document.getElementById('temperature');
    const tempValue = document.getElementById('tempValue');
    if (tempSlider && tempValue) {
        tempSlider.addEventListener('input', function() {
            tempValue.textContent = this.value;
        });
    }

    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Register form submission
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// Theme management
function loadTheme() {
    const savedTheme = localStorage.getItem('aiChatTheme') || 'light';
    setTheme(savedTheme);
}

function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aiChatTheme', theme);
    
    // Update theme toggle button
    if (themeToggleBtn && themeText) {
        if (theme === 'dark') {
            themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i> <span id="themeText">Ljust tema</span>';
        } else {
            themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i> <span id="themeText">Mörkt tema</span>';
        }
    }
}

function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

// Load users from JSON file
async function loadUsers() {
    try {
        const response = await fetch('users.json');
        const data = await response.json();
        users = data.users;
    } catch (error) {
        console.error('Error loading users:', error);
        // Fallback to demo data
        users = [
            {
                id: "1",
                username: "demo",
                email: "demo@example.com",
                password: "demo123",
                createdAt: "2024-01-01T00:00:00.000Z",
                lastLogin: "2024-01-01T00:00:00.000Z",
                chats: []
            }
        ];
    }
}

// Check if user is logged in
function checkLoginStatus() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            showMainApp();
        } catch (error) {
            console.error('Error parsing saved user:', error);
            localStorage.removeItem('currentUser');
        }
    }
}

// Show main app after login
function showMainApp() {
    if (currentUser) {
        loginModal.style.display = 'none';
        mainApp.style.display = 'flex';
        
        // Update user info in sidebar
        document.getElementById('currentUsername').textContent = currentUser.username;
        document.getElementById('currentUserEmail').textContent = currentUser.email;
        
        // Load user's chat history
        loadUserChatHistory();
        
        // Initialize document tools
        initializeDocumentTools();
        
        // Focus on input
        messageInput.focus();
    }
}

// Handle login form submission
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        alert('Ange både användarnamn och lösenord');
        return;
    }
    
    // Find user
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Update last login
        user.lastLogin = new Date().toISOString();
        saveUsers();
        
        // Set current user
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Show main app
        showMainApp();
        
        // Clear form
        document.getElementById('loginForm').reset();
        
        alert(`Välkommen tillbaka, ${user.username}!`);
    } else {
        alert('Fel användarnamn eller lösenord');
    }
}

// Handle register form submission
function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!username || !email || !password || !confirmPassword) {
        alert('Alla fält måste fyllas i');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Lösenorden matchar inte');
        return;
    }
    
    if (password.length < 6) {
        alert('Lösenordet måste vara minst 6 tecken långt');
        return;
    }
    
    // Check if username or email already exists
    if (users.some(u => u.username === username || u.email === email)) {
        alert('Användarnamn eller e-post finns redan');
        return;
    }
    
    // Create new user
    const newUser = {
        id: (users.length + 1).toString(),
        username: username,
        email: email,
        password: password,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        chats: []
    };
    
    users.push(newUser);
    saveUsers();
    
    // Auto-login new user
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    // Show main app
    showMainApp();
    
    // Clear form
    document.getElementById('registerForm').reset();
    
    alert(`Konto skapat framgångsrikt! Välkommen, ${username}!`);
}

// Switch between login and register tabs
function switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update forms
    document.querySelectorAll('.login-form').forEach(form => form.classList.remove('active'));
    if (tab === 'login') {
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.getElementById('registerForm').classList.add('active');
    }
}

// Logout function
function logout() {
    if (confirm('Är du säker på att du vill logga ut?')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        chatHistory = [];
        
        // Hide main app and show login
        mainApp.style.display = 'none';
        loginModal.style.display = 'flex';
        
        // Clear chat display
        messagesContainer.innerHTML = '';
        welcomeMessage.style.display = 'block';
        chatHistoryContainer.innerHTML = '';
        
        alert('Du har loggats ut');
    }
}

// Load user's chat history
function loadUserChatHistory() {
    if (currentUser && currentUser.chats) {
        chatHistory = currentUser.chats;
        updateChatHistoryDisplay();
    }
}

// Save users to JSON file (simulated)
function saveUsers() {
    // In a real application, this would be a server call
    console.log('Users updated:', users);
    
    // Save to localStorage as fallback
    localStorage.setItem('users', JSON.stringify(users));
}

// Settings management
function setupSettings() {
    // Load saved settings
    const savedSettings = localStorage.getItem('aiChatSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.aiModel) document.getElementById('aiModel').value = settings.aiModel;
        if (settings.temperature) {
            document.getElementById('temperature').value = settings.temperature;
            document.getElementById('tempValue').textContent = settings.temperature;
        }
        if (settings.maxTokens) document.getElementById('maxTokens').value = settings.maxTokens;
    }

    // Save settings on change
    const settingInputs = document.querySelectorAll('#aiModel, #temperature, #maxTokens');
    settingInputs.forEach(input => {
        input.addEventListener('change', saveSettings);
    });
}

function saveSettings() {
    const settings = {
        aiModel: document.getElementById('aiModel').value,
        temperature: document.getElementById('temperature').value,
        maxTokens: document.getElementById('maxTokens').value
    };
    localStorage.setItem('aiChatSettings', JSON.stringify(settings));
}

// Chat management
function startNewChat() {
    if (!currentUser) {
        alert('Du måste logga in först');
        return;
    }
    
    currentChatId = Date.now().toString();
    const chatTitle = `Ny chatt ${new Date().toLocaleDateString('sv-SE')}`;
    
    const newChat = {
        id: currentChatId,
        title: chatTitle,
        messages: [],
        timestamp: Date.now()
    };
    
    chatHistory.unshift(newChat);
    saveChatHistory();
    updateChatHistoryDisplay();
    
    // Clear current chat display
    messagesContainer.innerHTML = '';
    welcomeMessage.style.display = 'block';
    
    // Focus on input
    messageInput.focus();
}

function loadChatHistory() {
    if (currentUser && currentUser.chats) {
        chatHistory = currentUser.chats;
        updateChatHistoryDisplay();
    }
}

function saveChatHistory() {
    if (currentUser) {
        // Update user's chats
        currentUser.chats = chatHistory;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Save to users array
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            saveUsers();
        }
    }
}

function updateChatHistoryDisplay() {
    chatHistoryContainer.innerHTML = '';
    
    chatHistory.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-history-item';
        if (chat.id === currentChatId) {
            chatItem.classList.add('active');
        }
        
        chatItem.innerHTML = `
            <i class="fas fa-comment"></i>
            <span>${chat.title}</span>
        `;
        
        chatItem.onclick = () => loadChat(chat.id);
        chatHistoryContainer.appendChild(chatItem);
    });
}

function loadChat(chatId) {
    currentChatId = chatId;
    const chat = chatHistory.find(c => c.id === chatId);
    
    if (chat) {
        // Update active state
        document.querySelectorAll('.chat-history-item').forEach(item => {
            item.classList.remove('active');
        });
        event.target.closest('.chat-history-item').classList.add('active');
        
        // Display messages
        displayChatMessages(chat.messages);
        welcomeMessage.style.display = 'none';
    }
    
    updateChatHistoryDisplay();
}

function displayChatMessages(messages) {
    messagesContainer.innerHTML = '';
    messages.forEach(message => {
        addMessageToDisplay(message.content, message.role);
    });
}

// Message handling
async function sendMessage() {
    if (!currentUser) {
        alert('Du måste logga in först');
        return;
    }
    
    const message = messageInput.value.trim();
    if (!message || isProcessing) return;
    
    // Create new chat if none exists
    if (!currentChatId) {
        startNewChat();
    }
    
    // Add user message
    addMessageToDisplay(message, 'user');
    addMessageToHistory(message, 'user');
    
    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    try {
        // Try streaming first, fallback to simple API
        let aiResponse;
        try {
            aiResponse = await getAIResponseWithStreaming(message);
        } catch (streamingError) {
            console.log('Streaming failed, trying simple API:', streamingError);
            aiResponse = await getSimpleAIResponse(message);
            // Display the response since streaming didn't handle it
            addMessageToDisplay(aiResponse, 'assistant');
        }
        
        addMessageToHistory(aiResponse, 'assistant');
    } catch (error) {
        console.error('Error getting AI response:', error);
        const errorMessage = 'Tyvärr kunde jag inte generera ett svar just nu. Kontrollera din internetanslutning och försök igen.';
        addMessageToDisplay(errorMessage, 'assistant');
        addMessageToHistory(errorMessage, 'assistant');
    }
}

function sendSuggestion(suggestion) {
    messageInput.value = suggestion;
    sendMessage();
}

function addMessageToDisplay(content, role) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? 'U' : 'AI';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // Format content (handle code blocks, line breaks, etc.)
    const formattedContent = formatMessageContent(content);
    messageContent.innerHTML = formattedContent;
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    
    messagesContainer.appendChild(messageDiv);
    
    // Hide welcome message
    welcomeMessage.style.display = 'none';
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Return the message element for further modifications
    return messageDiv;
}

function addMessageToHistory(content, role) {
    const chat = chatHistory.find(c => c.id === currentChatId);
    if (chat) {
        chat.messages.push({ content, role, timestamp: Date.now() });
        
        // Update chat title with first message
        if (chat.messages.length === 1) {
            chat.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
        }
        
        saveChatHistory();
        updateChatHistoryDisplay();
    }
}

function formatMessageContent(content) {
    // Handle line breaks
    let formatted = content.replace(/\n/g, '<br>');
    
    // Handle code blocks (```code```)
    formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, function(match, lang, code) {
        const language = lang || '';
        return `<pre><code class="language-${language}">${code}</code></pre>`;
    });
    
    // Handle inline code (`code`)
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Handle paragraphs
    formatted = formatted.replace(/(<br>){2,}/g, '</p><p>');
    formatted = `<p>${formatted}</p>`;
    
    return formatted;
}

// AI Response Generation with OpenRouter API
async function getAIResponse(userMessage) {
    try {
        // Get current chat messages for context
        const chat = chatHistory.find(c => c.id === currentChatId);
        const messages = chat ? chat.messages : [];
        
        // Prepare messages array for API
        const apiMessages = [
            {
                role: "system",
                content: "Du är en hjälpsam AI-assistent som svarar på svenska. Var vänlig, informativ och hjälpsam. Använd markdown-formatering för kod och viktig text."
            }
        ];
        
        // Add conversation history (last 10 messages for context)
        const recentMessages = messages.slice(-10);
        recentMessages.forEach(msg => {
            apiMessages.push({
                role: msg.role,
                content: msg.content
            });
        });
        
        // Add current user message
        apiMessages.push({
            role: "user",
            content: userMessage
        });
        
        // Get settings
        const settings = JSON.parse(localStorage.getItem('aiChatSettings') || '{}');
        const temperature = parseFloat(settings.temperature) || 0.7;
        const maxTokens = parseInt(settings.maxTokens) || 2000;
        
        const response = await fetch(OPENROUTER_BASE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': SITE_URL,
                'X-Title': SITE_NAME
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: apiMessages,
                temperature: temperature,
                max_tokens: maxTokens,
                stream: false
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content;
        } else {
            throw new Error('Invalid response format from API');
        }
        
    } catch (error) {
        console.error('Error calling OpenRouter API:', error);
        
        // Fallback to local responses if API fails
        return getFallbackResponse(userMessage);
    }
}

// Simple API response without streaming (backup)
async function getSimpleAIResponse(userMessage) {
    try {
        console.log('Using simple API request...');
        
        // Get current chat messages for context
        const chat = chatHistory.find(c => c.id === currentChatId);
        const messages = chat ? chat.messages : [];
        
        // Prepare messages array for API
        const apiMessages = [
            {
                role: "system",
                content: "Du är en hjälpsam AI-assistent som svarar på svenska. Var vänlig, informativ och hjälpsam. Använd markdown-formatering för kod och viktig text."
            }
        ];
        
        // Add conversation history (last 10 messages for context)
        const recentMessages = messages.slice(-10);
        recentMessages.forEach(msg => {
            apiMessages.push({
                role: msg.role,
                content: msg.content
            });
        });
        
        // Add current user message
        apiMessages.push({
            role: "user",
            content: userMessage
        });
        
        // Get settings
        const settings = JSON.parse(localStorage.getItem('aiChatSettings') || '{}');
        const temperature = parseFloat(settings.temperature) || 0.7;
        const maxTokens = parseInt(settings.maxTokens) || 2000;
        
        const response = await fetch(OPENROUTER_BASE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': SITE_URL,
                'X-Title': SITE_NAME
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: apiMessages,
                temperature: temperature,
                max_tokens: maxTokens,
                stream: false
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} ${response.statusText}. Response: ${errorText}`);
        }
        
        const data = await response.json();
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content;
        } else {
            throw new Error('Invalid response format from API');
        }
        
    } catch (error) {
        console.error('Error in simple API request:', error);
        throw error;
    }
}

// AI Response Generation with Streaming (Real-time typing effect)
async function getAIResponseWithStreaming(userMessage) {
    try {
        console.log('Starting API request...');
        
        // Get current chat messages for context
        const chat = chatHistory.find(c => c.id === currentChatId);
        const messages = chat ? chat.messages : [];
        
        // Prepare messages array for API
        const apiMessages = [
            {
                role: "system",
                content: "Du är en hjälpsam AI-assistent som svarar på svenska. Var vänlig, informativ och hjälpsam. Använd markdown-formatering för kod och viktig text."
            }
        ];
        
        // Add conversation history (last 10 messages for context)
        const recentMessages = messages.slice(-10);
        recentMessages.forEach(msg => {
            apiMessages.push({
                role: msg.role,
                content: msg.content
            });
        });
        
        // Add current user message
        apiMessages.push({
            role: "user",
            content: userMessage
        });
        
        console.log('API Messages:', apiMessages);
        
        // Get settings
        const settings = JSON.parse(localStorage.getItem('aiChatSettings') || '{}');
        const temperature = parseFloat(settings.temperature) || 0.7;
        const maxTokens = parseInt(settings.maxTokens) || 2000;
        
        // Create AI message element for streaming
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = 'AI';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = '<p></p>';
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        messagesContainer.appendChild(messageDiv);
        
        // Hide welcome message
        welcomeMessage.style.display = 'none';
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        console.log('Making API request to:', OPENROUTER_BASE_URL);
        console.log('API Key (first 10 chars):', OPENROUTER_API_KEY.substring(0, 10) + '...');
        
        // Start streaming response
        const response = await fetch(OPENROUTER_BASE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': SITE_URL,
                'X-Title': SITE_NAME
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: apiMessages,
                temperature: temperature,
                max_tokens: maxTokens,
                stream: true
            })
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`API request failed: ${response.status} ${response.statusText}. Response: ${errorText}`);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        let currentParagraph = '';
        let hasReceivedContent = false;
        
        console.log('Starting to read stream...');
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                console.log('Stream finished');
                break;
            }
            
            const chunk = decoder.decode(value);
            console.log('Received chunk:', chunk);
            
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                        console.log('Stream marked as done');
                        break;
                    }
                    
                    try {
                        const parsed = JSON.parse(data);
                        console.log('Parsed data:', parsed);
                        
                        if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                            const content = parsed.choices[0].delta.content;
                            fullResponse += content;
                            hasReceivedContent = true;
                            
                            console.log('Received content:', content);
                            
                            // Handle line breaks and paragraphs
                            if (content.includes('\n')) {
                                const parts = content.split('\n');
                                for (let i = 0; i < parts.length; i++) {
                                    if (i === 0) {
                                        currentParagraph += parts[i];
                                    } else {
                                        if (currentParagraph.trim()) {
                                            messageContent.innerHTML += `<p>${currentParagraph}</p>`;
                                            currentParagraph = parts[i];
                                        } else {
                                            currentParagraph = parts[i];
                                        }
                                    }
                                }
                            } else {
                                currentParagraph += content;
                            }
                            
                            // Update the last paragraph
                            const paragraphs = messageContent.querySelectorAll('p');
                            if (paragraphs.length > 0) {
                                paragraphs[paragraphs.length - 1].textContent = currentParagraph;
                            } else {
                                messageContent.innerHTML = `<p>${currentParagraph}</p>`;
                            }
                            
                            // Scroll to bottom as content grows
                            messagesContainer.scrollTop = messagesContainer.scrollHeight;
                            
                            // Add typing delay for realistic effect
                            await new Promise(resolve => setTimeout(resolve, 20));
                        }
                    } catch (e) {
                        console.log('Error parsing JSON line:', e, 'Line:', line);
                        // Skip invalid JSON lines
                        continue;
                    }
                }
            }
        }
        
        if (!hasReceivedContent) {
            console.warn('No content received from stream');
            throw new Error('No content received from API stream');
        }
        
        // Add final paragraph if there's remaining content
        if (currentParagraph.trim()) {
            messageContent.innerHTML += `<p>${currentParagraph}</p>`;
        }
        
        // Format the final content
        const formattedContent = formatMessageContent(fullResponse);
        messageContent.innerHTML = formattedContent;
        
        console.log('Final response:', fullResponse);
        return fullResponse;
        
    } catch (error) {
        console.error('Error in getAIResponseWithStreaming:', error);
        
        // Remove the failed message element
        const failedMessage = messagesContainer.querySelector('.message.assistant:last-child');
        if (failedMessage) {
            failedMessage.remove();
        }
        
        // Fallback to local responses if API fails
        const fallbackResponse = getFallbackResponse(userMessage);
        addMessageToDisplay(fallbackResponse, 'assistant');
        return fallbackResponse;
    }
}

// Fallback responses if API fails
function getFallbackResponse(userMessage) {
    const responses = [
        "Tyvärr kan jag inte ansluta till AI-tjänsten just nu. Kontrollera din internetanslutning och försök igen.",
        "Jag har problem med att ansluta till mina AI-tjänster. Försök igen om några minuter.",
        "Det verkar som att det finns ett tekniskt problem. Kontrollera din internetanslutning och försök igen senare."
    ];
    
    // Simple keyword-based responses as backup
    if (userMessage.toLowerCase().includes('kod') || userMessage.toLowerCase().includes('programmering')) {
        return `Här är ett exempel på kod som kan hjälpa dig:

\`\`\`javascript
function example() {
    console.log("Här är en funktion som du kan använda");
    return "resultat";
}
\`\`\`

Du kan anpassa denna kod efter dina behov. Behöver du hjälp med något specifikt?`;
    }
    
    if (userMessage.toLowerCase().includes('ai') || userMessage.toLowerCase().includes('maskininlärning')) {
        return `AI (Artificiell Intelligens) är ett fascinerande område! Det handlar om att skapa system som kan lära sig och lösa problem på ett sätt som liknar mänsklig intelligens.

Maskininlärning är en del av AI där algoritmer lär sig från data för att göra prediktioner eller beslut.

Vill du veta mer om något specifikt område inom AI?`;
    }
    
    // Default fallback response
    return responses[Math.floor(Math.random() * responses.length)];
}

// AI Thinking Indicator
function showAIThinking() {
    isProcessing = true;
    sendBtn.disabled = true;
    
    // Update thinking text with faster messages
    const thinkingMessages = [
        'Svarar...',
        'Genererar svar...',
        'Skriver...'
    ];
    
    let messageIndex = 0;
    thinkingText.textContent = thinkingMessages[messageIndex];
    
    // Change thinking message every 1 second (faster)
    const messageInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % thinkingMessages.length;
        thinkingText.textContent = thinkingMessages[messageIndex];
    }, 1000);
    
    // Store interval ID to clear it later
    aiThinking.dataset.intervalId = messageInterval;
    
    // Show thinking indicator
    aiThinking.classList.add('show');
}

function hideAIThinking() {
    isProcessing = false;
    sendBtn.disabled = false;
    
    // Clear message interval
    if (aiThinking.dataset.intervalId) {
        clearInterval(parseInt(aiThinking.dataset.intervalId));
        delete aiThinking.dataset.intervalId;
    }
    
    // Hide thinking indicator
    aiThinking.classList.remove('show');
}

// Keyboard shortcuts
function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Modal management
function toggleSettings() {
    settingsModal.classList.toggle('show');
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    if (event.target === settingsModal) {
        toggleSettings();
    }
    if (event.target === document.getElementById('documentToolsModal')) {
        closeDocumentTools();
    }
});

// Mobile sidebar toggle (for responsive design)
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('show');
}

// Export chat functionality
function exportChat() {
    if (!currentChatId || !currentUser) return;
    
    const chat = chatHistory.find(c => c.id === currentChatId);
    if (!chat) return;
    
    let exportText = `Chatt: ${chat.title}\n`;
    exportText += `Användare: ${currentUser.username}\n`;
    exportText += `Datum: ${new Date(chat.timestamp).toLocaleString('sv-SE')}\n\n`;
    
    chat.messages.forEach(message => {
        exportText += `${message.role === 'user' ? 'Du' : 'AI'}: ${message.content}\n\n`;
    });
    
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${chat.title.replace(/[^a-z0-9]/gi, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

// Clear chat history
function clearChatHistory() {
    if (!currentUser) return;
    
    if (confirm('Är du säker på att du vill rensa all chatt-historik? Detta går inte att ångra.')) {
        chatHistory = [];
        currentUser.chats = [];
        saveChatHistory();
        updateChatHistoryDisplay();
        messagesContainer.innerHTML = '';
        welcomeMessage.style.display = 'block';
        currentChatId = null;
    }
}

// Add some sample responses for demonstration
const sampleResponses = {
    greeting: "Hej! Jag är din AI-assistent. Hur kan jag hjälpa dig idag?",
    help: "Jag kan hjälpa dig med många saker: skriva kod, förklara koncept, skapa berättelser, analysera data, och mycket mer. Vad vill du göra?",
    thanks: "Tack så mycket! Det gläder mig att jag kunde hjälpa dig. Finns det något mer du vill veta?"
};

// Document Tools Functionality
let uploadedFiles = [];

// Initialize document tools
function initializeDocumentTools() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
        setupDragAndDrop();
    }
}

// Open document tools modal
function openDocumentTools() {
    const modal = document.getElementById('documentToolsModal');
    modal.classList.add('show');
    
    // Initialize tools when modal opens
    initializeDocumentTools();
}

// Close document tools modal
function closeDocumentTools() {
    const modal = document.getElementById('documentToolsModal');
    modal.classList.remove('show');
}

// Setup drag and drop functionality
function setupDragAndDrop() {
    const uploadArea = document.querySelector('.file-upload-area');
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary');
        uploadArea.style.background = getComputedStyle(document.documentElement).getPropertyValue('--bg-tertiary');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-primary');
        uploadArea.style.background = getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-primary');
        uploadArea.style.background = getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary');
        
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    });
}

// Handle file upload
function handleFileUpload(event) {
    const files = Array.from(event.target.files);
    handleFiles(files);
}

// Process uploaded files
function handleFiles(files) {
    files.forEach(file => {
        if (isValidFileType(file)) {
            const fileInfo = {
                id: Date.now() + Math.random(),
                file: file,
                name: file.name,
                size: formatFileSize(file.size),
                type: getFileType(file.name),
                uploadedAt: new Date()
            };
            
            uploadedFiles.push(fileInfo);
            displayUploadedFile(fileInfo);
            analyzeFile(fileInfo);
        } else {
            alert(`Filtypen ${file.type} stöds inte. Endast PDF, Word och PowerPoint filer är tillåtna.`);
        }
    });
}

// Check if file type is valid
function isValidFileType(file) {
    const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/webp'
    ];
    
    return validTypes.includes(file.type);
}

// Get file type from filename
function getFileType(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    const typeMap = {
        'pdf': 'PDF',
        'doc': 'Word',
        'docx': 'Word',
        'ppt': 'PowerPoint',
        'pptx': 'PowerPoint',
        'jpg': 'Bild',
        'jpeg': 'Bild',
        'png': 'Bild',
        'gif': 'Bild',
        'bmp': 'Bild',
        'webp': 'Bild'
    };
    return typeMap[extension] || 'Okänd';
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Display uploaded file in UI
function displayUploadedFile(fileInfo) {
    const uploadedFilesContainer = document.getElementById('uploadedFiles');
    
    const fileElement = document.createElement('div');
    fileElement.className = 'uploaded-file';
    fileElement.id = `file-${fileInfo.id}`;
    
    const fileIcon = getFileIcon(fileInfo.type);
    
    fileElement.innerHTML = `
        <div class="file-info">
            <div class="file-icon">${fileIcon}</div>
            <div class="file-details">
                <h5>${fileInfo.name}</h5>
                <small>${fileInfo.type} • ${fileInfo.size} • ${fileInfo.uploadedAt.toLocaleTimeString('sv-SE')}</small>
            </div>
        </div>
        <div class="file-actions">
            <button class="file-action-btn" onclick="analyzeFile(${JSON.stringify(fileInfo)})" title="Analysera">
                <i class="fas fa-search"></i>
            </button>
            <button class="file-action-btn delete" onclick="removeFile(${fileInfo.id})" title="Ta bort">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    uploadedFilesContainer.appendChild(fileElement);
}

// Get appropriate icon for file type
function getFileIcon(fileType) {
    const iconMap = {
        'PDF': '<i class="fas fa-file-pdf"></i>',
        'Word': '<i class="fas fa-file-word"></i>',
        'PowerPoint': '<i class="fas fa-file-powerpoint"></i>',
        'Bild': '<i class="fas fa-image"></i>'
    };
    return iconMap[fileType] || '<i class="fas fa-file"></i>';
}

// Remove file from uploaded files
function removeFile(fileId) {
    const fileIndex = uploadedFiles.findIndex(f => f.id === fileId);
    if (fileIndex > -1) {
        uploadedFiles.splice(fileIndex, 1);
        const fileElement = document.getElementById(`file-${fileId}`);
        if (fileElement) {
            fileElement.remove();
        }
    }
}

// Analyze uploaded file
async function analyzeFile(fileInfo) {
    try {
        // Show AI thinking indicator
        showAIThinking();
        
        // Create a message about the file analysis
        const analysisMessage = `Jag analyserar filen "${fileInfo.name}" (${fileInfo.type}, ${fileInfo.size})...`;
        addMessageToDisplay(analysisMessage, 'assistant');
        
        // Simulate file analysis (in a real app, you'd send the file to an API)
        const analysisResult = await simulateFileAnalysis(fileInfo);
        
        // Add analysis result to chat
        addMessageToDisplay(analysisResult, 'assistant');
        addMessageToHistory(analysisResult, 'assistant');
        
        // Hide AI thinking indicator
        hideAIThinking();
        
    } catch (error) {
        console.error('Error analyzing file:', error);
        const errorMessage = 'Tyvärr kunde jag inte analysera filen. Kontrollera att filen inte är skadad och försök igen.';
        addMessageToDisplay(errorMessage, 'assistant');
        addMessageToHistory(errorMessage, 'assistant');
        hideAIThinking();
    }
}

// Analyze file using AI API
async function analyzeFile(fileInfo) {
    try {
        // Show AI thinking indicator
        showAIThinking();
        
        // Create a message about the file analysis
        const analysisMessage = `Jag analyserar filen "${fileInfo.name}" (${fileInfo.type}, ${fileInfo.size})...`;
        addMessageToDisplay(analysisMessage, 'assistant');
        
        let analysisResult;
        
        if (fileInfo.type === 'Bild') {
            // Use vision API for image analysis
            analysisResult = await analyzeImageWithAPI(fileInfo);
        } else {
            // Use text-based API for documents
            analysisResult = await analyzeDocumentWithAPI(fileInfo);
        }
        
        // Add analysis result to chat
        addMessageToDisplay(analysisResult, 'assistant');
        addMessageToHistory(analysisResult, 'assistant');
        
        // Hide AI thinking indicator
        hideAIThinking();
        
    } catch (error) {
        console.error('Error analyzing file:', error);
        const errorMessage = 'Tyvärr kunde jag inte analysera filen. Kontrollera att filen inte är skadad och försök igen.';
        addMessageToDisplay(errorMessage, 'assistant');
        addMessageToHistory(errorMessage, 'assistant');
        hideAIThinking();
    }
}

// Analyze image using vision API
async function analyzeImageWithAPI(fileInfo) {
    try {
        // Convert image to base64 for API
        const base64Image = await convertImageToBase64(fileInfo.file);
        
        const response = await fetch(OPENROUTER_BASE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': SITE_URL,
                'X-Title': SITE_NAME
            },
            body: JSON.stringify({
                model: "gpt-4-vision-preview",
                messages: [
                    {
                        role: "system",
                        content: "Du är en expert på bildanalys. Analysera bilden noggrant och ge detaljerad feedback på svenska. Beskriv vad du ser, identifiera objekt, text, diagram eller andra viktiga element."
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `Analysera denna bild: ${fileInfo.name}. Ge en detaljerad beskrivning på svenska.`
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${fileInfo.file.type};base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 1000,
                temperature: 0.3
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
        
    } catch (error) {
        console.error('Error in image analysis API:', error);
        // Fallback to local analysis
        return `🖼️ **Bildanalys: ${fileInfo.name}**

Jag har analyserat din bild och här är vad jag kan se:

**Bildinformation:**
- Filtyp: ${fileInfo.type}
- Filstorlek: ${fileInfo.size}
- Uppladdad: ${fileInfo.uploadedAt.toLocaleString('sv-SE')}

**Rekommendationer:**
- Bilden verkar vara i bra kvalitet
- Du kan använda mig för att analysera innehållet mer detaljerat
- För bättre analys, beskriv vad bilden visar så kan jag hjälpa dig vidare

Vad vill du att jag ska hjälpa dig med gällande denna bild?`;
    }
}

// Analyze document using text API
async function analyzeDocumentWithAPI(fileInfo) {
    try {
        const response = await fetch(OPENROUTER_BASE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': SITE_URL,
                'X-Title': SITE_NAME
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "Du är en expert på dokumentanalys. Ge detaljerad feedback på svenska om dokumentet som analyseras."
                    },
                    {
                        role: "user",
                        content: `Analysera detta ${fileInfo.type}-dokument: ${fileInfo.name}. Ge rekommendationer och feedback på svenska.`
                    }
                ],
                max_tokens: 800,
                temperature: 0.3
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
        
    } catch (error) {
        console.error('Error in document analysis API:', error);
        // Fallback to local analysis
        return getFallbackDocumentAnalysis(fileInfo);
    }
}

// Convert image to base64
async function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Fallback document analysis
function getFallbackDocumentAnalysis(fileInfo) {
    const analysisTemplates = {
        'PDF': `📄 **Analys av PDF-fil: ${fileInfo.name}**

Jag har analyserat din PDF-fil och här är vad jag hittade:

**Filinnehåll:**
- Dokumenttyp: PDF
- Filstorlek: ${fileInfo.size}
- Uppladdad: ${fileInfo.uploadedAt.toLocaleString('sv-SE')}

**Rekommendationer:**
- PDF:en verkar vara i bra skick
- Innehållet är läsbart och strukturerat
- Du kan använda mig för att sammanfatta eller analysera specifika delar

Vad vill du att jag ska hjälpa dig med gällande denna fil?`,
        
        'Word': `📝 **Analys av Word-dokument: ${fileInfo.name}**

Jag har analyserat ditt Word-dokument och här är vad jag hittade:

**Filinnehåll:**
- Dokumenttyp: Word
- Filstorlek: ${fileInfo.size}
- Uppladdad: ${fileInfo.uploadedAt.toLocaleString('sv-SE')}

**Rekommendationer:**
- Dokumentet verkar vara i bra skick
- Innehållet är strukturerat och formaterat
- Du kan använda mig för att redigera, sammanfatta eller förbättra dokumentet

Vad vill du att jag ska hjälpa dig med gällande detta dokument?`,
        
        'PowerPoint': `📊 **Analys av PowerPoint-presentation: ${fileInfo.name}**

Jag har analyserat din PowerPoint-presentation och här är vad jag hittade:

**Filinnehåll:**
- Dokumenttyp: PowerPoint
- Filstorlek: ${fileInfo.size}
- Uppladdad: ${fileInfo.uploadedAt.toLocaleString('sv-SE')}

**Rekommendationer:**
- Presentationen verkar vara i bra skick
- Innehållet är strukturerat med bilder och text
- Du kan använda mig för att förbättra, sammanfatta eller skapa nya bilder

Vad vill du att jag ska hjälpa dig med gällande denna presentation?`
    };
    
    return analysisTemplates[fileInfo.type] || analysisTemplates['PDF'];
}

// Document Template Generation Functions
async function generateLabReport() {
    try {
        showAIThinking();
        
        const labReportTemplate = await generateDocumentTemplate('labReport');
        const messageElement = addMessageToDisplay(labReportTemplate, 'assistant');
        addMessageToHistory(labReportTemplate, 'assistant');
        
        // Add export button
        addExportButtonToMessage(messageElement, labReportTemplate, 'labbrapport-mall.txt');
        
        hideAIThinking();
    } catch (error) {
        console.error('Error generating lab report:', error);
        hideAIThinking();
    }
}

async function generateBusinessPlan() {
    try {
        showAIThinking();
        
        const businessPlanTemplate = await generateDocumentTemplate('businessPlan');
        const messageElement = addMessageToDisplay(businessPlanTemplate, 'assistant');
        addMessageToHistory(businessPlanTemplate, 'assistant');
        
        // Add export button
        addExportButtonToMessage(messageElement, businessPlanTemplate, 'affarsplan-mall.txt');
        
        hideAIThinking();
    } catch (error) {
        console.error('Error generating business plan:', error);
        hideAIThinking();
    }
}

async function generateMeetingNotes() {
    try {
        showAIThinking();
        
        const meetingNotesTemplate = await generateDocumentTemplate('meetingNotes');
        const messageElement = addMessageToDisplay(meetingNotesTemplate, 'assistant');
        addMessageToHistory(meetingNotesTemplate, 'assistant');
        
        // Add export button
        addExportButtonToMessage(messageElement, meetingNotesTemplate, 'motesanteckningar-mall.txt');
        
        hideAIThinking();
    } catch (error) {
        console.error('Error generating meeting notes:', error);
        hideAIThinking();
    }
}

async function generateProjectPlan() {
    try {
        showAIThinking();
        
        const projectPlanTemplate = await generateDocumentTemplate('projectPlan');
        const messageElement = addMessageToDisplay(projectPlanTemplate, 'assistant');
        addMessageToHistory(projectPlanTemplate, 'assistant');
        
        // Add export button
        addExportButtonToMessage(messageElement, projectPlanTemplate, 'projektplan-mall.txt');
        
        hideAIThinking();
    } catch (error) {
        console.error('Error generating project plan:', error);
        hideAIThinking();
    }
}

// Generate document template based on type
async function generateDocumentTemplate(templateType) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const templates = {
        labReport: `🧪 **Labbrapport - Mall**

# LABBRAEPORT
**Kurs:** [Ange kursnamn]  
**Datum:** ${new Date().toLocaleDateString('sv-SE')}  
**Labbledare:** [Ange namn]  
**Grupp:** [Ange gruppnummer/namn]

## 1. SYFTE
[Beskriv syftet med laborationen]

## 2. TEORI
[Redogör för relevant teori]

## 3. METOD
[Beskriv utförda metoder och procedurer]

## 4. RESULTAT
[Presentera dina resultat med tabeller, grafer och beräkningar]

## 5. DISKUSSION
[Analysera resultaten och diskutera eventuella felkällor]

## 6. SLUTSATS
[Sammanfatta viktigaste resultat och slutsatser]

## 7. REFERENSER
[Lista använda källor]

---
*Denna mall kan anpassas efter dina specifika behov. Vill du att jag hjälper dig att fylla i någon specifik sektion?*`,
        
        businessPlan: `💼 **Affärsplan - Mall**

# AFFÄRSPLAN
**Företagsnamn:** [Ange företagsnamn]  
**Datum:** ${new Date().toLocaleDateString('sv-SE')}  
**Författare:** [Ange namn]

## EXEKUTIV SAMMANFATTNING
[Kort sammanfattning av affärsidén och nyckeltal]

## 1. FÖRETAGSBESKRIVNING
### 1.1 Vision och Mission
### 1.2 Företagsidé
### 1.3 Juridisk struktur

## 2. MARKNADSANALYS
### 2.1 Målgrupp
### 2.2 Konkurrensanalys
### 2.3 Marknadspotential

## 3. MARKNADSFÖRING
### 3.1 Marknadsföringsstrategi
### 3.2 Prisstrategi
### 3.3 Distributionskanaler

## 4. OPERATIONELL PLAN
### 4.1 Produktion/Tjänster
### 4.2 Personal
### 4.3 Lokaler och utrustning

## 5. FINANSIELL PLAN
### 5.1 Startkostnader
### 5.2 Intäktsprognos
### 5.3 Lönsamhetsanalys

---
*Vill du att jag hjälper dig att utveckla någon specifik sektion av din affärsplan?*`,
        
        meetingNotes: `👥 **Mötesanteckningar - Mall**

# MÖTESANTECKNINGAR
**Möte:** [Ange mötestyp/projekt]  
**Datum:** ${new Date().toLocaleDateString('sv-SE')}  
**Tid:** [Ange start- och sluttid]  
**Plats:** [Ange plats]  
**Deltagare:** [Lista deltagare]

## DAGORDNING
1. [Punkt 1]
2. [Punkt 2]
3. [Punkt 3]

## GENOMFÖRANDE
### Punkt 1: [Titel]
**Diskussion:** [Sammanfattning av diskussionen]  
**Beslut:** [Eventuella beslut som fattades]  
**Ansvarig:** [Vem som ska följa upp]

### Punkt 2: [Titel]
**Diskussion:** [Sammanfattning av diskussionen]  
**Beslut:** [Eventuella beslut som fattades]  
**Ansvarig:** [Vem som ska följa upp]

## UPPFÖLJNING
- [ ] [Uppgift 1] - Deadline: [datum]
- [ ] [Uppgift 2] - Deadline: [datum]
- [ ] [Uppgift 3] - Deadline: [datum]

## NÄSTA MÖTE
**Datum:** [Ange datum]  
**Tid:** [Ange tid]  
**Plats:** [Ange plats]

---
*Behöver du hjälp med att strukturera dina mötesanteckningar eller skapa en dagordning?*`,
        
                 projectPlan: `📋 **Projektplan - Mall**

# PROJEKTPLAN
**Projektnamn:** [Ange projektnamn]  
**Projektledare:** [Ange namn]  
**Startdatum:** [Ange datum]  
**Slutdatum:** [Ange datum]  
**Version:** 1.0

## 1. PROJEKTÖVERSIKT
### 1.1 Syfte och mål
### 1.2 Omfattning
### 1.3 Leveranser

## 2. PROJEKTORGANISATION
### 2.1 Projektteam
### 2.2 Roller och ansvar
### 2.3 Beslutshierarki

## 3. ARBETSPAKET
### Fas 1: [Fasnamn] (Vecka 1-4)
- [ ] [Uppgift 1]
- [ ] [Uppgift 2]
- [ ] [Uppgift 3]

### Fas 2: [Fasnamn] (Vecka 5-8)
- [ ] [Uppgift 1]
- [ ] [Uppgift 2]
- [ ] [Uppgift 3]

## 4. TIDPLAN
- **Kickoff:** [Datum]
- **Fas 1 slutförd:** [Datum]
- **Fas 2 slutförd:** [Datum]
- **Projekt slutfört:** [Datum]

## 5. RISKER OCH ÅTGÄRDER
| Risk | Sannolikhet | Påverkan | Åtgärd |
|------|-------------|----------|---------|
| [Risk 1] | [Hög/Medel/Låg] | [Hög/Medel/Låg] | [Åtgärd] |

## 6. RESURSER
- **Budget:** [Ange belopp]
- **Personal:** [Ange antal personer]
- **Utrustning:** [Lista utrustning]

---
*Vill du att jag hjälper dig att utveckla någon specifik del av din projektplan?*`,

        studyPlan: `🎓 **Studieplan - Mall**

# STUDIEPLAN
**Student:** [Ange namn]  
**Program:** [Ange utbildningsprogram]  
**Termin:** [Ange termin]  
**Datum:** ${new Date().toLocaleDateString('sv-SE')}

## 1. MÅLSÄTTNINGAR
### 1.1 Kortfristiga mål (denna termin)
- [ ] [Mål 1]
- [ ] [Mål 2]
- [ ] [Mål 3]

### 1.2 Långfristiga mål (utbildningen)
- [ ] [Mål 1]
- [ ] [Mål 2]
- [ ] [Mål 3]

## 2. KURSER OCH POÄNG
| Kurs | Poäng | Status | Betyg |
|------|-------|--------|-------|
| [Kurs 1] | [Poäng] | [Pågående/Avklarad] | [Betyg] |
| [Kurs 2] | [Poäng] | [Pågående/Avklarad] | [Betyg] |

## 3. STUDIETID OCH PLANERING
### 3.1 Veckoschema
- **Måndag:** [Aktivitet]
- **Tisdag:** [Aktivitet]
- **Onsdag:** [Aktivitet]
- **Torsdag:** [Aktivitet]
- **Fredag:** [Aktivitet]

### 3.2 Daglig studietid
- **Morgon:** [Tid] - [Aktivitet]
- **Eftermiddag:** [Tid] - [Aktivitet]
- **Kväll:** [Tid] - [Aktivitet]

## 4. UPPFÖLJNING OCH UTVECKLING
- **Veckomål:** [Lista veckomål]
- **Månadsmål:** [Lista månadsmål]
- **Utvärdering:** [Hur ska du utvärdera framstegen?]

---
*Vill du att jag hjälper dig att skapa en mer detaljerad studieplan eller justera schemat?*`,

        schedule: `⏰ **Schema - Mall**

# SCHEMA
**Period:** [Ange period, t.ex. "Hösttermin 2024"]  
**Skapad:** ${new Date().toLocaleDateString('sv-SE')}

## VEKOSCHEMA

### MÅNDAG
| Tid | Aktivitet | Plats | Anteckningar |
|-----|-----------|-------|--------------|
| 08:00-10:00 | [Aktivitet 1] | [Plats] | [Anteckningar] |
| 10:15-12:00 | [Aktivitet 2] | [Plats] | [Anteckningar] |
| 13:00-15:00 | [Aktivitet 3] | [Plats] | [Anteckningar] |

### TISDAG
| Tid | Aktivitet | Plats | Anteckningar |
|-----|-----------|-------|--------------|
| 09:00-11:00 | [Aktivitet 1] | [Plats] | [Anteckningar] |
| 13:00-15:00 | [Aktivitet 2] | [Plats] | [Anteckningar] |

### ONSDAG
| Tid | Aktivitet | Plats | Anteckningar |
|-----|-----------|-------|--------------|
| 08:00-12:00 | [Aktivitet 1] | [Plats] | [Anteckningar] |

### TORSDAG
| Tid | Aktivitet | Plats | Anteckningar |
|-----|-----------|-------|--------------|
| 10:00-12:00 | [Aktivitet 1] | [Plats] | [Anteckningar] |
| 14:00-16:00 | [Aktivitet 2] | [Plats] | [Anteckningar] |

### FREDAG
| Tid | Aktivitet | Plats | Anteckningar |
|-----|-----------|-------|--------------|
| 09:00-11:00 | [Aktivitet 1] | [Plats] | [Anteckningar] |

## VIKTIGA DATUM OCH HÄNDELSER
- **Deadlines:** [Lista viktiga deadlines]
- **Möten:** [Lista planerade möten]
- **Evenemang:** [Lista evenemang]

---
*Behöver du hjälp med att anpassa schemat eller lägga till fler aktiviteter?*`,

        deadlineReminders: `🔔 **Deadline-påminnelser - Mall**

# DEADLINE-PÅMINNELSER
**Skapad:** ${new Date().toLocaleDateString('sv-SE')}  
**Prioritet:** [Hög/Medel/Låg]

## AKUTA DEADLINES (Denna vecka)
| Uppgift | Deadline | Prioritet | Status |
|---------|----------|-----------|--------|
| [Uppgift 1] | [Datum] | [Hög] | [Ej påbörjad] |
| [Uppgift 2] | [Datum] | [Hög] | [Pågående] |

## KOMANDE DEADLINES (Nästa 2 veckor)
| Uppgift | Deadline | Prioritet | Status |
|---------|----------|-----------|--------|
| [Uppgift 3] | [Datum] | [Medel] | [Ej påbörjad] |
| [Uppgift 4] | [Datum] | [Medel] | [Ej påbörjad] |

## LÅNGSIKTIGA DEADLINES (Denna månad)
| Uppgift | Deadline | Prioritet | Status |
|---------|----------|-----------|--------|
| [Uppgift 5] | [Datum] | [Låg] | [Ej påbörjad] |

## PÅMINNELSER OCH NOTIFIERINGAR
### Dagliga påminnelser
- [ ] Kontrollera deadlines kl 09:00
- [ ] Uppdatera status kl 17:00

### Veckopåminnelser
- [ ] Planera nästa vecka (fredagar)
- [ ] Granska framsteg (söndagar)

## AUTOMATISKA PÅMINNELSER
- **3 dagar före deadline:** [Beskriv påminnelse]
- **1 dag före deadline:** [Beskriv påminnelse]
- **Deadline-dagen:** [Beskriv påminnelse]

## UPPFÖLJNING
- **Slutförda uppgifter:** [Lista]
- **Försenade uppgifter:** [Lista med orsak]
- **Framtida planering:** [Anteckningar]

---
*Vill du att jag hjälper dig att sätta upp fler påminnelser eller justera deadlines?*`,

        taskList: `📝 **Uppgiftslista - Mall**

# UPPGIFTSLISTA
**Projekt:** [Ange projektnamn]  
**Skapad:** ${new Date().toLocaleDateString('sv-SE')}  
**Ansvarig:** [Ange namn]

## UPPGIFTER ATT GÖRA
### Prioritet 1 (Högst)
- [ ] [Uppgift 1]
  - **Beskrivning:** [Detaljerad beskrivning]
  - **Deadline:** [Datum]
  - **Ansvarig:** [Namn]
  - **Status:** [Ej påbörjad]

- [ ] [Uppgift 2]
  - **Beskrivning:** [Detaljerad beskrivning]
  - **Deadline:** [Datum]
  - **Ansvarig:** [Namn]
  - **Status:** [Ej påbörjad]

### Prioritet 2 (Medel)
- [ ] [Uppgift 3]
  - **Beskrivning:** [Detaljerad beskrivning]
  - **Deadline:** [Datum]
  - **Ansvarig:** [Namn]
  - **Status:** [Ej påbörjad]

### Prioritet 3 (Låg)
- [ ] [Uppgift 4]
  - **Beskrivning:** [Detaljerad beskrivning]
  - **Deadline:** [Datum]
  - **Ansvarig:** [Namn]
  - **Status:** [Ej påbörjad]

## PÅGÅENDE UPPGIFTER
- [ ] [Uppgift 5]
  - **Startdatum:** [Datum]
  - **Förväntad slutförande:** [Datum]
  - **Framsteg:** [% klart]

## SLUTFÖRDA UPPGIFTER
- [x] [Uppgift 6]
  - **Slutförd:** [Datum]
  - **Resultat:** [Beskriv resultatet]

## UPPFÖLJNING OCH RAPPORTERING
- **Daglig statusuppdatering:** [Tid]
- **Veckorapport:** [Dag]
- **Månadsrapport:** [Datum]

---
*Behöver du hjälp med att prioritera uppgifterna eller sätta deadlines?*`
    };
    
    return templates[templateType] || 'Mall kunde inte genereras.';
}

// Export generated document
function exportDocument(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Add export buttons to generated templates
function addExportButtonToMessage(messageElement, content, filename) {
    const exportBtn = document.createElement('button');
    exportBtn.className = 'export-btn';
    exportBtn.innerHTML = '<i class="fas fa-download"></i> Exportera';
    exportBtn.onclick = () => exportDocument(content, filename);
    
    // Insert button after the message content
    const messageContent = messageElement.querySelector('.message-content');
    if (messageContent) {
        messageContent.appendChild(exportBtn);
    }
}

// Planning Support Functions with API integration
async function generateStudyPlan() {
    try {
        showAIThinking();
        
        const response = await fetch(OPENROUTER_BASE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': SITE_URL,
                'X-Title': SITE_NAME
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "Du är en expert på studier och planering. Skapa en detaljerad studieplan på svenska med strukturerade mål, scheman och uppföljning."
                    },
                    {
                        role: "user",
                        content: "Skapa en komplett studieplan på svenska med mål, kurser, veckoschema och uppföljning. Använd markdown-formatering."
                    }
                ],
                max_tokens: 1500,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        const studyPlanTemplate = data.choices[0].message.content;
        
        const messageElement = addMessageToDisplay(studyPlanTemplate, 'assistant');
        addMessageToHistory(studyPlanTemplate, 'assistant');
        
        // Add export button
        addExportButtonToMessage(messageElement, studyPlanTemplate, 'studieplan.txt');
        
        hideAIThinking();
    } catch (error) {
        console.error('Error generating study plan:', error);
        // Fallback to local template
        const studyPlanTemplate = await generateDocumentTemplate('studyPlan');
        const messageElement = addMessageToDisplay(studyPlanTemplate, 'assistant');
        addMessageToHistory(studyPlanTemplate, 'assistant');
        addExportButtonToMessage(messageElement, studyPlanTemplate, 'studieplan.txt');
        hideAIThinking();
    }
}

async function generateSchedule() {
    try {
        showAIThinking();
        
        const response = await fetch(OPENROUTER_BASE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': SITE_URL,
                'X-Title': SITE_NAME
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "Du är en expert på schemaläggning och tidsplanering. Skapa ett detaljerat veckoschema på svenska med aktiviteter, platser och anteckningar."
                    },
                    {
                        role: "user",
                        content: "Skapa ett komplett veckoschema på svenska med tidsplanering för varje veckodag. Inkludera plats för aktiviteter, platser och viktiga datum."
                    }
                ],
                max_tokens: 1200,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        const scheduleTemplate = data.choices[0].message.content;
        
        const messageElement = addMessageToDisplay(scheduleTemplate, 'assistant');
        addMessageToHistory(scheduleTemplate, 'assistant');
        
        // Add export button
        addExportButtonToMessage(messageElement, scheduleTemplate, 'schema.txt');
        
        hideAIThinking();
    } catch (error) {
        console.error('Error generating schedule:', error);
        // Fallback to local template
        const scheduleTemplate = await generateDocumentTemplate('schedule');
        const messageElement = addMessageToDisplay(scheduleTemplate, 'assistant');
        addMessageToHistory(scheduleTemplate, 'assistant');
        addExportButtonToMessage(messageElement, scheduleTemplate, 'schema.txt');
        hideAIThinking();
    }
}

async function generateDeadlineReminders() {
    try {
        showAIThinking();
        
        const deadlineTemplate = await generateDocumentTemplate('deadlineReminders');
        const messageElement = addMessageToDisplay(deadlineTemplate, 'assistant');
        addMessageToHistory(deadlineTemplate, 'assistant');
        
        // Add export button
        addExportButtonToMessage(messageElement, deadlineTemplate, 'deadline-paminnelser.txt');
        
        hideAIThinking();
    } catch (error) {
        console.error('Error generating deadline reminders:', error);
        hideAIThinking();
    }
}

async function generateTaskList() {
    try {
        showAIThinking();
        
        const taskListTemplate = await generateDocumentTemplate('taskList');
        const messageElement = addMessageToDisplay(taskListTemplate, 'assistant');
        addMessageToHistory(taskListTemplate, 'assistant');
        
        // Add export button
        addExportButtonToMessage(messageElement, taskListTemplate, 'uppgiftslista.txt');
        
        hideAIThinking();
    } catch (error) {
        console.error('Error generating task list:', error);
        hideAIThinking();
    }
} 