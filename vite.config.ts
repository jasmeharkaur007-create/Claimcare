import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';

function copyVanillaAssetsPlugin(): Plugin {
  return {
    name: 'copy-vanilla-assets',
    closeBundle() {
      const copyDirRecursive = (srcDir: string, destDir: string) => {
        if (!fs.existsSync(srcDir)) return;
        fs.mkdirSync(destDir, { recursive: true });
        for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
          const srcPath = path.join(srcDir, entry.name);
          const destPath = path.join(destDir, entry.name);
          if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      };

      copyDirRecursive(path.resolve(__dirname, 'js'), path.resolve(__dirname, 'dist/js'));
      copyDirRecursive(path.resolve(__dirname, 'css'), path.resolve(__dirname, 'dist/css'));
      copyDirRecursive(path.resolve(__dirname, 'assets'), path.resolve(__dirname, 'dist/assets'));
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [copyVanillaAssetsPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          login: path.resolve(__dirname, 'login.html'),
          register: path.resolve(__dirname, 'register.html'),
          dashboard: path.resolve(__dirname, 'dashboard.html'),
          submitClaim: path.resolve(__dirname, 'submit-claim.html'),
          myClaims: path.resolve(__dirname, 'my-claims.html'),
          trackClaim: path.resolve(__dirname, 'track-claim.html'),
          documents: path.resolve(__dirname, 'documents.html'),
          profile: path.resolve(__dirname, 'profile.html'),
          admin: path.resolve(__dirname, 'admin.html'),
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
