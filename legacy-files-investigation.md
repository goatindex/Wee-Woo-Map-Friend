# Legacy Files Investigation

## Problem Statement
- Map not loading on deployed site (https://goatindex.github.io/mapexp.github.io/)
- Sidebar not responsive
- Console shows legacy file references (bootstrap.js, preloader.js, etc.)
- Need to determine if legacy files actually exist in deployment
- Previous migration should have removed all legacy files

## Investigation Log

### 2025-01-01 - Initial Analysis
- **Findings**: Console output shows references to legacy files
- **Assumptions**: Legacy files still exist in deployment (NEEDS VERIFICATION)
- **Next Steps**: Verify what files actually exist on GitHub Pages

### 2025-01-01 - Self-Critic Review
- **Critical Realization**: Console references could be from source maps, not actual files
- **Assumption Error**: Assumed legacy files exist without direct verification
- **Revised Approach**: Must verify actual deployed files before taking action

## Key Questions
1. Do legacy files actually exist in deployment?
2. Is the build process working correctly?
3. Are console errors from source maps?
4. Is this a browser cache issue?
5. Why are legacy files still referenced if migration was completed?

## Investigation Phases

### Phase 1: Verification & Analysis (CRITICAL - Do First)
- [ ] Check what files actually exist on GitHub Pages
- [ ] Test direct URLs for suspected legacy files
- [ ] Compare deployed file structure with local codebase
- [ ] Document actual vs expected file differences

### Phase 2: Build Process Analysis
- [ ] Run `npm run build` locally
- [ ] Check what files are created in `dist/` directory
- [ ] Verify if legacy files are being included in build
- [ ] Test if build process works correctly

### Phase 3: Console Output Analysis
- [ ] Determine if console errors are from source maps
- [ ] Check if line numbers correspond to actual files
- [ ] Verify if errors are from bundled vs source files
- [ ] Test in incognito mode to rule out cache issues

### Phase 4: Browser Cache Testing
- [ ] Test in incognito/private mode
- [ ] Clear browser cache and test
- [ ] Test with different browsers
- [ ] Check if hard refresh fixes issues

## Findings Summary
- **To be filled as we investigate**

## Resolution Plan
- **To be updated based on findings**

## Notes
- Previous migration should have removed all legacy files
- Console errors suggest legacy system is trying to run
- Need to verify if this is a deployment issue or build issue
- Must not make assumptions about file existence

## Status
- **Current Phase**: Planning and preparation
- **Next Action**: Start Phase 1 verification
- **Blockers**: None identified




