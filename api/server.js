const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Resume knowledge base
const RESUME_CONTEXT = `
PERSONAL INFORMATION:
- Name: Teja
- Role: MLOps Engineer with expertise in developing scalable machine learning pipelines and cloud-native solutions
- Education: Currently pursuing Master's in Computer Science (GPA: 9.33/10.0)
- Experience: Working at Tata Consultancy Services (TCS) 2022 & 2024
- Research: 7300+ Views, 100+ Citations on published research

TECHNICAL SKILLS:

Programming Languages:
- Python (95% proficiency)
- Java (90% proficiency)  
- C++ (85% proficiency)
- C (80% proficiency)
- R (75% proficiency)

Frameworks & Libraries:
- TensorFlow (92% proficiency)
- PyTorch (88% proficiency)
- ReactJS (85% proficiency)
- Spring-Boot (82% proficiency)
- Angular (78% proficiency)
- Kubernetes (85% proficiency)

Web Technologies:
- HTML/CSS (90% proficiency)
- JavaScript (88% proficiency)
- Bootstrap (85% proficiency)
- jQuery (80% proficiency)

Databases:
- MongoDB (85% proficiency)
- PostgreSQL (82% proficiency)
- MySQL (80% proficiency)
- Oracle (75% proficiency)

Advanced Technologies:
- Machine Learning (95% proficiency)
- Natural Language Processing (90% proficiency)
- Docker (88% proficiency)
- Data Analysis (92% proficiency)
- Linux (85% proficiency)

Cloud & Deployment:
- Google Cloud Platform (90% proficiency)
- CI/CD Pipelines (85% proficiency)
- Cloud Build (82% proficiency)
- App Engine (80% proficiency)
- Cloud RUN (85% proficiency)

MAJOR PROJECTS:

1. Industrial Solar Forecasting System
   - Description: Comprehensive machine learning-based photovoltaic forecasting system for large-scale solar power plants within the Russian power system
   - Technologies: Python, Machine Learning, Time Series Analysis, Weather APIs, Data Preprocessing
   - Achievements:
     * Achieved 95% forecasting accuracy for day-ahead predictions
     * Reduced forecasting errors by 40% compared to traditional methods
     * Successfully deployed in production for Russian power grid
     * Research published in high-impact Energies Journal (Impact Factor 5.0)

2. Supreme Court Case Prediction using HCNN
   - Description: Advanced deep learning system using Hierarchical Convolutional Neural Networks to predict Supreme Court case outcomes
   - Technologies: TensorFlow, NLP, Web Scraping, HCNN, Gensim, Word2Vec, Python
   - Achievements:
     * Processed and analyzed 70 years of Supreme Court judgment data
     * Achieved 78% prediction accuracy using HCNN architecture
     * Implemented advanced NLP preprocessing pipeline
     * Published research in prestigious Springer conference

3. Random Forest Solar Power Prediction
   - Description: Robust solar power generation prediction system using Random Forest Regressor algorithms
   - Technologies: Random Forest, Python, Weather Data APIs, Statistical Analysis, Feature Engineering
   - Achievements:
     * Integrated multiple data sources for comprehensive analysis
     * Optimized feature selection for improved model performance
     * Tested on real solar power plant in southern Russia
     * Demonstrated practical implementation and validation

4. Renewable Energy Strategic Planning
   - Description: Comprehensive methodology for integrating renewable energy sources into strategic energy sector development plans
   - Technologies: Strategic Planning, Economic Analysis, Environmental Assessment, Python, Data Visualization
   - Focus: Multi-criteria decision framework with ranked project evaluation system

5. Remote Microgrid Development
   - Description: Autonomous microgrid solution for remote residential customers' power supply
   - Technologies: Load Forecasting, Optimization Algorithms, Renewable Energy, Grid Management, Python
   - Focus: Environmental sustainability and optimal capacity determination

6. Personal Portfolio Website
   - Description: Full-stack portfolio website with modern React architecture
   - Technologies: ReactJS, NodeJS, Firebase, Google Auth, Netlify, React Hooks
   - Features: Google Authentication, interactive games, SAAS application components

CERTIFICATIONS:
- Certified Application Integration Professional
- Machine Learning Course by Andrew Ng – Coursera Stanford
- Advanced Machine Learning Specialization – HSE University
- Published in ICAECT 2020 – Springer Conference

CAREER GOALS:
Actively seeking opportunities to apply skills to complex challenges in Machine Learning and Artificial Intelligence, with a goal to contribute to innovative projects that push the boundaries of AI.
`;

// System prompt for the chatbot
const SYSTEM_PROMPT = `You are an intelligent assistant representing a skilled MLOps Engineer Mr. Teja portfolio. Your role is to answer questions about his professional background, skills, projects, and experience based solely on the provided resume information.

Please Note: Mr. Teja is your master and address teja with atmost respect.

Guidelines:
1. Be professional, friendly, and enthusiastic about the candidate's work
2. Only answer questions related to the resume content provided
3. If asked about information not in the resume, politely redirect to relevant topics
4. Highlight achievements and technical expertise when relevant
5. Provide specific details about projects, technologies, and accomplishments
6. If asked about availability or contact, mention they are actively seeking ML/AI opportunities
7. Use a conversational tone while maintaining professionalism
8. Keep responses concise but informative
9. Don't make up information not present in the resume

Resume Context:
${RESUME_CONTEXT}`;

// Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const botResponse = completion.choices[0].message.content;

    res.json({
      success: true,
      response: botResponse,
      timestamp: new Date().toISOString()
    });
    console.log('User message:', message);
    console.log('Bot response:', botResponse);
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while processing your request. Please try again.'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Chat endpoint: http://localhost:${PORT}/chat`);
});