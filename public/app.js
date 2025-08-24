// Global variables
let scene, camera, renderer, particles = [];
let contactScene, contactCamera, contactRenderer;
let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

// Chatbot global variables
let conversationHistory = [];
let isTyping = false;
let chatbotVisible = false;

// Skills data with progress levels
const skillsData = {
    languages: [
        { name: 'Python', level: 95 },
        { name: 'Java', level: 90 },
        { name: 'C++', level: 85 },
        { name: 'C', level: 80 },
        { name: 'R', level: 75 }
    ],
    frameworks: [
        { name: 'TensorFlow', level: 92 },
        { name: 'PyTorch', level: 88 },
        { name: 'ReactJS', level: 85 },
        { name: 'Spring-Boot', level: 82 },
        { name: 'Angular', level: 78 },
        { name: 'Kubernetes', level: 85 }
    ],
    webTech: [
        { name: 'HTML/CSS', level: 90 },
        { name: 'JavaScript', level: 88 },
        { name: 'Bootstrap', level: 85 },
        { name: 'jQuery', level: 80 }
    ],
    databases: [
        { name: 'MongoDB', level: 85 },
        { name: 'PostgreSQL', level: 82 },
        { name: 'MySQL', level: 80 },
        { name: 'Oracle', level: 75 }
    ],
    advancedTech: [
        { name: 'Machine Learning', level: 95 },
        { name: 'NLP', level: 90 },
        { name: 'Docker', level: 88 },
        { name: 'Data Analysis', level: 92 },
        { name: 'Linux', level: 85 }
    ],
    deployment: [
        { name: 'GCP', level: 90 },
        { name: 'CI/CD Pipelines', level: 85 },
        { name: 'Cloud Build', level: 82 },
        { name: 'App Engine', level: 80 },
        { name: 'Cloud RUN', level: 85 }
    ]
};

// Project details for expansion
const projectDetails = {
    'Industrial Solar Forecasting System': {
        fullDescription: 'Developed a comprehensive machine learning-based photovoltaic forecasting system for large-scale solar power plants within the Russian power system. The system integrates multiple data sources including weather patterns, historical generation data, and real-time sensor inputs to provide accurate day-ahead forecasting.',
        technologies: ['Python', 'Machine Learning', 'Time Series Analysis', 'Weather APIs', 'Data Preprocessing'],
        achievements: [
            'Achieved 95% forecasting accuracy for day-ahead predictions',
            'Reduced forecasting errors by 40% compared to traditional methods',
            'Successfully deployed in production for Russian power grid',
            'Research published in high-impact Energies Journal (Impact Factor 5.0)'
        ]
    },
    'Supreme Court Case Prediction using HCNN': {
        fullDescription: 'Built an advanced deep learning system using Hierarchical Convolutional Neural Networks (HCNN) to predict Supreme Court case outcomes. The project involved extensive web scraping, natural language processing, and deep learning techniques to analyze 70 years of judicial data.',
        technologies: ['TensorFlow', 'NLP', 'Web Scraping', 'HCNN', 'Gensim', 'Word2Vec', 'Python'],
        achievements: [
            'Processed and analyzed 70 years of Supreme Court judgment data',
            'Achieved 78% prediction accuracy using HCNN architecture',
            'Implemented advanced NLP preprocessing pipeline',
            'Published research in prestigious Springer conference'
        ]
    },
    'Random Forest Solar Power Prediction': {
        fullDescription: 'Developed a robust solar power generation prediction system using Random Forest Regressor algorithms. The project focused on integrating retrospective metering data with open-source weather information to create accurate forecasting models.',
        technologies: ['Random Forest', 'Python', 'Weather Data APIs', 'Statistical Analysis', 'Feature Engineering'],
        achievements: [
            'Integrated multiple data sources for comprehensive analysis',
            'Optimized feature selection for improved model performance',
            'Tested on real solar power plant in southern Russia',
            'Demonstrated practical implementation and validation'
        ]
    },
    'Renewable Energy Strategic Planning': {
        fullDescription: 'Created a comprehensive methodology for integrating renewable energy sources into strategic energy sector development plans. The research emphasized using integrated technical, economic, and environmental criteria for decision-making processes.',
        technologies: ['Strategic Planning', 'Economic Analysis', 'Environmental Assessment', 'Python', 'Data Visualization'],
        achievements: [
            'Developed multi-criteria decision framework',
            'Created ranked project evaluation system',
            'Applied methodology to real regional power system',
            'Provided practical implementation guidelines'
        ]
    },
    'Remote Microgrid Development': {
        fullDescription: 'Successfully developed an autonomous microgrid solution specifically designed for remote residential customers\' power supply. The project addressed unique geographical challenges and prioritized technological efficiency and environmental sustainability.',
        technologies: ['Load Forecasting', 'Optimization Algorithms', 'Renewable Energy', 'Grid Management', 'Python'],
        achievements: [
            'Designed autonomous power supply solution',
            'Implemented optimal generation capacity determination',
            'Applied advanced load forecasting techniques',
            'Focused on environmental sustainability'
        ]
    },
    'Personal Portfolio Website': {
        fullDescription: 'Built a comprehensive personal portfolio website showcasing full-stack development skills. The project features modern React architecture, Firebase integration, authentication systems, and interactive games to demonstrate various technical capabilities.',
        technologies: ['ReactJS', 'NodeJS', 'Firebase', 'Google Auth', 'Netlify', 'React Hooks'],
        achievements: [
            'Implemented Google Authentication with Firebase',
            'Created interactive TIC-TAC-TOE game',
            'Built SAAS application with real-time components',
            'Deployed on Netlify with continuous integration'
        ]
    }
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize loading screen
    initLoadingScreen();
    
    // Initialize all components after a delay
    setTimeout(() => {
        initCustomCursor();
        initNavigation();
        initScrollProgress();
        initThreeJS();
        initContactCanvas();
        initScrollAnimations();
        initTypewriter();
        initCounters();
        initContactForm();
        initParticles();
        initSkillsSection();
        initTimelineInteractions();
        initProjectInteractions();
        initResumeLink();
        initGalleryLightbox();
        initEnhancedInteractions();
        initChatbot();
        hideLoadingScreen();
        initMusicPlayer();
    }, 2000);
});


// New function to initialize music player
function initMusicPlayer() {
    const music = document.getElementById('background-music');
    const muteButton = document.getElementById('mute-button');
    const muteIcon = muteButton.querySelector('i');

    // Set initial volume
    music.volume = 0.2; // Start with a low volume

    let isPlaying = false;

    // Function to toggle play/mute
    const toggleMusic = () => {
        if (music.paused || music.muted) {
            music.play().then(() => {
                music.muted = false;
                muteIcon.classList.remove('fa-volume-mute');
                muteIcon.classList.add('fa-volume-up');
                muteButton.setAttribute('title', 'Mute Music');
            }).catch(error => console.error("Music playback failed:", error));
        } else {
            music.muted = true;
            muteIcon.classList.remove('fa-volume-up');
            muteIcon.classList.add('fa-volume-mute');
            muteButton.setAttribute('title', 'Unmute Music');
        }
    };
    
    // Start music on the first user interaction to comply with autoplay policies
    const startMusicOnInteraction = () => {
        if (!isPlaying) {
            isPlaying = true;
            toggleMusic(); // This will play and unmute
            // Remove this event listener so it only runs once
            document.body.removeEventListener('click', startMusicOnInteraction);
            document.body.removeEventListener('keydown', startMusicOnInteraction);
        }
    };
    
    document.body.addEventListener('click', startMusicOnInteraction);
    document.body.addEventListener('keydown', startMusicOnInteraction);


    // Mute button event listener
    muteButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering the body click listener
        toggleMusic();
    });
}

// Chatbot initialization
function initChatbot() {
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotContainer = document.getElementById('chatbot-container');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotMinimize = document.getElementById('chatbot-minimize');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-message');
    const messagesContainer = document.getElementById('chat-messages');

    if (!chatbotToggle || !chatbotContainer) return;

    // Toggle chatbot visibility
    chatbotToggle.addEventListener('click', () => {
        toggleChatbot();
    });

    // Close chatbot
    if (chatbotClose) {
        chatbotClose.addEventListener('click', () => {
            toggleChatbot();
        });
    }

    // Minimize chatbot
    if (chatbotMinimize) {
        chatbotMinimize.addEventListener('click', () => {
            chatbotContainer.classList.toggle('minimized');
        });
    }

    // Send message on button click
    if (sendButton) {
        sendButton.addEventListener('click', () => {
            sendMessage();
        });
    }

    // Send message on Enter key press
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Initial welcome message
    setTimeout(() => {
        addBotMessage("Hello! I'm here to help you learn about my professional background, skills, and projects. What would you like to know?");
    }, 1000);
}

function toggleChatbot() {
    const chatbotContainer = document.getElementById('chatbot-container');
    const chatbotToggle = document.getElementById('chatbot-toggle');
    
    chatbotVisible = !chatbotVisible;
    
    if (chatbotVisible) {
        chatbotContainer.classList.add('active');
        chatbotToggle.classList.add('active');
    } else {
        chatbotContainer.classList.remove('active');
        chatbotToggle.classList.remove('active');
    }
}

async function sendMessage() {
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();
    
    if (!message || isTyping) return;
    
    // Add user message to chat
    addUserMessage(message);
    chatInput.value = '';
    
    // Show typing indicator
    showTyping();
    
    try {
        // Send message to backend
        const response = await fetch('https://tejapc-3d-portfolio.vercel.app/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                conversationHistory: conversationHistory
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Add bot response
            hideTyping();
            addBotMessage(data.response);
            
            // Update conversation history
            conversationHistory.push(
                { role: 'user', content: message },
                { role: 'assistant', content: data.response }
            );
        } else {
            throw new Error(data.error || 'Unknown error occurred');
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        hideTyping();
        addBotMessage("Sorry, I'm having trouble connecting to my knowledge base right now. Please try again later. 🤖");
    }
}

function addUserMessage(message) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.innerHTML = `
        <div class="message-content">
            <div class="message-text">${escapeHtml(message)}</div>
            <div class="message-time">${getCurrentTime()}</div>
        </div>
        <div class="message-avatar user-avatar">
            <i class="fas fa-user"></i>
        </div>
    `;
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// 🆕 New function for text-to-speech
function readOutMessage(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = window.speechSynthesis.getVoices().find(voice => voice.name.includes('Google') || voice.lang.startsWith('en-'));
        utterance.rate = 1.0; // Speed of speech
        utterance.pitch = 1.0; // Pitch of voice
        window.speechSynthesis.speak(utterance);
    } else {
        console.warn('Speech Synthesis not supported in this browser.');
    }
}

function addBotMessage(message) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    messageDiv.innerHTML = `
        <div class="message-avatar bot-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="message-text">${formatBotMessage(message)}</div>
            <div class="message-time">${getCurrentTime()}</div>
        </div>
    `;
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
    readOutMessage(message);
}


function showTyping() {
    isTyping = true;
    const messagesContainer = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing-message';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="message-avatar bot-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    `;
    messagesContainer.appendChild(typingDiv);
    scrollToBottom();
}

function hideTyping() {
    isTyping = false;
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function formatBotMessage(message) {
    // Simple formatting for bot messages
    return message
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getCurrentTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Loading Screen
function initLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    
    // Add some dynamic loading text
    const loadingText = document.querySelector('.loader-text');
    const messages = [
        'Loading Portfolio...',
        'Initializing 3D Elements...',
        'Preparing Experience...',
        'Almost Ready...'
    ];
    
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
        if (messageIndex < messages.length - 1) {
            messageIndex++;
            loadingText.textContent = messages[messageIndex];
        } else {
            clearInterval(messageInterval);
        }
    }, 500);
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.classList.add('hidden');
    
    // Remove loading screen from DOM after transition
    setTimeout(() => {
        loadingScreen.style.display = 'none';
    }, 500);
}

// Custom Cursor
function initCustomCursor() {
    const cursor = document.querySelector('.cursor');
    const cursorTrail = document.querySelector('.cursor-trail');
    
    let cursorX = 0, cursorY = 0;
    let trailX = 0, trailY = 0;
    
    document.addEventListener('mousemove', (e) => {
        cursorX = e.clientX;
        cursorY = e.clientY;
    });
    
    function updateCursor() {
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
        
        // Smooth trail following
        trailX += (cursorX - trailX) * 0.1;
        trailY += (cursorY - trailY) * 0.1;
        
        cursorTrail.style.left = trailX + 'px';
        cursorTrail.style.top = trailY + 'px';
        
        requestAnimationFrame(updateCursor);
    }
    updateCursor();
    
    // Cursor interactions
    const interactiveElements = document.querySelectorAll('a, button, .btn, .project-card, .skill-tag, .timeline-content, .skill-item, .gallery-item, #chatbot-toggle, .message');
    
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            cursor.style.transform = 'scale(1.5)';
        });
        
        element.addEventListener('mouseleave', () => {
            cursor.style.transform = 'scale(1)';
        });
    });
}

// Resume Link
function initResumeLink() {
    const resumeLink = document.getElementById('resume-link');
    if (resumeLink) {
        resumeLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm("Would you like to view my resume?")) {
                window.open('tejacv.pdf', '_blank');
            }
        });
    }
}

// Gallery Lightbox
function initGalleryLightbox() {
    const lightbox = document.getElementById('gallery-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const closeBtn = document.querySelector('.lightbox-close');

    if (!lightbox || !lightboxImg || !galleryItems.length || !closeBtn) {
        return;
    }

    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            lightbox.style.display = 'block';
            lightboxImg.src = item.querySelector('img').src;
        });
    });

    const closeLightbox = () => {
        lightbox.style.display = 'none';
    }

    closeBtn.addEventListener('click', closeLightbox);
    
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
}

// Enhanced Skills Section
function initSkillsSection() {
    const skillsContainer = document.querySelector('.skills-grid');
    if (!skillsContainer) return;
    skillsContainer.innerHTML = ''; // Clear existing content
    
    Object.entries(skillsData).forEach(([categoryKey, skills]) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'skill-category';
        
        const categoryTitles = {
            languages: 'Languages',
            frameworks: 'Frameworks', 
            webTech: 'Web Technologies',
            databases: 'Databases',
            advancedTech: 'Advanced Technologies',
            deployment: 'Cloud & Deployment'
        };
        
        const categoryIcons = {
            languages: 'fas fa-code',
            frameworks: 'fas fa-layer-group',
            webTech: 'fas fa-globe',
            databases: 'fas fa-database',
            advancedTech: 'fas fa-brain',
            deployment: 'fas fa-cloud'
        };
        
        categoryDiv.innerHTML = `
            <h3><i class="${categoryIcons[categoryKey]}"></i> ${categoryTitles[categoryKey]}</h3>
            <div class="skill-list">
                ${skills.map(skill => `
                    <div class="skill-item">
                        <div class="skill-name">
                            <span>${skill.name}</span>
                            <span class="skill-level">${skill.level}%</span>
                        </div>
                        <div class="skill-progress">
                            <div class="skill-progress-bar" data-width="${skill.level}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        skillsContainer.appendChild(categoryDiv);
    });
    
    // Animate progress bars on scroll
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const skillObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progressBars = entry.target.querySelectorAll('.skill-progress-bar');
                progressBars.forEach((bar, index) => {
                    setTimeout(() => {
                        bar.style.width = bar.getAttribute('data-width');
                    }, index * 100);
                });
                skillObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.skill-category').forEach(category => {
        skillObserver.observe(category);
    });
    
    // Add hover effects for skill items
    document.querySelectorAll('.skill-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            const progressBar = item.querySelector('.skill-progress-bar');
            progressBar.style.transform = 'scaleY(1.2)';
        });
        
        item.addEventListener('mouseleave', () => {
            const progressBar = item.querySelector('.skill-progress-bar');
            progressBar.style.transform = 'scaleY(1)';
        });
    });
}

// Enhanced Timeline Interactions
function initTimelineInteractions() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    timelineItems.forEach((item, index) => {
        const content = item.querySelector('.timeline-content');
        const header = content.querySelector('.timeline-header');
        const achievements = content.querySelector('.timeline-achievements');
        
        // Add toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'timeline-toggle';
        toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
        header.appendChild(toggleBtn);
        
        // Add summary for collapsed state
        const summary = document.createElement('div');
        summary.className = 'timeline-summary';
        const summaries = [
            'Leading ML pipeline development and cloud solutions at TCS with award recognition...',
            'Developed real-time video messaging and NLP solutions for insurance industry...',
            'Conducted solar power prediction research in Russia with competition victory...'
        ];
        summary.textContent = summaries[index] || 'Click to expand for more details...';
        header.appendChild(summary);
        
        // Toggle functionality
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isExpanded = achievements.classList.contains('expanded');
            
            if (isExpanded) {
                achievements.classList.remove('expanded');
                toggleBtn.classList.remove('expanded');
                summary.style.display = 'block';
            } else {
                achievements.classList.add('expanded');
                toggleBtn.classList.add('expanded');
                summary.style.display = 'none';
            }
        });
        
        // Click to expand
        content.addEventListener('click', () => {
            if (!achievements.classList.contains('expanded')) {
                toggleBtn.click();
            }
        });
    });
}

// Enhanced Project Interactions
function initProjectInteractions() {
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        const header = card.querySelector('.project-header');
        const title = header.querySelector('h3').textContent;
        const linksContainer = header.querySelector('.project-links');
        
        // Add expand button
        const expandBtn = document.createElement('button');
        expandBtn.className = 'project-expand';
        expandBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
        linksContainer.insertBefore(expandBtn, linksContainer.firstChild);
        
        // Add details section
        const details = document.createElement('div');
        details.className = 'project-details';
        
        if (projectDetails[title]) {
            const projectData = projectDetails[title];
            details.innerHTML = `
                <div class="project-details-content">
                    <h5 style="color: var(--color-primary); margin-bottom: 12px;">Full Description</h5>
                    <p>${projectData.fullDescription}</p>
                    
                    <h5 style="color: var(--color-primary); margin-bottom: 12px; margin-top: 20px;">Technologies Used</h5>
                    <div class="project-tech-tags" style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;">
                        ${projectData.technologies.map(tech => `<span class="tag">${tech}</span>`).join('')}
                    </div>
                    
                    <h5 style="color: var(--color-primary); margin-bottom: 12px;">Key Achievements</h5>
                    <ul style="margin: 0; padding-left: 20px; color: var(--color-text-secondary);">
                        ${projectData.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
                    </ul>
                </div>
            `;
        } else {
            details.innerHTML = `
                <div class="project-details-content">
                    <p>Additional project details and technical specifications would be displayed here.</p>
                </div>
            `;
        }
        
        card.insertBefore(details, card.querySelector('.project-stats'));
        
        // Toggle functionality
        expandBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isExpanded = details.classList.contains('expanded');
            
            if (isExpanded) {
                details.classList.remove('expanded');
                expandBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
            } else {
                details.classList.add('expanded');
                expandBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
            }
        });
        
        // Card click to expand
        card.addEventListener('click', (e) => {
            if (e.target.tagName !== 'A' && !e.target.closest('a') && !e.target.closest('.project-expand')) {
                if (!details.classList.contains('expanded')) {
                    expandBtn.click();
                }
            }
        });
    });
}

// Navigation
function initNavigation() {
    const navbar = document.querySelector('.navbar');
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    const offsetTop = targetSection.offsetTop - 70;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }

                if (navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    navToggle.classList.remove('active');
                }
            }
        });
    });
    
    // Mobile navigation toggle
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });
    
    // Hide/show navbar on scroll
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }, false);
}

// Scroll Progress
function initScrollProgress() {
    const progressBar = document.querySelector('.scroll-progress');
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset;
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = scrollTop / documentHeight;
        
        progressBar.style.transform = `scaleX(${scrollProgress})`;
    });
}

// Three.js Hero Scene
function initThreeJS() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    
    // Create floating geometric shapes
    createFloatingShapes();
    
    // Camera position
    camera.position.z = 5;
    
    // Mouse interaction
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    
    // Animation loop
    animate();
    
    // Resize handler
    window.addEventListener('resize', onWindowResize, false);

    // Mobile particle optimization
    if (isMobile()) {
        const mobileParticles = particles.slice(0, 8);
        particles.forEach(p => scene.remove(p));
        particles = mobileParticles;
        particles.forEach(p => scene.add(p));
    }
}

function createFloatingShapes() {
    const geometries = [
        new THREE.BoxGeometry(0.5, 0.5, 0.5),
        new THREE.SphereGeometry(0.3, 16, 16),
        new THREE.OctahedronGeometry(0.4),
        new THREE.TetrahedronGeometry(0.4)
    ];
    
    const material = new THREE.MeshBasicMaterial({
        color: 0x00d4ff,
        wireframe: true,
        transparent: true,
        opacity: 0.6
    });
    
    for (let i = 0; i < 15; i++) {
        const geometry = geometries[Math.floor(Math.random() * geometries.length)];
        const mesh = new THREE.Mesh(geometry, material);
        
        mesh.position.x = (Math.random() - 0.5) * 20;
        mesh.position.y = (Math.random() - 0.5) * 20;
        mesh.position.z = (Math.random() - 0.5) * 20;
        
        mesh.rotation.x = Math.random() * Math.PI;
        mesh.rotation.y = Math.random() * Math.PI;
        
        // Add custom properties for animation
        mesh.userData = {
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.02,
                y: (Math.random() - 0.5) * 0.02,
                z: (Math.random() - 0.5) * 0.02
            },
            originalPosition: {
                x: mesh.position.x,
                y: mesh.position.y,
                z: mesh.position.z
            }
        };
        
        scene.add(mesh);
        particles.push(mesh);
    }
}

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) / 100;
    mouseY = (event.clientY - windowHalfY) / 100;
}

function animate() {
    if (!renderer) return;
    requestAnimationFrame(animate);
    
    // Animate particles
    particles.forEach((particle, index) => {
        // Rotation
        particle.rotation.x += particle.userData.rotationSpeed.x;
        particle.rotation.y += particle.userData.rotationSpeed.y;
        particle.rotation.z += particle.userData.rotationSpeed.z;
        
        // Floating motion
        const time = Date.now() * 0.001;
        particle.position.y = particle.userData.originalPosition.y + Math.sin(time + index) * 0.5;
    });
    
    // Camera movement based on mouse
    camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
    camera.position.y += (-mouseY * 0.5 - camera.position.y) * 0.05;
    
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Contact Section Canvas
function initContactCanvas() {
    const canvas = document.getElementById('contact-canvas');
    if (!canvas) return;
    
    contactScene = new THREE.Scene();
    contactCamera = new THREE.PerspectiveCamera(75, canvas.offsetWidth / canvas.offsetHeight, 0.1, 1000);
    contactRenderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
    contactRenderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    contactRenderer.setClearColor(0x000000, 0);
    
    // Create network-like connections
    createNetworkEffect();
    
    contactCamera.position.z = 5;
    
    animateContactCanvas();
}

function createNetworkEffect() {
    const points = [];
    const connections = [];
    
    // Create points
    for (let i = 0; i < 50; i++) {
        const geometry = new THREE.SphereGeometry(0.02, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00d4ff,
            transparent: true,
            opacity: 0.8
        });
        
        const point = new THREE.Mesh(geometry, material);
        point.position.x = (Math.random() - 0.5) * 10;
        point.position.y = (Math.random() - 0.5) * 6;
        point.position.z = (Math.random() - 0.5) * 2;
        
        contactScene.add(point);
        points.push(point);
    }
    
    // Create connections between nearby points
    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            const distance = points[i].position.distanceTo(points[j].position);
            
            if (distance < 2) {
                const geometry = new THREE.BufferGeometry().setFromPoints([
                    points[i].position,
                    points[j].position
                ]);
                
                const material = new THREE.LineBasicMaterial({
                    color: 0x00d4ff,
                    transparent: true,
                    opacity: 0.3
                });
                
                const line = new THREE.Line(geometry, material);
                contactScene.add(line);
                connections.push(line);
            }
        }
    }
}

function animateContactCanvas() {
    if(!contactRenderer) return;
    requestAnimationFrame(animateContactCanvas);
    contactRenderer.render(contactScene, contactCamera);
}

// Scroll Animations with GSAP
function initScrollAnimations() {
    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);
    
    // Hero animations
    gsap.from('.hero-content > *', {
        duration: 1,
        y: 100,
        opacity: 0,
        stagger: 0.2,
        ease: 'power3.out'
    });
    
    // Section titles
    gsap.utils.toArray('.section-title').forEach(title => {
        gsap.from(title, {
            scrollTrigger: {
                trigger: title,
                start: 'top 80%',
                toggleActions: 'play none none none'
            },
            duration: 1,
            y: 50,
            opacity: 0,
            ease: 'power3.out'
        });
    });
    
    // Cards animations
    gsap.utils.toArray('.achievement-card, .cert-card, .gallery-item').forEach((card, index) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            duration: 0.8,
            y: 80,
            opacity: 0,
            delay: (index % 4) * 0.1,
            ease: 'power3.out'
        });
    });
    
    // Timeline items
    gsap.utils.toArray('.timeline-item').forEach((item, index) => {
        gsap.from(item, {
            scrollTrigger: {
                trigger: item,
                start: 'top 80%',
                toggleActions: 'play none none none'
            },
            duration: 1,
            x: -100,
            opacity: 0,
            delay: index * 0.2,
            ease: 'power3.out'
        });
    });
    
    // Contact form animation
    gsap.from('.contact-form .form-group', {
        scrollTrigger: {
            trigger: '.contact-form',
            start: 'top 80%',
            toggleActions: 'play none none none'
        },
        duration: 0.8,
        y: 50,
        opacity: 0,
        stagger: 0.1,
        ease: 'power3.out'
    });
}

// Typewriter Effect
function initTypewriter() {
    const typewriterElement = document.querySelector('.typewriter');
    if(!typewriterElement) return;
    const text = typewriterElement.textContent;
    typewriterElement.textContent = '';
    
    let index = 0;
    
    function type() {
        if (index < text.length) {
            typewriterElement.textContent += text.charAt(index);
            index++;
            setTimeout(type, 100);
        } else {
            // Remove blinking cursor after typing is complete
            setTimeout(() => {
                if(typewriterElement.style.borderRight)
                    typewriterElement.style.borderRight = 'none';
            }, 1000);
        }
    }
    
    setTimeout(type, 1000);
}

// Counter Animation
function initCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    const observerOptions = {
        threshold: 0.7
    };
    
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-target'));
                animateCounter(counter, target);
                observer.unobserve(counter);
            }
        });
    }, observerOptions);
    
    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element, target) {
    let current = 0;
    const increment = target > 100 ? target / 100 : 1;
    const duration = 2000;
    const stepTime = Math.abs(Math.floor(duration / (target / increment)));
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, stepTime);
}

// Contact Form
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    const submitBtn = form.querySelector('.submit-btn');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Add loading state
        submitBtn.classList.add('loading');
        
        // Simulate form submission
        setTimeout(() => {
            // Remove loading state
            submitBtn.classList.remove('loading');
            
            // Show success message
            showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');
            
            // Reset form
            form.reset();
            
        }, 2000);
    });
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--color-surface);
        border: 1px solid var(--color-${type === 'success' ? 'success' : 'error'});
        color: var(--color-text);
        border-radius: var(--radius-md);
        padding: var(--space-16);
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    
    const notificationContent = notification.querySelector('.notification-content');
    notificationContent.style.cssText = `
        display: flex;
        align-items: center;
        gap: var(--space-12);
    `;
    
    const icon = notification.querySelector('i');
    icon.style.color = `var(--color-${type === 'success' ? 'success' : 'error'})`;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Simple Particle System
function initParticles() {
    const particlesContainer = document.getElementById('particles-js');
    if (!particlesContainer) return;
    
    // Create particles
    const particleCount = isMobile() ? 20 : 50;
    for (let i = 0; i < particleCount; i++) {
        createParticle(particlesContainer);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    const size = Math.random() * 3 + 1;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const duration = Math.random() * 10 + 10;
    const delay = Math.random() * 5;

    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${x}vw`;
    particle.style.top = `${y}vh`;
    particle.style.background = 'var(--color-primary)';
    particle.style.animation = `floatParticle ${duration}s ${delay}s infinite linear`;
    
    container.appendChild(particle);
}

// Add floating animation for particles
const particleAnimationStyle = document.createElement('style');
if (!document.head.querySelector('#particle-animation-style')) {
    particleAnimationStyle.id = 'particle-animation-style';
    particleAnimationStyle.textContent = `
        .particle {
            position: absolute;
            border-radius: 50%;
            opacity: 0;
            pointer-events: none;
        }
        @keyframes floatParticle {
            0% {
                transform: translateY(100vh) rotate(0deg);
                opacity: 0;
            }
            10%, 90% {
                opacity: 1;
            }
            100% {
                transform: translateY(-100px) rotate(360deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(particleAnimationStyle);
}


// ===============================================
// NEWLY ADDED/INTEGRATED CODE STARTS HERE
// ===============================================

// Enhanced interactions for project cards and skill tags
function initEnhancedInteractions() {
    // Project cards 3D effect
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 20; // Reduced intensity
            const rotateY = (centerX - x) / 20; // Reduced intensity
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        });
    });
    
    // Skill tags hover effect
    const skillTags = document.querySelectorAll('.skill-tag');
    
    skillTags.forEach(tag => {
        tag.addEventListener('mouseenter', () => {
            skillTags.forEach(otherTag => {
                if (otherTag !== tag) {
                    otherTag.style.opacity = '0.5';
                }
            });
        });
        
        tag.addEventListener('mouseleave', () => {
            skillTags.forEach(otherTag => {
                otherTag.style.opacity = '1';
            });
        });
    });
}

// Performance optimization
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Optimized scroll handler
const optimizedScrollHandler = debounce(() => {
    // Any scroll-based updates that need to be debounced can go here.
    // For now, this is kept for good practice.
}, 16); // ~60fps

window.addEventListener('scroll', optimizedScrollHandler);

// Mobile optimizations
function isMobile() {
    return window.innerWidth <= 768;
}

// Smooth scroll polyfill for older browsers (utility function)
function smoothScrollPolyfill(target, duration = 800) {
    const targetElement = document.querySelector(target);
    if (!targetElement) return;

    const targetPosition = targetElement.offsetTop - 70;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;
    
    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
    }
    
    function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }
    
    requestAnimationFrame(animation);
}

// Add chatbot floating action button animation
function animateChatbotButton() {
    const chatbotToggle = document.getElementById('chatbot-toggle');
    if (chatbotToggle) {
        chatbotToggle.classList.add('pulse');
        setTimeout(() => {
            chatbotToggle.classList.remove('pulse');
        }, 2000);
    }
}

// Animate chatbot button periodically
setInterval(animateChatbotButton, 30000); // Every 30 seconds

// Error handling
window.addEventListener('error', (e) => {
    console.error('Portfolio error:', e.error);
});

console.log('🚀 Portfolio loaded successfully!');