#!/bin/bash
echo "🚀 Deploying to Cloudflare Pages..."
cd /Users/harry/Documents/my-web-site
git add -A
git commit -m "Update $(date '+%Y-%m-%d %H:%M:%S')"
git push origin main
npx wrangler pages deploy . --project-name=loaninca
echo "✅ Deployment complete!"
