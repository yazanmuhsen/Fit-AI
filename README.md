# 💪 WorkoutAI — GitHub Pages Deployment

A workout planner that runs entirely in the browser. No backend, no API key, completely free.

---

## 🚀 How to Deploy to GitHub Pages

### Step 1 — Push to GitHub
Create a new repository on [github.com](https://github.com/new), then run in your terminal:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### Step 2 — Enable GitHub Pages
1. In your GitHub repo, go to **Settings → Pages**
2. Under **Source**, select **GitHub Actions**
3. Save

### Step 3 — Deploy!
1. Go to the **Actions** tab in your repo
2. Click **Deploy to GitHub Pages**
3. Click **Run workflow**

Your live URL: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME` 🎉

---

## 💻 Running Locally

```bash
npm install
npm run dev
```

---

## 🛠 Making Changes

Paste any file into Claude and describe what you want changed. Claude will give you the updated file to drop back in, then push to GitHub and it auto-deploys! ✨
