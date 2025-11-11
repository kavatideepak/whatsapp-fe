# Synapse - Internal Chat Application 💬

This is a [React Native](https://reactnative.dev) chat application built with [Expo](https://expo.dev) and created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## 📱 Features

- 🔐 Phone number authentication with OTP
- 💬 Real-time chat functionality
- 👥 Contact management
- 📞 Call integration
- ⚙️ User settings and profile management
- 🎨 Modern UI with custom theming
- 💾 Persistent authentication with AsyncStorage

## 🚀 Get Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a:

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## 📚 Documentation

- [Authentication Implementation](.github/AUTH_IMPLEMENTATION.md) - Complete guide on auth flow
- [Auth Flow Diagram](.github/AUTH_FLOW_DIAGRAM.md) - Visual diagrams of authentication
- [Design System](.github/DESIGN_SYSTEM.md) - UI/UX design guidelines
- [Copilot Guide](.github/COPILOT_GUIDE.md) - GitHub Copilot usage instructions

## 🏗️ Project Structure

```
synapse_fe/
├── app/                    # Main application screens
│   ├── (tabs)/            # Tab navigation screens
│   ├── onboarding.tsx     # Onboarding flow
│   ├── verify-phone.tsx   # Phone verification
│   ├── verify-otp.tsx     # OTP verification
│   └── ...
├── components/            # Reusable components
├── context/              # React Context (Auth, etc.)
├── services/             # API services
├── config/               # Configuration files
├── constants/            # Theme and constants
└── types/                # TypeScript type definitions
```

## 🔧 Tech Stack

- **Framework**: React Native + Expo
- **Navigation**: Expo Router
- **State Management**: React Context
- **Storage**: AsyncStorage
- **Language**: TypeScript
- **UI**: Custom components with SF Pro Text font

## 📖 Learn More

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## 👥 Join the Community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
