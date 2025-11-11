# 🤖 Copilot Agent Guide – Synapse

## 🧠 Coding Style
- Always use **functional components** with hooks  
- Use `useTheme()` from `/src/theme/`  
- Keep styles in `/styles.js`  
- Use ES modules (`import/export`)  
- Type-check with PropTypes or TypeScript interfaces  

## 🧩 Component Generation Rules
When creating new components:
- Create a folder per component (`/Button/`, `/ChatItem/`)
- Include `index.js` and `styles.js`
- Respect theme and spacing guidelines from DESIGN_SYSTEM.md

## 🎨 UI Behavior
- Respect dark/light theme values
- Use icons from `react-native-vector-icons`
- Use consistent elevation and padding
- Animate transitions via `react-native-reanimated` or `Animated`

## 🧭 Navigation Rules
- Use `@react-navigation` for tab and stack navigation
- Define routes in `/navigation/RootNavigator.js`
- Use descriptive screen names: `LoginScreen`, `ChatScreen`, etc.

## 📡 Data and Context
- Access user/session data via `/context/AuthContext.js`
- Access chat/contact data via `/context/ChatContext.js`
- Avoid prop drilling — use context hooks instead