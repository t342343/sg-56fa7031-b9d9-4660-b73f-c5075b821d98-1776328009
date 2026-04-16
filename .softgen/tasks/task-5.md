---
title: "GitHub Sync Test"
status: "done"
priority: "low"
type: "chore"
tags: ["test", "github"]
created_by: "Softgen"
position: 5
---
## Notes
    Context: Implementieren eines Bruteforce-Schutzes für den Admin-Login, um unberechtigte Zugriffsversuche zu blockieren.
    Requirements:
    - Maximal 3 fehlgeschlagene Login-Versuche für die Admin-E-Mail
    - 15 Minuten Sperre nach 3 Fehlversuchen
    - Serverseitige Durchsetzung über Supabase RPC
    - Fehler im UI klar kommunizieren
    - Logs für jeden Versuch speichern

    ## Checklist
    - [x] Create RPC function `check_admin_login_block` to verify attempt counts
    - [x] Create RPC function `log_admin_login` to record attempts
    - [x] Create table `admin_login_attempts` to store login history
    - [x] Update `authService.signInAdmin` to enforce checks and log results
    - [x] Handle UI error states for blocked logins
    - [x] Test the locking mechanism