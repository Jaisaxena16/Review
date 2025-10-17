# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/335bbd73-730b-48b4-85dd-88ae2b456ca4

## Backend prediction API

This repository now ships with an optional Flask backend located in `server/`.
The API exposes your FastText + Logistic Regression pipeline via `POST /api/predict`.

1. Place the provided model artifacts inside `server/models/`:
   - `fasttext_model.bin`
   - `fasttext_model.bin.wv.vectors_ngrams.npy`
   - `logistic_regression_model.pkl`
2. Create a virtual environment and install the backend dependencies:

   ```bash
   cd server
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. Run the Flask app:

   ```bash
   flask --app app run --host 0.0.0.0 --port 5000
   ```

4. Start the Vite development server as usual. When you are working inside a
   Codespace, Gitpod or a similar remote environment you may find it handy to
   bind to all interfaces explicitly:

   ```bash
   npm run dev -- --host 0.0.0.0 --port 5173
   ```

   The front-end will call the Flask API at `http://localhost:5000`. You can
   change the endpoint by setting `VITE_API_BASE_URL` before running
   `npm run dev`.

### Verifying the development server

Once the Vite server is running you can confirm that the app is being served by
curling the root URL:

```bash
curl -I http://localhost:5173
```

The command should return a `200 OK` response. If the optional Flask backend is
not running or the ML models are unavailable the UI will gracefully fall back
to its built-in heuristic predictor so you can continue to test the review
workflow end to end.

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/335bbd73-730b-48b4-85dd-88ae2b456ca4) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/335bbd73-730b-48b4-85dd-88ae2b456ca4) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
