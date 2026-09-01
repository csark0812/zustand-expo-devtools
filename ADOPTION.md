# Community and adoption

This page records claims that can be checked against public sources. It distinguishes implementation reports, maintenance outcomes, public integrations, external recognition, and download activity. None of the evidence below establishes a named company's production deployment.

## Evidence snapshot

Verified on 2026-08-31.

| Signal | Snapshot | Source | What it establishes |
| --- | ---: | --- | --- |
| npm download events, latest 30-day window | 44,386 (2026-07-31 through 2026-08-29) | [npm downloads API](https://api.npmjs.org/downloads/point/last-month/%40csark0812%2Fzustand-expo-devtools) | Registry download activity, not unique users or installations |
| npm download events, trailing year | 317,963 (2025-08-30 through 2026-08-29) | [npm downloads API](https://api.npmjs.org/downloads/point/last-year/%40csark0812%2Fzustand-expo-devtools) | Registry download activity, not retention or production use |
| GitHub stars | 95 | [Repository](https://github.com/csark0812/zustand-expo-devtools) | Public interest |
| GitHub releases | 13 | [Releases](https://github.com/csark0812/zustand-expo-devtools/releases) | Published maintenance history |

## Public implementation reports

In [issue #14](https://github.com/csark0812/zustand-expo-devtools/issues/14), [gabimoncha](https://github.com/gabimoncha) described a store using MMKV, Immer, Superjson, maps, and dayjs that needed custom Redux DevTools serialization. The request was implemented and merged for `2.1.6`.

> "Thanks a lot for creating this expo devtool."

In [issue #18](https://github.com/csark0812/zustand-expo-devtools/issues/18), [melnady-freelancer](https://github.com/melnady-freelancer) reported that the package worked on Expo SDK 53 but stopped appearing after an Expo SDK upgrade. The repository subsequently updated and verified its Expo SDK 55 development environment.

> "I've been using @csark0812/zustand-expo-devtools and it works perfectly with the following environment."

These sources establish reported use and specific maintenance outcomes. They do not identify a company customer or confirm production deployment.

## Public downstream integrations

A GitHub public-code search for the exact scoped package name found the following third-party repositories on 2026-08-31. Each link points to an indexed file that imports, configures, documents, or declares the package. Christopher's repositories, Popl repositories, FreeTimeSocial, the upstream Zustand directory, and mirrors of that directory are excluded.

| Repository | Public integration evidence |
| --- | --- |
| `AndreiCravtov/equilibria-y2-group-project` | [Zustand configuration](https://github.com/AndreiCravtov/equilibria-y2-group-project/blob/da599a322256869a5a42d38889dea937837cb4c1/apps/equilibria/util/zustand-config.ts) |
| `COMP-585/RN_Budget_Tracker` | [Store import](https://github.com/COMP-585/RN_Budget_Tracker/blob/602758eec00fb8d5db525a35c22039224441e4e2/lib/authStore.ts) |
| `DevAdi-Man/Wallpaper2` | [Package manifest](https://github.com/DevAdi-Man/Wallpaper2/blob/5dbbee93ed98a0443e58f55eb23936c07030722b/package.json) |
| `KingTimer12/cmfor-portal` | [Store configuration](https://github.com/KingTimer12/cmfor-portal/blob/66088fc36094b6c9ede7d96b0314b569fb29bed9/store/_base.js) |
| `aniketDev/expense-manager` | [Store import](https://github.com/aniketDev/expense-manager/blob/ef0ff0783b8a6131d9034547d842b4ed166067c7/src/store/index.ts) |
| `chsyu/APP-Course` | [Course example import](https://github.com/chsyu/APP-Course/blob/cc2d85218d4d14d96dcba5fafa4bd5166478e3cd/wk5/5.FABtoAddNewDiary/store/useDiaryStore.js) |
| `hoon0422/sound-level-meter` | [Store import](https://github.com/hoon0422/sound-level-meter/blob/402bdf130598d425ec703c6cc308d8cff5322d24/store/logsStore.ts) |
| `ironblock/open-studio` | [State-management documentation](https://github.com/ironblock/open-studio/blob/b0e274a700e961ae96810f43e77a2dfe39968ae3/docs/State%20Management.md) |
| `jumpbangs/motologApp` | [Store import](https://github.com/jumpbangs/motologApp/blob/b3ed4482ba096e73172775f3d160caf279ea8195/store/authStore.ts) |
| `mymorningdiary/morning-diary-app` | [Store import](https://github.com/mymorningdiary/morning-diary-app/blob/c3ca9bde0350f554d6121c359f230493d5c036dc/src/shared/lib/auth/store.ts) |
| `sinhong2011/discover-sports-hk` | [Jest integration configuration](https://github.com/sinhong2011/discover-sports-hk/blob/92a3e42a3838bb4378e5f49e2bd51efd11d190ee/jest.config.js) |

Public source presence establishes a public integration, not active maintenance, a shipped binary, or production use.

## External recognition

The official [Zustand third-party libraries directory](https://github.com/pmndrs/zustand/blob/main/docs/reference/integrations/third-party-libraries.md) lists `@csark0812/zustand-expo-devtools` as an Expo and React Native integration using the official Expo DevTools plugin system.

## Evidence boundary

- **Confirmed production use** requires an explicit, attributable public statement that the package is used in production.
- **Public implementation report** means a developer publicly said they implemented or used the package.
- **Public integration** means a public repository contains an indexed dependency, import, configuration, or implementation reference.
- **External recognition** means an independent public source included the package.
- **Download activity** counts npm download events, not people, applications, or companies.

Have a public implementation to share? Use the [project showcase form](https://github.com/csark0812/zustand-expo-devtools/issues/new?template=showcase.yml). Submissions are not described as production use unless they include public supporting evidence and permission to quote them.
