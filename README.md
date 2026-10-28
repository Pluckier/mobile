# Mobile

A React Native / Expo app for browsing race cards, form trends, and horse data for a betting / racing dashboard.

## Features
- View race cards for a selected date
- Move between races with previous/next navigation
- Jump directly to a valid race index from the counter
- Review horse rows and performance details
- Toggle light/dark theme
- Refresh race data and switch dates
- Works in Expo web and mobile environments

## Tech Stack
- React Native
- Expo
- Zustand
- JavaScript

## Prerequisites
- Node.js 18+
- npm or yarn

## Installation

```bash
npm install
```

## Running the app

Start the Expo development server:

```bash
npm start
```

Then run one of the following:

```bash
npm run android
npm run ios
npm run web
```

## Project Structure

```text
.
├── App.js
├── styles.js
├── src/
│   ├── components/
│   ├── constants/
│   ├── hooks/
│   ├── store/
│   └── utils/
├── package.json
├── .gitignore
└── README.md
```

## Notes
This project is configured for Expo and uses a local store for UI state and race navigation behavior.

## License
This project is private and not currently licensed for public reuse.
