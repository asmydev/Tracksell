# Tracksell
A tool for reseller to track their sells and inventory.

## Nouveautés (v7)
- Une facture peut contenir **plusieurs produits** (lignes de facture).
- Le **prix de vente est optionnel** à l'enregistrement : il peut être défini
  plus tard depuis la vue Détail, ou saisi directement au moment de la vente.
- Stock, ventes, gains et chiffre d'affaires sont suivis **par produit** puis
  agrégés au niveau de la facture.
- Unité paramétrable par produit (sac, bidon, carton…).
- Migration automatique des données existantes (une sauvegarde de l'ancien
  format est conservée dans la clé `rt_invoices_backup_v1`).
