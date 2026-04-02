---
description: Automatically check and correct today's stock pick if it is invalid (non-equity, delisted, etc.)
---
# Correct Stock Pick Workflow

This workflow automatically corrects bad daily stock picks. It runs a script to check if the current pick is a valid US equity with trading volume, and if not, it automatically finds a replacement and updates the Firestore database.

## Steps

1. Run the fixing script:
// turbo
```bash
cd backend
python fix_stock_pick.py
```

2. Confirm the output. If the script outputs "Successfully updated", the database now reflects a valid equity.
3. Validate locally if desired by checking Yahoo Finance or Tiingo for the new ticker.
