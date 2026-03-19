# pushtogit Setup Guide

## Overview

The `pushtogit` function is a PowerShell script that helps you safely commit and push code to GitHub or any Git remote while **preventing confidential files** (like `.env` or API keys) from being uploaded.
This guide will show you how to set it up in **VS Code** so you can use it in any project.

---

## Prerequisites

* **Git** installed: [https://git-scm.com/downloads](https://git-scm.com/downloads)
* **PowerShell** (comes with Windows 10/11)
* **VS Code** installed: [https://code.visualstudio.com/](https://code.visualstudio.com/)

---

## Step 1: Open your PowerShell profile

1. Open VS Code.
2. Open the **PowerShell terminal** in VS Code (`Ctrl + ` or `View → Terminal`).
3. Run the command to open your PowerShell profile:

```powershell
notepad $PROFILE
```

> If the file does not exist, create it first:

```powershell
New-Item -ItemType File -Path $PROFILE -Force
notepad $PROFILE
```

This file is where PowerShell stores your custom functions.

---

## Step 2: Add the `pushtogit` function

Copy the following function into your PowerShell profile:

```powershell
function pushtogit {
    $folderName = Split-Path -Leaf (Get-Location)

    # Files/patterns to NEVER commit
    $blockedFiles = @(".env", ".env.*", "*.key", "*.pem", "*.secret")

    # Show status first
    git status

    # Confirm staging
    $confirm = Read-Host "Stage all files? (y/n)"
    if ($confirm -ne "y") {
        Write-Host "Aborted."
        return
    }

    # Stage everything
    git add .

    # Remove sensitive files from staging
    foreach ($pattern in $blockedFiles) {
        git reset $pattern 2>$null
    }

    # Check if anything left to commit
    if (-not [string]::IsNullOrEmpty((git status --porcelain))) {
        # Ask for commit message
        $commitMsg = Read-Host "Enter commit message"
        if ([string]::IsNullOrWhiteSpace($commitMsg)) {
            $commitMsg = "Update $folderName"
        }
        git commit -m "$commitMsg"
    }
    else {
        Write-Host "Nothing to commit after excluding sensitive files."
        return
    }

    # Show remotes
    Write-Host "Current remotes:"
    git remote -v

    # Ask for remote
    $remote = Read-Host "Enter remote name (or paste repo URL)"
    if ($remote -like "https://*") {
        $name = Read-Host "Enter a name for this new remote"
        git remote add $name $remote
        $remote = $name
    }

    # Push
    git push -u $remote main
}
```

Save the file (`Ctrl + S`) and close Notepad.

---

## Step 3: Reload your profile

After editing your profile, run this in the PowerShell terminal:

```powershell
. $PROFILE
```

> This reloads your profile so the function is immediately available.

---

## Step 4: Make sure `.gitignore` is set up

In the root of your project, create a `.gitignore` file (if it doesn’t exist) and add:

```gitignore
.env
.env.*
*.key
*.pem
*.secret
```

> This ensures Git ignores sensitive files even if you forget to remove them manually.

---

## Step 5: Use the function

1. Open the terminal in your project folder.
2. Run the function:

```powershell
pushtogit
```

3. Follow the prompts:

   * **Stage all files?** → Type `y` to stage everything (safe files only) or `n` to cancel.
   * **Commit message** → Enter a custom message or leave blank for a default.
   * **Remote** → Enter a remote name (or paste a URL) to push your changes.

---

## Step 6: Optional safety tips

* Always check `git status` before committing.
* If `.env` was accidentally committed before, remove it from tracking:

```powershell
git rm --cached .env
git commit -m "Remove .env from tracking"
git push
```

* Rotate any keys or secrets if they were ever pushed to a public repository.

---

## ✅ Summary

With this setup:

* You can **commit and push code safely**.
* `.env` and other sensitive files are **never uploaded by accident**.
* The function is **available in all your projects** from VS Code PowerShell terminal.
