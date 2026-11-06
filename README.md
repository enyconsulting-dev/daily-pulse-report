# Welcome to your Lovable project

## Vercel environment variables

Configure these variables in Vercel. Keep the admin and service-role values server-only; do not prefix them with `VITE_`.

- `VITE_ADMIN_PASSWORD`: existing admin login configuration, also used by the serverless login endpoint for compatibility.
- `ADMIN_PASSWORD`: recommended server-only replacement for `VITE_ADMIN_PASSWORD`.
- `ADMIN_SESSION_SECRET`: recommended randomly generated secret used to sign the HttpOnly admin session cookie. If unset, the session secret is derived from the configured admin password.
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service-role key used only by the protected staff deletion and metric-management APIs.
- `SUPABASE_URL`: Supabase project URL for those APIs. If omitted, they use `VITE_SUPABASE_URL`.

The service-role key bypasses row-level security and must never be exposed to browser code.
Admin login, staff deletion, and metric management use Vercel serverless functions; use `vercel dev` locally so those endpoints are available.

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

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

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
