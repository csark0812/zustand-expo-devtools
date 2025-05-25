# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2025-05-25

### Added
- Complete rewrite with fully integrated Redux DevTools Extension UI
- Custom WebUI built with @redux-devtools/app-core for seamless DevTools experience
- Redux-style middleware API for handling devtools communication
- Persistent store configuration with redux-persist and localforage
- Enhanced state monitoring with improved action tracking
- Ping/pong message handling for connection testing
- Full TypeScript rewrite with improved type definitions
- Build scripts for automated WebUI compilation and distribution

## [0.1.6] - 2025-05-25

### Added
- Initial release of Zustand Expo DevTools
- Integration with Redux DevTools Extension
- Support for Expo DevTools platform
- TypeScript support with full type definitions
- Production build safety (automatically disabled)
- Example app demonstrating usage
- Support for Zustand 5.0.5+
- Support for Expo SDK 53+

### Features
- State inspection in real-time
- Action tracking with named actions
- Time travel debugging via Redux DevTools
- Seamless Expo integration
- Works with other Zustand middleware (immer, persist)

