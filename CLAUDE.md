@AGENTS.md

# Coding Guidelines
- Lines should not exceed 100 characters, with a hard cutoff at 130.  If it exceed 130, we'll need an alternate approach
- Files should not exceed 100 lines with a hard cutoff at 150.  If we exceed 150 we should stop and adjust our design to split it up of simplify things
- New NPM packages can't be introduced without explicit approval

# General guidance
- never launch dev server from claude shell, I will always launch dev server myself
- If we drift into building or exploring features not in PLAN.md, we should stop and adjust the plan before changing anything in the project

# Plan tracking workflow
- PLAN.md uses markdown checkboxes (`- [ ]` / `- [x]`) to track progress
- When a task is completed, mark it `- [x]` in PLAN.md
- Before starting work, review PLAN.md to identify the next unchecked item
- Do not skip ahead to later phases while earlier items are unchecked
- New scope or features must be added to PLAN.md before implementation
