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
3.  Analogy: Imagine you're borrowing a cookbook from the library. This is like cloning the project to your computer. 
4. Install Dependencies: npm install
5. # Or if you use Yarn:
6. # yarn install
7.  Analogy: You have the cookbook, but you're missing ingredients. This command gets all the necessary ingredients for the recipes in the book. 
8. Install React Plugin (if not already done): Since this is a React project with Vite, you'll need @vitejs/plugin-react. npm install -D @vitejs/plugin-react
9. # Or with Yarn:
10. # yarn add -D @vitejs/plugin-react
11.  Analogy: This plugin is a special tool that Vite needs to handle React recipes. If you don't have it yet, you need to add it. 
12. Update vite.config.ts: Ensure your vite.config.ts uses the React plugin. Add the import and the plugins property: // vite.config.ts
13. import { defineConfig } from 'vite';
14. import react from '@vitejs/plugin-react'; // Add import
15. import path from 'path';
16. 
17. export default defineConfig({
18.   plugins: [react()], // Add plugin here
19.   resolve: {
20.     alias: {
21.       '@': path.resolve(__dirname, './src'),
22.     },
23.   },
24.   // ... other configurations remain unchanged ...
25. });
26.  Analogy: You're telling your kitchen robot (Vite) that it should now use the new tool (React plugin) so it can perform React-specific tasks. 
🏃 Start Local Project
After installation, you can start the project in development mode:
npm run dev
# Or with Yarn:
# yarn dev
Analogy: This is like turning on your kitchen robot in "test run" mode. It prepares everything so you can immediately see changes as you refine the recipe.
Your project will typically be available at http://localhost:5173 (or a similar port).

📦 
## Run and deploy your App
To deploy your project to a server, you need to optimize it for production and potentially adjust the base URL if it's hosted in a subfolder.
⚙️ Adjust vite.config.ts for Subfolder Hosting
If you want to host the project not in the root directory of your server, but in a specific subfolder (e.g., /Mosaic/), Vite needs to know where to find the static assets.
Modify your vite.config.ts as follows by adding the base property:
// vite.config.ts
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
Analogy: Imagine you're packing your dish (project) into a special box (subfolder) for shipping. You need to tell the delivery service (Vite) that the box isn't right at the front door, but in the shed labeled "Mosaic". The base field is this instruction.
🏗️ Build Project
To compile and optimize the project for production:
npm run build
# Or with Yarn:
# yarn build
Analogy: This is the moment you bake and cook your finished dish (project). All ingredients are mixed, baked, and nicely packaged so it lasts a long time and can be served quickly.
After this command, you will find the production-ready files in the dist/ directory. These files can be deployed to your web server.

Good luck with your Mosaic-Generator!

