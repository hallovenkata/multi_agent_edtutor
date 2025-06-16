# Multi-Agent Educational Tutor

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

An intelligent, multi-agent educational platform designed to provide personalized STEM tutoring through AI-powered agents. This application helps students learn and practice STEM subjects with adaptive learning paths, interactive problem-solving, and real-time feedback.

## ✨ Features

- **Multi-Agent System**: Multiple specialized AI agents work together to provide comprehensive educational support
- **Personalized Learning**: Adapts to individual student's learning style, pace, and knowledge level
- **Interactive STEM Tutoring**: Supports various STEM subjects with interactive problem-solving
- **Voice Controls**: Hands-free interaction with voice commands and responses
- **Progress Tracking**: Monitors student performance and learning progress
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- npm or yarn package manager
- OpenAI API key (or other supported LLM provider)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/hallovenkata/multi-agent-edtutor.git
   cd multi-agent-edtutor
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key
   # Add other required environment variables
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **AI Integration**: OpenAI, Anthropic, Google AI
- **State Management**: React Hooks, Context API
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Custom components built with Radix UI primitives
- **Animation**: Framer Motion

## 🧠 Architecture

The application follows a modular architecture with the following key components:

- **Agents**: Specialized AI agents for different educational roles
- **Services**: Core business logic and API integrations
- **Hooks**: Custom React hooks for state management and side effects
- **Components**: Reusable UI components
- **Utils**: Helper functions and utilities

## 🤖 Available Agents

- **Tutor Agent**: Provides explanations and guides through problems
- **Assessment Agent**: Evaluates student understanding and progress
- **Hints Agent**: Offers contextual hints and guidance
- **Feedback Agent**: Provides constructive feedback on solutions
- **Progress Tracker**: Monitors and reports on learning progress

## 🌟 Features in Detail

### Interactive Problem Solving
- Step-by-step guidance through STEM problems
- Adaptive difficulty adjustment
- Multiple solution approaches

### Real-time Feedback
- Instant validation of answers
- Detailed explanations for incorrect solutions
- Progress tracking and analytics

### Voice Interaction
- Voice commands for hands-free navigation
- Speech-to-text for problem input
- Text-to-speech for responses

### Learning Analytics
- Performance metrics and insights
- Learning progress visualization
- Knowledge gap identification

## 📚 Documentation

For detailed documentation, please refer to the [docs](/docs) directory.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components powered by [Radix UI](https://www.radix-ui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide](https://lucide.dev/)