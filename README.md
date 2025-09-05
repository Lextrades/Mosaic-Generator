<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/108468c3-0dd3-4328-8606-3ca8890cdba9" />
</div>

Mosaic-Generator
The Mosaic-Generator project creates stunning mosaics from uploaded photos. This README.md will guide you through the local setup and preparation for deployment.

🚀 
# Run Locally
Follow these steps to get the project running on your local machine.
📋 
**Prerequisites:**  Node.js
Make sure you have Node.js (recommended version 18 or higher) and a package manager (npm or Yarn) installed.
🛠️ Installation
1. Clone the Repository: git clone https://github.com/Lextrades/Mosaic-Generator.git
2. cd Mosaic-Generator
3. Install Dependencies:
   ```
   npm install
   ```
   ## Or if you use Yarn:
   ```
   yarn install
   ```
4.  Analogy: You have the cookbook, but you're missing ingredients. This command gets all the necessary ingredients for the recipes in the book. 
5. Install React Plugin (if not already done): Since this is a React project with Vite, you'll need `@vitejs/plugin-react`.
   ```
   npm install -D @vitejs/plugin-react
   ```
   ### Or with Yarn:
   ```
   yarn add -D @vitejs/plugin-react
   ```
    
6. Update `vite.config.ts`: Ensure your vite.config.ts uses the React plugin. Add the import and the plugins property:
```
    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react'; // Add import
    import path from 'path';
    
    export default defineConfig({
      plugins: [react()], // Add plugin here
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        },
      },
      // ... other configurations remain unchanged ...
    });
```
 
🏃 Start Local Project
After installation, you can start the project in development mode:
```
npm run dev
```
### Or with Yarn:
```
yarn dev
```

Your project will typically be available at http://localhost:5173 (or a similar port).

📦 
## Run and deploy your App
To deploy your project to a server, you need to optimize it for production and potentially adjust the base URL if it's hosted in a subfolder.
⚙️ Adjust `vite.config.ts` for Subfolder Hosting
If you want to host the project not in the root directory of your server, but in a specific subfolder (e.g., /Mosaic/), Vite needs to know where to find the static assets.
Modify your `vite.config.ts` as follows by adding the base property:
```
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/Mosaic/', // <-- Specify your subfolder path here
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // ... other configurations remain unchanged ...
});
```

🏗️ Build Project
To compile and optimize the project for production:
```
npm run build
```
### Or with Yarn:
```
yarn build
```

After this command, you will find the production-ready files in the dist/ directory. These files can be deployed to your web server.

Good luck with your Mosaic-Generator!

