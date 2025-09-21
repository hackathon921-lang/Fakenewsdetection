// Application State
let conversations = [
  {
    id: '1',
    title: 'Climate Change Article Analysis',
    timestamp: '2 hours ago'
  },
  {
    id: '2', 
    title: 'Political Statement Verification',
    timestamp: '1 day ago'
  },
  {
    id: '3',
    title: 'Health News Fact-Check',
    timestamp: '3 days ago'
  }
];

let activeConversation = null;
let messages = [];
let isLoading = false;
let sidebarOpen = true;
let activeTab = 'text';

// DOM Elements
const menuButton = document.getElementById('menuButton');
const sidebar = document.getElementById('sidebar');
const newConversationBtn = document.getElementById('newConversationBtn');
const conversationsList = document.getElementById('conversationsList');
const chatInterface = document.getElementById('chatInterface');
const emptyState = document.getElementById('emptyState');
const messagesContainer = document.getElementById('messages');
const textInput = document.getElementById('textInput');
const urlInput = document.getElementById('urlInput');
const analyzeBtn = document.getElementById('analyzeBtn');

// Tab Elements
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('.tab-panel');
const textTab = document.getElementById('textTab');
const urlTab = document.getElementById('urlTab');
const fileTab = document.getElementById('fileTab');

// Mock Analysis Generator
function generateMockAnalysis(content, type) {
  const analyses = [
    {
      credibility: 'high',
      confidence: 87,
      sources: ['Reuters', 'Associated Press', 'BBC News'],
      flags: []
    },
    {
      credibility: 'medium',
      confidence: 62,
      sources: ['Local News Source'],
      flags: ['Unverified claims', 'Missing sources']
    },
    {
      credibility: 'low',
      confidence: 23,
      sources: [],
      flags: ['Misleading information', 'Biased language', 'No credible sources']
    }
  ];

  const randomAnalysis = analyses[Math.floor(Math.random() * analyses.length)];
  
  let responseText = '';
  if (type === 'url') {
    responseText = `I've analyzed the article from the provided URL. `;
  } else if (type === 'text') {
    responseText = `I've analyzed the provided text content. `;
  }

  responseText += `Based on my analysis, this content has ${randomAnalysis.credibility} credibility with ${randomAnalysis.confidence}% confidence.`;

  if (randomAnalysis.credibility === 'high') {
    responseText += ` The information appears to be well-sourced and factually accurate. I found references to multiple credible news sources and the claims made can be verified.`;
  } else if (randomAnalysis.credibility === 'medium') {
    responseText += ` While some aspects of the content appear legitimate, there are concerns about verification and sourcing that affect overall credibility.`;
  } else {
    responseText += ` I've identified several red flags that significantly impact the credibility of this content. Please exercise caution when sharing or believing this information.`;
  }

  return {
    text: responseText,
    analysis: randomAnalysis
  };
}

// Utility Functions
function getCurrentTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function createMessageElement(message) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${message.sender}`;
  messageDiv.id = `message-${message.id}`;

  const avatarDiv = document.createElement('div');
  avatarDiv.className = `message-avatar ${message.sender}`;
  
  if (message.sender === 'user') {
    avatarDiv.innerHTML = `
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    `;
  } else {
    avatarDiv.innerHTML = `
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
      </svg>
    `;
  }

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';

  const bubbleDiv = document.createElement('div');
  bubbleDiv.className = 'message-bubble';

  const textDiv = document.createElement('div');
  textDiv.className = 'message-text';
  textDiv.textContent = message.content;
  bubbleDiv.appendChild(textDiv);

  // Add analysis for AI messages
  if (message.sender === 'ai' && message.analysis) {
    const analysisDiv = document.createElement('div');
    analysisDiv.className = 'message-analysis';

    const badgesDiv = document.createElement('div');
    badgesDiv.className = 'analysis-badges';

    // Credibility badge
    const credibilityBadge = document.createElement('span');
    credibilityBadge.className = `badge badge-${message.analysis.credibility}`;
    credibilityBadge.innerHTML = `
      ${getCredibilityIcon(message.analysis.credibility)}
      Credibility: ${message.analysis.credibility}
    `;
    badgesDiv.appendChild(credibilityBadge);

    // Confidence badge
    const confidenceBadge = document.createElement('span');
    confidenceBadge.className = 'badge badge-outline';
    confidenceBadge.textContent = `Confidence: ${message.analysis.confidence}%`;
    badgesDiv.appendChild(confidenceBadge);

    analysisDiv.appendChild(badgesDiv);

    // Flags
    if (message.analysis.flags && message.analysis.flags.length > 0) {
      const flagsSection = document.createElement('div');
      flagsSection.className = 'analysis-section';
      
      const flagsTitle = document.createElement('p');
      flagsTitle.className = 'analysis-section-title';
      flagsTitle.textContent = 'Detected Issues:';
      flagsSection.appendChild(flagsTitle);

      const flagsDiv = document.createElement('div');
      flagsDiv.className = 'analysis-flags';
      
      message.analysis.flags.forEach(flag => {
        const flagBadge = document.createElement('span');
        flagBadge.className = 'badge badge-outline';
        flagBadge.textContent = flag;
        flagsDiv.appendChild(flagBadge);
      });
      
      flagsSection.appendChild(flagsDiv);
      analysisDiv.appendChild(flagsSection);
    }

    // Sources
    if (message.analysis.sources && message.analysis.sources.length > 0) {
      const sourcesSection = document.createElement('div');
      sourcesSection.className = 'analysis-section';
      
      const sourcesTitle = document.createElement('p');
      sourcesTitle.className = 'analysis-section-title';
      sourcesTitle.textContent = 'Verified Sources:';
      sourcesSection.appendChild(sourcesTitle);

      const sourcesDiv = document.createElement('div');
      sourcesDiv.className = 'analysis-sources';
      
      message.analysis.sources.forEach(source => {
        const sourceP = document.createElement('p');
        sourceP.textContent = `• ${source}`;
        sourcesDiv.appendChild(sourceP);
      });
      
      sourcesSection.appendChild(sourcesDiv);
      analysisDiv.appendChild(sourcesSection);
    }

    bubbleDiv.appendChild(analysisDiv);
  }

  const timestampDiv = document.createElement('p');
  timestampDiv.className = 'message-timestamp';
  timestampDiv.textContent = message.timestamp;

  contentDiv.appendChild(bubbleDiv);
  contentDiv.appendChild(timestampDiv);

  messageDiv.appendChild(avatarDiv);
  messageDiv.appendChild(contentDiv);

  return messageDiv;
}

function getCredibilityIcon(credibility) {
  switch (credibility) {
    case 'high':
      return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"></path><circle cx="12" cy="12" r="10"></circle></svg>`;
    case 'medium':
    case 'low':
      return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
    default:
      return '';
  }
}

function createConversationElement(conversation) {
  const button = document.createElement('button');
  button.className = `conversation-item ${activeConversation === conversation.id ? 'active' : ''}`;
  button.dataset.conversationId = conversation.id;
  
  button.innerHTML = `
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
    <div class="conversation-content">
      <div class="conversation-title">${conversation.title}</div>
      <div class="conversation-timestamp">${conversation.timestamp}</div>
    </div>
  `;

  button.addEventListener('click', () => selectConversation(conversation.id));
  
  return button;
}

// UI Update Functions
function updateConversationsList() {
  conversationsList.innerHTML = '';
  conversations.forEach(conversation => {
    const element = createConversationElement(conversation);
    conversationsList.appendChild(element);
  });
}

function updateMessagesDisplay() {
  if (messages.length === 0) {
    emptyState.style.display = 'flex';
    messagesContainer.style.display = 'none';
  } else {
    emptyState.style.display = 'none';
    messagesContainer.style.display = 'block';
    
    messagesContainer.innerHTML = '';
    messages.forEach(message => {
      const element = createMessageElement(message);
      messagesContainer.appendChild(element);
    });
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

function updateAnalyzeButton() {
  const canSend = (activeTab === 'text' && textInput.value.trim()) || 
                  (activeTab === 'url' && urlInput.value.trim());
  
  analyzeBtn.disabled = !canSend || isLoading;
  
  if (isLoading) {
    analyzeBtn.innerHTML = `
      <div class="spinner"></div>
      Analyzing...
    `;
    analyzeBtn.classList.add('loading');
  } else {
    analyzeBtn.innerHTML = `
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 2L11 13"></path>
        <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
      </svg>
      Analyze
    `;
    analyzeBtn.classList.remove('loading');
  }
}

// Event Handlers
function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('open', sidebarOpen);
  } else {
    sidebar.classList.toggle('hidden', !sidebarOpen);
  }
}

function createNewConversation() {
  activeConversation = null;
  messages = [];
  updateMessagesDisplay();
  updateConversationsList();
}

function selectConversation(id) {
  activeConversation = id;
  messages = []; // In a real app, you'd load messages for this conversation
  updateMessagesDisplay();
  updateConversationsList();
  
  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    sidebarOpen = false;
    sidebar.classList.remove('open');
  }
}

function switchTab(tabName) {
  activeTab = tabName;
  
  // Update tab buttons
  tabButtons.forEach(button => {
    button.classList.toggle('active', button.dataset.tab === tabName);
  });
  
  // Update tab panels
  tabPanels.forEach(panel => {
    panel.classList.toggle('active', panel.id === `${tabName}Tab`);
  });
  
  updateAnalyzeButton();
}

async function sendMessage() {
  let content = '';
  let type = activeTab;
  
  if (activeTab === 'text') {
    content = textInput.value.trim();
  } else if (activeTab === 'url') {
    content = urlInput.value.trim();
  }
  
  if (!content || isLoading) return;
  
  // Create user message
  const userMessage = {
    id: Date.now().toString(),
    content: type === 'url' ? `Please analyze this article: ${content}` : content,
    sender: 'user',
    timestamp: getCurrentTime()
  };
  
  messages.push(userMessage);
  updateMessagesDisplay();
  
  // Clear input
  if (activeTab === 'text') {
    textInput.value = '';
  } else if (activeTab === 'url') {
    urlInput.value = '';
  }
  
  isLoading = true;
  updateAnalyzeButton();
  
  // Simulate API call
  setTimeout(() => {
    const mockResponse = generateMockAnalysis(content, type);
    
    const aiMessage = {
      id: (Date.now() + 1).toString(),
      content: mockResponse.text,
      sender: 'ai',
      timestamp: getCurrentTime(),
      analysis: mockResponse.analysis
    };
    
    messages.push(aiMessage);
    updateMessagesDisplay();
    
    isLoading = false;
    updateAnalyzeButton();
    
    // Create new conversation if needed
    if (!activeConversation) {
      const newConversation = {
        id: Date.now().toString(),
        title: content.length > 50 ? content.substring(0, 50) + '...' : content,
        timestamp: 'Just now'
      };
      conversations.unshift(newConversation);
      activeConversation = newConversation.id;
      updateConversationsList();
    }
  }, 2000);
}

// Event Listeners
menuButton.addEventListener('click', toggleSidebar);
newConversationBtn.addEventListener('click', createNewConversation);
analyzeBtn.addEventListener('click', sendMessage);

// Tab switching
tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    switchTab(button.dataset.tab);
  });
});

// Input change listeners
textInput.addEventListener('input', updateAnalyzeButton);
urlInput.addEventListener('input', updateAnalyzeButton);

// Enter key support
textInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendMessage();
  }
});

// File upload placeholder
fileTab.addEventListener('click', () => {
  alert('File upload functionality would be implemented here');
});

// Handle window resize
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    sidebar.classList.remove('open');
    sidebar.classList.toggle('hidden', !sidebarOpen);
  } else {
    sidebar.classList.remove('hidden');
    sidebar.classList.toggle('open', sidebarOpen);
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updateConversationsList();
  updateMessagesDisplay();
  updateAnalyzeButton();
  
  // Set initial responsive state
  if (window.innerWidth <= 768) {
    sidebarOpen = false;
    sidebar.classList.remove('open');
  }
});