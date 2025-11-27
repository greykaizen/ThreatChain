#!/bin/bash

# Feature-Based Branch Creation Script for ThreatChain
# This script creates separate branches for each feature

echo "🚀 Starting feature branch creation..."
echo ""

# Make sure we're on main branch
git checkout main

# 1. Login Feature
echo "📝 Creating feature/login branch..."
git checkout -b feature/login
rm -rf app/signup app/dashboard
rm -rf components/pages components/sidebar.tsx components/navbar.tsx components/stat-card.tsx
rm -rf server.js routes/ config/ blockchain/ contracts/ ethereum/ scripts/ docs/
rm -f sample-*.json *.bat test-*.js generate_test_csv.py README-BACKEND.md
git add .
git commit -m "Feature: Login page only"
git push origin feature/login
echo "✅ feature/login created and pushed"
echo ""

# 2. Signup Feature
echo "📝 Creating feature/signup branch..."
git checkout main
git checkout -b feature/signup
rm -rf app/login app/dashboard app/page.tsx
rm -rf components/pages components/sidebar.tsx components/navbar.tsx components/stat-card.tsx
rm -rf server.js routes/ config/ blockchain/ contracts/ ethereum/ scripts/ docs/
rm -f sample-*.json *.bat test-*.js generate_test_csv.py README-BACKEND.md
git add .
git commit -m "Feature: Signup page only"
git push origin feature/signup
echo "✅ feature/signup created and pushed"
echo ""

# 3. Dashboard Overview
echo "📝 Creating feature/dashboard-overview branch..."
git checkout main
git checkout -b feature/dashboard-overview
rm -rf app/login app/signup app/page.tsx
find components/pages -type f ! -name 'dashboard-overview.tsx' -delete 2>/dev/null
rm -rf server.js routes/ config/ blockchain/ contracts/ ethereum/ scripts/ docs/
rm -f sample-*.json *.bat test-*.js generate_test_csv.py README-BACKEND.md
git add .
git commit -m "Feature: Dashboard overview page"
git push origin feature/dashboard-overview
echo "✅ feature/dashboard-overview created and pushed"
echo ""

# 4. Feed Management
echo "📝 Creating feature/feed-management branch..."
git checkout main
git checkout -b feature/feed-management
rm -rf app/login app/signup app/page.tsx
find components/pages -type f ! -name 'feed-management.tsx' -delete 2>/dev/null
rm -rf server.js routes/ config/ blockchain/ contracts/ ethereum/ scripts/ docs/
rm -f sample-*.json *.bat test-*.js generate_test_csv.py README-BACKEND.md
git add .
git commit -m "Feature: Feed management page"
git push origin feature/feed-management
echo "✅ feature/feed-management created and pushed"
echo ""

# 5. Knowledge Graph
echo "📝 Creating feature/knowledge-graph branch..."
git checkout main
git checkout -b feature/knowledge-graph
rm -rf app/login app/signup app/page.tsx
find components/pages -type f ! -name 'knowledge-graph.tsx' -delete 2>/dev/null
rm -rf server.js routes/ config/ blockchain/ contracts/ ethereum/ scripts/ docs/
rm -f sample-*.json *.bat test-*.js generate_test_csv.py README-BACKEND.md
git add .
git commit -m "Feature: Knowledge graph visualization"
git push origin feature/knowledge-graph
echo "✅ feature/knowledge-graph created and pushed"
echo ""

# 6. Trust Provenance
echo "📝 Creating feature/trust-provenance branch..."
git checkout main
git checkout -b feature/trust-provenance
rm -rf app/login app/signup app/page.tsx
find components/pages -type f ! -name 'trust-provenance.tsx' -delete 2>/dev/null
rm -rf server.js routes/ config/ blockchain/ contracts/ ethereum/ scripts/ docs/
rm -f sample-*.json *.bat test-*.js generate_test_csv.py README-BACKEND.md
git add .
git commit -m "Feature: Trust and provenance page"
git push origin feature/trust-provenance
echo "✅ feature/trust-provenance created and pushed"
echo ""

# 7. Blockchain Demo
echo "📝 Creating feature/blockchain-demo branch..."
git checkout main
git checkout -b feature/blockchain-demo
rm -rf app/login app/signup app/page.tsx
find components/pages -type f ! -name 'blockchain-demo.tsx' -delete 2>/dev/null
rm -rf server.js routes/ config/ scripts/ docs/
rm -f sample-*.json *.bat test-*.js generate_test_csv.py README-BACKEND.md
git add .
git commit -m "Feature: Blockchain demo page"
git push origin feature/blockchain-demo
echo "✅ feature/blockchain-demo created and pushed"
echo ""

# 8. Sharing Reports
echo "📝 Creating feature/sharing-reports branch..."
git checkout main
git checkout -b feature/sharing-reports
rm -rf app/login app/signup app/page.tsx
find components/pages -type f ! -name 'sharing-reports.tsx' -delete 2>/dev/null
rm -rf server.js routes/ config/ blockchain/ contracts/ ethereum/ scripts/ docs/
rm -f sample-*.json *.bat test-*.js generate_test_csv.py README-BACKEND.md
git add .
git commit -m "Feature: Sharing reports page"
git push origin feature/sharing-reports
echo "✅ feature/sharing-reports created and pushed"
echo ""

# 9. Policy Validation
echo "📝 Creating feature/policy-validation branch..."
git checkout main
git checkout -b feature/policy-validation
rm -rf app/login app/signup app/page.tsx
find components/pages -type f ! -name 'policy-validation.tsx' -delete 2>/dev/null
rm -rf server.js routes/ config/ blockchain/ contracts/ ethereum/ scripts/ docs/
rm -f sample-*.json *.bat test-*.js generate_test_csv.py README-BACKEND.md
git add .
git commit -m "Feature: Policy validation page"
git push origin feature/policy-validation
echo "✅ feature/policy-validation created and pushed"
echo ""

# 10. Clients
echo "📝 Creating feature/clients branch..."
git checkout main
git checkout -b feature/clients
rm -rf app/login app/signup app/page.tsx
find components/pages -type f ! -name 'clients.tsx' -delete 2>/dev/null
rm -rf server.js routes/ config/ blockchain/ contracts/ ethereum/ scripts/ docs/
rm -f sample-*.json *.bat test-*.js generate_test_csv.py README-BACKEND.md
git add .
git commit -m "Feature: Clients management page"
git push origin feature/clients
echo "✅ feature/clients created and pushed"
echo ""

# 11. Backend API
echo "📝 Creating feature/backend-api branch..."
git checkout main
git checkout -b feature/backend-api
rm -rf app/ components/ public/ styles/ hooks/
rm -f next.config.mjs tsconfig.json postcss.config.mjs components.json next-env.d.ts
rm -rf blockchain/ contracts/ ethereum/ docs/
rm -f *.bat
git add .
git commit -m "Feature: Backend API only"
git push origin feature/backend-api
echo "✅ feature/backend-api created and pushed"
echo ""

# 12. Blockchain
echo "📝 Creating feature/blockchain branch..."
git checkout main
git checkout -b feature/blockchain
rm -rf app/ components/ public/ styles/ hooks/
rm -rf server.js routes/ config/ scripts/ docs/
rm -f next.config.mjs tsconfig.json postcss.config.mjs components.json next-env.d.ts
rm -f sample-*.json test-*.js generate_test_csv.py *.bat
git add .
git commit -m "Feature: Blockchain integration only"
git push origin feature/blockchain
echo "✅ feature/blockchain created and pushed"
echo ""

# Return to main
git checkout main

echo ""
echo "🎉 All feature branches created successfully!"
echo ""
echo "Created branches:"
echo "  ✅ feature/login"
echo "  ✅ feature/signup"
echo "  ✅ feature/dashboard-overview"
echo "  ✅ feature/feed-management"
echo "  ✅ feature/knowledge-graph"
echo "  ✅ feature/trust-provenance"
echo "  ✅ feature/blockchain-demo"
echo "  ✅ feature/sharing-reports"
echo "  ✅ feature/policy-validation"
echo "  ✅ feature/clients"
echo "  ✅ feature/backend-api"
echo "  ✅ feature/blockchain"
echo ""
echo "You can now work on each feature independently!"
