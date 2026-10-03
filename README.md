# Interest Calculator (RTCC / Simple Interest)

A simple, offline, mobile-friendly Interest Calculator built with plain
HTML, CSS, and React. No Bootstrap, Tailwind, external libraries, APIs,
CDNs, or backend — everything needed to run is inside this folder.

## Formula used — RTCC

**RTCC = Rate × Time × Capital ÷ Constant (100)**, i.e. the standard
simple-interest formula:

```
Interest = (Capital × Rate × Time) / 100
```

- **Capital** — the Principal Amount, in rupees
- **Rate** — the annual Interest Rate, in percent
- **Time** — the duration, converted to years (days ÷ 365, months ÷ 12)
- **Constant** — always 100, because Rate is a percentage

The interest is calculated once on the principal (not compounded), so
the numbers stay simple and predictable. See the comments in
`src/calculations.js` for the full implementation.

## Folder structure

```
interest-calculator/
├── src/                   React source (JSX) — edit here
│   ├── calculations.js    Formula + validation logic (no UI code)
│   ├── App.jsx             All UI components
│   └── index.jsx           Mounts <App /> into the page
├── www/                    Ready-to-run offline app (what ships / what
│   │                       an APK tool packages) — generated from src/
│   ├── index.html
│   ├── css/styles.css
│   └── js/app.bundle.js    React + the app, bundled into one local file
├── package.json
└── README.md
```

## Running it offline

`www/index.html` is a fully self-contained page. Open it directly in
any modern browser (double-click it, or `file://.../www/index.html`) —
no server, build step, or internet connection is required to *use* the
app. It has already been built for you; `www/js/app.bundle.js`
contains React and the app code together.

## Rebuilding after changing the source

If you edit anything in `src/`, rebuild the bundle with:

```bash
npm install   # first time only — installs react, react-dom, esbuild locally
npm run build # bundles src/ into www/js/app.bundle.js
```

This uses [esbuild](https://esbuild.github.io/) to compile the JSX and
bundle React into a single local file — no runtime transpiler and no
network access are needed to view the app afterwards.

## Packaging as an Android APK

The `www/` folder is a standard static-web-app package, which is what
tools like **Apache Cordova** or **Capacitor** expect as their web
assets folder. Typical steps:

### Using Capacitor
```bash
npm install @capacitor/core @capacitor/cli
npx cap init "Interest Calculator" "com.example.interestcalculator" --web-dir=www
npx cap add android
npx cap copy
npx cap open android   # opens Android Studio to build the APK
```

### Using Cordova
```bash
npm install -g cordova
cordova create interest-calculator-app com.example.interestcalculator "Interest Calculator"
# then replace the generated www/ folder with this project's www/ folder
cd interest-calculator-app
cordova platform add android
cordova build android
```

Either way, because the app has no external network calls, fonts, or
CDN assets, it will run identically inside the Android WebView with no
internet connection.
